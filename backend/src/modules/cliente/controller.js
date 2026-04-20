const service = require('./service');

class IdentificacaoController {
  async index(req, res) {
    try {
      const result = await service.listAll(req.query);
      res.json(result);
    } catch (error) {
      console.error('ERRO FATAL /api/clientes:', error);
      if (error.stack) console.error(error.stack);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
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

  async transferir(req, res) {
    try {
      const { id_pts, id_subestacao_destino } = req.body;
      if (!id_pts || !id_subestacao_destino) {
        return res.status(400).json({ error: 'id_pts e id_subestacao_destino são obrigatórios.' });
      }
      const result = await service.transferirPTs(id_pts, id_subestacao_destino);
      res.json(result);
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

  async generatePDF(req, res) {
    try {
      const { id_pt } = req.params;
      const prisma = require('../../database/client');
      const pdfGenerator = require('../../utils/pdfGenerator');

      // Fetch full data including relations
      const pt = await prisma.postoTransformacao.findUnique({
        where: { id_pt },
        include: { subestacao: true }
      });

      if (!pt) return res.status(404).json({ error: 'PT não encontrado' });

      // Fetch inspections history
      const inspections = await prisma.inspecao.findMany({
        where: { id_pt },
        include: { auditor: true },
        orderBy: { data_inspecao: 'desc' },
        take: 10 // Only most recent for the PDF
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Ficha_Tecnica_${id_pt}.pdf`);

      await pdfGenerator.generateTechnicalSheet(pt, inspections, res);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao gerar o relatório PDF' });
      }
    }
  }
}

module.exports = new IdentificacaoController();
