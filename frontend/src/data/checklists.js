// ─── Checklist PTA — 32 itens ────────────────────────────────────────────────
// Prioridade: A = Urgente (Segurança), B = Alta, C = Normal
export const CHECKLIST_PTA = [
  // TRAVESSA
  { id: 'pta_01', secao: 'Travessa', prio: 'B', label: '1 Estado geral' },
  // APOIO
  { id: 'pta_02', secao: 'Apoio', prio: 'B', label: '2 Estado geral' },
  { id: 'pta_03', secao: 'Apoio', prio: 'C', label: '3 Acessos' },
  // PLATAFORMA
  { id: 'pta_04', secao: 'Plataforma', prio: 'B', label: '4 Do seccionador – Estado geral' },
  { id: 'pta_05', secao: 'Plataforma', prio: 'B', label: '5 Do quadro - Estado geral' },
  { id: 'pta_06', secao: 'Plataforma', prio: 'A', label: '6 Ligação a terra de protecção' },
  // SECCIONADOR
  { id: 'pta_07', secao: 'Seccionador', prio: 'A', label: '7 Estado geral (Isoladores, facas e combinado)' },
  { id: 'pta_08', secao: 'Seccionador', prio: 'C', label: '8 Numeração do órgão de corte' },
  { id: 'pta_09', secao: 'Seccionador', prio: 'A', label: '9 Comando ligado a terra' },
  // BARRAMENTO
  { id: 'pta_10', secao: 'Barramento', prio: 'B', label: '10 Estado geral' },
  // TRANSFORMADOR
  { id: 'pta_11', secao: 'Transformador', prio: 'B', label: '11 Existência de focos de corrosão' },
  { id: 'pta_12', secao: 'Transformador', prio: 'B', label: '12 Isoladores – Primário e Secundário' },
  { id: 'pta_13', secao: 'Transformador', prio: 'C', label: '13 Chapa de característica visível' },
  { id: 'pta_14', secao: 'Transformador', prio: 'A', label: '14 Nível de óleo' },
  { id: 'pta_15', secao: 'Transformador', prio: 'A', label: '15 Fugas de óleo e estado das juntas de vedação' },
  { id: 'pta_16', secao: 'Transformador', prio: 'B', label: '16 Estado da sílica gel b)' },
  { id: 'pta_17', secao: 'Transformador', prio: 'C', label: '17 Suporte' },
  // DESCARREGADORES
  { id: 'pta_18', secao: 'Descarregadores', prio: 'A', label: '18 Estado geral e ligação directa à terra' },
  // TUBOS DE PROTECÇÃO
  { id: 'pta_19', secao: 'Tubos de Protecção', prio: 'B', label: '19 Estado geral e fixação' },
  // QUADRO GERAL BT
  { id: 'pta_20', secao: 'Quadro Geral BT', prio: 'B', label: '20 Invólucro – Estado geral, limpeza e pintura' },
  { id: 'pta_21', secao: 'Quadro Geral BT', prio: 'C', label: '21 Placa de identificação e de “Perigo de Morte”' },
  { id: 'pta_22', secao: 'Quadro Geral BT', prio: 'B', label: '22 Cadeado/Chave' },
  { id: 'pta_23', secao: 'Quadro Geral BT', prio: 'A', label: '23 Interruptor geral/Disjuntor' },
  { id: 'pta_24', secao: 'Quadro Geral BT', prio: 'B', label: '24 Indicação do sentido de rotação de fases' },
  { id: 'pta_25', secao: 'Quadro Geral BT', prio: 'C', label: '25 Indicação de saídas BT' },
  { id: 'pta_26', secao: 'Quadro Geral BT', prio: 'B', label: '26 Bases fusíveis' },
  { id: 'pta_27', secao: 'Quadro Geral BT', prio: 'B', label: '27 Calibre de fusíveis conforme “Ficha de fusíveis” afixada' },
  { id: 'pta_28', secao: 'Quadro Geral BT', prio: 'A', label: '28 Existência de pontos quentes barramentos/Ligações' },
  { id: 'pta_29', secao: 'Quadro Geral BT', prio: 'A', label: '29 Mapa de registo de terra (TP: TS:)' },
  { id: 'pta_30', secao: 'Quadro Geral BT', prio: 'C', label: '30 Croqui da localização de circuitos de terra' },
  { id: 'pta_31', secao: 'Quadro Geral BT', prio: 'B', label: '31 Bainhas de cabos BT isolados/desligados' },
  { id: 'pta_32', secao: 'Quadro Geral BT', prio: 'C', label: '32 Mapa de primeiros socorros' },
];

