const prisma = require('../../database/client');

class DashboardService {
  async getStats(filters = {}) {
    const { municipio, status } = filters;

    const subWhere = {};
    if (municipio) subWhere.municipio = municipio;
    if (status) subWhere.status = status;

    // Client (PT) filter: join through subestacao
    const clientWhere = {};
    if (municipio || status) {
      clientWhere.subestacao = {};
      if (municipio) clientWhere.subestacao.municipio = municipio;
      if (status) clientWhere.subestacao.status = status;
    }

    const [subTotal, clientTotal, capacitySum, tasksCompleted] = await Promise.all([
      prisma.subestacao.count({ where: subWhere }),
      prisma.cliente.count({ where: clientWhere }),
      prisma.subestacao.aggregate({
        where: subWhere,
        _sum: { capacidade_total_mva: true }
      }),
      prisma.tarefa.count({
        where: {
          status: {
            in: ['Concluída', 'Concluído', 'completed', 'done']
          }
        }
      })
    ]);

    return {
      subestacoes: subTotal,
      clientes: clientTotal,
      capacidade_total_mva: capacitySum._sum.capacidade_total_mva || 0,
      tarefas_concluidas: tasksCompleted
    };
  }

  async getMapData() {
    const subestacoes = await prisma.subestacao.findMany({
      select: {
        id: true,
        nome: true,
        municipio: true,
        tipo: true,
        latitude: true,
        longitude: true,
        gps: true,
        capacidade_total_mva: true,
        status: true,
        _count: {
          select: { pts: true }
        }
      }
    });

    return { subestacoes };
  }
}

module.exports = new DashboardService();
