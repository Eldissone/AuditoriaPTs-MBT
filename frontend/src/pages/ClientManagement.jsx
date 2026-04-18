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
  Layers,
  CreditCard,
  User,
  Phone,
  TrendingDown,
  ShieldAlert,
  BarChart3,
  Briefcase,
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
      <div className="absolute inset-0 bg-[#0f1c2c]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-[#0d3fd1] to-[#1a56f0] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Transferir PTs</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Mover para nova subestação</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="bg-[#eff4ff] rounded-xl px-4 py-3 flex items-center gap-3 border border-[#0d3fd1]/10">
            <CheckSquare className="w-5 h-5 text-[#0d3fd1] shrink-0" />
            <div>
              <p className="text-[#0d3fd1] font-black text-sm">{total} {total === 1 ? 'PT seleccionado' : 'PTs seleccionados'}</p>
              <p className="text-[#0d3fd1]/60 text-[10px] font-bold uppercase tracking-widest">Serão movidos para a subestação escolhida</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Subestação de Destino</label>
            <select
              value={destinoId}
              onChange={e => { setDestinoId(e.target.value); setError(''); }}
              className="bg-[#f8f9ff] border-2 border-[#c4c5d7]/40 focus:border-[#0d3fd1] rounded-xl px-4 py-3 text-[11px] font-bold text-[#0f1c2c] outline-none transition-colors"
            >
              <option value="">— Escolher subestação —</option>
              {subestacoes.map(s => (<option key={s.id} value={s.id}>{s.nome}</option>))}
            </select>
          </div>
          {destinoNome && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#747686]">
              <div className="flex-1 h-px bg-[#c4c5d7]/30" />
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0d3fd1]" />
              <span className="text-[#0d3fd1] uppercase tracking-wider">{destinoNome}</span>
              <div className="flex-1 h-px bg-[#c4c5d7]/30" />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-[10px] font-bold">{error}</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 rounded-xl border-2 border-[#c4c5d7]/40 text-[10px] font-black uppercase tracking-widest text-[#747686] hover:bg-[#f8f9ff] transition-all active:scale-95">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading || !destinoId} className="flex-1 px-4 py-3 rounded-xl bg-[#0d3fd1] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0934b8] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> A transferir...</>) : (<><ArrowRightLeft className="w-3.5 h-3.5" /> Confirmar</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PT Type Badge ────────────────────────────────────────────────────────────
