const repository = require('./repository');

class ProprietarioService {
  async listAll(filters) {
    return repository.getAll(filters);
  }

  async getDetails(id) {
    const proprietario = await repository.getById(id);
    if (!proprietario) throw new Error('Proprietário não encontrado');
    return proprietario;
  }

  async createProprietario(data) {
    return repository.create(data);
  }

  async updateProprietario(id, data) {
    return repository.update(id, data);
  }

  async deleteProprietario(id) {
    return repository.delete(id);
  }
}

module.exports = new ProprietarioService();
