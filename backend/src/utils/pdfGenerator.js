const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFGenerator {
  async generateAuditReport(auditData, outputPath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Relatório de Auditoria de Posto de Transformação', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Identificador do PT: ${auditData.id_pt}`, { align: 'left' });
      doc.text(`Data da Inspeção: ${new Date(auditData.data_inspecao).toLocaleDateString('pt-PT')}`);
      doc.text(`Tipo de Inspeção: ${auditData.tipo}`);
      doc.text(`Resultado: ${auditData.resultado || 'Pendente'}`);
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Observations
      doc.fontSize(14).text('Observações:', { underline: true });
      doc.fontSize(10).text(auditData.observacoes || 'Nenhuma observação registada.', { align: 'justify' });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    });
  }
}

module.exports = new PDFGenerator();
