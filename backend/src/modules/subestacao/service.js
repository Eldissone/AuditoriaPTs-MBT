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

  async bulkImport(dataArray) {
    if (!Array.isArray(dataArray)) throw new Error('Dados inválidos para importação.');

    const formattedData = dataArray.map((item, index) => ({
      codigo: item.codigo || item.equipamento || `SE-AUTO-${Date.now()}-${index}`,
      nome: item.nome || item.nome_proprietario || 'Subestação Importada',
      localizacao: item.localizacao || item.municipio || 'N/A',
      municipio: item.municipio || null,
      bairro: item.bairro || null,
      distrito_comuna: item.distrito_comuna || null,
      conta_contrato: item.conta_contrato || null,
      instalacao: item.instalacao || null,
      equipamento: item.equipamento || null,
      parceiro_negocios: item.parceiro_negocios || null,
      categoria_tarifa: item.categoria_tarifa || null,
      txt_categoria_tarifa: item.txt_categoria_tarifa || null,
      potencia_total_kva: parseFloat(item.potencia_total_kva || item.potencia) || 0,
      estado: item.estado || 'Ativa',
    }));

    return repository.bulkCreate(formattedData);
  }
}

module.exports = new SubestacaoService();
