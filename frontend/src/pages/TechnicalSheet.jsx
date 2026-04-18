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
  Hash,
  Building2,
  Layers,
  Wrench,
  Phone,
  Mail,
  TrendingDown,
  ShieldAlert,
  Radio,
  Gauge,
  Cpu,
  ClipboardList,
  Activity,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── PT Type Badge ───────────────────────────────────────────────────────────
function PTTypeBadge({ tipo }) {
  const t = (tipo || '').toUpperCase();
  if (t.includes('AERE') || t === 'PTA')
    return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">🏗️ PTA — Aéreo</span>;
  if (t.includes('CABIN') || t === 'PTC')
    return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-violet-100 text-violet-700 border border-violet-200">🏢 PTC — Cabinado</span>;
  if (t === 'CAL')
    return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">📦 CAL</span>;
  if (t === 'CAI')
    return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">📦 CAI</span>;
  return <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{tipo || 'N/D'}</span>;
}

// ─── State Badge ─────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    'Operacional': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Crítico': 'bg-red-100 text-red-700 border-red-200',
    'Manutenção': 'bg-amber-100 text-amber-700 border-amber-200',
    'Fora de Serviço': 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const cls = map[estado] || 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${cls}`}>{estado || 'N/D'}</span>;
}

// ─── Info Card ────────────────────────────────────────────────────────────────
function InfoCard({ icon: Icon, iconBg, iconColor, label, primary, secondary, highlight }) {
  return (
    <div className={`flex gap-4 p-4 rounded-2xl border transition-all ${highlight ? 'bg-red-50/40 border-red-100' : 'bg-[#f8faff] border-[#c4c5d7]/20 hover:border-[#0d3fd1]/20'}`}>
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-black tracking-tight uppercase truncate ${highlight ? 'text-red-600' : 'text-[#0f1c2c]'}`}>{primary || '—'}</p>
        {secondary && <p className="text-[10px] text-[#747686] font-bold truncate">{secondary}</p>}
      </div>
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, color = '#0d3fd1' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h3 className="font-black text-[#0f1c2c] text-sm uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-[#c4c5d7]/20" />
    </div>
  );
}

// ─── Medição de Terra ────────────────────────────────────────────────────────
function MedicaoTerra({ label, valor }) {
  const ok = valor !== null && valor !== undefined && valor < 20;
  const nok = valor !== null && valor !== undefined && valor >= 20;
  return (
    <div className="flex items-center justify-between bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3">
      <div>
        <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{label}</p>
        <p className={`text-lg font-black tracking-tighter ${nok ? 'text-red-600' : ok ? 'text-emerald-600' : 'text-[#747686]'}`}>
          {valor != null ? `${valor} Ω` : 'N/D'}
        </p>
      </div>
      {ok && <CheckCircle className="w-5 h-5 text-emerald-500" />}
      {nok && <XCircle className="w-5 h-5 text-red-500" />}
      {valor == null && <AlertCircle className="w-5 h-5 text-[#c4c5d7]" />}
    </div>
  );
}

