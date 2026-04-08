const prisma = require('../../database/client');

class SubestacaoRepository {
  async getAll(filters = {}) {
    const where = {};
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { codigo_operacional: { contains: filters.search, mode: 'insensitive' } },
        { municipio: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.municipio) {
      where.municipio = filters.municipio;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    const [data, total] = await Promise.all([
      prisma.subestacao.findMany({
        where,
        include: {
          _count: {
            select: { pts: true },
          },
        },
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
      prisma.subestacao.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async getById(id) {
    return prisma.subestacao.findUnique({
      where: { id },
      include: { 
        pts: true,
      },
    });
  }

  async create(data) {
    const { 
      pts, id: subId, criado_em, atualizado_em, _count,
      ...safeData 
    } = data;

    if (safeData.data_instalacao) {
      safeData.data_instalacao = new Date(safeData.data_instalacao);
    } else {
      safeData.data_instalacao = null;
    }

    if (safeData.tensao_kv_entrada !== undefined) safeData.tensao_kv_entrada = parseFloat(safeData.tensao_kv_entrada) || 0;
    if (safeData.tensao_kv_saida !== undefined) safeData.tensao_kv_saida = parseFloat(safeData.tensao_kv_saida) || 0;
    if (safeData.capacidade_total_mva !== undefined) safeData.capacidade_total_mva = parseFloat(safeData.capacidade_total_mva) || 0;
    if (safeData.latitude !== undefined) safeData.latitude = parseFloat(safeData.latitude) || null;
    if (safeData.longitude !== undefined) safeData.longitude = parseFloat(safeData.longitude) || null;

    return prisma.subestacao.create({ 
      data: safeData
    });
  }

  async update(id, data) {
    const { 
      pts, id: subId, criado_em, atualizado_em, _count,
      ...safeData 
    } = data;

    const updateData = { ...safeData };
    
    if (updateData.data_instalacao) {
      updateData.data_instalacao = new Date(updateData.data_instalacao);
    } else {
      updateData.data_instalacao = null;
    }

    if (updateData.tensao_kv_entrada !== undefined) updateData.tensao_kv_entrada = parseFloat(updateData.tensao_kv_entrada) || 0;
    if (updateData.tensao_kv_saida !== undefined) updateData.tensao_kv_saida = parseFloat(updateData.tensao_kv_saida) || 0;
    if (updateData.capacidade_total_mva !== undefined) updateData.capacidade_total_mva = parseFloat(updateData.capacidade_total_mva) || 0;
    if (updateData.latitude !== undefined) updateData.latitude = parseFloat(updateData.latitude) || null;
    if (updateData.longitude !== undefined) updateData.longitude = parseFloat(updateData.longitude) || null;

    return prisma.subestacao.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id) {
    return prisma.subestacao.delete({
      where: { id },
    });
  }

  async bulkCreate(data) {
    return prisma.subestacao.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async getMetadata() {
    const [municipios, tipos, capacidades] = await Promise.all([
      prisma.subestacao.findMany({
        distinct: ['municipio'],
        select: { municipio: true },
        where: { municipio: { not: null } },
        orderBy: { municipio: 'asc' }
      }),
      prisma.subestacao.findMany({
        distinct: ['tipo'],
        select: { tipo: true },
        orderBy: { tipo: 'asc' }
      }),
      prisma.subestacao.findMany({
        distinct: ['capacidade_total_mva'],
        select: { capacidade_total_mva: true },
        where: { capacidade_total_mva: { gt: 0 } },
        orderBy: { capacidade_total_mva: 'asc' }
      })
    ]);

    return {
      municipios: municipios.map(m => m.municipio),
      tipos: tipos.map(t => t.tipo),
      capacidades: capacidades.map(c => c.capacidade_total_mva)
    };
  }
}

module.exports = new SubestacaoRepository();
