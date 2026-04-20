const axios = require('axios');

async function testApi() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZWNuaWNvQG1idGVuZXJnaWEuY29tIiwicm9sZSI6ImF1ZGl0b3IiLCJpYXQiOjE3NzY2Nzk0OTIsImV4cCI6MTc3NjY4MzA5Mn0.y7xD_yPKNVxXKK5yX0PH0_F3eNFm4wW0HYLBWODbsXI';
  try {
    console.log('Chamando /api/clientes com token gerado...');
    const res = await axios.get('http://localhost:3000/api/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCESSO! Status:', res.status);
    console.log('Itens retornados:', (res.data.data || res.data).length);
    process.exit(0);
  } catch (err) {
    console.error('ERRO NA API:', err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
}

testApi();
