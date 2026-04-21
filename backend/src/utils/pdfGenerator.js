const PDFDocument = require('pdfkit');

class PDFGenerator {
  /**
   * Generates a professional Technical Sheet for a PT (Posto de Transformação)
   * Redesigned for Rev. 01 (10 Sections)
   */
  async generateTechnicalSheet(ptData, inspections, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: `Ficha Técnica - ${ptData.id_pt}`,
            Author: 'Sistema PTAS - MBT Energia',
          }
        });

        doc.pipe(res);

        const colors = {
          primary: '#0f1c2c',    // Deep Blue
          accent: '#0d3fd1',     // Official Blue
          success: '#005229',    // Conform Green
          text: '#444655',
          lightText: '#747686',
          border: '#e5e7eb',
          bgHeader: '#0f1c2c',
          emerald: '#00e47c'
        };

        // --- Header Block ---
        doc.rect(0, 0, doc.page.width, 80).fill(colors.bgHeader);
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('FICHA TÉCNICA DE INFRAESTRUTURA (PT)', 40, 25);
        doc.fillColor(colors.emerald).fontSize(9).font('Helvetica').text('CADASTRO TÉCNICO E AUDITORIA INDUSTRIAL — REV. 01', 40, 50);

        const emissionDate = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        doc.fillColor('#ffffff').fontSize(8).text(`EMISSAO: ${emissionDate}`, 450, 30, { align: 'right' });
        doc.text(`ID PT: ${ptData.id_pt}`, 450, 42, { align: 'right' });

        let currentY = 100;

        // --- 0 & 1: IDENTIFICAÇÃO GERAL ---
        this._drawSectionTitle(doc, '1. IDENTIFICAÇÃO E ENQUADRAMENTO', currentY, colors);
        currentY += 30;

        const col1 = 40, col2 = 220, col3 = 400;
        
        this._drawField(doc, 'PROPRIETÁRIO / NOME', ptData.proprietario?.nome || ptData.designacao || '---', col1, currentY, colors);
        this._drawField(doc, 'OPERADOR / CONCESSÃO', ptData.concessao_operador || '---', col2, currentY, colors);
        this._drawField(doc, 'TIPO DE POSTO', ptData.tipo_instalacao || '---', col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'LOCALIZAÇÃO / MORADA', ptData.morada || '---', col1, currentY, colors);
        this._drawField(doc, 'FREGUESIA / CONCELHO', `${ptData.freguesia || '--'} / ${ptData.concelho || '--'}`, col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'COORDENADAS GPS', `${ptData.latitude || '0'}, ${ptData.longitude || '0'}`, col1, currentY, colors);
        this._drawField(doc, 'ALTITUDE (m)', `${ptData.altitude || '---'} m`, col2, currentY, colors);
        this._drawField(doc, 'CÓDIGO CONCESSIONÁRIA', ptData.id_concessionaria || '---', col3, currentY, colors);

        currentY += 60;

        // --- 2: TRANSFORMADOR ---
        this._drawSectionTitle(doc, '2. ESPECIFICAÇÕES DO TRANSFORMADOR', currentY, colors);
        currentY += 30;

        const tf = ptData.transformadores?.[0] || {};
        this._drawField(doc, 'FABRICANTE', tf.fabricante || '---', col1, currentY, colors);
        this._drawField(doc, 'Nº DE SÉRIE', tf.numero_serie || '---', col2, currentY, colors);
        this._drawField(doc, 'ANO FABRICO', String(tf.ano_fabrico || '---'), col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'POTÊNCIA (kVA)', `${tf.potencia_kva || '0'} kVA`, col1, currentY, colors);
        this._drawField(doc, 'TENSÃO (V)', `${tf.tensao_primaria || '---'}/${tf.tensao_secundaria || '---'} V`, col2, currentY, colors);
        this._drawField(doc, 'GRUPO LIGAÇÃO', tf.grupo_ligacao || '---', col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'ARREFECIMENTO', tf.tipo_arrefecimento || '---', col1, currentY, colors);
        this._drawField(doc, 'Ucc (%)', `${tf.ucc || '---'} %`, col2, currentY, colors);
        this._drawField(doc, 'ISOLAMENTO (kV)', `${tf.nivel_isolamento || '---'} kV`, col3, currentY, colors);

        currentY += 60;

        // --- 3 & 4: INFRAESTRUTURA FÍSICA ---
        this._drawSectionTitle(doc, '3 & 4. INFRAESTRUTURA E MEIO FÍSICO', currentY, colors);
        currentY += 30;

        if (ptData.tipo_instalacao?.includes('PTC') || ptData.tipo_instalacao?.includes('Poste')) {
          this._drawField(doc, 'TIPO DE POSTE', ptData.tipo_poste || '---', col1, currentY, colors);
          this._drawField(doc, 'MATERIAL', ptData.material_poste || '---', col2, currentY, colors);
          this._drawField(doc, 'ALTURA (m)', ptData.altura_poste ? `${ptData.altura_poste} m` : '---', col3, currentY, colors);
          currentY += 40;
          this._drawField(doc, 'ESFORÇO (daN)', ptData.esforco_poste_dan ? `${ptData.esforco_poste_dan} daN` : '---', col1, currentY, colors);
        } else {
          this._drawField(doc, 'TIPO DE CABINE', ptData.tipo_cabine || '---', col1, currentY, colors);
          this._drawField(doc, 'DIMENSÕES (CxL)', `${ptData.dim_comprimento || '--'} x ${ptData.dim_largura || '--'} m`, col2, currentY, colors);
        }

        currentY += 60;

        // --- 5 & 6: MT / BT ---
        this._drawSectionTitle(doc, '5 & 6. QUADROS E PROTEÇÕES (MT / BT)', currentY, colors);
        currentY += 30;

        const mt = ptData.media_tensao || {};
        const bt = ptData.baixa_tensao || {};
        
        this._drawField(doc, 'Nº CELAS MT', String(mt.celas?.length || 0), col1, currentY, colors);
        this._drawField(doc, 'QGBT FABRICANTE', bt.fabricante_qgbt || '---', col2, currentY, colors);
        this._drawField(doc, 'Nº SAÍDAS BT', String(bt.num_saidas_bt || 0), col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'DISJUNTOR GERAL BT', bt.disjuntor_geral ? 'PRESENTE' : 'AUSENTE', col1, currentY, colors);
        this._drawField(doc, 'TIPO DE NEUTRO', bt.tipo_ligacao_neutro || '---', col2, currentY, colors);
        this._drawField(doc, 'CONTAGEM BT', bt.contagem_bt ? 'SIM' : 'NÃO', col3, currentY, colors);

        // Check for page break
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        } else {
          currentY += 60;
        }

        // --- 7: PROTEÇÕES E TERRA ---
        this._drawSectionTitle(doc, '7. SEGURANÇA, PROTEÇÃO E TERRA', currentY, colors);
        currentY += 30;

        const seg = ptData.seguranca || {};
        this._drawField(doc, 'RESISTÊNCIA TERRA', `${seg.resistencia_terra || '---'} ohm`, col1, currentY, colors);
        this._drawField(doc, 'DATA MEDIÇÃO', seg.data_ultima_medicao ? new Date(seg.data_ultima_medicao).toLocaleDateString('pt-PT') : '---', col2, currentY, colors);
        this._drawField(doc, 'RELÉ PROTEÇÃO', seg.rele_protecao_marca || '---', col3, currentY, colors);

        currentY += 40;
        this._drawField(doc, 'PROT. SOBRECORRENTE', seg.protecao_sobrecorrente ? 'SIM' : 'NÃO', col1, currentY, colors);
        this._drawField(doc, 'PROT. DIFERENCIAL', seg.protecao_diferencial ? 'SIM' : 'NÃO', col2, currentY, colors);
        this._drawField(doc, 'FUSÍVEIS MT (A)', seg.fusiveis_mt_calibre || '---', col3, currentY, colors);

        currentY += 60;

        // --- 8: ANOMALIAS ---
        this._drawSectionTitle(doc, '8. ANOMALIAS E OBSERVAÇÕES CRÍTICAS', currentY, colors);
        currentY += 25;

        doc.fillColor(colors.text).fontSize(8).font('Helvetica');
        const obs = ptData.observacoes_gerais || 'Nenhuma anomalia crítica reportada durante o levantamento.';
        doc.text(obs, 40, currentY, { width: 500, align: 'justify' });

        currentY += 100;

        // --- 9: VALIDAÇÃO ---
        this._drawSectionTitle(doc, '9. VALIDAÇÃO TÉCNICA', currentY, colors);
        currentY += 30;

        doc.rect(40, currentY, 240, 100).strokeColor(colors.border).stroke();
        doc.text('TECNICO EXECUTANTE', 50, currentY + 10);
        doc.font('Helvetica-Bold').text(ptData.tecnico_levantamento || '---', 50, currentY + 25);
        doc.fontSize(7).font('Helvetica').text('Assinatura Eletrónica / Carimbo', 50, currentY + 80);

        doc.rect(300, currentY, 240, 100).strokeColor(colors.border).stroke();
        doc.text('SUPERVISOR / RESPONSÁVEL', 310, currentY + 10);
        doc.font('Helvetica-Bold').text(ptData.supervisor_obra || '---', 310, currentY + 25);
        doc.fontSize(7).font('Helvetica').text('Assinatura Eletrónica / Carimbo', 310, currentY + 80);

        // Footer
        doc.fontSize(7).fillColor(colors.lightText)
           .text('Este documento é um registo eletrónico oficial gerado pelo Sistema PTAS MBT. A integridade dos dados é de responsabilidade dos técnicos validadores.', 40, 770, { align: 'center', width: 500 });
        
        doc.end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Helper methods
  _drawSectionTitle(doc, title, y, colors) {
    doc.fillColor(colors.accent).fontSize(9).font('Helvetica-Bold').text(title, 40, y);
    doc.moveTo(40, y + 14).lineTo(550, y + 14).strokeColor(colors.accent).lineWidth(1.2).stroke();
  }

  _drawField(doc, label, value, x, y, colors) {
    doc.fillColor(colors.lightText).fontSize(7).font('Helvetica').text(label, x, y);
    doc.fillColor(colors.primary).fontSize(8.5).font('Helvetica-Bold').text(value, x, y + 12);
  }

  // generateAuditReport stays similar but focuses on the inspection event
  async generateAuditReport(auditData, res) {
    // Legacy support or specific audit report logic here
    // For now, I'll keep it as is or redirect to the technical sheet pattern
    return this.generateTechnicalSheet(auditData.pt, [], res);
  }
}

module.exports = new PDFGenerator();
