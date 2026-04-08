const prisma = require('../../database/client');

class DashboardService {
  async getStats() {
    const [subTotal, clientTotal, capacitySum, tasksCompleted] = await Promise.all([
      prisma.subestacao.count(),
      prisma.cliente.count(),
      prisma.subestacao.aggregate({
        _sum: {
          capacidade_total_mva: true
        }
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

    return {
      subestacoes
    };
  }
}

module.exports = new DashboardService();
