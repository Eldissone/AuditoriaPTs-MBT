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
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function SubstationManagement() {
  const [subestacoes, setSubestacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubestacoes();
  }, []);

  async function fetchSubestacoes() {
    try {
      setLoading(true);
      const response = await api.get('/subestacoes');
      setSubestacoes(response.data);
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
          <p className="text-sm text-[#747686] font-medium uppercase tracking-wider opacity-60">Inventário e controlo de ativos MBT Energia</p>
        </div>
        <Link to="/subestacoes/nova">
          <button className="flex items-center gap-2 bg-[#0d3fd1] text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/20 active:scale-95 uppercase">
            <Plus className="w-5 h-5" />
            Registar Subestação
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#c4c5d7]/10 flex flex-wrap gap-4 items-center justify-between bg-[#fcfdff]">
          <div className="relative group flex-grow max-w-md">
            <input 
              type="text" 
              placeholder="Filtrar por código, nome ou localização..."
              className="w-full bg-[#eff4ff] border-none rounded-xl py-3 pl-12 pr-6 text-xs font-bold text-[#0f1c2c] placeholder:text-[#747686]/60 focus:ring-2 focus:ring-[#0d3fd1]/10 transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747686] w-4.5 h-4.5 group-focus-within:text-[#0d3fd1]" />
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#444655] hover:bg-[#eff4ff] transition-all" onClick={fetchSubestacoes}>
              <ArrowUpDown className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#243141] text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Cód. Identificador</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Nomenclatura</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Localização</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Potência (kVA)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-[#747686] uppercase tracking-widest">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
                      Sincronizando Ativos...
                    </div>
                  </td>
                </tr>
              ) : subestacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-[#747686] uppercase tracking-widest">
                    Nenhuma subestação encontrada.
                  </td>
                </tr>
              ) : subestacoes.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#f8faff] transition-colors group text-[#0f1c2c]">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#243141] rounded-lg shadow-inner">
                        <Zap className="w-4 h-4 text-[#5fff9b]" />
                      </div>
                      <span className="font-mono text-xs font-black tracking-tighter">{sub.codigo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold uppercase tracking-tight">{sub.nome}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[#444655]">
                      <MapPin className="w-4 h-4 opacity-40" />
                      <span className="text-xs font-medium uppercase tracking-tight">{sub.municipio || sub.localizacao}, {sub.provincia}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black tracking-tighter">{sub.potencia_total_kva?.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">KVA</span></span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`
                      flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter
                      ${sub.estado === 'Ativa' ? 'bg-[#005229]/10 text-[#00e47c]' : 'bg-red-500/10 text-red-500'}
                    `}>
                      {sub.estado === 'Ativa' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {sub.estado}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                       <button 
                        onClick={() => navigate(`/subestacoes/${sub.id}/auditoria`)}
                        className="p-2.5 bg-[#eff4ff] border border-[#0d3fd1]/10 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm"
                        title="Auditoria & Relatórios"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/subestacoes/editar/${sub.id}`)}
                        className="p-2.5 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id, sub.codigo)}
                        className="p-2.5 bg-white border border-[#c4c5d7]/30 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
