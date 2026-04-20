const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetch() {
  try {
    console.log('Testando fetch de clientes da base de dados...');
    const result = await prisma.cliente.findMany({
      include: { subestacao: true, responsavel: true },
      take: 5
    });
    console.log('SUCESSO: ', result.length, 'clientes encontrados.');
    process.exit(0);
  } catch (err) {
    console.error('ERRO DETECTADO NO FETCH:', err);
    process.exit(1);
  }
}

testFetch();
