const service = require('./service');

class SubestacaoController {
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
      const result = await service.getDetails(req.params.id);
      res.json(result);
    } catch (error) {
      const status = error.message === 'ID inválido.' ? 400 : 404;
      res.status(status).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      const result = await service.createSubestacao(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await service.updateSubestacao(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await service.deleteSubestacao(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SubestacaoController();
