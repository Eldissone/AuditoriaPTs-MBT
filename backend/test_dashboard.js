const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing getMapData query...');
    const result = await prisma.subestacao.findMany({
      select: {
        id: true,
        nome: true,
        municipio: true,
        latitude: true,
        longitude: true,
        capacidade_total_mva: true,
        status: true,
        _count: {
          select: { pts: true }
        }
      }
    });
    console.log('Success!', result.length + ' substations found.');
  } catch (error) {
    console.error('ERROR during query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
