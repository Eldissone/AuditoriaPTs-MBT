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
      transformadores,
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

    const tfData = transformador || transformadores;

    const raw = identificacao || restOfData;
    // id_proprietario pode vir dentro de identificacao (form) ou no nível raiz
    const id_proprietario = raw.id_proprietario ?? rootProprietario ?? null;

    const ALLOWED = [
      'id_concessionaria', 'concessao_operador', 'concelho', 'freguesia',
      'id_pt', 'id_subestacao', 'id_proprietario', 'designacao', 'localizacao', 'gps',
      'latitude', 'longitude', 'altitude', 'morada', 'municipio', 'provincia',
      'tipo_instalacao', 'nivel_tensao', 'potencia_kva', 'ano_instalacao', 'fabricante',
      'num_transformadores', 'regime_exploracao', 'estado_operacional',
      'data_levantamento', 'tecnico_levantamento', 'num_habilitacao',
      'tipo_poste', 'ref_poste', 'altura_poste', 'esforco_poste', 'esforco_poste_dan', 'material_poste', 'ano_poste', 'estado_poste',
      'equipamento_poste', 'tipo_cabine', 'dim_comprimento', 'dim_largura', 'observacoes_gerais',
      'supervisor_obra', 'tecnico_assinatura_url', 'supervisor_assinatura_url', 'data_validacao', 'validacao_status'
    ];

    const basePT = {};
    ALLOWED.forEach(key => {
      if (raw[key] !== undefined) {
        if (key === 'id_subestacao') basePT[key] = parseInt(raw[key]);
        else if (key === 'id_proprietario') basePT[key] = raw[key] ? Number(raw[key]) : null;
        else if (key === 'potencia_kva' || key === 'latitude' || key === 'longitude' || key === 'altitude' || key === 'altura_poste' || key === 'esforco_poste' || key === 'esforco_poste_dan' || key === 'dim_comprimento' || key === 'dim_largura') {
          basePT[key] = parseFloat(raw[key]) || 0;
        }
        else if (key === 'ano_instalacao' || key === 'num_transformadores' || key === 'ano_poste') {
          basePT[key] = parseInt(raw[key]) || 0;
        }
        else if (key === 'data_levantamento' || key === 'data_validacao') {
          basePT[key] = raw[key] ? new Date(raw[key]) : null;
        }
        else {
          basePT[key] = raw[key];
        }
      }
    });

    // Defaults obrigatórios para create
    if (!basePT.localizacao) basePT.localizacao = 'N/D';
    if (!basePT.tipo_instalacao) basePT.tipo_instalacao = 'Cabine';
    if (!basePT.nivel_tensao) basePT.nivel_tensao = 'MT/BT';
    if (!basePT.ano_instalacao) basePT.ano_instalacao = new Date().getFullYear();

    return prisma.postoTransformacao.create({
      data: {
        ...basePT,
        conformidade: data.conformidade ? { create: this._mapConformidade(data.conformidade) } : undefined,
        transformadores: tfData ? {
          createMany: {
            data: (Array.isArray(tfData) ? tfData : [tfData]).map(t => this._mapTransformador(t))
          }
        } : undefined,
        media_tensao: data.media_tensao ? {
          create: this._mapMediaTensao(data.media_tensao)
        } : undefined,
        baixa_tensao: data.baixa_tensao ? { create: this._mapBaixaTensao(data.baixa_tensao) } : undefined,
        seguranca: data.seguranca ? { create: this._mapSeguranca(data.seguranca) } : undefined,
        infraestrutura: data.infraestrutura ? { create: this._mapInfraestrutura(data.infraestrutura) } : undefined,
      },
      include: {
        subestacao: true,
        proprietario: true,
        transformadores: true,
        media_tensao: true,
        baixa_tensao: true,
        seguranca: true,
        infraestrutura: true,
        conformidade: true
      }
    });
  }

  // --- Helpers de Sanitização e Cast ---
  _toNum(val, fallback = null) {
    if (val === '' || val === null || val === undefined) return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }

  _clean(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const { id, id_pt, id_inspecao, criado_em, atualizado_em, pt, inspecao, ...rest } = obj;
    const cleanObj = { ...rest };
    if (id_inspecao && typeof id_inspecao === 'number') cleanObj.id_inspecao = id_inspecao;
    return cleanObj;
  }

  _toDate(val, fallback = null) {
    if (val === '' || val === null || val === undefined) return fallback;
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  }

  _mapTransformador(t) {
    const cleaned = this._clean(t);
    return {
      ...cleaned,
      id_pt: undefined,
      num_transformador: parseInt(cleaned.num_transformador) || 1,
      ano_fabrico: this._toNum(cleaned.ano_fabrico),
      potencia_kva: this._toNum(cleaned.potencia_kva, 0),
      tensao_primaria: this._toNum(cleaned.tensao_primaria, 30),
      tensao_secundaria: this._toNum(cleaned.tensao_secundaria, 0.4),
      tipo_isolamento: cleaned.tipo_isolamento || 'Óleo Mineral',
      frequencia: this._toNum(cleaned.frequencia, 50),
      ucc: this._toNum(cleaned.ucc),
      nivel_isolamento: this._toNum(cleaned.nivel_isolamento),
      temperatura_operacao: this._toNum(cleaned.temperatura_operacao),
      resistencia_isolamento: this._toNum(cleaned.resistencia_isolamento),
      ttr: this._toNum(cleaned.ttr)
    };
  }

  _mapMediaTensao(mt) {
    const { celas, ...rest } = mt;
    const cleaned = this._clean(rest);
    return {
      ...cleaned,
      celas: celas ? (Array.isArray(celas) ? celas.map(c => this._clean(c)) : celas) : undefined
    };
  }

  _mapBaixaTensao(bt) {
    const cleaned = this._clean(bt);
    return {
      ...cleaned,
      corrente_fase_a: this._toNum(cleaned.corrente_fase_a),
      corrente_fase_b: this._toNum(cleaned.corrente_fase_b),
      corrente_fase_c: this._toNum(cleaned.corrente_fase_c),
      tensao: this._toNum(cleaned.tensao, 400),
      fator_potencia: this._toNum(cleaned.fator_potencia, 0.95),
      corrente_nominal_geral: this._toNum(cleaned.corrente_nominal_geral),
      corrente_nominal_saida: this._toNum(cleaned.corrente_nominal_saida),
      num_saidas_bt: cleaned.num_saidas_bt ? parseInt(cleaned.num_saidas_bt) : null
    };
  }

  _mapSeguranca(seg) {
    const cleaned = this._clean(seg);
    return {
      ...cleaned,
      resistencia_terra: this._toNum(cleaned.resistencia_terra),
      data_ultima_medicao: this._toDate(cleaned.data_ultima_medicao)
    };
  }

  _mapInfraestrutura(infra) {
    const cleaned = this._clean(infra);
    // Filtrar apenas campos que existem no modelo Infraestrutura (Prisma)
    return {
      estado_cabine: cleaned.estado_cabine,
      ventilacao: Boolean(cleaned.ventilacao),
      drenagem: Boolean(cleaned.drenagem),
      iluminacao: Boolean(cleaned.iluminacao),
      controlo_acesso: Boolean(cleaned.controlo_acesso),
      observacoes: cleaned.observacoes
    };
  }

  _mapConformidade(conf) {
    const cleaned = this._clean(conf);
    // Filtrar apenas campos que existem no modelo Conformidade (Prisma)
    return {
      licenciamento: Boolean(cleaned.licenciamento),
      projeto_aprovado: Boolean(cleaned.projeto_aprovado),
      diagramas_unifilares: Boolean(cleaned.diagramas_unifilares),
      plano_manutencao: Boolean(cleaned.plano_manutencao),
      registos_inspecao: Boolean(cleaned.registos_inspecao),
      normas_iec: Boolean(cleaned.normas_iec),
      normas_ieee: Boolean(cleaned.normas_ieee),
      normas_locais: Boolean(cleaned.normas_locais),
      observacoes: cleaned.observacoes
    };
  }

  async update(id_pt, data) {
    // Extrair os campos da identificação (podem vir dentro de data.identificacao ou no nível raiz)
    const raw = data.identificacao || data;
    const updateData = {};
    const ALLOWED = [
      'id_concessionaria', 'concessao_operador', 'concelho', 'freguesia',
      'id_subestacao', 'id_responsavel', 'id_proprietario', 'designacao',
      'localizacao', 'gps', 'latitude', 'longitude', 'altitude', 'morada',
      'municipio', 'provincia', 'tipo_instalacao', 'nivel_tensao',
      'potencia_kva', 'ano_instalacao', 'fabricante', 'num_transformadores',
      'regime_exploracao', 'estado_operacional',
      'data_levantamento', 'tecnico_levantamento', 'num_habilitacao',
      'tipo_poste', 'ref_poste', 'altura_poste', 'esforco_poste', 'esforco_poste_dan', 'material_poste', 'ano_poste', 'estado_poste',
      'equipamento_poste', 'tipo_cabine', 'dim_comprimento', 'dim_largura', 'observacoes_gerais',
      'supervisor_obra', 'tecnico_assinatura_url', 'supervisor_assinatura_url', 'data_validacao', 'validacao_status'
    ];

    for (const key of ALLOWED) {
      if (raw[key] !== undefined) {
        let val = raw[key];
        if (['id_subestacao', 'id_responsavel', 'id_proprietario', 'num_transformadores', 'ano_poste', 'ano_instalacao'].includes(key)) {
          val = val !== null && val !== '' ? Number(val) : undefined;
        } else if (['potencia_kva', 'latitude', 'longitude', 'altitude', 'altura_poste', 'esforco_poste', 'esforco_poste_dan', 'dim_comprimento', 'dim_largura'].includes(key)) {
          val = val !== null && val !== '' ? parseFloat(val) : 0;
        } else if (['data_levantamento', 'data_ultima_manutencao', 'data_validacao'].includes(key)) {
          val = val ? new Date(val) : null;
        } else if (key === 'fornece_terceiros') {
          val = Boolean(val);
        }
        if (val !== undefined) updateData[key] = val;
      }
    }

    const tfData = data.transformador || data.transformadores;

    return prisma.postoTransformacao.update({
      where: { id_pt },
      data: {
        ...updateData,
        conformidade: data.conformidade ? { 
          upsert: { 
            create: this._mapConformidade(data.conformidade), 
            update: this._mapConformidade(data.conformidade) 
          } 
        } : undefined,
        transformadores: tfData ? {
          deleteMany: {},
          createMany: {
            data: (Array.isArray(tfData) ? tfData : [tfData]).map(t => this._mapTransformador(t))
          }
        } : undefined,
        media_tensao: data.media_tensao ? {
          upsert: {
            create: this._mapMediaTensao(data.media_tensao),
            update: this._mapMediaTensao(data.media_tensao)
          }
        } : undefined,
        baixa_tensao: data.baixa_tensao ? { 
          upsert: { 
            create: this._mapBaixaTensao(data.baixa_tensao),
            update: this._mapBaixaTensao(data.baixa_tensao)
          } 
        } : undefined,
        seguranca: data.seguranca ? { 
          upsert: { 
            create: this._mapSeguranca(data.seguranca),
            update: this._mapSeguranca(data.seguranca)
          } 
        } : undefined,
        infraestrutura: data.infraestrutura ? { 
          upsert: { 
            create: this._mapInfraestrutura(data.infraestrutura), 
            update: this._mapInfraestrutura(data.infraestrutura) 
          } 
        } : undefined,
      },
      include: {
        subestacao: true,
        proprietario: true,
        transformadores: true,
        media_tensao: true,
        baixa_tensao: true,
        seguranca: true,
        infraestrutura: true,
        conformidade: true
      }
    });
  }

  async delete(id_pt) {
    return prisma.postoTransformacao.delete({
      where: { id_pt },
    });
  }
}

module.exports = new ClienteRepository();
