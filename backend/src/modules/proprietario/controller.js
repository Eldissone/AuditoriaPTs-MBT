const service = require('./service');

class ProprietarioController {
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
      const result = await service.createProprietario(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await service.updateProprietario(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await service.deleteProprietario(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async generatePDF(req, res) {
    try {
      const { id } = req.params;
      const prisma = require('../../database/client');
      const pdfGenerator = require('../../utils/pdfGenerator');

      const client = await prisma.proprietario.findUnique({
        where: { id: Number(id) },
        include: { 
          pts: {
            orderBy: { id_pt: 'asc' }
          }
        }
      });

      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Ficha_Cliente_${id}.pdf`);

      await pdfGenerator.generateClientSheet(client, res);
    } catch (error) {
      console.error('Erro ao gerar PDF do cliente:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao gerar o relatório do cliente' });
      }
    }
  }
}

module.exports = new ProprietarioController();
