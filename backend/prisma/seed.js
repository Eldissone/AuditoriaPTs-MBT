const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes (opcional, cuidado em prod)
  // await prisma.inspecao.deleteMany();
  // await prisma.identificacao.deleteMany();
  // await prisma.subestacao.deleteMany();
  // await prisma.utilizador.deleteMany();

  // 1. Criar Utilizador Auditor (se não existir)
  const passwordHash = await bcrypt.hashSync('admin123', 10);
  const auditor = await prisma.utilizador.upsert({
    where: { email: 'auditor@ptas.ao' },
    update: {},
    create: {
      nome: 'Auditor MBT Energia',
      email: 'auditor@ptas.ao',
      password_hash: passwordHash,
      role: 'admin',
      municipio: 'Viana',
      provincia: 'Luanda',
      ativo: true
    }
  });

  // 2. Criar Subestação MBT Energia (Mock Record)
  const subestacao = await prisma.subestacao.upsert({
    where: { codigo: 'SUB-MBT-001' },
    update: {},
    create: {
      codigo: 'SUB-MBT-001',
      nome: 'Subestação Central MBT',
      localizacao: 'Cazenga, Luanda',
      gps: '-8.8051, 13.2921',
      municipio: 'Cazenga',
      provincia: 'Luanda',
      tipo: 'Abaixadora',
      proprietario: 'MBT Energia',
      operador: 'Equipa Alfa',
      ano_construcao: new Date('2022-01-15'),
      entrada_operacao: new Date('2022-06-01'),
      tensao_alimentacao: '60kV',
      potencia_total_kva: 10000,
      concessionaria: 'ENDE',
      estado: 'Ativa'
    }
  });

  // 3. Criar PTs (Postos de Transformação)
  const ptsData = [
    {
      id_pt: 'PT-MBT-VN1',
      id_subestacao: subestacao.id,
      localizacao: 'Viana, Rua 4',
      nivel_tensao: '15/0.4 kV',
      potencia_kva: 630,
      ano_instalacao: 2021,
      tipo_instalacao: 'Cabine Alvenaria',
      id_responsavel: auditor.id
    },
    {
      id_pt: 'PT-MBT-CZ2',
      id_subestacao: subestacao.id,
      localizacao: 'Cazenga, Beco 2',
      nivel_tensao: '30/0.4 kV',
      potencia_kva: 1000,
      ano_instalacao: 2023,
      tipo_instalacao: 'Posto Aéreo',
      id_responsavel: auditor.id
    }
  ];

  for (const pt of ptsData) {
    await prisma.identificacao.upsert({
      where: { id_pt: pt.id_pt },
      update: {},
      create: pt
    });
  }

  console.log('Base de dados MBT Energia populada com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
