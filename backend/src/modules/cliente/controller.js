const service = require('./service');

class IdentificacaoController {
  async index(req, res) {
    try {
      const result = await service.listAll(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async show(req, res) {
    try {
      const result = await service.getDetails(req.params.id_pt);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      const result = await service.createPT(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Erro ao Criar PT:', error);
      res.status(400).json({ 
        message: 'Erro ao criar PT', 
        error: error.message,
        details: error.meta 
      });
    }
  }

  async update(req, res) {
    try {
      const { id_pt } = req.params;
      const pt = await service.updatePT(id_pt, req.body);
      res.json(pt);
    } catch (error) {
      console.error('Erro ao Atualizar PT:', error);
      res.status(400).json({ 
        message: 'Erro ao atualizar PT', 
        error: error.message,
        details: error.meta
      });
    }
  }

  async delete(req, res) {
    try {
      await service.deletePT(req.params.id_pt);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkStore(req, res) {
    try {
      const result = await service.bulkImport(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new IdentificacaoController();
