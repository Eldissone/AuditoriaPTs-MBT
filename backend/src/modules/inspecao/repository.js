const prisma = require('../../database/client');

class InspecaoRepository {
  async getAll(filters = {}) {
    return prisma.inspecao.findMany({
      where: filters,
      include: {
        pt: true,
        auditor: {
          select: { id: true, nome: true, email: true },
        },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async getById(id) {
    return prisma.inspecao.findUnique({
      where: { id: Number(id) },
      include: {
        pt: true,
        auditor: true,
        transformadores: true,
        conformidade: true,
        media_tensao: true,
        baixa_tensao: true,
        seguranca: true,
        infraestrutura: true,
        monitorizacao: true,
        manutencao: true,
        riscos: true,
      },
    });
  }

  async create(data) {
    const {
      conformidade,
      transformadores,
      media_tensao,
      baixa_tensao,
      seguranca,
      infraestrutura,
      monitorizacao,
      manutencao,
      riscos,
      ...baseData
    } = data;

    return prisma.inspecao.create({
      data: {
        ...baseData,
        data_inspecao: baseData.data_inspecao ? new Date(baseData.data_inspecao) : new Date(),
        conformidade: conformidade ? { create: conformidade } : undefined,
        transformadores: transformadores ? { create: Array.isArray(transformadores) ? transformadores : [transformadores] } : undefined,
        media_tensao: media_tensao ? { create: media_tensao } : undefined,
        baixa_tensao: baixa_tensao ? { create: baixa_tensao } : undefined,
        seguranca: seguranca ? { create: seguranca } : undefined,
        infraestrutura: infraestrutura ? { create: infraestrutura } : undefined,
        monitorizacao: monitorizacao ? { create: monitorizacao } : undefined,
        manutencao: manutencao ? { create: manutencao } : undefined,
        riscos: riscos ? { create: Array.isArray(riscos) ? riscos : [riscos] } : undefined,
      }
    });
  }

  async update(id, data) {
    const {
      conformidade,
      transformadores,
      media_tensao,
      baixa_tensao,
      seguranca,
      infraestrutura,
      monitorizacao,
      manutencao,
      riscos,
      ...baseData
    } = data;

    return prisma.inspecao.update({
      where: { id: Number(id) },
      data: {
        ...baseData,
        data_inspecao: baseData.data_inspecao ? new Date(baseData.data_inspecao) : undefined,
        conformidade: conformidade ? { upsert: { create: conformidade, update: conformidade } } : undefined,
        transformadores: transformadores ? { 
          deleteMany: {},
          create: Array.isArray(transformadores) ? transformadores : [transformadores] 
        } : undefined,
        media_tensao: media_tensao ? { upsert: { create: media_tensao, update: media_tensao } } : undefined,
        baixa_tensao: baixa_tensao ? { upsert: { create: baixa_tensao, update: baixa_tensao } } : undefined,
        seguranca: seguranca ? { upsert: { create: seguranca, update: seguranca } } : undefined,
        infraestrutura: infraestrutura ? { upsert: { create: infraestrutura, update: infraestrutura } } : undefined,
        monitorizacao: monitorizacao ? { upsert: { create: monitorizacao, update: monitorizacao } } : undefined,
        manutencao: manutencao ? { upsert: { create: manutencao, update: manutencao } } : undefined,
        riscos: riscos ? {
          deleteMany: {},
          create: Array.isArray(riscos) ? riscos : [riscos]
        } : undefined,
      }
    });
  }

  async delete(id) {
    return prisma.inspecao.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = new InspecaoRepository();
