import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Zap,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Database,
  Building2,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import ExcelImportModal from '../components/ExcelImportModal';

export default function ClientManagement() {
  const [clientes, setClientes] = useState([]);
  const [metadata, setMetadata] = useState({ municipios: [], categorias: [], potencias: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedSubestacoes, setExpandedSubestacoes] = useState({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 50; // Smaller limit for better performance in the list

  const navigate = useNavigate();
  
  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientes();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, municipio, currentPage]);

  async function fetchClientes() {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        municipio,
        page: currentPage,
        limit
      };
      
      const response = await api.get('/clientes', { params });
      
      if (response.data.data) {
        setClientes(response.data.data);
        setTotalPages(Math.ceil(response.data.total / limit));
        setTotalRecords(response.data.total);
      } else {
        setClientes(response.data);
        setTotalPages(1);
        setTotalRecords(response.data.length);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetadata() {
    try {
      const res = await api.get('/subestacoes/metadata');
      setMetadata(res.data);
    } catch (err) {
      console.error('Erro ao buscar metadados', err);
    }
  }

  async function handleDelete(id_pt) {
    if (window.confirm(`Tem a certeza que deseja eliminar o cliente ${id_pt}?`)) {
      try {
        await api.delete(`/clientes/${id_pt}`);
        fetchClientes();
        alert('Cliente eliminado com sucesso.');
      } catch (error) {
        alert('Erro ao eliminar cliente.');
      }
    }
  }

  // Grupar Clientes por Subestação para melhor visualização
  const groupedClientes = clientes.reduce((acc, cliente) => {
    const subName = cliente.subestacao?.nome || 'Subestação Geral (Padrão)';
    if (!acc[subName]) acc[subName] = [];
    acc[subName].push(cliente);
    return acc;
  }, {});

  const toggleSub = (subName) => {
    setExpandedSubestacoes(prev => ({ ...prev, [subName]: !prev[subName] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[1.5rem] p-6 border border-[#c4c5d7]/20 shadow-sm">
          <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-1">Total de Clientes Registados</p>
          <p className="text-2xl font-black text-[#0f1c2c]">{totalRecords}</p>
        </div>
        <div className="bg-white rounded-[1.5rem] p-6 border border-[#c4c5d7]/20 shadow-sm">
          <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-1">Municípios com Clientes</p>
          <p className="text-2xl font-black text-[#0d3fd1]">{metadata.municipios?.length || 0}</p>
        </div>
        <div className="bg-white rounded-[1.5rem] p-6 border border-[#c4c5d7]/20 shadow-sm">
          <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-1">Nível de Tensão Predominante</p>
          <p className="text-2xl font-black text-[#00e47c]">MT / BT</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-sm overflow-hidden relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-10 h-10 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-[0.2em]">Sincronizando Base de Clientes...</p>
          </div>
        )}

        <div className="p-6 border-b border-[#c4c5d7]/10 flex flex-wrap gap-4 items-center justify-between bg-[#fcfdff]">
          <div className="relative group flex-grow max-w-md">
            <input
              type="text"
              placeholder="Pesquisar por Contrato, Proprietário ou Equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#eff4ff] border-none rounded-xl py-4 pl-12 pr-6 text-xs font-bold text-[#0f1c2c] placeholder:text-[#747686]/60 focus:ring-2 focus:ring-[#0d3fd1]/10 transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747686] w-5 h-5 group-focus-within:text-[#0d3fd1]" />
          </div>
  
          <div className="flex gap-3">
            <select
              value={municipio}
              onChange={(e) => {setMunicipio(e.target.value); setCurrentPage(1);}}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none cursor-pointer"
            >
              <option value="">Todos Municípios</option>
              {(metadata.municipios || []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setMunicipio(''); setCurrentPage(1); }}
              className="flex items-center gap-2 px-6 py-4 bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#747686] hover:bg-[#eff4ff] transition-all"
            >
              <Filter className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#243141] text-white">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Identificação / Código</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Nome Proprietário / Cliente</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Conta Contrato</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Instalação / Equip.</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Potência (kVA)</th>
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
                    <td colSpan="7" className="px-6 py-3 font-black uppercase tracking-widest text-[#0d3fd1] text-[10px]">
                      <div className="flex items-center gap-2">
                        {expandedSubestacoes[subName] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Building2 className="w-3.5 h-3.5 opacity-40" />
                        {subName}
                        <span className="text-[#0d3fd1] text-[9px] ml-2 font-bold bg-[#d1dffe] px-2 py-0.5 rounded-md">{items.length} clientes vinculados</span>
                      </div>
                    </td>
                  </tr>
                  {!expandedSubestacoes[subName] && items.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-[#f8faff] transition-colors group text-[#0f1c2c] text-[11px]">
                      <td className="px-6 py-5 font-black text-[#0d3fd1] border-l-[3px] border-transparent group-hover:border-[#0d3fd1] transition-all">
                        {cliente.id_pt}
                      </td>
                      <td className="px-6 py-5 font-bold uppercase truncate max-w-[200px]">{cliente.proprietario || 'N/D'}</td>
                      <td className="px-6 py-5 font-mono font-bold text-[#747686]">{cliente.conta_contrato || '---'}</td>
                      <td className="px-6 py-5 text-[#444655]">
                        <div className="flex flex-col">
                          <span className="font-bold">{cliente.instalacao || '---'}</span>
                          <span className="text-[9px] opacity-60">Equip: {cliente.equipamento || '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black">
                        {cliente.potencia_kva?.toLocaleString()} <span className="text-[9px] opacity-40">kVA</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1 text-[#747686]">
                          <MapPin className="w-3 h-3 text-[#0d3fd1]" />
                          <span className="font-medium uppercase">{cliente.municipio}</span>
                          <span className="mx-1 opacity-20">|</span>
                          <span className="text-[9px] truncate max-w-[120px]">{cliente.bairro || 'Geral'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
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
                  <td colSpan="7" className="px-6 py-20 text-center text-sm font-bold text-[#747686] uppercase tracking-[0.2em] opacity-30 italic">
                    Nenhum cliente ou posto de transformação registado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="bg-[#fcfdff] px-8 py-4 border-t border-[#c4c5d7]/10 flex items-center justify-between">
          <div className="text-[10px] font-bold text-[#747686] uppercase tracking-widest leading-none">
            Mostrando <span className="text-[#0f1c2c]">{clientes.length}</span> de <span className="text-[#0f1c2c]">{totalRecords}</span> registos
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-[#c4c5d7] cursor-not-allowed' : 'text-[#0d3fd1] hover:bg-[#eff4ff]'}`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex gap-1 overflow-x-auto max-w-[200px] custom-scrollbar px-2">
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
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ExcelImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={() => {
          fetchClientes();
        }}
        apiUrl="/clientes/bulk"
        title="Importar Lista de Clientes e PTs"
      />
    </div>
  );
}
