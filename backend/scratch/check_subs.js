const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const subs = await prisma.subestacao.findMany({
    include: {
      _count: {
        select: { pts: true }
      }
    }
  });

  console.log('--- RELATÓRIO DE SUBESTAÇÕES ---');
  subs.forEach(s => {
    console.log(`${s.codigo_operacional.padEnd(10)} | ${s.nome.padEnd(40)} | PTs: ${s._count.pts}`);
  });
  console.log('--------------------------------');
  process.exit(0);
}

check();
