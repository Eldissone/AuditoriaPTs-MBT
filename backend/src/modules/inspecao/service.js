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
    const ptExists = await prisma.identificacao.findUnique({
      where: { id_pt: data.id_pt }
    });
    if (!ptExists) {
      throw new Error('PT não encontrado.');
    }
    // Validate that the auditor exists
    const auditorExists = await prisma.utilizador.findUnique({
      where: { id: data.id_auditor }
    });
    if (!auditorExists) {
      throw new Error('Auditor não encontrado.');
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
      const ptExists = await prisma.identificacao.findUnique({
        where: { id_pt: data.id_pt }
      });
      if (!ptExists) {
        throw new Error('PT não encontrado.');
      }
    }
    return repository.update(id, data);
  }

  async deleteInspecao(id) {
    return repository.delete(id);
  }
}

module.exports = new InspecaoService();
