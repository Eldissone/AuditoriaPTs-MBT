const { PrismaClient } = require('@prisma/client');
const { getGpsForMunicipio } = require('../src/utils/angolaGps');

const prisma = new PrismaClient();

async function backfillGps() {
  console.log('🔄 Iniciando backfill de coordenadas GPS...');

  try {
    // 1. Atualizar Subestações
    const subestacoes = await prisma.subestacao.findMany({
      where: { gps: null }
    });

    let subestacoesUpdated = 0;
    for (const sub of subestacoes) {
      if (!sub.municipio) continue;
      const gps = getGpsForMunicipio(sub.municipio);
      if (gps) {
        await prisma.subestacao.update({
          where: { id: sub.id },
          data: { gps }
        });
        subestacoesUpdated++;
      }
    }
    console.log(`✅ ${subestacoesUpdated} Subestações atualizadas com GPS`);

    // 2. Atualizar PTs (Identificação)
    const pts = await prisma.identificacao.findMany({
      where: { gps: null }
    });

    let ptsUpdated = 0;
    for (const pt of pts) {
      if (!pt.municipio) continue;
      const gps = getGpsForMunicipio(pt.municipio);
      if (gps) {
        await prisma.identificacao.update({
          where: { id: pt.id },
          data: { gps }
        });
        ptsUpdated++;
      }
    }
    console.log(`✅ ${ptsUpdated} PTs atualizados com GPS`);

    console.log('✨ Backfill concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillGps();
