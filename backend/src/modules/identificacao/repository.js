const prisma = require('../../database/client');

class IdentificacaoRepository {
  async getAll(filters = {}) {
    const where = {};
    
    if (filters.id_subestacao) {
      where.id_subestacao = Number(filters.id_subestacao);
    }
    
    if (filters.estado_operacional) {
      where.estado_operacional = filters.estado_operacional;
    }

    if (filters.municipio) {
      where.municipio = filters.municipio;
    }

    if (filters.bairro) {
      where.bairro = filters.bairro;
    }

    return prisma.identificacao.findMany({
      where,
      include: {
        subestacao: true,
        responsavel: true,
      },
      orderBy: { id_pt: 'asc' }
    });
  }

  async getByIdPt(id_pt) {
    return prisma.identificacao.findUnique({
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
    const { 
      identificacao, 
      conformidade, 
      transformador, 
      media_tensao, 
      baixa_tensao, 
      seguranca, 
      infraestrutura, 
      monitorizacao, 
      manutencao, 
      risco 
    } = data;

    // Handle the case where data is flat (standard Prisma create) or nested (frontend formData)
    const baseData = identificacao || data;

    return prisma.identificacao.create({
      data: {
        ...baseData,
        id_subestacao: Number(baseData.id_subestacao),
        potencia_kva: parseFloat(baseData.potencia_kva) || 0,
        ano_instalacao: baseData.ano_instalacao ? new Date(baseData.ano_instalacao).getFullYear() : new Date().getFullYear(),
        
        // Nested creations
        conformidade: conformidade ? { create: conformidade } : undefined,
        media_tensao: media_tensao ? { create: media_tensao } : undefined,
        baixa_tensao: baixa_tensao ? { create: baixa_tensao } : undefined,
        seguranca: seguranca ? { create: seguranca } : undefined,
        infraestrutura: infraestrutura ? { create: infraestrutura } : undefined,
        monitorizacao: monitorizacao ? { create: monitorizacao } : undefined,
        manutencao: manutencao ? { create: manutencao } : undefined,
        
        // Transformador is potentially multiple or single based on schema (Identificacao.transformadores[])
        transformadores: transformador ? { 
          create: Array.isArray(transformador) ? transformador : [transformador] 
        } : undefined,

        riscos: risco ? { create: Array.isArray(risco) ? risco : [risco] } : undefined
      }
    });
  }

  async update(id_pt, data) {
    const { 
      identificacao, 
      conformidade, 
      transformador, 
      media_tensao, 
      baixa_tensao, 
      seguranca, 
      infraestrutura, 
      monitorizacao, 
      manutencao, 
      risco 
    } = data;

    const baseData = identificacao || data;
    delete baseData.id_pt; // ID cannot be updated

    return prisma.identificacao.update({
      where: { id_pt },
      data: {
        ...baseData,
        id_subestacao: baseData.id_subestacao ? Number(baseData.id_subestacao) : undefined,
        potencia_kva: baseData.potencia_kva ? parseFloat(baseData.potencia_kva) : undefined,
        
        // Nested updates (upsert to ensure they exist)
        conformidade: conformidade ? { upsert: { create: conformidade, update: conformidade } } : undefined,
        media_tensao: media_tensao ? { upsert: { create: media_tensao, update: media_tensao } } : undefined,
        baixa_tensao: baixa_tensao ? { upsert: { create: baixa_tensao, update: baixa_tensao } } : undefined,
        seguranca: seguranca ? { upsert: { create: seguranca, update: seguranca } } : undefined,
        infraestrutura: infraestrutura ? { upsert: { create: infraestrutura, update: infraestrutura } } : undefined,
        monitorizacao: monitorizacao ? { upsert: { create: monitorizacao, update: monitorizacao } } : undefined,
        manutencao: manutencao ? { upsert: { create: manutencao, update: manutencao } } : undefined,

        // For arrays like transformadores, this is more complex. Simple approach: delete all and recreate or specific logic.
        // For simplicity in a 1-to-many relationship where frontend sends the full list:
        transformadores: transformador ? {
          deleteMany: {},
          create: Array.isArray(transformador) ? transformador : [transformador]
        } : undefined,

        riscos: risco ? {
          deleteMany: {},
          create: Array.isArray(risco) ? risco : [risco]
        } : undefined
      }
    });
  }

  async delete(id_pt) {
    return prisma.identificacao.delete({
      where: { id_pt },
    });
  }
}

module.exports = new IdentificacaoRepository();
