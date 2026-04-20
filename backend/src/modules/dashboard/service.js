const prisma = require('../../database/client');

class DashboardService {
  async getStats(filters = {}) {
    const { municipio, status, id_subestacao } = filters;

    const subWhere = {};
    if (id_subestacao) subWhere.id = Number(id_subestacao);
    if (municipio) subWhere.municipio = municipio;
    if (status) subWhere.status = status;

    // Client (PT) filter
    const clientWhere = {};
    if (id_subestacao) {
      clientWhere.id_subestacao = Number(id_subestacao);
    } else if (municipio || status) {
      clientWhere.subestacao = {};
      if (municipio) clientWhere.subestacao.municipio = municipio;
      if (status) clientWhere.subestacao.status = status;
    }

    const [subTotal, clientTotal, capacitySum, tasksCompleted] = await Promise.all([
      prisma.subestacao.count({ where: subWhere }),
      prisma.postoTransformacao.count({ where: clientWhere }),
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
