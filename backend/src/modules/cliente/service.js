const repository = require('./repository');

class IdentificacaoService {
  async listAll(filters) {
    return repository.getAll(filters);
  }

  async getDetails(id_pt) {
    const pt = await repository.getByIdPt(id_pt);
    if (!pt) throw new Error('Posto de Transformação não encontrado.');
    return pt;
  }

  async createPT(data) {
    return repository.create(data);
  }

  async updatePT(id_pt, data) {
    return repository.update(id_pt, data);
  }

  async deletePT(id_pt) {
    return repository.delete(id_pt);
  }

  async transferirPTs(id_pts, id_subestacao_destino) {
    if (!Array.isArray(id_pts) || id_pts.length === 0) {
      throw new Error('Lista de PTs inválida ou vazia.');
    }

    const prisma = require('../../database/client');
    const subDestino = parseInt(id_subestacao_destino);
    if (isNaN(subDestino)) throw new Error('ID de subestação de destino inválido.');

    const subExists = await prisma.subestacao.findUnique({ where: { id: subDestino } });
    if (!subExists) throw new Error(`Subestação de destino (ID ${subDestino}) não encontrada.`);

    const result = await prisma.cliente.updateMany({
      where: { id_pt: { in: id_pts } },
      data: { id_subestacao: subDestino },
    });

    return {
      transferidos: result.count,
      subestacao_destino: subExists.nome,
    };
  }