// ─── Canal Faturação Badge ───────────────────────────────────────────────────
function CanalBadge({ canal }) {
  const map = {
    'Email': { bg: 'bg-blue-50 text-blue-700 border-blue-100', icon: '📧' },
    'SMS': { bg: 'bg-green-50 text-green-700 border-green-100', icon: '📱' },
    'Papel': { bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: '📄' },
    'Portal': { bg: 'bg-purple-50 text-purple-700 border-purple-100', icon: '🖥️' },
  };
  const style = map[canal] || { bg: 'bg-gray-50 text-gray-600 border-gray-100', icon: '❓' };
  return (
    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${style.bg}`}>
      {style.icon} {canal || 'N/D'}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TechnicalSheet() {
  const { user } = useAuth();
  const { id_pt } = useParams();
  const [pt, setPt] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pt'); // 'pt' | 'cliente' | 'historico'
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [ordenacaoData, setOrdenacaoData] = useState('desc');

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

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clientes/${id_pt}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ficha_Tecnica_${id_pt}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao gerar o relatório PDF. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const ultimaInspecao = inspections.length > 0
    ? [...inspections].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao))[0]
    : null;

  const historicoFiltrado = [...inspections]
    .filter(a => tipoFiltro ? a.tipo === tipoFiltro : true)
    .sort((a, b) => ordenacaoData === 'desc'
      ? new Date(b.data_inspecao) - new Date(a.data_inspecao)
      : new Date(a.data_inspecao) - new Date(b.data_inspecao));

  // Days to next revision
  const getDaysRevision = () => {
    if (!ultimaInspecao?.proxima_inspecao) return null;
    const diff = Math.ceil((new Date(ultimaInspecao.proxima_inspecao) - new Date()) / 86400000);
    return diff;
  };
  const daysRevision = getDaysRevision();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-[#747686] font-bold uppercase tracking-widest">
        <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin" />
        A carregar ficha técnica...
      </div>
    );
  }

  if (!pt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="font-black text-[#0f1c2c] uppercase tracking-widest text-sm">PT não encontrado</p>
        <Link to="/gestao-clientes" className="text-[#0d3fd1] font-bold text-xs uppercase hover:underline">← Voltar</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'pt', label: 'Ficha Técnica PT', icon: Cpu, color: '#0d3fd1' },
    { id: 'cliente', label: 'Ficha do Cliente', icon: Users, color: '#8b5cf6' },
    { id: 'historico', label: `Histórico (${inspections.length})`, icon: History, color: '#059669' },
  ];

  return (
    <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-[#0f1c2c] to-[#243141] px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <Link to="/gestao-clientes" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all mt-0.5">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-white text-2xl font-black uppercase tracking-tight">{pt.id_pt}</h2>
                  <EstadoBadge estado={pt.estado_operacional} />
                  <PTTypeBadge tipo={pt.tipo_instalacao} />
                </div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                  {pt.subestacao?.nome || 'Subestação não definida'}
                  {pt.municipio && <><span className="mx-2 opacity-30">·</span>{pt.municipio}</>}
                  {pt.bairro && <><span className="mx-2 opacity-30">·</span>{pt.bairro}</>}
                </p>
                {pt.proprietario && (
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Cliente: {pt.proprietario}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden md:block">
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Potência Instalada</p>
                <p className="text-white font-black text-2xl tracking-tighter">{pt.potencia_kva || '—'} <span className="text-sm text-white/40">kVA</span></p>
              </div>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-[#00e47c]" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#c4c5d7]/10 border-t border-[#c4c5d7]/10">
          {[
            { label: 'Últ. Auditoria', value: ultimaInspecao ? new Date(ultimaInspecao.data_inspecao).toLocaleDateString('pt-PT') : 'Sem registo', sub: ultimaInspecao?.tipo || '—' },
            { label: 'Total Inspeções', value: inspections.length, sub: 'registadas no sistema' },
            { label: 'Próxima Revisão', value: daysRevision != null ? (daysRevision > 0 ? `${daysRevision} dias` : `${Math.abs(daysRevision)}d atraso`) : 'Não agendada', sub: daysRevision != null && daysRevision < 0 ? '⚠️ Em atraso' : '', alert: daysRevision != null && daysRevision < 0 },
            { label: 'Terra Protecção', value: ultimaInspecao?.terra_protecao != null ? `${ultimaInspecao.terra_protecao} Ω` : 'Sem medição', sub: ultimaInspecao?.terra_protecao != null ? (ultimaInspecao.terra_protecao < 20 ? '✅ Dentro do limite' : '❌ Acima de 20Ω') : 'Registar na auditoria', alert: ultimaInspecao?.terra_protecao >= 20 },
          ].map((item, i) => (
            <div key={i} className={`px-6 py-4 ${item.alert ? 'bg-red-50' : ''}`}>
              <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-sm font-black tracking-tight ${item.alert ? 'text-red-600' : 'text-[#0f1c2c]'}`}>{item.value}</p>
              {item.sub && <p className={`text-[9px] font-bold ${item.alert ? 'text-red-400' : 'text-[#747686]'}`}>{item.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#f1f3f9] p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow-md text-[#0f1c2c]' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
            style={activeTab === tab.id ? { color: tab.color } : {}}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: FICHA TÉCNICA DO PT                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pt' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identificação do PT */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Layers} title="Identificação do PT" color="#0d3fd1" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Hash} iconBg="bg-blue-50" iconColor="text-[#0d3fd1]" label="Código / ID do PT" primary={pt.id_pt} secondary={`Instalação: ${pt.instalacao || 'N/D'}`} />
                <InfoCard icon={Layers} iconBg="bg-sky-50" iconColor="text-sky-600" label="Tipo de Posto" primary={pt.tipo_instalacao || 'N/D'} secondary={pt.tipo_instalacao?.includes('PTA') || pt.tipo_instalacao?.toUpperCase() === 'PTA' ? '32 itens de checklist' : '37 itens de checklist + edifício'} />
                <InfoCard icon={Settings} iconBg="bg-orange-50" iconColor="text-orange-600" label="Equipamento / Ativo" primary={pt.equipamento || 'N/D'} secondary={`Num. Série: ${pt.num_serie || 'N/D'}`} />
                <InfoCard icon={Activity} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Estado Operacional" primary={pt.estado_operacional || 'N/D'} secondary={`Ano instalação: ${pt.ano_instalacao || 'N/D'}`} />
              </div>
            </div>

            {/* Dados do Transformador */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Zap} title="Transformador" color="#f97316" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Zap} iconBg="bg-orange-50" iconColor="text-orange-600" label="Potência Instalada" primary={`${pt.potencia_kva || '—'} kVA`} secondary={`Nível de tensão: ${pt.nivel_tensao || 'N/D'}`} />
                <InfoCard icon={Cpu} iconBg="bg-orange-50" iconColor="text-orange-600" label="Fabricante / Marca" primary={pt.fabricante || 'N/D'} secondary={`QGBT: ${pt.tipo_qgbt || 'N/D'}`} />
                <InfoCard icon={FileText} iconBg="bg-gray-50" iconColor="text-gray-500" label="Tipo de Óleo" primary={pt.tipo_oleo || 'N/D'} secondary="Verificar nível em cada auditoria" />
                <InfoCard icon={Gauge} iconBg="bg-gray-50" iconColor="text-gray-500" label="Tipo de Contador" primary={pt.tipo_contador || 'N/D'} secondary={`Leitura: ${pt.unidade_leitura || 'N/D'}`} />
              </div>
            </div>

            {/* Infraestrutura SAP / Rede */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Building2} title="Infraestrutura SAP / Rede" color="#6366f1" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Briefcase} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Divisão Comercial" primary={pt.divisao || 'N/D'} secondary={pt.denominacao_divisao || ''} />
                <InfoCard icon={Radio} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Categoria Tarifária" primary={pt.categoria_tarifa || 'N/D'} secondary={pt.txt_categoria_tarifa || ''} />
                <InfoCard icon={Hash} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Número de Série" primary={pt.num_serie || 'N/D'} secondary={`Parceiro: ${pt.parceiro_negocios || 'N/D'}`} />
                <InfoCard icon={Layers} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Unidade de Leitura" primary={pt.unidade_leitura || 'N/D'} secondary={`Localidade Nº: ${pt.num_localidade || 'N/D'}`} />
              </div>
            </div>

            {/* Medições de Terra — da última auditoria */}
            {ultimaInspecao && (
              <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
                <SectionTitle icon={Shield} title="Medições de Terra — Última Auditoria" color="#059669" />
                <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-4">
                  Auditoria de {new Date(ultimaInspecao.data_inspecao).toLocaleDateString('pt-PT')} · Limite normativo: &lt; 20 Ω
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MedicaoTerra label="Terra de Protecção (TP)" valor={ultimaInspecao.terra_protecao} />
                  <MedicaoTerra label="Terra de Serviço (TS)" valor={ultimaInspecao.terra_servico} />
                </div>
                {ultimaInspecao.medicao_tensao && (
                  <div className="mt-4">
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-3">Medição de Tensão por Fase (V)</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {['UA', 'UB', 'UC', 'UAB', 'UBC', 'UCA'].map(fase => (
                        ultimaInspecao.medicao_tensao[fase] != null && (
                          <div key={fase} className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl p-3 text-center">
                            <p className="text-[8px] font-black text-[#747686] uppercase tracking-widest">{fase}</p>
                            <p className="text-sm font-black text-[#0d3fd1]">{ultimaInspecao.medicao_tensao[fase]}</p>
                            <p className="text-[8px] text-[#747686]">V</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar PT */}
          <div className="space-y-6">
            {/* Localização */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-6 shadow-sm">
              <SectionTitle icon={MapPin} title="Localização" color="#8b5cf6" />
              <div className="space-y-3">
                {[
                  { label: 'Município', value: pt.municipio },
                  { label: 'Distrito / Comuna', value: pt.distrito_comuna },
                  { label: 'Bairro', value: pt.bairro },
                  { label: 'Rua', value: pt.rua },
                  { label: 'GPS', value: pt.gps, mono: true },
                ].map(item => item.value && (
                  <div key={item.label} className="flex justify-between items-baseline gap-2">
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest shrink-0">{item.label}</p>
                    <p className={`text-[11px] font-bold text-[#0f1c2c] text-right ${item.mono ? 'font-mono' : 'uppercase truncate max-w-[160px]'}`}>{item.value}</p>
                  </div>
                ))}
                {pt.gps && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(pt.gps)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 mt-3 text-[10px] font-black text-[#0d3fd1] uppercase hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir no Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Subestação */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-6 shadow-sm">
              <SectionTitle icon={Building2} title="Subestação Associada" color="#0d3fd1" />
              <div className="space-y-2">
                <p className="text-sm font-black text-[#0f1c2c] uppercase">{pt.subestacao?.nome || 'N/D'}</p>
                {pt.subestacao?.municipio && <p className="text-[10px] font-bold text-[#747686] uppercase">{pt.subestacao.municipio}</p>}
                {pt.subestacao?.proprietario && <p className="text-[10px] font-bold text-[#747686]">Proprietário: {pt.subestacao.proprietario}</p>}
              </div>
            </div>

            {/* Estado Crítico */}
            <div className="bg-[#0f1c2c] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              <h3 className="font-black text-white text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Estado de Alerta
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Próxima Revisão</p>
                  <p className={`font-black text-sm ${daysRevision != null && daysRevision < 0 ? 'text-red-400' : daysRevision != null && daysRevision < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {daysRevision != null ? (daysRevision > 0 ? `${daysRevision}d` : `${Math.abs(daysRevision)}d atraso`) : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Terra de Protecção</p>
                  <p className={`font-black text-sm ${ultimaInspecao?.terra_protecao >= 20 ? 'text-red-400' : ultimaInspecao?.terra_protecao != null ? 'text-emerald-400' : 'text-white/30'}`}>
                    {ultimaInspecao?.terra_protecao != null ? `${ultimaInspecao.terra_protecao} Ω` : 'N/D'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Terra de Serviço</p>
                  <p className={`font-black text-sm ${ultimaInspecao?.terra_servico >= 20 ? 'text-red-400' : ultimaInspecao?.terra_servico != null ? 'text-emerald-400' : 'text-white/30'}`}>
                    {ultimaInspecao?.terra_servico != null ? `${ultimaInspecao.terra_servico} Ω` : 'N/D'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Estado</p>
                  <EstadoBadge estado={pt.estado_operacional} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: FICHA DO CLIENTE (Dados Comerciais)                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cliente' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identidade do Cliente */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Users} title="Identidade do Cliente" color="#8b5cf6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={User} iconBg="bg-purple-50" iconColor="text-purple-600" label="Razão Social / Denominação" primary={pt.proprietario || 'Sem denominação'} secondary={`Tipo: ${pt.tipo_cliente || 'N/D'}`} />
                <InfoCard icon={Briefcase} iconBg="bg-purple-50" iconColor="text-purple-600" label="Conta / Contrato" primary={pt.conta_contrato || '—'} secondary={`Nr. Contrato: ${pt.contrato || 'N/D'}`} />
                <InfoCard icon={Hash} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Parceiro de Negócios (SAP)" primary={pt.parceiro_negocios || '—'} secondary="Código interno SAP" />
                <InfoCard icon={Activity} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Categoria Tarifária" primary={pt.categoria_tarifa || 'N/D'} secondary={pt.txt_categoria_tarifa || ''} />
              </div>
            </div>

            {/* Responsáveis do Cliente */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Users} title="Responsáveis do Cliente" color="#8b5cf6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Responsável Financeiro */}
                <div className="bg-[#f8faff] rounded-2xl p-5 border border-[#c4c5d7]/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Responsável Financeiro</p>
                  </div>
                  <p className="text-sm font-black text-[#0f1c2c] uppercase mb-2">{pt.responsavel_financeiro || 'Não registado'}</p>
                  {pt.contacto_resp_financeiro ? (
                    <p className="text-[10px] font-bold text-[#747686] flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {pt.contacto_resp_financeiro}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-[#c4c5d7] italic">Contacto não registado</p>
                  )}
                </div>

                {/* Responsável Técnico do Cliente */}
                <div className="bg-[#f8faff] rounded-2xl p-5 border border-[#c4c5d7]/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Responsável Técnico</p>
                  </div>
                  <p className="text-sm font-black text-[#0f1c2c] uppercase mb-2">{pt.responsavel_tecnico_cliente || 'Não registado'}</p>
                  {pt.contacto_resp_tecnico ? (
                    <p className="text-[10px] font-bold text-[#747686] flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {pt.contacto_resp_tecnico}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-[#c4c5d7] italic">Contacto não registado</p>
                  )}
                </div>
              </div>

              {/* Canal de Faturação */}
              <div className="mt-5 bg-[#f8faff] rounded-2xl p-5 border border-[#c4c5d7]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">Canal de Receção de Faturas</p>
                    <CanalBadge canal={pt.canal_faturacao} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">Fornece Terceiros?</p>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${pt.fornece_terceiros ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {pt.fornece_terceiros ? '⚠️ Sim — múltiplos clientes' : '✅ Não — exclusivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manutenção do PT pelo Cliente */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-7 shadow-sm">
              <SectionTitle icon={Wrench} title="Manutenção pelo Cliente" color="#f97316" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  icon={Building2}
                  iconBg="bg-orange-50"
                  iconColor="text-orange-600"
                  label="Empresa de Manutenção"
                  primary={pt.empresa_manutencao || 'Não registado'}
                  secondary="Empresa/técnico certificado"
                />
                <InfoCard
                  icon={Calendar}
                  iconBg="bg-orange-50"
                  iconColor="text-orange-600"
                  label="Data da Última Manutenção"
                  primary={pt.data_ultima_manutencao ? new Date(pt.data_ultima_manutencao).toLocaleDateString('pt-PT') : 'Não registado'}
                  secondary="Registado durante auditoria de campo"
                />
              </div>
              {!pt.empresa_manutencao && (
                <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-700">Empresa de manutenção não registada. Recolher esta informação na próxima visita ao PT.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Cliente */}
          <div className="space-y-6">
            {/* Estado Financeiro */}
            <div className={`rounded-3xl p-6 shadow-sm border ${Number(pt.montante_divida) > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${Number(pt.montante_divida) > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <CreditCard className={`w-4 h-4 ${Number(pt.montante_divida) > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${Number(pt.montante_divida) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Estado Financeiro</p>
              </div>
              <p className={`text-3xl font-black tracking-tighter mb-1 ${Number(pt.montante_divida) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Number(pt.montante_divida || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                <span className="text-sm ml-1 font-bold opacity-60">Kz</span>
              </p>
              <p className={`text-[10px] font-bold uppercase ${Number(pt.montante_divida) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {Number(pt.montante_divida) > 0 ? `${pt.num_facturas_atraso || 0} facturas em atraso` : 'Sem dívida registada'}
              </p>
            </div>

            {/* Divisão SAP */}
            <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-6 shadow-sm">
              <SectionTitle icon={Briefcase} title="Dados SAP" color="#6366f1" />
              <div className="space-y-3">
                {[
                  { label: 'Divisão', value: pt.divisao },
                  { label: 'Denominação', value: pt.denominacao_divisao },
                  { label: 'Categoria Tarifa', value: pt.categoria_tarifa },
                  { label: 'Tipo Cliente', value: pt.tipo_cliente },
                  { label: 'Conta Contrato', value: pt.conta_contrato },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-baseline gap-2">
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest shrink-0">{item.label}</p>
                    <p className="text-[11px] font-bold text-[#0f1c2c] text-right uppercase truncate max-w-[160px]">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist de Visita ao Cliente (dados mais recentes de campo) */}
            {ultimaInspecao?.dados_cliente_campo && (
              <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 p-6 shadow-sm">
                <SectionTitle icon={ClipboardList} title="Dados Recolhidos em Campo" color="#059669" />
                <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-3">
                  Auditoria de {new Date(ultimaInspecao.data_inspecao).toLocaleDateString('pt-PT')}
                </p>
                <div className="space-y-2">
                  {Object.entries(ultimaInspecao.dados_cliente_campo).map(([key, val]) => val && (
                    <div key={key} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{key.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] font-bold text-[#0f1c2c]">{String(val)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ABA: HISTÓRICO DE AUDITORIAS                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historico' && (
        <div className="space-y-5">
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm px-6 py-4 flex items-center gap-4 flex-wrap">
            <Filter className="w-4 h-4 text-[#0d3fd1]" />
            <select
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl px-4 py-2.5 text-[11px] font-bold text-[#0f1c2c] uppercase"
            >
              <option value="">Todos os tipos</option>
              <option value="Auditoria PTA">Auditoria PTA</option>
              <option value="Auditoria PTC">Auditoria PTC</option>
              <option value="Inspeção">Inspeção</option>
              <option value="Manutenção Preventiva">Manutenção Preventiva</option>
              <option value="Manutenção Corretiva">Manutenção Corretiva</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Corretiva">Corretiva</option>
            </select>
            <select
              value={ordenacaoData}
              onChange={e => setOrdenacaoData(e.target.value)}
              className="bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl px-4 py-2.5 text-[11px] font-bold text-[#0f1c2c] uppercase"
            >
              <option value="desc">Mais recentes</option>
              <option value="asc">Mais antigas</option>
            </select>
            <p className="ml-auto text-[10px] font-black text-[#747686] uppercase tracking-widest">{historicoFiltrado.length} registos</p>
          </div>

          {/* Timeline */}
          {historicoFiltrado.length > 0 ? (
            <div className="space-y-4">
              {historicoFiltrado.map((audit, i) => {
                const tipoBadgeClass = audit.tipo?.includes('Auditoria') ? 'bg-[#eff4ff] text-[#0d3fd1] border-[#0d3fd1]/20'
                  : audit.tipo?.includes('Manutenção') ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';
                return (
                  <div key={audit.id} className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden hover:border-[#0d3fd1]/20 transition-all">
                    <div className="flex items-start justify-between p-6 gap-4">
                      <div className="flex items-start gap-5">
                        {/* Index */}
                        <div className="w-10 h-10 rounded-xl bg-[#f1f3f9] flex items-center justify-center font-black text-[#747686] text-sm shrink-0">
                          {inspections.length - i}
                        </div>
                        <div>
                          {/* Tipo badge */}
                          <span className={`inline-flex text-[9px] font-black uppercase px-2 py-0.5 rounded-md border mb-2 ${tipoBadgeClass}`}>
                            {audit.tipo || 'N/D'}
                          </span>
                          <p className="text-xs font-black text-[#747686] uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(audit.data_inspecao).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {audit.observacoes && (
                            <p className="text-[11px] text-[#444655] font-medium mt-2 leading-relaxed max-w-prose">{audit.observacoes}</p>
                          )}
                          {/* Medições de terra, se existirem */}
                          {(audit.terra_protecao != null || audit.terra_servico != null) && (
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {audit.terra_protecao != null && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${audit.terra_protecao < 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  TP: {audit.terra_protecao} Ω {audit.terra_protecao < 20 ? '✓' : '✗'}
                                </span>
                              )}
                              {audit.terra_servico != null && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${audit.terra_servico < 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  TS: {audit.terra_servico} Ω {audit.terra_servico < 20 ? '✓' : '✗'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-[10px] font-bold text-[#747686]">{audit.auditor?.nome || 'Sistema'}</p>
                        {audit.resultado && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${audit.resultado === 'Conforme' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : audit.resultado === 'Não Conforme' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {audit.resultado}
                          </span>
                        )}
                        {audit.proxima_inspecao && (
                          <p className="text-[9px] text-[#747686] font-bold">
                            Próx: {new Date(audit.proxima_inspecao).toLocaleDateString('pt-PT')}
                          </p>
                        )}
                        {audit.nivel_urgencia && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${audit.nivel_urgencia === 'urgente' ? 'bg-red-50 text-red-700 border-red-100' : audit.nivel_urgencia === 'alta' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            {audit.nivel_urgencia}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Fotos count se existirem */}
                    {Array.isArray(audit.fotos) && audit.fotos.length > 0 && (
                      <div className="border-t border-[#c4c5d7]/10 px-6 py-3 flex items-center gap-2 bg-[#f8faff]">
                        <FileText className="w-3.5 h-3.5 text-[#0d3fd1]" />
                        <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">{audit.fotos.length} evidências fotográficas registadas</p>
                        <ChevronRight className="w-3.5 h-3.5 text-[#c4c5d7] ml-auto" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm py-20 flex flex-col items-center justify-center gap-3">
              <History className="w-10 h-10 text-[#c4c5d7]" />
              <p className="font-black text-[#747686] uppercase tracking-widest text-sm opacity-50">Sem histórico de auditorias</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
