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
        tarefa: true,
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
        tarefa: true,
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
        conformidade: conformidade ? { upsert: { create: { ...conformidade, id_pt: baseData.id_pt }, update: conformidade } } : undefined,
        transformadores: transformadores ? { create: (Array.isArray(transformadores) ? transformadores : [transformadores]).map(t => ({ ...t, id_pt: baseData.id_pt })) } : undefined,
        media_tensao: media_tensao ? { upsert: { create: { ...media_tensao, id_pt: baseData.id_pt }, update: media_tensao } } : undefined,
        baixa_tensao: baixa_tensao ? { upsert: { create: { ...baixa_tensao, id_pt: baseData.id_pt }, update: baixa_tensao } } : undefined,
        seguranca: seguranca ? { upsert: { create: { ...seguranca, id_pt: baseData.id_pt }, update: seguranca } } : undefined,
        infraestrutura: infraestrutura ? { upsert: { create: { ...infraestrutura, id_pt: baseData.id_pt }, update: infraestrutura } } : undefined,
        monitorizacao: monitorizacao ? { upsert: { create: { ...monitorizacao, id_pt: baseData.id_pt }, update: monitorizacao } } : undefined,
        manutencao: manutencao ? { upsert: { create: { ...manutencao, id_pt: baseData.id_pt }, update: manutencao } } : undefined,
        riscos: riscos ? { create: (Array.isArray(riscos) ? riscos : [riscos]).map(r => ({ ...r, id_pt: baseData.id_pt })) } : undefined,
      }
    });
  }

  async update(id, data) {
    // Get the existing inspecao to get id_pt
    const existing = await this.getById(id);
    if (!existing) throw new Error('Inspeção não encontrada.');
    
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

    // Use the new id_pt if provided, else existing
    const id_pt = baseData.id_pt || existing.id_pt;

    return prisma.inspecao.update({
      where: { id: Number(id) },
      data: {
        ...baseData,
        data_inspecao: baseData.data_inspecao ? new Date(baseData.data_inspecao) : undefined,
        conformidade: conformidade ? { upsert: { create: { ...conformidade, id_pt }, update: conformidade } } : undefined,
        transformadores: transformadores ? { 
          deleteMany: {},
          create: (Array.isArray(transformadores) ? transformadores : [transformadores]).map(t => ({ ...t, id_pt }))
        } : undefined,
        media_tensao: media_tensao ? { upsert: { create: { ...media_tensao, id_pt }, update: media_tensao } } : undefined,
        baixa_tensao: baixa_tensao ? { upsert: { create: { ...baixa_tensao, id_pt }, update: baixa_tensao } } : undefined,
        seguranca: seguranca ? { upsert: { create: { ...seguranca, id_pt }, update: seguranca } } : undefined,
        infraestrutura: infraestrutura ? { upsert: { create: { ...infraestrutura, id_pt }, update: infraestrutura } } : undefined,
        monitorizacao: monitoramento ? { upsert: { create: { ...monitorizacao, id_pt }, update: monitorizacao } } : undefined,
        manutencao: manutencao ? { upsert: { create: { ...manutencao, id_pt }, update: manutencao } } : undefined,
        riscos: riscos ? {
          deleteMany: {},
          create: (Array.isArray(riscos) ? riscos : [riscos]).map(r => ({ ...r, id_pt }))
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
