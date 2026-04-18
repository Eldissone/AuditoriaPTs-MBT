const PDFDocument = require('pdfkit');

class PDFGenerator {
  /**
   * Generates a professional Technical Sheet for a PT (Posto de Transformação)
   */
  async generateTechnicalSheet(ptData, inspections, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          info: {
            Title: `Ficha Técnica - ${ptData.id_pt}`,
            Author: 'Sistema PTAS - MBT Energia',
          }
        });

        // Pipe the doc to the response stream
        doc.pipe(res);

        // --- Estilos e Cores ---
        const colors = {
          primary: '#0f1c2c',    // Deep Blue
          accent: '#0d3fd1',     // Official Blue
          success: '#005229',    // Conform Green
          text: '#444655',
          lightText: '#747686',
          border: '#e5e7eb',
          bgHeader: '#0f1c2c'
        };

        // --- Cabeçalho Corporativo ---
        doc.rect(0, 0, doc.page.width, 100).fill(colors.bgHeader);
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('FICHA TÉCNICA DE ATIVO', 50, 35);
        doc.fillColor('#5fff9b').fontSize(10).font('Helvetica').text('SISTEMA DE GESTÃO E AUDITORIA MBT ENERGIA', 50, 65);

        // Data de Emissão no cabeçalho
        const emissionDate = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.fillColor('#ffffff').fontSize(8).text(`EMITIDO EM: ${emissionDate}`, 430, 42, { align: 'right' });

        // --- Identificação Principal ---
        let currentY = 130;
        doc.fillColor(colors.primary).fontSize(18).font('Helvetica-Bold').text(`${ptData.id_pt}`, 50, currentY);
        doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('IDENTIFICADOR ÚNICO DO POSTO DE TRANSFORMAÇÃO', 50, currentY + 20);

        currentY += 50;

        // --- Secção 1: Dados do Proprietário & Contrato ---
        this._drawSectionTitle(doc, 'PROPRIEDADE & GESTÃO', currentY, colors);
        currentY += 25;

        this._drawField(doc, 'PROPRIETÁRIO / DONO', ptData.proprietario || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'CONTA CONTRATO', ptData.conta_contrato || 'N/A', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'PARCEIRO NEGÓCIOS', ptData.parceiro_negocios || '---', 50, currentY, colors);
        this._drawField(doc, 'TIPO DE CLIENTE', ptData.tipo_cliente || 'N/D', 230, currentY, colors);
        // this._drawField(doc, 'SÉRIE EQUIPAMENTO', ptData.num_serie || '---', 410, currentY, colors);
        this._drawField(doc, 'TIPO INSTALAÇÃO', ptData.tipo_instalacao || '---', 410, currentY, colors);

        currentY += 60;

        // --- Secção 2: Especificações Técnicas ---
        this._drawSectionTitle(doc, 'ESPECIFICAÇÕES TÉCNICAS', currentY, colors);
        currentY += 25;

        this._drawField(doc, 'POTÊNCIA NOMINAL', `${ptData.potencia_kva || '0'} kVA`, 50, currentY, colors);
        this._drawField(doc, 'NÍVEL DE TENSÃO', ptData.nivel_tensao || 'MT/BT', 230, currentY, colors);
        this._drawField(doc, 'ESTADO OPERACIONAL', ptData.estado_operacional || 'ATIVO', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'DIVISÃO COMERCIAL', ptData.divisao || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'DENOMINAÇÃO DIVISÃO', ptData.denominacao_divisao || 'N/D', 230, currentY, colors);
        this._drawField(doc, 'ANO INSTALAÇÃO', String(ptData.ano_instalacao || 'N/A'), 410, currentY, colors);

        currentY += 60;

        // --- Secção 3: Localização & Infraestrutura ---
        this._drawSectionTitle(doc, 'LOCALIZAÇÃO & INFRAESTRUTURA', currentY, colors);
        currentY += 25;

        this._drawField(doc, 'MUNICÍPIO', ptData.municipio || '---', 50, currentY, colors);
        this._drawField(doc, 'DISTRITO / COMUNA', ptData.distrito_comuna || '---', 230, currentY, colors);
        this._drawField(doc, 'SUBESTAÇÃO ORIGEM', ptData.subestacao?.nome || 'N/A', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'ENDEREÇO / RUA', ptData.rua || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'BAIRRO / ZONA', ptData.bairro || '---', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'GPS (COORDENADAS)', ptData.gps || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'DÍVIDA', `${Number(ptData.montante_divida || 0).toLocaleString('pt-PT')} Kz`, 410, currentY, colors);

        currentY += 70;

        // --- Secção 4: Histórico de Inspeções (Tabela) ---
        this._drawSectionTitle(doc, 'HISTÓRICO RECENTE DE AUDITORIAS', currentY, colors);
        currentY += 25;

        // Cabeçalho da Tabela
        doc.rect(50, currentY, 500, 20).fill('#f9fafb');
        doc.fillColor(colors.primary).fontSize(8).font('Helvetica-Bold');
        doc.text('DATA', 60, currentY + 6);
        doc.text('TIPO DE INSPEÇÃO', 140, currentY + 6);
        doc.text('RESULTADO', 300, currentY + 6);
        doc.text('AUDITOR', 400, currentY + 6);

        currentY += 20;
        doc.font('Helvetica').fontSize(8).fillColor(colors.text);

        const recentInspections = (inspections || []).slice(0, 8);
        if (recentInspections.length > 0) {
          recentInspections.forEach(audit => {
            doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(colors.border).stroke();
            doc.text(new Date(audit.data_inspecao).toLocaleDateString('pt-PT'), 60, currentY + 6);
            doc.text(audit.tipo, 140, currentY + 6);
            doc.text(audit.resultado || 'CONFORME', 300, currentY + 6);
            doc.text(audit.auditor?.nome || 'Sistema', 400, currentY + 6);
            currentY += 20;
          });
        } else {
          doc.fillColor(colors.lightText).text('Nenhuma inspeção registada no sistema para este ativo.', 60, currentY + 10);
        }

        // --- Rodapé ---
        doc.fontSize(8).fillColor(colors.lightText)
          .text('Documento gerado automaticamente pelo sistema de auditoria MBT Energia. Esta ficha técnica constitui um registo oficial de ativo.', 50, 770, { align: 'center', width: 500 });

        doc.end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Métodos auxiliares de desenho
  _drawSectionTitle(doc, title, y, colors) {
    doc.fillColor(colors.accent).fontSize(10).font('Helvetica-Bold').text(title, 50, y);
    doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor(colors.accent).lineWidth(1.5).stroke();
  }

  _drawField(doc, label, value, x, y, colors) {
    doc.fillColor(colors.lightText).fontSize(7).font('Helvetica').text(label, x, y);
    doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold').text(value, x, y + 10);
  }

  async generateAuditReport(auditData, outputPath) {
    // Mantido para compatibilidade se necessário, mas modernizaremos se o usuário pedir
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      doc.fontSize(20).text('Relatório de Auditoria de Posto de Transformação', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Identificador do PT: ${auditData.id_pt}`);
      doc.text(`Data da Inspeção: ${new Date(auditData.data_inspecao).toLocaleDateString('pt-PT')}`);
      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    });
  }
}

module.exports = new PDFGenerator();

