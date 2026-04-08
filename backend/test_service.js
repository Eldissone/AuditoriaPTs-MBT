const service = require('./src/modules/dashboard/service');

async function test() {
  try {
    console.log('Testing DashboardService.getMapData...');
    const result = await service.getMapData();
    console.log('Success!', result.subestacoes.length + ' substations found.');
  } catch (error) {
    console.error('ERROR during service call:', error);
  }
}

test();
