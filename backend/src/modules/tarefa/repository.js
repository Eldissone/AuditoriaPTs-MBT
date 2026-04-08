const prisma = require('../../database/client');

class TarefaRepository {
  getInclude() {
    return {
      auditor: { select: { nome: true, email: true } },
      pt: {
        select: {
          id_pt: true,
          gps: true,
          municipio: true,
          localizacao: true,
          conta_contrato: true,
          proprietario: true,
          subestacao: {
            select: {
              id: true,
              nome: true,
              municipio: true
            }
          }
        }
      }
    };
  }

  async create(data) {
    return prisma.tarefa.create({ data });
  }

  async findAll() {
    return prisma.tarefa.findMany({
      include: this.getInclude(),
      orderBy: { data_prevista: 'asc' }
    });
  }

  async findByAuditorId(auditorId) {
    return prisma.tarefa.findMany({
      where: { id_auditor: auditorId },
      include: this.getInclude(),
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
