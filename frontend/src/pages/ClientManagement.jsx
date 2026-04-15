import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Filter,
  ChevronDown,
  ChevronRight,
  Database,
  Building2,
  MapPin,
  X,
  Activity,
  Users,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  WrenchIcon,
  SquareDashedMousePointer,
  MoveRight,
  CheckSquare,
  Square,
  MinusSquare,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import ExcelImportModal from '../components/ExcelImportModal';

// ─── Transfer Modal ──────────────────────────────────────────────────────────
function TransferModal({ isOpen, onClose, selectedPTs, subestacoes, onSuccess }) {
  const [destinoId, setDestinoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setDestinoId(''); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleConfirm() {
    if (!destinoId) { setError('Seleccione a subestação de destino.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/clientes/transferir', {
        id_pts: Array.from(selectedPTs),
        id_subestacao_destino: Number(destinoId),
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao transferir PTs.');
    } finally {
      setLoading(false);
    }
  }

  const total = selectedPTs.size;
  const destinoNome = subestacoes.find(s => String(s.id) === String(destinoId))?.nome || '';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0f1c2c]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0d3fd1] to-[#1a56f0] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">
                  Transferir PTs
                </h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Mover para nova subestação
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Summary */}
          <div className="bg-[#eff4ff] rounded-xl px-4 py-3 flex items-center gap-3 border border-[#0d3fd1]/10">
            <CheckSquare className="w-5 h-5 text-[#0d3fd1] shrink-0" />
            <div>
              <p className="text-[#0d3fd1] font-black text-sm">
                {total} {total === 1 ? 'PT seleccionado' : 'PTs seleccionados'}
              </p>
              <p className="text-[#0d3fd1]/60 text-[10px] font-bold uppercase tracking-widest">
                Serão movidos para a subestação escolhida
              </p>
            </div>
          </div>

          {/* Destination picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">
              Subestação de Destino
            </label>
            <select
              value={destinoId}
              onChange={e => { setDestinoId(e.target.value); setError(''); }}
              className="bg-[#f8f9ff] border-2 border-[#c4c5d7]/40 focus:border-[#0d3fd1] rounded-xl px-4 py-3 text-[11px] font-bold text-[#0f1c2c] outline-none transition-colors"
            >
              <option value="">— Escolher subestação —</option>
              {subestacoes.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Preview arrow */}
          {destinoNome && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#747686]">
              <div className="flex-1 h-px bg-[#c4c5d7]/30" />
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0d3fd1]" />
              <span className="text-[#0d3fd1] uppercase tracking-wider">{destinoNome}</span>
              <div className="flex-1 h-px bg-[#c4c5d7]/30" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-[10px] font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#c4c5d7]/40 text-[10px] font-black uppercase tracking-widest text-[#747686] hover:bg-[#f8f9ff] transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !destinoId}
            className="flex-1 px-4 py-3 rounded-xl bg-[#0d3fd1] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0934b8] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> A transferir...</>
            ) : (
              <><ArrowRightLeft className="w-3.5 h-3.5" /> Confirmar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ClientManagement() {
  const [clientes, setClientes] = useState([]);
  const [subestacoes, setSubestacoes] = useState([]);
  const [metadata, setMetadata] = useState({ municipios: [], categorias: [], potencias: [] });
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedSubestacoes, setExpandedSubestacoes] = useState({});

  // ── Selection state ───────────────────────────────────────────────────────
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPTs, setSelectedPTs] = useState(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Filter state (UI)
  const [filters, setFilters] = useState({
    search: '',
    municipio: '',
    estado_operacional: '',
    nivel_tensao: '',
  });

  // Active filters (debounced — triggers the fetch)
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    municipio: '',
    estado_operacional: '',
    nivel_tensao: '',
  });

  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // ── Metadata & Subestações ────────────────────────────────────────────────
  useEffect(() => {
    fetchMetadata();
    fetchSubestacoes();
  }, []);

  async function fetchMetadata() {
    try {
      const res = await api.get('/subestacoes/metadata');
      setMetadata(res.data);
    } catch (err) {
      console.error('Erro ao buscar metadados', err);
    }
  }

  async function fetchSubestacoes() {
    try {
      const res = await api.get('/subestacoes');
      setSubestacoes(res.data.data || res.data);
    } catch (err) {
      console.error('Erro ao buscar subestações', err);
    }
  }

  // ── Fetch clientes when active filters change ─────────────────────────────
  useEffect(() => {
    fetchClientes();
  }, [activeFilters]);

  async function fetchClientes() {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.municipio) params.municipio = activeFilters.municipio;
      if (activeFilters.estado_operacional) params.estado_operacional = activeFilters.estado_operacional;
      if (activeFilters.nivel_tensao) params.nivel_tensao = activeFilters.nivel_tensao;

      const response = await api.get('/clientes', { params });

      let data = response.data.data || response.data;

      // Client-side nivel_tensao filter (not supported server-side)
      if (activeFilters.nivel_tensao) {
        data = data.filter(c =>
          (c.nivel_tensao || '').toLowerCase().includes(activeFilters.nivel_tensao.toLowerCase())
        );
      }

      setClientes(data);
    } catch (error) {
      console.error('Erro ao buscar clientes', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);

    if (key === 'search') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setActiveFilters(updated), 500);
    } else {
      setActiveFilters(updated);
    }
  }, [filters]);

  const clearFilters = useCallback(() => {
    const empty = { search: '', municipio: '', estado_operacional: '', nivel_tensao: '' };
    setFilters(empty);
    setActiveFilters(empty);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const hasActiveFilters = !!(
    activeFilters.search ||
    activeFilters.municipio ||
    activeFilters.estado_operacional ||
    activeFilters.nivel_tensao
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id_pt) {
    if (window.confirm(`Tem a certeza que deseja eliminar o cliente ${id_pt}?`)) {
      try {
        await api.delete(`/clientes/${id_pt}`);
        fetchClientes();
        alert('Cliente eliminado com sucesso.');
      } catch {
        alert('Erro ao eliminar cliente.');
      }
    }
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSelectionMode() {
    setIsSelectionMode(prev => {
      if (prev) setSelectedPTs(new Set());
      return !prev;
    });
  }

  function togglePT(id_pt) {
    setSelectedPTs(prev => {
      const next = new Set(prev);
      next.has(id_pt) ? next.delete(id_pt) : next.add(id_pt);
      return next;
    });
  }

  // Toggle all PTs of a given substation group
  function toggleGroup(items) {
    const groupIds = items.map(c => c.id_pt);
    const allSelected = groupIds.every(id => selectedPTs.has(id));
    setSelectedPTs(prev => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach(id => next.delete(id));
      } else {
        groupIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  function groupCheckState(items) {
    const total = items.length;
    if (total === 0) return 'none';
    const selected = items.filter(c => selectedPTs.has(c.id_pt)).length;
    if (selected === 0) return 'none';
    if (selected === total) return 'all';
    return 'partial';
  }

  // ── Transfer success handler ──────────────────────────────────────────────
  function handleTransferSuccess(result) {
    setIsTransferModalOpen(false);
    setSelectedPTs(new Set());
    setIsSelectionMode(false);
    fetchClientes();
    // Brief toast-style notification via alert (future: replace with toast)
    alert(`✅ ${result.transferidos} PT(s) transferidos para "${result.subestacao_destino}" com sucesso.`);
  }

  // ── Derived KPI stats (reactive to filtered data) ────────────────────────
  const stats = useMemo(() => {
    const total = clientes.length;
    const potenciaTotal = clientes.reduce((acc, c) => acc + Number(c.potencia_kva || 0), 0);
    const operacionais = clientes.filter(c => c.estado_operacional === 'Operacional').length;
    const criticos = clientes.filter(c => c.estado_operacional === 'Crítico').length;
    const manutencao = clientes.filter(c => c.estado_operacional === 'Manutenção').length;
    const foraServico = clientes.filter(c => c.estado_operacional === 'Fora de Serviço').length;
    const municipiosUnicos = new Set(clientes.map(c => c.municipio).filter(Boolean)).size;

    return { total, potenciaTotal, operacionais, criticos, manutencao, foraServico, municipiosUnicos };
  }, [clientes]);

  // ── Grouping by substation ────────────────────────────────────────────────
  const groupedClientes = useMemo(() => {
    const acc = {};

    subestacoes.forEach(s => {
      acc[s.nome] = { items: [], sub: s };
    });

    acc['Subestação Geral (Padrão)'] = acc['Subestação Geral (Padrão)'] || { items: [], sub: null };

    clientes.forEach(cliente => {
      const subName = cliente.subestacao?.nome || 'Subestação Geral (Padrão)';
      if (!acc[subName]) acc[subName] = { items: [], sub: cliente.subestacao || null };
      acc[subName].items.push(cliente);
    });

    return acc;
  }, [clientes, subestacoes]);

  const toggleSub = (subName) => {
    setExpandedSubestacoes(prev => ({ ...prev, [subName]: !prev[subName] }));
  };

  // ── Unique nivel_tensao options ───────────────────────────────────────────
  const uniqueNiveisTensao = useMemo(() => {
    const all = clientes.map(c => c.nivel_tensao).filter(Boolean);
    return [...new Set(all)].sort();
  }, [clientes]);

  const statusColor = (estado) => {
    switch (estado) {
      case 'Operacional': return 'text-green-700 bg-green-50 border-green-100';
      case 'Crítico': return 'text-red-700 bg-red-50 border-red-100';
      case 'Manutenção': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
      case 'Fora de Serviço': return 'text-gray-600 bg-gray-50 border-gray-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: stats.total.toLocaleString(),
      icon: Database,
      color: '#0d3fd1',
      label: hasActiveFilters ? 'Filtrados' : 'Registados',
    },
    {
      title: 'Potência Instalada',
      value: `${(stats.potenciaTotal / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} MVA`,
      icon: Zap,
      color: '#fb923c',
      label: hasActiveFilters ? 'Filtrado' : 'Total kVA',
    },
    {
      title: 'Operacionais',
      value: stats.operacionais,
      icon: CheckCircle2,
      color: '#00e47c',
      label: `${stats.total > 0 ? Math.round((stats.operacionais / stats.total) * 100) : 0}% do total`,
    },
    {
      title: 'Críticos / Manutenção',
      value: stats.criticos + stats.manutencao,
      icon: AlertTriangle,
      color: '#f59e0b',
      label: `${stats.foraServico} Fora de Serviço`,
    },
    {
      title: 'Subestações Abrangidas',
      value: stats.municipiosUnicos,
      icon: MapPin,
      color: '#8b5cf6',
      label: 'Locais únicos',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Database className="w-6 h-6 text-[#0d3fd1]" />
            <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Gestão de Clientes e Postos de Transformação</h2>
          </div>
          <p className="text-sm text-[#747686] font-medium uppercase tracking-wider opacity-60">Inventário de Ativos MT/BT e Clientes Finais</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Selection mode toggle */}
          <button
            onClick={toggleSelectionMode}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-sm active:scale-95 uppercase border-2 ${isSelectionMode
              ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
              : 'bg-white border-[#c4c5d7]/40 text-[#0f1c2c] hover:bg-[#eff4ff] hover:border-[#0d3fd1]'
              }`}
          >
            <SquareDashedMousePointer className={`w-4 h-4 ${isSelectionMode ? 'text-white' : 'text-[#0d3fd1]'}`} />
            {isSelectionMode ? 'Cancelar Selecção' : 'Seleccionar PTs'}
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border-2 border-[#0d3fd1] text-[#0d3fd1] px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all shadow-sm active:scale-95 uppercase"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Importar Clientes / PTs
          </button>
          <button
            onClick={() => navigate('/subestacoes')}
            className="flex items-center gap-2 bg-[#f8faff] border border-[#c4c5d7]/30 text-[#0f1c2c] px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all active:scale-95 uppercase"
          >
            <Building2 className="w-5 h-5 opacity-40" />
            Ver Subestações
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => (
          <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border ${hasActiveFilters ? 'border-[#0d3fd1]/20' : 'border-[#c4c5d7]/10'} group hover:shadow-lg transition-all relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
            {hasActiveFilters && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc]" />}
            <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[60px] -mr-4 -mt-4 transition-colors" style={{ backgroundColor: `${card.color}10` }} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${card.color}15` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <ArrowUpRight className="text-[#c4c5d7] w-3.5 h-3.5 group-hover:text-[#0d3fd1] transition-colors" />
              </div>
              <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">{card.title}</p>
              <p className="text-xl font-black text-[#0f1c2c] tracking-tighter">{card.value}</p>
              <p className={`text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded uppercase tracking-tighter inline-block ${hasActiveFilters ? 'text-[#0d3fd1] bg-[#eff4ff]' : 'text-[#005229] bg-[#e8fff4]'}`}>
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm px-6 py-4">
        <div className="flex items-start gap-3">

          {/* ESQUERDA */}
          <div className="flex items-center gap-2 text-[10px] font-black text-[#747686] uppercase tracking-widest mt-5">
            <Filter className="w-3.5 h-3.5 text-[#0d3fd1]" />
            Filtros
          </div>

          {/* Search */}
          <div className="flex flex-col gap-0.5 flex-grow max-w-xs">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Pesquisa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contrato, proprietário, equipamento..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-[#0f1c2c] outline-none"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#747686]" />
            </div>
          </div>

          {/* DIREITA */}
          <div className="ml-auto flex flex-wrap items-end gap-4">

            {/* Município */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Município</label>
              <select
                value={filters.municipio}
                onChange={e => handleFilterChange('municipio', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[150px]"
              >
                <option value="">Todos Municípios</option>
                {(metadata.municipios || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Operacional</label>
              <select
                value={filters.estado_operacional}
                onChange={e => handleFilterChange('estado_operacional', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[150px]"
              >
                <option value="">Todos os Estados</option>
                <option value="Operacional">Operacional</option>
                <option value="Crítico">Crítico</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Fora de Serviço">Fora de Serviço</option>
              </select>
            </div>

            {/* Nível */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Tensão</label>
              <select
                value={filters.nivel_tensao}
                onChange={e => handleFilterChange('nivel_tensao', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[130px]"
              >
                <option value="">Todos</option>
                <option value="MT">MT</option>
                <option value="BT">BT</option>
                <option value="MT/BT">MT/BT</option>
              </select>
            </div>

            {/* BADGES + CLEAR */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap ml-2">
                {activeFilters.municipio && (
                  <span className="flex items-center gap-1 bg-[#eff4ff] text-[#0d3fd1] text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-[#0d3fd1]/10">
                    <MapPin className="w-3 h-3" /> {activeFilters.municipio}
                  </span>
                )}
                {activeFilters.estado_operacional && (
                  <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor(activeFilters.estado_operacional)}`}>
                    <Activity className="w-3 h-3" /> {activeFilters.estado_operacional}
                  </span>
                )}
                {activeFilters.nivel_tensao && (
                  <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-purple-100">
                    <Zap className="w-3 h-3" /> {activeFilters.nivel_tensao}
                  </span>
                )}
                {activeFilters.search && (
                  <span className="flex items-center gap-1 bg-gray-50 text-gray-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-gray-100">
                    <Search className="w-3 h-3" /> "{activeFilters.search}"
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-100 transition-all active:scale-95"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="w-3 h-3 rounded-full border-2 border-[#0d3fd1] border-t-transparent animate-spin" />
            )}

          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-10 h-10 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-[0.2em]">Sincronizando Base de Clientes...</p>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#243141] text-white">
                {/* Checkbox header cell (visible in selection mode) */}
                {isSelectionMode && (
                  <th className="px-4 py-5 text-center w-12">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Sel.</span>
                  </th>
                )}
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Identificação / Código</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Nome / Proprietário</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Conta / Contrato</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Instalação / Equip.</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Potência</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Divisão / Tipo</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-right">Dívida (Kz)</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Localização</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {Object.entries(groupedClientes).map(([subName, { items }]) => {
                const checkState = groupCheckState(items);
                return (
                  <React.Fragment key={subName}>
                    {/* ── Group header row ─── */}
                    <tr
                      onClick={() => !isSelectionMode && toggleSub(subName)}
                      className={`bg-[#eff4ff]/50 border-y border-[#c4c5d7]/10 transition-colors ${isSelectionMode && items.length > 0 ? 'cursor-pointer hover:bg-[#eff4ff]' : 'cursor-pointer hover:bg-[#eff4ff]'}`}
                    >
                      {/* Group checkbox cell */}
                      {isSelectionMode && (
                        <td className="px-4 py-3 text-center">
                          {items.length > 0 && (
                            <button
                              onClick={e => { e.stopPropagation(); toggleGroup(items); }}
                              className="text-[#0d3fd1] hover:scale-110 transition-transform"
                              title={checkState === 'all' ? 'Desseleccionar grupo' : 'Seleccionar grupo'}
                            >
                              {checkState === 'all'
                                ? <CheckSquare className="w-4 h-4" />
                                : checkState === 'partial'
                                  ? <MinusSquare className="w-4 h-4 text-amber-500" />
                                  : <Square className="w-4 h-4 text-[#c4c5d7]" />
                              }
                            </button>
                          )}
                        </td>
                      )}
                      <td
                        colSpan={10}
                        className="px-6 py-3 font-black uppercase tracking-widest text-[#0d3fd1] text-[10px]"
                      >
                        <div className="flex items-center gap-2">
                          {!expandedSubestacoes[subName]
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                          }
                          <Building2 className="w-3.5 h-3.5 opacity-40" />
                          {subName}
                          <span className="text-[#0d3fd1] text-[9px] ml-2 font-bold bg-[#d1dffe] px-2 py-0.5 rounded-md">{items.length} clientes</span>
                          {isSelectionMode && checkState !== 'none' && (
                            <span className="text-amber-600 text-[9px] font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                              {items.filter(c => selectedPTs.has(c.id_pt)).length} selec.
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Client rows ─── */}
                    {!expandedSubestacoes[subName] && items.map((cliente) => {
                      const isSelected = selectedPTs.has(cliente.id_pt);
                      return (
                        <tr
                          key={cliente.id}
                          onClick={() => isSelectionMode && togglePT(cliente.id_pt)}
                          className={`transition-colors group text-[#0f1c2c] text-[11px] ${isSelectionMode
                            ? isSelected
                              ? 'bg-[#eff4ff] border-l-4 border-[#0d3fd1] cursor-pointer'
                              : 'hover:bg-[#f8faff] cursor-pointer'
                            : 'hover:bg-[#f8faff]'
                            }`}
                        >
                          {/* Checkbox cell */}
                          {isSelectionMode && (
                            <td className="px-4 py-4 text-center" onClick={e => { e.stopPropagation(); togglePT(cliente.id_pt); }}>
                              <button className="text-[#0d3fd1] hover:scale-110 transition-transform">
                                {isSelected
                                  ? <CheckSquare className="w-4 h-4" />
                                  : <Square className="w-4 h-4 text-[#c4c5d7]" />
                                }
                              </button>
                            </td>
                          )}

                          <td className={`px-6 py-4 font-black text-[#0d3fd1] border-l-[3px] transition-all ${isSelectionMode && isSelected ? 'border-[#0d3fd1]' : 'border-transparent group-hover:border-[#0d3fd1]'}`}>
                            {cliente.id_pt}
                          </td>
                          <td className="px-6 py-4 font-bold uppercase truncate max-w-[200px]">{cliente.proprietario || 'N/D'}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#747686]">{cliente.conta_contrato || '---'}</td>
                          <td className="px-6 py-4 text-[#444655]">
                            <div className="flex flex-col">
                              <span className="font-bold">{cliente.instalacao || '---'}</span>
                              <span className="text-[9px] opacity-60">Equip: {cliente.equipamento || '---'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-center whitespace-nowrap">
                            {cliente.potencia_kva?.toLocaleString()} <span className="text-[9px] opacity-40">kVA</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-[10px]">{cliente.divisao || 'N/D'}</span>
                              <span className="text-[8px] opacity-60 uppercase">{cliente.tipo_cliente || 'N/D'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor(cliente.estado_operacional)}`}>
                              {cliente.estado_operacional || 'N/D'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`font-black ${Number(cliente.montante_divida) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {Number(cliente.montante_divida || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                              </span>
                              {cliente.num_facturas_atraso > 0 && (
                                <span className="text-[8px] font-bold bg-red-50 text-red-600 px-1 rounded ml-auto">
                                  {cliente.num_facturas_atraso} FACT.
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[#747686]">
                              <MapPin className="w-3 h-3 text-[#0d3fd1]" />
                              <span className="font-black uppercase text-[9px]">{cliente.municipio}</span>
                              {cliente.bairro && <><span className="mx-1 opacity-20">|</span><span className="text-[9px] truncate max-w-[120px]">{cliente.bairro}</span></>}
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`/ficha-tecnica/${cliente.id_pt}`)}
                                className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm"
                                title="Ficha Técnica"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/subestacoes/${cliente.id_subestacao}/clientes/editar/${cliente.id_pt}`)}
                                className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#243141] hover:bg-[#243141] hover:text-white transition-all shadow-sm"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(cliente.id_pt)}
                                className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {clientes.length === 0 && !loading && (
                <tr>
                  <td colSpan={isSelectionMode ? 11 : 10} className="px-6 py-20 text-center text-sm font-bold text-[#747686] uppercase tracking-[0.2em] opacity-30 italic">
                    Nenhum cliente ou posto de transformação encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-[#fcfdff] px-8 py-4 border-t border-[#c4c5d7]/10 flex items-center justify-between">
          <div className="text-[10px] font-bold text-[#747686] uppercase tracking-widest leading-none">
            {hasActiveFilters
              ? <><span className="text-[#0d3fd1]">{clientes.length}</span> resultados filtrados</>
              : <>Mostrando <span className="text-[#0f1c2c]">{clientes.length}</span> registos</>
            }
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-100">{stats.operacionais} Operacionais</span>
            <span className="text-[9px] font-black text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">{stats.criticos} Críticos</span>
            <span className="text-[9px] font-black text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">{stats.manutencao} Manutenção</span>
          </div>
        </div>
      </div>

      {/* ── Floating action bar (shown when items are selected) ────────────── */}
      {isSelectionMode && selectedPTs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-4 bg-[#0f1c2c] rounded-2xl px-6 py-4 shadow-2xl border border-white/5">
            {/* Count badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0d3fd1] flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">
                  {selectedPTs.size} {selectedPTs.size === 1 ? 'PT' : 'PTs'}
                </p>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">seleccionados</p>
              </div>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Transfer button */}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 bg-[#0d3fd1] hover:bg-[#0b35b3] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#0d3fd1]/30"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Mover para Subestação
            </button>

            {/* Deselect all */}
            <button
              onClick={() => setSelectedPTs(new Set())}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => fetchClientes()}
        apiUrl="/clientes/bulk"
        title="Importar Lista de Clientes e PTs"
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        selectedPTs={selectedPTs}
        subestacoes={subestacoes}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
