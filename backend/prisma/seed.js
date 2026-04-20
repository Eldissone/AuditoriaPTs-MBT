const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. Criar Utilizador Auditor (se não existir)
  const passwordHash = await bcrypt.hashSync('admin123', 10);
  const auditor = await prisma.utilizador.upsert({
    where: { email: 'admin@mbtenergia.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@mbtenergia.com',
      password_hash: passwordHash,
      role: 'admin',
      municipio: 'Humpata',
      provincia: 'Huíla',
      ativo: true
    }
  });

  // 2. Criar Subestação MBT Energia (Mock Record)
  const subestacao = await prisma.subestacao.upsert({
    where: { codigo_operacional: 'SUB-MBT-001' },
    update: {},
    create: {
      codigo_operacional: 'SUB-MBT-001',
      nome: 'Subestação Central MBT',
      municipio: 'CACUACO',
      tipo: 'Abaixadora',
      status: 'Ativa',
      tensao_kv_entrada: 60,
      tensao_kv_saida: 15,
      capacidade_total_mva: 10,
    }
  });

  console.log('Utilizador e Subestação base configurados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
