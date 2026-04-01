const prisma = require('../../database/client');

class InspecaoRepository {
  async getAll(filters = {}) {
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
          ...baseData,
          data_inspecao: baseData.data_inspecao ? new Date(baseData.data_inspecao) : new Date(),
        },
      });

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
          ...baseData,
          data_inspecao: baseData.data_inspecao ? new Date(baseData.data_inspecao) : undefined,
        },
      });

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
