const prisma = require('../../database/client');

class UtilizadorRepository {
  async findByEmail(email) {
    return prisma.utilizador.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return prisma.utilizador.findUnique({
      where: { id },
    });
  }

  async create(data) {
    return prisma.utilizador.create({
      data,
    });
  }

  async findAll() {
    return prisma.utilizador.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        telefone: true,
        localizacao: true,
        ativo: true,
        ultimo_acesso: true,
        criado_em: true,
        permissoes: true
      },
      orderBy: { nome: 'asc' },
    });
  }

  async updateLastAccess(id) {
    return prisma.utilizador.update({
      where: { id },
      data: { ultimo_acesso: new Date() },
    });
  }

  async update(id, data) {
    return prisma.utilizador.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return prisma.utilizador.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

module.exports = new UtilizadorRepository();
