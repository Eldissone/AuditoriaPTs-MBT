import React, { useState, useRef } from 'react';
import {
  X, Camera, Upload, CheckCircle2, AlertCircle, MapPin,
  ArrowRight, ArrowLeft, Zap, ClipboardList, ImagePlus,
  Trash2, Eye, AlertTriangle, FileText, Clock
} from 'lucide-react';
import api from '../services/api';

// ─── Slots de fotos obrigatórios/opcionais ────────────────────────────────────
const PHOTO_SLOTS = [
  { id: 'vista_geral',  label: 'Vista Geral do PT',         required: true,  icon: '🏗️' },
  { id: 'placa_id',     label: 'Placa de Identificação',    required: true,  icon: '🪧' },
  { id: 'estado_equip', label: 'Estado Geral do Equipamento', required: true, icon: '⚡' },
  { id: 'extra',        label: 'Foto Adicional (opcional)', required: false, icon: '📷' },
];

const RESULTADOS = ['Conforme', 'Não Conforme', 'Em Avaliação', 'Urgente'];
const URGENCIAS  = ['Baixo', 'Médio', 'Alto', 'Crítico'];

const RESULTADO_COLOR = {
  'Conforme':      'bg-emerald-500',
  'Não Conforme':  'bg-amber-500',
  'Em Avaliação':  'bg-blue-500',
  'Urgente':       'bg-red-500',
};

