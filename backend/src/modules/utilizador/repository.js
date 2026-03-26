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

  async updateLastAccess(id) {
    return prisma.utilizador.update({
      where: { id },
      data: { ultimo_acesso: new Date() },
    });
  }
}

module.exports = new UtilizadorRepository();
