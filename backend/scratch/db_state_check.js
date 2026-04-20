const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- DB STATE CHECK ---');
  const tables = ['subestacao', 'utilizador', 'inspecao', 'tarefa', 'cliente', 'posto_transformacao'];
  
  for (const table of tables) {
    try {
      // Usamos queryRaw para evitar dependência do Prisma Client gerado que pode estar em conflito
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`${table}: ${count[0].count} records`);
    } catch (e) {
      console.log(`${table}: NOT FOUND or ERROR (${e.message.split('\n')[0]})`);
    }
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
