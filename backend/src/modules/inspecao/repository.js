const prisma = require('../../database/client');

class InspecaoRepository {
  async getAll(rawFilters = {}) {
    const filters = { ...rawFilters };

    // Convert numeric strings to numbers for Prisma
    if (filters.id_tarefa) {
      filters.id_tarefa = Number(filters.id_tarefa);
    }
    if (filters.id_auditor) {
      filters.id_auditor = Number(filters.id_auditor);
    }

    return prisma.inspecao.findMany({
      where: filters,
      include: {
        pt: true,
        auditor: {
          select: { id: true, nome: true, email: true },
        },
        tarefa: true,
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async getById(id) {
    return prisma.inspecao.findUnique({
      where: { id: Number(id) },
      include: {
        pt: true,
        auditor: true,
        transformadores: true,
        conformidade: true,
        media_tensao: true,
        baixa_tensao: true,
        seguranca: true,
        infraestrutura: true,
        monitorizacao: true,
        manutencao: true,
        riscos: true,
        incongruencias: true,
        tarefa: true,
      },
    });
  }

  async create(data) {
    const {
      conformidade,
      transformadores,
      media_tensao,
      baixa_tensao,
      seguranca,
      infraestrutura,
      monitorizacao,
      manutencao,
      riscos,
      ...baseData
    } = data;

    // Alguns módulos (ex.: Conformidade/Seguranca/Infraestrutura/...) têm `id_pt` único.
    // Fazer upsert "aninhado" em relações listadas pode falhar no Prisma. Por isso:
    // 1) criamos a inspeção
    // 2) fazemos upsert desses módulos por `id_pt`, associando ao `id_inspecao`
    return prisma.$transaction(async (tx) => {
      const inspecao = await tx.inspecao.create({
        data: {
          id_pt:              baseData.id_pt,
          id_auditor:         baseData.id_auditor     ? Number(baseData.id_auditor) : undefined,
          id_tarefa:          baseData.id_tarefa       ? Number(baseData.id_tarefa)  : null,
          tipo:               baseData.tipo            ?? 'Auditoria PTA',
          resultado:          baseData.resultado       ?? null,
          nivel_urgencia:     baseData.nivel_urgencia  ?? null,
          observacoes:        baseData.observacoes     ?? null,
          data_inspecao:      baseData.data_inspecao    ? new Date(baseData.data_inspecao)    : new Date(),
          proxima_inspecao:   baseData.proxima_inspecao ? new Date(baseData.proxima_inspecao) : null,
          fotos:              Array.isArray(baseData.fotos) ? baseData.fotos : (baseData.fotos ?? null),
          // Novos campos de auditoria de campo
          terra_protecao:     (baseData.terra_protecao != null && baseData.terra_protecao !== '') ? Number(baseData.terra_protecao) : null,
          terra_servico:      (baseData.terra_servico != null && baseData.terra_servico !== '') ? Number(baseData.terra_servico) : null,
          medicao_tensao:     baseData.medicao_tensao     ?? null,
          dados_cliente_campo: baseData.dados_cliente_campo ?? null,
          pt_info_edits:       baseData.pt_info_edits       ?? null,
          cliente_edits:       baseData.cliente_edits       ?? null,
        },
      });

      const id_inspecao = inspecao.id;
      const id_pt = baseData.id_pt;

      // --- MOTOR DE INCONGRUÊNCIAS ---
      // 1) Descobrir divergências entre o cadastro e os dados de campo
      const currentPT = await tx.postoTransformacao.findUnique({
        where: { id_pt: id_pt },
        include: { proprietario: true }
      });
      
      if (currentPT && baseData.dados_cliente_campo) {
        const dc = baseData.dados_cliente_campo;
        const prop = currentPT.proprietario; // Dados comerciais agora no modelo Proprietario

        const mapping = [
          { key: 'razao_social',           valorCadastro: prop?.nome,                         label: 'Nome/Razão Social' },
          { key: 'resp_financeiro',         valorCadastro: prop?.responsavel_financeiro,       label: 'Resp. Financeiro' },
          { key: 'contacto_fin',            valorCadastro: prop?.contacto_resp_financeiro,     label: 'Contacto Financeiro' },
          { key: 'resp_tecnico',            valorCadastro: currentPT.responsavel_tecnico_cliente, label: 'Resp. Técnico' },
          { key: 'contacto_tec',            valorCadastro: currentPT.contacto_resp_tecnico,   label: 'Contacto Técnico' },
          { key: 'canal_faturacao',         valorCadastro: currentPT.canal_faturacao,          label: 'Canal Facturação' },
          { key: 'empresa_manutencao',      valorCadastro: currentPT.empresa_manutencao,       label: 'Empresa Manutenção' },
        ];

        for (const meta of mapping) {
          const valorCampo = dc[meta.key];
          const valorCadastro = meta.valorCadastro;
          if (valorCampo && valorCadastro && String(valorCampo).trim() !== String(valorCadastro).trim()) {
            await tx.incongruencia.create({
              data: {
                id_inspecao: id_inspecao,
                tipo: 'cliente',
                descricao: `Divergência detectada em: ${meta.label}`,
                valor_cadastro: String(valorCadastro),
                valor_apurado: String(valorCampo),
                nivel_urgencia: 'normal'
              }
            });
          }
        }

        // Fornecimento a terceiros
        if (dc.fornece_terceiros != null && Boolean(dc.fornece_terceiros) !== Boolean(currentPT.fornece_terceiros)) {
          await tx.incongruencia.create({
            data: {
              id_inspecao: id_inspecao,
              tipo: 'ilegal',
              descricao: 'Alteração no estado de fornecimento a terceiros',
              valor_cadastro: currentPT.fornece_terceiros ? 'Sim' : 'Não',
              valor_apurado: dc.fornece_terceiros ? 'Sim' : 'Não',
              nivel_urgencia: 'u_alta'
            }
          });
        }
      }

      // 2) Verificação de Terra (Normativo < 20 Ohm)
      if (baseData.terra_protecao != null && Number(baseData.terra_protecao) >= 20) {
        await tx.incongruencia.create({
          data: {
            id_inspecao: id_inspecao,
            tipo: 'terra',
            descricao: 'Resistência de Terra de Protecção (TP) acima do limite normativo',
            valor_cadastro: '< 20 Ω',
            valor_apurado: `${baseData.terra_protecao} Ω`,
            nivel_urgencia: 'urgente'
          }
        });
      }
      if (baseData.terra_servico != null && Number(baseData.terra_servico) >= 20) {
        await tx.incongruencia.create({
          data: {
            id_inspecao: id_inspecao,
            tipo: 'terra',
            descricao: 'Resistência de Terra de Serviço (TS) acima do limite normativo',
            valor_cadastro: '< 20 Ω',
            valor_apurado: `${baseData.terra_servico} Ω`,
            nivel_urgencia: 'urgente'
          }
        });
      }

      // Se foram recolhidos dados do cliente em campo, actualiza o registo do PT/Cliente
      if (baseData.dados_cliente_campo) {
        const dc = baseData.dados_cliente_campo;
        
        // Extrair coordenadas se disponíveis para campos First-Class
        let lat = null, lon = null;
        if (dc.gps) {
          const parts = dc.gps.split(/[,;]/);
          if (parts.length >= 2) {
            lat = parseFloat(parts[0]);
            lon = parseFloat(parts[1]);
          }
        }

        // Atualiza campos técnicos diretos no PT
        await tx.postoTransformacao.update({
          where: { id_pt: baseData.id_pt },
          data: {
            ...(dc.resp_tecnico           && { responsavel_tecnico_cliente: dc.resp_tecnico }),
            ...(dc.contacto_tec           && { contacto_resp_tecnico: dc.contacto_tec }),
            ...(dc.canal_faturacao         && { canal_faturacao: dc.canal_faturacao }),
            ...(dc.empresa_manutencao      && { empresa_manutencao: dc.empresa_manutencao }),
            ...(dc.fornece_terceiros       != null && { fornece_terceiros: Boolean(dc.fornece_terceiros) }),
            ...(dc.data_ultima_manutencao  && { data_ultima_manutencao: new Date(dc.data_ultima_manutencao) }),
            ...(lat !== null && !isNaN(lat) && { latitude: lat }),
            ...(lon !== null && !isNaN(lon) && { longitude: lon }),
            ...(dc.gps && { gps: dc.gps })
          },
        });
      }

      // Atualizar Tipo de Infraestrutura (PTA/PTC) se fornecido
      if (baseData.tipo_pt) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { tipo_instalacao: baseData.tipo_pt === 'PTC' ? 'PT CABINE' : 'PT AEREO' }
        });
      }

      // Atualizar Status Legal do PT com o resultado da auditoria
      if (baseData.resultado) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { status_legal: baseData.resultado }
        });
      }

      // Sincronizar Potência Instalada se fornecida em pt_info_edits
      if (baseData.pt_info_edits && baseData.pt_info_edits.potencia_instalada) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { potencia_instalada: parseFloat(baseData.pt_info_edits.potencia_instalada) }
        });
      }

      // Criar listas via modelos diretamente (evita depender de writes relacionais no prisma client)

      if (transformadores) {
        const list = (Array.isArray(transformadores) ? transformadores : [transformadores]).map((t) => ({
          ...t,
          id_pt,
          id_inspecao,
        }));
        // createMany não aceita nested/undefined; fazemos create individual para compatibilidade máxima
        for (const item of list) {
          await tx.transformador.create({ data: item });
        }
      }
      if (riscos) {
        const list = (Array.isArray(riscos) ? riscos : [riscos]).map((r) => ({
          ...r,
          id_pt,
          id_inspecao,
        }));
        for (const item of list) {
          await tx.risco.create({ data: item });
        }
      }

      if (conformidade) {
        await tx.conformidade.upsert({
          where: { id_pt },
          create: { ...conformidade, id_pt, id_inspecao },
          update: { ...conformidade, id_inspecao },
        });
      }
      if (media_tensao) {
        await tx.mediaTensao.upsert({
          where: { id_pt },
          create: { ...media_tensao, id_pt, id_inspecao },
          update: { ...media_tensao, id_inspecao },
        });
      }
      if (baixa_tensao) {
        await tx.baixaTensao.upsert({
          where: { id_pt },
          create: { ...baixa_tensao, id_pt, id_inspecao },
          update: { ...baixa_tensao, id_inspecao },
        });
      }
      if (seguranca) {
        await tx.seguranca.upsert({
          where: { id_pt },
          create: { ...seguranca, id_pt, id_inspecao },
          update: { ...seguranca, id_inspecao },
        });
      }
      if (infraestrutura) {
        await tx.infraestrutura.upsert({
          where: { id_pt },
          create: { ...infraestrutura, id_pt, id_inspecao },
          update: { ...infraestrutura, id_inspecao },
        });
      }
      if (monitorizacao) {
        await tx.monitorizacao.upsert({
          where: { id_pt },
          create: { ...monitorizacao, id_pt, id_inspecao },
          update: { ...monitorizacao, id_inspecao },
        });
      }
      if (manutencao) {
        await tx.manutencao.upsert({
          where: { id_pt },
          create: { ...manutencao, id_pt, id_inspecao },
          update: { ...manutencao, id_inspecao },
        });
      }

      return inspecao;
    });
  }

  async update(id, data) {
    // Get the existing inspecao to get id_pt
    const existing = await this.getById(id);
    if (!existing) throw new Error('Inspeção não encontrada.');
    
    const {
      conformidade,
      transformadores,
      media_tensao,
      baixa_tensao,
      seguranca,
      infraestrutura,
      monitorizacao,
      manutencao,
      riscos,
      ...baseData
    } = data;

    // Use the new id_pt if provided, else existing
    const id_pt = baseData.id_pt || existing.id_pt;

    return prisma.$transaction(async (tx) => {
      const inspecao = await tx.inspecao.update({
        where: { id: Number(id) },
        data: {
          id_pt:              baseData.id_pt            ?? existing.id_pt,
          id_auditor:         baseData.id_auditor       ? Number(baseData.id_auditor) : existing.id_auditor,
          id_tarefa:          baseData.id_tarefa !== undefined ? (baseData.id_tarefa ? Number(baseData.id_tarefa) : null) : existing.id_tarefa,
          tipo:               baseData.tipo             ?? existing.tipo,
          resultado:          baseData.resultado        !== undefined ? baseData.resultado        : existing.resultado,
          nivel_urgencia:     baseData.nivel_urgencia   !== undefined ? baseData.nivel_urgencia   : existing.nivel_urgencia,
          observacoes:        baseData.observacoes      !== undefined ? baseData.observacoes      : existing.observacoes,
          data_inspecao:      baseData.data_inspecao     ? new Date(baseData.data_inspecao)    : undefined,
          proxima_inspecao:   baseData.proxima_inspecao  ? new Date(baseData.proxima_inspecao) : null,
          fotos:              baseData.fotos !== undefined ? (Array.isArray(baseData.fotos) ? baseData.fotos : baseData.fotos) : existing.fotos,
          // Novos campos de auditoria
          terra_protecao:     baseData.terra_protecao     !== undefined ? (baseData.terra_protecao != null && baseData.terra_protecao !== '' ? Number(baseData.terra_protecao) : null) : existing.terra_protecao,
          terra_servico:      baseData.terra_servico      !== undefined ? (baseData.terra_servico  != null && baseData.terra_servico !== '' ? Number(baseData.terra_servico)  : null) : existing.terra_servico,
          medicao_tensao:     baseData.medicao_tensao     !== undefined ? baseData.medicao_tensao     : existing.medicao_tensao,
          dados_cliente_campo: baseData.dados_cliente_campo !== undefined ? baseData.dados_cliente_campo : existing.dados_cliente_campo,
          pt_info_edits:       baseData.pt_info_edits       !== undefined ? baseData.pt_info_edits       : existing.pt_info_edits,
          cliente_edits:       baseData.cliente_edits       !== undefined ? baseData.cliente_edits       : existing.cliente_edits,
        },
      });

      // Actualiza dados técnicos do PT se vieram em campo
      if (baseData.dados_cliente_campo) {
        const dc = baseData.dados_cliente_campo;
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: {
            ...(dc.resp_tecnico           && { responsavel_tecnico_cliente: dc.resp_tecnico }),
            ...(dc.contacto_tec           && { contacto_resp_tecnico: dc.contacto_tec }),
            ...(dc.canal_faturacao         && { canal_faturacao: dc.canal_faturacao }),
            ...(dc.empresa_manutencao      && { empresa_manutencao: dc.empresa_manutencao }),
            ...(dc.fornece_terceiros       != null && { fornece_terceiros: Boolean(dc.fornece_terceiros) }),
            ...(dc.data_ultima_manutencao  && { data_ultima_manutencao: new Date(dc.data_ultima_manutencao) }),
          },
        });
      }

      // Actualiza Tipo de Infraestrutura se fornecido
      if (baseData.tipo_pt) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { tipo_instalacao: baseData.tipo_pt === 'PTC' ? 'PT CABINE' : 'PT AEREO' }
        });
      }

      // Atualizar Status Legal do PT com o resultado da auditoria
      if (baseData.resultado) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { status_legal: baseData.resultado }
        });
      }

      // Sincronizar Potência Instalada se fornecida em pt_info_edits
      if (baseData.pt_info_edits && baseData.pt_info_edits.potencia_instalada) {
        await tx.postoTransformacao.update({
          where: { id_pt: id_pt },
          data: { potencia_instalada: parseFloat(baseData.pt_info_edits.potencia_instalada) }
        });
      }

      const id_inspecao = inspecao.id;

      if (transformadores) {
        await tx.transformador.deleteMany({ where: { id_inspecao } });
        const list = (Array.isArray(transformadores) ? transformadores : [transformadores]).map((t) => ({
          ...t,
          id_pt,
          id_inspecao,
        }));
        for (const item of list) {
          await tx.transformador.create({ data: item });
        }
      }
      if (riscos) {
        await tx.risco.deleteMany({ where: { id_inspecao } });
        const list = (Array.isArray(riscos) ? riscos : [riscos]).map((r) => ({
          ...r,
          id_pt,
          id_inspecao,
        }));
        for (const item of list) {
          await tx.risco.create({ data: item });
        }
      }

      if (conformidade) {
        await tx.conformidade.upsert({
          where: { id_pt },
          create: { ...conformidade, id_pt, id_inspecao },
          update: { ...conformidade, id_inspecao },
        });
      }
      if (media_tensao) {
        await tx.mediaTensao.upsert({
          where: { id_pt },
          create: { ...media_tensao, id_pt, id_inspecao },
          update: { ...media_tensao, id_inspecao },
        });
      }
      if (baixa_tensao) {
        await tx.baixaTensao.upsert({
          where: { id_pt },
          create: { ...baixa_tensao, id_pt, id_inspecao },
          update: { ...baixa_tensao, id_inspecao },
        });
      }
      if (seguranca) {
        await tx.seguranca.upsert({
          where: { id_pt },
          create: { ...seguranca, id_pt, id_inspecao },
          update: { ...seguranca, id_inspecao },
        });
      }
      if (infraestrutura) {
        await tx.infraestrutura.upsert({
          where: { id_pt },
          create: { ...infraestrutura, id_pt, id_inspecao },
          update: { ...infraestrutura, id_inspecao },
        });
      }
      if (monitorizacao) {
        await tx.monitorizacao.upsert({
          where: { id_pt },
          create: { ...monitorizacao, id_pt, id_inspecao },
          update: { ...monitorizacao, id_inspecao },
        });
      }
      if (manutencao) {
        await tx.manutencao.upsert({
          where: { id_pt },
          create: { ...manutencao, id_pt, id_inspecao },
          update: { ...manutencao, id_inspecao },
        });
      }

      return inspecao;
    });
  }

  async delete(id) {
    return prisma.inspecao.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = new InspecaoRepository();
