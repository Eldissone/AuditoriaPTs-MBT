const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sample = await prisma.subestacao.findFirst({
    include: {
      _count: { select: { pts: true } }
    }
  });
  console.log('Sample Substation:', JSON.stringify(sample, null, 2));

  const ptWithSub = await prisma.cliente.findFirst({
    select: { id_pt: true, id_subestacao: true }
  });
  console.log('Sample PT:', JSON.stringify(ptWithSub, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
