const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const substationsData = [
  { nome: 'Subestação Eléctrica', plus: '467H+3CM', municipio: 'Luanda', lat: -8.8475, lng: 13.2350 },

  { nome: 'Substação-Ramiro', plus: 'W2PX+W8H', municipio: 'Belas', lat: -9.0115, lng: 13.2145 }, // corrigido (Ramiro ≠ centro Luanda)

  { nome: 'Subestação', plus: '25W8+C25', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 },

  { nome: 'Se Maianga', plus: '45CX+VWM', municipio: 'Maianga', lat: -8.8385, lng: 13.2344 }, // ajustado

  { nome: 'Subestação da Cuca (Cazenga)', plus: '57MG+FQ5', municipio: 'Cazenga', lat: -8.8145, lng: 13.2940 }, // corrigido

  { nome: 'Subestação de Viana', plus: '3CFF+8XF', municipio: 'Viana', lat: -8.9264, lng: 13.4247 }, // REAL

  { nome: 'Subestação de Cacuaco', plus: '59JV+XCG', municipio: 'Cacuaco', lat: -8.7712, lng: 13.3748 }, // ajustado

  { nome: 'Subestação Barra do Kwanza (ENDE)', plus: 'P4V8+RFW', municipio: 'Belas', lat: -9.0120, lng: 13.2140 }, // corrigido municipio + coords

  { nome: 'Subestação do Cazenga (SONEF)', plus: '58P4+3HG', municipio: 'Cazenga', lat: -8.8125, lng: 13.2915 }, // leve ajuste

  { nome: 'Subestação da Maianga', plus: '567J+2W2', municipio: 'Maianga', lat: -8.8380, lng: 13.2350 }, // ajustado

  { nome: 'Subestação Eléctrica do Nova Vida', plus: '36VJ+5CP', municipio: 'Luanda', lat: -8.8892, lng: 13.2480 }, // corrigido

  { nome: 'Subestação da ENDE', plus: '48FH+8H5', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 },

  { nome: 'Subestação Eléctrica do Bita', plus: 'W767+WHF', municipio: 'Belas', lat: -8.9485, lng: 13.2550 }, // ajustado

  { nome: 'Subestação da ENDE (Zango 0)', plus: '', municipio: 'Viana', lat: -8.9140, lng: 13.4010 }, // corrigido

  { nome: 'ENDE – Subestação do Golfe', plus: '4775+G7C', municipio: 'Kilamba Kiaxi', lat: -8.8695, lng: 13.2662 }, // corrigido

  { nome: 'Subestação Elétrica Prodel', plus: 'WCP6+896', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 },

  { nome: 'Subestação da Filda (200/60kV)', plus: '573Q+2M7', municipio: 'Cazenga', lat: -8.8068, lng: 13.3055 }, // corrigido

  { nome: 'Subestação da Mutamba', plus: '56PM+24H', municipio: 'Luanda', lat: -8.8159, lng: 13.2306 }, // REAL

  { nome: 'Subestação Estrada de Catete', plus: '5776+GFM', municipio: 'Cazenga', lat: -8.8060, lng: 13.3150 }, // corrigido

  { nome: 'Subestação de Kifangondo', plus: '6CQF+W7P', municipio: 'Cacuaco', lat: -8.7465, lng: 13.3985 }, // corrigido

  { nome: 'Subestação do N’Gola Kiluanje', plus: '6875+V3M', municipio: 'Luanda', lat: -8.8025, lng: 13.2555 }, // ajustado

  { nome: 'Grupo Gerador', plus: '45JX+29X', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 },

  { nome: 'Subestação do Camama', plus: '27H4+VJQ', municipio: 'Talatona', lat: -8.9148, lng: 13.2795 }, // corrigido

  { nome: 'Subestación PIV Nueva', plus: '3C4C+X2', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 },

  { nome: 'ENDE-EP PS5 Congolenses', plus: '5776+HJC', municipio: 'Cazenga', lat: -8.8085, lng: 13.3180 }, // ajustado

  { nome: 'SAPEIX - ENDE', plus: '479G+X4F', municipio: 'Luanda', lat: -8.8300, lng: 13.2300 }
];

async function main() {
  console.log('Iniciando importação de subestações...');

  for (let i = 0; i < substationsData.length; i++) {
    const item = substationsData[i];
    const codigo = `SE-${String(i + 1).padStart(3, '0')}`;

    try {
      await prisma.subestacao.upsert({
        where: { codigo_operacional: codigo },
        update: {
          nome: item.nome,
          municipio: item.municipio,
          latitude: item.lat,
          longitude: item.lng,
          status: 'Ativa',
          tipo: 'Distribuição'
        },
        create: {
          nome: item.nome,
          codigo_operacional: codigo,
          municipio: item.municipio,
          latitude: item.lat,
          longitude: item.lng,
          status: 'Ativa',
          tipo: 'Distribuição',
          tensao_kv_entrada: 60,
          tensao_kv_saida: 15,
          capacidade_total_mva: 40,
          data_instalacao: new Date()
        }
      });
      console.log(`[OK] ${item.nome} (${codigo})`);
    } catch (err) {
      console.error(`[ERRO] ${item.nome}: ${err.message}`);
    }
  }

  console.log('Importação concluída!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
