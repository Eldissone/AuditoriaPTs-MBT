import React, { useState, useRef, useEffect } from 'react';
import {
  X, Camera, Upload, CheckCircle2, AlertCircle, MapPin,
  ArrowRight, ArrowLeft, Zap, ClipboardList, Trash2,
  AlertTriangle, FileText, Clock, Users, Phone,
  Wrench, Plus, Activity, Shield, Building2, Info, Calendar,
  Edit2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CHECKLIST_PTA, CHECKLIST_PTC } from '../data/checklists';

const RESULTADOS = ['Legal', 'Não Legal', 'Legal com Inconformidades', 'Em Avaliação'];
const URGENCIAS = ['Baixo', 'Médio', 'Alto', 'Crítico'];
const RESULTADO_COLOR = {
  'Legal': 'bg-emerald-500',
  'Não Legal': 'bg-red-500',
  'Legal com Inconformidades': 'bg-amber-500',
  'Em Avaliação': 'bg-blue-500',
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

// ─── ConfrontoField (Novo) ───────────────────────────────────────────────────
function ConfrontoField({ label, valorOriginal, valorEditado, conforme, onConforme, onEdit, isNumber = false, helpText }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${conforme === true ? 'border-emerald-200 bg-emerald-50/40 shadow-sm' : conforme === false ? 'border-amber-300 bg-amber-50/40 shadow-md' : 'border-[#c4c5d7]/20 bg-white hover:border-[#0d3fd1]/20'}`}>
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest leading-tight">{label}</label>
          {helpText && <span className="text-[8px] font-bold text-amber-600/70 italic uppercase leading-tight mt-1">{helpText}</span>}
        </div>
        <div className="flex bg-[#f1f3f9] rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => { onConforme(true); onEdit(''); }}
            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${conforme === true ? 'bg-white text-emerald-600 shadow-sm' : 'text-[#747686]'}`}
          >
            ✓ OK
          </button>
          <button
            onClick={() => onConforme(false)}
            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${conforme === false ? 'bg-white text-amber-600 shadow-sm' : 'text-[#747686]'}`}
          >
            ✗ Corrigir
          </button>
        </div>
      </div>

      {conforme === false ? (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 text-[#747686] opacity-60">
            <span className="text-[9px] font-bold uppercase">Original:</span>
            <span className="text-xs font-bold uppercase line-through">{valorOriginal || 'Vazio'}</span>
          </div>
          <input
            type={isNumber ? "number" : "text"}
            className="w-full bg-white border-2 border-amber-300 rounded-xl px-4 py-2.5 text-sm font-black text-[#0f1c2c] focus:outline-none focus:ring-4 focus:ring-amber-500/10 placeholder:text-amber-900/30"
            value={valorEditado || ''}
            onChange={(e) => onEdit(e.target.value)}
            placeholder={`Inserir novo ${label}...`}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[#0f1c2c]">
          {conforme === true && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          <span className={`text-sm font-black uppercase ${conforme === true ? 'text-emerald-700' : 'text-[#0f1c2c]'}`}>
            {valorOriginal || 'N/A'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── SecaoFoto (Novo) ────────────────────────────────────────────────────────
function SecaoFoto({ secao, foto, onCapture, onRemove }) {
  const inputRef = useRef();
  const handleCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const compressed = await compressImage(file);
    onCapture(secao, { label: `Foto - ${secao}`, data: compressed, tipo: file.type, secao: secao });
    e.target.value = '';
  };

  if (foto) {
    return (
      <div className="mt-3 relative rounded-xl overflow-hidden border-2 border-emerald-300 h-24">
        <img src={foto.data} alt={foto.label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between">
          <span className="text-[9px] text-white font-black uppercase">{foto.label}</span>
          <button onClick={() => onRemove(secao)} className="p-1 bg-red-500/80 hover:bg-red-500 rounded-lg"><Trash2 className="w-3 h-3 text-white" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#0d3fd1]/30 bg-[#f8faff] hover:border-[#0d3fd1]/60 rounded-xl cursor-pointer transition-all">
        <Camera className="w-4 h-4 text-[#0d3fd1]" />
        <span className="text-[10px] font-black uppercase text-[#0d3fd1]">Adicionar Foto Opcional</span>
        <input type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />
      </label>
    </div>
  )
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
  const isAssignedAuditor = user?.id === tarefa?.id_auditor || user?.role === 'admin';

  const STORAGE_KEY = `@AUDMBT:audit_progress:${tarefa.id}`;

  // ── Helper: Carregar dados iniciais (Lazy Initializer) ──────────────────
  const getInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.timestamp && Date.now() - data.timestamp < 12 * 60 * 60 * 1000) { // Cache de 12h
          return data;
        }
      } catch (err) { console.error('Erro ao ler cache:', err); }
    }
    return null;
  };

  const initialProgress = getInitialData();

  const [step, setStep] = useState(initialProgress?.step || 1);
  const [iniciando, setIniciando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const pt = tarefa.pt || {};
  const sub = pt?.subestacao || {};

  // Tipo PT
  const tipoInstalacao = (pt?.tipo_instalacao || '').toUpperCase();
  const tituloTarefa = (tarefa?.titulo || '').toUpperCase();
  const defaultIsPTC = tipoInstalacao.includes('PTC') ||
    tipoInstalacao.includes('CABINE') ||
    tipoInstalacao.includes('EDIFICIO') ||
    (tarefa?.id_pt || '').toUpperCase().includes('PTC') ||
    tituloTarefa.includes('PTC') ||
    tituloTarefa.includes('CABINE') ||
    (tarefa?.checklist?.length === 37);

  const [tipoPT, setTipoPT] = useState(initialProgress?.tipoPT || (defaultIsPTC ? 'PTC' : 'PTA'));
  const checklistBase = tipoPT === 'PTC' ? CHECKLIST_PTC : CHECKLIST_PTA;

  // Novos Estados (Confronto)
  const [ptInfoEdits, setPtInfoEdits] = useState(initialProgress?.ptInfoEdits || {});
  const [ptInfoConforme, setPtInfoConforme] = useState(initialProgress?.ptInfoConforme || {});

  const [clienteEdits, setClienteEdits] = useState(initialProgress?.clienteEdits || {});
  const [clienteConforme, setClienteConforme] = useState(initialProgress?.clienteConforme || {});

  const [checklistFotos, setChecklistFotos] = useState(initialProgress?.checklistFotos || {});

  // Estados Base
  const [checklistMap, setChecklistMap] = useState(initialProgress?.checklistMap || Object.fromEntries(checklistBase.map(i => [i.id, null])));

  // Se mudar o tipo de PT, reseta o checklistMap
  useEffect(() => {
    setChecklistMap(prev => {
      if (Object.keys(prev).length !== checklistBase.length) {
        return Object.fromEntries(checklistBase.map(i => [i.id, null]));
      }
      return prev;
    });
  }, [tipoPT, checklistBase]);

  const [medicoes, setMedicoes] = useState(initialProgress?.medicoes || { terra_protecao: '', terra_servico: '', UA: '', UB: '', UC: '', UAB: '', UBC: '', UCA: '' });
  const [formData, setFormData] = useState(initialProgress?.formData || { resultado: 'Em Avaliação', nivel_urgencia: 'Baixo', observacoes: '', proxima_inspecao: '' });
  const [contador, setContador] = useState(initialProgress?.contador || {
    tem_contagem: true,
    marca: '',
    modelo: '',
    ponta_tomada: [{ tipo: 'Principal', obs: '' }],
    tipo_energia: 'Ativa',
    leitura: '',
    como_contagem: ''
  });
  const [resumed, setResumed] = useState(!!initialProgress);

  // 1. Mostrar feedback de retomada por alguns segundos
  useEffect(() => {
    if (resumed) {
      const t = setTimeout(() => setResumed(false), 3000);
      return () => clearTimeout(t);
    }
  }, [resumed]);

  // 2. Salvar progresso a cada alteração
  useEffect(() => {
    const stateToSave = {
      step,
      tipoPT,
      ptInfoEdits, ptInfoConforme,
      clienteEdits, clienteConforme,
      checklistFotos,
      checklistMap,
      medicoes,
      formData,
      contador,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [STORAGE_KEY, step, tipoPT, ptInfoEdits, ptInfoConforme, clienteEdits, clienteConforme, checklistFotos, checklistMap, medicoes, formData, contador]);

  const [tarefaChecklist, setTarefaChecklist] = useState(tarefa.checklist || []);

  const handleFotoChecklist = (secao, foto) => setChecklistFotos(p => ({ ...p, [secao]: foto }));
  const handleRemoveFotoChecklist = (secao) => setChecklistFotos(p => { const nv = { ...p }; delete nv[secao]; return nv; });
  const handleCheckItem = (id, val) => setChecklistMap(p => ({ ...p, [id]: val }));

  // Secções do checklist agrupadas
  const secoes = [...new Set(checklistBase.map(i => i.secao))];

  // Contagem checklist
  const totalOK = checklistBase.filter(i => checklistMap[i.id] === 'ok').length;
  const totalNC = checklistBase.filter(i => checklistMap[i.id] === 'nc').length;
  const totalPendente = checklistBase.filter(i => checklistMap[i.id] !== 'ok' && checklistMap[i.id] !== 'nc' && checklistMap[i.id] !== 'na').length;

  // Validação de Integridade (Fotos deixam de ser obrigatórias)
  const infoCompleta = totalPendente === 0 &&
    medicoes.terra_protecao !== '' &&
    medicoes.terra_servico !== '' &&
    (!contador.tem_contagem ? contador.como_contagem !== '' : true);

  const STEPS = [
    { n: 1, label: 'PT Info', icon: Info },
    { n: 2, label: 'Cliente', icon: Users },
    { n: 3, label: 'Contador', icon: Zap },
    { n: 4, label: 'Checklist', icon: ClipboardList },
    { n: 5, label: 'Medições', icon: Activity },
    { n: 6, label: 'Resumo', icon: CheckCircle2 },
  ];

  const handleIniciar = async () => {
    if (tarefa.status === 'Em Andamento') {
      setStep(2);
      return;
    }

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

      // Array de fotos (das secções)
      const fotosArray = Object.values(checklistFotos);

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
            : tipoPT === 'PTC' ? 'Auditoria PTC' : 'Auditoria PTA';

      const inspecaoPayload = {
        id_pt: tarefa.id_pt,
        id_tarefa: tarefa.id,
        tipo: tipoInspecao,
        resultado: formData.resultado,
        nivel_urgencia: ['Não Legal', 'Legal com Inconformidades', 'Urgente'].includes(formData.resultado) ? formData.nivel_urgencia : null,
        observacoes: formData.observacoes || null,
        proxima_inspecao: formData.proxima_inspecao || null,
        fotos: fotosArray,
        terra_protecao,
        terra_servico,
        medicao_tensao,
        // Adiciona as edições feitas no campo
        pt_info_edits: ptInfoEdits,
        cliente_edits: clienteEdits,
        tipo_pt: tipoPT,
        contador: contador,
      };

      await api.post('/inspecoes', inspecaoPayload);

      // Concluir tarefa com checklist completa (passa a aguardando validação)
      await api.put(`/tarefas/${tarefa.id}/concluir`, { checklist: checklistFinal, novoStatus: 'Aguardando Validação' });

      // Registar incongruências de prioridade A não conformes
      if (formData.resultado === 'Não Legal' || (terra_protecao !== null && terra_protecao >= 20) || (terra_servico !== null && terra_servico >= 20)) {
        // Incongruências de terra (O backend pode gerir)
        const incongruencias = [];
        if (terra_protecao !== null && terra_protecao >= 20) {
          incongruencias.push({ campo: 'terra_protecao', label: 'Terra de Protecção acima de 20Ω', valor: `${terra_protecao}Ω`, limite: '<20Ω' });
        }
        if (terra_servico !== null && terra_servico >= 20) {
          incongruencias.push({ campo: 'terra_servico', label: 'Terra de Serviço acima de 20Ω', valor: `${terra_servico}Ω`, limite: '<20Ω' });
        }
      }

      // Limpar progresso salvo
      localStorage.removeItem(STORAGE_KEY);

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
                {tipoPT === 'PTC' ? 'Auditoria PTC' : 'Auditoria PTA'}
              </span>
              {resumed && (
                <span className="ml-3 text-[8px] font-black uppercase bg-emerald-400 text-[#0d3fd1] px-2 py-0.5 rounded-full animate-pulse">
                  Progresso Retomado
                </span>
              )}
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

          {/* ── PASSO 1: PT Info ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#0d3fd1]/5 border border-[#0d3fd1]/15 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-2 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Confronto de Dados — PT</p>
                <p className="text-[10px] font-bold text-[#444655]">Verifique os dados abaixo. Se algum estiver incorreto no local, clique em "Corrigir".</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ConfrontoField
                  label="ID do PT" valorOriginal={tarefa.id_pt}
                  valorEditado={ptInfoEdits.id_pt} conforme={ptInfoConforme.id_pt}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, id_pt: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, id_pt: v }))} />
                <ConfrontoField
                  label="Proprietário" valorOriginal={pt?.proprietario?.nome || pt?.proprietario}
                  valorEditado={ptInfoEdits.proprietario} conforme={ptInfoConforme.proprietario}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, proprietario: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, proprietario: v }))} />
                <ConfrontoField
                  label="Subestação" valorOriginal={sub?.nome}
                  valorEditado={ptInfoEdits.subestacao} conforme={ptInfoConforme.subestacao}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, subestacao: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, subestacao: v }))} />
                <ConfrontoField
                  label="Município" valorOriginal={pt?.municipio || sub?.municipio}
                  valorEditado={ptInfoEdits.municipio} conforme={ptInfoConforme.municipio}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, municipio: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, municipio: v }))} />
                <ConfrontoField
                  label="Localização (GPS)" valorOriginal={pt?.gps}
                  valorEditado={ptInfoEdits.gps} conforme={ptInfoConforme.gps}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, gps: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, gps: v }))} />
                <ConfrontoField
                  label="Potência Contratual" valorOriginal={pt?.potencia_kva ? `${pt.potencia_kva} kVA` : null}
                  valorEditado={ptInfoEdits.potencia_contratual} conforme={ptInfoConforme.potencia_contratual}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, potencia_contratual: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, potencia_contratual: v }))} isNumber={true}
                  helpText="Dados de contrato na base de dados" />
                <ConfrontoField
                  label="Potência Instalada" valorOriginal={pt?.potencia_instalada ? `${pt.potencia_instalada} kVA` : null}
                  valorEditado={ptInfoEdits.potencia_instalada} conforme={ptInfoConforme.potencia_instalada}
                  onConforme={(v) => setPtInfoConforme(p => ({ ...p, potencia_instalada: v }))}
                  onEdit={(v) => setPtInfoEdits(p => ({ ...p, potencia_instalada: v }))} isNumber={true}
                  helpText="Deve ser preenchida pelo técnico no local" />
              </div>

              {pt?.gps && (
                <a href={`https://www.google.com/maps?q=${encodeURIComponent(pt.gps)}`} target="_blank" rel="noreferrer"
                  className="mt-3 flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-colors w-full justify-center">
                  <MapPin className="w-3.5 h-3.5" /> Abrir no Mapa
                </a>
              )}

              {tarefa.descricao && (
                <div className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl p-4 mt-4">
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Instruções da Tarefa
                  </p>
                  <p className="text-sm font-medium text-[#444655] leading-relaxed">{tarefa.descricao}</p>
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 2: Cliente ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Confronto de Dados — Cliente</p>
                <p className="text-[10px] font-bold text-[#444655]">Valide ou corrija os dados do cliente associado ao PT.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ConfrontoField
                  label="Nome do Cliente" valorOriginal={pt?.proprietario?.nome || pt?.proprietario}
                  valorEditado={clienteEdits.nome} conforme={clienteConforme.nome}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, nome: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, nome: v }))} />
                <ConfrontoField
                  label="NIF" valorOriginal={pt?.proprietario?.nif}
                  valorEditado={clienteEdits.nif} conforme={clienteConforme.nif}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, nif: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, nif: v }))} />
                <ConfrontoField
                  label="Tipo de Cliente" valorOriginal={pt?.proprietario?.tipo_cliente}
                  valorEditado={clienteEdits.tipo_cliente} conforme={clienteConforme.tipo_cliente}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, tipo_cliente: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, tipo_cliente: v }))} />
                <ConfrontoField
                  label="Conta/Contrato" valorOriginal={pt?.proprietario?.conta_contrato}
                  valorEditado={clienteEdits.conta_contrato} conforme={clienteConforme.conta_contrato}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, conta_contrato: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, conta_contrato: v }))} />
                <ConfrontoField
                  label="Parceiro de Negócio" valorOriginal={pt?.proprietario?.parceiro_negocios}
                  valorEditado={clienteEdits.parceiro_negocio} conforme={clienteConforme.parceiro_negocio}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, parceiro_negocio: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, parceiro_negocio: v }))} />
                <ConfrontoField
                  label="Telefone" valorOriginal={pt?.proprietario?.telefone || pt?.proprietario?.contacto_resp_financeiro}
                  valorEditado={clienteEdits.telefone} conforme={clienteConforme.telefone}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, telefone: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, telefone: v }))} />
                <ConfrontoField
                  label="Email" valorOriginal={pt?.proprietario?.email}
                  valorEditado={clienteEdits.email} conforme={clienteConforme.email}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, email: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, email: v }))} />
                <ConfrontoField
                  label="Responsável" valorOriginal={pt?.proprietario?.responsavel_financeiro}
                  valorEditado={clienteEdits.responsavel} conforme={clienteConforme.responsavel}
                  onConforme={(v) => setClienteConforme(p => ({ ...p, responsavel: v }))}
                  onEdit={(v) => setClienteEdits(p => ({ ...p, responsavel: v }))} />
              </div>
            </div>
          )}

          {/* ── PASSO 3: Contador ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-[#fcfdff] border border-[#0d3fd1]/10 rounded-2xl p-5">
                <label className="block text-[10px] font-black text-[#747686] uppercase tracking-widest mb-4">Tem contagem no local? *</label>
                <div className="flex gap-3">
                  {[
                    { val: true, label: 'Sim', color: 'bg-emerald-500' },
                    { val: false, label: 'Não', color: 'bg-red-500' }
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => setContador({ ...contador, tem_contagem: opt.val })}
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${contador.tem_contagem === opt.val
                        ? `${opt.color} text-white border-transparent shadow-lg`
                        : 'bg-white border-[#c4c5d7]/20 text-[#444655] hover:border-[#0d3fd1]/30'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {!contador.tem_contagem ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Justificativa Necessária</h4>
                  </div>
                  <textarea
                    required
                    placeholder="Descreva por que não foi possível realizar a contagem (Ex: Contador inacessível, danificado...)"
                    className="w-full h-28 bg-white border-2 border-red-100 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c] focus:border-red-500 outline-none transition-all"
                    value={contador.como_contagem}
                    onChange={(e) => setContador({ ...contador, como_contagem: e.target.value })}
                  />
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest opacity-70">
                    Nota: O fluxo saltará para o resumo final.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Marca</label>
                      <input
                        type="text"
                        placeholder="Ex: Landis+Gyr"
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]"
                        value={contador.marca}
                        onChange={(e) => setContador({ ...contador, marca: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: ZMD"
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]"
                        value={contador.modelo}
                        onChange={(e) => setContador({ ...contador, modelo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-[#f8faff] px-4 py-3 border-b border-[#c4c5d7]/20 flex justify-between items-center">
                      <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-widest">Pontas de Tomada</span>
                      <button
                        type="button"
                        onClick={() => setContador({ ...contador, ponta_tomada: [...contador.ponta_tomada, { tipo: '', obs: '' }] })}
                        className="p-1.5 bg-[#0d3fd1] text-white rounded-lg hover:bg-[#0034cc] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {contador.ponta_tomada.map((pt, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-[#fcfdff] p-3 rounded-xl border border-[#c4c5d7]/10">
                          <input
                            type="text"
                            placeholder="Tipo"
                            className="w-1/3 bg-white border border-[#c4c5d7]/20 rounded-lg px-3 py-2 text-[11px] font-bold"
                            value={pt.tipo}
                            onChange={(e) => {
                              const next = [...contador.ponta_tomada];
                              next[idx].tipo = e.target.value;
                              setContador({ ...contador, ponta_tomada: next });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Observação"
                            className="flex-1 bg-white border border-[#c4c5d7]/20 rounded-lg px-3 py-2 text-[11px] font-bold"
                            value={pt.obs}
                            onChange={(e) => {
                              const next = [...contador.ponta_tomada];
                              next[idx].obs = e.target.value;
                              setContador({ ...contador, ponta_tomada: next });
                            }}
                          />
                          {contador.ponta_tomada.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setContador({ ...contador, ponta_tomada: contador.ponta_tomada.filter((_, i) => i !== idx) })}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#fcfdff] border border-[#0d3fd1]/10 rounded-2xl p-5 space-y-4">
                    <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-widest">Tipo de Energia</span>

                    <div className="flex gap-2">
                      {['Ativa', 'Reativa'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setContador({ ...contador, tipo_energia: t })}
                          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${contador.tipo_energia === t
                            ? 'bg-blue-500 text-white border-transparent shadow-md'
                            : 'bg-white border-[#c4c5d7]/20 text-[#444655]'
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {contador.tipo_energia === 'Ativa' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2">
                        <label className="text-[9px] font-black text-[#444655] uppercase tracking-widest ml-1">Leitura Atual (kWh)</label>
                        <input
                          type="number"
                          placeholder="Valor do visor..."
                          className="w-full bg-white border-2 border-emerald-100 rounded-xl py-3 px-4 text-sm font-black text-[#0f1c2c] focus:border-emerald-500 outline-none"
                          value={contador.leitura}
                          onChange={(e) => setContador({ ...contador, leitura: e.target.value === '' ? '' : Number(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 4: Checklist ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">Tipo de Instalação</p>
                  <p className="text-[9px] text-[#747686]">Pode alterar o tipo de PT se a deteção estiver incorreta.</p>
                </div>
                <div className="flex bg-white border border-[#c4c5d7]/30 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setTipoPT('PTA')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${tipoPT === 'PTA' ? 'bg-[#0d3fd1] text-white' : 'text-[#747686] hover:bg-[#eff4ff]'}`}>PTA</button>
                  <button onClick={() => setTipoPT('PTC')} className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${tipoPT === 'PTC' ? 'bg-[#0d3fd1] text-white' : 'text-[#747686] hover:bg-[#eff4ff]'}`}>PTC</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">
                  Checklist {tipoPT} — {checklistBase.length} itens
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
                  <div key={secao} className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
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

                    <SecaoFoto
                      secao={secao}
                      foto={checklistFotos[secao]}
                      onCapture={handleFotoChecklist}
                      onRemove={handleRemoveFotoChecklist}
                    />
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

          {/* ── PASSO 5: Medições ────────────────────────────────────────── */}
          {step === 5 && (
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

          {/* ── PASSO 6: Resumo e Resultado ──────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              {/* 1. Confronto de Dados - PT */}
              <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#f0f4ff] px-4 py-2 border-b border-[#c4c5d7]/20">
                  <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> 1. Resumo PT Info
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: 'ID do PT', original: tarefa.id_pt, editado: ptInfoEdits.id_pt, conforme: ptInfoConforme.id_pt },
                    { label: 'Proprietário', original: pt?.proprietario?.nome || pt?.proprietario, editado: ptInfoEdits.proprietario, conforme: ptInfoConforme.proprietario },
                    { label: 'Subestação', original: sub?.nome, editado: ptInfoEdits.subestacao, conforme: ptInfoConforme.subestacao },
                    { label: 'Município', original: pt?.municipio || sub?.municipio, editado: ptInfoEdits.municipio, conforme: ptInfoConforme.municipio },
                    { label: 'GPS', original: pt?.gps, editado: ptInfoEdits.gps, conforme: ptInfoConforme.gps },
                    { label: 'Pot. Contratual', original: pt?.potencia_kva ? `${pt.potencia_kva} kVA` : null, editado: ptInfoEdits.potencia_contratual, conforme: ptInfoConforme.potencia_contratual },
                    { label: 'Pot. Instalada', original: pt?.potencia_instalada ? `${pt.potencia_instalada} kVA` : null, editado: ptInfoEdits.potencia_instalada, conforme: ptInfoConforme.potencia_instalada },
                  ].map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-[#f0f1f7] last:border-0 gap-1">
                      <span className="text-[10px] font-bold text-[#747686] uppercase tracking-tight">{field.label}</span>
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase">
                        {field.conforme ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {field.original || 'N/A'}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[#747686] line-through opacity-50">{field.original || 'N/A'}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-[#0d3fd1]" />
                            <span className="text-[#0d3fd1] bg-[#0d3fd1]/5 px-2 py-0.5 rounded">{field.editado || '---'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Confronto de Dados - Cliente */}
              <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#fcf8ff] px-4 py-2 border-b border-[#c4c5d7]/20">
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> 2. Resumo Cliente
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: 'Nome', original: pt?.proprietario?.nome || pt?.proprietario, editado: clienteEdits.nome, conforme: clienteConforme.nome },
                    { label: 'NIF', original: pt?.proprietario?.nif, editado: clienteEdits.nif, conforme: clienteConforme.nif },
                    { label: 'Tipo', original: pt?.proprietario?.tipo_cliente, editado: clienteEdits.tipo_cliente, conforme: clienteConforme.tipo_cliente },
                    { label: 'Conta/Contrato', original: pt?.proprietario?.conta_contrato, editado: clienteEdits.conta_contrato, conforme: clienteConforme.conta_contrato },
                    { label: 'Parceiro', original: pt?.proprietario?.parceiro_negocios, editado: clienteEdits.parceiro_negocio, conforme: clienteConforme.parceiro_negocio },
                    { label: 'Telefone', original: pt?.proprietario?.telefone || pt?.proprietario?.contacto_resp_financeiro, editado: clienteEdits.telefone, conforme: clienteConforme.telefone },
                    { label: 'Email', original: pt?.proprietario?.email, editado: clienteEdits.email, conforme: clienteConforme.email },
                    { label: 'Responsável', original: pt?.proprietario?.responsavel_financeiro, editado: clienteEdits.responsavel, conforme: clienteConforme.responsavel },
                  ].map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-[#f0f1f7] last:border-0 gap-1">
                      <span className="text-[10px] font-bold text-[#747686] uppercase tracking-tight">{field.label}</span>
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase">
                        {field.conforme ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {field.original || 'N/A'}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[#747686] line-through opacity-50">{field.original || 'N/A'}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-purple-700" />
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{field.editado || '---'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Checklist e Fotos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" /> 3. Checklist
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                      <span className="text-[#747686]">Total Itens</span>
                      <span>{checklistBase.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                      <span className="text-emerald-600">Conformes (OK)</span>
                      <span>{totalOK}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                      <span className="text-red-600">Não Conformes (NC)</span>
                      <span>{totalNC}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase border-t pt-2 mt-2">
                      <span className="text-[#0d3fd1]">Fotos Capturadas</span>
                      <span>{Object.keys(checklistFotos).length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> 4. Medições
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                      <span className="text-[#747686]">Terra Proteção</span>
                      <span className={Number(medicoes.terra_protecao) >= 20 ? 'text-red-600' : 'text-emerald-600'}>{medicoes.terra_protecao} Ω</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                      <span className="text-[#747686]">Terra Serviço</span>
                      <span className={Number(medicoes.terra_servico) >= 20 ? 'text-red-600' : 'text-emerald-600'}>{medicoes.terra_servico} Ω</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase border-t pt-2 mt-2">
                      <span className="text-[#747686]">Tensões</span>
                      <span className="text-[9px] font-bold">Ver detalhes na submissão</span>
                    </div>
                  </div>
                </div>

                {/* Contador Summary */}
                <div className="bg-white border border-[#c4c5d7]/20 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#0d3fd1]" /> 5. Contador
                  </p>
                  {!contador.tem_contagem ? (
                    <div className="bg-red-50 p-3 rounded-xl">
                      <p className="text-[10px] font-black text-red-700 uppercase">SEM CONTAGEM</p>
                      <p className="text-[9px] text-red-600 italic mt-1">{contador.como_contagem}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-black uppercase">
                        <span className="text-[#747686]">Marca/Modelo</span>
                        <span className="text-[#0f1c2c]">{contador.marca || '---'} / {contador.modelo || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase">
                        <span className="text-[#747686]">Leitura ({contador.tipo_energia})</span>
                        <span className="text-emerald-600">{contador.leitura ? `${contador.leitura} kWh` : '---'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase border-t pt-2 mt-2">
                        <span className="text-[#747686]">Pontas de Tomada</span>
                        <span>{contador.ponta_tomada.length} registos</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Resultado Final */}
              <div className="bg-[#0f1c2c] text-white border border-[#0f1c2c] rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Resultado Final</p>
                    <h4 className="text-xl font-black uppercase tracking-tight">{formData.resultado}</h4>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${RESULTADO_COLOR[formData.resultado]}`}>
                    {formData.resultado}
                  </div>
                </div>

                {formData.nivel_urgencia && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Urgência:</span>
                    <span className="text-[11px] font-black uppercase px-3 py-1 rounded-lg bg-white/10">{formData.nivel_urgencia}</span>
                  </div>
                )}

                {formData.observacoes && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Observações de Campo</p>
                    <p className="text-sm font-medium leading-relaxed">{formData.observacoes}</p>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Rever Resultado da Auditoria</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RESULTADOS.map(r => (
                      <button key={r} onClick={() => setFormData(p => ({ ...p, resultado: r }))}
                        className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${formData.resultado === r ? 'bg-white text-[#0f1c2c] border-white shadow-lg' : 'bg-transparent border-white/20 text-white/70 hover:bg-white/5'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
                {iniciando ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A iniciar...</> : <><Zap className="w-4 h-4" fill="currentColor" /> {tarefa.status === 'Em Andamento' ? 'Continuar' : 'Iniciar'} <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            )}
            {step === 2 && (
              <button onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20`}>
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 3 && (
              <button
                disabled={contador.tem_contagem ? false : !contador.como_contagem}
                onClick={() => setStep(contador.tem_contagem ? 4 : 6)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${(!contador.tem_contagem && !contador.como_contagem) ? 'bg-[#c4c5d7] text-white cursor-not-allowed' : 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20'}`}>
                {contador.tem_contagem ? 'Continuar' : 'Saltar para Resumo'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 4 && (
              <button disabled={totalPendente > 0} onClick={() => setStep(5)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${totalPendente === 0 ? 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20' : 'bg-[#c4c5d7] text-white cursor-not-allowed'}`}>
                {totalPendente > 0 ? `Faltam ${totalPendente} itens` : 'Medições'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 5 && (
              <button disabled={medicoes.terra_protecao === '' || medicoes.terra_servico === ''} onClick={() => setStep(6)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${medicoes.terra_protecao !== '' && medicoes.terra_servico !== '' ? 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20' : 'bg-[#c4c5d7] text-white cursor-not-allowed'}`}>
                Resultado <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 6 && !success && (
              <button disabled={loading || !infoCompleta} onClick={handleSubmit}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${loading || !infoCompleta ? 'bg-[#c4c5d7] text-white cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'}`}>
                {loading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A submeter...</> : !infoCompleta ? 'Informação Incompleta' : <><CheckCircle2 className="w-4 h-4" /> Concluir Auditoria</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
