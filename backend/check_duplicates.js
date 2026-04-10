const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    // 1. Check for substations with same name
    const subNames = await prisma.subestacao.groupBy({
      by: ['nome'],
      _count: { id: true },
      having: { nome: { _count: { gt: 1 } } }
    });
    console.log('Duplicate Substation Names:', subNames);

    // 2. Check for clients with same id_pt (should be 0 since it is unique)
    // but maybe they are linked to multiple substations? (Impossible with schema)
    
    // 3. Check distribution of clients per substation
    const dist = await prisma.subestacao.findMany({
      select: {
        id: true,
        nome: true,
        codigo_operacional: true,
        _count: { select: { pts: true } }
      },
      orderBy: { pts: { _count: 'desc' } }
    });
    console.log('Clients per Substation:', dist.slice(0, 10));

    // 4. Check if any client has multiple entries (impossible via prisma, but check DB if possible)
    // Actually, check if there are clients with same names/properties but different id_pt
    const duplicateClients = await prisma.cliente.groupBy({
      by: ['proprietario', 'localizacao'],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } }
    });
    console.log('Potential duplicate clients (same owner/loc):', duplicateClients.length);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
