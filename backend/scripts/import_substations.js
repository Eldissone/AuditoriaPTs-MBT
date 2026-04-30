const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Utilitário para converter DMS (Graus, Minutos, Segundos) para Decimal
function dmsToDecimal(dmsStr) {
  if (!dmsStr) return null;
  if (typeof dmsStr === 'number') return dmsStr;

  // Regex para capturar graus, minutos, segundos e direção
  const regex = /(\d+)°\s*(\d+)'\s*([\d.]+)"\s*([NSEW])/i;
  const match = dmsStr.match(regex);

  if (match) {
    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4].toUpperCase();

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    return parseFloat(decimal.toFixed(6));
  }

  // Caso já seja um número em string
  const num = parseFloat(dmsStr.replace(',', '.'));
  return isNaN(num) ? null : num;
}

const substationsData = [
  // --- DESPACHO 1 (Luanda e Bengo) ---
  { sap: 'LU-SUB1103-BOAVISTA', nome: 'SE Boavista', kv: '60/15', mva: 80, lat: "8°48'27.72\"S", lng: "13°15'27.64\"E", municipio: 'Luanda' },
  { sap: 'LU-SUB1103-CHICALA', nome: 'SE Chicala', kv: '60/15', mva: 80, lat: "8°48'30.33\"S", lng: "13°13'18.49\"E", municipio: 'Luanda' },
  { sap: 'LU-SUB1103-KINAXIXI', nome: 'SE Kinaxixi', kv: '60/15', mva: 80, lat: "8°49'36.82\"S", lng: "13°14'33.58\"E", municipio: 'Luanda' },
  { sap: 'LU-SUB1103-MAIANGA', nome: 'SE Maianga', kv: '60/15', mva: 100, lat: "8°50'15.07\"S", lng: "13°13'57.65\"E", municipio: 'Maianga' },
  { sap: 'LU-SUB1103-MUTAMBA', nome: 'SE Mutamba', kv: '60/15', mva: 80, lat: "8°48'53.51\"S", lng: "13°13'57.58\"E", municipio: 'Luanda' },
  { sap: 'LU-SUB1103-ESTCATETE', nome: 'SE Estrada de Catete', kv: '60/15', mva: 60, lat: "8°50'10.44\"S", lng: "13°15'39.65\"E", municipio: 'Cazenga' },
  { sap: 'LU-SUB1103-MORRODALUZ', nome: 'SE Morro da Luz', kv: '60/15', mva: 60, lat: -8.870467, lng: 13.197248, municipio: 'Luanda' },
  { sap: 'LU-SUB1103-GIKA', nome: 'SE Gika', kv: '60/15', mva: 80, lat: -8.828051, lng: 13.239496, municipio: 'Luanda' },
  { sap: 'LU-SUB1103-QUARTEIS', nome: 'SE Quarteis (Angolicuba)', kv: '60/15', mva: 80, lat: -8.820933, lng: "13°14'25.36\"E", municipio: 'Luanda' },
  { sap: 'LU-SUB1103-EDIFISEDE', nome: 'SE Edifício Sede', kv: '60/15', mva: 80, lat: -8.817444, lng: 13.248272, municipio: 'Luanda' },

  // --- DESPACHO 2 ---
  { sap: 'LU-SUB1104-CUCA', nome: 'SE Cuca', kv: '60/15', mva: 80, lat: -8.816325, lng: 13.277128, municipio: 'Cazenga' },
  { sap: 'LU-SUB1104-SEFILDA', nome: 'SE Filda', kv: '60/15', mva: 60, lat: -8.848335, lng: 13.289595, municipio: 'Cazenga' },
  { sap: 'LU-SUB1104-NGOLAKILU', nome: 'SE Ngola Kiluanje', kv: '60/15', mva: 60, lat: -8.785458, lng: 13.307636, municipio: 'Luanda' },
  { sap: 'LU-SUB1104-SECFL', nome: 'SE CFL', kv: '60/15', mva: 40, lat: -8.827760, lng: 13.276360, municipio: 'Luanda' },
  { sap: 'LU-SUB1104-GAMEK', nome: 'SE Gamek-Km9', kv: '60/15', mva: 100, lat: -8.866789, lng: 13.315344, municipio: 'Luanda' },
  { sap: 'LU-SUB1104-TEXTANG', nome: 'SE Textang II', kv: '60/15', mva: 40, lat: -8.827760, lng: 13.276360, municipio: 'Luanda' },
  { sap: 'LU-SUB1104-LSAOPEDRO', nome: 'SE Lagoa de São Pedro', kv: '60/15', mva: 40, lat: -8.812171, lng: 13.292157, municipio: 'Luanda' },

  // --- DESPACHO 3 ---
  { sap: 'LU-SUB1106-ESTALAGEM', nome: 'SE Estalagem', kv: '60/15', mva: 40, lat: "8°53'57.84\"S", lng: "13°20'39.51\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-MOVEKICUXI', nome: 'SE Eta Sudeste (Kicuxi)', kv: '60/15', mva: 40, lat: "8°58'13.01\"S", lng: "13°22'11.54\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-SECAOP', nome: 'SE Viana Caop', kv: '60/15', mva: 40, lat: "8°53'35.76\"S", lng: "13°22'25.21\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-VIANAVILA', nome: 'SE Viana Vila', kv: '60/15', mva: 40, lat: "8°56'13.08\"S", lng: "13°21'52.04\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-ZANGO1', nome: 'SE Zango I', kv: '60/15', mva: 20, lat: "9°1'30.20\"S", lng: "13°23'53.58\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-ZANGO2', nome: 'SE Zango II', kv: '60/15', mva: 40, lat: "9°3'48.98\"S", lng: "13°24'27.30\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-VIANARNT', nome: 'SE Viana RNT', kv: '60/15', mva: 40, lat: "8°55'35.18\"S", lng: "13°23'28.68\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-SEPIV1', nome: 'SE PIV I', kv: '60/15', mva: 20, lat: "8°55'43.36\"S", lng: "13°24'20.89\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-SEPIV2', nome: 'SE PIV II', kv: '60/30', mva: 40, lat: -8.942609, lng: 13.420139, municipio: 'Viana' },
  { sap: 'LU-SUB1106-MULENVOS', nome: 'SE Mulenvos', kv: '60/15', mva: 40, lat: "8°56'33.39\"S", lng: "13°25'12.50\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-KASSAKI', nome: 'SE Kassaki', kv: '60/15', mva: 20, lat: "9°7'53.92\"S", lng: "13°21'52.87\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-KIKUXI', nome: 'SE Kikuxi', kv: '60/30', mva: 80, lat: "8°58'13.01\"S", lng: "13°22'11.54\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-VPACIFICA', nome: 'SE Zango Edifícios (Vila Pacif)', kv: '60/15', mva: 80, lat: "8°59'10.45\"S", lng: "13°24'12.15\"E", municipio: 'Viana' },

  // --- DESPACHO 4 ---
  { sap: 'LU-SUB1105-SEBELAS', nome: 'SE Belas', kv: '60/15', mva: 20, lat: "8°56'36.43\"S", lng: "13°10'23.34\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-NOVAVIDA', nome: 'SE Nova Vida', kv: '60/15', mva: 40, lat: "8°54'25.71\"S", lng: "13°13'52.01\"E", municipio: 'Talatona' },
  { sap: 'LU-SUB1105-MORROBENTO', nome: 'SE Morro Bento', kv: '60/15', mva: 20, lat: "8°53'34.05\"S", lng: "13°11'21.72\"E", municipio: 'Talatona' },
  { sap: 'LU-SUB1105-SECAPOLO', nome: 'SE Capolo', kv: '60/15', mva: 40, lat: "8°52'41.24\"S", lng: "13°17'5.09\"E", municipio: 'Kilamba Kiaxi' },
  { sap: 'LU-SUB1105-CIDCAMAMA', nome: 'SE Cidade Camama (Encib)', kv: '60/15', mva: 80, lat: "8°56'30.29\"S", lng: "13°14'23.76\"E", municipio: 'Talatona' },
  { sap: 'LU-SUB1105-28DEAGOSTO', nome: 'SE 28 de Agosto', kv: '60/15', mva: 80, lat: "8°53'16.20\"S", lng: "13°13'43.99\"E", municipio: 'Kilamba Kiaxi' },
  { sap: 'LU-SUB1105-TALATONA', nome: 'SE Talatona', kv: '60/15', mva: 80, lat: "8°55'3.64\"S", lng: "13°11'54.06\"E", municipio: 'Talatona' },
  { sap: 'LU-SUB1105-SESAPU', nome: 'SE Sapú', kv: '60/15', mva: 80, lat: "8°56'21.89\"S", lng: "13°17'45.14\"E", municipio: 'Kilamba Kiaxi' },
  { sap: 'LU-SUB1105-SEGOLFE', nome: 'SE Golfe', kv: '60/15', mva: 80, lat: "8°55'9.91\"S", lng: "13°15'29.42\"E", municipio: 'Kilamba Kiaxi' },
  { sap: 'LU-SUB1105-CAMAMENDE', nome: 'SE Camama (RNT)', kv: '60/15', mva: 40, lat: "8°58'13.81\"S", lng: "13°15'23.73\"E", municipio: 'Talatona' },

  // --- DESPACHO 5 ---
  { sap: 'LU-SUB1105-BENFICA', nome: 'SE Benfica', kv: '60/15', mva: 20, lat: "8°57'12.93\"S", lng: "13°9'51.74\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-RAMIROS', nome: 'SE Ramiros', kv: '60/15', mva: 20, lat: "9°3'45.41\"S", lng: "13°7'55.84\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-KILAMBA1A', nome: 'SE Kilamba II', kv: '60/15', mva: 120, lat: "8°59'52.21\"S", lng: "13°15'23.42\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-SEKIFICA', nome: 'SE Kifica', kv: '60/15', mva: 40, lat: "8°57'12.93\"S", lng: "13°9'51.74\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-ZONAVERDE', nome: 'SE Zona Verde', kv: '60/15', mva: 40, lat: "8°59'8.16\"S", lng: "13°10'3.75\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-MUNDIAL', nome: 'SE Mundial', kv: '60/15', mva: 40, lat: "9°2'29.71\"S", lng: "13°9'40.66\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-PALMEIRINH', nome: 'SE Palmeirinhas (Móvel)', kv: '60/15', mva: 20, lat: "9°15'19.36\"S", lng: "13°6'57.73\"E", municipio: 'Belas' },
  { sap: 'LU-SUB1105-KILAMBA1B', nome: 'SE Kilamba II (1B)', kv: '60/15', mva: 120, lat: "8°59'52.63\"S", lng: "13°16'40.01\"E", municipio: 'Belas' },


  // --- DESPACHO 6 ---
  { sap: 'LU-SUB1104-KIFANGONDO', nome: 'SE Kifangondo', kv: '60/15', mva: 40, lat: "8°45'36.72\"S", lng: "13°25'23.61\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1104-CACUACOVIL', nome: 'SE Cacuaco Vila', kv: '60/15', mva: 40, lat: "8°46'50.78\"S", lng: "13°21'48.99\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1106-SEZEE1', nome: 'SE ZEE I', kv: '60/30', mva: 60, lat: "8°57'36.69\"S", lng: "13°27'13.03\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-SEZEE2', nome: 'SE ZEE II', kv: '60/15', mva: 80, lat: "8°59'46.83\"S", lng: "13°28'54.75\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-MUSSEQUE', nome: 'SE Cacuaco Sequele', kv: '60/15', mva: 40, lat: "8°53'10.74\"S", lng: "13°29'3.89\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1106-BOMJESUS', nome: 'SE Bom Jesus', kv: '60/15', mva: 40, lat: "9°9'50.55\"S", lng: "13°34'3.14\"E", municipio: 'Icolo e Bengo' },
  { sap: 'LU-SUB1106-SEKM44', nome: 'SE Km 44', kv: '60/15', mva: 20, lat: "9°2'30.19\"S", lng: "13°34'49.47\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1104-COLACOLA', nome: 'SE Coca-Cola', kv: '60/15', mva: 20, lat: "8°50'38.58\"S", lng: "13°30'27.17\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1104-COLCOLACO', nome: 'SE Móvel Coca-cola', kv: '60/30', mva: 20, lat: "8°50'37.97\"S", lng: "13°30'26.02\"E", municipio: 'Viana' },
  { sap: 'LU-SUB1106-CATETEVILA', nome: 'SE Catete Vila', kv: '60/30', mva: 40, lat: "9°6'19.62\"S", lng: "13°41'20.32\"E", municipio: 'Icolo e Bengo' },
  { sap: 'LU-SUB1104-BELOMONTE', nome: 'SE Belo Monte', kv: '60/15', mva: 40, lat: "8°51'29.92\"S", lng: "13°25'14.95\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1104-PEDREIRA', nome: 'SE Pedreira', kv: '60/15', mva: 40, lat: "8°49'23.53\"S", lng: "13°22'36.89\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1104-NOVO AEROPORTO', nome: 'SE Novo Aeroporto', kv: '60/15', mva: 80, lat: -8.996340, lng: 13.481874, municipio: 'Icolo e Bengo' },

  // --- DESPACHO 7 ---
  { sap: 'LU-SUB1107-MPANGUILA', nome: 'SE Panguila (Móvel)', kv: '60/15', mva: 20, lat: "8°41'47.32\"S", lng: "13°26'29.18\"E", municipio: 'Cacuaco' },
  { sap: 'LU-SUB1107-MABUBAS', nome: 'SE Mabubas', kv: '60/30', mva: 40, lat: "8°32'4.59\"S", lng: "13°41'42.81\"E", municipio: 'Dande' },
  { sap: 'LU-SUB1107-KAPARI', nome: 'SE Musseque Kapari', kv: '60/15', mva: 20, lat: "8°39'8.98\"S", lng: "13°31'4.04\"E", municipio: 'Dande' },
  { sap: 'LU-SUB1107-BARRADANDE', nome: 'SE Barra do Dande', kv: '60/15', mva: 20, lat: "8°29'28.49\"S", lng: "13°22'43.41\"E", municipio: 'Dande' },
  { sap: 'LU-SUB1107-AMBRIZ', nome: 'SE Ambriz', kv: '60/30', mva: 20, lat: "7°50'30\"S", lng: "13°6'30\"E", municipio: 'Ambriz' },

  // --- SE PRIVADAS ---
  { sap: 'PRIV-SIDURGIA', nome: 'SE Sidurgia', kv: '60/15', mva: 16, lat: "8°45'52.17\"S", lng: "13°18'42.68\"E", municipio: 'Viana' },
  { sap: 'PRIV-REFINARIA', nome: 'SE Refinaria', kv: '60/15', mva: 15, lat: "8°46'56.37\"S", lng: "13°18'28.20\"E", municipio: 'Luanda' },
  { sap: 'PRIV-ACAIL', nome: 'SE Acail', kv: '60/15', mva: 8, lat: "8°56'0.97\"S", lng: "13°24'44.73\"E", municipio: 'Viana' },
  { sap: 'PRIV-CIMENTEIRA', nome: 'SE Cimenteira CIF', kv: '60/15', mva: 40, lat: -9.108438, lng: 13.565881, municipio: 'Cacuaco' },
  { sap: 'PRIV-BARCACA', nome: 'SE Barcaça', kv: '60/15', mva: 60, lat: -8.784307, lng: 13.278675, municipio: 'Luanda' },
  { sap: 'PRIV-FABRIMETAL', nome: 'SE Fabrimetal', kv: '60/30', mva: 20, lat: "8°56'55.70\"S", lng: "13°23'29.36\"E", municipio: 'Viana' },
  { sap: 'PRIV-GCCSTEEL', nome: 'SE GCC Steel', kv: '60/10', mva: 45, lat: "8°56'36.95\"S", lng: "13°25'18.01\"E", municipio: 'Viana' },
  { sap: 'PRIV-CIMANGOL1', nome: 'SE Cimangol I', kv: '60/15', mva: 30, lat: "8°45'54.32\"S", lng: "13°18'33.09\"E", municipio: 'Cacuaco' },
  { sap: 'PRIV-CIMANGOL2', nome: 'SE Cimangol II', kv: '60/10', mva: 40, lat: "8°47'52.93\"S", lng: "13°25'33.40\"E", municipio: 'Cacuaco' },
  { sap: 'PRIV-ETACASSAQUE', nome: 'SE ETA Cassaque (EPAL)', kv: '60/', mva: 16, lat: -9.118342, lng: 13.364385, municipio: 'Talatona' },
  { sap: 'PRIV-ETAKIFANGON', nome: 'SE ETA Kifangondo (EPAL)', kv: '60/', mva: 15, lat: -8.785078, lng: 13.432413, municipio: 'Cacuaco' },
];

async function main() {
  console.log('🚀 Iniciando importação exaustiva de subestações...');

  for (const item of substationsData) {
    const latDecimal = dmsToDecimal(item.lat);
    const lngDecimal = dmsToDecimal(item.lng);

    // Parse de tensão (ex: 60/15 -> entrada 60, saída 15)
    const [vin, vout] = item.kv.split('/').map(v => parseFloat(v) || null);

    try {
      await prisma.subestacao.upsert({
        where: { codigo_operacional: item.sap },
        update: {
          nome: item.nome,
          municipio: item.municipio,
          latitude: latDecimal,
          longitude: lngDecimal,
          tensao_kv_entrada: vin,
          tensao_kv_saida: vout,
          capacidade_total_mva: item.mva,
          status: 'Ativa',
          tipo: item.sap.startsWith('PRIV-') ? 'Privada' : 'Distribuição'
        },
        create: {
          nome: item.nome,
          codigo_operacional: item.sap,
          municipio: item.municipio,
          latitude: latDecimal,
          longitude: lngDecimal,
          tensao_kv_entrada: vin,
          tensao_kv_saida: vout,
          capacidade_total_mva: item.mva,
          status: 'Ativa',
          tipo: item.sap.startsWith('PRIV-') ? 'Privada' : 'Distribuição',
          data_instalacao: new Date()
        }
      });
      console.log(`[OK] ${item.nome} (${item.sap})`);
    } catch (err) {
      console.error(`[ERRO] ${item.nome}: ${err.message}`);
    }
  }

  console.log('✅ Importação exaustiva concluída!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
