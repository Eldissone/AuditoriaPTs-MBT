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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const result = await service.getDetails(id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async store(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      // Automatic auditor assignment from auth middleware
      const data = { ...req.body, id_auditor: req.user.id };
      const result = await service.createInspecao(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error: error?.message || 'Erro ao criar inspeção.',
        code: error?.code,
        meta: error?.meta,
      });
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

  async generatePDF(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const pdfGenerator = require('../../utils/pdfGenerator');
      const inspecao = await service.getDetails(id);

      if (!inspecao) {
        return res.status(404).json({ error: 'Inspeção não encontrada' });
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Inspecao_${id}.pdf`);

      await pdfGenerator.generateAuditReport(inspecao, res);
    } catch (error) {
      console.error('Erro ao gerar PDF de inspeção:', error);
      if (!res.headersSent) {
        if (error.message.includes('não encontrada')) {
          return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erro ao gerar o relatório PDF' });
      }
    }
  }
}

module.exports = new InspecaoController();