function PTTypeBadge({ tipo }) {
  const t = (tipo || '').toUpperCase();
  if (t.includes('AERE') || t === 'PTA') return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">PTA</span>;
  if (t.includes('CABIN') || t === 'PTC') return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100">PTC</span>;
  if (t === 'CAL') return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">CAL</span>;
  if (t === 'CAI') return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">CAI</span>;
  return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">{tipo || 'N/D'}</span>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ClientManagement() {
  const [clientes, setClientes] = useState([]);
  const [subestacoes, setSubestacoes] = useState([]);
  const [metadata, setMetadata] = useState({ municipios: [], categorias: [], potencias: [] });
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedSubestacoes, setExpandedSubestacoes] = useState({});

  // ── Main tab (PTs | Clientes) ─────────────────────────────────────────────
  const [mainTab, setMainTab] = useState('pts'); // 'pts' | 'clientes'

  // ── Selection state ───────────────────────────────────────────────────────
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPTs, setSelectedPTs] = useState(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    municipio: '',
    estado_operacional: '',
    nivel_tensao: '',
    id_subestacao: '',
  });

  const [activeFilters, setActiveFilters] = useState({
    search: '',
    municipio: '',
    estado_operacional: '',
    nivel_tensao: '',
    id_subestacao: '',
  });

  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchMetadata(); fetchSubestacoes(); }, []);

  async function fetchMetadata() {
    try {
      const res = await api.get('/subestacoes/metadata');
      setMetadata(res.data);
    } catch (err) { console.error('Erro ao buscar metadados', err); }
  }

  async function fetchSubestacoes() {
    try {
      const res = await api.get('/subestacoes', { params: { all: true } });
      setSubestacoes(res.data.data || res.data);
    } catch (err) { console.error('Erro ao buscar subestações', err); }
  }

  useEffect(() => { fetchClientes(); }, [activeFilters]);

  async function fetchClientes() {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.municipio) params.municipio = activeFilters.municipio;
      if (activeFilters.estado_operacional) params.estado_operacional = activeFilters.estado_operacional;
      if (activeFilters.nivel_tensao) params.nivel_tensao = activeFilters.nivel_tensao;
      if (activeFilters.id_subestacao) params.id_subestacao = activeFilters.id_subestacao;

      const response = await api.get('/clientes', { params });
      let data = response.data.data || response.data;

      if (activeFilters.nivel_tensao) {
        data = data.filter(c => (c.nivel_tensao || '').toLowerCase().includes(activeFilters.nivel_tensao.toLowerCase()));
      }

      setClientes(data);
    } catch (error) {
      console.error('Erro ao buscar clientes', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

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
    const empty = { search: '', municipio: '', estado_operacional: '', nivel_tensao: '', id_subestacao: '' };
    setFilters(empty);
    setActiveFilters(empty);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const hasActiveFilters = !!(activeFilters.search || activeFilters.municipio || activeFilters.estado_operacional || activeFilters.nivel_tensao || activeFilters.id_subestacao);

  async function handleDelete(id_pt) {
    if (window.confirm(`Tem a certeza que deseja eliminar o PT ${id_pt}?`)) {
      try {
        await api.delete(`/clientes/${id_pt}`);
        fetchClientes();
        alert('PT eliminado com sucesso.');
      } catch { alert('Erro ao eliminar PT.'); }
    }
  }

  function toggleSelectionMode() {
    setIsSelectionMode(prev => { if (prev) setSelectedPTs(new Set()); return !prev; });
  }
  function togglePT(id_pt) {
    setSelectedPTs(prev => { const next = new Set(prev); next.has(id_pt) ? next.delete(id_pt) : next.add(id_pt); return next; });
  }
  function toggleGroup(items) {
    const groupIds = items.map(c => c.id_pt);
    const allSelected = groupIds.every(id => selectedPTs.has(id));
    setSelectedPTs(prev => {
      const next = new Set(prev);
      if (allSelected) { groupIds.forEach(id => next.delete(id)); } else { groupIds.forEach(id => next.add(id)); }
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

  function handleTransferSuccess(result) {
    setIsTransferModalOpen(false);
    setSelectedPTs(new Set());
    setIsSelectionMode(false);
    fetchClientes();
    alert(`✅ ${result.transferidos} PT(s) transferidos para "${result.subestacao_destino}" com sucesso.`);
  }

  // ── KPI Stats ─────────────────────────────────────────────────────────────
  const statsPTs = useMemo(() => {
    const total = clientes.length;
    const potenciaTotal = clientes.reduce((acc, c) => acc + Number(c.potencia_kva || 0), 0);
    const operacionais = clientes.filter(c => c.estado_operacional === 'Operacional').length;
    const criticos = clientes.filter(c => c.estado_operacional === 'Crítico').length;
    const manutencao = clientes.filter(c => c.estado_operacional === 'Manutenção').length;
    const foraServico = clientes.filter(c => c.estado_operacional === 'Fora de Serviço').length;
    const municipiosUnicos = new Set(clientes.map(c => c.municipio).filter(Boolean)).size;
    return { total, potenciaTotal, operacionais, criticos, manutencao, foraServico, municipiosUnicos };
  }, [clientes]);

  const statsClientes = useMemo(() => {
    const comProprietario = clientes.filter(c => c.proprietario);
    const totalDivida = clientes.reduce((acc, c) => acc + Number(c.montante_divida || 0), 0);
    const comDivida = clientes.filter(c => Number(c.montante_divida || 0) > 0).length;
    const emAtraso = clientes.filter(c => Number(c.num_facturas_atraso || 0) > 0).length;
    const totalFactAtraso = clientes.reduce((acc, c) => acc + Number(c.num_facturas_atraso || 0), 0);
    return {
      total: comProprietario.length,
      totalDivida,
      comDivida,
      emAtraso,
      totalFactAtraso,
    };
  }, [clientes]);

  // ── Grouping by substation ─────────────────────────────────────────────────
  const groupedClientes = useMemo(() => {
    const acc = {};
    clientes.forEach(cliente => {
      const subName = cliente.subestacao?.nome || 'Subestação Geral (Padrão)';
      if (!acc[subName]) { acc[subName] = { items: [], sub: cliente.subestacao || null }; }
      acc[subName].items.push(cliente);
    });
    const sortedAcc = {};
    Object.keys(acc).sort().forEach(key => { sortedAcc[key] = acc[key]; });
    return sortedAcc;
  }, [clientes]);

  const toggleSub = (subName) => {
    setExpandedSubestacoes(prev => ({ ...prev, [subName]: !prev[subName] }));
  };

  const statusColor = (estado) => {
    switch (estado) {
      case 'Operacional': return 'text-green-700 bg-green-50 border-green-100';
      case 'Crítico': return 'text-red-700 bg-red-50 border-red-100';
      case 'Manutenção': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
      case 'Fora de Serviço': return 'text-gray-600 bg-gray-50 border-gray-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  // ─── Shared filter bar ────────────────────────────────────────────────────
  const FilterBar = () => (
    <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm px-6 py-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-black text-[#747686] uppercase tracking-widest mt-5">
          <Filter className="w-3.5 h-3.5 text-[#0d3fd1]" />
          Filtros
        </div>
        <div className="flex flex-col gap-0.5 flex-grow max-w-xs">
          <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Pesquisa</label>
          <div className="relative">
            <input
              type="text"
              placeholder={mainTab === 'pts' ? "ID PT, instalação, equipamento..." : "Contrato, razão social, parceiro..."}
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-[#0f1c2c] outline-none"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#747686]" />
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Município</label>
            <select value={filters.municipio} onChange={e => handleFilterChange('municipio', e.target.value)} className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[150px]">
              <option value="">Todos Municípios</option>
              {(metadata.municipios || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {mainTab === 'pts' && (
            <>
              <div className="flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Operacional</label>
                <select value={filters.estado_operacional} onChange={e => handleFilterChange('estado_operacional', e.target.value)} className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[150px]">
                  <option value="">Todos os Estados</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Crítico">Crítico</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Fora de Serviço">Fora de Serviço</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Tensão</label>
                <select value={filters.nivel_tensao} onChange={e => handleFilterChange('nivel_tensao', e.target.value)} className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[130px]">
                  <option value="">Todos</option>
                  <option value="MT">MT</option>
                  <option value="BT">BT</option>
                  <option value="MT/BT">MT/BT</option>
                </select>
              </div>
            </>
          )}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Subestação</label>
            <select value={filters.id_subestacao} onChange={e => handleFilterChange('id_subestacao', e.target.value)} className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold min-w-[180px]">
              <option value="">Todas Subestações</option>
              {subestacoes.map(s => (<option key={s.id} value={s.id}>{s.nome}</option>))}
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap ml-2">
              {activeFilters.search && (<span className="flex items-center gap-1 bg-gray-50 text-gray-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-gray-100"><Search className="w-3 h-3" /> "{activeFilters.search}"</span>)}
              {activeFilters.municipio && (<span className="flex items-center gap-1 bg-[#eff4ff] text-[#0d3fd1] text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-[#0d3fd1]/10"><MapPin className="w-3 h-3" /> {activeFilters.municipio}</span>)}
              {activeFilters.estado_operacional && (<span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor(activeFilters.estado_operacional)}`}><Activity className="w-3 h-3" /> {activeFilters.estado_operacional}</span>)}
              {activeFilters.nivel_tensao && (<span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-purple-100"><Zap className="w-3 h-3" /> {activeFilters.nivel_tensao}</span>)}
              {activeFilters.id_subestacao && (<span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-amber-100"><Building2 className="w-3 h-3" /> {subestacoes.find(s => String(s.id) === String(activeFilters.id_subestacao))?.nome || 'Sub.'}</span>)}
              <button onClick={clearFilters} className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-100 transition-all active:scale-95"><X className="w-3 h-3" /> Limpar</button>
            </div>
          )}
          {loading && <div className="w-3 h-3 rounded-full border-2 border-[#0d3fd1] border-t-transparent animate-spin" />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Database className="w-6 h-6 text-[#0d3fd1]" />
            <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Gestão de PTs e Clientes</h2>
          </div>
          <p className="text-sm text-[#747686] font-medium uppercase tracking-wider opacity-60">Cadastro Técnico · Dados Comerciais · Rede MT/BT</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {mainTab === 'pts' && (
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-sm active:scale-95 uppercase border-2 ${isSelectionMode ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600' : 'bg-white border-[#c4c5d7]/40 text-[#0f1c2c] hover:bg-[#eff4ff] hover:border-[#0d3fd1]'}`}
            >
              <SquareDashedMousePointer className={`w-4 h-4 ${isSelectionMode ? 'text-white' : 'text-[#0d3fd1]'}`} />
              {isSelectionMode ? 'Cancelar Selecção' : 'Seleccionar PTs'}
            </button>
          )}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border-2 border-[#0d3fd1] text-[#0d3fd1] px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all shadow-sm active:scale-95 uppercase"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Importar Excel
          </button>
          <button
            onClick={() => navigate('/subestacoes')}
            className="flex items-center gap-2 bg-[#f8faff] border border-[#c4c5d7]/30 text-[#0f1c2c] px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all active:scale-95 uppercase"
          >
            <Building2 className="w-5 h-5 opacity-40" />
            Subestações
          </button>
        </div>
      </div>

      {/* ── Main Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#f1f3f9] p-1 rounded-2xl w-fit">
        <button
          onClick={() => setMainTab('pts')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mainTab === 'pts' ? 'bg-white text-[#0d3fd1] shadow-md shadow-[#0d3fd1]/10' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
        >
          <Layers className="w-4 h-4" />
          Postos de Transformação
          <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${mainTab === 'pts' ? 'bg-[#eff4ff] text-[#0d3fd1]' : 'bg-white/60 text-[#747686]'}`}>{statsPTs.total}</span>
        </button>
        <button
          onClick={() => setMainTab('clientes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mainTab === 'clientes' ? 'bg-white text-[#8b5cf6] shadow-md shadow-purple-500/10' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
        >
          <Users className="w-4 h-4" />
          Clientes
          <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${mainTab === 'clientes' ? 'bg-purple-50 text-purple-700' : 'bg-white/60 text-[#747686]'}`}>{statsClientes.total}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: POSTOS DE TRANSFORMAÇÃO                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'pts' && (
        <>
          {/* KPI Cards PT */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Total de PTs', value: statsPTs.total.toLocaleString(), icon: Database, color: '#0d3fd1', label: hasActiveFilters ? 'Filtrados' : 'Cadastrados' },
              { title: 'Potência Instalada', value: `${(statsPTs.potenciaTotal / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} MVA`, icon: Zap, color: '#fb923c', label: 'Total kVA' },
              { title: 'Operacionais', value: statsPTs.operacionais, icon: CheckCircle2, color: '#00e47c', label: `${statsPTs.total > 0 ? Math.round((statsPTs.operacionais / statsPTs.total) * 100) : 0}% do total` },
              { title: 'Críticos / Manutenção', value: statsPTs.criticos + statsPTs.manutencao, icon: AlertTriangle, color: '#f59e0b', label: `${statsPTs.foraServico} Fora de Serviço` },
              { title: 'Municípios', value: statsPTs.municipiosUnicos, icon: MapPin, color: '#8b5cf6', label: 'Locais únicos' },
            ].map((card, idx) => (
              <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border ${hasActiveFilters ? 'border-[#0d3fd1]/20' : 'border-[#c4c5d7]/10'} group hover:shadow-lg transition-all relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
                {hasActiveFilters && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc]" />}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[60px] -mr-4 -mt-4" style={{ backgroundColor: `${card.color}10` }} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${card.color}15` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <ArrowUpRight className="text-[#c4c5d7] w-3.5 h-3.5 group-hover:text-[#0d3fd1] transition-colors" />
                  </div>
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">{card.title}</p>
                  <p className="text-xl font-black text-[#0f1c2c] tracking-tighter">{card.value}</p>
                  <p className="text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded uppercase tracking-tighter inline-block text-[#005229] bg-[#e8fff4]">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <FilterBar />

          {/* PT Table */}
          <div className="bg-white rounded-[1rem] border border-[#c4c5d7]/20 shadow-sm overflow-hidden relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-[0.2em]">Sincronizando Cadastro Técnico...</p>
              </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#243141] text-white">
                    {isSelectionMode && (<th className="px-4 py-5 text-center w-12"><span className="text-[9px] font-black uppercase tracking-widest text-white/60">Sel.</span></th>)}
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">ID PT / Código</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Tipo de PT</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Instalação / Equipamento</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Potência</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Tensão / Fabricante</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Estado</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Localização</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d7]/10">
                  {Object.entries(groupedClientes).map(([subName, { items }]) => {
                    const checkState = groupCheckState(items);
                    return (
                      <React.Fragment key={subName}>
                        <tr onClick={() => !isSelectionMode && toggleSub(subName)} className="bg-[#eff4ff]/50 border-y border-[#c4c5d7]/10 cursor-pointer hover:bg-[#eff4ff] transition-colors">
                          {isSelectionMode && (
                            <td className="px-4 py-3 text-center">
                              {items.length > 0 && (
                                <button onClick={e => { e.stopPropagation(); toggleGroup(items); }} className="text-[#0d3fd1] hover:scale-110 transition-transform">
                                  {checkState === 'all' ? <CheckSquare className="w-4 h-4" /> : checkState === 'partial' ? <MinusSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-[#c4c5d7]" />}
                                </button>
                              )}
                            </td>
                          )}
                          <td colSpan={8} className="px-6 py-3 font-black uppercase tracking-widest text-[#0d3fd1] text-[10px]">
                            <div className="flex items-center gap-2">
                              {!expandedSubestacoes[subName] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <Building2 className="w-3.5 h-3.5 opacity-40" />
                              {subName}
                              <span className="text-[#0d3fd1] text-[9px] ml-2 font-bold bg-[#d1dffe] px-2 py-0.5 rounded-md">{items.length} PTs</span>
                              {isSelectionMode && checkState !== 'none' && (
                                <span className="text-amber-600 text-[9px] font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                  {items.filter(c => selectedPTs.has(c.id_pt)).length} selec.
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {!expandedSubestacoes[subName] && items.map((cliente) => {
                          const isSelected = selectedPTs.has(cliente.id_pt);
                          return (
                            <tr
                              key={cliente.id}
                              onClick={() => isSelectionMode && togglePT(cliente.id_pt)}
                              className={`transition-colors group text-[#0f1c2c] text-[11px] ${isSelectionMode ? isSelected ? 'bg-[#eff4ff] border-l-4 border-[#0d3fd1] cursor-pointer' : 'hover:bg-[#f8faff] cursor-pointer' : 'hover:bg-[#f8faff]'}`}
                            >
                              {isSelectionMode && (
                                <td className="px-4 py-4 text-center" onClick={e => { e.stopPropagation(); togglePT(cliente.id_pt); }}>
                                  <button className="text-[#0d3fd1] hover:scale-110 transition-transform">
                                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#c4c5d7]" />}
                                  </button>
                                </td>
                              )}
                              <td className={`px-6 py-4 font-black text-[#0d3fd1] border-l-[3px] transition-all ${isSelectionMode && isSelected ? 'border-[#0d3fd1]' : 'border-transparent group-hover:border-[#0d3fd1]'}`}>
                                {cliente.id_pt}
                              </td>
                              <td className="px-6 py-4">
                                <PTTypeBadge tipo={cliente.tipo_instalacao} />
                              </td>
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
                                  <span className="font-bold text-[10px]">{cliente.nivel_tensao || 'N/D'}</span>
                                  <span className="text-[8px] opacity-60 uppercase">{cliente.fabricante || 'Sem fabricante'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor(cliente.estado_operacional)}`}>
                                  {cliente.estado_operacional || 'N/D'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-[#747686]">
                                  <MapPin className="w-3 h-3 text-[#0d3fd1]" />
                                  <span className="font-black uppercase text-[9px]">{cliente.municipio}</span>
                                  {cliente.bairro && <><span className="mx-1 opacity-20">|</span><span className="text-[9px] truncate max-w-[100px]">{cliente.bairro}</span></>}
                                </div>
                              </td>
                              <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => navigate(`/ficha-tecnica/${cliente.id_pt}`)} className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm" title="Ficha Técnica">
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => navigate(`/subestacoes/${cliente.id_subestacao}/clientes/editar/${cliente.id_pt}`)} className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#243141] hover:bg-[#243141] hover:text-white transition-all shadow-sm" title="Editar">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(cliente.id_pt)} className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Eliminar">
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
                      <td colSpan={isSelectionMode ? 10 : 9} className="px-6 py-20 text-center text-sm font-bold text-[#747686] uppercase tracking-[0.2em] opacity-30 italic">
                        Nenhum Posto de Transformação encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-[#fcfdff] px-8 py-4 border-t border-[#c4c5d7]/10 flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#747686] uppercase tracking-widest leading-none">
                {hasActiveFilters ? <><span className="text-[#0d3fd1]">{clientes.length}</span> PTs filtrados</> : <>Mostrando <span className="text-[#0f1c2c]">{clientes.length}</span> PTs cadastrados</>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-100">{statsPTs.operacionais} Operacionais</span>
                <span className="text-[9px] font-black text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">{statsPTs.criticos} Críticos</span>
                <span className="text-[9px] font-black text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">{statsPTs.manutencao} Manutenção</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: CLIENTES (Dados Comerciais)                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'clientes' && (
        <>
          {/* KPI Cards Cliente */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Clientes Cadastrados', value: statsClientes.total.toLocaleString(), icon: Users, color: '#8b5cf6', label: 'Com razão social' },
              { title: 'Dívida Total', value: `${(statsClientes.totalDivida / 1000000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}M Kz`, icon: TrendingDown, color: '#ef4444', label: `${statsClientes.comDivida} com dívida activa` },
              { title: 'Em Atraso', value: statsClientes.emAtraso, icon: ShieldAlert, color: '#f59e0b', label: `${statsClientes.totalFactAtraso} facturas em atraso` },
              { title: 'Categorias Tarifárias', value: new Set(clientes.map(c => c.categoria_tarifa).filter(Boolean)).size, icon: BarChart3, color: '#0d3fd1', label: 'Tipos de tarifa únicos' },
            ].map((card, idx) => (
              <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border border-[#c4c5d7]/10 group hover:shadow-lg transition-all relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[60px] -mr-4 -mt-4" style={{ backgroundColor: `${card.color}10` }} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${card.color}15` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <ArrowUpRight className="text-[#c4c5d7] w-3.5 h-3.5 group-hover:text-purple-500 transition-colors" />
                  </div>
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">{card.title}</p>
                  <p className="text-xl font-black text-[#0f1c2c] tracking-tighter">{card.value}</p>
                  <p className="text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded uppercase tracking-tighter inline-block text-purple-700 bg-purple-50">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <FilterBar />

          {/* Clientes Table */}
          <div className="bg-white rounded-[1rem] border border-[#c4c5d7]/20 shadow-sm overflow-hidden relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.2em]">Carregando Dados Comerciais...</p>
              </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2d1b6e] text-white">
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">PT / Código</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Cliente / Razão Social</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Conta / Contrato</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Tipo Cliente</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Categoria Tarifa</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Divisão</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-right">Dívida (Kz)</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Localização</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d7]/10">
                  {Object.entries(groupedClientes).map(([subName, { items }]) => {
                    // Sómente PTs com dados de cliente (proprietario ou conta_contrato)
                    const clienteItems = items.filter(c => c.proprietario || c.conta_contrato || c.parceiro_negocios);
                    if (clienteItems.length === 0) return null;
                    return (
                      <React.Fragment key={subName}>
                        <tr onClick={() => toggleSub(subName + '_cli')} className="bg-purple-50/50 border-y border-purple-100/50 cursor-pointer hover:bg-purple-50 transition-colors">
                          <td colSpan={9} className="px-6 py-3 font-black uppercase tracking-widest text-purple-700 text-[10px]">
                            <div className="flex items-center gap-2">
                              {!expandedSubestacoes[subName + '_cli'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <Building2 className="w-3.5 h-3.5 opacity-40" />
                              {subName}
                              <span className="text-purple-700 text-[9px] ml-2 font-bold bg-purple-100 px-2 py-0.5 rounded-md">{clienteItems.length} clientes</span>
                            </div>
                          </td>
                        </tr>
                        {!expandedSubestacoes[subName + '_cli'] && clienteItems.map((cliente) => (
                          <tr key={cliente.id} className="transition-colors group text-[#0f1c2c] text-[11px] hover:bg-purple-50/30">
                            <td className="px-6 py-4 font-black text-purple-700 border-l-[3px] border-transparent group-hover:border-purple-400 transition-all">
                              {cliente.id_pt}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                  <User className="w-3.5 h-3.5 text-purple-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black uppercase text-[11px] truncate max-w-[200px]">{cliente.proprietario || 'Sem denominação'}</span>
                                  {cliente.parceiro_negocios && <span className="text-[8px] text-[#747686] truncate">{cliente.parceiro_negocios}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-[#747686]">{cliente.conta_contrato || '---'}</td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#0d3fd1] border border-[#0d3fd1]/10">
                                {cliente.tipo_cliente || 'N/D'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[10px]">{cliente.categoria_tarifa || 'N/D'}</span>
                                <span className="text-[8px] opacity-60">{cliente.txt_categoria_tarifa || ''}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[10px]">{cliente.divisao || 'N/D'}</span>
                                <span className="text-[8px] opacity-60 truncate max-w-[120px]">{cliente.denominacao_divisao || ''}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex flex-col items-end">
                                <span className={`font-black ${Number(cliente.montante_divida) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {Number(cliente.montante_divida || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                                </span>
                                {Number(cliente.num_facturas_atraso) > 0 && (
                                  <span className="text-[8px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md border border-red-100 mt-0.5">
                                    {cliente.num_facturas_atraso} fact. em atraso
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-[#747686]">
                                <MapPin className="w-3 h-3 text-purple-500" />
                                <span className="font-black uppercase text-[9px]">{cliente.municipio}</span>
                                {cliente.bairro && <><span className="mx-1 opacity-20">|</span><span className="text-[9px] truncate max-w-[100px]">{cliente.bairro}</span></>}
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-center gap-2">
                                <button onClick={() => navigate(`/ficha-tecnica/${cliente.id_pt}`)} className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm" title="Ficha Técnica">
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button onClick={() => navigate(`/subestacoes/${cliente.id_subestacao}/clientes/editar/${cliente.id_pt}`)} className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#243141] hover:bg-[#243141] hover:text-white transition-all shadow-sm" title="Editar">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {clientes.filter(c => c.proprietario || c.conta_contrato).length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center text-sm font-bold text-[#747686] uppercase tracking-[0.2em] opacity-30 italic">
                        Nenhum cliente com dados comerciais encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer Clientes */}
            <div className="bg-[#fcfdff] px-8 py-4 border-t border-[#c4c5d7]/10 flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#747686] uppercase tracking-widest leading-none">
                {hasActiveFilters ? <><span className="text-purple-600">{statsClientes.total}</span> clientes filtrados</> : <>Total de <span className="text-[#0f1c2c]">{statsClientes.total}</span> clientes com dados comerciais</>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">{statsClientes.comDivida} Com Dívida</span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{statsClientes.emAtraso} Em Atraso</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Floating Selection Bar ─────────────────────────────────────────── */}
      {isSelectionMode && selectedPTs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-4 bg-[#0f1c2c] rounded-2xl px-6 py-4 shadow-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0d3fd1] flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">{selectedPTs.size} {selectedPTs.size === 1 ? 'PT' : 'PTs'}</p>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">seleccionados</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <button onClick={() => setIsTransferModalOpen(true)} className="flex items-center gap-2 bg-[#0d3fd1] hover:bg-[#0b35b3] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#0d3fd1]/30">
              <ArrowRightLeft className="w-4 h-4" />
              Mover para Subestação
            </button>
            <button onClick={() => setSelectedPTs(new Set())} className="flex items-center gap-1.5 text-white/50 hover:text-white text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
              <X className="w-3.5 h-3.5" /> Limpar
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
