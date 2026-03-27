const prisma = require('../../database/client');

class SubestacaoRepository {
  async getAll(filters = {}) {
    const where = {};
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } },
        { localizacao: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.municipio) {
      where.municipio = filters.municipio;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.categoria_tarifa) {
      where.categoria_tarifa = filters.categoria_tarifa;
    }

    if (filters.potencia) {
      // Filtrar por potência exata ou próxima (convertendo para float)
      const p = parseFloat(filters.potencia);
      if (!isNaN(p)) {
        where.potencia_total_kva = p;
      }
    }

    const [data, total] = await Promise.all([
      prisma.subestacao.findMany({
        where,
        include: {
          _count: {
            select: { pts: true },
          },
        },
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
      prisma.subestacao.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async getById(id) {
    return prisma.subestacao.findUnique({
      where: { id },
      include: { 
        pts: true,
      },
    });
  }

  async create(data) {
    return prisma.subestacao.create({ 
      data: {
        ...data,
        ano_construcao: data.ano_construcao ? new Date(data.ano_construcao) : null,
        entrada_operacao: data.entrada_operacao ? new Date(data.entrada_operacao) : null,
      }
    });
  }

  async update(id, data) {
    const updateData = { ...data };
    if (updateData.ano_construcao) updateData.ano_construcao = new Date(updateData.ano_construcao);
    if (updateData.entrada_operacao) updateData.entrada_operacao = new Date(updateData.entrada_operacao);

    return prisma.subestacao.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id) {
    return prisma.subestacao.delete({
      where: { id },
    });
  }

  async bulkCreate(data) {
    return prisma.subestacao.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async getMetadata() {
    // Buscar todos os valores únicos para os filtros
    const [municipios, categorias, potencias] = await Promise.all([
      prisma.subestacao.findMany({
        distinct: ['municipio'],
        select: { municipio: true },
        where: { 
          AND: [
            { municipio: { not: null } },
            { municipio: { not: '' } }
          ]
        },
        orderBy: { municipio: 'asc' }
      }),
      prisma.subestacao.findMany({
        distinct: ['categoria_tarifa'],
        select: { categoria_tarifa: true },
        where: { 
          AND: [
            { categoria_tarifa: { not: null } },
            { categoria_tarifa: { not: '' } }
          ]
        },
        orderBy: { categoria_tarifa: 'asc' }
      }),
      prisma.subestacao.findMany({
        distinct: ['potencia_total_kva'],
        select: { potencia_total_kva: true },
        where: { potencia_total_kva: { gt: 0 } },
        orderBy: { potencia_total_kva: 'asc' }
      })
    ]);

    return {
      municipios: municipios.map(m => m.municipio),
      categorias: categorias.map(c => c.categoria_tarifa),
      potencias: potencias.map(p => p.potencia_total_kva)
    };
  }
}

module.exports = new SubestacaoRepository();
