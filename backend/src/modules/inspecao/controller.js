const service = require('./service');

class InspecaoController {
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
      res.status(404).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      // Automatic auditor assignment from auth middleware
      const data = { ...req.body, id_auditor: req.user.id };
      const result = await service.createInspecao(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await service.updateInspecao(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await service.deleteInspecao(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new InspecaoController();
