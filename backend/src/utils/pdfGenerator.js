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

        // --- Secção 1: Ficha Técnica do Ativo (PT) ---
        this._drawSectionTitle(doc, 'FICHA TÉCNICA DO ATIVO (PT)', currentY, colors);
        currentY += 25;

        this._drawField(doc, 'POTÊNCIA NOMINAL', `${ptData.potencia_kva || '0'} kVA`, 50, currentY, colors);
        this._drawField(doc, 'NÍVEL DE TENSÃO', ptData.nivel_tensao || 'MT/BT', 230, currentY, colors);
        this._drawField(doc, 'ESTADO OPERACIONAL', ptData.estado_operacional || 'ATIVO', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'TIPO INSTALAÇÃO', ptData.tipo_instalacao || '---', 50, currentY, colors);
        this._drawField(doc, 'ANO INSTALAÇÃO', String(ptData.ano_instalacao || 'N/A'), 230, currentY, colors);
        this._drawField(doc, 'SUBESTAÇÃO ORIGEM', ptData.subestacao?.nome || 'N/A', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'MUNICÍPIO / PROVÍNCIA', `${ptData.municipio || '---'} / ${ptData.provincia || '---'}`, 50, currentY, colors);
        this._drawField(doc, 'BAIRRO', ptData.bairro || ptData.distrito_comuna || '---', 230, currentY, colors);

        const coords = ptData.latitude != null ? `${ptData.latitude.toFixed(6)}, ${ptData.longitude.toFixed(6)}` : 'N/D';
        this._drawField(doc, 'COORDENADAS GPS', coords, 410, currentY, colors);

        currentY += 60;

        // --- Secção 2: Dados Comerciais do Cliente ---
        this._drawSectionTitle(doc, 'DADOS COMERCIAIS DO CLIENTE', currentY, colors);
        currentY += 25;

        this._drawField(doc, 'PROPRIETÁRIO / DONO', ptData.proprietario || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'RESP. TÉCNICO', ptData.responsavel_tecnico_cliente || 'N/D', 230, currentY, colors);
        this._drawField(doc, 'CONTA CONTRATO', ptData.conta_contrato || 'N/A', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'TIPO DE CLIENTE', ptData.tipo_cliente || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'PARCEIRO NEGÓCIOS', ptData.parceiro_negocios || '---', 230, currentY, colors);
        this._drawField(doc, 'DÍVIDA VENCIDA', `${Number(ptData.montante_divida || 0).toLocaleString('pt-PT')} Kz`, 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'DIVISÃO COMERCIAL', ptData.divisao || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'DENOMINAÇÃO DIVISÃO', ptData.denominacao_divisao || 'N/D', 230, currentY, colors);
        this._drawField(doc, 'EMPRESA MANUTENÇÃO', ptData.empresa_manutencao || 'N/A', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'RESP. FINANCEIRO', ptData.responsavel_financeiro || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'CONTACTO FINANCEIRO', ptData.contacto_resp_financeiro || 'N/D', 230, currentY, colors);
        this._drawField(doc, 'CONTACTO TÉCNICO', ptData.contacto_resp_tecnico || 'N/D', 410, currentY, colors);

        currentY += 45;
        this._drawField(doc, 'CANAL FATURAÇÃO', ptData.canal_faturacao || 'N/D', 50, currentY, colors);
        this._drawField(doc, 'FORNECE TERCEIROS', ptData.fornece_terceiros ? 'SIM' : 'NÃO', 230, currentY, colors);
        this._drawField(doc, 'ÚLT. MANUTENÇÃO', ptData.data_ultima_manutencao ? new Date(ptData.data_ultima_manutencao).toLocaleDateString('pt-PT') : 'N/A', 410, currentY, colors);


        currentY += 70;

        // --- Secção 3: Histórico de Inspeções (Tabela) ---
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

  async generateAuditReport(auditData, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: `Relatório de Inspeção - ${auditData.id_pt}`,
            Author: 'Sistema PTAS - MBT Energia',
          }
        });

        // Pipe directly to HTTP response
        doc.pipe(res);

        const colors = {
          primary: '#0f1c2c',
          accent: '#0d3fd1',
          text: '#444655',
          border: '#000000',
          lightBg: '#f9fafb'
        };

        const pt = auditData.pt || {};
        const isPTC = pt.tipo_instalacao === 'CABINADO';
        const tipoDesc = isPTC ? 'POSTO DE TRANSFORMAÇÃO - CABINADO' : 'POSTO DE TRANSFORMAÇÃO - AÉREO';

        // --- Cabeçalho TIPO DOCX ---
        doc.fontSize(10).font('Helvetica-Bold').text(`RELATÓRIO DE INSPECÇÃO Nº : ${auditData.id}`, { align: 'right' });
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica-Bold').text(tipoDesc, { align: 'center', underline: true });
        doc.moveDown(1.5);

        let currentY = doc.y;

        doc.fontSize(10).font('Helvetica-Bold').text('Entidade:', 50, currentY);
        doc.font('Helvetica').text(pt.proprietario || pt.subestacao?.nome || 'N/D', 110, currentY);

        currentY += 15;
        doc.font('Helvetica-Bold').text('Técnico Executante:', 50, currentY);
        doc.font('Helvetica').text(auditData.auditor?.nome || 'N/D', 160, currentY);

        currentY += 15;
        doc.font('Helvetica-Bold').text('Data:', 50, currentY);
        doc.font('Helvetica').text(new Date(auditData.data_inspecao).toLocaleDateString('pt-PT'), 90, currentY);

        const lat = pt.latitude != null ? pt.latitude.toFixed(6) : '---';
        const lon = pt.longitude != null ? pt.longitude.toFixed(6) : '---';

        const localidade = [pt.bairro, pt.municipio].filter(Boolean).join(' / ') || '---';

        doc.font('Helvetica-Bold').text('Localidade:', 240, currentY);
        doc.font('Helvetica').text(localidade, 300, currentY);

        doc.font('Helvetica-Bold').text('Lat:', 410, currentY);
        doc.font('Helvetica').text(lat, 435, currentY);

        doc.font('Helvetica-Bold').text('Long:', 490, currentY);
        doc.font('Helvetica').text(lon, 525, currentY);

        doc.moveDown(2);

        // Helper para grelhas
        const drawGridHeaders = (y) => {
          const startX = 50;
          doc.rect(startX, y, 495, 20).fill(colors.lightBg);
          doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold');
          doc.text('Critérios / Componentes', startX + 5, y + 6);

          doc.text('OK', startX + 310, y + 6);
          doc.text('A', startX + 340, y + 6);
          doc.text('B', startX + 370, y + 6);
          doc.text('C', startX + 400, y + 6);
          doc.text('NA', startX + 430, y + 6);
          doc.text('Obs', startX + 460, y + 6);

          doc.rect(startX, y, 495, 20).strokeColor(colors.border).lineWidth(0.5).stroke();

          return y + 20;
        };

        const drawRow = (text, value, itemPrio, y) => {
          const startX = 50;
          doc.rect(startX, y, 495, 20).strokeColor(colors.border).lineWidth(0.5).stroke();

          doc.fillColor(colors.text).fontSize(8).font('Helvetica');
          doc.text(text, startX + 5, y + 6, { width: 300, height: 12, ellipsis: true });

          // Draw dividing lines
          doc.moveTo(startX + 300, y).lineTo(startX + 300, y + 20).stroke();
          doc.moveTo(startX + 330, y).lineTo(startX + 330, y + 20).stroke();
          doc.moveTo(startX + 360, y).lineTo(startX + 360, y + 20).stroke();
          doc.moveTo(startX + 390, y).lineTo(startX + 390, y + 20).stroke();
          doc.moveTo(startX + 420, y).lineTo(startX + 420, y + 20).stroke();
          doc.moveTo(startX + 450, y).lineTo(startX + 450, y + 20).stroke();

          // Render value logic: OK/A/B/C/NA or just a tick mark
          const markCol = (colIdx) => {
            doc.font('Helvetica-Bold').fontSize(10).text('X', startX + colIdx, y + 6);
          };

          const resStr = String(value || '').toLowerCase();
          if (resStr === 'na') {
            markCol(435);
          } else if (resStr === 'ok') {
            markCol(315);
          } else if (resStr === 'nc') {
            if (itemPrio === 'A') markCol(345);
            else if (itemPrio === 'B') markCol(375);
            else markCol(405);
          }

          return y + 20;
        };

        const drawCategoryHeading = (title, y) => {
          const startX = 50;
          doc.rect(startX, y, 495, 20).fill('#e5e7eb');
          doc.fillColor(colors.primary).fontSize(9).font('Helvetica-Bold');
          doc.text(title, startX + 5, y + 6);
          doc.rect(startX, y, 495, 20).strokeColor(colors.border).lineWidth(0.5).stroke();
          return y + 20;
        };

        // --- TABELA PRINCIPAL DE INSPECÇÃO (DINÂMICA) ---
        let tblY = doc.y;
        tblY = drawGridHeaders(tblY);

        const checklist = auditData.tarefa?.checklist || [];

        if (checklist.length > 0) {
          // Group by section
          const secoes = [...new Set(checklist.map(i => i.secao))];
          secoes.forEach(secao => {
            const items = checklist.filter(i => i.secao === secao);

            // Check for page break
            if (tblY > 700) {
              doc.addPage();
              tblY = 50;
              tblY = drawGridHeaders(tblY);
            }

            tblY = drawCategoryHeading(secao, tblY);
            items.forEach(item => {
              // Row break
              if (tblY > 750) {
                doc.addPage();
                tblY = 50;
                tblY = drawGridHeaders(tblY);
              }
              tblY = drawRow(item.label, item.resultado, item.prio, tblY);
            });
          });
        } else {
          // Fallback simple rows if no checklist
          tblY = drawCategoryHeading('Inspecção Geral', tblY);
          tblY = drawRow('Resultado Geral da Auditoria', auditData.resultado === 'Conforme' ? 'ok' : 'nc', 'C', tblY);
        }

        doc.moveDown(2);
        const tf = auditData.transformadores?.[0] || {};

        // --- DADOS DO TRANSFORMADOR ---
        currentY = tblY + 20;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.primary);
        doc.text('DADOS DO TRANSFORMADOR', 50, currentY);
        currentY += 20;

        // Box
        doc.rect(50, currentY, 495, 40).stroke();
        doc.fontSize(8);
        doc.text('Nº TRANSFORMADOR:', 55, currentY + 5); doc.font('Helvetica').text(tf.num_transformador || '---', 55, currentY + 15);

        doc.font('Helvetica-Bold').text('TIPO:', 180, currentY + 5); doc.font('Helvetica').text(tf.tipo_isolamento || '---', 180, currentY + 15);

        doc.font('Helvetica-Bold').text('POTENCIA:', 300, currentY + 5); doc.font('Helvetica').text(tf.potencia_kva ? `${tf.potencia_kva} kVA` : '---', 300, currentY + 15);

        doc.font('Helvetica-Bold').text('ANO:', 420, currentY + 5); doc.font('Helvetica').text(pt.ano_instalacao || '---', 420, currentY + 15);

        // --- RELATORIO DE MEDIÇÃO TERRA ---
        currentY += 60;
        doc.fontSize(10).font('Helvetica-Bold').text('RELATORIO DE MEDIÇÃO TERRA', 50, currentY);
        currentY += 20;

        doc.rect(50, currentY, 495, 30).stroke();

        doc.fontSize(9).font('Helvetica-Bold').text('Terra de Protecção (TP):', 60, currentY + 10);
        doc.font('Helvetica').text(`${auditData.terra_protecao || 'N/A'} Ω`, 180, currentY + 10);

        doc.font('Helvetica-Bold').text('Terra de Serviço (TS):', 250, currentY + 10);
        doc.font('Helvetica').text(`${auditData.terra_servico || 'N/A'} Ω`, 370, currentY + 10);

        // --- INCONGRUÊNCIAS DETECTADAS ---
        if (auditData.incongruencias && auditData.incongruencias.length > 0) {
          currentY += 60;
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#red').text('INCONGRUÊNCIAS DETECTADAS', 50, currentY);
          doc.fillColor(colors.primary);
          currentY += 20;

          auditData.incongruencias.forEach(inc => {
            doc.fontSize(8).font('Helvetica-Bold').text(`• ${inc.descricao}`, 60, currentY);
            doc.font('Helvetica').text(`  Sistema: ${inc.valor_cadastro || 'N/A'} | Campo: ${inc.valor_apurado || 'N/A'}`, 60, currentY + 10);
            currentY += 25;

            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }
          });
        }

        // --- ASSINATURA DO CLIENTE ---
        currentY = Math.max(currentY + 40, 700);
        if (currentY > 750) {
          doc.addPage();
          currentY = 700;
        }

        doc.moveTo(150, currentY).lineTo(395, currentY).stroke();
        doc.fontSize(9).font('Helvetica-Bold').text('ASSINATURA DO CLIENTE', 50, currentY + 10, { align: 'center', width: 495 });

        doc.end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new PDFGenerator();

