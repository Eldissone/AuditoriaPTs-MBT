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
  WrenchIcon
} from 'lucide-react';
import api from '../services/api';
import ExcelImportModal from '../components/ExcelImportModal';

export default function ClientManagement() {
  const [clientes, setClientes] = useState([]);
  const [metadata, setMetadata] = useState({ municipios: [], categorias: [], potencias: [] });
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedSubestacoes, setExpandedSubestacoes] = useState({});

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

  // ── Metadata ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMetadata();
  }, []);

  async function fetchMetadata() {
    try {
      const res = await api.get('/subestacoes/metadata');
      setMetadata(res.data);
    } catch (err) {
      console.error('Erro ao buscar metadados', err);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setActiveFilters(updated), 400);
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
  const groupedClientes = useMemo(() =>
    clientes.reduce((acc, cliente) => {
      const subName = cliente.subestacao?.nome || 'Subestação Geral (Padrão)';
      if (!acc[subName]) acc[subName] = [];
      acc[subName].push(cliente);
      return acc;
    }, {}),
    [clientes]
  );

  const toggleSub = (subName) => {
    setExpandedSubestacoes(prev => ({ ...prev, [subName]: !prev[subName] }));
  };

  // ── Unique nivel_tensao options from loaded data ──────────────────────────
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
      title: 'Municípios Abrangidos',
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
        <div className="flex gap-3">
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

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 text-[10px] font-black text-[#747686] uppercase tracking-widest self-center mr-2">
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
                className="w-full bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-[#0f1c2c] outline-none placeholder:text-[#747686]/50 focus:border-[#0d3fd1]/30 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#747686]" />
            </div>
          </div>

          {/* Município */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Município</label>
            <select
              value={filters.municipio}
              onChange={e => handleFilterChange('municipio', e.target.value)}
              className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none focus:border-[#0d3fd1]/30 transition-all min-w-[150px]"
            >
              <option value="">Todos Municípios</option>
              {(metadata.municipios || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Estado Operacional */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Operacional</label>
            <select
              value={filters.estado_operacional}
              onChange={e => handleFilterChange('estado_operacional', e.target.value)}
              className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none focus:border-[#0d3fd1]/30 transition-all min-w-[150px]"
            >
              <option value="">Todos os Estados</option>
              <option value="Operacional">Operacional</option>
              <option value="Crítico">Crítico</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Fora de Serviço">Fora de Serviço</option>
            </select>
          </div>

          {/* Nível de Tensão */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Tensão</label>
            <select
              value={filters.nivel_tensao}
              onChange={e => handleFilterChange('nivel_tensao', e.target.value)}
              className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none focus:border-[#0d3fd1]/30 transition-all min-w-[130px]"
            >
              <option value="">Todos</option>
              <option value="MT">MT</option>
              <option value="BT">BT</option>
              <option value="MT/BT">MT/BT</option>
              {uniqueNiveisTensao.filter(n => !['MT', 'BT', 'MT/BT'].includes(n)).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Clear + Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {activeFilters.municipio && (
                <span className="flex items-center gap-1 bg-[#eff4ff] text-[#0d3fd1] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" /> {activeFilters.municipio}
                </span>
              )}
              {activeFilters.estado_operacional && (
                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${statusColor(activeFilters.estado_operacional)}`}>
                  <Activity className="w-3 h-3" /> {activeFilters.estado_operacional}
                </span>
              )}
              {activeFilters.nivel_tensao && (
                <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-purple-100">
                  <Zap className="w-3 h-3" /> {activeFilters.nivel_tensao}
                </span>
              )}
              {activeFilters.search && (
                <span className="flex items-center gap-1 bg-gray-50 text-gray-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-gray-100">
                  <Search className="w-3 h-3" /> "{activeFilters.search}"
                </span>
              )}
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all border border-red-100"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}

          {loading && (
            <div className="w-3 h-3 rounded-full border-2 border-[#0d3fd1] border-t-transparent animate-spin ml-auto" />
          )}
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
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Identificação / Código</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Nome Proprietário / Cliente</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Conta Contrato</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Instalação / Equip.</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Potência (kVA)</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Localização</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {Object.entries(groupedClientes).map(([subName, items]) => (
                <React.Fragment key={subName}>
                  <tr
                    onClick={() => toggleSub(subName)}
                    className="bg-[#eff4ff]/50 border-y border-[#c4c5d7]/10 cursor-pointer hover:bg-[#eff4ff] transition-colors"
                  >
                    <td colSpan="8" className="px-6 py-3 font-black uppercase tracking-widest text-[#0d3fd1] text-[10px]">
                      <div className="flex items-center gap-2">
                        {expandedSubestacoes[subName] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Building2 className="w-3.5 h-3.5 opacity-40" />
                        {subName}
                        <span className="text-[#0d3fd1] text-[9px] ml-2 font-bold bg-[#d1dffe] px-2 py-0.5 rounded-md">{items.length} clientes</span>
                      </div>
                    </td>
                  </tr>
                  {!expandedSubestacoes[subName] && items.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-[#f8faff] transition-colors group text-[#0f1c2c] text-[11px]">
                      <td className="px-6 py-4 font-black text-[#0d3fd1] border-l-[3px] border-transparent group-hover:border-[#0d3fd1] transition-all">
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
                      <td className="px-6 py-4 font-black">
                        {cliente.potencia_kva?.toLocaleString()} <span className="text-[9px] opacity-40">kVA</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor(cliente.estado_operacional)}`}>
                          {cliente.estado_operacional || 'N/D'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[#747686]">
                          <MapPin className="w-3 h-3 text-[#0d3fd1]" />
                          <span className="font-medium uppercase">{cliente.municipio}</span>
                          {cliente.bairro && <><span className="mx-1 opacity-20">|</span><span className="text-[9px] truncate max-w-[100px]">{cliente.bairro}</span></>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                  ))}
                </React.Fragment>
              ))}
              {clientes.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-sm font-bold text-[#747686] uppercase tracking-[0.2em] opacity-30 italic">
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

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => fetchClientes()}
        apiUrl="/clientes/bulk"
        title="Importar Lista de Clientes e PTs"
      />
    </div>
  );
}
