const repository = require('./repository');
const { getGpsForMunicipio } = require('../../utils/angolaGps');

class SubestacaoService {
  async listAll(filters = {}) {
    return repository.getAll(filters);
  }

  async getDetails(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new Error('ID inválido.');

    const sub = await repository.getById(numericId);
    if (!sub) throw new Error('Subestação não encontrada.');
    return sub;
  }

  async createSubestacao(data) {
    // Business logic like code validation could go here
    return repository.create(data);
  }

  async updateSubestacao(id, data) {
    return repository.update(Number(id), data);
  }

  async deleteSubestacao(id) {
    return repository.delete(Number(id));
  }

  async bulkImport(dataArray) {
    if (!Array.isArray(dataArray)) throw new Error('Dados inválidos para importação.');

    const prisma = require('../../database/client');
    const results = { subestacoes: 0, pts: 0, skipped: 0, errors: [] };

    // ── Preflight: carregar todos os IDs já existentes (1 query cada) ──────────
    const [existingSubs, existingPts] = await Promise.all([
      prisma.subestacao.findMany({ select: { codigo: true, id: true } }),
      prisma.identificacao.findMany({ select: { id_pt: true } }),
    ]);

    // Sets para O(1) lookup durante o loop
    const subCodigoMap = new Map(existingSubs.map(s => [s.codigo, s.id])); // codigo → id
    const ptIdSet      = new Set(existingPts.map(p => p.id_pt));

    // ── Derivar chave estável de uma linha ────────────────────────────────────
    // Ordem de prioridade: equipamento → conta_contrato → instalacao
    // Se nenhum disponível → sem chave estável → não podemos garantir dedup → saltar
    const deriveStableKey = (item) => {
      const eq = item.equipamento   ? String(item.equipamento).trim()   : null;
      const ct = item.conta_contrato? String(item.conta_contrato).trim(): null;
      const in_= item.instalacao    ? String(item.instalacao).trim()    : null;
      return eq || ct || in_ || null;
    };

    for (let index = 0; index < dataArray.length; index++) {
      const item = dataArray[index];
      try {
        const stableKey = deriveStableKey(item);

        // Sem chave estável → não conseguimos deduplicar → saltar com aviso
        if (!stableKey) {
          results.skipped++;
          results.errors.push(
            `Linha ${index + 1}: ignorada — sem identificador único (equipamento, conta ou instalação em falta).`
          );
          continue;
        }

        // PT já existe → saltar completamente
        if (ptIdSet.has(stableKey)) {
          results.skipped++;
          continue;
        }

        // ── 1. Subestação: reutilizar existente ou criar nova ───────────────
        let subestacaoId = subCodigoMap.get(stableKey);

        if (!subestacaoId) {
          const seData = {
            codigo:              stableKey,
            nome:                item.municipio ? String(item.municipio) : 'Município N/D',
            proprietario:        String(item.proprietario || item.parceiro_negocios || 'PT Sem Nome'),
            localizacao:         String(item.localizacao || item.municipio || 'N/A'),
            municipio:           item.municipio      ? String(item.municipio)      : null,
            bairro:              item.bairro          ? String(item.bairro)         : null,
            distrito_comuna:     item.distrito_comuna ? String(item.distrito_comuna): null,
            conta_contrato:      item.conta_contrato  ? String(item.conta_contrato) : null,
            instalacao:          item.instalacao       ? String(item.instalacao)     : null,
            equipamento:         item.equipamento      ? String(item.equipamento)    : null,
            parceiro_negocios:   item.parceiro_negocios? String(item.parceiro_negocios): null,
            categoria_tarifa:    item.categoria_tarifa ? String(item.categoria_tarifa): null,
            txt_categoria_tarifa:item.txt_categoria_tarifa ? String(item.txt_categoria_tarifa): null,
            potencia_total_kva:  parseFloat(item.potencia_total_kva || item.potencia_kva) || 0,
            estado:              'Ativa',
            gps:                 item.gps || getGpsForMunicipio(item.municipio) || null,
          };

          const nova = await prisma.subestacao.create({ data: seData });
          subestacaoId = nova.id;
          subCodigoMap.set(stableKey, subestacaoId); // atualizar cache local
          results.subestacoes++;
        }

        // ── 2. PT (Identificação) ───────────────────────────────────────────
        await prisma.identificacao.create({
          data: {
            id_pt:               stableKey,
            id_subestacao:       subestacaoId,
            localizacao:         String(item.localizacao || item.municipio || 'N/A'),
            municipio:           item.municipio      ? String(item.municipio)      : null,
            bairro:              item.bairro          ? String(item.bairro)         : null,
            distrito_comuna:     item.distrito_comuna ? String(item.distrito_comuna): null,
            tipo_instalacao:     'Posto de Transformação',
            nivel_tensao:        'MT/BT',
            potencia_kva:        parseFloat(item.potencia_kva || item.potencia_total_kva) || 0,
            ano_instalacao:      new Date().getFullYear(),
            estado_operacional:  'Operacional',
            conta_contrato:      item.conta_contrato  ? String(item.conta_contrato) : null,
            instalacao:          item.instalacao       ? String(item.instalacao)     : null,
            equipamento:         item.equipamento      ? String(item.equipamento)    : null,
            parceiro_negocios:   item.parceiro_negocios? String(item.parceiro_negocios): null,
            categoria_tarifa:    item.categoria_tarifa ? String(item.categoria_tarifa): null,
            txt_categoria_tarifa:item.txt_categoria_tarifa ? String(item.txt_categoria_tarifa): null,
            gps:                 item.gps || getGpsForMunicipio(item.municipio) || null,
          },
        });

        ptIdSet.add(stableKey); // atualizar cache local para dedup dentro da mesma importação
        results.pts++;

      } catch (err) {
        results.errors.push(`Linha ${index + 1}: ${err.message}`);
      }
    }

    return results;
  }

  async getFiltersMetadata() {
    return repository.getMetadata();
  }
}

module.exports = new SubestacaoService();
