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
    // Strip unknown relation fields that belong to Identificacao/PT but might be sent by the frontend
    const { 
      media_tensao, baixa_tensao, transformadores, seguranca, 
      infraestrutura, monitorizacao, manutencao, risco, pts,
      id: subId, criado_em, atualizado_em, _count,
      ...safeData 
    } = data;

    // Handle Dates: convert empty string to null, otherwise instantiate Date
    if (safeData.ano_construcao) {
      safeData.ano_construcao = new Date(safeData.ano_construcao);
    } else {
      safeData.ano_construcao = null;
    }

    if (safeData.entrada_operacao) {
      safeData.entrada_operacao = new Date(safeData.entrada_operacao);
    } else {
      safeData.entrada_operacao = null;
    }

    if (safeData.potencia_total_kva !== undefined) safeData.potencia_total_kva = Number(safeData.potencia_total_kva) || 0;

    return prisma.subestacao.create({ 
      data: safeData
    });
  }

  async update(id, data) {
    // Strip unknown relation fields that belong to Identificacao/PT but might be sent by the frontend
    const { 
      media_tensao, baixa_tensao, transformadores, seguranca, 
      infraestrutura, monitorizacao, manutencao, risco, pts,
      id: subId, criado_em, atualizado_em, _count,
      ...safeData 
    } = data;

    const updateData = { ...safeData };
    
    // Convert empty strings to null for DateTime fields to appease Prisma validation
    if (updateData.ano_construcao) {
      updateData.ano_construcao = new Date(updateData.ano_construcao);
    } else {
      updateData.ano_construcao = null;
    }

    if (updateData.entrada_operacao) {
      updateData.entrada_operacao = new Date(updateData.entrada_operacao);
    } else {
      updateData.entrada_operacao = null;
    }

    if (updateData.potencia_total_kva !== undefined) updateData.potencia_total_kva = Number(updateData.potencia_total_kva) || 0;

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
