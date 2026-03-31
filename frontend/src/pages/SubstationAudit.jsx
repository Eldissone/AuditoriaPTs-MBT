import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  FileText,
  ChevronRight,
  BarChart3,
  Activity,
  ArrowLeft,
  Database
} from 'lucide-react';
import api from '../services/api';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

const IndustrialChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 40, right: 30, left: 0, bottom: 0 }}
        barGap={8}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#747686', fontSize: 10, fontWeight: 700 }}
          dy={10}
        />
        <YAxis hide />

        {/* Previous Period Bar */}
        <Bar
          dataKey="anterior"
          fill="#c4c5d7"
          radius={[4, 4, 0, 0]}
          barSize={20}
          opacity={0.4}
          animationDuration={1500}
        />

        {/* Current Period Bar */}
        <Bar
          dataKey="consumo"
          fill="#0d3fd1"
          radius={[6, 6, 0, 0]}
          barSize={32}
          animationBegin={300}
          animationDuration={1200}
          isAnimationActive={true}
        >
          <LabelList
            dataKey="consumo"
            position="top"
            style={{
              fill: '#0f1c2c',
              fontSize: '10px',
              fontWeight: 900,
              fontFamily: 'Inter, sans-serif'
            }}
            formatter={(val) => `${val} kWh`}
            offset={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function SubstationAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subestacao, setSubestacao] = useState(null);
  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPt, setSelectedPt] = useState(null);
  const localidadeFiltro = searchParams.get('localidade') || '';

  // Calculate dynamic data based on current PTs
  const consumptionData = pts.length > 0
    ? pts.slice(0, 6).map(p => ({
      name: p.id_pt,
      consumo: p.potencia_kva,
      anterior: p.potencia_kva * 0.85 // Simulating comparison for now
    }))
    : [];

  const totalPower = pts.reduce((acc, p) => acc + (p.potencia_kva || 0), 0);
  const avgEfficiency = 95; // Industry standard baseline
  const proprietarios = [...new Set(
    pts
      .map((pt) => pt.subestacao?.proprietario || pt.proprietario)
      .filter(Boolean)
  )];

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, ptsRes] = await Promise.all([
          api.get(`/subestacoes/${id}`),
          api.get('/pts', {
            params: localidadeFiltro
              ? { localidade: localidadeFiltro }
              : { id_subestacao: id }
          })
        ]);
        setSubestacao(subRes.data);
        setPts(ptsRes.data || []);
        if (ptsRes.data?.length > 0) setSelectedPt(ptsRes.data[0]);
      } catch (error) {
        console.error('Erro ao buscar dados de auditoria', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, localidadeFiltro]);

  async function handleDeletePt(idPt) {
    if (!idPt) return;
    if (window.confirm(`Tem a certeza que deseja eliminar o PT com ID: ${idPt}?`)) {
      try {
        await api.delete(`/pts/${idPt}`);
        setPts(pts.filter(p => p.id_pt !== idPt));
        if (selectedPt?.id_pt === idPt) setSelectedPt(pts[0] || null);
        alert('PT eliminado com sucesso.');
      } catch (error) {
        alert('Erro ao eliminar PT: ' + (error.response?.data?.error || error.message));
      }
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-[#c4c5d7]/20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/subestacoes')} className="p-2 hover:bg-[#eff4ff] rounded-lg transition-all text-[#444655]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-black text-[#0f1c2c] uppercase tracking-tight">Auditando : {subestacao?.municipio}</h2>
            <p className="text-[10px] font-bold text-[#747686] uppercase tracking-[0.2em]">{subestacao?.codigo} • MBT Energia</p>
          </div>
        </div>

        <div className="flex gap-2">
          {localidadeFiltro && (
            <button
              className="flex items-center gap-2 bg-[#eff4ff] border border-[#0d3fd1]/20 text-[#0d3fd1] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
              onClick={() => navigate(`/subestacoes/${id}/auditoria`)}
            >
              Localidade: {localidadeFiltro}
            </button>
          )}
          <button
            onClick={() => navigate(`/subestacoes/${id}/pts/novo`)}
            className="flex items-center gap-2 bg-[#0d3fd1] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10"
          >
            <Plus className="w-4 h-4" />
            Novo PT
          </button>
          <button
            className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#444655] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all disabled:opacity-30"
            onClick={() => selectedPt && navigate(`/subestacoes/${id}/pts/editar/${selectedPt.id_pt}`)}
            disabled={!selectedPt}
          >
            <Edit2 className="w-4 h-4" />
            Editar PT
          </button>
          <button
            className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-red-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-30"
            onClick={() => selectedPt && handleDeletePt(selectedPt.id_pt)}
            disabled={!selectedPt}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar PT
          </button>
          <button
            className="flex items-center gap-2 bg-[#243141] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#1a2533] transition-all disabled:opacity-30"
            onClick={() => selectedPt && navigate(`/ficha-tecnica/${selectedPt?.id_pt}`)}
            disabled={!selectedPt}
          >
            <FileText className="w-4 h-4" />
            Detalhes PT
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar - PT List */}
        <div className="w-80 flex flex-col bg-white rounded-3xl border border-[#c4c5d7]/20 overflow-hidden shadow-sm">
          <div className="p-4 bg-[#0d3fd1] text-white">
            <h3 className="text-[16px] font-black text-center uppercase tracking-widest">PTS da Substação: {subestacao?.municipio}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {proprietarios.length > 0 && (
              <div className="px-3 py-2 mb-2 bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl">
                <p className="text-[9px] font-black text-[#747686] uppercase tracking-[0.15em] mb-2">
                  Proprietários ({proprietarios.length})
                </p>
                <div className="space-y-1">
                  {proprietarios.map((prop) => (
                    <p key={prop} className="text-[10px] font-bold text-[#0f1c2c] uppercase truncate">
                      {prop}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {pts.length === 0 ? (
              <div className="p-8 text-center text-[10px] font-bold text-[#747686] uppercase opacity-40">
                Nenhum PT registado nesta subestação
              </div>
            ) : pts.map((pt, index) => (
              <button
                key={pt.id_pt}
                onClick={() => setSelectedPt(pt)}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${selectedPt?.id_pt === pt.id_pt ? 'bg-[#eff4ff] border border-[#0d3fd1]/20 shadow-sm' : 'hover:bg-[#f8faff]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-[#0d3fd1] opacity-40">{index + 1} -</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#0f1c2c] tracking-tighter uppercase">{subestacao.proprietario || pt.id_pt}</span>
                    <span className="text-[9px] font-bold text-[#747686]">{pt.localizacao}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedPt?.id_pt === pt.id_pt ? 'text-[#0d3fd1] translate-x-1' : 'text-[#c4c5d7]'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Report Chart */}
        <div className="flex-1 bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f8faff] rounded-lg">
                <BarChart3 className="w-6 h-6 text-[#0d3fd1]" />
              </div>
              <h3 className="text-xl font-black text-[#0f1c2c] uppercase tracking-tight">Potência por PT (Asset Map)</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-[#747686] uppercase tracking-[0.1em]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#0d3fd1] rounded-sm"></div> Ativo Atual (kVA)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#c4c5d7] rounded-sm opacity-60"></div> Referência</div>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <IndustrialChart data={consumptionData} />
          </div>

          <div className="mt-12 pt-8 border-t border-[#c4c5d7]/10 grid grid-cols-3 gap-6">
            <div className="bg-[#fcfdff] p-5 rounded-2xl border border-[#c4c5d7]/10 shadow-inner">
              <span className="text-[10px] font-black text-[#747686] uppercase tracking-widest block mb-1 opacity-60">Potência Total Instalada</span>
              <span className="text-2xl font-black text-[#0f1c2c]">{totalPower.toLocaleString()} <span className="text-xs text-[#0d3fd1] font-bold uppercase ml-1">kVA</span></span>
            </div>
            <div className="bg-[#fcfdff] p-5 rounded-2xl border border-[#c4c5d7]/10 shadow-inner">
              <span className="text-[10px] font-black text-[#747686] uppercase tracking-widest block mb-1 opacity-60">Fator de Operação</span>
              <span className="text-2xl font-black text-[#0f1c2c]">{avgEfficiency}% <span className="text-xs text-[#00e47c] font-bold uppercase ml-1">ESTÁVEL</span></span>
            </div>
            <div className="bg-[#fcfdff] p-5 rounded-2xl border border-[#c4c5d7]/10 shadow-inner">
              <span className="text-[10px] font-black text-[#747686] uppercase tracking-widest block mb-1 opacity-60">Total de PTs</span>
              <span className="text-2xl font-black text-[#0f1c2c]">{pts.length} <span className="text-xs text-[#747686] font-bold uppercase ml-1">UNIDADES</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function History(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
  )
}
