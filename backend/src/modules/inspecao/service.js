const repository = require('./repository');
const prisma = require('../../database/client');

class InspecaoService {
  async listAll(filters) {
    return repository.getAll(filters);
  }

  async getDetails(id) {
    const inspecao = await repository.getById(id);
    if (!inspecao) throw new Error('Inspeção não encontrada.');
    return inspecao;
  }

  async createInspecao(data) {
    // Validate that the PT exists
    const ptExists = await prisma.cliente.findUnique({
      where: { id_pt: data.id_pt }
    });
    if (!ptExists) {
      throw new Error('Cliente não encontrado.');
    }
    // Validate that the auditor exists
    const auditorExists = await prisma.utilizador.findUnique({
      where: { id: data.id_auditor }
    });
    if (!auditorExists) {
      throw new Error('Auditor não encontrado.');
    }

    // Validate if the task is already completed
    if (data.id_tarefa) {
      const tarefa = await prisma.tarefa.findUnique({ 
        where: { id: Number(data.id_tarefa) } 
      });
      if (tarefa && tarefa.status === 'Concluída') {
        throw new Error('Não é possível associar uma auditoria a uma tarefa já concluída.');
      }
    }

    return repository.create(data);
  }

  async updateInspecao(id, data) {
    // Validate that the inspection exists
    const inspecaoExists = await repository.getById(id);
    if (!inspecaoExists) {
      throw new Error('Inspeção não encontrada.');
    }
    // If id_pt is provided, validate that the PT exists
    if (data.id_pt) {
      const ptExists = await prisma.cliente.findUnique({
        where: { id_pt: data.id_pt }
      });
      if (!ptExists) {
        throw new Error('Cliente não encontrado.');
      }
    }
    return repository.update(id, data);
  }

  async deleteInspecao(id) {
    return repository.delete(id);
  }
}

module.exports = new InspecaoService();
