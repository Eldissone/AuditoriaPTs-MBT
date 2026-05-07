import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, User, MapPin, CheckSquare, Eye, CheckCircle, X, Camera, ZoomIn, ChevronLeft, ChevronRight, ClipboardCheck, Wrench, Search as SearchIcon, AlertTriangle, Layers } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getChecklistForType } from '../data/checklists';

export default function TaskManagement() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState([]);
  const [auditores, setAuditores] = useState([]);
  const [pts, setPts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [ptFiltro, setPtFiltro] = useState('');
  const [proprietarioFiltro, setProprietarioFiltro] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    titulo: '',
    descricao: '',
    id_auditor: '',
    id_pt: '',
    data_prevista: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    tipo_tarefa: 'Auditoria',
    prioridade: 'Normal',
    checklist: []
  });
  const [novoChecklistItem, setNovoChecklistItem] = useState('');
  const [detailTarefa, setDetailTarefa] = useState(null);
  const [taskInspecoes, setTaskInspecoes] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [localidadeModal, setLocalidadeModal] = useState('');
  const [subestacaoModal, setSubestacaoModal] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [resTarefas, resAuditores, resPts] = await Promise.all([
        api.get('/tarefas'),
        api.get('/utilizadores'),
        api.get('/clientes')
      ]);
      setTarefas(resTarefas.data);
      // Filtrar para mostrar apenas quem tem role auditor (ou todos se preferir, aqui filtramos auditores)
      setAuditores(resAuditores.data.filter(u => u.role === 'auditor' || u.role === 'admin'));
      // Ensure pts is an array even if paginated
      const clientData = Array.isArray(resPts.data) ? resPts.data : (resPts.data?.data || []);
      setPts(clientData);
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

  // Fetch inspections when task detail opens
  useEffect(() => {
    if (!detailTarefa) { setTaskInspecoes([]); return; }
    api.get('/inspecoes', { params: { id_tarefa: detailTarefa.id } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setTaskInspecoes(list);
      })
      .catch(() => setTaskInspecoes([]));
  }, [detailTarefa]);

  const handleOpenModal = (tarefa = null) => {
    setLocalidadeModal('');
    setSubestacaoModal('');
    if (tarefa) {
      setFormData({
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        id_auditor: tarefa.id_auditor,
        id_pt: tarefa.id_pt || '',
        data_prevista: tarefa.data_prevista.split('T')[0],
        status: tarefa.status || 'Pendente',
        tipo_tarefa: tarefa.tipo_tarefa || 'Auditoria',
        prioridade: tarefa.prioridade || 'Normal',
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
        status: 'Pendente',
        tipo_tarefa: 'Auditoria',
        prioridade: 'Normal',
        checklist: []
      });
    }
    setNovoChecklistItem('');
    setIsModalOpen(true);
  };

  const localidades = React.useMemo(() => {
    const items = (pts || [])
      .map((p) => p.subestacao?.municipio || p.municipio)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
    return [...new Set(items)].sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [pts]);

  const subestacoesLista = React.useMemo(() => {
    let filtered = pts || [];
    if (localidadeModal) {
      filtered = filtered.filter((p) => (p.subestacao?.municipio || p.municipio) === localidadeModal);
    }
    const items = filtered
      .map((p) => p.subestacao?.nome)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
    return [...new Set(items)].sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [pts, localidadeModal]);

  const ptsFiltradosModal = React.useMemo(() => {
    let filtered = pts || [];
    if (localidadeModal) {
      filtered = filtered.filter((p) => (p.subestacao?.municipio || p.municipio) === localidadeModal);
    }
    if (subestacaoModal) {
      filtered = filtered.filter((p) => p.subestacao?.nome === subestacaoModal);
    }
    // Limit to top 100 for performance
    return filtered.slice(0, 500);
  }, [pts, localidadeModal, subestacaoModal]);

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
        tipo_tarefa: formData.tipo_tarefa,
        prioridade: formData.prioridade,
        checklist: formData.checklist
      };
      if (formData.id_pt) payload.id_pt = formData.id_pt;
      if (formData.id && formData.status) payload.status = formData.status;

      if (formData.id) {
        await api.put(`/tarefas/${formData.id}`, payload);
      } else {
        await api.post('/tarefas', payload);
      }

      setIsModalOpen(false);
      fetchDados();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar tarefa');
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

  const handleValidarTarefa = async (id) => {
    if (!window.confirm('Confirmar a validação final desta tarefa? O relatório ficará visível.')) return;
    try {
      await api.put(`/tarefas/${id}`, { status: 'Concluída' });
      fetchDados();
      setDetailTarefa(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao validar tarefa');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Concluída': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Concluída</span>;
      case 'Em Andamento': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Em Andamento</span>;
      case 'Aguardando Validação': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Validação</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Pendente</span>;
    }
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'Auditoria': return <span className="flex items-center gap-1 bg-[#eff4ff] text-[#0d3fd1] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-[#0d3fd1]/20"><ClipboardCheck className="w-3 h-3" />Auditoria</span>;
      case 'Manutenção Preventiva': return <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-green-200"><Wrench className="w-3 h-3" />Prev.</span>;
      case 'Manutenção Corretiva': return <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-200"><Wrench className="w-3 h-3" />Corret.</span>;
      case 'Inspeção': return <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-purple-200"><Layers className="w-3 h-3" />Inspeção</span>;
      default: return <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-slate-200">{tipo || 'N/D'}</span>;
    }
  };

  const getPrioridadeBadge = (prio) => {
    switch (prio) {
      case 'Urgente': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">🔴 Urgente</span>;
      case 'Alta': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">🟠 Alta</span>;
      case 'Baixa': return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">⚪ Baixa</span>;
      default: return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">🔵 Normal</span>;
    }
  };

  const filteredTarefas = activeTab === 'completed'
    ? tarefas.filter(t => t.status === 'Concluída')
    : tarefas;

  const tarefasFiltradas = filteredTarefas
    .filter((t) => (ptFiltro ? t.id_pt === ptFiltro : true))
    .filter((t) => (tipoFiltro ? (t.tipo_tarefa || 'Auditoria') === tipoFiltro : true))
    .filter((t) => {
      if (!proprietarioFiltro) return true;
      return (t.pt?.proprietario?.nome || '').toLowerCase().includes(proprietarioFiltro.toLowerCase());
    });

  return (
    <div className="max-w-full p-6 mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-[#0f1c2c] text-3xl font-black uppercase tracking-tighter">Gestão de Tarefas</h2>
          <p className="text-sm font-bold text-[#747686] opacity-60 mt-1 uppercase tracking-widest">
            Atribuição de auditorias e ordens de serviço
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#0d3fd1] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-xl shadow-[#0d3fd1]/10"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-[#c4c5d7]/20 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'all'
            ? 'border-[#0d3fd1] text-[#0d3fd1]'
            : 'border-transparent text-[#747686] hover:text-[#444655]'
            }`}
        >
          Todas as Tarefas ({tarefas.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'completed'
            ? 'border-emerald-500 text-emerald-600'
            : 'border-transparent text-[#747686] hover:text-[#444655]'
            }`}
        >
          Tarefas Concluídas ({tarefas.filter(t => t.status === 'Concluída').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          value={ptFiltro}
          onChange={(e) => setPtFiltro(e.target.value)}
          className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-[#0f1c2c]"
        >
          <option value="">Filtrar por PT (Todos)</option>
          {pts.map((p) => (
            <option key={p.id_pt} value={p.id_pt}>{p.id_pt} - {p.proprietario?.nome || p.subestacao?.nome || '---'}</option>
          ))}
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-[#0f1c2c]"
        >
          <option value="">Todos os Tipos</option>
          <option value="Auditoria">Auditoria</option>
          <option value="Manutenção Preventiva">Manutenção Preventiva</option>
          <option value="Manutenção Corretiva">Manutenção Corretiva</option>
          <option value="Inspeção">Inspeção</option>
        </select>
        <input
          value={proprietarioFiltro}
          onChange={(e) => setProprietarioFiltro(e.target.value)}
          placeholder="Filtrar por proprietário..."
          className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-xs font-bold text-[#0f1c2c]"
        />
      </div>

      <div className="bg-white rounded-[1rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#747686] font-bold">Carregando tarefas...</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-[#c4c5d7]/10">
              {tarefasFiltradas.map((tarefa) => (
                <div key={tarefa.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight truncate">{tarefa.titulo}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {getStatusBadge(tarefa.status)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#747686] bg-[#f8faff] border border-[#c4c5d7]/20 px-2 py-1 rounded-md">
                          {new Date(tarefa.data_prevista).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setDetailTarefa(tarefa)}
                        className="p-2 text-[#0d3fd1] bg-white border border-[#c4c5d7]/30 rounded-lg hover:bg-[#eff4ff] transition-all"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(tarefa)}
                        className="p-2 text-[#444655] bg-white border border-[#c4c5d7]/30 rounded-lg hover:bg-[#f8faff] hover:text-[#0d3fd1] transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tarefa.id)}
                        className="p-2 text-[#444655] bg-white border border-[#c4c5d7]/30 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between gap-3 bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#747686]">Técnico</span>
                      <span className="text-xs font-bold text-[#444655] truncate">{tarefa.auditor?.nome || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#747686]">Cliente</span>
                      <span className="text-xs font-bold text-[#0d3fd1] truncate">{tarefa.id_pt || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#747686]">GPS</span>
                      {tarefa.pt?.gps ? (
                        <a
                          href={`https://www.google.com/maps?q=${encodeURIComponent(tarefa.pt.gps)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-black text-[#0d3fd1] hover:underline truncate max-w-[60%]"
                        >
                          {tarefa.pt.gps}
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-[#747686]">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tarefasFiltradas.length === 0 && !loading && (
                <div className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                  {activeTab === 'completed' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa atribuída'}
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-[#f8faff] border-b border-[#c4c5d7]/20">
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/4">Tarefa</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/4">Tipo</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Técnico</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Data Prevista</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">GPS / Mapa</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Estado</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] text-center w-1/6">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d7]/10">
                  {tarefasFiltradas.map((tarefa, i) => (
                    <tr key={tarefa.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#fcfdff]'} hover:bg-[#eff4ff] transition-colors group`}>
                      <td className="px-8 py-5 border-r border-[#c4c5d7]/10">
                        <div className="space-y-1.5">
                          <p className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">{tarefa.titulo}</p>
                          {tarefa.id_pt && (
                            <p className="text-xs text-[#0d3fd1] font-bold bg-[#0d3fd1]/5 inline-flex p-1 rounded">
                              <MapPin className="w-3 h-3 mr-1 inline" /> PT: {tarefa.id_pt}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 border-r border-[#c4c5d7]/10">
                        <div className="flex flex-col gap-1.5">
                          {getTipoBadge(tarefa.tipo_tarefa || 'Auditoria')}
                          {getPrioridadeBadge(tarefa.prioridade || 'Normal')}
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
                        {tarefa.pt?.gps ? (
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(tarefa.pt.gps)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black text-[#0d3fd1] uppercase hover:underline"
                          >
                            {tarefa.pt.gps}
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-[#747686] uppercase">Sem GPS</span>
                        )}
                      </td>
                      <td className="px-8 py-5 border-r border-[#c4c5d7]/10 text-center">
                        {getStatusBadge(tarefa.status)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => setDetailTarefa(tarefa)}
                            className="p-2 text-[#0d3fd1] bg-white border border-[#c4c5d7]/30 rounded-lg hover:bg-[#eff4ff] transition-all"
                            title="Ver detalhes da tarefa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                  {tarefasFiltradas.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                        {activeTab === 'completed' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa atribuída'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {detailTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-3xl w-full rounded-[1rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-[#f8faff] p-6 sm:p-8 border-b border-[#c4c5d7]/20 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0d3fd1] block mb-2">Detalhes da Tarefa</span>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter leading-tight">{detailTarefa.titulo}</h3>
              </div>
              <button onClick={() => setDetailTarefa(null)} className="p-2 bg-white rounded-lg border border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-500 transition-all">
                &times;
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Estado</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.status}</p>
                </div>
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Data Prevista</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{new Date(detailTarefa.data_prevista).toLocaleDateString('pt-PT')}</p>
                </div>
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Técnico</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.auditor?.nome || 'N/A'}</p>
                </div>
              </div>
              {/* Tipo + Prioridade */}
              <div className="flex items-center gap-3 flex-wrap">
                {getTipoBadge(detailTarefa.tipo_tarefa || 'Auditoria')}
                {getPrioridadeBadge(detailTarefa.prioridade || 'Normal')}
              </div>

              {detailTarefa.descricao && (
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Descrição</p>
                  <p className="text-sm font-medium text-[#444655]">{detailTarefa.descricao}</p>
                </div>
              )}

              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#747686]">Cliente / Subestação</p>
                <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.id_pt || 'Sem Cliente associado'}</p>
                {detailTarefa.pt?.subestacao?.nome && <p className="text-xs font-bold text-[#444655]">Subestação: {detailTarefa.pt.subestacao.nome}</p>}
                {detailTarefa.pt?.proprietario?.nome && <p className="text-xs font-bold text-[#444655]">Proprietário: {detailTarefa.pt.proprietario.nome}</p>}
                {detailTarefa.pt?.subestacao?.municipio && <p className="text-xs font-bold text-[#444655]">Localidade: {detailTarefa.pt.subestacao.municipio}</p>}
              </div>

              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#0d3fd1]" /> Checklist de Campo
                </h4>
                {Array.isArray(detailTarefa.checklist) && detailTarefa.checklist.length > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-3">
                    {detailTarefa.checklist.filter((item) => item.checked || item.resultado === 'ok').length}/{detailTarefa.checklist.length} itens conformes
                  </p>
                )}
                {Array.isArray(detailTarefa.checklist) && detailTarefa.checklist.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      let lastSecao = '';
                      return detailTarefa.checklist.map((item) => {
                        const res = item.resultado;
                        const isOK = res === 'ok' || (item.checked && !res);
                        const isNC = res === 'nc';
                        const isNA = res === 'na';

                        const showHeader = item.secao && item.secao !== lastSecao;
                        if (showHeader) lastSecao = item.secao;

                        return (
                          <React.Fragment key={item.id}>
                            {showHeader && (
                              <div className="pt-3 pb-1 border-b border-[#c4c5d7]/10 mb-2 mt-2 first:mt-0">
                                <h5 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-[0.1em]">
                                  {item.secao}
                                </h5>
                              </div>
                            )}
                            <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isOK ? 'border-emerald-200 bg-emerald-50/50' : isNC ? 'border-red-200 bg-red-50/50' : isNA ? 'border-gray-200 bg-gray-50' : 'border-amber-200 bg-amber-50'}`}>
                              <span className={`text-[11px] font-bold ${isNA ? 'text-gray-400 line-through' : 'text-[#444655]'}`}>{item.label}</span>
                              <div className="flex items-center gap-2">
                                {isOK && <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">OK</span>}
                                {isNC && <span className="text-[9px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded">NC</span>}
                                {isNA && <span className="text-[9px] font-black uppercase bg-gray-400 text-white px-2 py-0.5 rounded">N/A</span>}
                                {!res && !item.checked && <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded">Pendente</span>}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-dashed border-[#c4c5d7] text-center">
                    <span className="text-xs font-bold text-[#747686]">Sem checklist associada.</span>
                  </div>
                )}
              </div>

              {/* ── Detalhes da Inspeção (Medições e Resultados) ────────── */}
              {taskInspecoes.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                    <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#0d3fd1]" /> Medições e Resultados
                    </h4>
                    {taskInspecoes.map((ins, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-2 border border-[#c4c5d7]/10 rounded-lg">
                            <p className="text-[8px] font-black text-[#747686] uppercase">Terra Proteção</p>
                            <p className="text-[11px] font-black text-[#0f1c2c]">{ins.medicoes?.terra_protecao ? `${ins.medicoes.terra_protecao} Ω` : '—'}</p>
                          </div>
                          <div className="p-2 border border-[#c4c5d7]/10 rounded-lg">
                            <p className="text-[8px] font-black text-[#747686] uppercase">Terra Serviço</p>
                            <p className="text-[11px] font-black text-[#0f1c2c]">{ins.medicoes?.terra_servico ? `${ins.medicoes.terra_servico} Ω` : '—'}</p>
                          </div>
                          <div className="p-2 border border-[#c4c5d7]/10 rounded-lg column-span-2">
                            <p className="text-[8px] font-black text-[#747686] uppercase">Resultado Final</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ins.resultado === 'Favorável' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {ins.resultado || 'Em Avaliação'}
                            </span>
                          </div>
                        </div>
                        {ins.observacoes && (
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <p className="text-[8px] font-black text-amber-700 uppercase mb-1">Observações do Técnico</p>
                            <p className="text-xs font-medium text-amber-900">{ins.observacoes}</p>
                          </div>
                        )}
                        {ins.dados_cliente && Object.values(ins.dados_cliente).some(v => v !== '') && (
                          <div className="p-3 border border-[#c4c5d7]/20 rounded-lg bg-gray-50/50">
                            <p className="text-[8px] font-black text-[#747686] uppercase mb-2">Dados Cadastrais Atualizados</p>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
                              {ins.dados_cliente.razao_social && <div className="text-[10px]"><span className="text-[#747686]">Proprietário:</span> <span className="font-bold">{ins.dados_cliente.razao_social}</span></div>}
                              {ins.dados_cliente.resp_tecnico && <div className="text-[10px]"><span className="text-[#747686]">Resp. Técnico:</span> <span className="font-bold">{ins.dados_cliente.resp_tecnico}</span></div>}
                              {ins.dados_cliente.contacto_tec && <div className="text-[10px]"><span className="text-[#747686]">Contacto:</span> <span className="font-bold">{ins.dados_cliente.contacto_tec}</span></div>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ── Fotos / Evidências das Inspecções ──────────────────── */}
              {(() => {
                const todasFotos = taskInspecoes.flatMap(ins =>
                  (Array.isArray(ins.fotos) ? ins.fotos : []).map(f => ({ ...f, inspecao_id: ins.id, data_inspecao: ins.data_inspecao }))
                );
                if (todasFotos.length === 0) return null;
                return (
                  <div className="px-6 sm:px-8 pb-6">
                    <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                      <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#0d3fd1]" />
                        Evidências Fotográficas ({todasFotos.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {todasFotos.map((foto, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxPhoto({ src: foto.data, label: foto.label, index: i, all: todasFotos })}
                            className="relative group rounded-xl overflow-hidden aspect-square bg-[#f1f3f9] border border-[#c4c5d7]/20 hover:border-[#0d3fd1]/40 transition-all shadow-sm"
                          >
                            <img
                              src={foto.data}
                              alt={foto.label || `Foto ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {foto.label && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                                <p className="text-white text-[9px] font-bold truncate">{foto.label}</p>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-[#c4c5d7]/20 flex justify-between items-center bg-[#f8faff]">
              {detailTarefa.status === 'Aguardando Validação' && user?.role === 'admin' ? (
                <button
                  onClick={() => handleValidarTarefa(detailTarefa.id)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Validar Relatório (Concluir)
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setDetailTarefa(null)}
                className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#eff4ff] border border-transparent hover:border-[#c4c5d7]/30 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); const prev = (lightboxPhoto.index - 1 + lightboxPhoto.all.length) % lightboxPhoto.all.length; const f = lightboxPhoto.all[prev]; setLightboxPhoto({ src: f.data, label: f.label, index: prev, all: lightboxPhoto.all }); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxPhoto.src}
              alt={lightboxPhoto.label}
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="flex items-center gap-4">
              <p className="text-white text-sm font-bold">{lightboxPhoto.label || `Foto ${lightboxPhoto.index + 1}`}</p>
              <span className="text-white/50 text-xs">{lightboxPhoto.index + 1} / {lightboxPhoto.all.length}</span>
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); const next = (lightboxPhoto.index + 1) % lightboxPhoto.all.length; const f = lightboxPhoto.all[next]; setLightboxPhoto({ src: f.data, label: f.label, index: next, all: lightboxPhoto.all }); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-[1rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-[#c4c5d7]/20 flex justify-between items-center bg-[#f8faff] rounded-t-[2rem] gap-4">
              <div>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter">
                  {formData.id ? 'Editar Tarefa' : 'Nova Tarefa Diária'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white border border-[#c4c5d7]/30 rounded-xl flex items-center justify-center text-[#747686] hover:bg-[#efeff5] transition-all">
                &times;
              </button>
            </div>

            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Título / Assunto</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-4 text-sm font-bold text-[#0f1c2c]"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Auditoria PTA — Bairro do Rangel"
                  />
                </div>

                {/* Tipo de Tarefa + Prioridade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Tipo de Tarefa</label>
                    <select
                      required
                      className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-4 text-sm font-bold text-[#0f1c2c]"
                      value={formData.tipo_tarefa}
                      onChange={(e) => setFormData({ ...formData, tipo_tarefa: e.target.value })}
                    >
                      <option value="Auditoria">📋 Auditoria</option>
                      <option value="Manutenção Preventiva">🔧 Manutenção Preventiva</option>
                      <option value="Manutenção Corretiva">🔧 Manutenção Corretiva</option>
                      <option value="Inspeção">🔍 Inspeção Técnica</option>
                    </select>
                    <p className="text-[9px] text-[#747686] mt-1 ml-1 font-bold">
                      {formData.tipo_tarefa === 'Auditoria' ? '📌 Recolha e validação de dados — técnico observa e regista, não intervém' : formData.tipo_tarefa === 'Inspeção' ? '📌 Inspeção técnica focada num componente ou sistema' : '📌 Intervenção técnica — técnico repara, substitui ou faz upgrade'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Prioridade</label>
                    <select
                      className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-4 text-sm font-bold text-[#0f1c2c]"
                      value={formData.prioridade}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                    >
                      <option value="Urgente">🔴 Urgente</option>
                      <option value="Alta">🟠 Alta</option>
                      <option value="Normal">🔵 Normal</option>
                      <option value="Baixa">⚪ Baixa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Auditor Atribuído</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                        value={formData.id_auditor}
                        onChange={(e) => setFormData({ ...formData, id_auditor: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
                      />
                      <Calendar className="w-5 h-5 absolute left-4 top-4 text-[#c4c5d7]" />
                    </div>
                  </div>
                  {formData.id && (
                    <div>
                      <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Estado</label>
                      <select
                        className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-4 text-sm font-bold text-[#0f1c2c]"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Pendente">Pendente (Reabrir)</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest mb-2 block ml-1">Cliente Associado (Opcional)</label>
                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block ml-1">Localidade</label>
                        <select
                          className="w-full appearance-none bg-white border border-[#c4c5d7]/30 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#0f1c2c]"
                          value={localidadeModal}
                          onChange={(e) => {
                            setLocalidadeModal(e.target.value);
                            setSubestacaoModal(''); // Reset substation when localidade changes
                            setFormData((prev) => ({ ...prev, id_pt: '' }));
                          }}
                        >
                          <option value="">Todas</option>
                          {localidades.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block ml-1">Subestação</label>
                        <select
                          className="w-full appearance-none bg-white border border-[#c4c5d7]/30 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#0f1c2c]"
                          value={subestacaoModal}
                          onChange={(e) => {
                            setSubestacaoModal(e.target.value);
                            setFormData((prev) => ({ ...prev, id_pt: '' }));
                          }}
                        >
                          <option value="">Todas</option>
                          {subestacoesLista.map((se) => (
                            <option key={se} value={se}>{se}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <select
                      className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                      value={formData.id_pt}
                      onChange={(e) => {
                        const selectedPtId = e.target.value;
                        const selectedPt = pts.find(p => p.id_pt === selectedPtId);
                        const autoChecklist = selectedPt && !formData.id
                          ? getChecklistForType(selectedPt.tipo_instalacao, formData.titulo)
                          : formData.checklist;
                        setFormData({ ...formData, id_pt: selectedPtId, checklist: autoChecklist });
                      }}
                    >
                      <option value="">Nenhum (Tarefa Geral)</option>
                      {ptsFiltradosModal.length > 0 ? (
                        ptsFiltradosModal.map((p) => (
                          <option key={p.id_pt} value={p.id_pt}>
                            {p.id_pt} — {(p.proprietario?.nome || p.proprietario || 'Sem proprietário')} — {(p.subestacao?.nome || 'Sem subestação')}
                          </option>
                        ))
                      ) : (
                        <option disabled>Nenhum cliente encontrado...</option>
                      )}
                    </select>
                    <MapPin className="w-5 h-5 absolute left-4 top-4 text-[#c4c5d7]" />
                  </div>
                  {formData.id_pt && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#0d3fd1]">
                      GPS: {pts.find((p) => p.id_pt === formData.id_pt)?.gps || 'Sem coordenadas'}
                    </p>
                  )}
                </div>

                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-[#0d3fd1]" />
                      <h4 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">Checklist da Tarefa</h4>
                      {formData.id_pt && (() => {
                        const ptSel = pts.find(p => p.id_pt === formData.id_pt);
                        const tipo = ptSel?.tipo_instalacao || '';
                        const t = tipo.toUpperCase();
                        const tit = formData.titulo.toUpperCase();
                        const isPTC = t.includes('CABIN') || t === 'PTC' || t.includes('CABINE') || tit.includes('PTC') || tit.includes('CABINE');
                        return (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${isPTC ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-sky-50 text-sky-700 border-sky-100'}`}>
                            {isPTC ? 'PTC — 37 itens' : 'PTA — 32 itens'}
                          </span>
                        );
                      })()}
                    </div>
                    {formData.id_pt && (
                      <button
                        type="button"
                        onClick={() => {
                          const ptSel = pts.find(p => p.id_pt === formData.id_pt);
                          if (ptSel) {
                            setFormData(prev => ({ ...prev, checklist: getChecklistForType(ptSel.tipo_instalacao, prev.titulo) }));
                          }
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-[#0d3fd1] hover:bg-[#eff4ff] px-3 py-1.5 rounded-lg transition-colors border border-[#0d3fd1]/10"
                      >
                        Recarregar Checklist Padrão
                      </button>
                    )}
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
