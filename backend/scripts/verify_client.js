const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('Verificando campos do modelo Cliente...');
    
    const dmmf = prisma._baseDmmf || prisma._dmmf || prisma.dmmf;
    if (!dmmf) {
      console.error('ERRO: DMMF não encontrado no Prisma Client.');
      process.exit(1);
    }

    const models = dmmf.datamodel.models;
    console.log('Modelos encontrados:', models.map(m => m.name).join(', '));

    const model = models.find(m => m.name === 'Cliente' || m.dbName === 'cliente' || m.name === 'cliente');

    if (!model) {
      console.error('ERRO: Modelo Cliente não encontrado no DMMF do Prisma Client.');
      process.exit(1);
    }

    const fields = model.fields.map(f => f.name);
    console.log('Campos detectados:', fields.join(', '));

    const requiredFields = ['latitude', 'longitude', 'localizacao', 'potencia_kva'];
    const missing = requiredFields.filter(f => !fields.includes(f));

    if (missing.length > 0) {
      console.error('ERRO: Campos em falta no cliente gerado:', missing.join(', '));
      process.exit(1);
    }

    console.log('SUCESSO: Todos os campos críticos estão presentes no Prisma Client.');
    process.exit(0);
  } catch (err) {
    console.error('Erro durante a verificação:', err);
    process.exit(1);
  }
}

verify();
