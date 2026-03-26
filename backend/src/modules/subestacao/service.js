const repository = require('./repository');

class SubestacaoService {
  async listAll() {
    return repository.getAll();
  }

  async getDetails(id) {
    const sub = await repository.getById(Number(id));
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
