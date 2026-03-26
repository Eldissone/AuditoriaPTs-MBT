import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  MapPin,
  Shield,
  History,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../services/api';

export default function TechnicalSheet() {
  const { id_pt } = useParams();
  const [pt, setPt] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ptRes, insRes] = await Promise.all([
          api.get(`/pts/${id_pt || 'PT-DEFAULT'}`),
          api.get('/inspecoes', { params: { id_pt: id_pt || 'PT-DEFAULT' } })
        ]);
        setPt(ptRes.data);
        setInspections(insRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados da ficha técnica:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id_pt]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleRecalibrate = () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      api.get(`/pts/${id_pt || 'PT-DEFAULT'}`).then(res => setPt(res.data));
      api.get('/inspecoes', { params: { id_pt: id_pt || 'PT-DEFAULT' } }).then(res => {
        setInspections(res.data);
        setLoading(false);
        alert('Dados recalibrados com sucesso!');
      });
    }, 1000);
  };

  // Calculate days until next revision from the most recent inspection
  const getDaysUntilRevision = () => {
    if (!inspections || inspections.length === 0) return 'N/A';
    const latest = [...inspections].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao))[0];
    if (!latest.proxima_inspecao) return 'Agende agora';

    const nextDate = new Date(latest.proxima_inspecao);
    const today = new Date();
    const diff = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    return diff > 0 ? `${diff} dias restantes` : `${Math.abs(diff)} dias em atraso`;
  };

  const getThermalPerformance = () => {
    if (!pt) return 0;
    // Map status to a base percentage
    let base = 90;
    if (pt.estado === 'Sob Carga') base = 75;
    if (pt.estado === 'Crítico') base = 40;
    
    // Adjust based on if there's an overdue inspection
    const latest = [...inspections].sort((a,b) => new Date(b.data_inspecao) - new Date(a.data_inspecao))[0];
    if (latest && latest.proxima_inspecao) {
      if (new Date(latest.proxima_inspecao) < new Date()) {
        base -= 15;
      }
    }
    
    return Math.max(10, Math.min(100, base));
  };

  const performance = getThermalPerformance();
  const performanceColor = performance > 80 ? '#5fff9b' : performance > 60 ? '#facc15' : '#ff4d4d';
  const performanceStatus = performance > 80 ? 'ESTÁVEL' : performance > 60 ? 'AVISO' : 'CRÍTICO';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[#747686] font-bold uppercase tracking-widest">
        <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
        Acedendo à Base de Dados Central...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/pts" className="p-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[#444655] hover:bg-[#eff4ff] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">{pt?.id_pt || 'ID DESCONHECIDO'}</h2>
              <span className="bg-[#5fff9b]/10 text-[#005229] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm">OPERACIONAL</span>
            </div>
            <p className="text-sm text-[#747686] font-medium uppercase tracking-tight">{pt?.subestacao?.nome || 'Subestação Central Viana'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#243141] text-white px-5 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#0f1c2c] transition-all shadow-lg active:scale-95 uppercase"
          >
            <Download className="w-4 h-4 text-[#5fff9b]" />
            Exportar
          </button>
          <button
            onClick={handleRecalibrate}
            className="flex items-center gap-2 bg-[#0d3fd1] text-white px-5 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/20 active:scale-95 uppercase"
          >
            Atualizar Dados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Especificações da Unidade</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#eff4ff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Capacidade Nominal</p>
                  <p className="text-lg font-black text-[#0f1c2c] tracking-tighter">{pt?.potencia_kva || '630'} kVA</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#eff4ff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Nível de Tensão</p>
                  <p className="text-lg font-black text-[#0f1c2c] tracking-tighter">{pt?.nivel_tensao || '15/0.4'} kV</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#eff4ff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Ano de Instalação</p>
                  <p className="text-lg font-black text-[#0f1c2c] tracking-tighter">{pt?.ano_instalacao || '2018'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#eff4ff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Coordenadas GPS</p>
                  <p className="text-xs font-mono font-bold text-[#0f1c2c] uppercase">{pt?.gps || '-8.9432, 13.2456'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#243141] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Histórico de Auditorias</h3>
            </div>

            <div className="space-y-4">
              {inspections.length > 0 ? (
                inspections.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-6 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-2xl group hover:border-[#0d3fd1]/30 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#c4c5d7]/20 flex items-center justify-center">
                        <FileText className="text-[#747686] w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#0f1c2c] uppercase tracking-tight">Auditoria {audit.tipo}</h4>
                        <p className="text-[10px] text-[#747686] font-bold uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {new Date(audit.data_inspecao).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <CheckCircle2 className="text-[#00e47c] w-3.5 h-3.5" />
                          <span className="text-[9px] font-black text-[#005229] uppercase tracking-tighter">CONFORME</span>
                        </div>
                        <p className="text-[10px] text-[#747686] font-medium">Auditor: {audit.auditor?.nome || 'Sistema'}</p>
                      </div>
                      <button className="p-2.5 bg-white border border-[#c4c5d7]/30 rounded-lg text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[#747686] font-bold uppercase tracking-widest opacity-30 text-xs">
                  Sem histórico de auditorias
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#243141] rounded-3xl p-8 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="font-black text-white text-lg uppercase tracking-tight mb-6">Estado Crítico</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#ff4d4d]/10 rounded-lg flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="text-red-500 w-5 h-5 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Próxima Revisão</p>
                  <p className="text-sm font-black text-[#ff4d4d] tracking-tighter uppercase">{getDaysUntilRevision()}</p>
                </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-[10px] font-bold text-white/60 mb-2 uppercase tracking-wide">Desempenho Térmico</p>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${performance}%`, backgroundColor: performanceColor }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-black" style={{ color: performanceColor }}>{performanceStatus}</span>
                  <span className="text-[10px] font-mono text-white/40">{performance}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm">
            <h3 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0d3fd1]" />
              Atividade Recente
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="relative pl-6 pb-6 last:pb-0 border-l border-[#c4c5d7]/20">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#0d3fd1] ring-4 ring-[#0d3fd1]/10"></div>
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">MAR 1{j}, 2026</p>
                  <p className="text-xs font-bold text-[#0f1c2c] tracking-tight mb-1 uppercase">Atualização de Cadastro</p>
                  <p className="text-[10px] text-[#444655] font-medium leading-relaxed opacity-70">O utilizador Maria Silva atualizou as coordenadas GPS desta unidade via terminal móvel.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
