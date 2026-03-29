const TarefaService = require('./service');

class TarefaController {
  async index(req, res) {
    try {
      const tarefas = await TarefaService.getTarefas(req.user);
      return res.json(tarefas);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      const tarefa = await TarefaService.createTarefa(req.body);
      return res.status(201).json(tarefa);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const tarefa = await TarefaService.updateTarefa(Number(id), req.body);
      return res.json(tarefa);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await TarefaService.deleteTarefa(Number(id));
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async iniciar(req, res) {
    try {
      const { id } = req.params;
      const tarefa = await TarefaService.iniciarTarefa(Number(id), req.user.id, req.user.role);
      return res.json(tarefa);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async concluir(req, res) {
    try {
      const { id } = req.params;
      const { checklist } = req.body;
      const tarefa = await TarefaService.concluirTarefa(Number(id), req.user.id, req.user.role, checklist);
      return res.json(tarefa);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new TarefaController();
