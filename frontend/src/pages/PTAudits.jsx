import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Zap,
  Shield,
  Settings,
  Eye,
  Save,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Edit2
} from 'lucide-react';
import api from '../services/api';

export default function PTAudits() {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [subView, setSubView] = useState('inspecoes'); // 'inspecoes' or 'tarefas'
  const [step, setStep] = useState(1);
  const [pts, setPts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [formData, setFormData] = useState({
    id_pt: '',
    tipo: 'Preventiva',
    data_inspecao: new Date().toISOString().split('T')[0],
    observacoes: '',
    conformidade: {
      licenciamento: false,
      projeto_aprovado: false,
      diagramas_unifilares: false,
      plano_manutencao: false,
      registos_inspecao: false,
      normas_iec: false,
      normas_ieee: false,
      normas_locais: false
    },
    transformador: {
      num_transformador: 1,
      potencia_kva: 630,
      tensao_primaria: 15,
      tensao_secundaria: 0.4,
      tipo_isolamento: 'Oleo',
      estado_oleo: 'Bom',
      fugas: false,
      temperatura_operacao: 45
    },
    seguranca: {
      resistencia_terra: 2.5,
      protecao_raios: false,
      spd: false,
      sinalizacao: false,
      combate_incendio: false,
      distancias_seguranca: false
    },
    risco: {
      nivel_risco_geral: 'Baixo',
      sobrecarga: false,
      desequilibrio_fases: false,
      falhas_isolamento: false,
      redundancia: false
    }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [ptsRes, auditsRes, tarefasRes] = await Promise.all([
          api.get('/pts'),
          api.get('/inspecoes'),
          api.get('/tarefas').catch(() => ({ data: [] }))
        ]);
        setPts(ptsRes.data);
        setAudits(auditsRes.data);
        setTarefas(tarefasRes.data ? tarefasRes.data.filter(t => t.status === 'Concluída') : []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Formating data for nested Prisma create/update
      const payload = {
        ...formData,
        transformadores: [formData.transformador], // Repository expects array
        riscos: [formData.risco]
      };

      if (selectedAuditId) {
        await api.put(`/inspecoes/${selectedAuditId}`, payload);
        alert('Auditoria atualizada com sucesso!');
      } else {
        await api.post('/inspecoes', payload);
        alert('Auditoria registada com sucesso!');
      }
      
      setView('list');
      setStep(1);
      setSelectedAuditId(null);
    } catch (err) {
      alert('Erro ao processar auditoria: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta auditoria?')) return;
    try {
      await api.delete(`/inspecoes/${id}`);
      setAudits(audits.filter(a => a.id !== id));
      alert('Auditoria eliminada com sucesso.');
    } catch (err) {
      alert('Erro ao eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleView = async (audit) => {
    try {
      const res = await api.get(`/inspecoes/${audit.id}`);
      const fullAudit = res.data;
      
      setFormData({
        id_pt: fullAudit.id_pt,
        tipo: fullAudit.tipo,
        data_inspecao: fullAudit.data_inspecao.split('T')[0],
        observacoes: fullAudit.observacoes || '',
        conformidade: fullAudit.conformidade?.[0] || formData.conformidade,
        transformador: fullAudit.transformadores?.[0] || formData.transformador,
        seguranca: fullAudit.seguranca?.[0] || formData.seguranca
      });
      
      setSelectedAuditId(fullAudit.id);
      setStep(5);
      setView('form');
    } catch (err) {
      alert('Erro ao carregar detalhes: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = async (audit) => {
    try {
      const res = await api.get(`/inspecoes/${audit.id}`);
      const fullAudit = res.data;
      
      setFormData({
        id_pt: fullAudit.id_pt,
        tipo: fullAudit.tipo,
        data_inspecao: fullAudit.data_inspecao.split('T')[0],
        observacoes: fullAudit.observacoes || '',
        conformidade: fullAudit.conformidade?.[0] || formData.conformidade,
        transformador: fullAudit.transformadores?.[0] || formData.transformador,
        seguranca: fullAudit.seguranca?.[0] || formData.seguranca
      });
      
      setSelectedAuditId(fullAudit.id);
      setStep(1);
      setView('form');
    } catch (err) {
      alert('Erro ao carregar para edição: ' + (err.response?.data?.error || err.message));
    }
  };

  const steps = [
    { title: 'Identificação', icon: Info },
    { title: 'Conformidade', icon: ClipboardCheck },
    { title: 'Transformador', icon: Zap },
    { title: 'Segurança', icon: Shield },
    { title: 'Revisão', icon: Eye }
  ];

  if (view === 'list') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 items-center">
            <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Relatório de Atividades</h2>
            <div className="bg-[#f8faff] rounded-xl p-1 border border-[#c4c5d7]/20 flex">
              <button 
                onClick={() => setSubView('inspecoes')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${subView === 'inspecoes' ? 'bg-white text-[#0d3fd1] shadow-sm' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
              >
                Inspeções PT
              </button>
              <button 
                onClick={() => setSubView('tarefas')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${subView === 'tarefas' ? 'bg-white text-[#005229] shadow-sm' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
              >
                Tarefas Concluídas
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedAuditId(null);
              setFormData({
                id_pt: '',
                tipo: 'Preventiva',
                data_inspecao: new Date().toISOString().split('T')[0],
                observacoes: '',
                conformidade: {
                  licenciamento: false,
                  projeto_aprovado: false,
                  diagramas_unifilares: false,
                  plano_manutencao: false,
                  registos_inspecao: false,
                  normas_iec: false,
                  normas_ieee: false,
                  normas_locais: false
                },
                transformador: {
                  num_transformador: 1,
                  potencia_kva: 630,
                  tensao_primaria: 15,
                  tensao_secundaria: 0.4,
                  tipo_isolamento: 'Oleo',
                  estado_oleo: 'Bom',
                  fugas: false,
                  temperatura_operacao: 45
                },
                seguranca: {
                  resistencia_terra: 2.5,
                  protecao_raios: false,
                  spd: false,
                  sinalizacao: false,
                  combate_incendio: false,
                  distancias_seguranca: false
                }
              });
              setView('form');
              setStep(1);
            }}
            className="flex items-center gap-2 bg-[#0d3fd1] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10"
          >
            <Plus className="w-4 h-4" />
            Nova Auditoria
          </button>
        </div>

        {subView === 'inspecoes' ? (
          <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8faff] border-b border-[#c4c5d7]/20">
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center">PT ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Proprietário</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Data da Auditoria</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Subestação</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c5d7]/10">
                {audits.map((audit, idx) => (
                  <tr key={audit.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdff]'} hover:bg-[#eff4ff] transition-colors group`}>
                    <td className="px-8 py-5 text-sm font-bold text-[#0f1c2c] border-r border-[#c4c5d7]/10 text-center font-mono">
                      {audit.id_pt}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#444655] border-r border-[#c4c5d7]/10">
                      {audit.pt?.proprietario || 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-[#c4c5d7]/10 font-mono">
                      {new Date(audit.data_inspecao).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] capitalize tracking-tighter border-r border-[#c4c5d7]/10">
                      {audit.pt?.subestacao?.nome || 'Sekele'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleView(audit)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#eff4ff] text-[#0d3fd1] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-all"
                        >
                          Abrir
                        </button>
                        <button 
                          onClick={() => handleEdit(audit)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4c5d7]/30 text-[#444655] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#f8faff] transition-all"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(audit.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4c5d7]/30 text-[#444655] rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all"
                        >
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                      Nenhuma auditoria registada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Auditor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Tarefa/PT</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Início</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Fim (Conclusão)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] text-center">Relatório Tarefa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/50">
                {tarefas.map((tarefa, idx) => (
                  <tr key={tarefa.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'} hover:bg-emerald-50 transition-colors group`}>
                    <td className="px-8 py-5 text-sm font-bold text-[#0f1c2c] border-r border-emerald-50">
                      {tarefa.auditor?.nome || 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#444655] border-r border-emerald-50">
                      {tarefa.titulo} {tarefa.id_pt && `(PT: ${tarefa.id_pt})`}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-emerald-50 font-mono">
                      {tarefa.data_inicio ? new Date(tarefa.data_inicio).toLocaleString('pt-PT') : '-'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-emerald-50 font-mono">
                      {tarefa.data_fim ? new Date(tarefa.data_fim).toLocaleString('pt-PT') : '-'}
                    </td>
                    <td className="px-8 py-5">
                       <span className="flex justify-center text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-3 py-1 rounded-md max-w-max mx-auto">
                        Validado Checklist: {tarefa.checklist?.filter(c => c.checked).length || 0}/{tarefa.checklist?.length || 0}
                       </span>
                    </td>
                  </tr>
                ))}
                {tarefas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                      Nenhuma tarefa de auditoria concluída
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-3 bg-white border border-[#c4c5d7]/20 rounded-xl hover:bg-[#eff4ff] transition-all">
            <ArrowLeft className="w-5 h-5 text-[#444655]" />
          </button>
          <div>
            <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Nova Auditoria Técnica</h2>
            <p className="text-sm text-[#747686] font-medium opacity-60">Protocolo de inspeção detalhada de PT</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] mb-1 block">Progresso do Protocolo</span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step > i ? 'bg-[#5fff9b]' : 'bg-[#c4c5d7]/30'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="bg-[#243141] px-10 py-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0d3fd1] rounded-xl shadow-lg">
              {React.createElement(steps[step - 1].icon, { className: "w-5 h-5 text-[#5fff9b]" })}
            </div>
            <div>
              <span className="text-[10px] font-black text-[#5fff9b] uppercase tracking-widest opacity-80">Etapa {step} de 5</span>
              <h3 className="text-white text-lg font-bold uppercase tracking-tight">{steps[step - 1].title}</h3>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 flex-grow flex flex-col">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Selecionar Posto (PT)</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                    value={formData.id_pt}
                    onChange={(e) => setFormData({ ...formData, id_pt: e.target.value })}
                    required
                  >
                    <option value="">Escolha um PT...</option>
                    {pts.map(pt => (
                      <option key={pt.id_pt} value={pt.id_pt}>{pt.id_pt} - {pt.subestacao?.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Tipo de Inspeção</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="Preventiva">Preventiva</option>
                    <option value="Corretiva">Corretiva</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="md:col-span-2 mb-4">
                <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest bg-[#eff4ff] px-4 py-2 rounded-lg inline-block">Licenciamento e Normas</h4>
              </div>
              {[
                { key: 'licenciamento', label: 'Licença de Exploração DGE' },
                { key: 'projeto_aprovado', label: 'Projeto Elétrico Aprovado' },
                { key: 'diagramas_unifilares', label: 'Diagramas Unifilares no Local' },
                { key: 'plano_manutencao', label: 'Plano de Manutenção Ativo' },
                { key: 'registos_inspecao', label: 'Registos de Inspeção em Dia' },
                { key: 'normas_iec', label: 'Conformidade IEC' },
                { key: 'normas_ieee', label: 'Conformidade IEEE' },
                { key: 'normas_locais', label: 'Normas de Distribuição Local' }
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-5 bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl cursor-pointer hover:bg-[#eff4ff] transition-all group">
                  <span className="text-[11px] font-bold text-[#444655] uppercase tracking-tight group-hover:text-[#0d3fd1] transition-colors">{item.label}</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-[#c4c5d7] text-[#0d3fd1] focus:ring-[#0d3fd1]"
                    checked={formData.conformidade[item.key]}
                    onChange={(e) => setFormData({ ...formData, conformidade: { ...formData.conformidade, [item.key]: e.target.checked } })}
                  />
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Potência Nominal (kVA)</label>
                <input
                  type="number"
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                  value={formData.transformador.potencia_kva}
                  onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, potencia_kva: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Tipo de Isolação</label>
                <select
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                  value={formData.transformador.tipo_isolamento}
                  onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, tipo_isolamento: e.target.value } })}
                >
                  <option value="Oleo">Óleo Mineral</option>
                  <option value="Seco">Resina (Seco)</option>
                  <option value="Silicone">Silicone</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Estado do Óleo / Resina</label>
                <select
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                  value={formData.transformador.estado_oleo}
                  onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, estado_oleo: e.target.value } })}
                >
                  <option value="Bom">Bom</option>
                  <option value="Aceitável">Aceitável</option>
                  <option value="Degradado">Degradado / Substituir</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Temperatura de Operação (ºC)</label>
                <input
                  type="number"
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                  value={formData.transformador.temperatura_operacao}
                  onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, temperatura_operacao: Number(e.target.value) } })}
                />
              </div>
              <label className="flex items-center justify-between p-5 bg-[#fcfdff] border border-[#c4c5d7]/10 rounded-2xl cursor-pointer hover:bg-white transition-all shadow-sm">
                <span className="text-[11px] font-black text-[#444655] uppercase tracking-widest">Sinais de Fugas?</span>
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-lg border-[#c4c5d7] text-red-500"
                  checked={formData.transformador.fugas}
                  onChange={(e) => setFormData({ ...formData, transformador: { ...formData.transformador, fugas: e.target.checked } })}
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Resistência de Terra (Ω)</label>
                <input
                  type="number"
                  className="w-full max-w-xs bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                  value={formData.seguranca.resistencia_terra}
                  onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, resistencia_terra: Number(e.target.value) } })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'protecao_raios', label: 'Proteção Raios' },
                  { key: 'spd', label: 'Descarregadores (SPD)' },
                  { key: 'sinalizacao', label: 'Sinalização Perigo' },
                  { key: 'combate_incendio', label: 'Extintores / CO2' },
                  { key: 'distancias_seguranca', label: 'Distâncias Mínimas' }
                ].map((item) => (
                  <label key={item.key} className="flex flex-col items-start gap-4 p-6 bg-white border border-[#c4c5d7]/10 rounded-[2rem] cursor-pointer hover:border-[#0d3fd1]/40 transition-all shadow-sm text-center">
                    <Shield className={`w-8 h-8 ${formData.seguranca[item.key] ? 'text-[#00e47c]' : 'text-[#747686]/30'} mx-auto`} />
                    <span className="text-[10px] font-black text-[#444655] uppercase tracking-widest mx-auto">{item.label}</span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.seguranca[item.key]}
                      onChange={(e) => setFormData({ ...formData, seguranca: { ...formData.seguranca, [item.key]: e.target.checked } })}
                    />
                    <div className={`w-full h-1 rounded-full ${formData.seguranca[item.key] ? 'bg-[#00e47c]' : 'bg-[#c4c5d7]/20'}`}></div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-[#eff4ff] p-8 rounded-3xl border border-[#0d3fd1]/10">
                <h4 className="text-sm font-black text-[#0d3fd1] uppercase tracking-tight mb-6">Resumo da Inspeção</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Posto Alvo</span>
                    <p className="text-sm font-black text-[#0f1c2c]">{formData.id_pt || 'Não selecionado'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Tipo Protocolo</span>
                    <p className="text-sm font-black text-[#0f1c2c]">{formData.tipo}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Data</span>
                    <p className="text-sm font-black text-[#0f1c2c]">{formData.data_inspecao}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Observações Finais</label>
                <textarea
                  className="w-full h-40 bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl py-6 px-8 text-sm font-medium text-[#444655] resize-none"
                  placeholder="Descreva as conclusões técnicas da auditoria..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <p className="text-xs font-bold text-yellow-800 uppercase tracking-tight leading-relaxed">
                  Ao salvar, estes dados serão vinculados permanentemente ao histórico do PT. Verifique a precisão das informações técnicas.
                </p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-10 flex justify-between border-t border-[#c4c5d7]/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-8 py-3.5 bg-white border border-[#c4c5d7]/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655]"
              >
                Voltar
              </button>
            ) : <div></div>}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!formData.id_pt && step === 1}
                className="flex items-center gap-2 px-10 py-3.5 bg-[#0d3fd1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10 disabled:opacity-30"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-10 py-3.5 bg-[#00e47c] text-[#005229] rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Salvar Auditoria
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
