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
          terra_protecao:     baseData.terra_protecao     != null ? Number(baseData.terra_protecao)   : null,
          terra_servico:      baseData.terra_servico      != null ? Number(baseData.terra_servico)    : null,
          medicao_tensao:     baseData.medicao_tensao     ?? null,
          dados_cliente_campo: baseData.dados_cliente_campo ?? null,
        },
      });

      // Se foram recolhidos dados do cliente em campo, actualiza o registo do PT/Cliente
      if (baseData.dados_cliente_campo) {
        const dc = baseData.dados_cliente_campo;
        await tx.cliente.update({
          where: { id_pt: baseData.id_pt },
          data: {
            ...(dc.razao_social          && { proprietario: dc.razao_social }),
            ...(dc.resp_financeiro       && { responsavel_financeiro: dc.resp_financeiro }),
            ...(dc.contacto_fin          && { contacto_resp_financeiro: dc.contacto_fin }),
            ...(dc.resp_tecnico          && { responsavel_tecnico_cliente: dc.resp_tecnico }),
            ...(dc.contacto_tec          && { contacto_resp_tecnico: dc.contacto_tec }),
            ...(dc.canal_faturacao        && { canal_faturacao: dc.canal_faturacao }),
            ...(dc.empresa_manutencao     && { empresa_manutencao: dc.empresa_manutencao }),
            ...(dc.fornece_terceiros      != null && { fornece_terceiros: Boolean(dc.fornece_terceiros) }),
            ...(dc.data_ultima_manutencao && { data_ultima_manutencao: new Date(dc.data_ultima_manutencao) }),
          },
        });
      }

      const id_pt = baseData.id_pt;
      const id_inspecao = inspecao.id;

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
          terra_protecao:     baseData.terra_protecao     !== undefined ? (baseData.terra_protecao != null ? Number(baseData.terra_protecao) : null) : existing.terra_protecao,
          terra_servico:      baseData.terra_servico      !== undefined ? (baseData.terra_servico  != null ? Number(baseData.terra_servico)  : null) : existing.terra_servico,
          medicao_tensao:     baseData.medicao_tensao     !== undefined ? baseData.medicao_tensao     : existing.medicao_tensao,
          dados_cliente_campo: baseData.dados_cliente_campo !== undefined ? baseData.dados_cliente_campo : existing.dados_cliente_campo,
        },
      });

      // Actualiza dados comerciais do PT se vieram em campo
      if (baseData.dados_cliente_campo) {
        const dc = baseData.dados_cliente_campo;
        await tx.cliente.update({
          where: { id_pt: id_pt },
          data: {
            ...(dc.razao_social           && { proprietario: dc.razao_social }),
            ...(dc.resp_financeiro        && { responsavel_financeiro: dc.resp_financeiro }),
            ...(dc.contacto_fin           && { contacto_resp_financeiro: dc.contacto_fin }),
            ...(dc.resp_tecnico           && { responsavel_tecnico_cliente: dc.resp_tecnico }),
            ...(dc.contacto_tec           && { contacto_resp_tecnico: dc.contacto_tec }),
            ...(dc.canal_faturacao         && { canal_faturacao: dc.canal_faturacao }),
            ...(dc.empresa_manutencao      && { empresa_manutencao: dc.empresa_manutencao }),
            ...(dc.fornece_terceiros       != null && { fornece_terceiros: Boolean(dc.fornece_terceiros) }),
            ...(dc.data_ultima_manutencao  && { data_ultima_manutencao: new Date(dc.data_ultima_manutencao) }),
          },
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
