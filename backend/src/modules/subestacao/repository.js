const prisma = require('../../database/client');

class SubestacaoRepository {
  async getAll() {
    return prisma.subestacao.findMany({
      include: {
        _count: {
          select: { pts: true },
        },
      },
    });
  }

  async getById(id) {
    return prisma.subestacao.findUnique({
      where: { id },
      include: { pts: true },
    });
  }

  async create(data) {
    return prisma.subestacao.create({ data });
  }

  async update(id, data) {
    return prisma.subestacao.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.subestacao.delete({
      where: { id },
    });
  }
}

module.exports = new SubestacaoRepository();
