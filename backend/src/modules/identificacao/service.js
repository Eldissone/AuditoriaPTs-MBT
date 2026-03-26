const repository = require('./repository');

class IdentificacaoService {
  async listAll(filters) {
    return repository.getAll(filters);
  }

  async getDetails(id_pt) {
    const pt = await repository.getByIdPt(id_pt);
    if (!pt) throw new Error('Posto de Transformação não encontrado.');
    return pt;
  }

  async createPT(data) {
    return repository.create(data);
  }

  async updatePT(id_pt, data) {
    return repository.update(id_pt, data);
  }

  async deletePT(id_pt) {
    return repository.delete(id_pt);
  }
}

module.exports = new IdentificacaoService();
