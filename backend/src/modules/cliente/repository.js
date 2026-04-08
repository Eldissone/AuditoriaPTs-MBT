const prisma = require('../../database/client');

class ClienteRepository {
  async getAll(filters = {}) {
    const { search, municipio, localidade, id_subestacao, estado_operacional, page, limit } = filters;
    const where = {};
    
    if (id_subestacao) {
      where.id_subestacao = Number(id_subestacao);
    }
    
    if (estado_operacional) {
      where.estado_operacional = estado_operacional;
    }
 
    if (municipio) {
      where.municipio = municipio;
    }
 
    if (localidade) {
      where.OR = [
        { municipio: localidade },
        { subestacao: { municipio: localidade } },
      ];
    }
 
    if (search) {
      const searchWhere = {
        OR: [
          { id_pt: { contains: search, mode: 'insensitive' } },
          { proprietario: { contains: search, mode: 'insensitive' } },
          { conta_contrato: { contains: search, mode: 'insensitive' } },
          { equipamento: { contains: search, mode: 'insensitive' } },
        ]
      };
      
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchWhere
        ];
        delete where.OR;
      } else {
        Object.assign(where, searchWhere);
      }
    }
 
    const orderBy = { id_pt: 'asc' };
    const include = { subestacao: true, responsavel: true };
 
    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);
 
      const [data, total] = await Promise.all([
        prisma.cliente.findMany({ where, include, orderBy, skip, take }),
        prisma.cliente.count({ where })
      ]);
 
      return { data, total, page: Number(page), limit: Number(limit) };
    }
 
    return prisma.cliente.findMany({ where, include, orderBy });
  }
 
  async getByIdPt(id_pt) {
    return prisma.cliente.findUnique({
      where: { id_pt },
      include: {
        subestacao: true,
        responsavel: true,
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
    console.log('Criando Cliente com dados:', JSON.stringify(data, null, 2));
    const { 
      cliente, 
      conformidade, 
      transformador, 
      media_tensao, 
      baixa_tensao, 
      seguranca, 
      infraestrutura, 
      monitorizacao, 
      manutencao, 
      risco,
      ...restOfData
    } = data;
 
    const rawBaseData = cliente || restOfData;
 
    const getYear = (val) => {
      if (!val) return new Date().getFullYear();
      if (typeof val === 'number') return val;
      if (!isNaN(val) && !val.toString().includes('-')) return parseInt(val.toString());
      return new Date(val).getFullYear() || new Date().getFullYear();
    };
 
    // 1. Base Cliente mapping
    const baseCliente = {
      id_pt: rawBaseData.id_pt,
      localizacao: rawBaseData.localizacao || 'N/D',
      gps: rawBaseData.gps || '',
      morada: rawBaseData.morada || '',
      municipio: rawBaseData.municipio || 'Luanda',
      provincia: rawBaseData.provincia || 'Luanda',
      tipo_instalacao: rawBaseData.tipo_instalacao || 'Cabine',
      nivel_tensao: rawBaseData.nivel_tensao || 'MT/BT',
      fabricante: rawBaseData.fabricante || '',
      regime_exploracao: rawBaseData.regime_exploracao || 'Privado',
      estado_operacional: rawBaseData.estado_operacional || 'Operacional',
      conta_contrato: rawBaseData.conta_contrato || '',
      instalacao: rawBaseData.instalacao || '',
      equipamento: rawBaseData.equipamento || '',
      parceiro_negocios: rawBaseData.parceiro_negocios || '',
      categoria_tarifa: rawBaseData.categoria_tarifa || '',
      txt_categoria_tarifa: rawBaseData.txt_categoria_tarifa || '',
      distrito_comuna: rawBaseData.distrito_comuna || '',
      bairro: rawBaseData.bairro || '',
      id_subestacao: parseInt(rawBaseData.id_subestacao),
      id_responsavel: rawBaseData.id_responsavel ? Number(rawBaseData.id_responsavel) : null,
      potencia_kva: parseFloat(rawBaseData.potencia_kva) || 0,
      num_transformadores: Number(rawBaseData.num_transformadores || rawBaseData.num_transformador || 1),
      ano_instalacao: getYear(rawBaseData.ano_instalacao),
    };
 
    // Explicit validaton before Prisma
    if (!baseCliente.id_pt || baseCliente.id_pt.trim() === '') {
      throw new Error('O ID do PT/Cliente é obrigatório.');
    }
 
    if (isNaN(baseCliente.id_subestacao)) {
      throw new Error(`ID de subestação inválido: ${rawBaseData.id_subestacao}`);
    }
 
    const subExists = await prisma.subestacao.findUnique({ where: { id: baseCliente.id_subestacao } });
    if (!subExists) {
      throw new Error(`A subestação com ID ${baseCliente.id_subestacao} não existe.`);
    }
 
    const existingPT = await prisma.cliente.findUnique({ where: { id_pt: baseCliente.id_pt } });
    if (existingPT) {
      throw new Error(`O Cliente/PT "${baseCliente.id_pt}" já está cadastrado.`);
    }
 
    // 2. Conformidade mapping
    const conformidadeData = conformidade ? {
      licenciamento: !!conformidade.licenciamento,
      projeto_aprovado: !!conformidade.projeto_aprovado,
      diagramas_unifilares: !!conformidade.diagramas_unifilares,
      plano_manutencao: !!conformidade.plano_manutencao,
      normas_iec: !!(conformidade.normas_iec || conformidade.normas_iec_ieee),
      normas_ieee: !!(conformidade.normas_ieee || conformidade.normas_iec_ieee),
      normas_locais: !!conformidade.normas_locais,
    } : undefined;
 
    // 3. Transformador mapping (Array)
    const transformadoresArr = transformador ? (Array.isArray(transformador) ? transformador : [transformador]).map(t => ({
      num_transformador: Number(t.num_transformador || 1),
      potencia_kva: parseFloat(t.potencia_kva || t.potencia_nominal || 0) || 0,
      tensao_primaria: parseFloat(t.tensao_primaria) || 30,
      tensao_secundaria: parseFloat(t.tensao_secundaria) || 0.4,
      tipo_isolamento: t.tipo_isolamento || t.tipo_oleo || 'Mineral',
      estado_oleo: t.estado_oleo || 'Bom',
      fugas: !!t.fugas,
      estado_buchas: t.estado_buchas || 'Bom',
      temperatura_operacao: parseFloat(t.temperatura_operacao || t.temperatura_topo || 40) || 40,
    })) : undefined;
 
    // 4. MT/BT mapping
    const mtData = media_tensao ? {
      tipo_celas: media_tensao.tipo_celas || '',
      estado_disjuntores: media_tensao.estado_disjuntores || '',
      estado_seccionadores: media_tensao.estado_seccionadores || '',
      reles_protecao: media_tensao.reles_protecao || '',
      coordenacao_protecoes: !!media_tensao.coordenacao_protecoes,
      aterramento_mt: !!media_tensao.aterramento_mt,
    } : undefined;
 
    const btData = baixa_tensao ? {
      estado_qgbt: baixa_tensao.estado_qgbt || '',
      barramentos: baixa_tensao.barramentos || '',
      disjuntores: baixa_tensao.disjuntores || '',
      balanceamento_cargas: !!baixa_tensao.balanceamento_cargas,
      corrente_fase_a: parseFloat(baixa_tensao.corrente_fase_a) || 0,
      corrente_fase_b: parseFloat(baixa_tensao.corrente_fase_b) || 0,
      corrente_fase_c: parseFloat(baixa_tensao.corrente_fase_c) || 0,
      tensao: parseFloat(baixa_tensao.tensao) || 0,
      fator_potencia: parseFloat(baixa_tensao.fator_potencia) || 0,
    } : undefined;
 
    // 5. Seguranca, Infra, Monitor, Manutencao mapping
    const segurancaData = seguranca ? {
      resistencia_terra: parseFloat(seguranca.resistencia_terra) || 0,
      protecao_raios: !!seguranca.protecao_raios,
      spd: !!seguranca.spd,
      sinalizacao: !!seguranca.sinalizacao,
      combate_incendio: !!seguranca.combate_incendio,
      distancias_seguranca: !!seguranca.distancias_seguranca,
    } : undefined;
 
    const infraData = infraestrutura ? {
      estado_cabine: infraestrutura.estado_cabine || '',
      ventilacao: !!infraestrutura.ventilacao,
      drenagem: !!infraestrutura.drenagem,
      iluminacao: !!infraestrutura.iluminacao,
      controlo_acesso: !!infraestrutura.controlo_acesso,
    } : undefined;
 
    const monitorData = monitorizacao ? {
      scada: !!monitorizacao.scada,
      comunicacao: monitorizacao.comunicacao || '',
      sensores_temperatura: !!monitorizacao.sensores_temperatura,
      sensores_corrente: !!monitorizacao.sensores_corrente,
      sensores_vibracao: !!monitorizacao.sensores_vibracao,
      observacoes: monitorizacao.estado_modem || monitorizacao.protocolo ? `Modem: ${monitorizacao.estado_modem || 'N/D'}, Protocolo: ${monitorizacao.protocolo || 'N/D'}` : undefined
    } : undefined;
 
    const manutData = manutencao ? {
      plano_preventivo: !!manutencao.aperto_terminais,
      observacoes: `Última limpeza: ${manutencao.ultima_limpeza || 'N/D'}, Termográfica: ${manutencao.inspecao_termografica || 'N/D'}`
    } : undefined;
 
    const riscosMapped = risco ? (Array.isArray(risco) ? risco : [risco]).map(r => ({
      sobrecarga: !!r.sobrecarga,
      desequilibrio_fases: !!r.desequilibrio_fases,
      falhas_isolamento: !!r.falhas_isolamento,
      redundancia: !!r.redundancia,
      nivel_risco_geral: r.nivel_risco_geral || 'Nulo',
      observacoes: r.recomendacoes || r.observacoes || ''
    })) : undefined;
 
    return prisma.cliente.create({
      data: {
        ...baseCliente,
        conformidade: conformidadeData ? { create: conformidadeData } : undefined,
        media_tensao: mtData ? { create: mtData } : undefined,
        baixa_tensao: btData ? { create: btData } : undefined,
        seguranca: segurancaData ? { create: segurancaData } : undefined,
        infraestrutura: infraData ? { create: infraData } : undefined,
        monitorizacao: monitorData ? { create: monitorData } : undefined,
        manutencao: manutData ? { create: manutData } : undefined,
        transformadores: transformadoresArr ? { create: transformadoresArr } : undefined,
        riscos: riscosMapped ? { create: riscosMapped } : undefined
      }
    });
  }
 
  async update(id_pt, data) {
    const { 
      cliente, 
      conformidade, 
      transformador, 
      media_tensao, 
      baixa_tensao, 
      seguranca, 
      infraestrutura, 
      monitorizacao, 
      manutencao, 
      risco,
      ...restOfData
    } = data;
 
    const rawBaseData = cliente || restOfData;
 
    // Same mapping logic for update
    const baseCliente = {
      localizacao: rawBaseData.localizacao,
      gps: rawBaseData.gps,
      morada: rawBaseData.morada,
      municipio: rawBaseData.municipio,
      provincia: rawBaseData.provincia,
      tipo_instalacao: rawBaseData.tipo_instalacao,
      nivel_tensao: rawBaseData.nivel_tensao,
      fabricante: rawBaseData.fabricante,
      regime_exploracao: rawBaseData.regime_exploracao,
      estado_operacional: rawBaseData.estado_operacional,
      conta_contrato: rawBaseData.conta_contrato,
      instalacao: rawBaseData.instalacao,
      equipamento: rawBaseData.equipamento,
      parceiro_negocios: rawBaseData.parceiro_negocios,
      categoria_tarifa: rawBaseData.categoria_tarifa,
      txt_categoria_tarifa: rawBaseData.txt_categoria_tarifa,
      distrito_comuna: rawBaseData.distrito_comuna,
      bairro: rawBaseData.bairro,
    };
 
    if (rawBaseData.id_subestacao !== undefined) baseCliente.id_subestacao = Number(rawBaseData.id_subestacao);
    if (rawBaseData.id_responsavel !== undefined) baseCliente.id_responsavel = rawBaseData.id_responsavel ? Number(rawBaseData.id_responsavel) : null;
    if (rawBaseData.potencia_kva !== undefined) baseCliente.potencia_kva = parseFloat(rawBaseData.potencia_kva) || 0;
    if (rawBaseData.num_transformadores !== undefined || rawBaseData.num_transformador !== undefined) {
      baseCliente.num_transformadores = Number(rawBaseData.num_transformadores || rawBaseData.num_transformador || 1);
    }
    if (rawBaseData.ano_instalacao !== undefined) {
      baseCliente.ano_instalacao = rawBaseData.ano_instalacao ? new Date(rawBaseData.ano_instalacao).getFullYear() : new Date().getFullYear();
    }
 
    const conformidadeData = conformidade ? {
      licenciamento: !!conformidade.licenciamento,
      projeto_aprovado: !!conformidade.projeto_aprovado,
      diagramas_unifilares: !!conformidade.diagramas_unifilares,
      plano_manutencao: !!conformidade.plano_manutencao,
      normas_iec: !!(conformidade.normas_iec || conformidade.normas_iec_ieee),
      normas_ieee: !!(conformidade.normas_ieee || conformidade.normas_iec_ieee),
      normas_locais: !!conformidade.normas_locais,
    } : undefined;
 
    const transformadoresArr = transformador ? (Array.isArray(transformador) ? transformador : [transformador]).map(t => ({
      num_transformador: Number(t.num_transformador || 1),
      potencia_kva: parseFloat(t.potencia_kva || t.potencia_nominal || 0) || 0,
      tensao_primaria: parseFloat(t.tensao_primaria) || 30,
      tensao_secundaria: parseFloat(t.tensao_secundaria) || 0.4,
      tipo_isolamento: t.tipo_isolamento || t.tipo_oleo || 'Mineral',
      estado_oleo: t.estado_oleo || 'Bom',
      fugas: !!t.fugas,
      estado_buchas: t.estado_buchas || 'Bom',
      temperatura_operacao: parseFloat(t.temperatura_operacao || t.temperatura_topo || 40) || 40
    })) : undefined;
 
    const mtData = media_tensao ? {
      tipo_celas: media_tensao.tipo_celas || '',
      estado_disjuntores: media_tensao.estado_disjuntores || '',
      estado_seccionadores: media_tensao.estado_seccionadores || '',
      reles_protecao: media_tensao.reles_protecao || '',
      coordenacao_protecoes: !!media_tensao.coordenacao_protecoes,
      aterramento_mt: !!media_tensao.aterramento_mt,
    } : undefined;
 
    const btData = baixa_tensao ? {
      estado_qgbt: baixa_tensao.estado_qgbt || '',
      barramentos: baixa_tensao.barramentos || '',
      disjuntores: baixa_tensao.disjuntores || '',
      balanceamento_cargas: !!baixa_tensao.balanceamento_cargas,
      corrente_fase_a: parseFloat(baixa_tensao.corrente_fase_a) || 0,
      corrente_fase_b: parseFloat(baixa_tensao.corrente_fase_b) || 0,
      corrente_fase_c: parseFloat(baixa_tensao.corrente_fase_c) || 0,
      tensao: parseFloat(baixa_tensao.tensao) || 0,
      fator_potencia: parseFloat(baixa_tensao.fator_potencia) || 0,
    } : undefined;
 
    const segurancaData = seguranca ? {
      resistencia_terra: parseFloat(seguranca.resistencia_terra) || 0,
      protecao_raios: !!seguranca.protecao_raios,
      spd: !!seguranca.spd,
      sinalizacao: !!seguranca.sinalizacao,
      combate_incendio: !!seguranca.combate_incendio,
      distancias_seguranca: !!seguranca.distancias_seguranca,
    } : undefined;
 
    const infraData = infraestrutura ? {
      estado_cabine: infraestrutura.estado_cabine || 'Bom',
      ventilacao: !!infraestrutura.ventilacao,
      drenagem: !!infraestrutura.drenagem,
      iluminacao: !!infraestrutura.iluminacao,
      controlo_acesso: !!infraestrutura.controlo_acesso,
    } : undefined;
 
    const monitorData = monitorizacao ? {
      scada: !!monitorizacao.scada,
      comunicacao: monitorizacao.comunicacao || '',
      sensores_temperatura: !!monitorizacao.sensores_temperatura,
      sensores_corrente: !!monitorizacao.sensores_corrente,
      sensores_vibracao: !!monitorizacao.sensores_vibracao,
      observacoes: monitorizacao.estado_modem || monitorizacao.protocolo ? `Modem: ${monitorizacao.estado_modem || 'N/D'}, Protocolo: ${monitorizacao.protocolo || 'N/D'}` : undefined
    } : undefined;
 
    const manutData = manutencao ? {
      plano_preventivo: !!manutencao.aperto_terminais,
      observacoes: `Última limpeza: ${manutencao.ultima_limpeza || 'N/D'}, Termográfica: ${manutencao.inspecao_termografica || 'N/D'}`
    } : undefined;
 
    const riscosMapped = risco ? (Array.isArray(risco) ? risco : [risco]).map(r => ({
      sobrecarga: !!r.sobrecarga,
      desequilibrio_fases: !!r.desequilibrio_fases,
      falhas_isolamento: !!r.falhas_isolamento,
      redundancia: !!r.redundancia,
      nivel_risco_geral: r.nivel_risco_geral || 'Nulo',
      observacoes: r.recomendacoes || r.observacoes || ''
    })) : undefined;
 
    return prisma.cliente.update({
      where: { id_pt },
      data: {
        ...baseCliente,
        conformidade: conformidadeData ? { upsert: { create: conformidadeData, update: conformidadeData } } : undefined,
        media_tensao: mtData ? { upsert: { create: mtData, update: mtData } } : undefined,
        baixa_tensao: btData ? { upsert: { create: btData, update: btData } } : undefined,
        seguranca: segurancaData ? { upsert: { create: segurancaData, update: segurancaData } } : undefined,
        infraestrutura: infraData ? { upsert: { create: infraData, update: infraData } } : undefined,
        monitorizacao: monitorData ? { upsert: { create: monitorData, update: monitorData } } : undefined,
        manutencao: manutData ? { upsert: { create: manutData, update: manutData } } : undefined,
        transformadores: transformadoresArr ? {
          deleteMany: {},
          create: transformadoresArr
        } : undefined,
        riscos: riscosMapped ? {
          deleteMany: {},
          create: riscosMapped
        } : undefined
      }
    });
  }
 
  async delete(id_pt) {
    return prisma.cliente.delete({
      where: { id_pt },
    });
  }
}
 
module.exports = new ClienteRepository();
