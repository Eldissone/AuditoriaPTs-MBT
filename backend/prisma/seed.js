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

  // 3. Criar Clientes (Postos de Transformação)
  const ptsData = [
    {
      id_pt: 'PT-MBT-VN1',
      id_subestacao: subestacao.id,
      localizacao: 'Viana, Rua 4',
      nivel_tensao: '15/0.4 kV',
      potencia_kva: 630,
      ano_instalacao: 2021,
      tipo_instalacao: 'Cabine Alvenaria',
      id_responsavel: auditor.id,
      municipio: 'VIANA',
      provincia: 'Luanda',
      distrito_comuna: 'VIANA',
      bairro: 'KICUXI',
      conta_contrato: '2000089758',
      instalacao: '2000054347',
      parceiro_negocios: '5000912891',
      categoria_tarifa: 'AT_TI',
      txt_categoria_tarifa: 'Indústria',
      proprietario: 'MBT Indústria'
    },
    {
      id_pt: 'PT-MBT-CZ2',
      id_subestacao: subestacao.id,
      localizacao: 'Cazenga, Beco 2',
      nivel_tensao: '30/0.4 kV',
      potencia_kva: 1000,
      ano_instalacao: 2023,
      tipo_instalacao: 'Posto Aéreo',
      id_responsavel: auditor.id,
      municipio: 'CACUACO',
      provincia: 'Luanda',
      distrito_comuna: 'CACUACO',
      bairro: 'CACUACO',
      conta_contrato: '2002071086',
      instalacao: '2000642016',
      equipamento: '900250207',
      parceiro_negocios: '5000581927',
      categoria_tarifa: 'MT_TCS',
      txt_categoria_tarifa: 'Comércio e Serviços',
      proprietario: 'Centro Comercial MBT'
    }
  ];

  for (const pt of ptsData) {
    await prisma.cliente.upsert({
      where: { id_pt: pt.id_pt },
      update: {},
      create: {
        ...pt,
        conformidade: {
          create: {
            licenciamento: true,
            projeto_aprovado: true,
            diagramas_unifilares: true,
            normas_iec: true,
            normas_locais: true
          }
        },
        transformadores: {
          create: [
            {
              num_transformador: 1,
              potencia_kva: pt.potencia_kva,
              tensao_primaria: pt.nivel_tensao.includes('15') ? 15 : 30,
              tensao_secundaria: 0.4,
              tipo_isolamento: 'Oleo',
              estado_oleo: 'Bom'
            }
          ]
        },
        seguranca: {
          create: {
            resistencia_terra: 2.0,
            protecao_raios: true,
            sinalizacao: true
          }
        }
      }
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
