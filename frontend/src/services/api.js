import axios from 'axios';
import * as mockData from './mockData';

// Set to true for internal testing or limited environments
const USE_MOCK = true; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@PTAS:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Implementation for immediate functioning (no DB required)
if (USE_MOCK) {
  console.warn('⚠️ MBT ENERGIA: Operando em Modo Mock (Dados em Memória)');
  
  api.get = async (url, config) => {
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));

    if (url.startsWith('/subestacoes')) {
      const parts = url.split('/');
      if (parts.length > 2) {
        // GET /subestacoes/:id
        const id = Number(parts[2]);
        return { data: mockData.mockSubestacoes.find(s => s.id === id) };
      }
      return { data: mockData.mockSubestacoes };
    }

    if (url.startsWith('/pts')) {
      const parts = url.split('/');
      if (parts.length > 2) {
        // GET /pts/:id or id_pt
        const val = parts[2];
        const numId = Number(val);
        const pt = !isNaN(numId) 
          ? mockData.mockPTs.find(p => p.id === numId)
          : mockData.mockPTs.find(p => p.id_pt === val);
        return { data: pt };
      }
      // Simple filter for subestacao
      const subId = config?.params?.subestacaoId;
      if (subId) {
        return { data: mockData.mockPTs.filter(pt => pt.subestacaoId === Number(subId)) };
      }
      return { data: mockData.mockPTs };
    }

    if (url.startsWith('/inspecoes')) {
      const parts = url.split('/');
      if (parts.length > 2) {
        // GET /inspecoes/:id
        const id = Number(parts[2]);
        return { data: mockData.mockInspecoes.find(i => i.id === id) };
      }
      // Filter for PT-specific inspections if id_pt is provided in params
      const idPt = config?.params?.id_pt;
      if (idPt) {
        return { data: mockData.mockInspecoes.filter(i => i.id_pt === idPt) };
      }
      return { data: mockData.mockInspecoes };
    }

    if (url === '/auth/validate') {
      return { data: { user: mockData.mockUsers[0] } };
    }

    return { data: [] };
  };

  api.post = async (url, data) => {
    if (url === '/utilizadores/login') {
      const user = mockData.mockUsers.find(u => u.email === data.email);
      if (user) {
        return { 
          data: { 
            user, 
            token: 'mock-jwt-token-mbt-energia-' + Date.now() 
          } 
        };
      }
      throw new Error('Credenciais inválidas');
    }
    if (url === '/inspecoes') {
      const newInspecao = { id: Date.now(), ...data };
      mockData.mockInspecoes.push(newInspecao);
      return { data: newInspecao };
    }
    return { data: { success: true, ...data } };
  };

  api.put = async (url, data) => {
    console.log(`[Mock API] PUT ${url}`, data);
    if (url.startsWith('/subestacoes/')) {
      const id = Number(url.split('/')[2]);
      const index = mockData.mockSubestacoes.findIndex(s => s.id === id);
      if (index !== -1) {
        mockData.mockSubestacoes[index] = { ...mockData.mockSubestacoes[index], ...data };
      }
    }
    if (url.startsWith('/pts/')) {
      const id = Number(url.split('/')[2]);
      const index = mockData.mockPTs.findIndex(pt => pt.id === id);
      if (index !== -1) {
        mockData.mockPTs[index] = { ...mockData.mockPTs[index], ...data };
      }
    }
    if (url.startsWith('/inspecoes/')) {
      const id = Number(url.split('/')[2]);
      const index = mockData.mockInspecoes.findIndex(i => i.id === id);
      if (index !== -1) {
        mockData.mockInspecoes[index] = { ...mockData.mockInspecoes[index], ...data };
      }
    }
    return { data: { success: true, ...data } };
  };

  api.delete = async (url) => {
    if (url.startsWith('/inspecoes/')) {
      const id = Number(url.split('/')[2]);
      mockData.mockInspecoes = mockData.mockInspecoes.filter(i => i.id !== id);
    }
    return { status: 204 };
  };
}

export default api;
