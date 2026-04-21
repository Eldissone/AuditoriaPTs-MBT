// ─── Checklist PTA — 32 itens ────────────────────────────────────────────────
// Prioridade: A = Urgente (Segurança), B = Alta, C = Normal
export const CHECKLIST_PTA = [
  // 1. SEGURANÇA
  { id: 'pta_01', secao: 'Segurança', prio: 'A', label: 'Vedação/muro em bom estado e sem danos' },
  { id: 'pta_02', secao: 'Segurança', prio: 'A', label: 'Porta de acesso com fecho e cadeado funcional' },
  { id: 'pta_03', secao: 'Segurança', prio: 'A', label: 'Sinalização de perigo visível e legível' },
  { id: 'pta_04', secao: 'Segurança', prio: 'A', label: 'Distâncias de segurança a vegetação respeitadas (>3m)' },
  { id: 'pta_05', secao: 'Segurança', prio: 'B', label: 'Extintor de incêndio presente e dentro da validade' },
  { id: 'pta_06', secao: 'Segurança', prio: 'B', label: 'Ausência de objectos estranhos dentro da vedação' },
  // 2. TRANSFORMADOR
  { id: 'pta_07', secao: 'Transformador', prio: 'A', label: 'Transformador sem fugas de óleo visíveis' },
  { id: 'pta_08', secao: 'Transformador', prio: 'A', label: 'Nível de óleo dentro dos limites' },
  { id: 'pta_09', secao: 'Transformador', prio: 'A', label: 'Temperatura de operação normal (sem sobreaquecimento)' },
  { id: 'pta_10', secao: 'Transformador', prio: 'B', label: 'Estado das buchas (sem fissuração ou contaminação)' },
  { id: 'pta_11', secao: 'Transformador', prio: 'B', label: 'Placa de características legível e de acordo com cadastro' },
  { id: 'pta_12', secao: 'Transformador', prio: 'C', label: 'Estado da pintura/carrossseria do transformador' },
  // 3. MEDIA TENSÃO
  { id: 'pta_13', secao: 'Média Tensão', prio: 'A', label: 'Isoladores de MT sem danos ou contaminações' },
  { id: 'pta_14', secao: 'Média Tensão', prio: 'A', label: 'Para-raios de MT operacionais' },
  { id: 'pta_15', secao: 'Média Tensão', prio: 'A', label: 'Fusíveis de MT presentes e corretos' },
  { id: 'pta_16', secao: 'Média Tensão', prio: 'B', label: 'Cabos e ligações de MT sem danos' },
  { id: 'pta_17', secao: 'Média Tensão', prio: 'B', label: 'Chave seccionadora operacional' },
  // 4. BAIXA TENSÃO
  { id: 'pta_18', secao: 'Baixa Tensão', prio: 'A', label: 'Caixa de BT com tampa e fechada' },
  { id: 'pta_19', secao: 'Baixa Tensão', prio: 'A', label: 'Disjuntores gerais funcionais' },
  { id: 'pta_20', secao: 'Baixa Tensão', prio: 'B', label: 'Barramento de BT sem oxidação ou danos' },
  { id: 'pta_21', secao: 'Baixa Tensão', prio: 'B', label: 'Fusíveis de BT corretos e operacionais' },
  { id: 'pta_22', secao: 'Baixa Tensão', prio: 'C', label: 'Identificação dos circuitos de BT' },
  // 5. TERRA
  { id: 'pta_23', secao: 'Terra', prio: 'A', label: 'Eléctrodo de terra visível e em bom estado' },
  { id: 'pta_24', secao: 'Terra', prio: 'A', label: 'Condutores de terra sem corrosão ou danos' },
  { id: 'pta_25', secao: 'Terra', prio: 'A', label: 'Terra de Protecção (TP) < 20Ω (registar medição)' },
  { id: 'pta_26', secao: 'Terra', prio: 'A', label: 'Terra de Serviço (TS) < 20Ω (registar medição)' },
  // 6. CONTADOR / MEDIÇÃO
  { id: 'pta_27', secao: 'Contador', prio: 'B', label: 'Contador em funcionamento e sem danos' },
  { id: 'pta_28', secao: 'Contador', prio: 'B', label: 'Lacres do contador intactos' },
  { id: 'pta_29', secao: 'Contador', prio: 'C', label: 'Leitura do contador registada' },
  // 7. INFRA
  { id: 'pta_30', secao: 'Infraestrutura', prio: 'B', label: 'Postes em bom estado (sem inclinação > 15°)' },
  { id: 'pta_31', secao: 'Infraestrutura', prio: 'B', label: 'Travessas e isoladores dos postes operacionais' },
  { id: 'pta_32', secao: 'Infraestrutura', prio: 'C', label: 'Identificação do PT visível (número)' },
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
