const repository = require('./repository');

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
    // Basic logic to validate auditor exists could go here
    return repository.create(data);
  }

  async updateInspecao(id, data) {
    return repository.update(id, data);
  }

  async deleteInspecao(id) {
    return repository.delete(id);
  }
}

module.exports = new InspecaoService();
