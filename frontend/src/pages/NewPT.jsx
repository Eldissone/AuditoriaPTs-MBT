import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Info,
  Zap,
  Settings,
  ShieldCheck,
  ArrowRight,
  Database,
  Camera,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  History,
  HardDrive,
  Activity
} from 'lucide-react';
import api from '../services/api';

export default function NewPT() {
  const { subestacaoId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    identificacao: {
      id_pt: '',
      localizacao: '',
      gps: '',
      tipo_instalacao: '',
      nivel_tensao: '',
      potencia_kva: '',
      ano_instalacao: '',
      fabricante: '',
      num_transformador: '',
      regime_exploracao: '',
      imagem_url: '',
      id_subestacao: Number(subestacaoId),
      municipio: '',
      provincia: 'Luanda', // Default as per project scope
      distrito_comuna: '',
      bairro: '',
      conta_contrato: '',
      instalacao: '',
      equipamento: '',
      parceiro_negocios: '',
      categoria_tarifa: '',
      txt_categoria_tarifa: '',
      proprietario: '',
      concessionaria: '',
      zona: '',
      operador: '',
      contrato: '',
      num_serie: '',
      divisao: '',
      denominacao_divisao: '',
      unidade_leitura: '',
      num_localidade: '',
      bairro_num: '',
      rua: '',
      tipo_cliente: '',
      montante_divida: 0,
      num_facturas_atraso: 0,
    },
    conformidade: {
      licenciamento: false,
      projeto_aprovado: false,
      diagramas_unifilares: false,
      plano_manutencao: false,
      normas_iec_ieee: false,
      seguro_responsabilidade: false,
      certificacao_energetica: false,
      termo_responsabilidade: false
    },
    transformador: {
      fabricante: '',
      numero_serie: '',
      ano_fabrico: '',
      potencia_nominal: '',
      tensao_primaria: '',
      tensao_secundaria: '',
      grupo_vectorial: '',
      tipo_oleo: 'Mineral',
      peso_total: '',
      nivel_oleo: '100%',
      temperatura_topo: 40,
      fugas: false,
      estado_buchas: 'Bom'
    },
    seguranca: {
      resistencia_terra: '',
      protecao_raios: false,
      spd: false,
      sinalizacao: false,
      combate_incendio: false,
      distancias_seguranca: false
    },
    manutencao: {
      ultima_limpeza: '',
      aperto_terminais: false,
      inspecao_termografica: ''
    },
    media_tensao: {
      tipo_celas: '',
      estado_disjuntores: '',
      estado_seccionadores: '',
      reles_protecao: '',
      coordenacao_protecoes: false,
      aterramento_mt: false
    },
    baixa_tensao: {
      estado_qgbt: '',
      barramentos: '',
      disjuntores: '',
      balanceamento_cargas: false,
      corrente_fase_a: 0,
      corrente_fase_b: 0,
      corrente_fase_c: 0,
      tensao: 400,
      fator_potencia: 0.95
    },
    infraestrutura: {
      estado_cabine: 'Bom',
      ventilacao: true,
      drenagem: true,
      iluminacao: true,
      controlo_acesso: true
    },
    monitorizacao: {
      scada: false,
      comunicacao: '',
      estado_modem: '',
      protocolo: '',
      sensores_temperatura: false,
      sensores_corrente: false,
      sensores_vibracao: false
    },
    risco: {
      nivel_risco_geral: '',
      sobrecarga: false,
      desequilibrio_fases: false,
      falhas_isolamento: false,
      redundancia: false,
      recomendacoes: ''
    }
  });

  useEffect(() => {
    if (isEdit) {
      async function fetchPT() {
        try {
          const response = await api.get(`/clientes/${id}`);
          const pt = response.data;

          const sanitize = (obj) => {
            if (obj === null) return '';
            if (typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sanitize);
            const newObj = {};
            for (const key in obj) {
              newObj[key] = sanitize(obj[key]);
            }
            return newObj;
          };

          const sPt = sanitize(pt);

          setFormData(prev => ({
            ...prev,
            identificacao: {
              ...prev.identificacao,
              ...sPt,
              id_pt: sPt.id_pt || '', // Ensure id_pt is handled correctly if renamed in response
              ano_instalacao: sPt.ano_instalacao ? new Date(`${sPt.ano_instalacao}-01-01`).toISOString().split('T')[0] : ''
            },
            conformidade: { ...prev.conformidade, ...(sPt.conformidade || {}) },
            transformador: { ...prev.transformador, ...(sPt.transformadores?.[0] || {}) },
            seguranca: { ...prev.seguranca, ...(sPt.seguranca || {}) },
            manutencao: { ...prev.manutencao, ...(sPt.manutencao || {}) },
            media_tensao: { ...prev.media_tensao, ...(sPt.media_tensao || {}) },
            baixa_tensao: { ...prev.baixa_tensao, ...(sPt.baixa_tensao || {}) },
            infraestrutura: { ...prev.infraestrutura, ...(sPt.infraestrutura || {}) },
            monitorizacao: { ...prev.monitorizacao, ...(sPt.monitorizacao || {}) },
            risco: { ...prev.risco, ...(sPt.riscos?.[0] || {}) }
          }));
        } catch (error) {
          alert('Erro ao carregar dados do PT.');
          navigate(-1);
        } finally {
          setLoading(false);
        }
      }
      fetchPT();
    }
  }, [id, isEdit, navigate]);

  const tabs = [
    { id: 1, name: 'Identificação', icon: Info },
    { id: 2, name: 'Conformidade', icon: ClipboardCheck },
    { id: 3, name: 'Transformador', icon: Settings },
    { id: 4, name: 'Média Tensão', icon: Zap },
    { id: 5, name: 'Baixa Tensão', icon: Database },
    { id: 6, name: 'Segurança', icon: ShieldCheck },
    { id: 7, name: 'Infraestrutura', icon: HardDrive },
    { id: 8, name: 'Monitorização', icon: Activity },
    { id: 9, name: 'Manutenção', icon: History },
    { id: 10, name: 'Risco', icon: AlertTriangle }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/clientes/${id}`, formData);
        alert('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clientes', formData);
        alert('Cliente registado com sucesso!');
      }
      navigate(`/subestacoes/${subestacaoId}/auditoria`);
    } catch (err) {
      alert('Erro ao guardar PT');
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-[#c4c5d7]/20 rounded-xl hover:bg-[#eff4ff] transition-all">
            <ArrowLeft className="w-5 h-5 text-[#444655]" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-[#0f1c2c] uppercase tracking-tight">
              {isEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </h2>
          </div>
        </div>
        <button onClick={handleSubmit} className="flex items-center gap-2 bg-[#00e47c] text-[#005229] px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#00c96d] transition-all shadow-lg shadow-[#00e47c]/10">
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-[#243141] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            <div className="p-6 border-b text-center border-white/5 bg-[#1a2533]">
              <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Dados do PT</h3>
            </div>
            <div className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition-all text-left
                    ${activeTab === tab.id
                      ? 'bg-[#0d3fd1] text-white shadow-lg shadow-[#0d3fd1]/20 translate-x-1'
                      : 'text-white/40 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#5fff9b]' : 'opacity-40'}`} />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="flex-grow">
          <div className="bg-white rounded-[1rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden p-8 md:p-12 min-h-[600px] flex flex-col">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#c4c5d7]/10">
              <div className="w-12 h-12 bg-[#eff4ff] rounded-2xl flex items-center justify-center text-[#0d3fd1] shadow-inner">
                {React.createElement(tabs[activeTab - 1].icon, { className: "w-6 h-6" })}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f1c2c] uppercase tracking-tight">{tabs[activeTab - 1].name}</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              {activeTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 animate-in slide-in-from-right-4 duration-300">
                  {/* ID PT */}
                  <div className="lg:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Código do Cliente (PT)</label>
                    <input
                      type="text"
                      className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none"
                      value={formData.identificacao.id_pt}
                      onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, id_pt: e.target.value } })}
                      placeholder="Ex: PT-LUA-001"
                      required
                    />
                  </div>

                  {/* Localização & GPS */}
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Localização (Rua/Bairro)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.localizacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, localizacao: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Município (Obrigatório)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.municipio} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, municipio: e.target.value } })} required />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Distrito / Comuna</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.distrito_comuna} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, distrito_comuna: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Bairro</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.bairro} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, bairro: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Conta de Contrato</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.conta_contrato} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, conta_contrato: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Instalação</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.instalacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, instalacao: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Equipamento</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.equipamento} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, equipamento: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Parceiro de Negócios</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.parceiro_negocios} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, parceiro_negocios: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Categoria de Tarifa</label>
                    <input type="text" placeholder="Ex: AT_TI" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.categoria_tarifa} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, categoria_tarifa: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Extenso Cat. Tarifa</label>
                    <input type="text" placeholder="Ex: Indústria" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.txt_categoria_tarifa} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, txt_categoria_tarifa: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Coordenadas GPS (Lat, Long)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.gps} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, gps: e.target.value } })} placeholder="-8.123, 13.456" />
                  </div>

                  {/* Tipo, Nivel, Potencia */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Instalação</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.tipo_instalacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_instalacao: e.target.value } })} placeholder="Ex: Aérea / Cabine" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Tensão (kV)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.nivel_tensao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, nivel_tensao: e.target.value } })} placeholder="Ex: 30/0.4 kV" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Potência (kVA)</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.potencia_kva} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, potencia_kva: e.target.value } })} />
                  </div>

                  {/* Ano, Fabricante, Num Trans, Regime */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Ano de Instalação</label>
                    <input type="date" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.ano_instalacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, ano_instalacao: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Fabricante do Posto</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.fabricante} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, fabricante: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nº de Transformadores</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.num_transformador} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, num_transformador: e.target.value } })} />
                  </div>
                  <div className="lg:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Regime de Exploração</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.regime_exploracao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, regime_exploracao: e.target.value } })} placeholder="Ex: Privado / Público" />
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Proprietário</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.proprietario} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, proprietario: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Concessionária</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.concessionaria} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, concessionaria: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Zona / Área</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.zona} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, zona: e.target.value } })} />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Operador</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.identificacao.operador} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, operador: e.target.value } })} />
                  </div>

                  {/* BLOCO SAP EXCLUSIVO */}
                  <div className="lg:col-span-3 mt-4 mb-2 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-4 bg-[#0d3fd1] rounded-full"></div>
                      <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Informação Estrutural (SAP/ENDE)</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Nº do Contrato</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.contrato} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, contrato: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Nº de Série</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.num_serie} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, num_serie: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Cliente</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.tipo_cliente} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_cliente: e.target.value } })} placeholder="Ex: MT / BT / IP" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Divisão</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.divisao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, divisao: e.target.value } })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Denominação da Divisão</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.denominacao_divisao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, denominacao_divisao: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Unidade de Leitura</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.unidade_leitura} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, unidade_leitura: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Nº Localidade</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.num_localidade} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, num_localidade: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Rua (Endereço)</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.rua} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, rua: e.target.value } })} />
                      </div>
                    </div>
                  </div>

                  {/* BLOCO FINANCEIRO */}
                  <div className="lg:col-span-3 p-6 bg-red-50/30 rounded-3xl border border-red-100/50">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Informação Financeira</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Montante da Dívida (Kz)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-sm font-black text-red-600 focus:ring-1 focus:ring-red-200"
                          value={formData.identificacao.montante_divida}
                          onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, montante_divida: Number(e.target.value) } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Faturas Não Pagas</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-sm font-black text-red-600"
                          value={formData.identificacao.num_facturas_atraso}
                          onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, num_facturas_atraso: Number(e.target.value) } })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Documentação Fotográfica (Placa/Local)</label>
                    <div className="relative group">
                      <div className="w-full h-48 bg-[#f8faff] border-2 border-dashed border-[#c4c5d7]/40 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all group-hover:border-[#0d3fd1]/40 group-hover:bg-[#f0f4ff] cursor-pointer overflow-hidden">
                        {formData.identificacao.imagem_url ? (
                          <div className="relative w-full h-full">
                            <img src={formData.identificacao.imagem_url} alt="technical" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center bg-[#243141]/60">
                              <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Fotografia</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#0d3fd1]">
                              <Camera className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-[#0f1c2c] uppercase tracking-tight">Carregar Imagem Técnica</p>
                              <p className="text-[9px] font-bold text-[#747686] uppercase tracking-widest mt-1 opacity-60">PNG, JPG ou PDF (Máx 5MB)</p>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) setFormData({ ...formData, identificacao: { ...formData.identificacao, imagem_url: URL.createObjectURL(file) } });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <h4 className="text-xs font-black text-[#0d3fd1] uppercase tracking-[0.2em] mb-6">Conformidade Legal e Técnica (Checklist)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { key: 'licenciamento', label: 'Licença de Exploração DGE' },
                        { key: 'projeto_aprovado', label: 'Projeto Elétrico Aprovado' },
                        { key: 'diagramas_unifilares', label: 'Diagramas Unifilares no Local' },
                        { key: 'plano_manutencao', label: 'Plano de Manutenção Ativo' },
                        { key: 'normas_iec_ieee', label: 'Conformidade Normas IEC/IEEE' },
                        { key: 'seguro_responsabilidade', label: 'Seguro Responsabilidade Civil' },
                        { key: 'certificacao_energetica', label: 'Certificação Energética' },
                        { key: 'termo_responsabilidade', label: 'Termo de Responsabilidade Técnica' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-4 bg-white border border-[#c4c5d7]/10 rounded-xl cursor-pointer hover:border-[#0d3fd1]/30 transition-all group">
                          <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest">{item.label}</span>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1] focus:ring-[#0d3fd1]"
                            checked={formData.conformidade[item.key]}
                            onChange={(e) => setFormData({ ...formData, conformidade: { ...formData.conformidade, [item.key]: e.target.checked } })}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Fabricante Trafo</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.fabricante} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, fabricante: e.target.value } })} placeholder="Ex: Efacec" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nº de Série</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.numero_serie} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, numero_serie: e.target.value } })} placeholder="SN-123456" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Ano de Fabrico</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.ano_fabrico} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, ano_fabrico: e.target.value } })} placeholder="2024" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Potência Nominal (kVA)</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.potencia_nominal} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, potencia_nominal: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão Primária (kV)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.tensao_primaria} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tensao_primaria: e.target.value } })} placeholder="30 kV" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão Secundária (V)</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.tensao_secundaria} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tensao_secundaria: e.target.value } })} placeholder="400 V" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Grupo Vectorial</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.grupo_vectorial} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, grupo_vectorial: e.target.value } })} placeholder="Dyn11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Isolação</label>
                    <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.tipo_oleo} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tipo_oleo: e.target.value } })}>
                      <option value="Mineral">Óleo Mineral</option>
                      <option value="Silicone">Silicone</option>
                      <option value="Seco">Resina (Seco)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Peso Total (kg)</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.peso_total} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, peso_total: e.target.value } })} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Óleo / Pressão</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.nivel_oleo} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, nivel_oleo: e.target.value } })} placeholder="Ex: 95%" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Temperatura de Topo (ºC)</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.transformador.temperatura_topo} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, temperatura_topo: Number(e.target.value) } })} />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-[#fcfdff] rounded-2xl border border-[#c4c5d7]/10">
                    <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest">Fugas / Buchas OK</span>
                    <div className="flex gap-4">
                      <input type="checkbox" className="w-6 h-6 rounded-lg border-[#c4c5d7] text-[#0d3fd1]" checked={formData.transformador.fugas} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, fugas: e.target.checked } })} />
                      <span className="text-[8px] font-bold text-[#747686] uppercase self-center">Fugas</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 6 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 mb-4">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Resistência de Terra (Ohms)</label>
                    <input
                      type="text"
                      className="w-full max-w-sm bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                      value={formData.seguranca.resistencia_terra}
                      onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, resistencia_terra: e.target.value } })}
                      placeholder="Ex: 2.5 Ohms"
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { key: 'protecao_raios', label: 'Proteção contra Raios (IP)' },
                      { key: 'spd', label: 'Descarregadores de Sobretensão (SPD)' },
                      { key: 'sinalizacao', label: 'Sinalização de Segurança' },
                      { key: 'combate_incendio', label: 'Equipamentos Combate Incêndio' },
                      { key: 'distancias_seguranca', label: 'Distâncias de Segurança Verificadas' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-4 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-xl cursor-pointer hover:bg-[#eff4ff] transition-all">
                        <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest">{item.label}</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]"
                          checked={formData.seguranca[item.key]}
                          onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, [item.key]: e.target.checked } })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 9 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Data da Última Limpeza Técnica</label>
                    <input type="date" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.manutencao.ultima_limpeza} onChange={(e) => setFormData({ ...formData, manutencao: { ...formData.manutencao, ultima_limpeza: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Última Inspecção Termográfica</label>
                    <input type="date" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.manutencao.inspecao_termografica} onChange={(e) => setFormData({ ...formData, manutencao: { ...formData.manutencao, inspecao_termografica: e.target.value } })} />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between p-6 bg-[#fcfdff] rounded-2xl border border-[#c4c5d7]/10">
                    <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest">Reaperto de Terminais Verificado?</span>
                    <input type="checkbox" className="w-6 h-6 rounded-lg border-[#c4c5d7] text-[#0d3fd1]" checked={formData.manutencao.aperto_terminais} onChange={(e) => setFormData({ ...formData, manutencao: { ...formData.manutencao, aperto_terminais: e.target.checked } })} />
                  </div>
                </div>
              )}

              {activeTab === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  {[
                    { key: 'tipo_celas', label: 'Tipo de Celas', placeholder: 'Ex: SF6 / Ar' },
                    { key: 'estado_disjuntores', label: 'Estado dos Disjuntores', placeholder: 'Ex: Operacional' },
                    { key: 'estado_seccionadores', label: 'Estado dos Seccionadores', placeholder: 'Ex: Bom' },
                    { key: 'reles_protecao', label: 'Relés de Proteção', placeholder: 'Ex: Digital' },
                    { key: 'coordenacao_protecoes', label: 'Coordenação de Proteções', placeholder: 'Ex: Verificada' },
                    { key: 'aterramento_mt', label: 'Aterramento de Média Tensão', placeholder: 'Ex: Conforme' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">{item.label}</label>
                      <input
                        type="text"
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:border-[#0d3fd1] focus:ring-1 focus:ring-[#0d3fd1] transition-all"
                        value={formData.media_tensao[item.key] || ''}
                        onChange={(e) => setFormData({ ...formData, media_tensao: { ...formData.media_tensao, [item.key]: e.target.value } })}
                        placeholder={item.placeholder}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                  {[
                    { key: 'estado_qgbt', label: 'Estado do QGBT', col: 'md:col-span-1' },
                    { key: 'barramentos', label: 'Estado dos Barramentos', col: 'md:col-span-1' },
                    { key: 'disjuntores', label: 'Estado dos Disjuntores', col: 'md:col-span-1' },
                    { key: 'balanceamento_cargas', label: 'Balanceamento de Cargas', col: 'md:col-span-1' },
                    { key: 'tensao', label: 'Tensão (V)', col: 'md:col-span-1' },
                    { key: 'fator_potencia', label: 'Fator de Potência', col: 'md:col-span-1' },
                    { key: 'corrente_fase_a', label: 'Corrente Fase A (A)', col: 'md:col-span-1' },
                    { key: 'corrente_fase_b', label: 'Corrente Fase B (A)', col: 'md:col-span-1' },
                    { key: 'corrente_fase_c', label: 'Corrente Fase C (A)', col: 'md:col-span-1' }
                  ].map((item) => (
                    <div key={item.key} className={`space-y-2 ${item.col}`}>
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">{item.label}</label>
                      <input
                        type="text"
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:border-[#00e47c] focus:ring-1 focus:ring-[#00e47c] transition-all"
                        value={formData.baixa_tensao[item.key] || ''}
                        onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, [item.key]: e.target.value } })}
                        placeholder="---"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 7 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Físico da Cabine</label>
                    <select
                      className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:border-[#d15f0d] focus:ring-1 focus:ring-[#d15f0d] transition-all"
                      value={formData.infraestrutura.estado_cabine || ''}
                      onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, estado_cabine: e.target.value } })}
                    >
                      <option value="Excelente">Excelente</option>
                      <option value="Bom">Bom</option>
                      <option value="Degradado">Degradado</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'ventilacao', label: 'Ventilação' },
                      { key: 'drenagem', label: 'Drenagem' },
                      { key: 'iluminacao', label: 'Iluminação' },
                      { key: 'controlo_acesso', label: 'Controlo de Acesso' }
                    ].map((item) => (
                      <label key={item.key} className="flex flex-col items-start gap-2 p-4 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-xl cursor-pointer hover:bg-[#eff4ff] transition-all">
                        <span className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{item.label}</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-[#c4c5d7] text-[#d15f0d] focus:ring-[#d15f0d]"
                          checked={formData.infraestrutura[item.key]}
                          onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, [item.key]: e.target.checked } })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 10 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Risco Global</label>
                      <select
                        className={`w-full border-2 rounded-2xl py-5 px-8 text-sm font-black transition-all ${formData.risco.nivel_risco_geral === 'Crítico' ? 'bg-red-50 border-red-500 text-red-700' :
                          formData.risco.nivel_risco_geral === 'Alto' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                            'bg-[#f8faff] border-[#c4c5d7]/30 text-[#0f1c2c]'
                          }`}
                        value={formData.risco.nivel_risco_geral}
                        onChange={(e) => setFormData({ ...formData, risco: { ...formData.risco, nivel_risco_geral: e.target.value } })}
                      >
                        <option value="">-- Avalie o Risco --</option>
                        <option value="Baixo">Baixo (Normal)</option>
                        <option value="Médio">Médio (Observação)</option>
                        <option value="Alto">Alto (Urgente)</option>
                        <option value="Crítico">Crítico (Imediato)</option>
                      </select>
                    </div>

                    <div className="p-8 bg-[#f8faff] rounded-3xl border border-[#c4c5d7]/10">
                      <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-6 block">Fatores de Risco Detetados</span>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { key: 'sobrecarga', label: 'Sobrecarga' },
                          { key: 'desequilibrio_fases', label: 'Desequilíbrio de Fases' },
                          { key: 'falhas_isolamento', label: 'Falhas de Isolamento' },
                          { key: 'redundancia', label: 'Falta de Redundância' }
                        ].map((fator) => (
                          <label key={fator.key} className="flex items-center justify-between p-4 bg-white border border-[#c4c5d7]/10 rounded-xl cursor-pointer hover:border-red-500/30 transition-all group">
                            <span className="text-[10px] font-bold text-[#747686] uppercase group-hover:text-[#0f1c2c] transition-colors">{fator.label}</span>
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-[#c4c5d7] text-red-600 focus:ring-red-600"
                              checked={formData.risco[fator.key]}
                              onChange={(e) => setFormData({
                                ...formData,
                                risco: {
                                  ...formData.risco,
                                  [fator.key]: e.target.checked
                                }
                              })}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Recomendações Técnicas / Observações</label>
                    <textarea
                      className="w-full h-[320px] bg-[#f8faff] border border-[#c4c5d7]/30 rounded-3xl p-8 text-sm font-medium text-[#0f1c2c] focus:border-[#0d3fd1] focus:ring-1 focus:ring-[#0d3fd1] transition-all resize-none"
                      placeholder="Descreva as medidas corretivas necessárias..."
                      value={formData.risco.Recomendacoes}
                      onChange={(e) => setFormData({ ...formData, risco: { ...formData.risco, recomendacoes: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 8 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 bg-[#0f1c2c] p-8 rounded-[1rem] border border-[#0d3fd1]/30 shadow-2xl shadow-[#0d3fd1]/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-3 h-3 rounded-full bg-[#00e47c] animate-pulse shadow-[0_0_15px_#00e47c]" />
                      <h4 className="text-xs font-black text-[#5fff9b] uppercase tracking-[0.3em]">Sistema de Monitorização SCADA</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {[
                        { key: 'SCADA', label: 'Integração SCADA', options: ['Integrado', 'Pendente', 'Semi-Automático', 'N/A'] },
                        { key: 'Comunicacoes', label: 'Meio de Comunicação', options: ['GPRS/4G', 'Fibra Óptica', 'Rádio Link', 'Satélite'] },
                        { key: 'Estado_Modem', label: 'Estado do Gateway/Modem', options: ['Operacional', 'Falha de Link', 'Sem Alimentação', 'Em Manutenção'] },
                        { key: 'Protocolo', label: 'Protocolo de Comunicação', options: ['IEC-104', 'DNP3', 'Modbus TCP', 'SNMP'] }
                      ].map((item) => (
                        <div key={item.key} className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">{item.label}</label>
                          <select
                            className="w-full bg-[#16293d] border border-[#0d3fd1]/20 rounded-xl py-4 px-6 text-sm font-bold text-white focus:border-[#00e47c] focus:ring-1 focus:ring-[#00e47c] transition-all cursor-pointer"
                            value={formData.monitorizacao[item.key.toLowerCase()] || ''}
                            onChange={(e) => setFormData({ ...formData, monitorizacao: { ...formData.monitorizacao, [item.key.toLowerCase()]: e.target.value } })}
                          >
                            <option value="">-- Selecione --</option>
                            {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 pt-10 border-t border-[#0d3fd1]/10">
                      <span className="text-[10px] font-black text-[#5fff9b] uppercase tracking-widest mb-6 block">Sensores IoT Instalados</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { key: 'sensores_temperatura', label: 'Temperatura' },
                          { key: 'sensores_corrente', label: 'Corrente' },
                          { key: 'sensores_vibracao', label: 'Vibração' }
                        ].map((sensor) => (
                          <label key={sensor.key} className="flex items-center justify-between p-4 bg-[#16293d] border border-[#0d3fd1]/10 rounded-xl cursor-pointer hover:border-[#00e47c]/50 transition-all group">
                            <span className="text-[10px] font-bold text-[#c4c5d7] uppercase group-hover:text-white transition-colors">{sensor.label}</span>
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-[#0d3fd1]/30 text-[#00e47c] focus:ring-[#00e47c]"
                              checked={formData.monitorizacao[sensor.key]}
                              onChange={(e) => setFormData({
                                ...formData,
                                monitorizacao: {
                                  ...formData.monitorizacao,
                                  [sensor.key]: e.target.checked
                                }
                              })}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-10 flex justify-center">
                <button type="submit" className="flex items-center gap-3 px-20 py-4 bg-[#0d3fd1] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#0034cc] transition-all shadow-xl shadow-[#0d3fd1]/20 active:scale-95 group">
                  Confirmar Operação
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#5fff9b]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
