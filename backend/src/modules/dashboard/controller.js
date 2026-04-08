const service = require('./service');

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await service.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMapData(req, res) {
    try {
      const mapData = await service.getMapData();
      res.json(mapData);
    } catch (error) {
      console.error('Erro ao buscar dados do mapa:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DashboardController();
