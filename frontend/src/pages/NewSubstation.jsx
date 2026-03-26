import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Edit3, 
  Trash2, 
  Calendar, 
  Info, 
  Zap, 
  Settings, 
  ShieldCheck, 
  Activity,
  ArrowRight,
  Database,
  ArrowLeft,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function NewSubstation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({
    // 1. Identificação Geral
    nome: '',
    codigo: '',
    localizacao: '',
    gps: '',
    tipo: '',
    proprietario: '',
    operador: '',
    ano_construcao: '',
    entrada_operacao: '',
    estado: 'Ativa',

    // 2 & 4. Media/Baixa Tensão (Características Elétricas)
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

    // 3. Transformadores
    transformadores: [
      { num: 1, potencia: 630, tensao_p: 15, tensao_s: 0.4, tipo: 'Óleo', estado_oleo: 'Bom', fugas: false }
    ],

    // 6 & 10. Segurança
    seguranca: {
      resistencia_terra: 0.5,
      protecao_raios: true,
      spd: true,
      sinalizacao: true,
      combate_incendio: true,
      distancias_seguranca: true
    },

    // 9. Infraestrutura
    infraestrutura: {
      estado_cabine: 'Bom',
      ventilacao: true,
      drenagem: true,
      iluminacao: true,
      controlo_acesso: true
    },

    // 7. Medição e Controle
    monitorizacao: {
      scada: true,
      sensores_temperatura: true,
      sensores_corrente: true,
      sensores_vibracao: false,
      registo_eventos: true,
      comunicacao: 'GPRS/4G'
    },

    // 11. Manutenção
    manutencao: {
      historico_falhas: '',
      mtbf: 5000,
      mttr: 4,
      plano_preventivo: true,
      plano_preditivo: false,
      sobressalentes: true
    },

    // 10. Risco
    risco: {
      nivel_risco_geral: 'Baixo',
      sobrecarga: false,
      desequilibrio_fases: false,
      redundancia: true
    }
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      async function fetchSubstation() {
        try {
          const response = await api.get(`/subestacoes/${id}`);
          const sub = response.data;
          
          // Mapeia os dados mantendo a estrutura padrão para campos inexistentes
          setFormData(prev => ({
            ...prev,
            ...sub,
            ano_construcao: sub.ano_construcao ? sub.ano_construcao.split('T')[0] : '',
            entrada_operacao: sub.entrada_operacao ? sub.entrada_operacao.split('T')[0] : '',
            media_tensao: { ...prev.media_tensao, ...(sub.media_tensao || {}) },
            baixa_tensao: { ...prev.baixa_tensao, ...(sub.baixa_tensao || {}) },
            seguranca: { ...prev.seguranca, ...(sub.seguranca || {}) },
            infraestrutura: { ...prev.infraestrutura, ...(sub.infraestrutura || {}) },
            monitorizacao: { ...prev.monitorizacao, ...(sub.monitorizacao || {}) },
            manutencao: { ...prev.manutencao, ...(sub.manutencao || {}) },
            risco: { ...prev.risco, ...(sub.risco || {}) },
            transformadores: sub.transformadores || prev.transformadores
          }));
        } catch (error) {
          alert('Erro ao carregar dados da subestação.');
          navigate('/subestacoes');
        } finally {
          setLoading(false);
        }
      }
      fetchSubstation();
    }
  }, [id, isEdit, navigate]);

  const tabs = [
    { id: 1, name: '1. Identificação Geral', icon: Info },
    { id: 2, name: '2. Características Elétricas', icon: Zap },
    { id: 3, name: '3. Transformadores', icon: Settings },
    { id: 4, name: '4. Equipamentos de Manobra', icon: ShieldCheck },
    { id: 5, name: '5. Sistema de Barramentos', icon: Database },
    { id: 6, name: '6. Sistema de Aterramento', icon: Activity },
    { id: 7, name: '7. Medição e Controle', icon: Settings },
    { id: 8, name: '8. Sistema Auxiliar', icon: Settings },
    { id: 9, name: '9. Infraestrutura Física', icon: Settings },
    { id: 10, name: '10. Segurança e Acesso', icon: ShieldCheck },
    { id: 11, name: '11. Manutenção e Histórico', icon: History }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/subestacoes/${id}`, formData);
        alert('Subestação atualizada com sucesso!');
      } else {
        await api.post('/subestacoes', formData);
        alert('Subestação registada com sucesso!');
      }
      navigate('/subestacoes');
    } catch (err) {
      alert('Erro ao guardar: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/subestacoes')}
            className="p-3 bg-white border border-[#c4c5d7]/20 rounded-xl text-[#0f1c2c] hover:bg-[#eff4ff] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-[#0f1c2c] uppercase tracking-tight">
              {isEdit ? 'Edição de Ativo Crítico' : 'Registo de Ativo Crítico'}
            </h2>
            <p className="text-sm text-[#747686] font-medium uppercase tracking-widest opacity-60">MBT Energia INDUSTRIAL</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-[#c4c5d7]/20">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0d3fd1] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all" onClick={handleSubmit}>
            <Save className="w-4 h-4 text-[#5fff9b]" />
            {isEdit ? 'Atualizar' : 'Salvar'}
          </button>
          <button className="hidden xs:flex items-center gap-2 px-6 py-2.5 bg-white text-[#444655] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all">
            <Edit3 className="w-4 h-4" />
            Rascunho
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-[#243141] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            <div className="p-6 border-b text-center border-white/5 bg-[#1a2533]">
              <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Módulos de Cadastro</h3>
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
          <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden p-8 md:p-12 min-h-[600px] flex flex-col">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#c4c5d7]/10">
              <div className="w-12 h-12 bg-[#eff4ff] rounded-2xl flex items-center justify-center text-[#0d3fd1] shadow-inner">
                {React.createElement(tabs[activeTab - 1].icon, { className: "w-6 h-6" })}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f1c2c] uppercase tracking-tight">Registo Técnico</h3>
                <p className="text-[10px] font-bold text-[#747686] uppercase tracking-widest opacity-60">{tabs[activeTab-1].name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nome da Unidade</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Código Identificador</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] font-mono" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} required disabled={isEdit} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Localização</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo</label>
                    <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                      <option value="">Selecione...</option>
                      <option value="Elevadora">Elevadora</option>
                      <option value="Abaixadora">Abaixadora</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Celas (MT)</label>
                    <input type="text" placeholder="SF6, Ar, Óleo..." className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.media_tensao.tipo_celas} onChange={(e) => setFormData({ ...formData, media_tensao: {...formData.media_tensao, tipo_celas: e.target.value} })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado disjuntores MT</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.media_tensao.estado_disjuntores} onChange={(e) => setFormData({ ...formData, media_tensao: {...formData.media_tensao, estado_disjuntores: e.target.value} })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão Nominal BT (V)</label>
                    <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.baixa_tensao.tensao} onChange={(e) => setFormData({ ...formData, baixa_tensao: {...formData.baixa_tensao, tensao: Number(e.target.value)} })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Fator de Potência Alvo</label>
                    <input type="number" step="0.01" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.baixa_tensao.fator_potencia} onChange={(e) => setFormData({ ...formData, baixa_tensao: {...formData.baixa_tensao, fator_potencia: Number(e.target.value)} })} />
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-[#0d3fd1] uppercase tracking-[0.2em]">Banco de Transformadores</h4>
                    <button type="button" onClick={() => setFormData({...formData, transformadores: [...formData.transformadores, { num: formData.transformadores.length + 1, potencia: 630, tensao_p: 15, tensao_s: 0.4, tipo: 'Óleo', estado_oleo: 'Bom', fugas: false }]})} className="flex items-center gap-2 px-4 py-2 bg-[#eff4ff] text-[#0d3fd1] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-all">
                      <Plus className="w-3 h-3" /> Adicionar Unidade
                    </button>
                  </div>
                  {formData.transformadores.map((trafo, idx) => (
                    <div key={idx} className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20 relative shadow-sm hover:shadow-md transition-all">
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#243141] text-white rounded-xl flex items-center justify-center text-sm font-black shadow-lg">TR{trafo.num}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Potência Nominal (kVA)</label>
                          <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]" value={trafo.potencia} onChange={(e) => {
                            const newTrafos = [...formData.transformadores];
                            newTrafos[idx].potencia = Number(e.target.value);
                            setFormData({...formData, transformadores: newTrafos});
                          }} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Tecnologia de Isolação</label>
                          <select className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]" value={trafo.tipo} onChange={(e) => {
                            const newTrafos = [...formData.transformadores];
                            newTrafos[idx].tipo = e.target.value;
                            setFormData({...formData, transformadores: newTrafos});
                          }}>
                            <option value="Óleo">Óleo Mineral</option>
                            <option value="Seco">Resina (Seco)</option>
                            <option value="SF6">Gás SF6</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Tensão Primária (kV)</label>
                          <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]" value={trafo.tensao_p} onChange={(e) => {
                            const newTrafos = [...formData.transformadores];
                            newTrafos[idx].tensao_p = Number(e.target.value);
                            setFormData({...formData, transformadores: newTrafos});
                          }} />
                        </div>
                      </div>
                      <button type="button" onClick={() => setFormData({...formData, transformadores: formData.transformadores.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 6 || activeTab === 10 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4 bg-[#f8faff] p-6 rounded-2xl border border-[#c4c5d7]/10">
                    <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-4">Sistemas de Proteção Ativos</h4>
                    {Object.entries(formData.seguranca).filter(([key]) => typeof formData.seguranca[key] === 'boolean').map(([key, val]) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-bold text-[#444655] uppercase opacity-70 group-hover:opacity-100 transition-opacity">{key.replace('_', ' ')}</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1] focus:ring-[#0d3fd1]" checked={val} onChange={(e) => setFormData({...formData, seguranca: {...formData.seguranca, [key]: e.target.checked}})} />
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Resistência de Terra (Ω)</label>
                    <input type="number" step="0.001" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.seguranca.resistencia_terra} onChange={(e) => setFormData({ ...formData, seguranca: {...formData.seguranca, resistencia_terra: Number(e.target.value)} })} />
                    <p className="text-[9px] text-[#00c96d] font-bold uppercase mt-1">Conforme norma IEC 62305</p>
                  </div>
                </div>
              ) : null}

              {activeTab === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4 bg-[#f8faff] p-6 rounded-2xl border border-[#c4c5d7]/10">
                    <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-4">Aparelhagem de Manobra (MT)</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Estado dos Seccionadores</label>
                        <select className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]" value={formData.media_tensao.estado_seccionadores} onChange={(e) => setFormData({...formData, media_tensao: {...formData.media_tensao, estado_seccionadores: e.target.value}})}>
                          <option value="Operacional">Operacional</option>
                          <option value="Deficiente">Deficiente</option>
                          <option value="Fora de Serviço">Fora de Serviço</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Relés de Proteção (Modelo/Série)</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#0f1c2c]" value={formData.media_tensao.reles_protecao} onChange={(e) => setFormData({...formData, media_tensao: {...formData.media_tensao, reles_protecao: e.target.value}})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white border border-[#c4c5d7]/20 rounded-xl cursor-pointer">
                      <span className="text-xs font-bold text-[#444655] uppercase">Coordenação de Proteções Validada?</span>
                      <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]" checked={formData.media_tensao.coordenacao_protecoes} onChange={(e) => setFormData({...formData, media_tensao: {...formData.media_tensao, coordenacao_protecoes: e.target.checked}})} />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white border border-[#c4c5d7]/20 rounded-xl cursor-pointer">
                      <span className="text-xs font-bold text-[#444655] uppercase">Aterramento MT Verificado?</span>
                      <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]" checked={formData.media_tensao.aterramento_mt} onChange={(e) => setFormData({...formData, media_tensao: {...formData.media_tensao, aterramento_mt: e.target.checked}})} />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tecnologia de Barramentos</label>
                    <input type="text" placeholder="Cobre, Alumínio..." className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.baixa_tensao.barramentos} onChange={(e) => setFormData({...formData, baixa_tensao: {...formData.baixa_tensao, barramentos: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado do QGBT</label>
                    <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.baixa_tensao.estado_qgbt} onChange={(e) => setFormData({...formData, baixa_tensao: {...formData.baixa_tensao, estado_qgbt: e.target.value}})}>
                      <option value="Bom">Bom</option>
                      <option value="Regular">Regular</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 p-6 bg-[#fcfdff] rounded-2xl border border-[#c4c5d7]/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#0f1c2c] uppercase tracking-tight">Equilíbrio de Fases</h4>
                      <p className="text-[10px] text-[#747686] font-bold uppercase opacity-60">Verificação de carga simétrica</p>
                    </div>
                    <input type="checkbox" className="w-6 h-6 rounded-lg border-[#c4c5d7] text-[#0d3fd1]" checked={formData.baixa_tensao.balanceamento_cargas} onChange={(e) => setFormData({...formData, baixa_tensao: {...formData.baixa_tensao, balanceamento_cargas: e.target.checked}})} />
                  </div>
                </div>
              )}

              {activeTab === 7 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4 bg-[#f8faff] p-6 rounded-2xl border border-[#c4c5d7]/10">
                    <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-4">Medição e Monitorização (SCADA)</h4>
                    {Object.entries(formData.monitorizacao).filter(([key]) => typeof formData.monitorizacao[key] === 'boolean').map(([key, val]) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-bold text-[#444655] uppercase opacity-70 group-hover:opacity-100 transition-opacity">{key.replace('_', ' ')}</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1] focus:ring-[#0d3fd1]" checked={val} onChange={(e) => setFormData({...formData, monitorizacao: {...formData.monitorizacao, [key]: e.target.checked}})} />
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tecnologia de Comunicação</label>
                    <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.monitorizacao.comunicacao} onChange={(e) => setFormData({...formData, monitorizacao: {...formData.monitorizacao, comunicacao: e.target.value}})} />
                  </div>
                </div>
              )}

              {activeTab === 8 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-8 bg-[#f8faff] rounded-[2rem] border border-[#c4c5d7]/20 flex flex-col items-center justify-center text-center">
                    <Zap className="w-12 h-12 text-[#0d3fd1] mb-4" />
                    <h4 className="text-sm font-black text-[#0f1c2c] uppercase tracking-tight">Sistemas Auxiliares (DC/AC)</h4>
                    <p className="text-[10px] text-[#747686] font-bold uppercase opacity-60 mt-2 tracking-widest">Banco de Baterias e Retificadores</p>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-white border border-[#c4c5d7]/10 rounded-xl">
                       <span className="text-[9px] font-black text-[#747686] uppercase block mb-1">Status Carregadores</span>
                       <span className="text-xs font-bold text-green-500">OPERACIONAL</span>
                     </div>
                     <div className="p-4 bg-white border border-[#c4c5d7]/10 rounded-xl">
                       <span className="text-[9px] font-black text-[#747686] uppercase block mb-1">Autonomia Estimada</span>
                       <span className="text-xs font-bold text-[#0f1c2c]">8 HORAS</span>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 9 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Físico da Cabine</label>
                    <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.infraestrutura.estado_cabine} onChange={(e) => setFormData({...formData, infraestrutura: {...formData.infraestrutura, estado_cabine: e.target.value}})}>
                      <option value="Excelente">Excelente</option>
                      <option value="Bom">Bom</option>
                      <option value="Degradado">Degradado</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['ventilacao', 'drenagem', 'iluminacao', 'controlo_acesso'].map((key) => (
                      <label key={key} className="flex flex-col items-start gap-2 p-4 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-xl cursor-pointer hover:bg-[#eff4ff] transition-all">
                        <span className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{key.replace('_', ' ')}</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]" checked={formData.infraestrutura[key]} onChange={(e) => setFormData({...formData, infraestrutura: {...formData.infraestrutura, [key]: e.target.checked}})} />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 11 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Histórico de Falhas e Intervenções</label>
                    <textarea 
                      className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-2xl py-4 px-6 text-sm font-medium text-[#0f1c2c] h-32 resize-none" 
                      placeholder="Descreva as últimas ocorrências técnicas..."
                      value={formData.manutencao.historico_falhas}
                      onChange={(e) => setFormData({...formData, manutencao: {...formData.manutencao, historico_falhas: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">MTBF (Horas)</label>
                      <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.manutencao.mtbf} onChange={(e) => setFormData({...formData, manutencao: {...formData.manutencao, mtbf: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">MTTR (Horas)</label>
                      <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.manutencao.mttr} onChange={(e) => setFormData({...formData, manutencao: {...formData.manutencao, mttr: Number(e.target.value)}})} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-12 flex justify-center">
                <button type="submit" className="flex items-center gap-3 px-16 py-4 bg-[#00e47c] text-[#005229] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00c96d] transition-all shadow-xl shadow-[#00e47c]/10 active:scale-95 group">
                  {isEdit ? 'Finalizar Edição' : 'Confirmar Registo'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
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
