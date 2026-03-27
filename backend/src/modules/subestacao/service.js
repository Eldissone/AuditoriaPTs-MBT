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

    const prisma = require('../../database/client');
    const results = { subestacoes: 0, pts: 0, skipped: 0, errors: [] };

    for (let index = 0; index < dataArray.length; index++) {
      const item = dataArray[index];
      try {
        // 1. Criar a Subestação (uma por linha, como antes)
        const seData = {
          codigo: String(item.codigo || item.equipamento || `SE-AUTO-${Date.now()}-${index}`),
          nome: item.municipio ? String(item.municipio) : 'Município N/D',
          proprietario: String(item.proprietario || item.parceiro_negocios || 'PT Sem Nome'),
          localizacao: String(item.localizacao || item.municipio || 'N/A'),
          municipio: item.municipio ? String(item.municipio) : null,
          bairro: item.bairro ? String(item.bairro) : null,
          distrito_comuna: item.distrito_comuna ? String(item.distrito_comuna) : null,
          conta_contrato: item.conta_contrato ? String(item.conta_contrato) : null,
          instalacao: item.instalacao ? String(item.instalacao) : null,
          equipamento: item.equipamento ? String(item.equipamento) : null,
          parceiro_negocios: item.parceiro_negocios ? String(item.parceiro_negocios) : null,
          categoria_tarifa: item.categoria_tarifa ? String(item.categoria_tarifa) : null,
          txt_categoria_tarifa: item.txt_categoria_tarifa ? String(item.txt_categoria_tarifa) : null,
          potencia_total_kva: parseFloat(item.potencia_total_kva || item.potencia) || 0,
          estado: String(item.estado || 'Ativa'),
          gps: item.gps || getGpsForMunicipio(item.municipio) || null,
        };

        let subestacao;
        try {
          subestacao = await prisma.subestacao.create({ data: seData });
          results.subestacoes++;
        } catch (e) {
          // Se já existe (unique constraint), buscar a existente
          subestacao = await prisma.subestacao.findFirst({
            where: { codigo: seData.codigo }
          });
          if (!subestacao) throw e;
        }

        // 2. Criar PT (Identificação) ligado a esta Subestação
        const equipamento = item.equipamento ? String(item.equipamento).trim() : null;
        const conta = item.conta_contrato ? String(item.conta_contrato).trim() : null;
        const id_pt = equipamento || conta ||
          `PT-${String(item.municipio || 'X').substring(0, 4).toUpperCase()}-${Date.now()}-${index}`;

        const existingPt = await prisma.identificacao.findUnique({ where: { id_pt } });
        if (existingPt) {
          results.skipped++;
        } else {
          await prisma.identificacao.create({
            data: {
              id_pt,
              id_subestacao: subestacao.id,
              localizacao: String(item.localizacao || item.municipio || 'N/A'),
              municipio: item.municipio ? String(item.municipio) : null,
              bairro: item.bairro ? String(item.bairro) : null,
              distrito_comuna: item.distrito_comuna ? String(item.distrito_comuna) : null,
              tipo_instalacao: 'Posto de Transformação',
              nivel_tensao: 'MT/BT',
              potencia_kva: parseFloat(item.potencia_total_kva) || 0,
              ano_instalacao: new Date().getFullYear(),
              estado_operacional: 'Operacional',
              conta_contrato: conta,
              instalacao: item.instalacao ? String(item.instalacao) : null,
              equipamento,
              parceiro_negocios: item.parceiro_negocios ? String(item.parceiro_negocios) : null,
              categoria_tarifa: item.categoria_tarifa ? String(item.categoria_tarifa) : null,
              txt_categoria_tarifa: item.txt_categoria_tarifa ? String(item.txt_categoria_tarifa) : null,
              gps: item.gps || getGpsForMunicipio(item.municipio) || null,
            }
          });
          results.pts++;
        }
      } catch (err) {
        results.errors.push(`Linha ${index + 1}: ${err.message}`);
      }
    }

    return results;
  }

  async getFiltersMetadata() {
    return repository.getMetadata();
  }
}

module.exports = new SubestacaoService();
