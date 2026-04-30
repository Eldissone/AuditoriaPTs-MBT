const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⚠️ Iniciando o reset das tabelas de Clientes (PTs e Proprietários)...');
  try {
    // A ordem importa devido às chaves estrangeiras, mas o CASCADE resolve.
    // Resetamos Posto de Transformação e Proprietário.
    // O CASCADE garante que inspeções, transformadores e outros dados vinculados também sejam removidos.
    
    console.log('Limpando tabela posto_transformacao...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "posto_transformacao" RESTART IDENTITY CASCADE;');
    
    console.log('Limpando tabela proprietario...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "proprietario" RESTART IDENTITY CASCADE;');
    
    console.log('✅ Tabelas de Clientes resetadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao resetar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
