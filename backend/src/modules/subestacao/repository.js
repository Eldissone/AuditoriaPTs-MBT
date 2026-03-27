const prisma = require('../../database/client');

class SubestacaoRepository {
  async getAll(filters = {}) {
    const where = {};

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } },
        { localizacao: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.municipio) {
      where.municipio = filters.municipio;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    return prisma.subestacao.findMany({
      where,
      include: {
        _count: {
          select: { pts: true },
        },
      },
      orderBy: { nome: 'asc' }
    });
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
    return prisma.subestacao.create({ 
      data: {
        ...data,
        ano_construcao: data.ano_construcao ? new Date(data.ano_construcao) : null,
        entrada_operacao: data.entrada_operacao ? new Date(data.entrada_operacao) : null,
      }
    });
  }

  async update(id, data) {
    const updateData = { ...data };
    if (updateData.ano_construcao) updateData.ano_construcao = new Date(updateData.ano_construcao);
    if (updateData.entrada_operacao) updateData.entrada_operacao = new Date(updateData.entrada_operacao);

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
}

module.exports = new SubestacaoRepository();
