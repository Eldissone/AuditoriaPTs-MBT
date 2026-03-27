const repository = require('./repository');

class SubestacaoService {
  async listAll(filters = {}) {
    return repository.getAll(filters);
  }

  async getDetails(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new Error('ID inválido.');
    
    const sub = await repository.getById(numericId);
    if (!sub) throw new Error('Subestação não encontrada.');
    return sub;
  }

  async createSubestacao(data) {
    // Business logic like code validation could go here
    return repository.create(data);
  }

  async updateSubestacao(id, data) {
    return repository.update(Number(id), data);
  }

  async deleteSubestacao(id) {
    return repository.delete(Number(id));
  }
}

module.exports = new SubestacaoService();
