const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o reset da tabela Subestacao...');
  try {
    // TRUNCATE com CASCADE remove dados dependentes (PTs, Inspeções) e reseta IDs
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "subestacao" RESTART IDENTITY CASCADE;');
    console.log('✅ Tabela Subestacao (e dependências) resetada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao resetar tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
