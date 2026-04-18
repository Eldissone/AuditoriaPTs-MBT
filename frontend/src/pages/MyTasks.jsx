import React, { useState, useEffect } from 'react';
import {
  Play, CheckCircle, X, Calendar, MapPin, ClipboardList,
  CheckSquare, Eye, Zap, Clock, ChevronRight, Camera
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import QuickAuditModal from '../components/QuickAuditModal';

export default function MyTasks() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditTarefa, setAuditTarefa] = useState(null); // Tarefa aberta no QuickAuditModal
  const [detailTarefa, setDetailTarefa] = useState(null);
  const [activeTarefa, setActiveTarefa] = useState(null); // Modal conclusão manual
  const [checklistAtual, setChecklistAtual] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: taskInspecoes = [] } = useQuery({
    queryKey: ['tarefaInspecoes', detailTarefa?.id],
    queryFn: async () => {
      if (!detailTarefa?.id) return [];
      const res = await api.get('/inspecoes', { params: { id_tarefa: detailTarefa.id } });
      return res.data;
    },
    enabled: !!detailTarefa?.id
  });

  const fetchTarefas = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tarefas');
      setTarefas(data);
    } catch {
      alert('Erro ao carregar as suas tarefas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTarefas(); }, []);

  // Iniciar → abre imediatamente o modal de auditoria rápida (sem confirm prévio)
  const handleIniciar = (tarefa) => {
    setAuditTarefa(tarefa);
  };

  const openConcluirModal = (tarefa) => {
    setActiveTarefa(tarefa);
    setChecklistAtual(tarefa.checklist || []);
  };

  const handleToggleChecklist = (id) => {
    setChecklistAtual(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleConcluir = async () => {
    const todosChecked = checklistAtual.every(c => c.checked);
    if (!todosChecked) {
      if (!window.confirm('Nem todos os itens estão marcados. Deseja finalizar mesmo assim?')) return;
    }
    try {
      await api.put(`/tarefas/${activeTarefa.id}/concluir`, { checklist: checklistAtual });
      setActiveTarefa(null);
      fetchTarefas();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao concluir tarefa');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Concluída': return 'border-emerald-200 bg-emerald-50';
      case 'Em Andamento': return 'border-amber-200 bg-amber-50';
      default: return 'border-[#c4c5d7]/30 bg-white';
    }
  };

  const pendentes = tarefas.filter(t => t.status === 'Pendente');
  const andamento = tarefas.filter(t => t.status === 'Em Andamento');
  const concluidas = tarefas.filter(t => t.status === 'Concluída');

  const renderTarefa = (tarefa) => (
    <div
      key={tarefa.id}
      className={`p-6 rounded-[1rem] border-2 shadow-lg hover:shadow-xl transition-all flex flex-col ${getStatusStyle(tarefa.status)}`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${tarefa.status === 'Concluída' ? 'bg-emerald-200 text-emerald-800' :
          tarefa.status === 'Em Andamento' ? 'bg-amber-200 text-amber-800' :
            'bg-slate-200 text-slate-700'
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
        <div className="flex items-center gap-1 text-[#0d3fd1] font-bold text-xs bg-white/60 px-2 py-1.5 rounded-lg w-max mb-3 border border-[#0d3fd1]/10">
          <MapPin className="w-3.5 h-3.5" />
          PT: {tarefa.id_pt}{tarefa.pt?.subestacao?.nome ? ` — ${tarefa.pt.subestacao.nome}` : ''}
        </div>
      )}
      {tarefa.pt?.subestacao?.proprietario && (
        <p className="text-[10px] font-black uppercase text-[#444655] mb-1">
          {tarefa.pt.subestacao.proprietario}
        </p>
      )}
      {tarefa.pt?.subestacao?.municipio && (
        <p className="text-[10px] font-bold uppercase text-[#747686] mb-4">
          {tarefa.pt.subestacao.municipio}
        </p>
      )}

      {tarefa.descricao && (
        <p className="text-[#444655] text-sm font-medium opacity-80 mb-4 bg-white/40 p-3 rounded-xl border border-white/50 line-clamp-2">
          {tarefa.descricao}
        </p>
      )}

      {/* Checklist preview */}
      {Array.isArray(tarefa.checklist) && tarefa.checklist.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-[#747686]">
          <CheckSquare className="w-3.5 h-3.5" />
          {tarefa.checklist.filter(c => c.checked).length}/{tarefa.checklist.length} itens
        </div>
      )}

      {/* Tempo decorrido (Em Andamento) */}
      {tarefa.status === 'Em Andamento' && tarefa.data_inicio && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-xl w-max">
          <Clock className="w-3.5 h-3.5" />
          Em curso desde {new Date(tarefa.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-black/5 flex justify-end gap-2">
        <button
          onClick={() => setDetailTarefa(tarefa)}
          className="flex-1 flex justify-center items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#0d3fd1] py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all"
        >
          <Eye className="w-3.5 h-3.5" /> Detalhes
        </button>

        {tarefa.status === 'Pendente' && (
          <button
            onClick={() => handleIniciar(tarefa)}
            className="flex-1 flex justify-center items-center gap-2 bg-[#0d3fd1] text-white py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            Iniciar
          </button>
        )}

        {tarefa.status === 'Em Andamento' && (
          <button
            onClick={() => openConcluirModal(tarefa)}
            className="flex-1 flex justify-center items-center gap-2 bg-[#00e47c] text-[#005229] py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#00e47c]/20 hover:bg-[#00d674] transition-all active:scale-95"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Concluir
          </button>
        )}

        {tarefa.status === 'Concluída' && (
          <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg">
            ✓ {new Date(tarefa.data_fim).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-full p-6 mx-auto space-y-10 animate-in fade-in duration-500 pb-16">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="p-4 bg-[#0d3fd1] rounded-2xl shadow-xl shadow-[#0d3fd1]/20">
          <ClipboardList className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-[#0f1c2c] text-3xl font-black uppercase tracking-tighter">As Minhas Tarefas</h2>
          <p className="text-sm font-bold text-[#747686] opacity-60 uppercase tracking-widest mt-1">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Contador de badges */}
        <div className="ml-auto flex gap-2">
          {pendentes.length > 0 && (
            <span className="text-[9px] font-black bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </span>
          )}
          {andamento.length > 0 && (
            <span className="text-[9px] font-black bg-amber-200 text-amber-800 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
              {andamento.length} em curso
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-bold text-[#747686]">A carregar as suas tarefas...</div>
      ) : tarefas.length === 0 ? (
        <div className="py-20 text-center font-black uppercase tracking-[0.2em] text-[#747686] opacity-30">
          Muito bem! Não tem tarefas pendentes hoje.
        </div>
      ) : (
        <>
          {/* Em Andamento */}
          {andamento.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700 mb-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Em Andamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {andamento.map(renderTarefa)}
              </div>
            </section>
          )}

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#747686] mb-4">
                <ChevronRight className="w-3.5 h-3.5" />
                Pendentes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendentes.map(renderTarefa)}
              </div>
            </section>
          )}

          {/* Concluídas */}
          {concluidas.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                Concluídas Hoje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concluidas.map(renderTarefa)}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── QuickAuditModal ──────────────────────────────────────────────── */}
      {auditTarefa && (
        <QuickAuditModal
          tarefa={auditTarefa}
          onClose={() => setAuditTarefa(null)}
          onDone={() => { setAuditTarefa(null); fetchTarefas(); }}
        />
      )}

      {/* ── Modal Concluir Manual (tarefas sem PT) ───────────────────────── */}
      {activeTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-lg w-full rounded-[1rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-[#f8faff] p-6 border-b border-[#c4c5d7]/20 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0d3fd1] block mb-2">Conclusão da Tarefa</span>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter leading-tight">
                  {activeTarefa.titulo}
                </h3>
              </div>
              <button onClick={() => setActiveTarefa(null)} className="p-2 bg-white rounded-lg border border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-500 transition-all">×</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-[#444655] font-medium leading-relaxed">
                Confirme os itens da checklist antes de submeter a conclusão.
              </p>
              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-2xl p-5 shadow-inner">
                <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#0d3fd1]" /> Checklist
                </h4>
                {checklistAtual.length > 0 ? (
                  <div className="space-y-3">
                    {checklistAtual.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${item.checked ? 'border-[#00e47c] bg-[#00e47c]/5' : 'border-[#c4c5d7]/30 hover:border-[#0d3fd1]/40'}`}
                      >
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 mt-0.5 ${item.checked ? 'bg-[#00e47c] border-[#00e47c]' : 'border-[#c4c5d7]'}`}>
                          {item.checked && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-sm font-bold ${item.checked ? 'text-[#005229] line-through opacity-70' : 'text-[#444655]'}`}>
                          {item.label}
                        </span>
                        <input type="checkbox" className="hidden" checked={item.checked} onChange={() => handleToggleChecklist(item.id)} />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-[#c4c5d7] text-center">
                    <span className="text-xs font-bold text-[#747686]">Sem checklist associada.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 bg-white border-t border-[#c4c5d7]/20 flex justify-end gap-3">
              <button onClick={() => setActiveTarefa(null)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff]">
                Voltar
              </button>
              <button
                onClick={handleConcluir}
                className="px-8 py-3 bg-[#00e47c] text-[#005229] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#00e47c]/20 hover:bg-[#00d674]"
              >
                Submeter Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {detailTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-2xl w-full rounded-[1rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-[#f8faff] p-6 border-b border-[#c4c5d7]/20 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0d3fd1] block mb-2">Detalhes da Tarefa</span>
                <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tighter leading-tight">
                  {detailTarefa.titulo}
                </h3>
              </div>
              <button onClick={() => setDetailTarefa(null)} className="p-2 bg-white rounded-lg border border-[#c4c5d7]/30 text-[#747686] hover:bg-red-50 hover:text-red-500 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Técnico', val: detailTarefa.auditor?.nome },
                  { label: 'Data Prevista', val: new Date(detailTarefa.data_prevista).toLocaleDateString('pt-PT') },
                  detailTarefa.data_inicio && { label: 'Início', val: new Date(detailTarefa.data_inicio).toLocaleString('pt-PT') },
                  detailTarefa.data_fim && { label: 'Conclusão', val: new Date(detailTarefa.data_fim).toLocaleString('pt-PT') },
                ].filter(Boolean).map(({ label, val }) => (
                  <div key={label} className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">{label}</p>
                    <p className="text-sm font-black text-[#0f1c2c]">{val}</p>
                  </div>
                ))}
              </div>
              {detailTarefa.descricao && (
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#747686] mb-1">Descrição</p>
                  <p className="text-sm font-medium text-[#444655]">{detailTarefa.descricao}</p>
                </div>
              )}
              <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#747686]">PT / Subestação</p>
                <p className="text-sm font-black text-[#0f1c2c]">{detailTarefa.id_pt || 'Sem PT associada'}</p>
                {detailTarefa.pt?.subestacao?.nome && <p className="text-xs font-bold text-[#444655]">Subestação: {detailTarefa.pt.subestacao.nome}</p>}
                {detailTarefa.pt?.subestacao?.proprietario && <p className="text-xs font-bold text-[#444655]">Proprietário: {detailTarefa.pt.subestacao.proprietario}</p>}
                {detailTarefa.pt?.subestacao?.municipio && <p className="text-xs font-bold text-[#444655]">Localidade: {detailTarefa.pt.subestacao.municipio}</p>}
              </div>
              {Array.isArray(detailTarefa.checklist) && detailTarefa.checklist.length > 0 && (
                <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                  <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#0d3fd1]" />
                    Checklist — {detailTarefa.checklist.filter(i => i.checked).length}/{detailTarefa.checklist.length} marcados
                  </h4>
                  <div className="space-y-2">
                    {detailTarefa.checklist.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.checked ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                        <span className="text-sm font-bold text-[#444655]">{item.label}</span>
                        <span className={`text-[10px] font-black uppercase ${item.checked ? 'text-emerald-700' : 'text-red-600'}`}>
                          {item.checked ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Evidências Fotográficas ────────────────────────────── */}
              {(() => {
                const todasFotos = taskInspecoes.flatMap(ins =>
                  (Array.isArray(ins.fotos) ? ins.fotos : []).map(f => ({ ...f, inspecao_id: ins.id, data_inspecao: ins.data_inspecao }))
                );
                if (todasFotos.length === 0) return null;
                return (
                  <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                    <h4 className="font-black text-[#0f1c2c] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#0d3fd1]" />
                      Evidências Fotográficas — {todasFotos.length} capturas
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {todasFotos.map((foto, idx) => (
                        <div
                          key={`${foto.inspecao_id}-${idx}`}
                          className="group relative h-24 rounded-xl overflow-hidden shadow-sm border border-[#c4c5d7]/20 bg-white cursor-pointer"
                          onClick={() => setLightboxImage(foto.data)}
                        >
                          <img
                            src={foto.data}
                            alt={foto.label}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[7px] text-white font-black uppercase tracking-widest truncate">{foto.label}</p>
                            <p className="text-[6px] text-white/70 font-bold uppercase">{new Date(foto.data_inspecao).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-5 bg-white border-t border-[#c4c5d7]/20 flex justify-between gap-3">
              <button onClick={() => setDetailTarefa(null)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444655] hover:bg-[#f8faff]">
                Fechar
              </button>
              {detailTarefa.status === 'Pendente' && (
                <button
                  onClick={() => { setDetailTarefa(null); handleIniciar(detailTarefa); }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0d3fd1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#0034cc] transition-all"
                >
                  <Zap className="w-3.5 h-3.5" fill="currentColor" /> Iniciar Auditoria
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={lightboxImage}
              alt="Evidência Ampliada"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
