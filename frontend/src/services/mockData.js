// Centralized Mock Data for MBT Energia (Modular System)

export const mockUsers = [
  {
    id: 1,
    nome: 'Auditor MBT Energia',
    email: 'auditor@ptas.ao',
    token: 'mock-jwt-token-12345',
    role: 'admin'
  }
];

export const mockSubestacoes = [
  {
    id: 1,
    codigo: 'SUB-MBT-001',
    nome: 'Subestação Central MBT',
    localizacao: 'Cazenga, Luanda',
    gps: '-8.8051, 13.2921',
    municipio: 'Cazenga',
    provincia: 'Luanda',
    tipo: 'Abaixadora',
    proprietario: 'MBT Energia',
    operador: 'Equipa Alfa',
    ano_construcao: '2022-01-15',
    entrada_operacao: '2022-06-01',
    tensao_alimentacao: '60kV',
    potencia_total_kva: 10000,
    concessionaria: 'ENDE',
    estado: 'Ativa',
    media_tensao: {
      Tipo_Celas: 'SF6 Compactas',
      Estado_Disjuntores: 'Operacional',
      Estado_Seccionadores: 'Bom',
      Reles_Protecao: 'Digital multifunção',
      Coordenacao_Protecoes: 'Verificada',
      Aterramento_MT: 'Ligação direta'
    },
    baixa_tensao: {
      corrente_fase_c: 452,
      tensao: 400,
      fator_potencia: 0.98
    },
    transformadores: [
      { num: 1, potencia: 2500, tensao_p: 60, tensao_s: 15, tipo: 'Óleo', estado_oleo: 'Óptimo', fugas: false },
      { num: 2, potencia: 2500, tensao_p: 60, tensao_s: 15, tipo: 'Óleo', estado_oleo: 'Bom', fugas: false }
    ],
    seguranca: {
      resistencia_terra: 0.2,
      protecao_raios: true,
      spd: true,
      sinalizacao: true,
      combate_incendio: true,
      distancias_seguranca: true
    },
    infraestrutura: {
      estado_cabine: 'Excelente',
      ventilacao: true,
      drenagem: true,
      iluminacao: true,
      controlo_acesso: true
    },
    monitorizacao: {
      scada: true,
      sensores_temperatura: true,
      sensores_corrente: true,
      sensores_vibracao: true,
      registo_eventos: true,
      comunicacao: 'Fibra Óptica / 4G'
    },
    manutencao: {
      historico_falhas: 'Nenhuma falha crítica em 2023',
      mtbf: 8760,
      mttr: 2,
      plano_preventivo: true,
      plano_preditivo: true,
      sobressalentes: true
    },
    risco: {
      nivel_risco_geral: 'Mínimo',
      sobrecarga: false,
      desequilibrio_fases: false,
      redundancia: true
    }
  },
  {
    id: 2,
    codigo: 'SUB-MBT-VN1',
    nome: 'Subestação Viana Sul',
    localizacao: 'Viana, Luanda',
    gps: '-8.9051, 13.3921',
    municipio: 'Viana',
    provincia: 'Luanda',
    tipo: 'Elevadora',
    proprietario: 'MBT Energia',
    operador: 'Equipa Beta',
    ano_construcao: '2021-03-20',
    entrada_operacao: '2021-08-15',
    tensao_alimentacao: '110kV',
    potencia_total_kva: 25000,
    concessionaria: 'PRODEL',
    estado: 'Ativa'
  }
];

export const mockPTs = [
  {
    id: 1,
    id_pt: 'PT-001',
    subestacaoId: 1,
    estado: 'Operacional',
    localizacao: 'Zona Industrial de Aveiro',
    gps: '40.6443, -8.6455',
    tipo_instalacao: 'Alvenaria',
    nivel_tensao: '15kV',
    potencia_kva: 630,
    ano_instalacao: 2015,
    fabricante: 'EFACEC',
    num_transformadores: 1,
    regime_exploracao: 'Privado',
    subestacao: mockSubestacoes[0]
  },
  {
    id: 2,
    id_pt: 'PT-MBT-02',
    subestacaoId: 1,
    estado: 'Sob Carga',
    localizacao: 'Cazenga, Bloco B',
    nivel_tensao: '15/0.4 kV',
    potencia_kva: 1000,
    ano_instalacao: 2022,
    tipo_instalacao: 'Posto Aéreo',
    subestacao: mockSubestacoes[0]
  },
  {
    id: 3,
    id_pt: 'PT-VN-001',
    subestacaoId: 2,
    estado: 'Crítico',
    localizacao: 'Viana, Zona Industrial',
    nivel_tensao: '30/0.4 kV',
    potencia_kva: 1250,
    ano_instalacao: 2023,
    tipo_instalacao: 'Cabine',
    subestacao: mockSubestacoes[1]
  }
];

export const mockConsumption = [
  { name: 'Jan', consumo: 4200, anterior: 3100 },
  { name: 'Fev', consumo: 3800, anterior: 2900 },
  { name: 'Mar', consumo: 5100, anterior: 4200 },
  { name: 'Abr', consumo: 4600, anterior: 3800 },
  { name: 'Mai', consumo: 5900, anterior: 4900 },
  { name: 'Jun', consumo: 5500, anterior: 5100 },
];

export let mockInspecoes = [
  {
    id: 1,
    id_pt: 'PT-001',
    tipo: 'Preventiva',
    data_inspecao: '2024-03-20',
    proxima_inspecao: '2025-03-20',
    pt: mockPTs[0]
  },
  {
    id: 2,
    id_pt: 'PT-VN-001',
    tipo: 'Corretiva',
    data_inspecao: '2024-03-10',
    proxima_inspecao: '2024-03-25', // Overdue
    pt: mockPTs[2]
  }
];