  async bulkImport(dataArray) {
    if (!Array.isArray(dataArray)) throw new Error('Dados inválidos para importação.');

    const prisma = require('../../database/client');
    const { getGpsForMunicipio, parseGps, calcularDistanciaHaversine } = require('../../utils/angolaGps');
    const results = { pts: 0, updated: 0, skipped: 0, errors: [] };

    // ── 1. Garantir existência da Subestação Geral ───────────────────────────
    let generalSub = await prisma.subestacao.findUnique({ where: { codigo_operacional: 'GERAL' } });
    if (!generalSub) {
      generalSub = await prisma.subestacao.create({
        data: {
          nome: 'Subestação Geral (Padrão)',
          codigo_operacional: 'GERAL',
          tipo: 'Distribuição',
          status: 'Ativa',
          municipio: 'Diversos',
          tensao_kv_entrada: 260,
          tensao_kv_saida: 150,
          capacidade_total_mva: 200
        }
      });
    }

    // ── 2. Preflight: carregar substações e IDs de PTs existentes
    const [allSubs, existingPts] = await Promise.all([
      prisma.subestacao.findMany({
        where: { status: 'Ativa' },
        select: { id: true, nome: true, municipio: true, latitude: true, longitude: true, gps: true }
      }),
      prisma.cliente.findMany({ select: { id_pt: true } }),
    ]);

    // Cache de subestações com coordenadas para busca espacial rápida
    const subCoordsCache = allSubs
      .map(s => {
        let coords = null;
        if (s.latitude && s.longitude) {
          coords = { lat: s.latitude, lng: s.longitude };
        } else if (s.gps) {
          coords = parseGps(s.gps);
        }
        return { ...s, coords };
      })
      .filter(s => s.coords);

    const municipioToSubId = new Map();
    allSubs.forEach(s => {
      if (s.municipio && !municipioToSubId.has(s.municipio.toLowerCase())) {
        municipioToSubId.set(s.municipio.toLowerCase(), s.id);
      }
    });

    const ptIdSet = new Set(existingPts.map(p => p.id_pt));

    const deriveStableKey = (item) => {
      const eq = item.Equipamento || item.equipamento || '';
      const ct = item['Conta de contrato'] || item.conta_contrato || '';
      const in_ = item['Instalação'] || item.instalacao || '';
      return String(eq || ct || in_).trim() || null;
    };

    /**
     * Algoritmo Otimizado de Proximidade (Bounding Box + Haversine)
     */
    const findNearestSubstation = (clientLat, clientLng) => {
      const BOUNDING_BOX_DELTA = 0.3; // Aprox. 33km
      const MAX_RADIUS_KM = 30;

      let closest = null;
      let minDistance = Infinity;

      // 1. Filtragem rápida por Bounding Box (O(M))
      const candidates = subCoordsCache.filter(sub =>
        Math.abs(sub.coords.lat - clientLat) <= BOUNDING_BOX_DELTA &&
        Math.abs(sub.coords.lng - clientLng) <= BOUNDING_BOX_DELTA
      );

      // 2. Cálculo preciso apenas nos candidatos filtrados
      for (const sub of candidates) {
        const dist = calcularDistanciaHaversine(clientLat, clientLng, sub.coords.lat, sub.coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = sub;
        }
      }

      return minDistance <= MAX_RADIUS_KM ? closest : null;
    };

    const CHUNK_SIZE = 100;

    // Utility to filter out empty/null values for incremental update
    const cleanPayload = (data) => {
      const cleaned = {};
      Object.keys(data).forEach(key => {
        const val = data[key];
        // Only keep values that are not empty, null, or generic defaults
        if (val !== undefined && val !== null && val !== '' && val !== 'N/D' && val !== 'N/A') {
          cleaned[key] = val;
        }
      });
      return cleaned;
    };

    for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
      const chunk = dataArray.slice(i, i + CHUNK_SIZE);
      const chunkIds = chunk.map(item => deriveStableKey(item)).filter(Boolean);

      // ── 3. Pre-fetch full records for comparison in this chunk ─────────────
      const existingRecordsData = await prisma.cliente.findMany({
        where: { id_pt: { in: chunkIds } }
      });
      const recordMap = new Map(existingRecordsData.map(r => [r.id_pt, r]));

      await Promise.all(chunk.map(async (item, chunkIdx) => {
        const absoluteIdx = i + chunkIdx;
        try {
          const stableKey = deriveStableKey(item);

          if (!stableKey) {
            results.skipped++;
            results.errors.push(`Linha ${absoluteIdx + 1}: ignorada — sem identificador único.`);
            return;
          }

          // ── Determinação da Subestação com Hierarquia de Inteligência ────
          const clientGpsStr = item['GEO REFERENCIA'] || item.gps;
          const clientLocalidade = (item['Distrito/Comuna'] || item.distrito_comuna || item['Bairro'] || item.bairro || '').trim();
          const clientMunicipioName = (item['Município'] || item.municipio || '').trim();
          
          let subestacaoId = null;

          // HIERARQUIA 1: Proximidade Geoespacial (Haversine)
          const clientCoords = parseGps(clientGpsStr || getGpsForMunicipio(clientMunicipioName));
          if (clientCoords) {
            const nearest = findNearestSubstation(clientCoords.lat, clientCoords.lng);
            if (nearest) subestacaoId = nearest.id;
          }

          // HIERARQUIA 2: Match Administrativo (Comuna/Distrito -> Nome da SE)
          if (!subestacaoId && clientLocalidade) {
            const localidadeLower = clientLocalidade.toLowerCase();
            const matchedSub = allSubs.find(s => 
              s.nome.toLowerCase().includes(localidadeLower) || 
              localidadeLower.includes(s.nome.toLowerCase())
            );
            if (matchedSub) subestacaoId = matchedSub.id;
          }

          // HIERARQUIA 3: Fallback por Município (Inteligente)
          if (!subestacaoId) {
            let refinedMunicipio = clientMunicipioName.toLowerCase();
            if (refinedMunicipio === 'luanda' && clientLocalidade) {
              const possibleMunicipio = getMunicipioByLocalidade(clientLocalidade);
              if (possibleMunicipio) refinedMunicipio = possibleMunicipio;
            }
            subestacaoId = municipioToSubId.get(refinedMunicipio) || generalSub.id;
          }

          // Dados mapeados para criação/atualização
          const dataPayload = {
            id_subestacao: subestacaoId,
            proprietario: (item['Nome completo'] || item['Nome Proprietario'] || item.proprietario || 'N/D'),
            localizacao: (clientLocalidade || clientMunicipioName || 'N/A'),
            municipio: clientMunicipioName || null,
            bairro: item['Bairro'] || item.bairro ? String(item['Bairro'] || item.bairro) : null,
            distrito_comuna: item['Distrito/Comuna'] || item.distrito_comuna ? String(item['Distrito/Comuna'] || item.distrito_comuna) : null,
            tipo_instalacao: 'Posto de Transformação',
            nivel_tensao: 'MT/BT',
            potencia_kva: parseFloat(item['potência'] || item.potencia_kva || 0) || 0,
            ano_instalacao: new Date().getFullYear(),
            estado_operacional: 'Operacional',
            conta_contrato: String(item['Conta de contrato'] || item.conta_contrato || ''),
            instalacao: String(item['Instalação'] || item.instalacao || ''),
            equipamento: String(item.Equipamento || item.equipamento || ''),
            parceiro_negocios: String(item['Parceiro de negócios'] || item.parceiro_negocios || ''),
            categoria_tarifa: String(item['Categoria de tarifa'] || item.categoria_tarifa || ''),
            txt_categoria_tarifa: String(item['Txt.categoria tarifa'] || item.txt_categoria_tarifa || ''),
            gps: clientGpsStr || (clientCoords ? `${clientCoords.lat}, ${clientCoords.lng}` : null),
            contrato: String(item['Contrato'] || item.contrato || ''),
            num_serie: String(item['Nº de série'] || item.num_serie || ''),
            divisao: String(item['Divisão'] || item.divisao || ''),
            denominacao_divisao: String(item['Denominação da divisão'] || item.denominacao_divisao || ''),
            unidade_leitura: String(item['Unidade de leitura'] || item.unidade_leitura || ''),
            num_localidade: String(item['Nº da localidade'] || item.num_localidade || ''),
            bairro_num: String(item['Bairro Nº'] || item.bairro_num || ''),
            rua: String(item['Rua'] || item.rua || ''),
            tipo_cliente: String(item['Tipo de Cliente'] || item.tipo_cliente || ''),
            montante_divida: parseFloat(item['Montante Divida'] || item.montante_divida || 0) || 0,
            num_facturas_atraso: parseInt(item['Número de Facturas não pagas'] || item.num_facturas_atraso || 0) || 0,
          };

          const existingRecord = recordMap.get(stableKey);

          if (!existingRecord) {
            // ── CASO A: Novo PT (Adicionar) ──────────────────────────────────
            await prisma.cliente.create({
              data: {
                ...dataPayload,
                id_pt: stableKey
              }
            });
            results.pts++;
            ptIdSet.add(stableKey);
          } else {
            // ── CASO B: PT Existente (Merge Inteligente) ─────────────────────
            const updatePayload = cleanPayload(dataPayload);
            
            // Lógica de Comparação (Diff): se os dados forem iguais, ignora
            const hasChanges = Object.keys(updatePayload).some(key => {
              const newVal = updatePayload[key];
              const oldVal = existingRecord[key];
              
              if (newVal === null || newVal === undefined) return false;
              
              // Comparação numérica (precisa para Decimal/Float)
              if (typeof newVal === 'number' || (oldVal && typeof oldVal === 'object' && oldVal.toNumber)) {
                return Number(newVal) !== Number(oldVal);
              }
              
              return String(newVal).trim() !== String(oldVal || '').trim();
            });

            if (hasChanges) {
              await prisma.cliente.update({
                where: { id_pt: stableKey },
                data: updatePayload
              });
              results.updated++;
            } else {
              // Dados idênticos ou sem informação nova: Ignorado
              results.skipped++;
            }
          }
        } catch (err) {
          results.errors.push(`Linha ${absoluteIdx + 1}: ${err.message}`);
        }
      }));
    }

    return results;
  }
}

module.exports = new IdentificacaoService();
