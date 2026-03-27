import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MapPin,
  Zap,
  Edit2,
  Trash2,
  BarChart3,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import ExcelImportModal from '../components/ExcelImportModal';

export default function SubstationManagement() {
  const [subestacoes, setSubestacoes] = useState([]);
  const [metadata, setMetadata] = useState({ municipios: [], categorias: [], potencias: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [potencia, setPotencia] = useState('');
  const [categoriaTarifa, setCategoriaTarifa] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 30;

  const tableRef = useRef(null);
  const navigate = useNavigate();
 
  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSubestacoes();
    }, 500);
 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, municipio, estado, currentPage, potencia, categoriaTarifa]);

  async function fetchSubestacoes() {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        municipio,
        estado,
        potencia,
        categoria_tarifa: categoriaTarifa,
        page: currentPage,
        limit
      };
      const response = await api.get('/subestacoes', { params });
      
      // Handle paginated response structure
      if (response.data.data) {
        setSubestacoes(response.data.data);
        setTotalPages(Math.ceil(response.data.total / limit));
        setTotalRecords(response.data.total);
      } else {
        setSubestacoes(response.data);
        setTotalPages(1); // If no pagination data, assume 1 page
        setTotalRecords(response.data.length);
      }
      
      // Rolar para o topo da tabela após carregar
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Erro ao buscar subestações', error);
      setSubestacoes([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetadata() {
    try {
      const res = await api.get('/subestacoes/metadata');
      setMetadata(res.data);
    } catch (err) {
      console.error('Erro ao buscar metadados dos filtros', err);
    }
  }

  async function handleDelete(id, codigo) {
    if (window.confirm(`Tem a certeza que deseja eliminar a subestação ${codigo}?`)) {
      try {
        await api.delete(`/subestacoes/${id}`);
        // After deletion, re-fetch to update pagination and data
        fetchSubestacoes();
        alert('Subestação eliminada com sucesso.');
      } catch (error) {
        alert('Erro ao eliminar subestação.');
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Gestão de Subestações</h2>
          <p className="text-sm text-[#747686] font-medium uppercase tracking-wider opacity-60">Inventário e controlo de ativos</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border-2 border-[#0d3fd1] text-[#0d3fd1] px-6 py-3 rounded-xl text-xs font-black tracking-widest hover:bg-[#eff4ff] transition-all shadow-sm active:scale-95 uppercase"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Importar Excel
          </button>
          <Link to="/subestacoes/nova">
            <button className="flex items-center gap-2 bg-[#0d3fd1] text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/20 active:scale-95 uppercase">
              <Plus className="w-5 h-5" />
              Registar Subestação
            </button>
          </Link>
        </div>
      </div>

      <div ref={tableRef} className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-[0.2em]">Processando Inventário...</p>
          </div>
        )}
        <div className="p-6 border-b border-[#c4c5d7]/10 flex flex-wrap gap-4 items-center justify-between bg-[#fcfdff]">
          <div className="relative group flex-grow max-w-md">
            <input
              type="text"
              placeholder="Filtrar por código, nome ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#eff4ff] border-none rounded-xl py-3 pl-12 pr-6 text-xs font-bold text-[#0f1c2c] placeholder:text-[#747686]/60 focus:ring-2 focus:ring-[#0d3fd1]/10 transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747686] w-4.5 h-4.5 group-focus-within:text-[#0d3fd1]" />
          </div>
 
          <div className="flex gap-3">
            <select
              value={municipio}
              onChange={(e) => {setMunicipio(e.target.value); setCurrentPage(1);}}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Todos Municípios</option>
              {(metadata.municipios || []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={estado}
              onChange={(e) => {setEstado(e.target.value); setCurrentPage(1);}}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Todos Estados</option>
              <option value="Ativa">Ativa</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Inativa">Inativa</option>
            </select>

            <select
              value={categoriaTarifa}
              onChange={(e) => {setCategoriaTarifa(e.target.value); setCurrentPage(1);}}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Todas Tarifas</option>
              {(metadata.categorias || []).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={potencia}
              onChange={(e) => {setPotencia(e.target.value); setCurrentPage(1);}}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Potência (Todas)</option>
              {(metadata.potencias || []).map(p => (
                <option key={p} value={p}>{p} kVA</option>
              ))}
            </select>

            <button 
              onClick={() => { setSearchTerm(''); setMunicipio(''); setEstado(''); setPotencia(''); setCategoriaTarifa(''); setCurrentPage(1); }}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all"
            >
              <Filter className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-[#243141] text-white">
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Subestação (Município)</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Conta Contrato</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">PT (Proprietário)</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Instalação</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Equipamento</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Parceiro de Negócios</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Cat. Tarifa</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Txt. categoria tarifa</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Potência</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Distrito/Comuna</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Bairro</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-center sticky right-0 bg-[#243141] z-10">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {subestacoes.length === 0 && !loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-sm font-bold text-[#747686] uppercase tracking-widest">
                    Nenhuma subestação encontrada.
                  </td>
                </tr>
              ) : subestacoes.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#f8faff] transition-colors group text-[#0f1c2c] text-[11px]">
                  <td className="px-5 py-4 font-bold text-[#0d3fd1]">{sub.municipio || '---'}</td>
                  <td className="px-5 py-4 font-mono font-black text-[#0d3fd1]">{sub.conta_contrato || '---'}</td>
                  <td className="px-5 py-4 font-bold uppercase">{sub.proprietario || sub.nome}</td>
                  <td className="px-5 py-4 text-[#444655] font-medium">{sub.instalacao || '---'}</td>
                  <td className="px-5 py-4 text-[#444655] font-medium">{sub.equipamento || '---'}</td>
                  <td className="px-5 py-4 text-[#444655] font-medium">{sub.parceiro_negocios || '---'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="bg-[#243141]/5 px-2 py-0.5 rounded text-[9px] font-black text-[#243141]">{sub.categoria_tarifa || '---'}</span>
                  </td>
                  <td className="px-5 py-4 text-[#444655] font-bold uppercase">{sub.txt_categoria_tarifa || '---'}</td>
                  <td className="px-5 py-4 text-center font-black">
                    {sub.potencia_total_kva?.toLocaleString()} <span className="text-[9px] opacity-40">kVA</span>
                  </td>
                  <td className="px-5 py-4 text-[#444655] uppercase">{sub.distrito_comuna || '---'}</td>
                  <td className="px-5 py-4 text-[#444655] uppercase">{sub.bairro || '---'}</td>
                  <td className="px-5 py-4 sticky right-0 bg-white/95 backdrop-blur-sm group-hover:bg-[#f8faff] z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.1)] transition-colors">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/subestacoes/${sub.id}/auditoria`)}
                        className="p-2 bg-[#eff4ff] border border-[#0d3fd1]/10 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm"
                        title="Auditoria & Relatórios"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/subestacoes/editar/${sub.id}`)}
                        className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.codigo)}
                        className="p-2 bg-white border border-[#c4c5d7]/30 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="bg-[#fcfdff] px-8 py-4 border-t border-[#c4c5d7]/10 flex items-center justify-between">
          <div className="text-[10px] font-bold text-[#747686] uppercase tracking-widest leading-none">
            Mostrando <span className="text-[#0f1c2c]">{subestacoes.length}</span> de <span className="text-[#0f1c2c]">{totalRecords}</span> resultados
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-[#c4c5d7] cursor-not-allowed' : 'text-[#0d3fd1] hover:bg-[#eff4ff]'}`}
            >
              <ArrowUpDown className="w-4 h-4 rotate-90" />
            </button>
            <div className="flex gap-1 overflow-x-auto max-w-[200px] custom-scrollbar">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all flex-shrink-0 ${
                    currentPage === i + 1 
                      ? 'bg-[#0d3fd1] text-white shadow-lg shadow-[#0d3fd1]/20' 
                      : 'text-[#747686] hover:bg-[#eff4ff]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-[#c4c5d7] cursor-not-allowed' : 'text-[#0d3fd1] hover:bg-[#eff4ff]'}`}
            >
              <ArrowUpDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      <ExcelImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={() => {
          fetchSubestacoes();
          fetchMetadata();
        }}
      />
    </div>
  );
}
