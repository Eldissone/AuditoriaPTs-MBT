import React, { useEffect, useState } from 'react';
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
  const [allSubestacoes, setAllSubestacoes] = useState([]); // Permite popular filtros mesmo com resultados vazios
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const navigate = useNavigate();
 
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSubestacoes();
    }, 500);
 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, municipio, estado]);

  async function fetchSubestacoes() {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (municipio) params.municipio = municipio;
      if (estado) params.estado = estado;
      
      const response = await api.get('/subestacoes', { params });
      setSubestacoes(response.data);
      
      // Popular allSubestacoes apenas na primeira carga para manter filtros persistentes
      if (allSubestacoes.length === 0 && !searchTerm && !municipio && !estado) {
        setAllSubestacoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar subestações', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, codigo) {
    if (window.confirm(`Tem a certeza que deseja eliminar a subestação ${codigo}?`)) {
      try {
        await api.delete(`/subestacoes/${id}`);
        setSubestacoes(subestacoes.filter(s => s.id !== id));
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

      <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden">
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
              onChange={(e) => setMunicipio(e.target.value)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Todos Municípios</option>
              {[...new Set(allSubestacoes.map(s => s.municipio))].filter(Boolean).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all outline-none"
            >
              <option value="">Todos Estados</option>
              <option value="Ativa">Ativa</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Inativa">Inativa</option>
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setMunicipio(''); setEstado(''); }}
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
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Conta Contrato</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Proprietário / Subestação</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Instalação</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Equipamento</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Parceiro Negócios</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Cat. Tarifa</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Tipo Tarifa</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap text-center">Potência</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Município</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Distrito/Comuna</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest border-r border-white/5 whitespace-nowrap">Bairro</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-center sticky right-0 bg-[#243141] z-10">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-sm font-bold text-[#747686] uppercase tracking-widest">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
                      Sincronizando Ativos...
                    </div>
                  </td>
                </tr>
              ) : subestacoes.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-sm font-bold text-[#747686] uppercase tracking-widest">
                    Nenhuma subestação encontrada.
                  </td>
                </tr>
              ) : subestacoes.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#f8faff] transition-colors group text-[#0f1c2c] text-[11px]">
                  <td className="px-5 py-4 font-mono font-black text-[#0d3fd1]">{sub.conta_contrato || '---'}</td>
                  <td className="px-5 py-4 font-bold uppercase">{sub.nome}</td>
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
                  <td className="px-5 py-4 font-bold text-[#0d3fd1]">{sub.municipio || '---'}</td>
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

        <div className="p-6 bg-[#fcfdff] border-t border-[#c4c5d7]/10 flex justify-between items-center text-[10px] font-bold text-[#747686] uppercase tracking-[0.2em]">
          <span>Total de Ativos: {subestacoes.length}</span>
          <div className="flex gap-4">
            <button className="opacity-40 cursor-not-allowed">Anterior</button>
            <div className="flex gap-1 text-[#0f1c2c]">
              <span className="w-6 h-6 flex items-center justify-center bg-[#0d3fd1] text-white rounded">1</span>
            </div>
            <button className="opacity-40 cursor-not-allowed">Próximo</button>
          </div>
        </div>
      </div>

      <ExcelImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={fetchSubestacoes}
      />
    </div>
  );
}
