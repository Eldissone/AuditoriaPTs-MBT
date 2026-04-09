import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, User, MapPin, CheckSquare, Eye, CheckCircle, X, Camera, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function TaskManagement() {
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
    checklist: []
  });
  const [novoChecklistItem, setNovoChecklistItem] = useState('');
  const [detailTarefa, setDetailTarefa] = useState(null);
  const [taskInspecoes, setTaskInspecoes] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // { src, label, index, total }
  const [localidadeModal, setLocalidadeModal] = useState('');

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
    if (tarefa) {
      setFormData({
        id: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        id_auditor: tarefa.id_auditor,
        id_pt: tarefa.id_pt || '',
        data_prevista: tarefa.data_prevista.split('T')[0],
        status: tarefa.status || 'Pendente',
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

  const ptsFiltradosModal = React.useMemo(() => {
    if (!localidadeModal) return pts;
    return (pts || []).filter((p) => (p.subestacao?.municipio || p.municipio) === localidadeModal);
  }, [pts, localidadeModal]);

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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Concluída': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Concluída</span>;
      case 'Em Andamento': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Em Andamento</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Pendente</span>;
    }
  };

  const filteredTarefas = activeTab === 'completed'
    ? tarefas.filter(t => t.status === 'Concluída')
    : tarefas
  ;

  const tarefasFiltradas = filteredTarefas
    .filter((t) => (ptFiltro ? t.id_pt === ptFiltro : true))
    .filter((t) => {
      if (!proprietarioFiltro) return true;
      return (t.pt?.subestacao?.proprietario || '').toLowerCase().includes(proprietarioFiltro.toLowerCase());
    });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={ptFiltro}
          onChange={(e) => setPtFiltro(e.target.value)}
          className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-[#0f1c2c]"
        >
          <option value="">Filtrar por Cliente (Todos)</option>
          {pts.map((p) => (
            <option key={p.id_pt} value={p.id_pt}>{p.id_pt} - {p.subestacao?.proprietario || p.subestacao?.nome}</option>
          ))}
        </select>
        <input
          value={proprietarioFiltro}
          onChange={(e) => setProprietarioFiltro(e.target.value)}
          placeholder="Filtrar por proprietário..."
          className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-xs font-bold text-[#0f1c2c]"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden">
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
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Técnico</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Data Prevista</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">GPS / Mapa</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 w-1/6 text-center">Estado</th>
                    <th className="px-8 py-6 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] text-center w-1/6">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d7]/10">
                  {tarefasFiltradas.map((tarefa, i) => (
                    <tr key={tarefa.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#fcfdff]'} hover:bg-[#eff4ff] transition-colors`}>
                      <td className="px-8 py-5 border-r border-[#c4c5d7]/10">
                        <div className="space-y-1">
                          <p className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">{tarefa.titulo}</p>
                          {tarefa.id_pt && (
                            <p className="text-xs text-[#0d3fd1] font-bold bg-[#0d3fd1]/5 inline-flex p-1 rounded">
                              <MapPin className="w-3 h-3 mr-1 inline" /> Cliente: {tarefa.id_pt}
                            </p>
                          )}
                          {tarefa.pt?.subestacao?.proprietario && (
                            <p className="text-[10px] font-black uppercase text-[#444655]">
                              Proprietário: {tarefa.pt.subestacao.proprietario}
                            </p>
                          )}
                          {tarefa.pt?.subestacao?.municipio && (
                            <p className="text-[10px] font-bold uppercase text-[#747686]">
                              Localidade: {tarefa.pt.subestacao.municipio}
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
          <div className="bg-white max-w-3xl w-full rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Auditor</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.auditor?.nome || 'N/A'}</p>
                </div>
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
                {detailTarefa.pt?.subestacao?.proprietario && <p className="text-xs font-bold text-[#444655]">Proprietário: {detailTarefa.pt.subestacao.proprietario}</p>}
                {detailTarefa.pt?.subestacao?.municipio && <p className="text-xs font-bold text-[#444655]">Localidade: {detailTarefa.pt.subestacao.municipio}</p>}
              </div>

              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#0d3fd1]" /> Checklist ( / )
                </h4>
                {Array.isArray(detailTarefa.checklist) && detailTarefa.checklist.length > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-3">
                    {detailTarefa.checklist.filter((item) => item.checked).length}/{detailTarefa.checklist.length} marcados
                  </p>
                )}
                {Array.isArray(detailTarefa.checklist) && detailTarefa.checklist.length > 0 ? (
                  <div className="space-y-2">
                    {detailTarefa.checklist.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.checked ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                        <span className="text-sm font-bold text-[#444655]">{item.label}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${item.checked ? 'text-emerald-700' : 'text-red-600'}`}>
                          {item.checked ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {item.checked ? '' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-dashed border-[#c4c5d7] text-center">
                    <span className="text-xs font-bold text-[#747686]">Sem checklist associada.</span>
                  </div>
                )}
              </div>
            </div>

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

            <div className="p-6 border-t border-[#c4c5d7]/20 flex justify-end">
              <button
                onClick={() => setDetailTarefa(null)}
                className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff]"
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
          <div className="bg-white max-w-2xl w-full rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
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
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Auditoria Semestral de Segurança"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="mb-3">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block ml-1">Filtrar por Localidade</label>
                      <select
                        className="w-full appearance-none bg-white border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest text-[#0f1c2c]"
                        value={localidadeModal}
                        onChange={(e) => {
                          setLocalidadeModal(e.target.value);
                          setFormData((prev) => ({ ...prev, id_pt: '' }));
                        }}
                      >
                        <option value="">Todas as localidades</option>
                        {localidades.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <select
                      className="w-full appearance-none bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl pl-12 pr-5 py-4 text-sm font-bold text-[#0f1c2c]"
                      value={formData.id_pt}
                      onChange={(e) => setFormData({...formData, id_pt: e.target.value})}
                    >
                      <option value="">Nenhum (Tarefa Geral)</option>
                      {ptsFiltradosModal.map((p) => (
                        <option key={p.id_pt} value={p.id_pt}>
                          {p.id_pt} — {(p.subestacao?.proprietario || p.proprietario || 'Sem proprietário')} — {(p.subestacao?.nome || 'Sem subestação')}
                        </option>
                      ))}
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
