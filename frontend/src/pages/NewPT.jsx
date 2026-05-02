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
  Activity,
  Users,
  Search,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function NewPT() {
  const { subestacaoId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [proprietarios, setProprietarios] = useState([]);
  const [loadingProprietarios, setLoadingProprietarios] = useState(false);

  const [formData, setFormData] = useState({
    identificacao: {
      id_pt: '',
      id_concessionaria: '', // Código único
      designacao: '', // Nome do PT
      concessao_operador: '', // Quem gere
      id_proprietario: '',
      morada: '', // Localização / Morada completa
      freguesia: '',
      concelho: '',
      provincia: 'Luanda', // Distrito
      gps: '',
      latitude: '',
      longitude: '',
      altitude: '',
      tipo_instalacao: '', // Secção 0
      potencia_kva: '',
      data_levantamento: new Date().toISOString().split('T')[0],
      tecnico_levantamento: '',
      num_habilitacao: '',
      // Suporte/Poste (Secção 3)
      tipo_poste: '',
      ref_poste: '',
      altura_poste: '',
      esforco_poste_dan: '',
      ano_poste: '',
      material_poste: '',
      estado_poste: '',
      equipamento_poste: {
        interruptor: false,
        seccionador: false,
        para_raios: false,
        amarracao: false
      },
      // Cabine (Secção 4)
      tipo_cabine: '',
      dim_comprimento: '',
      dim_largura: '',
      // Validação
      supervisor_obra: '',
      data_validacao: '',
      validacao_status: 'Pendente',
      tecnico_assinatura_url: '',
      supervisor_assinatura_url: '',
      observacoes_gerais: '' // Secção 8
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
      potencia_kva: '',
      tensao_primaria: '30000', // Tensão AT (kV)
      tensao_secundaria: '400', // Tensão BT (V)
      nivel_isolamento: '',
      ucc: '',
      frequencia: '50',
      numero_serie: '',
      fabricante: '',
      ano_fabrico: '',
      grupo_ligacao: '',
      tipo_arrefecimento: '', // ONAN, Hermético, AN, AF
      tipo_isolamento: 'Óleo Mineral',
      observacoes: ''
    },
    seguranca: {
      resistencia_terra: '',
      data_ultima_medicao: '',
      protecao_raios: false,
      spd: false,
      sinalizacao: false,
      combate_incendio: false,
      distancias_seguranca: false,
      rele_protecao_marca: '',
      tipo_protecao_mt: '',
      fusiveis_mt_calibre: '',
      protecao_sobrecorrente: false,
      protecao_neutro: false,
      protecao_max_corrente: false,
      protecao_diferencial: false,
      observacoes: ''
    },
    manutencao: {
      ultima_limpeza: '',
      aperto_terminais: false,
      inspecao_termografica: ''
    },
    media_tensao: {
      celas: [], // Secção 5: [{num, funcao, tipo_fabricante, in_a, estado, obs}]
      observacoes: ''
    },
    baixa_tensao: {
      fabricante_qgbt: '',
      corrente_nominal_geral: '',
      corrente_nominal_saida: '',
      num_saidas_bt: '',
      transformador_corrente: '',
      tipo_ligacao_neutro: '',
      disjuntor_geral: false,
      fusiveis_gerais: false,
      contagem_bt: false,
      telecontagem: false,
      tensao: 400,
      balanceamento_cargas: false,
      observacoes: ''
    },
    infraestrutura: {
      tipo_cabine: '',
      dim_comprimento: '',
      dim_largura: ''
    }
  });

  const initializeMTCells = () => {
    const tipo = formData.identificacao.tipo_instalacao || '';
    let template = [];
    
    if (tipo.includes('PTC') || tipo.includes('AS') || tipo.includes('AI')) {
      // Template sem celas (Poste/Coluna)
      template = [
        { num: '1', funcao: 'Entrada / Saída', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '2', funcao: 'Proteção MT', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '3', funcao: 'Transformador', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' }
      ];
    } else {
      // Template com celas (Cabinado)
      template = [
        { num: '1', funcao: 'Entrada', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '2', funcao: 'Saída', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '3', funcao: 'Corte Geral e Contagem', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '4', funcao: 'Proteção', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' },
        { num: '5', funcao: 'Transformadores', tipo_fabricante: '', corrente_nominal: '', estado: 'Operacional', obs: '' }
      ];
    }
    setFormData(prev => ({
      ...prev,
      media_tensao: { ...prev.media_tensao, celas: template }
    }));
  };

  useEffect(() => {
    fetchProprietarios();
  }, []);

  async function fetchProprietarios() {
    try {
      setLoadingProprietarios(true);
      const res = await api.get('/proprietarios');
      setProprietarios(res.data.data || res.data);
    } catch (err) {
      console.error('Erro ao buscar proprietários', err);
    } finally {
      setLoadingProprietarios(false);
    }
  }

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
              id_proprietario: sPt.id_proprietario || '',
              id_pt: sPt.id_pt || '',
              id_concessionaria: sPt.id_concessionaria || sPt.id_pt || '',
              tipo_instalacao: (() => {
                let type = sPt.tipo_instalacao || '';
                // Normalização para garantir que os botões do novo UI fiquem selecionados
                if (type.includes('PTA') || type.toLowerCase().includes('aéreo')) {
                  if (!type.includes('PTA (Aéreo)')) type = 'PTA (Aéreo)';
                } else if (type.toLowerCase().includes('cabinado') || type.includes('PTC')) {
                   if (!type.includes('PTC COM Contagem') && !type.includes('PTC SEM Contagem')) {
                      type = type.includes('COM Contagem') ? 'PTC COM Contagem' : 'PTC SEM Contagem';
                   }
                }
                
                // Garantir categoria de potência se faltar
                if (!type.includes('AI') && !type.includes('AS')) {
                  type += (sPt.potencia_kva > 160) ? ' | AI (>160 kVA)' : ' | AS (≤160 kVA)';
                } else {
                  if (type.includes('AI') && !type.includes('AI (>160 kVA)')) type = type.replace('AI', 'AI (>160 kVA)');
                  if (type.includes('AS') && !type.includes('AS (≤160 kVA)')) type = type.replace('AS', 'AS (≤160 kVA)');
                }
                
                return type;
              })(),
              ano_instalacao: sPt.ano_instalacao || '',
              data_levantamento: sPt.data_levantamento ? new Date(sPt.data_levantamento).toISOString().split('T')[0] : '',
              gps: sPt.gps || '',
              latitude: sPt.latitude || (sPt.gps ? parseFloat(sPt.gps.split(',')[0]) || '' : ''),
              longitude: sPt.longitude || (sPt.gps && sPt.gps.includes(',') ? parseFloat(sPt.gps.split(',')[1]) || '' : ''),
              equipamento_poste: sPt.equipamento_poste || prev.identificacao.equipamento_poste
            },
            conformidade: { 
              ...prev.conformidade, 
              ...(sPt.conformidade || {}) 
            },
            transformador: { 
              ...prev.transformador, 
              ...(sPt.transformadores?.[0] || {}),
              tipo_isolamento: sPt.transformadores?.[0]?.tipo_isolamento || 'Óleo Mineral'
            },
            media_tensao: { 
              ...prev.media_tensao, 
              ...(sPt.media_tensao || {}),
              celas: sPt.media_tensao?.celas || []
            },
            baixa_tensao: { 
              ...prev.baixa_tensao, 
              ...(sPt.baixa_tensao || {}) 
            },
            seguranca: { 
              ...prev.seguranca, 
              ...(sPt.seguranca || {}),
              data_ultima_medicao: sPt.seguranca?.data_ultima_medicao ? new Date(sPt.seguranca.data_ultima_medicao).toISOString().split('T')[0] : ''
            },
            infraestrutura: { 
              ...prev.infraestrutura, 
              ...(sPt.infraestrutura || {}) 
            },
            manutencao: { 
              ...prev.manutencao, 
              ...(sPt.manutencao || {}),
              ultima_limpeza: sPt.manutencao?.ultima_limpeza ? new Date(sPt.manutencao.ultima_limpeza).toISOString().split('T')[0] : ''
            },
            monitorizacao: { 
              ...prev.monitorizacao, 
              ...(sPt.monitorizacao || {}) 
            },
            risco: { 
              ...prev.risco, 
              ...(sPt.riscos?.[0] || {}) 
            }
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
    { id: 0, name: '0. Tipo de PT', icon: Activity },
    { id: 1, name: '1. Identificação', icon: Info },
    { id: 2, name: '2. Transformador', icon: Settings },
    { id: 3, name: '3. Suporte/Poste', icon: HardDrive },
    { id: 4, name: '4. Cabine', icon: Database },
    { id: 5, name: '5. Celas MT', icon: Zap },
    { id: 6, name: '6. QGBT', icon: Zap },
    { id: 7, name: '7. Proteção/Terra', icon: ShieldCheck },
    { id: 8, name: '8. Anomalias', icon: AlertTriangle },
    { id: 9, name: '9. Validação', icon: ClipboardCheck },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...formData.identificacao,
        id_subestacao: Number(subestacaoId),
        transformadores: [formData.transformador],
        media_tensao: formData.media_tensao,
        baixa_tensao: formData.baixa_tensao,
        seguranca: formData.seguranca,
        infraestrutura: formData.infraestrutura
      };

      if (isEdit) {
        await api.put(`/clientes/${id}`, payload);
        alert('PT actualizado com sucesso!');
      } else {
        await api.post('/clientes', payload);
        alert('PT criado com sucesso!');
      }
      navigate(`/subestacoes/${subestacaoId}/auditoria`);
    } catch (error) {
      console.error(error);
      alert('Erro ao guardar dados do PT.');
    } finally {
      setLoading(false);
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
              {isEdit ? 'Editar Posto de Transformação' : 'Cadastrar Novo PT'}
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
                {React.createElement((tabs.find(t => t.id === activeTab) || tabs[0]).icon, { className: "w-6 h-6" })}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f1c2c] uppercase tracking-tight">{(tabs.find(t => t.id === activeTab) || tabs[0]).name}</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              {/* Secção 0: Tipo de PT */}
              {activeTab === 0 && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                  {/* Grupo 1: Infraestrutura */}
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-6 bg-[#0d3fd1] rounded-full"></div>
                      <h4 className="text-xs font-black text-[#0f1c2c] uppercase tracking-[0.2em]">1. Tipo de Infraestrutura</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'PTA (Aéreo)', label: 'PTA', desc: 'Transformador em Poste / Antena.' },
                        { id: 'PTC COM Contagem', label: 'PTC (CC)', desc: 'Cabine com medição em MT.' },
                        { id: 'PTC SEM Contagem', label: 'PTC (SC)', desc: 'Cabine sem medição em MT.' }
                      ].map((tipo) => {
                        const isSelected = formData.identificacao.tipo_instalacao.includes(tipo.id);
                        return (
                          <button
                            key={tipo.id}
                            type="button"
                            onClick={() => {
                              const currentVal = formData.identificacao.tipo_instalacao;
                              const otherParts = currentVal.split(' | ').filter(p => !['PTA (Aéreo)', 'PTC COM Contagem', 'PTC SEM Contagem'].includes(p));
                              const newVal = [tipo.id, ...otherParts].join(' | ');
                              setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_instalacao: newVal } });
                            }}
                            className={`
                              p-6 rounded-2xl transition-all text-left border-2 flex flex-col gap-2
                              ${isSelected 
                                ? 'bg-[#0d3fd1] text-white border-[#0d3fd1] shadow-lg shadow-[#0d3fd1]/20' 
                                : 'bg-white text-[#444655] border-[#c4c5d7]/20 hover:border-[#0d3fd1]/30'}
                            `}
                          >
                            <span className="text-[11px] font-black uppercase tracking-tight">{tipo.label}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#747686]'} leading-relaxed`}>
                              {tipo.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grupo 2: Categoria de Potência */}
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-6 bg-[#00e47c] rounded-full"></div>
                      <h4 className="text-xs font-black text-[#0f1c2c] uppercase tracking-[0.2em]">2. Categoria / Propriedade</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { id: 'AI (>160 kVA)', label: 'AI', desc: 'Alta Intensidade / Alta Potência.' },
                        { id: 'AS (≤160 kVA)', label: 'AS', desc: 'Baixa Potência / Padrão.' }
                      ].map((cat) => {
                        const isSelected = formData.identificacao.tipo_instalacao.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const currentVal = formData.identificacao.tipo_instalacao;
                              const otherParts = currentVal.split(' | ').filter(p => !['AI (>160 kVA)', 'AS (≤160 kVA)'].includes(p));
                              const newVal = [...otherParts, cat.id].join(' | ');
                              setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_instalacao: newVal } });
                            }}
                            className={`
                              p-6 rounded-2xl transition-all text-left border-2 flex flex-col gap-2
                              ${isSelected 
                                ? 'bg-[#00e47c] text-[#005229] border-[#00e47c] shadow-lg shadow-[#00e47c]/20' 
                                : 'bg-white text-[#444655] border-[#c4c5d7]/20 hover:border-[#00e47c]/30'}
                            `}
                          >
                            <span className="text-[11px] font-black uppercase tracking-tight">{cat.label}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-[#005229]/70' : 'text-[#747686]'} leading-relaxed`}>
                              {cat.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#eff4ff] rounded-2xl flex items-start gap-4">
                     <Info className="w-5 h-5 text-[#0d3fd1] mt-0.5" />
                     <p className="text-[11px] font-bold text-[#0d3fd1] leading-relaxed">
                       👉 Agora podes definir a infraestrutura e a potência em simultâneo. Ex: <b>{formData.identificacao.tipo_instalacao || 'Aguardando seleção...'}</b>
                     </p>
                  </div>
                </div>
              )}

              {/* Secção 1: Identificação Geral */}
              {activeTab === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    <div className="lg:col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">ID PT / Código de Identificação</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" 
                        value={formData.identificacao.id_concessionaria} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ 
                            ...formData, 
                            identificacao: { 
                              ...formData.identificacao, 
                              id_concessionaria: val,
                              id_pt: val 
                            } 
                          });
                        }} 
                        placeholder="Ex: 2001990636" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Concessão / Operador</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.concessao_operador} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, concessao_operador: e.target.value } })} placeholder="Ex: ENDE / EP" />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Proprietário / Titular do Ativo</label>
                       <select 
                         className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold"
                         value={formData.identificacao.id_proprietario}
                         onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, id_proprietario: e.target.value } })}
                       >
                         <option value="">Selecione um proprietário...</option>
                         {proprietarios.map(p => (
                           <option key={p.id} value={p.id}>{p.nome}</option>
                         ))}
                       </select>
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Localização / Morada Completa</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.morada} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, morada: e.target.value } })} />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Freguesia / Comuna</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.freguesia} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, freguesia: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Concelho / Município</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.concelho} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, concelho: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Distrito / Província</label>
                       <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.provincia} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, provincia: e.target.value } })}>
                          {['Luanda', 'Bengo', 'Benguela', 'Cabinda', 'Cunene', 'Huambo', 'Huíla', 'Kuando Kubango', 'Kwanza Norte', 'Kwanza Sul', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'].map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Latitude</label>
                       <input type="number" step="any" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.latitude} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, latitude: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Longitude</label>
                       <input type="number" step="any" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.longitude} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, longitude: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Altitude (m)</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.altitude} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, altitude: e.target.value } })} />
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Dados de GPS Original (Texto Livre)</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.gps} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, gps: e.target.value } })} placeholder="Ex: -9.0194, 13.3591 SE KKX D3" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Data do Levantamento</label>
                       <input type="date" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.data_levantamento} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, data_levantamento: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Técnico Responsável</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.tecnico_levantamento} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, tecnico_levantamento: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">N.º de Habilitação</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.num_habilitacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, num_habilitacao: e.target.value } })} />
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-orange-50 rounded-2xl flex items-start gap-4 border border-orange-100">
                     <FileText className="w-5 h-5 text-orange-400 mt-0.5" />
                     <p className="text-[11px] font-bold text-orange-600 leading-relaxed">
                       👉 Isto é governança + rastreabilidade. Sem isso, o PT “não existe” oficialmente.
                     </p>
                  </div>
                </div>
              )}

              {/* Secção 2: Transformador */}
              {activeTab === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Potência Nominal (kVA)</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.potencia_kva} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, potencia_kva: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão AT (kV)</label>
                       <input type="number" step="any" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.tensao_primaria} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tensao_primaria: e.target.value } })} placeholder="Ex: 15 ou 30" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão BT (V)</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.tensao_secundaria} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tensao_secundaria: e.target.value } })} placeholder="Ex: 400" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nível de Isolamento (kV)</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.nivel_isolamento} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, nivel_isolamento: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Ucc (%)</label>
                       <input type="number" step="any" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.ucc} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, ucc: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Frequência (Hz)</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.frequencia} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, frequencia: e.target.value } })} />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Número de Série</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.numero_serie} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, numero_serie: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Marca / Fabricante</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.fabricante} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, fabricante: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Ano de Fabrico</label>
                       <input type="number" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.ano_fabrico} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, ano_fabrico: e.target.value } })} />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Grupo de Ligação</label>
                       <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.grupo_ligacao} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, grupo_ligacao: e.target.value } })} placeholder="Ex: Dyn11" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Arrefecimento</label>
                       <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.tipo_arrefecimento} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tipo_arrefecimento: e.target.value } })}>
                          <option value="">-- Seleccionar --</option>
                          <option value="ONAN">ONAN (Óleo Natural)</option>
                          <option value="Hermético">Hermético (Selado)</option>
                          <option value="AN">AN (Seco Natural)</option>
                          <option value="AF">AF (Seco com Ventilação)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Isolamento</label>
                        <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.transformador.tipo_isolamento} onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tipo_isolamento: e.target.value } })}>
                           <option value="Óleo Mineral">Óleo Mineral</option>
                           <option value="Resina (Seco)">Resina (Seco)</option>
                           <option value="Silicone">Silicone</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-red-50 rounded-2xl flex items-start gap-4 border border-red-100">
                     <Settings className="w-5 h-5 text-red-400 mt-0.5" />
                     <p className="text-[11px] font-bold text-red-600 leading-relaxed">
                       👉 Esse bloco define o “coração do PT”. Se isso falha, tudo para.
                     </p>
                  </div>
                </div>
              )}

              {/* Secção 3: Suporte — Poste */}
              {activeTab === 3 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Poste</label>
                          <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.tipo_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_poste: e.target.value } })} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Referência / Tipo</label>
                          <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.ref_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, ref_poste: e.target.value } })} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Altura (m)</label>
                          <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.altura_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, altura_poste: e.target.value } })} />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Esforço Nominal (daN)</label>
                          <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.esforco_poste_dan} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, esforco_poste_dan: e.target.value } })} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Ano de Instalação</label>
                          <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.ano_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, ano_poste: e.target.value } })} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado do Poste</label>
                          <select className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.estado_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, estado_poste: e.target.value } })}>
                             <option value="Muito Bom">Muito Bom</option>
                             <option value="Bom">Bom</option>
                             <option value="Razoável">Razoável</option>
                             <option value="Mau">Mau</option>
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Material</label>
                          <select className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.material_poste} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, material_poste: e.target.value } })}>
                             <option value="">-- Seleccionar --</option>
                             <option value="Betão">Betão</option>
                             <option value="Metálico">Metálico</option>
                             <option value="Madeira">Madeira</option>
                          </select>
                       </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-[#c4c5d7]/10">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-6 block">Equipamentos no Topo</label>
                       <div className="flex flex-wrap gap-8">
                          {[
                            { key: 'interruptor', label: 'Interruptor MT' },
                            { key: 'seccionador', label: 'Seccionador' },
                            { key: 'para_raios', label: 'Para-raios' },
                            { key: 'amarracao', label: 'Amarração de Linha' }
                          ].map(item => (
                            <label key={item.key} className="flex items-center gap-4 cursor-pointer group">
                               <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.identificacao.equipamento_poste?.[item.key] ? 'bg-[#0d3fd1] border-[#0d3fd1] shadow-lg shadow-[#0d3fd1]/20' : 'bg-white border-[#c4c5d7]/30 group-hover:border-[#0d3fd1]/40'}`}>
                                  {formData.identificacao.equipamento_poste?.[item.key] && <Zap className="w-3 h-3 text-white" />}
                               </div>
                               <input type="checkbox" className="hidden" checked={formData.identificacao.equipamento_poste?.[item.key]} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, equipamento_poste: { ...formData.identificacao.equipamento_poste, [item.key]: e.target.checked } } })} />
                               <span className="text-[10px] font-black text-[#444655] uppercase tracking-tight">{item.label}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-2xl flex items-start gap-4 border border-yellow-100">
                     <HardDrive className="w-5 h-5 text-yellow-400 mt-0.5" />
                     <p className="text-[11px] font-bold text-yellow-600 leading-relaxed">
                       👉 Aqui avalias risco estrutural. Poste ruim = perigo real.
                     </p>
                  </div>
                </div>
              )}

              {/* Secção 4: Cabine / Invólucro */}
              {activeTab === 4 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Cabine</label>
                        <select className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.tipo_cabine} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, tipo_cabine: e.target.value } })}>
                          <option value="">-- Seleccionar --</option>
                          <option value="Pré-fabricada (betão)">Pré-fabricada (Betão)</option>
                          <option value="Alvenaria">Alvenaria</option>
                          <option value="Container metálico">Container Metálico</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Dimensões (CxL - m)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Dim. A" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.dim_comprimento} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, dim_comprimento: e.target.value } })} />
                          <span className="font-bold text-[#c4c5d7]">x</span>
                          <input type="number" placeholder="Dim. B" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.identificacao.dim_largura} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, dim_largura: e.target.value } })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-4 border border-gray-100">
                    <Database className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                      👉 Define proteção física e acessibilidade.
                    </p>
                  </div>
                </div>
              )}

              {/* Secção 5: Celas de Média Tensão */}
              {activeTab === 5 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center bg-[#f8faff] p-6 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-[#0d3fd1]" />
                      <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Secção 5: Celas de Média Tensão</h4>
                    </div>
                    <button type="button" onClick={initializeMTCells} className="bg-[#eff4ff] text-[#0d3fd1] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-all">
                      Gerar Template de Celas
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-[#c4c5d7]/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#1a2533] text-white/50 text-[9px] font-black uppercase tracking-widest">
                          <th className="px-6 py-4">Nº</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Tipo / Fabricante</th>
                          <th className="px-6 py-4">In (A)</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c4c5d7]/10 text-sm">
                        {formData.media_tensao.celas?.map((cela, idx) => (
                          <tr key={idx} className="bg-white hover:bg-[#f8faff] transition-all">
                            <td className="px-6 py-4 font-bold text-[#0f1c2c]">{cela.num}</td>
                            <td className="px-6 py-4">
                              <select className="bg-transparent border-none text-[13px] font-bold text-[#0d3fd1] outline-none" value={cela.funcao} onChange={(e) => {
                                const newCelas = [...formData.media_tensao.celas];
                                newCelas[idx].funcao = e.target.value;
                                setFormData({ ...formData, media_tensao: { ...formData.media_tensao, celas: newCelas } });
                              }}>
                                <option value="Entrada">Entrada</option>
                                <option value="Saída">Saída</option>
                                <option value="Proteção">Proteção</option>
                                <option value="Medição">Medição</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" className="w-full bg-transparent border-none text-[13px] font-bold outline-none" value={cela.tipo_fabricante} onChange={(e) => {
                                const newCelas = [...formData.media_tensao.celas];
                                newCelas[idx].tipo_fabricante = e.target.value;
                                setFormData({ ...formData, media_tensao: { ...formData.media_tensao, celas: newCelas } } );
                              }} />
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" className="w-20 bg-transparent border-none text-[13px] font-bold outline-none" value={cela.corrente_nominal} onChange={(e) => {
                                const newCelas = [...formData.media_tensao.celas];
                                newCelas[idx].corrente_nominal = e.target.value;
                                setFormData({ ...formData, media_tensao: { ...formData.media_tensao, celas: newCelas } } );
                              }} />
                            </td>
                            <td className="px-6 py-4">
                              <select className="bg-transparent border-none text-[13px] font-bold text-[#0d3fd1] outline-none" value={cela.estado} onChange={(e) => {
                                const newCelas = [...formData.media_tensao.celas];
                                newCelas[idx].estado = e.target.value;
                                setFormData({ ...formData, media_tensao: { ...formData.media_tensao, celas: newCelas } } );
                              }}>
                                <option value="Operacional">Operacional</option>
                                <option value="Não Operacional">Não Operacional</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button type="button" onClick={() => {
                                const newCelas = formData.media_tensao.celas.filter((_, i) => i !== idx);
                                setFormData({ ...formData, media_tensao: { ...formData.media_tensao, celas: newCelas } } );
                              }} className="text-red-400 hover:text-red-600 transition-colors">
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-2xl flex items-start gap-4 border border-indigo-100">
                    <Zap className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
                      👉 Isso é o “quadro de comando” da média tensão.
                    </p>
                  </div>
                </div>
              )}

              {/* Secção 6: Quadro Geral de Baixa Tensão (QGBT) */}
              {activeTab === 6 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Fabricante</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.fabricante_qgbt} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, fabricante_qgbt: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Corrente Nominal Saída (A)</label>
                        <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.corrente_nominal_saida} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, corrente_nominal_saida: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">N.º de Saídas BT</label>
                        <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.num_saidas_bt} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, num_saidas_bt: e.target.value } })} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Transf. de Corrente (TC)</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.transformador_corrente} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, transformador_corrente: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Corrente Nominal Geral (A)</label>
                        <input type="number" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.corrente_nominal_geral} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, corrente_nominal_geral: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Neutro</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.baixa_tensao.tipo_ligacao_neutro} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, tipo_ligacao_neutro: e.target.value } })} placeholder="Ex: TN-S, IT, TT" />
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-[#c4c5d7]/10">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-6 block">Componentes</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { key: 'disjuntor_geral', label: 'Disjuntor Geral' },
                          { key: 'fusiveis_gerais', label: 'Fusíveis' },
                          { key: 'contagem_bt', label: 'Contagem' },
                          { key: 'telecontagem', label: 'Telecontagem' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-4 p-4 bg-white border border-[#c4c5d7]/20 rounded-2xl cursor-pointer hover:border-[#0d3fd1]/40 transition-all">
                            <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]" checked={formData.baixa_tensao[item.key]} onChange={(e) => setFormData({ ...formData, baixa_tensao: { ...formData.baixa_tensao, [item.key]: e.target.checked } })} />
                            <span className="text-[10px] font-black text-[#444655] uppercase tracking-tight">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl flex items-start gap-4 border border-emerald-100">
                    <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <p className="text-[11px] font-bold text-emerald-600 leading-relaxed">
                      👉 Aqui é onde a energia vira “distribuição real”.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 7 && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Físico (Paredes/Tecto)</label>
                       <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.infraestrutura.estado_paredes} onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, estado_paredes: e.target.value } })}>
                          <option value="Bom">Bom</option>
                          <option value="Degradado">Degradado</option>
                          <option value="Fissuras">Com Fissuras</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado Portas / Acessos</label>
                       <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.infraestrutura.estado_portas} onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, estado_portas: e.target.value } })}>
                          <option value="Bom">Bom / Fechado</option>
                          <option value="Avariado">Fechaduras Avariadas</option>
                          <option value="Inexistente">Sem Porta</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { key: 'ventilacao', label: 'Ventilação Adequada' },
                      { key: 'iluminacao_interior', label: 'Iluminação Interior' },
                      { key: 'iluminacao_exterior', label: 'Iluminação Exterior' },
                      { key: 'drenagem_oleo', label: 'Bacia / Drenagem Óleo' }
                    ].map(item => (
                      <label key={item.key} className="flex flex-col items-start gap-4 p-6 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-2xl cursor-pointer hover:bg-[#eff4ff] transition-all">
                        <span className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{item.label}</span>
                        <input type="checkbox" className="w-6 h-6 rounded-lg border-[#c4c5d7] text-[#d15f0d]" checked={formData.infraestrutura[item.key]} onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, [item.key]: e.target.checked } })} />
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Outras Notas de Infraestrutura</label>
                    <textarea className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-3xl py-4 px-6 text-sm font-bold min-h-[100px]" value={formData.infraestrutura.observacoes} onChange={(e) => setFormData({ ...formData, infraestrutura: { ...formData.infraestrutura, observacoes: e.target.value } })} />
                  </div>
                </div>
              )}

              {/* Secção 7: Proteção e Ligação à Terra */}
              {activeTab === 7 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Resistência de Terra (ohm)</label>
                        <input type="number" step="any" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.seguranca.resistencia_terra} onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, resistencia_terra: e.target.value } })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Data da Medição</label>
                        <input type="date" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.seguranca.data_ultima_medicao} onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, data_ultima_medicao: e.target.value } })} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Relé de Proteção</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.seguranca.rele_protecao_marca} onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, rele_protecao_marca: e.target.value } })} placeholder="Ex: Siemens / ABB / Schneider" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Fusíveis MT (A)</label>
                        <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold" value={formData.seguranca.fusiveis_mt_calibre} onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, fusiveis_mt_calibre: e.target.value } })} />
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-[#c4c5d7]/10">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-6 block">Tipo de Proteção</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { key: 'protecao_sobrecorrente', label: 'Sobrecorrente' },
                          { key: 'protecao_neutro', label: 'Neutro' },
                          { key: 'protecao_diferencial', label: 'Diferencial' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-4 p-4 bg-white border border-[#c4c5d7]/20 rounded-2xl cursor-pointer hover:border-[#0d3fd1]/40 transition-all">
                            <input type="checkbox" className="w-5 h-5 rounded border-[#c4c5d7] text-[#0d3fd1]" checked={formData.seguranca[item.key]} onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, [item.key]: e.target.checked } })} />
                            <span className="text-[10px] font-black text-[#444655] uppercase tracking-tight">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-4 border border-blue-100">
                    <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-600 leading-relaxed">
                      👉 Sem aterramento decente, as proteções perdem eficácia.
                    </p>
                  </div>
                </div>
              )}

              {/* Secção 8: Observações / Anomalias */}
              {activeTab === 8 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#f8faff] p-8 rounded-3xl border border-[#c4c5d7]/20 space-y-8">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Registo de Defeitos, Riscos e Melhorias</h4>
                    </div>
                    <textarea className="w-full bg-white border border-[#c4c5d7]/30 rounded-3xl py-6 px-8 text-sm font-bold min-h-[300px] leading-relaxed outline-none focus:ring-1 focus:ring-[#0d3fd1]/30 transition-all" value={formData.identificacao.observacoes_gerais} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, observacoes_gerais: e.target.value } })} placeholder="Descreva aqui todas as anomalias, riscos observados e sugestões de melhoria técnica..." />
                  </div>

                  <div className="p-4 bg-orange-50 rounded-2xl flex items-start gap-4 border border-orange-100">
                    <Activity className="w-5 h-5 text-orange-400 mt-0.5" />
                    <p className="text-[11px] font-bold text-orange-600 leading-relaxed">
                      👉 Aqui entra a inteligência do técnico. É o diagnóstico final.
                    </p>
                  </div>
                </div>
              )}

              {/* Secção 9: Validação e Assinaturas */}
              {activeTab === 9 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#fcfdff] p-10 rounded-3xl border border-[#c4c5d7]/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Técnico */}
                      <div className="space-y-6">
                        <div className="p-4 bg-[#eff4ff] rounded-2xl inline-flex items-center gap-3">
                          <Users className="w-4 h-4 text-[#0d3fd1]" />
                          <span className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Técnico de Levantamento</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Nome Completo</label>
                          <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.tecnico_levantamento} readOnly />
                        </div>
                        <div className="w-full h-32 bg-[#f8faff] border border-dashed border-[#c4c5d7]/40 rounded-2xl flex flex-col items-center justify-center gap-2">
                          <Camera className="w-6 h-6 text-[#c4c5d7]" />
                          <span className="text-[9px] font-black text-[#c4c5d7] uppercase tracking-widest text-center px-4">Área reservada para Assinatura + Carimbo</span>
                        </div>
                      </div>

                      {/* Supervisor */}
                      <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl inline-flex items-center gap-3">
                          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Responsável / Supervisor</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Nome Completo</label>
                          <input type="text" className="w-full bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.supervisor_obra} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, supervisor_obra: e.target.value } })} />
                        </div>
                        <div className="w-full h-32 bg-[#f8faff] border border-dashed border-[#c4c5d7]/40 rounded-2xl flex flex-col items-center justify-center gap-2">
                          <Camera className="w-6 h-6 text-[#c4c5d7]" />
                          <span className="text-[9px] font-black text-[#c4c5d7] uppercase tracking-widest text-center px-4">Área reservada para Assinatura + Carimbo</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-[#c4c5d7]/10">
                      <div className="space-y-2 w-full md:w-auto">
                        <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest ml-1">Data de Validação Oficial</label>
                        <input type="date" className="w-full md:w-64 bg-white border border-[#c4c5d7]/30 rounded-xl py-3 px-5 text-xs font-bold" value={formData.identificacao.data_validacao} onChange={(e) => setFormData({ ...formData, identificacao: { ...formData.identificacao, data_validacao: e.target.value } })} />
                      </div>
                      <div className="flex items-center gap-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">Estado da Ficha Técnica</p>
                          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">Validada e Pronta para Relatório</p>
                        </div>
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
