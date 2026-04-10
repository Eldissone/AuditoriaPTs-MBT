const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  getGpsForMunicipio, 
  parseGps, 
  calcularDistanciaHaversine, 
  getMunicipioByLocalidade 
} = require('../src/utils/angolaGps');

async function main() {
  console.log('🚀 Iniciando re-associação inteligente de PTs...');

  // 1. Carregar Subestações
  const allSubs = await prisma.subestacao.findMany({
    where: { status: 'Ativa' }
  });

  let generalSub = allSubs.find(s => s.codigo_operacional === 'GERAL');
  if (!generalSub) {
    console.log('⚠️ Subestação Geral não encontrada. Criando...');
    generalSub = await prisma.subestacao.create({
      data: {
        nome: 'Subestação Geral (Padrão)',
        codigo_operacional: 'GERAL',
        tipo: 'Distribuição',
        municipio: 'Diversos'
      }
    });
  }

  const subCoordsCache = allSubs
    .map(s => {
      let coords = null;
      if (s.latitude && s.longitude) coords = { lat: s.latitude, lng: s.longitude };
      else if (s.gps) coords = parseGps(s.gps);
      return { ...s, coords };
    })
    .filter(s => s.coords);

  const municipioToSubId = new Map();
  allSubs.forEach(s => {
    if (s.municipio && !municipioToSubId.has(s.municipio.toLowerCase())) {
      municipioToSubId.set(s.municipio.toLowerCase(), s.id);
    }
  });

  // 2. Carregar Clientes
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      id_pt: true,
      id_subestacao: true,
      gps: true,
      municipio: true,
      distrito_comuna: true,
      localizacao: true,
      bairro: true
    }
  });

  console.log(`📦 Processando ${clientes.length} clientes...`);

  let countChanged = 0;

  for (const client of clientes) {
    const clientGpsStr = client.gps;
    const clientLocalidade = (client.distrito_comuna || client.bairro || client.localizacao || '').trim();
    const clientMunicipioName = (client.municipio || '').trim();

    let newSubId = null;

    // --- LÓGICA DE ASSOCIAÇÃO ---
    
    // HIERARQUIA 1: Geoespacial
    const clientCoords = parseGps(clientGpsStr || getGpsForMunicipio(clientMunicipioName));
    if (clientCoords) {
      const BOUNDING_BOX_DELTA = 0.3;
      const MAX_RADIUS_KM = 30;
      let minDistance = Infinity;
      let closest = null;

      const candidates = subCoordsCache.filter(sub => 
        Math.abs(sub.coords.lat - clientCoords.lat) <= BOUNDING_BOX_DELTA &&
        Math.abs(sub.coords.lng - clientCoords.lng) <= BOUNDING_BOX_DELTA
      );

      for (const sub of candidates) {
        const dist = calcularDistanciaHaversine(clientCoords.lat, clientCoords.lng, sub.coords.lat, sub.coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = sub;
        }
      }
      if (closest && minDistance <= MAX_RADIUS_KM) newSubId = closest.id;
    }

    // HIERARQUIA 2: Administrativa (Nome match)
    if (!newSubId && clientLocalidade) {
      const localLower = clientLocalidade.toLowerCase();
      const matchedSub = allSubs.find(s => 
        s.nome.toLowerCase().includes(localLower) || 
        localLower.includes(s.nome.toLowerCase())
      );
      if (matchedSub) newSubId = matchedSub.id;
    }

    // HIERARQUIA 3: Município Inteligente
    if (!newSubId) {
      let refinedMunicipio = clientMunicipioName.toLowerCase();
      if (refinedMunicipio === 'luanda' && clientLocalidade) {
        refinedMunicipio = getMunicipioByLocalidade(clientLocalidade) || refinedMunicipio;
      }
      newSubId = municipioToSubId.get(refinedMunicipio) || generalSub.id;
    }

    // --- ATUALIZAÇÃO ---
    if (newSubId && newSubId !== client.id_subestacao) {
      await prisma.cliente.update({
        where: { id: client.id },
        data: { id_subestacao: newSubId }
      });
      countChanged++;
    }
  }

  console.log(`✅ Concluído! ${countChanged} PTs foram re-associados a subestações mais adequadas.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
