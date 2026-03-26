const prisma = require('../../database/client');

class IdentificacaoRepository {
  async getAll(filters = {}) {
    return prisma.identificacao.findMany({
      where: filters,
      include: {
        subestacao: true,
        responsavel: true,
      },
    });
  }

  async getByIdPt(id_pt) {
    return prisma.identificacao.findUnique({
      where: { id_pt },
      include: {
        subestacao: true,
        responsavel: true,
        inspecoes: {
          orderBy: { data_inspecao: 'desc' },
          take: 5,
        },
      },
    });
  }

  async create(data) {
    return prisma.identificacao.create({ data });
  }

  async update(id_pt, data) {
    return prisma.identificacao.update({
      where: { id_pt },
      data,
    });
  }

  async delete(id_pt) {
    return prisma.identificacao.delete({
      where: { id_pt },
    });
  }
}

module.exports = new IdentificacaoRepository();
