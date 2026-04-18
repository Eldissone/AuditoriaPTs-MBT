import React, { useState, useRef } from 'react';
import {
  X, Camera, Upload, CheckCircle2, AlertCircle, MapPin,
  ArrowRight, ArrowLeft, Zap, ClipboardList, Trash2,
  AlertTriangle, FileText, Clock, Users, Phone,
  Wrench, Activity, Shield, Building2, Info,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Checklist PTA — 32 itens ────────────────────────────────────────────────
// Prioridade: A = Urgente (Segurança), B = Alta, C = Normal, OK = Conforme, NA = Não Aplicável
const CHECKLIST_PTA = [
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
const CHECKLIST_PTC = [
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

const PHOTO_SLOTS = [
  { id: 'vista_geral', label: 'Vista Geral do PT', required: true, icon: '🏗️' },
  { id: 'placa_id', label: 'Placa de Identificação', required: true, icon: '🪧' },
  { id: 'estado_equip', label: 'Estado Geral do Equipamento', required: true, icon: '⚡' },
  { id: 'contador', label: 'Contador / Medição', required: false, icon: '🔢' },
  { id: 'extra', label: 'Foto Adicional (opcional)', required: false, icon: '📷' },
];

const RESULTADOS = ['Conforme', 'Não Conforme', 'Em Avaliação', 'Urgente'];
const URGENCIAS = ['Baixo', 'Médio', 'Alto', 'Crítico'];
const RESULTADO_COLOR = {
  'Conforme': 'bg-emerald-500', 'Não Conforme': 'bg-amber-500',
  'Em Avaliação': 'bg-blue-500', 'Urgente': 'bg-red-500',
};
const PRIO_COLOR = { A: 'bg-red-100 text-red-700', B: 'bg-amber-100 text-amber-700', C: 'bg-gray-100 text-gray-600' };

// ─── Utilitário: comprime imagem ─────────────────────────────────────────────
function compressImage(file, maxW = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── PhotoCard ───────────────────────────────────────────────────────────────
function PhotoCard({ slot, photo, onChange }) {
  const inputRef = useRef();
  const handleCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const compressed = await compressImage(file);
    onChange(slot.id, { label: slot.label, data: compressed, tipo: file.type, secao: 'campo' });
    e.target.value = '';
  };
  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition-all ${photo ? 'border-emerald-300 shadow-lg shadow-emerald-50' : slot.required ? 'border-dashed border-[#0d3fd1]/30 bg-[#f8faff] hover:border-[#0d3fd1]/60' : 'border-dashed border-[#c4c5d7]/40 bg-[#fcfdff]'}`}>
      {photo ? (
        <div className="relative">
          <img src={photo.data} alt={slot.label} className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-white font-black uppercase">{slot.label}</p>
              <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span className="text-[8px] text-emerald-300 font-bold uppercase">OK</span></div>
            </div>
            <button onClick={() => onChange(slot.id, null)} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-5 cursor-pointer min-h-[144px]">
          <div className="text-3xl">{slot.icon}</div>
          <p className={`text-[10px] font-black uppercase text-center ${slot.required ? 'text-[#0f1c2c]' : 'text-[#747686]'}`}>{slot.label}</p>
          {slot.required && <span className="text-[8px] font-black text-red-500 uppercase">Obrigatório</span>}
          <div className="flex gap-2 mt-1">
            <div className="flex items-center gap-1 bg-[#0d3fd1] text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase"><Camera className="w-3 h-3" /> Câmara</div>
            <div className="flex items-center gap-1 bg-white border border-[#0d3fd1]/20 text-[#0d3fd1] px-3 py-1.5 rounded-xl text-[9px] font-black uppercase"><Upload className="w-3 h-3" /> Doc</div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />
        </label>
      )}
    </div>
  );
}

// ─── ChecklistItem ───────────────────────────────────────────────────────────
function ChecklistItem({ item, value, onChange }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${value === 'ok' ? 'border-emerald-300 bg-emerald-50/30' : value === 'na' ? 'border-gray-200 bg-gray-50' : value === 'nc' ? 'border-red-200 bg-red-50/30' : 'border-[#c4c5d7]/20 bg-white hover:border-[#0d3fd1]/20'}`}
      onClick={() => onChange(item.id, value === 'ok' ? null : 'ok')}>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${PRIO_COLOR[item.prio]}`}>{item.prio}</span>
      <span className={`text-[11px] font-bold flex-1 leading-snug ${value === 'ok' ? 'text-emerald-700 line-through opacity-70' : value === 'na' ? 'text-gray-400 line-through' : 'text-[#444655]'}`}>{item.label}</span>
      <div className="flex gap-1 shrink-0">
        <button onClick={e => { e.stopPropagation(); onChange(item.id, 'ok'); }} className={`text-[8px] font-black px-2 py-1 rounded-lg border transition-all ${value === 'ok' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-[#c4c5d7]/30 text-[#747686] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}>OK</button>
        <button onClick={e => { e.stopPropagation(); onChange(item.id, 'nc'); }} className={`text-[8px] font-black px-2 py-1 rounded-lg border transition-all ${value === 'nc' ? 'bg-red-500 text-white border-red-500' : 'bg-white border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}>NC</button>
        <button onClick={e => { e.stopPropagation(); onChange(item.id, 'na'); }} className={`text-[8px] font-black px-2 py-1 rounded-lg border transition-all ${value === 'na' ? 'bg-gray-400 text-white border-gray-400' : 'bg-white border-[#c4c5d7]/30 text-[#747686] hover:bg-gray-50 hover:border-gray-300'}`}>N/A</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// Steps: 1=Briefing, 2=Fotos, 3=Checklist, 4=Medições, 5=Dados Cliente, 6=Resultado, 7=Submeter
export default function QuickAuditModal({ tarefa, onClose, onDone }) {
  const { user } = useAuth();

  // Guardar ID Original do Auditor: apenas o utilizador designado (ou Admin, dependendo das regras) deve Iniciar
  const isAssignedAuditor = user?.id === tarefa?.id_auditor;

  const [step, setStep] = useState(1);
  const [iniciando, setIniciando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const pt = tarefa.pt;
  const sub = pt?.subestacao;

  // Detectar tipo PT (PTA vs PTC)
  const isPTC = tarefa?.id_pt?.toUpperCase().includes('PTC') || tarefa?.pt?.tipo_instalacao === 'PTC';
  const checklistBase = isPTC ? CHECKLIST_PTC : CHECKLIST_PTA;

  // Fotos
  const [fotos, setFotos] = useState(Object.fromEntries(PHOTO_SLOTS.map(s => [s.id, null])));

  // Checklist: { item_id: 'ok'|'nc'|'na'|null }
  const [checklistMap, setChecklistMap] = useState(Object.fromEntries(checklistBase.map(i => [i.id, null])));

  // Medições de terra e tensão
  const [medicoes, setMedicoes] = useState({ terra_protecao: '', terra_servico: '', UA: '', UB: '', UC: '', UAB: '', UBC: '', UCA: '' });

  // Dados do cliente verificados em campo
  const [dadosCliente, setDadosCliente] = useState({
    razao_social: pt?.proprietario || '',
    resp_financeiro: pt?.responsavel_financeiro || '',
    contacto_fin: pt?.contacto_resp_financeiro || '',
    resp_tecnico: pt?.responsavel_tecnico_cliente || '',
    contacto_tec: pt?.contacto_resp_tecnico || '',
    canal_faturacao: pt?.canal_faturacao || '',
    ultima_fatura: '',
    fornece_terceiros: pt?.fornece_terceiros || false,
    empresa_manutencao: pt?.empresa_manutencao || '',
    data_ultima_manutencao: '',
  });

  // Resultado
  const [formData, setFormData] = useState({ resultado: 'Em Avaliação', nivel_urgencia: 'Baixo', observacoes: '', proxima_inspecao: '' });

  // Dados checklist da tarefa original (para manter compatibilidade)
  const [tarefaChecklist, setTarefaChecklist] = useState(tarefa.checklist || []);

  const handleFotoChange = (id, val) => setFotos(p => ({ ...p, [id]: val }));
  const handleCheckItem = (id, val) => setChecklistMap(p => ({ ...p, [id]: val }));
  const fotosObrigOk = PHOTO_SLOTS.filter(s => s.required).every(s => fotos[s.id] !== null);

  // Secções do checklist agrupadas
  const secoes = [...new Set(checklistBase.map(i => i.secao))];

  // Contagem checklist
  const totalOK = Object.values(checklistMap).filter(v => v === 'ok').length;
  const totalNC = Object.values(checklistMap).filter(v => v === 'nc').length;
  const totalPendente = Object.values(checklistMap).filter(v => v === null).length;

  const STEPS = [
    { n: 1, label: 'PT Info', icon: Info },
    { n: 2, label: 'Fotos', icon: Camera },
    { n: 3, label: isPTC ? 'Cheklist PTC' : 'Checklist PTA', icon: ClipboardList },
    { n: 4, label: 'Medições', icon: Activity },
    { n: 5, label: 'Cliente', icon: Users },
    { n: 6, label: 'Resultado', icon: Shield },
    { n: 7, label: 'Submeter', icon: CheckCircle2 },
  ];

  const handleIniciar = async () => {
    try {
      setIniciando(true); setError(null);
      await api.put(`/tarefas/${tarefa.id}/iniciar`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao iniciar a tarefa.');
    } finally { setIniciando(false); }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true); setError(null);

      // Array de fotos (sem nulls)
      const fotosArray = PHOTO_SLOTS.filter(s => fotos[s.id]).map(s => fotos[s.id]);

      // Converter checklistMap → array de items para guardar
      const checklistFinal = checklistBase.map(item => ({
        id: item.id, label: item.label, secao: item.secao, prio: item.prio,
        resultado: checklistMap[item.id] || null,
        checked: checklistMap[item.id] === 'ok',
      }));

      // Detecções de NC de prioridade A (potenciais incongruências)
      const ncPrioA = checklistFinal.filter(i => i.resultado === 'nc' && i.prio === 'A');

      // Medições numéricas
      const terra_protecao = medicoes.terra_protecao !== '' ? Number(medicoes.terra_protecao) : null;
      const terra_servico = medicoes.terra_servico !== '' ? Number(medicoes.terra_servico) : null;
      const medicao_tensao = ['UA', 'UB', 'UC', 'UAB', 'UBC', 'UCA'].some(k => medicoes[k] !== '')
        ? Object.fromEntries(['UA', 'UB', 'UC', 'UAB', 'UBC', 'UCA'].map(k => [k, medicoes[k] !== '' ? Number(medicoes[k]) : null]))
        : null;

      // Tipo da inspecção baseado no tipo de tarefa
      const tipoInspecao = tarefa.tipo_tarefa === 'Manutenção Preventiva' ? 'Manutenção Preventiva'
        : tarefa.tipo_tarefa === 'Manutenção Corretiva' ? 'Manutenção Corretiva'
          : tarefa.tipo_tarefa === 'Inspeção' ? 'Inspeção'
            : isPTC ? 'Auditoria PTC' : 'Auditoria PTA';

      const inspecaoPayload = {
        id_pt: tarefa.id_pt,
        id_tarefa: tarefa.id,
        tipo: tipoInspecao,
        resultado: formData.resultado,
        nivel_urgencia: ['Não Conforme', 'Urgente'].includes(formData.resultado) ? formData.nivel_urgencia : null,
        observacoes: formData.observacoes || null,
        proxima_inspecao: formData.proxima_inspecao || null,
        fotos: fotosArray,
        terra_protecao,
        terra_servico,
        medicao_tensao,
        dados_cliente_campo: dadosCliente,
      };

      await api.post('/inspecoes', inspecaoPayload);

      // Concluir tarefa com checklist completa (passa a aguardando validação)
      await api.put(`/tarefas/${tarefa.id}/concluir`, { checklist: checklistFinal, novoStatus: 'Aguardando Validação' });

      // Registar incongruências de prioridade A não conformes
      if (ncPrioA.length > 0 || (terra_protecao !== null && terra_protecao >= 20) || (terra_servico !== null && terra_servico >= 20)) {
        // Incongruências de terra
        const incongruencias = [];
        if (terra_protecao !== null && terra_protecao >= 20) {
          incongruencias.push({ campo: 'terra_protecao', label: 'Terra de Protecção acima de 20Ω', valor: `${terra_protecao}Ω`, limite: '<20Ω' });
        }
        if (terra_servico !== null && terra_servico >= 20) {
          incongruencias.push({ campo: 'terra_servico', label: 'Terra de Serviço acima de 20Ω', valor: `${terra_servico}Ω`, limite: '<20Ω' });
        }
        // Itens NC de prioridade A são registados no checklist — o motor de incongruências processará no backend
      }

      setSuccess(true);
      setTimeout(() => { onDone?.(); onClose(); }, 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao submeter a auditoria.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-[#0f1c2c]/70 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-[1rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d3fd1] to-[#1a52e8] p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-white/70" />
              <span className="text-[9px] text-white/70 font-black uppercase tracking-[0.2em]">
                {isPTC ? 'Auditoria PTC — 37 itens' : 'Auditoria PTA — 32 itens'}
              </span>
            </div>
            <h3 className="text-white text-base font-black uppercase tracking-tight leading-tight">{tarefa.titulo}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {tarefa.id_pt && <p className="text-white/60 text-[10px] font-bold uppercase">PT: {tarefa.id_pt}</p>}
              {tarefa.tipo_tarefa && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/15 text-white">
                  {tarefa.tipo_tarefa}
                </span>
              )}
              {tarefa.prioridade && (
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${tarefa.prioridade === 'Urgente' ? 'bg-red-400/80 text-white' : tarefa.prioridade === 'Alta' ? 'bg-orange-400/80 text-white' : 'bg-white/15 text-white'}`}>
                  {tarefa.prioridade}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-2.5 bg-[#f0f4ff] border-b border-[#0d3fd1]/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${step === s.n ? 'bg-[#0d3fd1] text-white shadow-md' : step > s.n ? 'bg-emerald-500 text-white' : 'bg-white text-[#747686] border border-[#c4c5d7]/30'}`}>
                {step > s.n ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.n}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-4 h-0.5 rounded-full shrink-0 ${step > s.n ? 'bg-emerald-400' : 'bg-[#e0e4f0]'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>

          {/* ── PASSO 1: Briefing ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#0d3fd1]/5 border border-[#0d3fd1]/15 rounded-2xl p-4">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5" /> Informação do PT
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'ID PT', val: tarefa.id_pt },
                    { label: 'Tipo', val: pt?.tipo_instalacao },
                    { label: 'Subestação', val: sub?.nome },
                    { label: 'Proprietário', val: pt?.proprietario },
                    { label: 'Município', val: pt?.municipio || sub?.municipio },
                    { label: 'Potência', val: pt?.potencia_kva ? `${pt.potencia_kva} kVA` : null },
                  ].map(({ label, val }) => val && (
                    <div key={label} className="bg-white rounded-xl p-2.5 border border-[#0d3fd1]/10">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#747686] mb-0.5">{label}</p>
                      <p className="text-[11px] font-black text-[#0f1c2c] uppercase">{val}</p>
                    </div>
                  ))}
                </div>
                {pt?.gps && (
                  <a href={`https://www.google.com/maps?q=${encodeURIComponent(pt.gps)}`} target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-colors w-full justify-center">
                    <MapPin className="w-3.5 h-3.5" /> Abrir no Mapa — GPS: {pt.gps}
                  </a>
                )}
              </div>
              <div className="bg-[#eff4ff] border border-[#0d3fd1]/10 rounded-2xl p-4">
                <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-2">
                  📋 Esta auditoria vai usar a checklist {isPTC ? 'PTC (37 itens)' : 'PTA (32 itens)'}
                </p>
                <p className="text-[10px] font-bold text-[#444655]">
                  Irá percorrer: {PHOTO_SLOTS.filter(s => s.required).length} fotos obrigatórias · {checklistBase.length} itens de verificação · Medições de terra · Dados do cliente · Resultado.
                </p>
              </div>
              {tarefa.descricao && (
                <div className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Instruções
                  </p>
                  <p className="text-sm font-medium text-[#444655] leading-relaxed">{tarefa.descricao}</p>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                  Ao iniciar, o cronómetro começa a contar e a tarefa fica "Em Andamento".
                </p>
              </div>
            </div>
          )}

          {/* ── PASSO 2: Fotos ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">Capturas de Campo</p>
                <span className="text-[9px] font-black text-[#0d3fd1] bg-[#eff4ff] px-3 py-1 rounded-full">
                  {Object.values(fotos).filter(Boolean).length}/{PHOTO_SLOTS.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PHOTO_SLOTS.map(slot => (
                  <PhotoCard key={slot.id} slot={slot} photo={fotos[slot.id]} onChange={handleFotoChange} />
                ))}
              </div>
              {!fotosObrigOk && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-[9px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Capture todas as fotos obrigatórias para avançar
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 3: Checklist ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">
                  Checklist {isPTC ? 'PTC' : 'PTA'} — {checklistBase.length} itens
                </p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">✓ {totalOK}</span>
                  <span className="text-[9px] font-black text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">✗ {totalNC}</span>
                  <span className="text-[9px] font-black text-[#747686] bg-[#f8faff] px-2.5 py-1 rounded-full border border-[#c4c5d7]/20">◌ {totalPendente}</span>
                </div>
              </div>
              <div className="bg-[#f0f4ff] border border-[#0d3fd1]/15 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-3 text-[9px] font-black uppercase">
                  <span className="text-red-600">■ A = Urgente</span>
                  <span className="text-amber-600">■ B = Alta</span>
                  <span className="text-gray-500">■ C = Normal</span>
                </div>
              </div>
              {secoes.map(secao => {
                const items = checklistBase.filter(i => i.secao === secao);
                const okCount = items.filter(i => checklistMap[i.id] === 'ok').length;
                return (
                  <div key={secao}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">{secao}</p>
                      <span className="text-[8px] font-black text-[#747686]">{okCount}/{items.length}</span>
                      <div className="flex-1 h-1 bg-[#f1f3f9] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(okCount / items.length) * 100}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {items.map(item => (
                        <ChecklistItem key={item.id} item={item} value={checklistMap[item.id]} onChange={handleCheckItem} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {totalNC > 0 && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-[9px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {totalNC} item(s) Não Conforme(s) detectados. Serão registados como potenciais incongruências.
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 4: Medições ────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">Medições de Terra e Tensão</p>

              {/* Terra */}
              <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-5">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Resistência de Terra — Limite normativo &lt; 20Ω
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[{ key: 'terra_protecao', label: 'Terra de Protecção (TP)', info: 'Medido no eléctrodo de terra da carcaça' }, { key: 'terra_servico', label: 'Terra de Serviço (TS)', info: 'Medido no neutro de BT' }].map(f => {
                    const val = Number(medicoes[f.key]);
                    const hasVal = medicoes[f.key] !== '';
                    return (
                      <div key={f.key} className={`rounded-xl p-4 border-2 ${hasVal && val >= 20 ? 'border-red-300 bg-red-50' : hasVal && val < 20 ? 'border-emerald-300 bg-emerald-50' : 'border-[#c4c5d7]/20 bg-[#f8faff]'}`}>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">{f.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" step="0.1" min="0"
                            value={medicoes[f.key]}
                            onChange={e => setMedicoes(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder="Ex: 4.5"
                            className="flex-1 bg-white border border-[#c4c5d7]/30 rounded-xl px-3 py-2 text-sm font-black text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20"
                          />
                          <span className="text-[11px] font-black text-[#747686]">Ω</span>
                        </div>
                        {hasVal && <p className={`text-[9px] font-black uppercase mt-1.5 ${val >= 20 ? 'text-red-600' : 'text-emerald-600'}`}>{val >= 20 ? '⚠️ Acima do limite!' : '✅ Dentro do limite'}</p>}
                        <p className="text-[8px] text-[#747686] mt-1">{f.info}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tensão por fase */}
              <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-5">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Medição de Tensão (V) — opcional
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {['UA', 'UB', 'UC', 'UAB', 'UBC', 'UCA'].map(fase => (
                    <div key={fase}>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-1">{fase}</label>
                      <input
                        type="number" step="1" min="0"
                        value={medicoes[fase]}
                        onChange={e => setMedicoes(p => ({ ...p, [fase]: e.target.value }))}
                        placeholder="V"
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-3 py-2 text-sm font-black text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 5: Dados do Cliente ─────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">Verificação de Dados do Cliente</p>
              </div>
              <div className="bg-[#f8f0ff] border border-purple-100 rounded-xl px-4 py-3">
                <p className="text-[9px] font-bold text-purple-700">Confirme os dados do cliente no local. Estes dados actualizam a ficha do cliente.</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'razao_social', label: 'Razão Social / Nome', icon: Building2 },
                  { key: 'resp_financeiro', label: 'Responsável Financeiro', icon: Users },
                  { key: 'contacto_fin', label: 'Contacto do Resp. Financeiro', icon: Phone },
                  { key: 'resp_tecnico', label: 'Responsável Técnico', icon: Wrench },
                  { key: 'contacto_tec', label: 'Contacto do Resp. Técnico', icon: Phone },
                  { key: 'ultima_fatura', label: 'Referência da Última Fatura', icon: FileText },
                  { key: 'empresa_manutencao', label: 'Empresa de Manutenção', icon: Wrench },
                ].map(f => (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#747686] mb-1">
                      <f.icon className="w-3 h-3" /> {f.label}
                    </label>
                    <input
                      type="text"
                      value={dadosCliente[f.key]}
                      onChange={e => setDadosCliente(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20"
                    />
                  </div>
                ))}

                {/* Canal de Faturação */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-1">Canal de Receção de Fatura</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Email', 'SMS', 'Papel', 'Portal'].map(c => (
                      <button key={c} onClick={() => setDadosCliente(p => ({ ...p, canal_faturacao: c }))}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${dadosCliente.canal_faturacao === c ? 'bg-[#0d3fd1] text-white border-[#0d3fd1]' : 'bg-white border-[#c4c5d7]/30 text-[#747686]'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fornece terceiros */}
                <div className="flex items-center justify-between bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Fornece energia a terceiros?</p>
                    <p className="text-[10px] text-[#747686]">Além deste cliente, o PT serve outros consumidores?</p>
                  </div>
                  <button onClick={() => setDadosCliente(p => ({ ...p, fornece_terceiros: !p.fornece_terceiros }))}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${dadosCliente.fornece_terceiros ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-[#c4c5d7]/30 text-[#747686]'}`}>
                    {dadosCliente.fornece_terceiros ? 'Sim ⚠️' : 'Não ✅'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 6: Resultado ───────────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">Resultado da Auditoria *</label>
                <div className="grid grid-cols-2 gap-2">
                  {RESULTADOS.map(r => (
                    <button key={r} onClick={() => setFormData(p => ({ ...p, resultado: r }))}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${formData.resultado === r ? `${RESULTADO_COLOR[r]} text-white border-transparent shadow-lg` : 'bg-white border-[#c4c5d7]/30 text-[#444655]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {['Não Conforme', 'Urgente'].includes(formData.resultado) && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">Nível de Urgência</label>
                  <div className="grid grid-cols-4 gap-2">
                    {URGENCIAS.map(u => (
                      <button key={u} onClick={() => setFormData(p => ({ ...p, nivel_urgencia: u }))}
                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${formData.nivel_urgencia === u ? u === 'Crítico' ? 'bg-red-500 text-white border-transparent' : u === 'Alto' ? 'bg-orange-500 text-white border-transparent' : u === 'Médio' ? 'bg-amber-400 text-white border-transparent' : 'bg-blue-400 text-white border-transparent' : 'bg-white border-[#c4c5d7]/30 text-[#444655]'}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">Observações / Notas de Campo</label>
                <textarea value={formData.observacoes} onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                  rows={4} placeholder="Anote anomalias, leituras, condições observadas no local..."
                  className="w-full border border-[#c4c5d7]/30 rounded-xl p-3 text-sm font-medium text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20 resize-none bg-[#fcfdff]" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">Data da Próxima Inspeção (opcional)</label>
                <input type="date" value={formData.proxima_inspecao} onChange={e => setFormData(p => ({ ...p, proxima_inspecao: e.target.value }))}
                  className="w-full border border-[#c4c5d7]/30 rounded-xl p-3 text-sm font-medium text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20 bg-[#fcfdff]" />
              </div>
            </div>
          )}

          {/* ── PASSO 7: Resumo ─────────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {PHOTO_SLOTS.map(s => (
                  <div key={s.id}>
                    {fotos[s.id] ? <img src={fotos[s.id].data} alt={s.label} className="w-full h-16 object-cover rounded-xl border-2 border-emerald-300" />
                      : <div className="w-full h-16 bg-[#f0f2f5] rounded-xl border-2 border-dashed border-[#c4c5d7]/40 flex items-center justify-center text-lg">{s.icon}</div>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-[#747686] mb-1">Checklist</p>
                  <p className="text-[11px] font-black text-[#0f1c2c] uppercase">{totalOK}/{checklistBase.length} OK · {totalNC} NC</p>
                </div>
                <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-[#747686] mb-1">Resultado</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase ${RESULTADO_COLOR[formData.resultado]}`}>{formData.resultado}</span>
                </div>
                <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-[#747686] mb-1">Terra TP</p>
                  <p className={`text-[11px] font-black uppercase ${medicoes.terra_protecao !== '' && Number(medicoes.terra_protecao) >= 20 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {medicoes.terra_protecao !== '' ? `${medicoes.terra_protecao} Ω` : 'Não medido'}
                  </p>
                </div>
                <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-[#747686] mb-1">Terra TS</p>
                  <p className={`text-[11px] font-black uppercase ${medicoes.terra_servico !== '' && Number(medicoes.terra_servico) >= 20 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {medicoes.terra_servico !== '' ? `${medicoes.terra_servico} Ω` : 'Não medido'}
                  </p>
                </div>
                {formData.observacoes && (
                  <div className="col-span-2 bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                    <p className="text-[8px] font-black uppercase text-[#747686] mb-1">Observações</p>
                    <p className="text-[11px] font-medium text-[#444655]">{formData.observacoes}</p>
                  </div>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                  A tarefa será marcada como <strong>Concluída</strong>. A inspeção, checklist, medições e dados do cliente serão guardados. {totalNC > 0 && `⚠️ ${totalNC} NC(s) serão registados para seguimento.`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Auditoria submetida com sucesso! Tarefa concluída. ✅
            </div>
          )}
        </div>

        {/* Footer / Navegação */}
        <div className="p-4 border-t border-[#c4c5d7]/10 bg-[#fcfdff] flex items-center justify-between gap-3 shrink-0">
          {step > 1 && !success && (
            <button onClick={() => setStep(s => s - 1)} disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#747686] hover:bg-[#eff4ff] transition-all disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          )}
          {step === 1 && (
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#747686] hover:bg-[#eff4ff] transition-all">Cancelar</button>
          )}

          <div className="ml-auto">
            {step === 1 && (
              <button
                disabled={iniciando || !isAssignedAuditor}
                onClick={handleIniciar}
                title={!isAssignedAuditor ? "Apenas o auditor designado pode iniciar" : ""}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {iniciando ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A iniciar...</> : <><Zap className="w-4 h-4" fill="currentColor" /> Iniciar Auditoria <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            )}
            {step === 2 && (
              <button disabled={!fotosObrigOk} onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${fotosObrigOk ? 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20' : 'bg-[#c4c5d7] text-white cursor-not-allowed'}`}>
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 3 && (
              <button onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all">
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 4 && (
              <button onClick={() => setStep(5)}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all">
                Dados do Cliente <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 5 && (
              <button onClick={() => setStep(6)}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all">
                Resultado <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 6 && (
              <button onClick={() => setStep(7)}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all">
                Rever e Submeter <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 7 && !success && (
              <button disabled={loading} onClick={handleSubmit}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${loading ? 'bg-[#c4c5d7] text-white cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'}`}>
                {loading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A submeter...</> : <><CheckCircle2 className="w-4 h-4" /> Concluir Auditoria</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
