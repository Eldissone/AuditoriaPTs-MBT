const prisma = require('../../database/client');

class ClienteRepository {
  // O repositório "Cliente" agora foca no Posto de Transformação (Entidade Técnica)
  // Mas mantém o nome para não quebrar referências internas imediatas
  
  async getAll(filters = {}) {
    const { search, municipio, localidade, id_subestacao, estado_operacional, nivel_tensao, page, limit, id_proprietario } = filters;
    const where = { AND: [] };

    if (id_subestacao) {
      where.AND.push({ id_subestacao: Number(id_subestacao) });
    }

    if (id_proprietario) {
      where.AND.push({ id_proprietario: Number(id_proprietario) });
    }

    if (estado_operacional) {
      where.AND.push({ estado_operacional: { equals: estado_operacional, mode: 'insensitive' } });
    }

    if (municipio) {
      where.AND.push({ municipio: { equals: municipio, mode: 'insensitive' } });
    }

    if (nivel_tensao) {
      where.AND.push({ nivel_tensao: { equals: nivel_tensao, mode: 'insensitive' } });
    }

    if (localidade) {
      where.AND.push({
        OR: [
          { municipio: localidade },
          { subestacao: { municipio: localidade } },
        ]
      });
    }

    if (search) {
      where.AND.push({
        OR: [
          { id_pt: { contains: search, mode: 'insensitive' } },
          { proprietario: { nome: { contains: search, mode: 'insensitive' } } },
          { proprietario: { conta_contrato: { contains: search, mode: 'insensitive' } } },
        ]
      });
    }

    if (where.AND.length === 0) delete where.AND;

    const orderBy = { id_pt: 'asc' };
    const include = { 
      subestacao: true, 
      responsavel: true,
      proprietario: true // Inclui os dados comerciais do novo modelo
    };

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [data, total] = await Promise.all([
        prisma.postoTransformacao.findMany({ where, include, orderBy, skip, take }),
        prisma.postoTransformacao.count({ where })
      ]);

      return { data, total, page: Number(page), limit: Number(limit) };
    }

    return prisma.postoTransformacao.findMany({ where, include, orderBy });
  }

  async getByIdPt(id_pt) {
    return prisma.postoTransformacao.findUnique({
      where: { id_pt },
      include: {
        subestacao: true,
        responsavel: true,
        proprietario: true, // Novo Relacionamento
        conformidade: true,
        transformadores: true,
        media_tensao: true,
        baixa_tensao: true,
        seguranca: true,
        infraestrutura: true,
        monitorizacao: true,
        manutencao: true,
        riscos: true,
        inspecoes: {
          orderBy: { data_inspecao: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(data) {
    const {
      conformidade,
      transformador,
      media_tensao,
      baixa_tensao,
      seguranca,
      infraestrutura,
      monitorizacao,
      manutencao,
      risco,
      identificacao,
      id_proprietario: rootProprietario,
      ...restOfData
    } = data;

    const raw = identificacao || restOfData;
    // id_proprietario pode vir dentro de identificacao (form) ou no nível raiz
    const id_proprietario = raw.id_proprietario ?? rootProprietario ?? null;

    const basePT = {
      id_pt: raw.id_pt,
      id_subestacao: parseInt(raw.id_subestacao),
      id_proprietario: id_proprietario ? Number(id_proprietario) : null,
      localizacao: raw.localizacao || 'N/D',
      gps: raw.gps || null,
      potencia_kva: parseFloat(raw.potencia_kva) || 0,
      ano_instalacao: raw.ano_instalacao ? new Date(raw.ano_instalacao).getFullYear() : new Date().getFullYear(),
      tipo_instalacao: raw.tipo_instalacao || 'Cabine',
      nivel_tensao: raw.nivel_tensao || 'MT/BT',
      num_transformadores: Number(raw.num_transformadores || 1),
      estado_operacional: raw.estado_operacional || 'Operacional',
      municipio: raw.municipio || null,
      provincia: raw.provincia || null,
      bairro: raw.bairro || null,
      distrito_comuna: raw.distrito_comuna || null,
      rua: raw.rua || null,
      instalacao: raw.instalacao || null,
      equipamento: raw.equipamento || null,
      num_serie: raw.num_serie || null,
      divisao: raw.divisao || null,
      denominacao_divisao: raw.denominacao_divisao || null,
      unidade_leitura: raw.unidade_leitura || null,
      num_localidade: raw.num_localidade || null,
      bairro_num: raw.bairro_num || null,
      contrato: raw.contrato || null,
      fabricante: raw.fabricante || null,
      regime_exploracao: raw.regime_exploracao || null,
    };

    return prisma.postoTransformacao.create({
      data: {
        ...basePT,
        conformidade: conformidade ? { create: conformidade } : undefined,
        transformadores: transformador ? { createMany: { data: Array.isArray(transformador) ? transformador : [transformador] } } : undefined,
      },
      include: { subestacao: true, proprietario: true }
    });
  }

  async update(id_pt, data) {
    // Extrair os campos da identificação (podem vir dentro de data.identificacao ou no nível raiz)
    const raw = data.identificacao || data;
    const id_proprietario = raw.id_proprietario ?? data.id_proprietario;

    // Lista branca de campos escalares do modelo PostoTransformacao
    const ALLOWED = [
      'id_subestacao', 'id_responsavel',
      'localizacao', 'gps', 'latitude', 'longitude', 'morada',
      'municipio', 'provincia', 'tipo_instalacao', 'nivel_tensao',
      'potencia_kva', 'ano_instalacao', 'fabricante', 'num_transformadores',
      'regime_exploracao', 'estado_operacional',
      'instalacao', 'equipamento', 'distrito_comuna', 'bairro', 'contrato',
      'num_serie', 'divisao', 'denominacao_divisao', 'unidade_leitura',
      'num_localidade', 'bairro_num', 'rua',
      'responsavel_tecnico_cliente', 'contacto_resp_tecnico',
      'canal_faturacao', 'fornece_terceiros', 'empresa_manutencao',
      'data_ultima_manutencao',
      // Campos legados de compatibilidade (que ainda existem na tabela PT)
      'proprietario', 'concessionaria', 'zona', 'operador',
    ];

    const updateData = {};
    for (const key of ALLOWED) {
      if (raw[key] !== undefined) {
        let val = raw[key];
        if (key === 'id_subestacao' || key === 'id_responsavel' || key === 'num_transformadores') {
          val = val !== null && val !== '' ? Number(val) : undefined;
        } else if (key === 'potencia_kva' || key === 'latitude' || key === 'longitude') {
          val = val !== null && val !== '' ? parseFloat(val) : null;
        } else if (key === 'ano_instalacao') {
          val = val ? new Date(val).getFullYear() : undefined;
        } else if (key === 'data_ultima_manutencao') {
          val = val ? new Date(val) : null;
        } else if (key === 'fornece_terceiros') {
          val = Boolean(val);
        }
        if (val !== undefined) updateData[key] = val;
      }
    }

    if (id_proprietario !== undefined && id_proprietario !== '') {
      updateData.id_proprietario = Number(id_proprietario);
    } else if (id_proprietario === '' || id_proprietario === null) {
      updateData.id_proprietario = null;
    }

    return prisma.postoTransformacao.update({
      where: { id_pt },
      data: updateData,
      include: { subestacao: true, proprietario: true }
    });
  }

  async delete(id_pt) {
    return prisma.postoTransformacao.delete({
      where: { id_pt },
    });
  }
}

module.exports = new ClienteRepository();