// ─── Utilitário: comprime imagem antes de guardar ─────────────────────────────
function compressImage(file, maxW = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Sub-componente: Card de foto ─────────────────────────────────────────────
function PhotoCard({ slot, photo, onChange }) {
  const inputRef = useRef();

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    onChange(slot.id, { label: slot.label, data: compressed, tipo: file.type });
    e.target.value = '';
  };

  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
      photo
        ? 'border-emerald-300 shadow-lg shadow-emerald-50'
        : slot.required
          ? 'border-dashed border-[#0d3fd1]/30 bg-[#f8faff] hover:border-[#0d3fd1]/60'
          : 'border-dashed border-[#c4c5d7]/40 bg-[#fcfdff] hover:border-[#747686]/40'
    }`}>
      {photo ? (
        /* ── Preview ── */
        <div className="relative">
          <img src={photo.data} alt={slot.label} className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-white font-black uppercase tracking-wider">{slot.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] text-emerald-300 font-bold uppercase">Capturada</span>
              </div>
            </div>
            <button
              onClick={() => onChange(slot.id, null)}
              className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Capturar ── */
        <label className="flex flex-col items-center justify-center gap-3 p-6 cursor-pointer min-h-[160px]">
          <div className={`text-3xl`}>{slot.icon}</div>
          <div className="text-center">
            <p className={`text-[10px] font-black uppercase tracking-wider ${slot.required ? 'text-[#0f1c2c]' : 'text-[#747686]'}`}>
              {slot.label}
            </p>
            {slot.required && (
              <span className="text-[8px] font-black text-red-500 uppercase">Obrigatório</span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-[#0d3fd1] text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" /> Câmara
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#0d3fd1]/20 text-[#0d3fd1] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5" /> Ficheiro
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function QuickAuditModal({ tarefa, onClose, onDone }) {
  const [step, setStep] = useState(1); // 1=briefing, 2=fotos, 3=dados, 4=submeter
  const [iniciando, setIniciando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fotos: { slot_id: { label, data, tipo } | null }
  const [fotos, setFotos] = useState(
    Object.fromEntries(PHOTO_SLOTS.map(s => [s.id, null]))
  );

  // Dados da inspeção
  const [formData, setFormData] = useState({
    resultado: 'Em Avaliação',
    nivel_urgencia: 'Baixo',
    observacoes: '',
    proxima_inspecao: '',
  });

  const pt = tarefa.pt;
  const sub = pt?.subestacao;

  // ── Passo 1: Iniciar tarefa ──────────────────────────────────────────────
  const handleIniciar = async () => {
    try {
      setIniciando(true);
      setError(null);
      await api.put(`/tarefas/${tarefa.id}/iniciar`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao iniciar a tarefa.');
    } finally {
      setIniciando(false);
    }
  };

  // ── Gestão de fotos ──────────────────────────────────────────────────────
  const handleFotoChange = (slotId, value) => {
    setFotos(prev => ({ ...prev, [slotId]: value }));
  };

  const fotosObrigatoriasCaptured = PHOTO_SLOTS
    .filter(s => s.required)
    .every(s => fotos[s.id] !== null);

  // ── Passo 3/4: Submeter inspeção ─────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Montar array de fotos para guardar (excluir nulls)
      const fotosArray = PHOTO_SLOTS
        .filter(s => fotos[s.id] !== null)
        .map(s => fotos[s.id]);

      // Criar inspeção
      const inspecaoPayload = {
        id_pt: tarefa.id_pt,
        id_tarefa: tarefa.id,
        tipo: 'Preventiva',
        resultado: formData.resultado,
        nivel_urgencia: ['Não Conforme', 'Urgente'].includes(formData.resultado)
          ? formData.nivel_urgencia
          : null,
        observacoes: formData.observacoes || null,
        proxima_inspecao: formData.proxima_inspecao || null,
        fotos: fotosArray,
      };

      await api.post('/inspecoes', inspecaoPayload);

      // Concluir tarefa
      await api.put(`/tarefas/${tarefa.id}/concluir`, {
        checklist: tarefa.checklist || []
      });

      setSuccess(true);
      setTimeout(() => {
        onDone?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao submeter a auditoria.');
    } finally {
      setLoading(false);
    }
  };

  // ── Labels de step ────────────────────────────────────────────────────────
  const STEPS = [
    { n: 1, label: 'PT Info' },
    { n: 2, label: 'Fotos' },
    { n: 3, label: 'Dados' },
    { n: 4, label: 'Submeter' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-[#0f1c2c]/70 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#0d3fd1] to-[#1a52e8] p-5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-white/70" />
              <span className="text-[9px] text-white/70 font-black uppercase tracking-[0.2em]">
                Auditoria Rápida de Campo
              </span>
            </div>
            <h3 className="text-white text-base font-black uppercase tracking-tight leading-tight">
              {tarefa.titulo}
            </h3>
            {tarefa.id_pt && (
              <p className="text-white/60 text-[10px] font-bold uppercase mt-1">PT: {tarefa.id_pt}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ── Step Indicator ──────────────────────────────────────────── */}
        <div className="px-5 py-3 bg-[#f0f4ff] border-b border-[#0d3fd1]/10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                step === s.n
                  ? 'bg-[#0d3fd1] text-white shadow-md'
                  : step > s.n
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-[#747686] border border-[#c4c5d7]/30'
              }`}>
                {step > s.n
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <span>{s.n}</span>
                }
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${step > s.n ? 'bg-emerald-400' : 'bg-[#e0e4f0]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Conteúdo ─────────────────────────────────────────────────── */}
        <div className="flex-grow overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>

          {/* ── PASSO 1: Briefing ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#0d3fd1]/5 border border-[#0d3fd1]/15 rounded-2xl p-4">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5" /> Informação do PT
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'ID PT',          val: tarefa.id_pt },
                    { label: 'Subestação',      val: sub?.nome },
                    { label: 'Proprietário',    val: sub?.proprietario },
                    { label: 'Município',       val: sub?.municipio },
                    { label: 'Bairro',          val: sub?.bairro },
                    { label: 'Potência',        val: pt?.potencia_kva ? `${pt.potencia_kva} kVA` : null },
                  ].map(({ label, val }) => val ? (
                    <div key={label} className="bg-white rounded-xl p-3 border border-[#0d3fd1]/10">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#747686] mb-0.5">{label}</p>
                      <p className="text-[11px] font-black text-[#0f1c2c] uppercase">{val}</p>
                    </div>
                  ) : null)}
                </div>
                {pt?.gps && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(pt.gps)}`}
                    target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-colors w-full justify-center"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Abrir no Mapa — GPS: {pt.gps}
                  </a>
                )}
              </div>

              {tarefa.descricao && (
                <div className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Instruções da Tarefa
                  </p>
                  <p className="text-sm font-medium text-[#444655] leading-relaxed">{tarefa.descricao}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                  Ao iniciar, o cronómetro começa a contar. Vai capturar{' '}
                  <strong>{PHOTO_SLOTS.filter(s => s.required).length} fotografias obrigatórias</strong>{' '}
                  do PT e registar os dados da inspeção.
                </p>
              </div>
            </div>
          )}

          {/* ── PASSO 2: Fotos ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">
                  Capturas de Campo
                </p>
                <span className="text-[9px] font-black text-[#0d3fd1] bg-[#eff4ff] px-3 py-1 rounded-full">
                  {Object.values(fotos).filter(Boolean).length}/{PHOTO_SLOTS.length} capturadas
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PHOTO_SLOTS.map(slot => (
                  <PhotoCard
                    key={slot.id}
                    slot={slot}
                    photo={fotos[slot.id]}
                    onChange={handleFotoChange}
                  />
                ))}
              </div>
              {!fotosObrigatoriasCaptured && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-[9px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Capture todas as fotos obrigatórias para avançar
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 3: Dados ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Resultado */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">
                  Resultado da Inspeção *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESULTADOS.map(r => (
                    <button
                      key={r}
                      onClick={() => setFormData(p => ({ ...p, resultado: r }))}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                        formData.resultado === r
                          ? `${RESULTADO_COLOR[r]} text-white border-transparent shadow-lg`
                          : 'bg-white border-[#c4c5d7]/30 text-[#444655] hover:border-[#0d3fd1]/30'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgência (apenas se não conforme / urgente) */}
              {['Não Conforme', 'Urgente'].includes(formData.resultado) && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">
                    Nível de Urgência
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {URGENCIAS.map(u => (
                      <button
                        key={u}
                        onClick={() => setFormData(p => ({ ...p, nivel_urgencia: u }))}
                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${
                          formData.nivel_urgencia === u
                            ? u === 'Crítico' ? 'bg-red-500 text-white border-transparent'
                              : u === 'Alto' ? 'bg-orange-500 text-white border-transparent'
                              : u === 'Médio' ? 'bg-amber-400 text-white border-transparent'
                              : 'bg-blue-400 text-white border-transparent'
                            : 'bg-white border-[#c4c5d7]/30 text-[#444655]'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">
                  Observações / Notas de Campo
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                  rows={4}
                  placeholder="Anote anomalias, leituras, condições observadas no local..."
                  className="w-full border border-[#c4c5d7]/30 rounded-xl p-3 text-sm font-medium text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20 resize-none bg-[#fcfdff] placeholder:text-[#c4c5d7]"
                />
              </div>

              {/* Próxima inspeção */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#747686] mb-2">
                  Data da Próxima Inspeção (opcional)
                </label>
                <input
                  type="date"
                  value={formData.proxima_inspecao}
                  onChange={e => setFormData(p => ({ ...p, proxima_inspecao: e.target.value }))}
                  className="w-full border border-[#c4c5d7]/30 rounded-xl p-3 text-sm font-medium text-[#0f1c2c] focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20 bg-[#fcfdff]"
                />
              </div>
            </div>
          )}

          {/* ── PASSO 4: Resumo & Submeter ─────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Resumo fotos */}
              <div className="bg-[#f8faff] border border-[#0d3fd1]/10 rounded-2xl p-4">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" /> Fotos Capturadas
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PHOTO_SLOTS.map(s => (
                    <div key={s.id} className="relative">
                      {fotos[s.id]
                        ? <img src={fotos[s.id].data} alt={s.label} className="w-full h-16 object-cover rounded-xl border-2 border-emerald-300" />
                        : <div className="w-full h-16 bg-[#f0f2f5] rounded-xl border-2 border-dashed border-[#c4c5d7]/40 flex items-center justify-center text-lg">{s.icon}</div>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo dados */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#747686] mb-1">Resultado</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase ${RESULTADO_COLOR[formData.resultado]}`}>
                    {formData.resultado}
                  </span>
                </div>
                {formData.nivel_urgencia && ['Não Conforme', 'Urgente'].includes(formData.resultado) && (
                  <div className="bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#747686] mb-1">Urgência</p>
                    <p className="text-[11px] font-black text-[#0f1c2c] uppercase">{formData.nivel_urgencia}</p>
                  </div>
                )}
                <div className="col-span-2 bg-white border border-[#c4c5d7]/20 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#747686] mb-1">Observações</p>
                  <p className="text-[11px] font-medium text-[#444655]">{formData.observacoes || '—'}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                  A tarefa será marcada como <strong>Concluída</strong> e a inspeção registada com as fotos e dados acima.
                  Esta ação não pode ser revertida.
                </p>
              </div>
            </div>
          )}

          {/* ── Error / Success ───────────────────────────────────────── */}
          {error && (
            <div className="mt-4 flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-3 bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Auditoria submetida com sucesso! Tarefa concluída.
            </div>
          )}
        </div>

        {/* ── Footer / Navegação ───────────────────────────────────────── */}
        <div className="p-4 border-t border-[#c4c5d7]/10 bg-[#fcfdff] flex items-center justify-between gap-3">
          {/* Voltar */}
          {step > 1 && !success && (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#747686] hover:bg-[#eff4ff] transition-all disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          )}
          {step === 1 && (
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#747686] hover:bg-[#eff4ff] transition-all">
              Cancelar
            </button>
          )}

          {/* Avançar */}
          <div className="ml-auto">
            {step === 1 && (
              <button
                disabled={iniciando}
                onClick={handleIniciar}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all disabled:opacity-60"
              >
                {iniciando
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A iniciar...</>
                  : <><Zap className="w-4 h-4" fill="currentColor" /> Iniciar Auditoria <ArrowRight className="w-3.5 h-3.5" /></>
                }
              </button>
            )}
            {step === 2 && (
              <button
                disabled={!fotosObrigatoriasCaptured}
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
                  fotosObrigatoriasCaptured
                    ? 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20'
                    : 'bg-[#c4c5d7] text-white cursor-not-allowed'
                }`}
              >
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-[#0d3fd1] text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#0d3fd1]/20 hover:bg-[#0034cc] active:scale-95 transition-all"
              >
                Rever e Submeter <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 4 && !success && (
              <button
                disabled={loading}
                onClick={handleSubmit}
                className={`flex items-center gap-2 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
                  loading
                    ? 'bg-[#c4c5d7] text-white cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                }`}
              >
                {loading
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A submeter...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Concluir Auditoria</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
