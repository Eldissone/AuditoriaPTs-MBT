const repository = require('./repository');
const { getGpsForMunicipio } = require('../../utils/angolaGps');

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

    // Proteção contra importação cruzada: se detectar campos de PT/Cliente, rejeita.
    const isClientFile = dataArray.some(item => 
      item['Conta de contrato'] || 
      item['Equipamento'] || 
      item['Instalação'] ||
      item['Nome Proprietario'] ||
      item['parceiro_negocios']
    );

    if (isClientFile) {
      throw new Error('Este ficheiro parece conter dados de Clientes/PTs. Por favor, utilize a página de "Gestão de Clientes" para realizar esta importação.');
    }

    const prisma = require('../../database/client');
    const results = { subestacoes: 0, skipped: 0, errors: [] };

    for (let index = 0; index < dataArray.length; index++) {
      const item = dataArray[index];
      try {
        if (!item.nome && !item.municipio) {
          results.skipped++;
          continue;
        }

        // Se não houver código operacional, geramos um temporário
        const codigo = item.codigo_operacional || item.codigo || `SE-IMP-${index + 1}-${Date.now().toString().slice(-4)}`;

        await prisma.subestacao.upsert({
          where: { codigo_operacional: codigo },
          update: {
            nome: item.nome || `Subestação ${item.municipio || 'S/N'}`,
            tipo: item.tipo || 'Distribuição',
            tensao_kv_entrada: parseFloat(item.tensao_kv_entrada) || undefined,
            tensao_kv_saida: parseFloat(item.tensao_kv_saida) || undefined,
            capacidade_total_mva: parseFloat(item.capacidade_total_mva) || undefined,
            municipio: item.municipio || 'Desconhecido',
            latitude: parseFloat(item.latitude) || undefined,
            longitude: parseFloat(item.longitude) || undefined,
            status: item.status || 'Ativa',
            data_instalacao: item.data_instalacao ? new Date(item.data_instalacao) : undefined
          },
          create: {
            nome: item.nome || `Subestação ${item.municipio || 'S/N'}`,
            codigo_operacional: codigo,
            tipo: item.tipo || 'Distribuição',
            tensao_kv_entrada: parseFloat(item.tensao_kv_entrada) || 60,
            tensao_kv_saida: parseFloat(item.tensao_kv_saida) || 15,
            capacidade_total_mva: parseFloat(item.capacidade_total_mva) || 40,
            municipio: item.municipio || 'Desconhecido',
            latitude: parseFloat(item.latitude) || null,
            longitude: parseFloat(item.longitude) || null,
            status: item.status || 'Ativa',
            data_instalacao: item.data_instalacao ? new Date(item.data_instalacao) : null
          }
        });

        results.subestacoes++;
      } catch (err) {
        results.errors.push(`Linha ${index + 1} (${item.nome || 'Sem Nome'}): ${err.message}`);
      }
    }

    return results;
  }

  async getFiltersMetadata() {
    return repository.getMetadata();
  }
}

module.exports = new SubestacaoService();
