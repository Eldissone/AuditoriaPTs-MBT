import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, X, Calendar, MapPin, ClipboardList, CheckSquare, Eye } from 'lucide-react';
import api from '../services/api';

export default function MyTasks() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTarefa, setActiveTarefa] = useState(null); // Para modal de checklist
  const [checklistAtual, setChecklistAtual] = useState([]);
  const [detailTarefa, setDetailTarefa] = useState(null);

  const fetchTarefas = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tarefas');
      setTarefas(data);
    } catch (err) {
      alert('Erro ao carregar as suas tarefas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarefas();
  }, []);

  const handleIniciar = async (id) => {
    try {
      if (!window.confirm('Tem a certeza que deseja iniciar esta tarefa agora? O tempo começará a contar.')) return;
      await api.put(`/tarefas/${id}/iniciar`);
      fetchTarefas();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao iniciar tarefa');
    }
  };

  const openConcluirModal = (tarefa) => {
    setActiveTarefa(tarefa);
    setChecklistAtual(tarefa.checklist || []);
  };

  const handleToggleChecklist = (id) => {
    setChecklistAtual(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleConcluir = async () => {
    // Validar se todos os checks obrigatórios estão preenchidos?
    // Para dar autonomia, podemos alertar mas não bloquear. (Ou bloquear)
    const todosChecked = checklistAtual.every(c => c.checked);
    if (!todosChecked) {
      if (!window.confirm('Atenção: Nem todos os itens da checklist estão marcados. Deseja finalizar mesmo assim?')) return;
    }

    try {
      await api.put(`/tarefas/${activeTarefa.id}/concluir`, { checklist: checklistAtual });
      setActiveTarefa(null);
      fetchTarefas();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao concluir tarefa');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Concluída': return 'border-emerald-200 bg-emerald-50';
      case 'Em Andamento': return 'border-amber-200 bg-amber-50';
      default: return 'border-[#c4c5d7]/30 bg-white';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-[#0d3fd1] rounded-2xl shadow-xl shadow-[#0d3fd1]/20">
          <ClipboardList className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-[#0f1c2c] text-3xl font-black uppercase tracking-tighter">As Minhas Tarefas</h2>
          <p className="text-sm font-bold text-[#747686] opacity-60 uppercase tracking-widest mt-1">
            Planeamento de Auditorias - {new Date().toLocaleDateString('pt-PT')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-[#747686]">Carregando as suas tarefas...</div>
        ) : (
          tarefas.map(tarefa => (
            <div key={tarefa.id} className={`p-6 rounded-[2rem] border-2 shadow-lg hover:shadow-xl transition-all flex flex-col ${getStatusColor(tarefa.status)}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                  tarefa.status === 'Concluída' ? 'bg-emerald-200 text-emerald-800' : 
                  tarefa.status === 'Em Andamento' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tarefa.status}
                </span>
                <span className="text-xs font-bold text-[#747686] flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md">
                  <Calendar className="w-3 h-3" />
                  {new Date(tarefa.data_prevista).toLocaleDateString('pt-PT')}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-[#0f1c2c] uppercase tracking-tight leading-tight mb-2">
                {tarefa.titulo}
              </h3>
              
              {tarefa.id_pt && (
                <div className="flex items-center gap-1 text-[#0d3fd1] font-bold text-xs bg-white/60 px-2 py-1.5 rounded-lg w-max mb-4 border border-[#0d3fd1]/10">
                  <MapPin className="w-3.5 h-3.5" />
                  PT: {tarefa.id_pt} - {tarefa.pt?.subestacao?.nome || ''}
                </div>
              )}
              {tarefa.pt?.subestacao?.proprietario && (
                <p className="text-[10px] font-black uppercase text-[#444655] mb-1">
                  Proprietário: {tarefa.pt.subestacao.proprietario}
                </p>
              )}
              {tarefa.pt?.subestacao?.municipio && (
                <p className="text-[10px] font-bold uppercase text-[#747686] mb-4">
                  Localidade: {tarefa.pt.subestacao.municipio}
                </p>
              )}
              {tarefa.pt?.gps && (
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(tarefa.pt.gps)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#0d3fd1] mb-4 hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  GPS: {tarefa.pt.gps}
                </a>
              )}

              {tarefa.descricao && (
                <p className="text-[#444655] text-sm font-medium opacity-80 mb-6 bg-white/40 p-3 rounded-xl border border-white/50 line-clamp-3">
                  {tarefa.descricao}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-black/5 flex justify-end gap-3">
                <button
                  onClick={() => setDetailTarefa(tarefa)}
                  className="flex-1 flex justify-center items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#0d3fd1] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Abrir
                </button>
                {tarefa.status === 'Pendente' && (
                  <button 
                    onClick={() => handleIniciar(tarefa.id)}
                    className="flex-1 flex justify-center items-center gap-2 bg-[#0d3fd1] text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10"
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                    Iniciar
                  </button>
                )}
                {tarefa.status === 'Em Andamento' && (
                  <button 
                    onClick={() => openConcluirModal(tarefa)}
                    className="flex-1 flex justify-center items-center gap-2 bg-[#00e47c] text-[#005229] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#00e47c]/20 hover:bg-[#00d674] transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Concluir
                  </button>
                )}
                {tarefa.status === 'Concluída' && (
                  <div className="w-full text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg">
                    Finalizada em {new Date(tarefa.data_fim).toLocaleString('pt-PT')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {!loading && tarefas.length === 0 && (
          <div className="col-span-full py-20 text-center font-black uppercase tracking-[0.2em] text-[#747686] opacity-30">
            Muito bem! Não tem tarefas pendentes hoje.
          </div>
        )}
      </div>

      {activeTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 max-h-[90vh]">
            <div className="bg-[#f8faff] p-6 sm:p-8 border-b border-[#c4c5d7]/20 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0d3fd1] block mb-2">Resumo de Auditoria</span>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter leading-tight">
                  {activeTarefa.titulo}
                </h3>
              </div>
              <button onClick={() => setActiveTarefa(null)} className="p-2 bg-white rounded-lg border border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-500 transition-all">
                &times;
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <p className="text-sm text-[#444655] font-medium leading-relaxed">
                Antes de concluir esta ordem de serviço, confirme os itens técnicos da checklist (caso existam). A conclusão registará o seu identificador e marca de tempo.
              </p>
              
              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-2xl p-6 shadow-inner">
                <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#0d3fd1]" /> Checklist de Validação
                </h4>
                
                {checklistAtual.length > 0 ? (
                  <div className="space-y-3">
                    {checklistAtual.map((item, index) => (
                      <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group ${item.checked ? 'border-[#00e47c] bg-[#00e47c]/5' : 'border-[#c4c5d7]/30 hover:border-[#0d3fd1]/40'}`}>
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 mt-0.5 ${item.checked ? 'bg-[#00e47c] border-[#00e47c]' : 'border-[#c4c5d7] group-hover:border-[#0d3fd1]'}`}>
                          {item.checked && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-sm font-bold ${item.checked ? 'text-[#005229] line-through opacity-70' : 'text-[#444655]'}`}>
                          {item.label}
                        </span>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={item.checked} 
                          onChange={() => handleToggleChecklist(item.id)} 
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-[#c4c5d7] text-center">
                    <span className="text-xs font-bold text-[#747686]">Nenhum item adicionado à checklist inicial.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white border-t border-[#c4c5d7]/20 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setActiveTarefa(null)} 
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff]"
              >
                Voltar
              </button>
              <button 
                onClick={handleConcluir} 
                className="w-full sm:w-auto px-8 py-3 bg-[#00e47c] text-[#005229] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#00e47c]/20 hover:bg-[#00d674]"
              >
                Submeter Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 max-h-[90vh]">
            <div className="bg-[#f8faff] p-6 sm:p-8 border-b border-[#c4c5d7]/20 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0d3fd1] block mb-2">Detalhes da Tarefa</span>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter leading-tight">
                  {detailTarefa.titulo}
                </h3>
              </div>
              <button onClick={() => setDetailTarefa(null)} className="p-2 bg-white rounded-lg border border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-500 transition-all">
                &times;
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Estado</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.status}</p>
                </div>
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Data Prevista</p>
                  <p className="text-sm font-black text-[#0f1c2c]">{new Date(detailTarefa.data_prevista).toLocaleDateString('pt-PT')}</p>
                </div>
                {detailTarefa.data_inicio && (
                  <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Início</p>
                    <p className="text-sm font-black text-[#0f1c2c]">{new Date(detailTarefa.data_inicio).toLocaleString('pt-PT')}</p>
                  </div>
                )}
                {detailTarefa.data_fim && (
                  <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Conclusão</p>
                    <p className="text-sm font-black text-[#0f1c2c]">{new Date(detailTarefa.data_fim).toLocaleString('pt-PT')}</p>
                  </div>
                )}
              </div>

              {detailTarefa.descricao && (
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Descrição</p>
                  <p className="text-sm font-medium text-[#444655]">{detailTarefa.descricao}</p>
                </div>
              )}

              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#747686]">PT / Subestação</p>
                <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.id_pt || 'Sem PT associada'}</p>
                {detailTarefa.pt?.subestacao?.nome && (
                  <p className="text-xs font-bold text-[#444655]">Subestação: {detailTarefa.pt.subestacao.nome}</p>
                )}
                {detailTarefa.pt?.subestacao?.proprietario && (
                  <p className="text-xs font-bold text-[#444655]">Proprietário: {detailTarefa.pt.subestacao.proprietario}</p>
                )}
                {detailTarefa.pt?.subestacao?.municipio && (
                  <p className="text-xs font-bold text-[#444655]">Localidade: {detailTarefa.pt.subestacao.municipio}</p>
                )}
              </div>

              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#0d3fd1]" /> Checklist
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

            <div className="p-5 sm:p-6 bg-white border-t border-[#c4c5d7]/20 flex justify-end">
              <button
                onClick={() => setDetailTarefa(null)}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
