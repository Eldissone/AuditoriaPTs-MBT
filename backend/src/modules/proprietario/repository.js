const prisma = require('../../database/client');

class ProprietarioRepository {
  async getAll(filters = {}) {
    const { search, page, limit } = filters;
    const where = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } },
        { conta_contrato: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy = { nome: 'asc' };
    const include = { _count: { select: { pts: true } } };

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [data, total] = await Promise.all([
        prisma.proprietario.findMany({ where, include, orderBy, skip, take }),
        prisma.proprietario.count({ where })
      ]);

      return { data, total, page: Number(page), limit: Number(limit) };
    }

    return prisma.proprietario.findMany({ where, include, orderBy });
  }

  async getById(id) {
    return prisma.proprietario.findUnique({
      where: { id: Number(id) },
      include: { 
        pts: {
          include: { subestacao: true }
        }
      }
    });
  }

  async create(data) {
    return prisma.proprietario.create({ data });
  }

  async update(id, data) {
    // Lista branca de campos escalares do modelo Proprietario
    const ALLOWED = [
      'nome', 'nif', 'email', 'telefone', 'tipo_cliente',
      'concessionaria', 'zona', 'operador', 'conta_contrato',
      'parceiro_negocios', 'categoria_tarifa', 'txt_categoria_tarifa',
      'montante_divida', 'num_facturas_atraso',
      'responsavel_financeiro', 'contacto_resp_financeiro',
      'canal_faturacao',
    ];
    const safeData = {};
    for (const key of ALLOWED) {
      if (data[key] !== undefined) {
        const val = data[key];
        if (key === 'montante_divida') safeData[key] = val !== '' && val !== null ? parseFloat(val) : null;
        else if (key === 'num_facturas_atraso') safeData[key] = val !== '' && val !== null ? parseInt(val) : 0;
        else safeData[key] = val;
      }
    }
    return prisma.proprietario.update({
      where: { id: Number(id) },
      data: safeData
    });
  }

  async delete(id) {
    return prisma.proprietario.delete({
      where: { id: Number(id) }
    });
  }
}

module.exports = new ProprietarioRepository();
