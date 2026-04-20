const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const dmmf = prisma._baseDmmf || prisma._dmmf;
  const model = dmmf.datamodel.models.find(m => m.name === 'Cliente');
  console.log('Model fields:', model.fields.map(f => f.name).join(', '));
  process.exit(0);
}

check();
