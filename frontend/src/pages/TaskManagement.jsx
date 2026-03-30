import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, User, MapPin, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TaskManagement() {
  const [tarefas, setTarefas] = useState([]);
  const [auditores, setAuditores] = useState([]);
  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    titulo: '',
    descricao: '',
    id_auditor: '',
    id_pt: '',
    data_prevista: new Date().toISOString().split('T')[0],
    checklist: []
  });
  const [novoChecklistItem, setNovoChecklistItem] = useState('');

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [resTarefas, resAuditores, resPts] = await Promise.all([
        api.get('/tarefas'),
        api.get('/utilizadores'),
        api.get('/pts')
      ]);
      setTarefas(resTarefas.data);
      // Filtrar para mostrar apenas quem tem role auditor (ou todos se preferir, aqui filtramos auditores)
      setAuditores(resAuditores.data.filter(u => u.role === 'auditor' || u.role === 'admin'));
      setPts(resPts.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados essenciais para tarefas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleOpenModal = (tarefa = null) => {
    if (tarefa) {
      setFormData({
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        id_auditor: tarefa.id_auditor,
        id_pt: tarefa.id_pt || '',
        data_prevista: tarefa.data_prevista.split('T')[0],
        checklist: tarefa.checklist || []
      });
    } else {
      setFormData({
        id: null,
        titulo: '',
        descricao: '',
        id_auditor: '',
        id_pt: '',
        data_prevista: new Date().toISOString().split('T')[0],
        checklist: []
      });
    }
    setNovoChecklistItem('');
    setIsModalOpen(true);
  };

  const handleAddChecklist = () => {
    if (!novoChecklistItem.trim()) return;
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: Date.now(), label: novoChecklistItem, checked: false }]
    }));
    setNovoChecklistItem('');
  };

  const handleRemoveChecklist = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        id_auditor: Number(formData.id_auditor),
        data_prevista: formData.data_prevista,
        checklist: formData.checklist
      };
      if (formData.id_pt) payload.id_pt = formData.id_pt;

      if (formData.id) {
        await api.put(`/tarefas/${formData.id}`, payload);
      } else {
        await api.post('/tarefas', payload);
      }
      
      setIsModalOpen(false);
      fetchDados();
    } catch (err) {
      alert('Erro ao salvar tarefa');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta tarefa permanentemente?')) return;
    try {
      await api.delete(`/tarefas/${id}`);
      fetchDados();
    } catch (err) {
      alert('Erro ao eliminar tarefa. Verifique dependências.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Concluída': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Concluída</span>;
      case 'Em Andamento': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Em Andamento</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Pendente</span>;
    }
  };

  const filteredTarefas = activeTab === 'completed'
    ? tarefas.filter(t => t.status === 'Concluída')
    : tarefas;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-3xl font-black uppercase tracking-tighter">Gestão de Tarefas</h2>
          <p className="text-sm font-bold text-[#747686] opacity-60 mt-1 uppercase tracking-widest">
            Atribuição de auditorias e ordens de serviço
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0d3fd1] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-xl shadow-[#0d3fd1]/10"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-[#c4c5d7]/20">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'all'
              ? 'border-[#0d3fd1] text-[#0d3fd1]'
              : 'border-transparent text-[#747686] hover:text-[#444655]'
          }`}
        >
          Todas as Tarefas ({tarefas.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'completed'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-[#747686] hover:text-[#444655]'
          }`}
        >
          Tarefas Concluídas ({tarefas.filter(t => t.status === 'Concluída').length})
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#747686] font-bold">Carregando tarefas...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faff] border-b border-[#c4c5d7]/20">
                <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/4">Tarefa</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Técnico</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Data Prevista</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] text-center w-1/6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/10">
              {filteredTarefas.map((tarefa, i) => (
                <tr key={tarefa.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#fcfdff]'} hover:bg-[#eff4ff] transition-colors`}>
                  <td className="px-8 py-5 border-r border-[#c4c5d7]/10">
                    <div className="space-y-1">
                      <p className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">{tarefa.titulo}</p>
                      {tarefa.id_pt && (
                        <p className="text-xs text-[#0d3fd1] font-bold bg-[#0d3fd1]/5 inline-flex p-1 rounded">
                          <MapPin className="w-3 h-3 mr-1 inline" /> PT: {tarefa.id_pt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 border-r border-[#c4c5d7]/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#e1e4ef] flex items-center justify-center text-[#444655] font-black text-xs">
                        {tarefa.auditor?.nome?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-[#444655] text-sm">{tarefa.auditor?.nome}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 border-r border-[#c4c5d7]/10 text-center font-mono text-sm text-[#747686]">
                    {new Date(tarefa.data_prevista).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-8 py-5 border-r border-[#c4c5d7]/10 text-center">
                    {getStatusBadge(tarefa.status)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleOpenModal(tarefa)} className="p-2 text-[#444655] bg-white border border-[#c4c5d7]/30 rounded-lg hover:bg-[#f8faff] hover:text-[#0d3fd1] transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tarefa.id)} className="p-2 text-[#444655] bg-white border border-[#c4c5d7]/30 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTarefas.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                    {activeTab === 'completed' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa atribuída'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-[#c4c5d7]/20 flex justify-between items-center bg-[#f8faff] rounded-t-[2rem]">
              <div>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter">
                  {formData.id ? 'Editar Tarefa' : 'Nova Tarefa Diária'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white border border-[#c4c5d7]/30 rounded-xl flex items-center justify-center text-[#747686] hover:bg-[#efeff5] transition-all">
                &times;
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Título / Assunto</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-4 text-sm font-bold text-[#0f1c2c]"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Auditoria Semestral de Segurança"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Auditor Atribuído</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                        value={formData.id_auditor}
                        onChange={(e) => setFormData({...formData, id_auditor: e.target.value})}
                      >
                        <option value="">Selecione...</option>
                        {auditores.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                      </select>
                      <User className="w-5 h-5 absolute left-4 top-4 text-[#c4c5d7]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Data Agendada</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                        value={formData.data_prevista}
                        onChange={(e) => setFormData({...formData, data_prevista: e.target.value})}
                      />
                      <Calendar className="w-5 h-5 absolute left-4 top-4 text-[#c4c5d7]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Posto de Transformação (Opcional)</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                      value={formData.id_pt}
                      onChange={(e) => setFormData({...formData, id_pt: e.target.value})}
                    >
                      <option value="">Nenhum (Tarefa Geral)</option>
                      {pts.map(p => <option key={p.id_pt} value={p.id_pt}>{p.id_pt} - {p.subestacao?.nome}</option>)}
                    </select>
                    <MapPin className="w-5 h-5 absolute left-4 top-4 text-[#c4c5d7]" />
                  </div>
                </div>

                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-[#0d3fd1]" />
                    <h4 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">Checklist da Tarefa</h4>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {formData.checklist.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-3 border border-[#c4c5d7]/30 rounded-xl">
                        <div className="font-bold text-[#444655] text-xs flex-grow">{idx + 1}. {item.label}</div>
                        <button type="button" onClick={() => handleRemoveChecklist(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.checklist.length === 0 && (
                      <p className="text-xs font-bold text-[#747686] opacity-60 italic">Sem itens na checklist.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Adicionar item à checklist..." 
                      className="flex-grow bg-white border border-[#c4c5d7]/30 rounded-xl px-4 text-sm font-bold text-[#0f1c2c]"
                      value={novoChecklistItem}
                      onChange={e => setNovoChecklistItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
                    />
                    <button type="button" onClick={handleAddChecklist} className="bg-[#eff4ff] text-[#0d3fd1] px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-colors">
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-[#c4c5d7]/20 flex justify-end gap-4 bg-white rounded-b-[2rem]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff] transition-colors border border-transparent hover:border-[#c4c5d7]/30">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="px-8 py-4 bg-[#00e47c] text-[#005229] rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#00e47c]/20 hover:bg-[#00d674] transition-colors">
                Gravar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
