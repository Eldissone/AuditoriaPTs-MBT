const service = require('./service');

class UtilizadorController {
  async register(req, res) {
    try {
      const result = await service.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await service.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async profile(req, res) {
    try {
      const result = await service.getProfile(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const users = await service.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const user = await service.register(req.body); // Pode usar a mesma lógica do register
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const updatedUser = await service.updateUser(parseInt(req.params.id), req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await service.deleteUser(parseInt(req.params.id));
      res.json({ message: 'Utilizador inativado com sucesso.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UtilizadorController();
