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
        currentY += 25;

        const col1 = 40, col2 = 220, col3 = 400;

        this._drawField(doc, 'PROPRIETÁRIO / NOME', ptData.proprietario?.nome || ptData.designacao || '---', col1, currentY, colors);
        this._drawField(doc, 'SUBESTAÇÃO ORIGEM', ptData.subestacao?.nome || '---', col2, currentY, colors);
        this._drawField(doc, 'TIPO DE POSTO', ptData.tipo_instalacao || '---', col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'LOCALIZAÇÃO / MORADA', ptData.morada || ptData.localizacao || '---', col1, currentY, colors);
        this._drawField(doc, 'MUNICÍPIO / PROVÍNCIA', `${ptData.municipio || '--'} / ${ptData.provincia || '--'}`, col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'COORDENADAS GPS', ptData.gps || (ptData.latitude ? `${ptData.latitude}, ${ptData.longitude}` : '---'), col1, currentY, colors);
        this._drawField(doc, 'NÍVEL TENSÃO', ptData.nivel_tensao || '---', col2, currentY, colors);
        this._drawField(doc, 'STATUS LEGAL', ptData.status_legal || 'EM AVALIAÇÃO', col3, currentY, colors);

        currentY += 50;

        // --- 2: TRANSFORMADOR ---
        this._drawSectionTitle(doc, '2. ESPECIFICAÇÕES DO TRANSFORMADOR', currentY, colors);
        currentY += 25;

        const tf = (ptData.transformadores && ptData.transformadores.length > 0) ? ptData.transformadores[0] : ptData;

        this._drawField(doc, 'FABRICANTE', tf.fabricante || '---', col1, currentY, colors);
        this._drawField(doc, 'Nº DE SÉRIE', tf.num_serie || tf.numero_serie || '---', col2, currentY, colors);
        this._drawField(doc, 'ANO FABRICO / INST.', String(tf.ano_fabrico || tf.ano_instalacao || '---'), col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'POTÊNCIA (kVA)', `${tf.potencia_kva || '0'} kVA`, col1, currentY, colors);
        this._drawField(doc, 'TENSÃO (V)', (tf.tensao_primaria && tf.tensao_secundaria) ? `${tf.tensao_primaria}/${tf.tensao_secundaria} V` : '---', col2, currentY, colors);
        this._drawField(doc, 'GRUPO LIGAÇÃO', tf.grupo_ligacao || '---', col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'ARREFECIMENTO', tf.tipo_arrefecimento || '---', col1, currentY, colors);
        this._drawField(doc, 'Ucc (%)', tf.ucc ? `${tf.ucc} %` : '---', col2, currentY, colors);
        this._drawField(doc, 'TIPO ISOLAMENTO', tf.tipo_isolamento || '---', col3, currentY, colors);

        currentY += 50;

        // --- 2.1 CONTADOR ---
        if (ptData.contador) {
          const cont = ptData.contador;
          this._drawSectionTitle(doc, '2.1 DADOS DO CONTADOR INSTALADO', currentY, colors);
          currentY += 25;

          this._drawField(doc, 'MARCA / MODELO', `${cont.marca || '---'} / ${cont.modelo || '---'}`, col1, currentY, colors);
          this._drawField(doc, 'TIPO ENERGIA', cont.tipo_energia || '---', col2, currentY, colors);
          this._drawField(doc, 'ÚLTIMA LEITURA', cont.leitura != null ? `${cont.leitura} kWh` : '---', col3, currentY, colors);

          if (cont.ponta_tomada && Array.isArray(cont.ponta_tomada) && cont.ponta_tomada.length > 0) {
            currentY += 35;
            doc.fillColor(colors.lightText).fontSize(7).font('Helvetica-Bold').text('PONTAS DE TOMADA / REGISTOS:', col1, currentY);
            currentY += 12;
            cont.ponta_tomada.forEach((ptReg, idx) => {
              doc.fillColor(colors.text).fontSize(8).font('Helvetica').text(`• ${ptReg.tipo}: ${ptReg.obs || '(sem observação)'}`, col1 + 10, currentY);
              currentY += 12;
              if (currentY > 750) { doc.addPage(); currentY = 50; }
            });
          }
          currentY += 50;
        }

        // --- 3 & 4: INFRAESTRUTURA FÍSICA ---
        this._drawSectionTitle(doc, '3 & 4. INFRAESTRUTURA E MEIO FÍSICO', currentY, colors);
        currentY += 25;

        const isPoste = ptData.tipo_instalacao?.toLowerCase().includes('poste') || ptData.tipo_instalacao?.toLowerCase().includes('ptc');

        if (isPoste) {
          this._drawField(doc, 'TIPO DE POSTE', ptData.tipo_poste || '---', col1, currentY, colors);
          this._drawField(doc, 'MATERIAL', ptData.material_poste || '---', col2, currentY, colors);
          this._drawField(doc, 'ALTURA (m)', ptData.altura_poste ? `${ptData.altura_poste} m` : '---', col3, currentY, colors);
          currentY += 35;
          this._drawField(doc, 'ESFORÇO (daN)', ptData.esforco_poste_dan ? `${ptData.esforco_poste_dan} daN` : '---', col1, currentY, colors);
          this._drawField(doc, 'ESTADO POSTE', ptData.estado_poste || '---', col2, currentY, colors);
        } else {
          this._drawField(doc, 'TIPO DE CABINE', ptData.tipo_cabine || '---', col1, currentY, colors);
          this._drawField(doc, 'DIMENSÕES (CxL)', (ptData.dim_comprimento && ptData.dim_largura) ? `${ptData.dim_comprimento} x ${ptData.dim_largura} m` : '---', col2, currentY, colors);
          this._drawField(doc, 'ESTADO ESTRUTURA', ptData.infraestrutura?.estado_cabine || '---', col3, currentY, colors);
        }

        currentY += 50;

        // --- 5 & 6: MT / BT ---
        this._drawSectionTitle(doc, '5 & 6. QUADROS E PROTEÇÕES (MT / BT)', currentY, colors);
        currentY += 25;

        const mt = ptData.media_tensao || {};
        const bt = ptData.baixa_tensao || {};

        this._drawField(doc, 'TIPO CELAS MT', mt.tipo_celas || '---', col1, currentY, colors);
        this._drawField(doc, 'QGBT FABRICANTE', bt.fabricante_qgbt || '---', col2, currentY, colors);
        this._drawField(doc, 'Nº SAÍDAS BT', String(bt.num_saidas_bt || 0), col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'DISJUNTOR GERAL BT', bt.disjuntor_geral ? 'PRESENTE' : 'AUSENTE', col1, currentY, colors);
        this._drawField(doc, 'TIPO DE NEUTRO', bt.tipo_ligacao_neutro || '---', col2, currentY, colors);
        this._drawField(doc, 'CONTAGEM BT', bt.contagem_bt ? 'SIM' : 'NÃO', col3, currentY, colors);

        // Conditional Page Break
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
        } else {
          currentY += 50;
        }

        // --- 7: PROTEÇÕES E TERRA ---
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }
        this._drawSectionTitle(doc, '7. SEGURANÇA, PROTEÇÃO E TERRA', currentY, colors);
        currentY += 25;

        const seg = ptData.seguranca || {};
        this._drawField(doc, 'RESISTÊNCIA TERRA', seg.resistencia_terra ? `${seg.resistencia_terra} ohm` : '---', col1, currentY, colors);
        this._drawField(doc, 'DATA MEDIÇÃO', seg.data_ultima_medicao ? new Date(seg.data_ultima_medicao).toLocaleDateString('pt-PT') : '---', col2, currentY, colors);
        this._drawField(doc, 'RELÉ PROTEÇÃO', seg.rele_protecao_marca || '---', col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'PROT. SOBRECORRENTE', seg.protecao_sobrecorrente ? 'SIM' : 'NÃO', col1, currentY, colors);
        this._drawField(doc, 'PROT. DIFERENCIAL', seg.protecao_diferencial ? 'SIM' : 'NÃO', col2, currentY, colors);
        this._drawField(doc, 'FUSÍVEIS MT (A)', seg.fusiveis_mt_calibre || '---', col3, currentY, colors);

        currentY += 50;

        // --- 8: ANOMALIAS ---
        if (currentY > 680) {
          doc.addPage();
          currentY = 50;
        }
        this._drawSectionTitle(doc, '8. ANOMALIAS E OBSERVAÇÕES CRÍTICAS', currentY, colors);
        currentY += 20;

        doc.fillColor(colors.text).fontSize(8).font('Helvetica');
        const obs = ptData.observacoes_gerais || 'Nenhuma anomalia crítica reportada durante o levantamento.';
        doc.text(obs, 40, currentY, { width: 500, align: 'justify' });

        // Ensure validation is always visible, maybe push to next page if tight
        if (currentY > 600) {
          doc.addPage();
          currentY = 50;
        } else {
          currentY += 60;
        }

        // --- 9: VALIDAÇÃO ---
        this._drawSectionTitle(doc, '9. VALIDAÇÃO TÉCNICA', currentY, colors);
        currentY += 25;

        doc.rect(40, currentY, 240, 80).strokeColor(colors.border).stroke();
        doc.text('TECNICO EXECUTANTE', 50, currentY + 10);
        doc.font('Helvetica-Bold').text(ptData.tecnico_levantamento || '---', 50, currentY + 25);
        doc.fontSize(7).font('Helvetica').text('Assinatura Eletrónica / Carimbo', 50, currentY + 65);

        doc.rect(300, currentY, 240, 80).strokeColor(colors.border).stroke();
        doc.text('SUPERVISOR / RESPONSÁVEL', 310, currentY + 10);
        doc.font('Helvetica-Bold').text(ptData.supervisor_obra || '---', 310, currentY + 25);
        doc.fontSize(7).font('Helvetica').text('Assinatura Eletrónica / Carimbo', 310, currentY + 65);

        // Footer
        doc.fontSize(7).fillColor(colors.lightText)
          .text('Este documento é um registo eletrónico oficial gerado pelo Sistema PTAS MBT. A integridade dos dados é de responsabilidade dos técnicos validadores.', 40, 785, { align: 'center', width: 500 });

        doc.end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- FICHA DO CLIENTE (COMMERCIAL/SUMMARY) ---
  async generateClientSheet(clientData, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: `Ficha do Cliente - ${clientData.nome}`,
            Author: 'Sistema PTAS - MBT Energia',
          }
        });

        doc.pipe(res);

        const colors = {
          primary: '#0f1c2c',
          accent: '#7c3aed', // Purple for Client/Commercial
          danger: '#dc2626',
          success: '#16a34a',
          text: '#444655',
          lightText: '#747686',
          border: '#e5e7eb',
          bgHeader: '#0f1c2c'
        };

        // --- Header ---
        doc.rect(0, 0, doc.page.width, 80).fill(colors.bgHeader);
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('FICHA DE CADASTRO COMERCIAL (CLIENTE)', 40, 25);
        doc.fillColor('#a78bfa').fontSize(9).font('Helvetica').text('GESTAO DE ACTIVOS E PERFIL COMERCIAL — REV. 01', 40, 50);

        const emissionDate = new Date().toLocaleDateString('pt-PT');
        doc.fillColor('#ffffff').fontSize(8).text(`EMISSAO: ${emissionDate}`, 450, 35, { align: 'right' });

        let currentY = 100;

        // --- 1. DADOS DE IDENTIFICAÇÃO ---
        this._drawSectionTitle(doc, '1. IDENTIFICAÇÃO DO CLIENTE', currentY, colors);
        currentY += 25;

        const col1 = 40, col2 = 220, col3 = 400;
        this._drawField(doc, 'NOME / RAZÃO SOCIAL', clientData.nome || '---', col1, currentY, colors);
        this._drawField(doc, 'NIF', clientData.nif || '---', col2, currentY, colors);
        this._drawField(doc, 'TIPO DE CLIENTE', clientData.tipo_cliente || '---', col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'TELEFONE', clientData.telefone || '---', col1, currentY, colors);
        this._drawField(doc, 'E-MAIL', clientData.email || '---', col2, currentY, colors);
        this._drawField(doc, 'CONTA CONTRATO', clientData.conta_contrato || '---', col3, currentY, colors);

        currentY += 50;

        // --- 2. SITUAÇÃO FINANCEIRA ---
        this._drawSectionTitle(doc, '2. PERFIL COMERCIAL E FINANCEIRO', currentY, colors);
        currentY += 25;

        const divida = Number(clientData.montante_divida || 0);
        this._drawField(doc, 'DÍVIDA TOTAL', `${divida.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz`, col1, currentY, colors);
        this._drawField(doc, 'FATURAS EM ATRASO', String(clientData.num_facturas_atraso || 0), col2, currentY, colors);
        this._drawField(doc, 'CATEGORIA TARIFÁRIA', clientData.categoria_tarifa || '---', col3, currentY, colors);

        currentY += 35;
        this._drawField(doc, 'ZONA / ÁREA COMERCIAL', clientData.zona || '---', col1, currentY, colors);
        this._drawField(doc, 'RESPONSÁVEL FINANCEIRO', clientData.responsavel_financeiro || '---', col2, currentY, colors);
        this._drawField(doc, 'CONTACTO FINANCEIRO', clientData.contacto_resp_financeiro || '---', col3, currentY, colors);

        currentY += 50;

        // --- 3. ATIVOS TÉCNICOS ASSOCIADOS ---
        this._drawSectionTitle(doc, '3. RELAÇÃO DE ATIVOS TÉCNICOS (PTs)', currentY, colors);
        currentY += 25;

        // Table Header
        doc.fillColor(colors.lightText).fontSize(7).font('Helvetica-Bold');
        doc.text('CÓDIGO PT', 40, currentY);
        doc.text('POTÊNCIA', 120, currentY);
        doc.text('LOCALIZAÇÃO', 200, currentY);
        doc.text('ESTADO OPERACIONAL', 400, currentY);

        currentY += 12;
        doc.moveTo(40, currentY).lineTo(550, currentY).strokeColor(colors.border).lineWidth(0.5).stroke();
        currentY += 10;

        doc.font('Helvetica').fontSize(8).fillColor(colors.primary);
        (clientData.pts || []).forEach(pt => {
          if (currentY > 720) {
            doc.addPage();
            currentY = 50;
          }
          doc.text(pt.id_pt, 40, currentY);
          doc.text(`${pt.potencia_kva} kVA`, 120, currentY);
          doc.text(pt.bairro || pt.municipio || '---', 200, currentY, { width: 180, truncate: true });
          doc.text(pt.estado_operacional || '---', 400, currentY);
          currentY += 20;
        });

        if (!clientData.pts?.length) {
          doc.fillColor(colors.lightText).text('Nenhum ativo técnico associado a este cliente.', 40, currentY, { italic: true });
          currentY += 20;
        }

        // Footer
        doc.fontSize(7).fillColor(colors.lightText)
          .text('Documento gerado automaticamente pelo Sistema PTAS MBT. Dados sujeitos a confirmação em auditoria de campo.', 40, 785, { align: 'center', width: 500 });

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

  /**
   * Generates a detailed Audit Report for a specific inspection
   */
  async generateAuditReport(auditData, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: `Relatório de Auditoria - ${auditData.pt?.id_pt || 'N/D'}`,
            Author: 'Sistema PTAS - MBT Energia',
          }
        });

        doc.pipe(res);

        const colors = {
          primary: '#0f1c2c',
          accent: '#0d3fd1',
          success: '#059669',
          danger: '#dc2626',
          warning: '#d97706',
          info: '#2563eb',
          text: '#444655',
          lightText: '#747686',
          border: '#e5e7eb',
          bgHeader: '#0f1c2c',
          white: '#ffffff'
        };

        // Header
        doc.rect(0, 0, doc.page.width, 100).fill(colors.bgHeader);
        doc.fillColor(colors.white).fontSize(20).font('Helvetica-Bold').text('RELATÓRIO DE AUDITORIA TÉCNICA', 40, 30);
        doc.fillColor('#00e47c').fontSize(10).font('Helvetica').text('POSTO DE TRANSFORMAÇÃO (PT) — MBT ENERGIA', 40, 60);

        const auditDate = new Date(auditData.data_inspecao).toLocaleDateString('pt-PT');
        doc.fillColor(colors.white).fontSize(9).text(`DATA DA AUDITORIA: ${auditDate}`, 400, 30, { align: 'right' });
        doc.text(`ID INSPEÇÃO: #${auditData.id}`, 400, 45, { align: 'right' });
        doc.text(`AUDITOR: ${auditData.auditor?.nome || 'Sistema'}`, 400, 60, { align: 'right' });

        let currentY = 120;

        // 1. RESULTADO DA LEGALIDADE (Destaque)
        const statusColors = {
          'Legal': colors.success,
          'Não Legal': colors.danger,
          'Legal com Inconformidades': colors.warning,
          'Em Avaliação': colors.info
        };
        const statusColor = statusColors[auditData.resultado] || colors.info;

        doc.rect(40, currentY, 515, 40).fill(statusColor);
        doc.fillColor(colors.white).fontSize(10).font('Helvetica-Bold').text('STATUS DE LEGALIDADE:', 55, currentY + 15);
        doc.fontSize(14).text(auditData.resultado?.toUpperCase() || 'EM AVALIAÇÃO', 200, currentY + 13);

        currentY += 60;

        // 2. IDENTIFICAÇÃO DO ATIVO
        this._drawSectionTitle(doc, '1. IDENTIFICAÇÃO DO ATIVO', currentY, colors);
        currentY += 25;

        const col1 = 40, col2 = 220, col3 = 400;
        const pt = auditData.pt || {};

        this._drawField(doc, 'ID DO PT', pt.id_pt || '---', col1, currentY, colors);
        this._drawField(doc, 'SUBESTAÇÃO', pt.subestacao?.nome || '---', col3, currentY, colors);
        currentY += 35;
        // Proprietário on its own row with more horizontal space to avoid overflow
        doc.fillColor(colors.lightText).fontSize(7).font('Helvetica').text('PROPRIETÁRIO / CLIENTE', col1, currentY);
        doc.fillColor(colors.primary).fontSize(8.5).font('Helvetica-Bold').text(
          pt.proprietario?.nome || pt.designacao || '---',
          col1, currentY + 12,
          { width: 500, ellipsis: true }
        );
        currentY += 40;

        // 3. CONFRONTO DE DADOS (CADASTRO VS CAMPO)
        this._drawSectionTitle(doc, '2. CONFRONTO DE DADOS (CADASTRO VS CAMPO)', currentY, colors);
        currentY += 25;

        const confrontationRows = [
          { label: 'Proprietário', original: pt.proprietario?.nome || '---', audit: auditData.cliente_edits?.proprietario || auditData.pt_info_edits?.proprietario },
          { label: 'Localidade', original: pt.municipio || '---', audit: auditData.pt_info_edits?.municipio },
          { label: 'GPS / Coordenadas', original: pt.gps || '---', audit: auditData.pt_info_edits?.gps },
          { label: 'Potência Instalada', original: pt.potencia_instalada || '---', audit: auditData.pt_info_edits?.potencia_instalada },
          { label: 'Conta Contrato', original: pt.proprietario?.conta_contrato || '---', audit: auditData.cliente_edits?.conta_contrato }
        ].filter(r => r.audit && r.audit !== r.original); // Só mostrar o que foi editado/confrontado e que seja diferente

        if (confrontationRows.length > 0) {
          doc.fillColor(colors.lightText).fontSize(7).font('Helvetica-Bold');
          doc.text('ATRIBUTO', 40, currentY);
          doc.text('DADO EM CADASTRO', 180, currentY);
          doc.text('DADO APURADO EM CAMPO', 380, currentY);
          currentY += 12;
          doc.moveTo(40, currentY).lineTo(550, currentY).strokeColor(colors.border).lineWidth(0.5).stroke();
          currentY += 10;

          confrontationRows.forEach(row => {
            if (currentY > 750) { doc.addPage(); currentY = 50; }
            doc.fillColor(colors.text).fontSize(8).font('Helvetica-Bold').text(row.label.toUpperCase(), 40, currentY);
            doc.fillColor(colors.lightText).font('Helvetica').text(String(row.original), 180, currentY);
            doc.fillColor(colors.accent).font('Helvetica-Bold').text(String(row.audit), 380, currentY);
            currentY += 18;
          });
        } else {
          doc.fillColor(colors.lightText).fontSize(8).font('Helvetica-Oblique').text('Nenhuma divergência de cadastro detectada ou editada.', 40, currentY);
          currentY += 20;
        }

        currentY += 20;

        // 2.1 DADOS DO CONTADOR
        if (auditData.contador && auditData.contador.length > 0) {
          const cont = auditData.contador[0];
          this._drawSectionTitle(doc, '2.1 DADOS DO CONTADOR', currentY, colors);
          currentY += 25;

          if (!cont.tem_contagem) {
            doc.fillColor(colors.danger).fontSize(9).font('Helvetica-Bold').text('CONTAGEM NÃO REALIZADA', col1, currentY);
            currentY += 15;
            doc.fillColor(colors.text).fontSize(8).font('Helvetica-Oblique').text(`Justificativa: ${cont.como_contagem || 'Não informada'}`, col1, currentY);
            currentY += 30;
          } else {
            this._drawField(doc, 'MARCA / MODELO', `${cont.marca || '---'} / ${cont.modelo || '---'}`, col1, currentY, colors);
            this._drawField(doc, 'TIPO ENERGIA', cont.tipo_energia || '---', col2, currentY, colors);
            this._drawField(doc, 'LEITURA (kWh)', cont.leitura != null ? `${cont.leitura} kWh` : '---', col3, currentY, colors);

            currentY += 45;
            if (cont.ponta_tomada && Array.isArray(cont.ponta_tomada) && cont.ponta_tomada.length > 0) {
              doc.fillColor(colors.lightText).fontSize(7).font('Helvetica-Bold').text('PONTAS DE TOMADA / REGISTOS:', col1, currentY);
              currentY += 12;
              cont.ponta_tomada.forEach((pt, idx) => {
                doc.fillColor(colors.text).fontSize(8).font('Helvetica').text(`• ${pt.tipo}: ${pt.obs || '(sem observação)'}`, col1 + 10, currentY);
                currentY += 12;
                if (currentY > 750) { doc.addPage(); currentY = 50; }
              });
              currentY += 10;
            }
          }
        }

        currentY += 20;

        // 4. CHECKLIST TÉCNICA (Itens de Inspeção)
        if (currentY > 600) { doc.addPage(); currentY = 50; }
        this._drawSectionTitle(doc, '3. CHECKLIST TÉCNICA E ESTADO DA INFRAESTRUTURA', currentY, colors);
        currentY += 25;

        const checklist = auditData.tarefa?.checklist || [];
        if (checklist.length > 0) {
          // Headers
          doc.fillColor(colors.lightText).fontSize(7).font('Helvetica-Bold');
          doc.text('ITEM DE INSPEÇÃO', 40, currentY);
          doc.text('PRIO', 450, currentY);
          doc.text('ESTADO', 500, currentY);
          currentY += 12;
          doc.moveTo(40, currentY).lineTo(550, currentY).strokeColor(colors.border).lineWidth(0.5).stroke();
          currentY += 10;

          doc.fontSize(8).font('Helvetica');
          checklist.forEach(item => {
            if (currentY > 750) { doc.addPage(); currentY = 50; }

            const isOk = item.checked === true || item.value === 'ok';
            const isNC = item.value === 'nc';

            doc.fillColor(colors.text).text(item.label, 40, currentY, { width: 380 });
            doc.fillColor(colors.lightText).text(item.prio || 'C', 450, currentY);

            if (isOk) {
              doc.fillColor(colors.success).font('Helvetica-Bold').text('CONFORME', 500, currentY);
            } else if (isNC) {
              doc.fillColor(colors.danger).font('Helvetica-Bold').text('NÃO CONF.', 500, currentY);
            } else {
              doc.fillColor(colors.lightText).text('N/A', 500, currentY);
            }

            doc.font('Helvetica');
            currentY += 18;
          });
        } else {
          doc.fillColor(colors.lightText).fontSize(8).text('Checklist não disponível para esta tarefa.', 40, currentY);
          currentY += 20;
        }

        currentY += 25;

        // 5. MEDIÇÕES TÉCNICAS
        if (currentY > 600) { doc.addPage(); currentY = 50; }
        this._drawSectionTitle(doc, '4. MEDIÇÕES E ENSAIOS DE CAMPO', currentY, colors);
        currentY += 25;

        // Resistência de Terra
        doc.fillColor(colors.lightText).fontSize(8).font('Helvetica-Bold').text('RESISTÊNCIA DE TERRA (LIMITE < 20Ω)', col1, currentY);
        currentY += 15;

        const tp = auditData.terra_protecao;
        const ts = auditData.terra_servico;

        this._drawMeasurementBox(doc, 'TERRA PROTEÇÃO (TP)', tp != null ? `${tp} Ω` : 'N/D', tp != null && tp < 20, col1, currentY, colors);
        this._drawMeasurementBox(doc, 'TERRA SERVIÇO (TS)', ts != null ? `${ts} Ω` : 'N/D', ts != null && ts < 20, col2 + 20, currentY, colors);

        currentY += 55;

        // Tensões e Observações (se houver)
        if (auditData.medicao_tensao) {
          const u = auditData.medicao_tensao;
          const hasTensions = u.UA || u.UB || u.UC || u.UAB || u.UBC || u.UCA;

          if (hasTensions) {
            doc.fillColor(colors.lightText).fontSize(8).font('Helvetica-Bold').text('MEDIÇÕES DE TENSÃO (V)', col1, currentY);
            currentY += 15;
            const uText = `UA: ${u.UA || '--'}V | UB: ${u.UB || '--'}V | UC: ${u.UC || '--'}V  ||  UAB: ${u.UAB || '--'}V | UBC: ${u.UBC || '--'}V | UCA: ${u.UCA || '--'}V`;
            doc.fillColor(colors.primary).fontSize(9).font('Helvetica').text(uText, col1, currentY);
            currentY += 25;
          }

          if (u.obs) {
            doc.fillColor(colors.lightText).fontSize(8).font('Helvetica-Bold').text('OBSERVAÇÕES (MEDIÇÕES)', col1, currentY);
            currentY += 15;
            doc.fillColor(colors.text).fontSize(8).font('Helvetica-Oblique').text(u.obs, col1, currentY, { width: 500, align: 'justify' });
            currentY += 30;
          }
        }

        // 6. OBSERVAÇÕES E PARECER DO AUDITOR
        if (currentY > 600) { doc.addPage(); currentY = 50; }
        this._drawSectionTitle(doc, '5. OBSERVAÇÕES E PARECER TÉCNICO', currentY, colors);
        currentY += 25;

        doc.fillColor(colors.text).fontSize(9).font('Helvetica');
        const obs = auditData.observacoes || 'Sem observações adicionais registadas.';
        doc.text(obs, 40, currentY, { width: 500, align: 'justify' });

        currentY += 60;

        // 7. INCONGRUÊNCIAS DETECTADAS
        if (auditData.incongruencias && auditData.incongruencias.length > 0) {
          if (currentY > 700) { doc.addPage(); currentY = 50; }
          this._drawSectionTitle(doc, '6. INCONGRUÊNCIAS / NÃO CONFORMIDADES CRÍTICAS', currentY, colors);
          currentY += 25;

          auditData.incongruencias.forEach((inc, idx) => {
            if (currentY > 750) { doc.addPage(); currentY = 50; }
            doc.fillColor(colors.danger).fontSize(8).font('Helvetica-Bold').text(`• ${inc.descricao || inc.label || inc.campo || 'Incongruência'}:`, col1, currentY, { width: 130 });
            doc.fillColor(colors.lightText).font('Helvetica').text(`Cadastro: ${inc.valor_cadastro || inc.valor || '---'}`, 180, currentY);
            doc.fillColor(colors.accent).font('Helvetica-Bold').text(`Campo: ${inc.valor_apurado || inc.limite || '---'}`, 360, currentY);
            currentY += 18;
          });
        }

        // Validação no final
        if (currentY > 650) { doc.addPage(); currentY = 50; }

        doc.moveTo(40, 720).lineTo(240, 720).strokeColor(colors.border).stroke();
        doc.fillColor(colors.lightText).fontSize(8).text('ASSINATURA DO AUDITOR', 40, 725);
        doc.fillColor(colors.primary).font('Helvetica-Bold').text(auditData.auditor?.nome || '---', 40, 735);

        doc.moveTo(350, 720).lineTo(550, 720).strokeColor(colors.border).stroke();
        doc.fillColor(colors.lightText).fontSize(8).text('CARIMBO DA EMPRESA / DATA', 350, 725);
        doc.fillColor(colors.primary).font('Helvetica-Bold').text(new Date().toLocaleDateString('pt-PT'), 350, 735);

        doc.fontSize(7).fillColor(colors.lightText)
          .text('Este relatório é um documento técnico oficial gerado pelo Sistema PTAS MBT.', 40, 785, { align: 'center', width: 500 });

        doc.end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  _drawMeasurementBox(doc, label, value, isOk, x, y, colors) {
    doc.rect(x, y, 160, 35).fillAndStroke(isOk ? '#f0fdf4' : '#fef2f2', colors.border);
    doc.fillColor(colors.lightText).fontSize(7).font('Helvetica').text(label, x + 10, y + 8);
    doc.fillColor(isOk ? colors.success : colors.danger).fontSize(10).font('Helvetica-Bold').text(value, x + 10, y + 20);
    if (value !== 'N/D') {
      doc.text(isOk ? '✓' : '✗', x + 140, y + 18);
    }
  }
}

module.exports = new PDFGenerator();
