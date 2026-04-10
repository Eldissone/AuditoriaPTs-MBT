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
  Calendar,
  Filter,
  CreditCard,
  Briefcase,
  Users,
  Settings,
  Hash
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TechnicalSheet() {
  const { user } = useAuth();
  const { id_pt } = useParams();
  const [pt, setPt] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [ordenacaoData, setOrdenacaoData] = useState('desc');
  const [mostrarComObservacao, setMostrarComObservacao] = useState(false);
  const [modoFicha, setModoFicha] = useState(() => localStorage.getItem('@PTAS:technicalsheet:modo') || 'completo');
  const [limiteExecutivo, setLimiteExecutivo] = useState(() => Number(localStorage.getItem('@PTAS:technicalsheet:limiteExecutivo')) || 12);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        if (!id_pt) throw new Error('ID do PT não fornecido');
        const [ptRes, insRes] = await Promise.all([
          api.get(`/clientes/${id_pt}`),
          api.get('/inspecoes', { params: { id_pt } })
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

  useEffect(() => {
    localStorage.setItem('@PTAS:technicalsheet:modo', modoFicha);
  }, [modoFicha]);

  useEffect(() => {
    localStorage.setItem('@PTAS:technicalsheet:limiteExecutivo', String(limiteExecutivo));
  }, [limiteExecutivo]);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clientes/${id_pt}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ficha_Tecnica_${id_pt}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Erro ao gerar o relatório PDF. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalibrate = () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      api.get(`/clientes/${id_pt || 'PT-DEFAULT'}`).then(res => setPt(res.data));
      api.get('/inspecoes', { params: { id_pt: id_pt || 'PT-DEFAULT' } }).then(res => {
        setInspections(res.data);
        setLoading(false);
        alert('Dados recalibrados com sucesso!');
      });
    }, 1000);
  };

  const handleResetPreferencias = () => {
    setModoFicha('completo');
    setLimiteExecutivo(12);
    localStorage.removeItem('@PTAS:technicalsheet:modo');
    localStorage.removeItem('@PTAS:technicalsheet:limiteExecutivo');
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
    const latest = [...inspections].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao))[0];
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
  const emissaoFicha = new Date().toLocaleString('pt-PT');
  const ultimaInspecao = inspections.length > 0
    ? [...inspections].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao))[0]
    : null;

  const historicoFiltrado = [...inspections]
    .filter((audit) => (tipoFiltro ? audit.tipo === tipoFiltro : true))
    .filter((audit) => (mostrarComObservacao ? Boolean(audit.observacoes?.trim()) : true))
    .sort((a, b) =>
      ordenacaoData === 'desc'
        ? new Date(b.data_inspecao) - new Date(a.data_inspecao)
        : new Date(a.data_inspecao) - new Date(b.data_inspecao)
    );
  const historicoParaExibicao = modoFicha === 'executivo' ? historicoFiltrado.slice(0, limiteExecutivo) : historicoFiltrado;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[#747686] font-bold uppercase tracking-widest">
        <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
        Acedendo à Base de Dados Central...
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print-report ${modoFicha === 'executivo' ? 'executive-mode' : ''}`}>
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .print-report { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-table-wrap { border: 1px solid #d1d5db !important; border-radius: 0 !important; box-shadow: none !important; }
          .print-card { border: 1px solid #d1d5db !important; box-shadow: none !important; }
          .print-footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            border-top: 1px solid #d1d5db;
            padding: 6px 12px;
            font-size: 10px;
            color: #4b5563;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            background: #fff;
          }
          .print-page::after {
            content: "Página " counter(page);
          }
          .executive-mode .executive-hide {
            display: none !important;
          }
        }
        @media screen {
          .print-only { display: none !important; }
          .print-footer { display: none !important; }
        }
      `}</style>

      <div className="print-only mb-4 border border-[#d1d5db] p-4">
        <h1 className="text-lg font-black text-[#0f1c2c] uppercase">Ficha Técnica do PT</h1>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
          <p><strong>Emitido em:</strong> {emissaoFicha}</p>
          <p><strong>Utilizador:</strong> {user?.nome || 'Operador'}</p>
          <p><strong>PT:</strong> {pt?.id_pt || id_pt || 'N/A'}</p>
          <p><strong>Subestação:</strong> {pt?.subestacao?.nome || 'N/A'}</p>
          <p><strong>Modo:</strong> {modoFicha === 'executivo' ? 'Executivo (1 página)' : 'Completo'}</p>
          {modoFicha === 'executivo' && <p><strong>Limite:</strong> {limiteExecutivo} linhas</p>}
        </div>
      </div>

      <div className="print-footer">
        <span>MBT Energia - Ficha Técnica Oficial</span>
        <span className="print-page"></span>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/gestao-clientes" className="p-3 bg-white border border-[#c4c5d7]/30 rounded-xl text-[#444655] hover:bg-[#eff4ff] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">{pt?.id_pt || 'ID DESCONHECIDO'}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm ${pt?.estado_operacional === 'Inativo' ? 'bg-red-100 text-red-800' : 'bg-[#5fff9b]/10 text-[#005229]'}`}>
                {pt?.estado_operacional || 'DESCONHECIDO'}
              </span>
            </div>
            <p className="text-sm text-[#747686] font-medium uppercase tracking-tight">{pt?.subestacao?.nome || 'Localização Não Definida'}</p>
          </div>
        </div>
        <div className="flex gap-3 print-hide">
          <button
            onClick={() => setModoFicha((prev) => (prev === 'executivo' ? 'completo' : 'executivo'))}
            className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#444655] px-5 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all uppercase"
          >
            Modo: {modoFicha === 'executivo' ? 'Executivo' : 'Completo'}
          </button>
          <button
            onClick={handleResetPreferencias}
            className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#444655] px-5 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#eff4ff] transition-all uppercase"
          >
            Repor Preferências
          </button>
          {modoFicha === 'executivo' && (
            <select
              value={limiteExecutivo}
              onChange={(e) => setLimiteExecutivo(Number(e.target.value))}
              className="bg-white border border-[#c4c5d7]/30 text-[#444655] px-5 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase"
            >
              <option value={8}>Limite: 8</option>
              <option value={12}>Limite: 12</option>
              <option value={20}>Limite: 20</option>
            </select>
          )}
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
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm print-card">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Especificações da Unidade</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
              {/* --- CLIENTE & CONTRATO --- */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Dono / Proprietário</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter uppercase">{pt?.proprietario || 'N/D'}</p>
                  <p className="text-[10px] text-[#747686] font-bold">Tipo: {pt?.tipo_cliente || 'N/D'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Gestão de Contrato</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter">CONTA: {pt?.conta_contrato || '---'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">Nr: {pt?.contrato || '---'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Hash className="text-[#0d3fd1] w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Parceiro & Série</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter">PARC: {pt?.parceiro_negocios || '---'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">SÉRIE: {pt?.num_serie || '---'}</p>
                </div>
              </div>

              {/* --- TÉCNICO --- */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="text-orange-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Capacidade & Tensão</p>
                  <p className="text-lg font-black text-[#0f1c2c] tracking-tighter">{pt?.potencia_kva || '---'} <span className="text-xs">kVA</span></p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">CLASSE: {pt?.nivel_tensao || '---'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="text-orange-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Ativo Físico</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter">INST: {pt?.instalacao || '---'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">EQUIP: {pt?.equipamento || '---'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="text-orange-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Operação SAP</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter">DIV: {pt?.divisao || 'N/D'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">{pt?.denominacao_divisao || ''}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Filter className="text-orange-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Tarifário & Leitura</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter">{pt?.categoria_tarifa || '---'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">UNID: {pt?.unidade_leitura || '---'}</p>
                </div>
              </div>

              {/* --- LOCALIZAÇÃO --- */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-purple-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Localização Principal</p>
                  <p className="text-sm font-black text-[#0f1c2c] tracking-tighter uppercase">{pt?.municipio || '---'}</p>
                  <p className="text-[10px] text-[#747686] font-bold uppercase">{pt?.distrito_comuna || ''}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-purple-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Endereço Detalhado</p>
                  <p className="text-[11px] font-black text-[#0f1c2c] tracking-tight uppercase">{pt?.rua ? `RUA: ${pt.rua}` : '---'}</p>
                  <p className="text-[9px] text-[#747686] font-bold uppercase">{pt?.bairro || ''} {pt?.bairro_num ? `(Nº ${pt.bairro_num})` : ''}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-purple-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">GEO Referência & Loc.</p>
                  <p className="text-[11px] font-mono font-bold text-[#0f1c2c]">{pt?.gps || 'N/D'}</p>
                  <p className="text-[9px] text-[#747686] font-bold uppercase">LOC NR: {pt?.num_localidade || '---'}</p>
                </div>
              </div>

              {/* --- FINANCEIRO --- */}
              <div className="flex gap-4 bg-red-50/30 p-4 rounded-2xl border border-red-100">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-[0.2em] mb-1">Estado Financeiro</p>
                  <p className="text-lg font-black text-red-600 tracking-tighter">
                    {Number(pt?.montante_divida || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-[10px]">Kz</span>
                  </p>
                  <p className="text-[9px] text-red-500 font-bold uppercase">
                    {pt?.num_facturas_atraso || 0} Facturas em atraso
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-gray-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1">Ano de Instalação</p>
                  <p className="text-lg font-black text-[#0f1c2c] tracking-tighter">{pt?.ano_instalacao || '---'}</p>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm print-card print-table-wrap executive-hide">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#243141] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Histórico de Auditorias</h3>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold text-[#0f1c2c] uppercase"
              >
                <option value="">Todos os tipos</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Corretiva">Corretiva</option>
              </select>
              <select
                value={ordenacaoData}
                onChange={(e) => setOrdenacaoData(e.target.value)}
                className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold text-[#0f1c2c] uppercase"
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
              <label className="md:col-span-2 flex items-center gap-2 px-4 py-3 rounded-xl border border-[#c4c5d7]/20 bg-[#fcfdff] text-[10px] font-black text-[#444655] uppercase tracking-wider">
                <Filter className="w-4 h-4 text-[#0d3fd1]" />
                <input
                  type="checkbox"
                  checked={mostrarComObservacao}
                  onChange={(e) => setMostrarComObservacao(e.target.checked)}
                />
                Mostrar apenas com observações
              </label>
            </div>

            <div className="space-y-4">
              {historicoParaExibicao.length > 0 ? (
                historicoParaExibicao.map((audit) => (
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
                        <p className="text-[10px] text-[#747686] font-medium max-w-[260px] truncate">
                          {audit.observacoes || 'Sem observações registadas'}
                        </p>
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
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-6 shadow-sm grid grid-cols-2 gap-4 print-card">
            <div>
              <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Última inspeção</p>
              <p className="text-sm font-black text-[#0f1c2c]">
                {ultimaInspecao ? new Date(ultimaInspecao.data_inspecao).toLocaleDateString('pt-PT') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Total auditorias</p>
              <p className="text-sm font-black text-[#0f1c2c]">{inspections.length}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Estado operacional atual</p>
              <p className="text-sm font-black text-[#0f1c2c]">{pt?.estado_operacional || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-[#243141] rounded-3xl p-8 shadow-xl relative overflow-hidden text-white print-card">
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

          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-8 shadow-sm print-card executive-hide">
            <h3 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0d3fd1]" />
              Atividade Recente
            </h3>
            <div className="space-y-6">
              {inspections.slice(0, 3).map((audit) => (
                <div key={audit.id} className="relative pl-6 pb-6 last:pb-0 border-l border-[#c4c5d7]/20">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#0d3fd1] ring-4 ring-[#0d3fd1]/10"></div>
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">
                    {new Date(audit.data_inspecao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-bold text-[#0f1c2c] tracking-tight mb-1 uppercase">Auditoria {audit.tipo}</p>
                  <p className="text-[10px] text-[#444655] font-medium leading-relaxed opacity-70">
                    {audit.observacoes || 'Sem observações detalhadas nesta auditoria.'}
                  </p>
                </div>
              ))}
              {inspections.length === 0 && (
                <div className="text-[10px] text-[#747686] font-bold uppercase py-4 opacity-40">Sem atividade registada</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
