const prisma = require('../../database/client');

class TarefaRepository {
  async create(data) {
    return prisma.tarefa.create({ data });
  }

  async findAll() {
    return prisma.tarefa.findMany({
      include: {
        auditor: { select: { nome: true, email: true } },
        pt: { select: { subestacao: { select: { nome: true } } } }
      },
      orderBy: { data_prevista: 'asc' }
    });
  }

  async findByAuditorId(auditorId) {
    return prisma.tarefa.findMany({
      where: { id_auditor: auditorId },
      include: {
        pt: { select: { subestacao: { select: { nome: true } } } }
      },
      orderBy: { data_prevista: 'asc' }
    });
  }

  async findById(id) {
    return prisma.tarefa.findUnique({ where: { id } });
  }

  async update(id, data) {
    return prisma.tarefa.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.tarefa.delete({ where: { id } });
  }
}

module.exports = new TarefaRepository();