// ─── Checklist PTC — 37 itens ────────────────────────────────────────────────
export const CHECKLIST_PTC = [
  // 1. EDIFÍCIO
  { id: 'ptc_01', secao: 'Edifício', prio: 'A', label: 'Porta principal com fecho e cadeado funcional' },
  { id: 'ptc_02', secao: 'Edifício', prio: 'A', label: 'Vedação exterior sem danos' },
  { id: 'ptc_03', secao: 'Edifício', prio: 'A', label: 'Sinalização de perigo elétrico visível e legível' },
  { id: 'ptc_04', secao: 'Edifício', prio: 'B', label: 'Ventilação natural ou forçada a funcionar' },
  { id: 'ptc_05', secao: 'Edifício', prio: 'B', label: 'Iluminação interior funcional' },
  { id: 'ptc_06', secao: 'Edifício', prio: 'B', label: 'Extintor de incêndio presente e dentro da validade' },
  { id: 'ptc_07', secao: 'Edifício', prio: 'C', label: 'Ausência de infestação (roedores, insetos)' },
  { id: 'ptc_08', secao: 'Edifício', prio: 'C', label: 'Piso em bom estado (sem humidade ou água acumulada)' },
  // 2. TRANSFORMADOR
  { id: 'ptc_09', secao: 'Transformador', prio: 'A', label: 'Transformador sem fugas de óleo visíveis' },
  { id: 'ptc_10', secao: 'Transformador', prio: 'A', label: 'Nível de óleo dentro dos limites' },
  { id: 'ptc_11', secao: 'Transformador', prio: 'A', label: 'Temperatura de operação normal' },
  { id: 'ptc_12', secao: 'Transformador', prio: 'B', label: 'Estado das buchas de MT (sem fissuração)' },
  { id: 'ptc_13', secao: 'Transformador', prio: 'B', label: 'Placa de características legível e de acordo com cadastro' },
  { id: 'ptc_14', secao: 'Transformador', prio: 'C', label: 'Estado da pintura/estrutura do transformador' },
  // 3. QGBT
  { id: 'ptc_15', secao: 'QGBT', prio: 'A', label: 'QGBT fechado e sem danos visíveis' },
  { id: 'ptc_16', secao: 'QGBT', prio: 'A', label: 'Barras de BT sem calor excessivo ou oxidação' },
  { id: 'ptc_17', secao: 'QGBT', prio: 'A', label: 'Disjuntor geral de BT operacional' },
  { id: 'ptc_18', secao: 'QGBT', prio: 'B', label: 'Disjuntores de saída operacionais e identificados' },
  { id: 'ptc_19', secao: 'QGBT', prio: 'B', label: 'Fusíveis corretos e em bom estado' },
  { id: 'ptc_20', secao: 'QGBT', prio: 'C', label: 'Cabos de BT identificados e organizados' },
  // 4. MÉDIA TENSÃO
  { id: 'ptc_21', secao: 'Média Tensão', prio: 'A', label: 'Chegada de MT sem danos ou sobreaquecimento' },
  { id: 'ptc_22', secao: 'Média Tensão', prio: 'A', label: 'Interruptor de MT operacional' },
  { id: 'ptc_23', secao: 'Média Tensão', prio: 'A', label: 'Para-raios de MT operacionais' },
  { id: 'ptc_24', secao: 'Média Tensão', prio: 'B', label: 'Fusíveis de MT corretos' },
  { id: 'ptc_25', secao: 'Média Tensão', prio: 'B', label: 'Cabos de MT sem danos visíveis' },
  // 5. TERRA
  { id: 'ptc_26', secao: 'Terra', prio: 'A', label: 'Barramento de terra visível e em bom estado' },
  { id: 'ptc_27', secao: 'Terra', prio: 'A', label: 'Condutores de terra sem corrosão ou danos' },
  { id: 'ptc_28', secao: 'Terra', prio: 'A', label: 'Terra de Protecção (TP) < 20Ω (registar medição)' },
  { id: 'ptc_29', secao: 'Terra', prio: 'A', label: 'Terra de Serviço (TS) < 20Ω (registar medição)' },
  // 6. CONTADOR / MEDIÇÃO
  { id: 'ptc_30', secao: 'Contador', prio: 'B', label: 'Contador de energia em funcionamento' },
  { id: 'ptc_31', secao: 'Contador', prio: 'B', label: 'Lacres do contador intactos' },
  { id: 'ptc_32', secao: 'Contador', prio: 'C', label: 'Leitura do contador registada' },
  // 7. INFRA
  { id: 'ptc_33', secao: 'Infraestrutura', prio: 'B', label: 'Drenagem de óleo funcional (cuba de retenção)' },
  { id: 'ptc_34', secao: 'Infraestrutura', prio: 'B', label: 'Identificação do PT visível (número no edifício)' },
  { id: 'ptc_35', secao: 'Infraestrutura', prio: 'C', label: 'Planta de emergência/diagrama unifilar afixado' },
  { id: 'ptc_36', secao: 'Infraestrutura', prio: 'C', label: 'Livro de ocorrências disponível e actualizado' },
  { id: 'ptc_37', secao: 'Infraestrutura', prio: 'C', label: 'Equipamento de protecção individual (EPI) disponível' },
];

/**
 * Retorna o checklist adequado com base no tipo de instalação do PT.
 * @param {string} tipoInstalacao - ex: 'Cabine', 'PTC', 'PTA', 'Posto de Transformação Aéreo', etc.
 * @param {string} titulo - Opcional, título da tarefa para reforçar a detecção.
 * @returns {Array} checklist items com { id, secao, prio, label, checked: false, resultado: '' }
 */
export function getChecklistForType(tipoInstalacao, titulo = '') {
  const t = (tipoInstalacao || '').toUpperCase();
  const tit = (titulo || '').toUpperCase();
  
  // Detecção robusta: se for Cabine, Edifício ou mencionar PTC no tipo ou título
  const isPTC = t.includes('CABIN') || 
                t.includes('EDIFICIO') || 
                t === 'PTC' || 
                t.includes('CABINE') ||
                tit.includes('PTC') ||
                tit.includes('CABINE');
                
  const base = isPTC ? CHECKLIST_PTC : CHECKLIST_PTA;
  return base.map(item => ({ ...item, checked: false, resultado: '' }));
}
