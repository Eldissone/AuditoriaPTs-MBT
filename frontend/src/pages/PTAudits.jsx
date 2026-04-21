import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Download,
  Trash2,
  ExternalLink,
  Edit2,
  RefreshCw,
  LayoutGrid,
  Minimize2,
  CheckCircle,
  XCircle,
  Wrench,
  Printer,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FilePlus,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QuickAuditModal from '../components/QuickAuditModal';

export default function PTAudits() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [subView, setSubView] = useState('inspecoes'); // 'inspecoes' or 'tarefas'
  const [step, setStep] = useState(1);
  const [pts, setPts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [subestacoes, setSubestacoes] = useState([]);
  const [auditores, setAuditores] = useState([]);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    id_pt: '',
    titulo: '',
    tipo: 'Inspeção',
    auditor_id: '',
    data: new Date().toISOString().split('T')[0],
    prioridade: 'Normal'
  });
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const localidadeFiltro = searchParams.get('localidade') || '';
  const [subestacaoFiltro, setSubestacaoFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [tipoFiltroRelatorio, setTipoFiltroRelatorio] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('todos');
  const [ordenacaoRelatorio, setOrdenacaoRelatorio] = useState('recentes');
  const [modoRelatorio, setModoRelatorio] = useState(() => localStorage.getItem('@PTAS:ptaudits:modo') || 'completo');
  const [limiteExecutivo, setLimiteExecutivo] = useState(() => Number(localStorage.getItem('@PTAS:ptaudits:limiteExecutivo')) || 12);
  const [auditTarefa, setAuditTarefa] = useState(null);
  const [formData, setFormData] = useState({
    id_pt: '',
    id_tarefa: '',
    tipo: 'Preventiva',
    data_inspecao: new Date().toISOString().split('T')[0],
    resultado: 'Em Avaliação',
    nivel_urgencia: 'Baixo',
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
    },
    fotos: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const ptsParams = localidadeFiltro ? { params: { localidade: localidadeFiltro } } : undefined;
        const [ptsRes, auditsRes, tarefasRes, substRes] = await Promise.all([
          api.get('/clientes', ptsParams),
          api.get('/inspecoes'),
          api.get('/tarefas').catch(() => ({ data: [] })),
          api.get('/subestacoes').catch(() => ({ data: [] }))
        ]);
        setPts(ptsRes.data);
        const filteredAudits = localidadeFiltro
          ? (auditsRes.data || []).filter((audit) =>
            (audit.pt?.municipio || audit.pt?.subestacao?.municipio) === localidadeFiltro
          )
          : (auditsRes.data || []);
        setAudits(filteredAudits);
        setTarefas(tarefasRes.data || []);
        setSubestacoes(Array.isArray(substRes.data) ? substRes.data : []);

        // Fetch auditores for follow-up assignment
        const usersRes = await api.get('/utilizadores');
        setAuditores((usersRes.data || []).filter(u => u.role === 'auditor' || u.role === 'admin'));
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [view, localidadeFiltro]);

  // Reset subestacao filter if localidade changes
  useEffect(() => {
    setSubestacaoFiltro('');
  }, [localidadeFiltro]);

  useEffect(() => {
    localStorage.setItem('@PTAS:ptaudits:modo', modoRelatorio);
  }, [modoRelatorio]);

  useEffect(() => {
    localStorage.setItem('@PTAS:ptaudits:limiteExecutivo', String(limiteExecutivo));
  }, [limiteExecutivo]);

  // Fetch all tasks for linking to audits
  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: async () => {
      const res = await api.get('/tarefas');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleOpenFollowUp = (item) => {
    setFollowUpData({
      id_pt: item.id_pt || '',
      titulo: `Seguimento: ${item.titulo || item.id_pt}`,
      tipo: 'Inspeção',
      auditor_id: item.id_auditor || '',
      data: new Date().toISOString().split('T')[0],
      prioridade: 'Normal'
    });
    setIsFollowUpModalOpen(true);
  };

  const handleSubmitFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tarefas', {
        titulo: followUpData.titulo,
        id_pt: followUpData.id_pt,
        id_auditor: Number(followUpData.auditor_id),
        data_prevista: followUpData.data,
        tipo_tarefa: followUpData.tipo,
        prioridade: followUpData.prioridade,
        status: 'Pendente',
        checklist: [] // Default empty for follow-up, can be set later in management
      });
      setIsFollowUpModalOpen(false);
      alert('Seguimento agendado com sucesso!');
      setView('list'); // Refresh trigger
    } catch (err) {
      alert('Erro ao agendar seguimento: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSelectTask = (taskId) => {
    const normalized = taskId ? Number(taskId) : null;
    if (!normalized) {
      setFormData((prev) => ({ ...prev, id_tarefa: '' }));
      return;
    }

    const task = allTasks.find((t) => Number(t.id) === normalized);
    setFormData((prev) => ({
      ...prev,
      id_tarefa: String(normalized),
      // Se a tarefa tiver PT associado, preenche automaticamente a auditoria
      id_pt: task?.id_pt || prev.id_pt,
    }));
  };

  const handleValidarTarefa = async (id, scheduleFollowup = false) => {
    try {
      const task = tarefas.find(t => t.id === id);
      await api.patch(`/tarefas/${id}/status`, { status: 'Concluída' });

      if (scheduleFollowup) {
        handleOpenFollowUp(task);
      } else {
        alert('Tarefa validada e concluída com sucesso!');
        setView('list'); // Refresh trigger
      }
    } catch (err) {
      alert('Erro ao validar tarefa: ' + (err.response?.data?.error || err.message));
    }
  };

  // Se o utilizador mudar o PT manualmente e a tarefa selecionada não for desse PT, limpa a associação
  useEffect(() => {
    if (!formData.id_tarefa) return;
    const task = allTasks.find((t) => String(t.id) === String(formData.id_tarefa));
    if (task && formData.id_pt && task.id_pt && task.id_pt !== formData.id_pt) {
      setFormData((prev) => ({ ...prev, id_tarefa: '' }));
    }
  }, [formData.id_pt, formData.id_tarefa, allTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.id_pt || formData.id_pt === '') {
      alert('Por favor, selecione um PT.');
      return;
    }

    let payload;
    try {
      // Destructure to remove singular properties and instead use arrays
      const { transformador, risco, ...restData } = formData;
      // Formating data for nested Prisma create/update
      payload = {
        ...restData,
        id_tarefa: restData.id_tarefa ? Number(restData.id_tarefa) : undefined,
        transformadores: [transformador], // Repository expects array
        riscos: [risco]
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
      console.error('Erro /inspecoes payload:', payload);
      console.error('Erro /inspecoes resposta:', err.response?.data);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Erro desconhecido';
      const code = err.response?.data?.code ? ` [${err.response.data.code}]` : '';
      alert(`Erro ao processar auditoria${code}: ${msg}`);
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
        id_pt: fullAudit.id_pt || '',
        id_tarefa: fullAudit.tarefa?.id ? String(fullAudit.tarefa.id) : '',
        tipo: fullAudit.tipo,
        data_inspecao: fullAudit.data_inspecao.split('T')[0],
        observacoes: fullAudit.observacoes || '',
        conformidade: fullAudit.conformidade?.[0] || formData.conformidade,
        transformador: fullAudit.transformadores?.[0] || formData.transformador,
        seguranca: fullAudit.seguranca?.[0] || formData.seguranca,
        resultado: fullAudit.resultado || 'Em Avaliação',
        nivel_urgencia: fullAudit.nivel_urgencia || 'Baixo',
        fotos: fullAudit.fotos || [],
        terra_protecao: fullAudit.terra_protecao,
        terra_servico: fullAudit.terra_servico,
        medicao_tensao: fullAudit.medicao_tensao || {},
        dados_cliente_campo: fullAudit.dados_cliente_campo || {},
        incongruencias: fullAudit.incongruencias || []
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
        id_tarefa: fullAudit.tarefa?.id ? String(fullAudit.tarefa.id) : '',
        tipo: fullAudit.tipo,
        data_inspecao: fullAudit.data_inspecao.split('T')[0],
        observacoes: fullAudit.observacoes || '',
        conformidade: fullAudit.conformidade?.[0] || formData.conformidade,
        transformador: fullAudit.transformadores?.[0] || formData.transformador,
        seguranca: fullAudit.seguranca?.[0] || formData.seguranca,
        resultado: fullAudit.resultado || 'Em Avaliação',
        nivel_urgencia: fullAudit.nivel_urgencia || 'Baixo',
        fotos: fullAudit.fotos || []
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

  const auditsFiltrados = [...audits]
    .filter((audit) => (tipoFiltroRelatorio ? audit.tipo === tipoFiltroRelatorio : true))
    .filter((audit) => (subestacaoFiltro ? String(audit.pt?.id_subestacao) === String(subestacaoFiltro) : true))
    .filter((audit) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        audit.id_pt?.toLowerCase().includes(termo) ||
        audit.pt?.proprietario?.nome?.toLowerCase().includes(termo) ||
        audit.pt?.subestacao?.nome?.toLowerCase().includes(termo) ||
        audit.tarefa?.titulo?.toLowerCase().includes(termo)
      );
    })
    .filter((audit) => {
      if (periodoFiltro === 'todos') return true;
      const dataAudit = new Date(audit.data_inspecao);
      const hoje = new Date();
      const dias = periodoFiltro === '7' ? 7 : periodoFiltro === '30' ? 30 : 90;
      const limite = new Date(hoje);
      limite.setDate(hoje.getDate() - dias);
      return dataAudit >= limite;
    })
    .sort((a, b) =>
      ordenacaoRelatorio === 'recentes'
        ? new Date(b.data_inspecao) - new Date(a.data_inspecao)
        : new Date(a.data_inspecao) - new Date(b.data_inspecao)
    );

  const tarefasFiltradas = [...tarefas]
    .filter((tarefa) => (subestacaoFiltro ? String(tarefa.pt?.subestacao?.id) === String(subestacaoFiltro) : true))
    .filter((tarefa) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        tarefa.titulo?.toLowerCase().includes(termo) ||
        tarefa.id_pt?.toLowerCase().includes(termo) ||
        tarefa.pt?.proprietario?.nome?.toLowerCase().includes(termo) ||
        tarefa.auditor?.nome?.toLowerCase().includes(termo) ||
        tarefa.pt?.subestacao?.nome?.toLowerCase().includes(termo)
      );
    })
    .filter((tarefa) => {
      if (periodoFiltro === 'todos') return true;
      const dataRef = tarefa.data_fim || tarefa.data_inicio || tarefa.data_prevista;
      if (!dataRef) return true;
      const data = new Date(dataRef);
      const hoje = new Date();
      const dias = periodoFiltro === '7' ? 7 : periodoFiltro === '30' ? 30 : 90;
      const limite = new Date(hoje);
      limite.setDate(hoje.getDate() - dias);
      return data >= limite;
    })
    .sort((a, b) => {
      const db = b.data_fim || b.data_inicio || b.data_prevista;
      const da = a.data_fim || a.data_inicio || a.data_prevista;
      return ordenacaoRelatorio === 'recentes'
        ? new Date(db) - new Date(da)
        : new Date(da) - new Date(db);
    });

  const totalPreventivas = auditsFiltrados.filter((a) => a.tipo === 'Preventiva').length;
  const totalCorretivas = auditsFiltrados.filter((a) => a.tipo === 'Corretiva').length;
  const totalComTarefa = auditsFiltrados.filter((a) => Boolean(a.tarefa?.id)).length;
  const emissaoRelatorio = new Date().toLocaleString('pt-PT');
  const auditsParaExibicao = modoRelatorio === 'executivo' ? auditsFiltrados.slice(0, limiteExecutivo) : auditsFiltrados;
  const tarefasParaExibicao = modoRelatorio === 'executivo' ? tarefasFiltradas.slice(0, limiteExecutivo) : tarefasFiltradas;

  const csvEscape = (value) => {
    const text = String(value ?? '');
    if (text.includes(';') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const handleExportCSV = () => {
    if (subView === 'inspecoes') {
      if (auditsFiltrados.length === 0) {
        alert('Sem dados para exportar no relatório atual.');
        return;
      }

      const header = [
        'Código Cliente',
        'Proprietário',
        'Tipo',
        'Resultado',
        'Urgência',
        'Data da Auditoria',
        'Subestação',
        'Localidade',
        'Tarefa',
        'Auditor',
        'Observações'
      ];

      const rows = auditsFiltrados.map((audit) => ([
        audit.id_pt,
        audit.pt?.proprietario?.nome || '',
        audit.tipo || '',
        audit.resultado || 'Em Avaliação',
        audit.nivel_urgencia || 'N/A',
        audit.data_inspecao ? new Date(audit.data_inspecao).toLocaleDateString('pt-PT') : '',
        audit.pt?.subestacao?.nome || '',
        audit.pt?.municipio || audit.pt?.subestacao?.municipio || '',
        audit.tarefa?.titulo || '',
        audit.auditor?.nome || '',
        audit.observacoes || ''
      ]));

      const csv = [header, ...rows].map((line) => line.map(csvEscape).join(';')).join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-inspecoes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (tarefas.length === 0) {
      alert('Sem tarefas concluídas para exportar.');
      return;
    }

    const header = [
      'Auditor',
      'Tarefa',
      'Cliente',
      'Data de Início',
      'Data de Fim',
      'Checklist Validado'
    ];

    const rows = tarefas.map((tarefa) => {
      const totalChecklist = tarefa.checklist?.length || 0;
      const checkedChecklist = tarefa.checklist?.filter((c) => c.checked).length || 0;
      return [
        tarefa.auditor?.nome || '',
        tarefa.titulo || '',
        tarefa.id_pt || '',
        tarefa.data_inicio ? new Date(tarefa.data_inicio).toLocaleString('pt-PT') : '',
        tarefa.data_fim ? new Date(tarefa.data_fim).toLocaleString('pt-PT') : '',
        `${checkedChecklist}/${totalChecklist}`
      ];
    });

    const csv = [header, ...rows].map((line) => line.map(csvEscape).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-tarefas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async (auditId) => {
    try {
      const response = await api.get(`/inspecoes/${auditId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_Inspecao_${auditId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao descarregar PDF:', err);
      alert('Erro ao gerar o relatório PDF. Por favor, tente novamente.');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleResetPreferencias = () => {
    setModoRelatorio('completo');
    setLimiteExecutivo(12);
    localStorage.removeItem('@PTAS:ptaudits:modo');
    localStorage.removeItem('@PTAS:ptaudits:limiteExecutivo');
  };

  if (view === 'list') {
    return (
      <div className={`max-w-full p-6 mx-auto space-y-8 animate-in fade-in duration-500 print-report ${modoRelatorio === 'executivo' ? 'executive-mode' : ''}`}>
        <style>{`
          @media print {
            .print-hide { display: none !important; }
            .print-only { display: block !important; }
            .print-report { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .print-compact { margin-bottom: 12px !important; }
            .print-table-wrap { border: 1px solid #d1d5db !important; border-radius: 0 !important; box-shadow: none !important; }
            .print-table-wrap table { font-size: 11px !important; }
            .print-kpi { border: 1px solid #d1d5db !important; box-shadow: none !important; }
            .print-footer {
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0;
              border-top: 1px solid #d1d5db;
              padding: 6px 12px;
              font-size: 10px;
              color: #4b5563;
              display: flex !important;
              justify-content: space-between;
              align-items: center;
              background: #fff;
            }
            .print-page::after {
              content: "Página " counter(page);
            }
            .executive-mode .executive-hide {
              display: none !important;
            }
            .executive-mode .print-table-wrap table th,
            .executive-mode .print-table-wrap table td {
              padding: 8px 10px !important;
              font-size: 10px !important;
            }
            body { background: #fff !important; }
          }
          @media screen {
            .print-only { display: none !important; }
            .print-footer { display: none !important; }
          }
        `}</style>

        <div className="print-only mb-4 border border-[#d1d5db] p-4">
          <h1 className="text-lg font-black text-[#0f1c2c] uppercase">Relatório Técnico de Auditorias de Clientes</h1>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
            <p><strong>Emitido em:</strong> {emissaoRelatorio}</p>
            <p><strong>Utilizador:</strong> {user?.nome || 'Operador'}</p>
            <p><strong>Localidade:</strong> {localidadeFiltro || 'Todas'}</p>
            <p><strong>Secção:</strong> {subView === 'inspecoes' ? 'Inspeções PT' : 'Tarefas Concluídas'}</p>
            <p><strong>Modo:</strong> {modoRelatorio === 'executivo' ? 'Executivo (1 página)' : 'Completo'}</p>
            {modoRelatorio === 'executivo' && <p><strong>Limite:</strong> {limiteExecutivo} linhas</p>}
          </div>
        </div>

        <div className="print-footer">
          <span>MBT Energia - Relatório Oficial de Auditorias</span>
          <span className="print-page"></span>
        </div>

        <div className="flex justify-between items-center mb-6 print-compact">
          <div className="flex gap-4 items-center">
            <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Relatório de Atividades</h2>
            {localidadeFiltro && (
              <span className="px-3 py-2 bg-[#eff4ff] border border-[#0d3fd1]/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#0d3fd1]">
                Localidade: {localidadeFiltro}
              </span>
            )}
            <div className="bg-[#f8faff] rounded-xl p-1 border border-[#c4c5d7]/20 flex print-hide">
              <button
                onClick={() => setSubView('inspecoes')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${subView === 'inspecoes' ? 'bg-white text-[#0d3fd1] shadow-sm' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
              > <ClipboardList className="w-4 h-4" />
                Inspeções de Clientes
              </button>
              <button
                onClick={() => setSubView('tarefas')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${subView === 'tarefas' ? 'bg-white text-[#005229] shadow-sm' : 'text-[#747686] hover:text-[#0f1c2c]'}`}
              >  <CheckCircle className="w-4 h-4" />
                Tarefas
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 print-hide">            <button
            onClick={() => setModoRelatorio((prev) => (prev === 'executivo' ? 'completo' : 'executivo'))}
            className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#444655] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f8faff] transition-all"
          >  <LayoutGrid className="w-4 h-4" />
            Rel.{modoRelatorio === 'executivo' ? 'Executivo' : 'Completo'}
          </button>
            <button
              onClick={handleResetPreferencias}
              className="flex items-center gap-2 bg-white border border-[#c4c5d7]/30 text-[#444655] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f8faff] transition-all"
            >  <RefreshCw className="w-4 h-4" />
              Repor
            </button>
            {modoRelatorio === 'executivo' && (
              <select
                value={limiteExecutivo}
                onChange={(e) => setLimiteExecutivo(Number(e.target.value))}
                className="bg-white border border-[#c4c5d7]/30 text-[#444655] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <option value={8}> 8</option>
                <option value={12}> 12</option>
                <option value={20}> 20</option>
              </select>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-[#38b000] border border-[#c4c5d7]/30 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#007200] transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-[#d00000] text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#9d0208] transition-all"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setSelectedAuditId(null);
                  setFormData({
                    id_pt: '',
                    id_tarefa: '',
                    tipo: 'Preventiva',
                    data_inspecao: new Date().toISOString().split('T')[0],
                    resultado: 'Em Avaliação',
                    nivel_urgencia: 'Baixo',
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
                Auditoria
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 print-hide">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código cliente, nome, subestação ou tarefa..."
            className="md:col-span-1 bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#0f1c2c]"
          />
          <select
            value={subestacaoFiltro}
            onChange={(e) => setSubestacaoFiltro(e.target.value)}
            className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold uppercase text-[#0f1c2c]"
          >
            <option value="">Todas as Subestações</option>
            {(Array.isArray(subestacoes) ? subestacoes : [])
              .filter(s => !localidadeFiltro || s.municipio === localidadeFiltro)
              .map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
          </select>
          <select
            value={tipoFiltroRelatorio}
            onChange={(e) => setTipoFiltroRelatorio(e.target.value)}
            className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold uppercase text-[#0f1c2c]"
          >
            <option value="">Todos os tipos</option>
            <option value="Preventiva">Preventiva</option>
            <option value="Corretiva">Corretiva</option>
          </select>
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold uppercase text-[#0f1c2c]"
          >
            <option value="todos">Todo período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <div className="mb-6 print-hide">
          <select
            value={ordenacaoRelatorio}
            onChange={(e) => setOrdenacaoRelatorio(e.target.value)}
            className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 text-[11px] font-bold uppercase text-[#0f1c2c]"
          >
            <option value="recentes">Ordenação: mais recentes</option>
            <option value="antigas">Ordenação: mais antigas</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 print-compact executive-hide">
          <div className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 print-kpi">
            <p className="text-[10px] font-black text-[#747686] uppercase">Total filtrado</p>
            <p className="text-lg font-black text-[#0f1c2c]">
              {subView === 'inspecoes' ? auditsFiltrados.length : tarefasFiltradas.length}
            </p>
          </div>
          <div className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 print-kpi">
            <p className="text-[10px] font-black text-[#747686] uppercase">Preventivas</p>
            <p className="text-lg font-black text-[#0d3fd1]">{totalPreventivas}</p>
          </div>
          <div className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 print-kpi">
            <p className="text-[10px] font-black text-[#747686] uppercase">Corretivas</p>
            <p className="text-lg font-black text-[#0f1c2c]">{totalCorretivas}</p>
          </div>
          <div className="bg-white border border-[#c4c5d7]/20 rounded-xl px-4 py-3 print-kpi">
            <p className="text-[10px] font-black text-[#747686] uppercase">Com tarefa</p>
            <p className="text-lg font-black text-[#005229]">{totalComTarefa}</p>
          </div>
        </div>

        {subView === 'inspecoes' ? (
          <div className="bg-white rounded-[1rem] border border-[#c4c5d7]/20 shadow-xl overflow-hidden print-table-wrap">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8faff] border-b border-[#c4c5d7]/20">
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center">Cód. Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center">Resultado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10">Proprietário</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center font-mono">Urgência</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#747686] uppercase tracking-[0.2em] border-r border-[#c4c5d7]/10 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c5d7]/10">
                {auditsParaExibicao.map((audit, idx) => (
                  <tr key={audit.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdff]'} hover:bg-[#eff4ff] transition-colors group`}>
                    <td className="px-8 py-5 text-sm font-bold text-[#0f1c2c] border-r border-[#c4c5d7]/10 text-center font-mono relative">
                      {audit.id_pt}
                      {audit.fotos?.length > 0 && (
                        <div className="absolute top-1 right-1">
                          <Plus className="w-2.5 h-2.5 text-emerald-500" />
                          <div className="bg-emerald-500 w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 animate-pulse" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center border-r border-[#c4c5d7]/10">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-wider ${audit.resultado === 'Conforme' ? 'bg-emerald-500' :
                        audit.resultado === 'Não Conforme' ? 'bg-amber-500' :
                          audit.resultado === 'Urgente' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                        {audit.resultado || 'N/D'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#444655] border-r border-[#c4c5d7]/10">
                      {audit.pt?.proprietario?.nome || 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-center border-r border-[#c4c5d7]/10">
                      {audit.nivel_urgencia && (audit.resultado === 'Não Conforme' || audit.resultado === 'Urgente') ? (
                        <span className={`inline-flex px-2 py-1 rounded-md text-[8px] font-black text-white uppercase ${audit.nivel_urgencia === 'Crítico' ? 'bg-red-700' :
                          audit.nivel_urgencia === 'Alto' ? 'bg-orange-600' : 'bg-amber-600'
                          }`}>
                          {audit.nivel_urgencia}
                        </span>
                      ) : <span className="text-[#c4c5d7]">—</span>}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-[#c4c5d7]/10 font-mono text-center">
                      {new Date(audit.data_inspecao).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-8 py-5 print-hide">
                      <div className="flex justify-center gap-2 print-hide">
                        <button
                          onClick={() => handleView(audit)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#eff4ff] text-[#0d3fd1] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-all"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(audit.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#eff4ff] text-[#0d3fd1] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0d3fd1] hover:text-white transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF
                        </button>
                        {user?.role === 'admin' && (
                          <>

                            <button
                              onClick={() => handleDelete(audit.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4c5d7]/30 text-[#444655] rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all"
                            >
                              Apagar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {auditsParaExibicao.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                      Nenhuma auditoria registada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-[1rem] border border-emerald-100 shadow-xl overflow-hidden print-table-wrap">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Auditor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Tarefa / Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Proprietário/Localidade</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Início</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] border-r border-emerald-200/50">Fim (Conclusão)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/50">
                {tarefasParaExibicao.map((tarefa, idx) => (
                  <tr key={tarefa.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'} hover:bg-emerald-50 transition-colors group`}>
                    <td className="px-8 py-5 text-sm font-bold text-[#0f1c2c] border-r border-emerald-50">
                      {tarefa.auditor?.nome || 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#444655] border-r border-emerald-50">
                      {tarefa.titulo} {tarefa.id_pt && `(Cód: ${tarefa.id_pt})`}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-[#444655] border-r border-emerald-50 uppercase">
                      {(tarefa.pt?.proprietario?.nome || 'N/A')} / {(tarefa.pt?.subestacao?.municipio || tarefa.pt?.municipio || 'N/A')}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-emerald-50 font-mono">
                      {tarefa.data_inicio ? new Date(tarefa.data_inicio).toLocaleString('pt-PT') : '-'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#747686] border-r border-emerald-50 font-mono">
                      {tarefa.data_fim ? new Date(tarefa.data_fim).toLocaleString('pt-PT') : '-'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setAuditTarefa(tarefa)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md"
                        >
                          Auditar Cliente
                        </button>
                        {tarefa.data_fim && user?.role === 'admin' && (
                          <button
                            onClick={() => handleOpenFollowUp(tarefa)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#f8faff] border border-[#c4c5d7]/30 text-[#0d3fd1] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all"
                          >
                            <Wrench className="w-3.5 h-3.5" /> Agendar Seguimento
                          </button>
                        )}
                        {tarefa.data_fim && (
                          <span className="flex items-center text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-3 py-1 rounded-md">
                            Checklist: {tarefa.checklist?.filter(c => c.checked).length || 0}/{tarefa.checklist?.length || 0}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tarefasParaExibicao.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-[#747686] font-black uppercase tracking-[0.2em] opacity-30">
                      Nenhuma tarefa encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {auditTarefa && (
          <QuickAuditModal
            tarefa={auditTarefa}
            onClose={() => setAuditTarefa(null)}
            onDone={() => {
              setAuditTarefa(null);
              // Trigger refresh of data
              setView('list');
            }}
          />
        )}
      </div>
    );
  }

  if (view === 'detail' && detailTarefa) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-3 bg-white border border-[#c4c5d7]/20 rounded-xl hover:bg-[#eff4ff] transition-all">
              <ArrowLeft className="w-5 h-5 text-[#444655]" />
            </button>
            <div>
              <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Detalhes da Tarefa</h2>
              <p className="text-sm text-[#747686] font-medium opacity-60">Relatório técnico submetido para validação</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#c4c5d7]/30 text-[#444655] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f8faff] transition-all"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-xl overflow-hidden">
          <div className="bg-[#243141] px-10 py-6 border-b border-white/5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0d3fd1] rounded-xl">
                  <CheckCircle className="w-5 h-5 text-[#5fff9b]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#5fff9b] uppercase tracking-widest">Estado: {detailTarefa.status}</span>
                  <h3 className="text-white text-lg font-bold uppercase">{detailTarefa.titulo}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-white/40 uppercase block mb-1">PT Associado</span>
                <p className="text-white font-black">{detailTarefa.id_pt || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest border-b border-[#0d3fd1]/10 pb-2">Informações Gerais</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#c4c5d7]/10">
                    <span className="text-xs font-bold text-[#747686] uppercase">Técnico</span>
                    <span className="text-sm font-black text-[#0f1c2c]">{detailTarefa.auditor?.nome}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#c4c5d7]/10">
                    <span className="text-xs font-bold text-[#747686] uppercase">Data Conclusão</span>
                    <span className="text-sm font-black text-[#0f1c2c]">{detailTarefa.data_fim ? new Date(detailTarefa.data_fim).toLocaleString('pt-PT') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest border-b border-[#0d3fd1]/10 pb-2">Checklist de Auditoria</h4>
                <div className="space-y-2">
                  {detailTarefa.checklist?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#f8faff] rounded-xl border border-[#c4c5d7]/10">
                      <span className="text-[11px] font-bold text-[#444655]">{item.label}</span>
                      {item.checked ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-[#c4c5d7]/20 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-[#747686] uppercase mb-1">Decisória de Gestão</p>
                <p className="text-xs text-[#444655] font-medium max-w-sm">Valide os itens acima para concluir o ciclo desta tarefa no sistema.</p>
              </div>

              {detailTarefa.status === 'Aguardando Validação' && user?.role === 'admin' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleValidarTarefa(detailTarefa.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all font-bold"
                  >
                    <CheckCircle className="w-4 h-4" /> Validar Somente
                  </button>
                  <button
                    onClick={() => handleValidarTarefa(detailTarefa.id, true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all font-bold"
                  >
                    <Wrench className="w-4 h-4" /> Validar e Agendar Seguimento
                  </button>
                </div>
              ) : (
                <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase">
                  Tarefa Concluída e Validada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-md p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-[#243141] px-8 py-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-[#5fff9b] uppercase tracking-widest block mb-1">Encaminhamento Técnico</span>
                <h3 className="text-white text-lg font-black uppercase">Agendar Seguimento de PT</h3>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFollowUp} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block">Título da Intervenção</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c]"
                  value={followUpData.titulo}
                  onChange={e => setFollowUpData({ ...followUpData, titulo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block">Tipo</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c]"
                    value={followUpData.tipo}
                    onChange={e => setFollowUpData({ ...followUpData, tipo: e.target.value })}
                  >
                    <option value="Inspeção">Inspeção Técnica</option>
                    <option value="Manutenção Preventiva">Manutenção Prev.</option>
                    <option value="Manutenção Corretiva">Manutenção Corr.</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block">Prioridade</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c]"
                    value={followUpData.prioridade}
                    onChange={e => setFollowUpData({ ...followUpData, prioridade: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block">Atribuir Técnico</label>
                <select
                  required
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c]"
                  value={followUpData.auditor_id}
                  onChange={e => setFollowUpData({ ...followUpData, auditor_id: e.target.value })}
                >
                  <option value="">Escolha um técnico...</option>
                  {auditores.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-2 block">Data Alvo</label>
                <input
                  type="date"
                  required
                  className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl px-5 py-3 text-sm font-bold text-[#0f1c2c]"
                  value={followUpData.data}
                  onChange={e => setFollowUpData({ ...followUpData, data: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-[#444655] hover:bg-[#f8faff] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0d3fd1] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-[#0d3fd1]/20 hover:bg-[#0034cc] transition-all"
                >
                  Agendar Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
              {/* Resultado & Urgencia no passo 1 */}
              <div className="bg-[#fcfdff] border border-[#0d3fd1]/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-[#747686] uppercase tracking-widest mb-3">Resultado da Auditoria *</label>
                  <div className="flex gap-2">
                    {['Conforme', 'Não Conforme', 'Urgente', 'Em Avaliação'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, resultado: r })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.resultado === r
                          ? r === 'Conforme' ? 'bg-emerald-500 text-white border-transparent' :
                            r === 'Não Conforme' ? 'bg-amber-500 text-white border-transparent' :
                              r === 'Urgente' ? 'bg-red-500 text-white border-transparent' : 'bg-blue-500 text-white border-transparent'
                          : 'bg-white border-[#c4c5d7]/20 text-[#444655]'
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {['Não Conforme', 'Urgente', 'Em Avaliação'].includes(formData.resultado) && (
                  <div>
                    <label className="block text-[10px] font-black text-[#747686] uppercase tracking-widest mb-3">Nível de Urgência</label>
                    <div className="flex gap-2">
                      {['Baixo', 'Médio', 'Alto', 'Crítico'].map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFormData({ ...formData, nivel_urgencia: u })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.nivel_urgencia === u
                            ? u === 'Crítico' ? 'bg-red-700 text-white border-transparent' :
                              u === 'Alto' ? 'bg-orange-600 text-white border-transparent' : 'bg-amber-600 text-white border-transparent'
                            : 'bg-white border-[#c4c5d7]/20 text-[#444655]'
                            }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Tarefa Associada (Opcional)</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                    value={formData.id_tarefa || ''}
                    onChange={(e) => handleSelectTask(e.target.value)}
                  >
                    <option value="">Nenhuma tarefa associada</option>
                    {(formData.id_pt ? allTasks.filter((t) => t.id_pt === formData.id_pt && t.status !== 'Concluída') : allTasks.filter((t) => t.id_pt && t.status !== 'Concluída')).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.titulo} {task.id_pt ? `(${task.id_pt})` : ''}
                      </option>
                    ))}
                  </select>
                  {!formData.id_pt && (
                    <p className="text-[10px] font-bold text-[#747686] uppercase tracking-widest opacity-70">
                      Dica: selecione uma tarefa para preencher automaticamente o PT.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Selecionar Posto (PT)</label>
                  <select
                    className="w-full bg-[#f8faff] border border-[#c4c5d7]/20 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]"
                    value={formData.id_pt || ''}
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
                  <label key={item.key} className="flex flex-col items-start gap-4 p-6 bg-white border border-[#c4c5d7]/10 rounded-[1rem] cursor-pointer hover:border-[#0d3fd1]/40 transition-all shadow-sm text-center">
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
              <div className="bg-[#eff4ff] p-8 rounded-3xl border border-[#0d3fd1]/10 space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black text-[#0d3fd1] uppercase tracking-tight">Resumo da Inspeção</h4>
                    {selectedAuditId && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(selectedAuditId)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#0d3fd1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10"
                      >
                        <FileText className="w-4 h-4" />
                        Descarregar Relatório PDF
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-[#0d3fd1]/10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Posto Alvo</span>
                      <p className="text-sm font-black text-[#0f1c2c]">{formData.id_pt || 'Não selecionado'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Tipo Protocolo</span>
                      <p className="text-sm font-black text-[#0f1c2c]">{formData.tipo}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                        <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-1">Técnico Responsável</p>
                        <p className="text-sm font-black text-[#0d3fd1] uppercase tracking-tight">
                          {selectedAuditId ? (audits.find(a => a.id === selectedAuditId)?.auditor?.nome || 'N/A') : user?.nome}
                        </p>
                      </div>
                      <div className="bg-[#fcfdff] border border-[#c4c5d7]/20 rounded-xl p-4">
                        <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest mb-1">Data da Auditoria</p>
                        <p className="text-sm font-black text-[#0f1c2c]">{formData.data_inspecao}</p>
                      </div>
                    </div>
                    {formData.id_tarefa && (
                      <div className="space-y-1 md:col-span-3">
                        <span className="text-[9px] font-black text-[#747686] uppercase opacity-60">Tarefa Associada</span>
                        <p className="text-sm font-black text-[#0f1c2c]">
                          {allTasks.find(t => String(t.id) === String(formData.id_tarefa))?.titulo || formData.id_tarefa}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Conformidade */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest bg-white/60 px-3 py-1.5 rounded-lg inline-block shadow-sm">Conformidade</h5>
                    <ul className="space-y-3 bg-white/40 p-5 rounded-2xl border border-white/50">
                      {[
                        { key: 'licenciamento', label: 'Licença DGE' },
                        { key: 'projeto_aprovado', label: 'Projeto Aprovado' },
                        { key: 'diagramas_unifilares', label: 'Diagramas Unifilares' },
                        { key: 'plano_manutencao', label: 'Plano Manutenção' },
                        { key: 'registos_inspecao', label: 'Registos de Inspeção' },
                        { key: 'normas_iec', label: 'Normas IEC' },
                        { key: 'normas_ieee', label: 'Normas IEEE' },
                        { key: 'normas_locais', label: 'Normas Locais' }
                      ].map((item) => (
                        <li key={item.key} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">{item.label}</span>
                          <span className={`font-black uppercase text-[9px] px-2 py-1 rounded-md ${formData.conformidade[item.key] ? 'bg-[#5fff9b]/30 text-[#005229]' : 'bg-red-100/80 text-red-700'}`}>
                            {formData.conformidade[item.key] ? 'SIM' : 'NÃO'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-8">
                    {/* Transformador */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest bg-white/60 px-3 py-1.5 rounded-lg inline-block shadow-sm">Transformador</h5>
                      <ul className="space-y-3 bg-white/40 p-5 rounded-2xl border border-white/50">
                        <li className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Potência</span>
                          <span className="font-black text-[#0f1c2c]">{formData.transformador.potencia_kva} kVA</span>
                        </li>
                        <li className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Isolamento</span>
                          <span className="font-black text-[#0f1c2c]">{formData.transformador.tipo_isolamento}</span>
                        </li>
                        <li className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Estado do Óleo</span>
                          <span className="font-black text-[#0f1c2c]">{formData.transformador.estado_oleo}</span>
                        </li>
                        <li className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Temp. Operação</span>
                          <span className="font-black text-[#0f1c2c]">{formData.transformador.temperatura_operacao} ºC</span>
                        </li>
                        <li className="flex justify-between items-center text-xs border-t border-[#0d3fd1]/10 pt-3 mt-1">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Sinais de Fugas</span>
                          <span className={`font-black uppercase text-[9px] px-2 py-1 rounded-md ${formData.transformador.fugas ? 'bg-red-100/80 text-red-700' : 'bg-[#5fff9b]/30 text-[#005229]'}`}>
                            {formData.transformador.fugas ? 'SIM' : 'NÃO'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Segurança */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest bg-white/60 px-3 py-1.5 rounded-lg inline-block shadow-sm">Segurança</h5>
                      <ul className="space-y-3 bg-white/40 p-5 rounded-2xl border border-white/50">
                        <li className="flex justify-between items-center text-xs border-b border-[#0d3fd1]/10 pb-3 mb-1">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Terra Protecção</span>
                          <span className="font-black text-[#0f1c2c]">{formData.terra_protecao ?? formData.seguranca.resistencia_terra ?? 'N/D'} Ω</span>
                        </li>
                        <li className="flex justify-between items-center text-xs border-b border-[#0d3fd1]/10 pb-3 mb-1">
                          <span className="font-bold text-[#444655] uppercase tracking-wide">Terra Serviço</span>
                          <span className="font-black text-[#0f1c2c]">{formData.terra_servico ?? 'N/D'} Ω</span>
                        </li>
                        {[
                          { key: 'protecao_raios', label: 'Proteção Raios' },
                          { key: 'spd', label: 'Descarregadores (SPD)' },
                          { key: 'sinalizacao', label: 'Sinalização Perigo' },
                          { key: 'combate_incendio', label: 'Extintores/CO2' },
                          { key: 'distancias_seguranca', label: 'Distâncias Seguras' }
                        ].map((item) => (
                          <li key={item.key} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[#444655] uppercase tracking-wide">{item.label}</span>
                            <span className={`font-black uppercase text-[9px] px-2 py-1 rounded-md ${formData.seguranca[item.key] ? 'bg-[#5fff9b]/30 text-[#005229]' : 'bg-red-100/80 text-red-700'}`}>
                              {formData.seguranca[item.key] ? 'SIM' : 'NÃO'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {formData.incongruencias?.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-100 px-3 py-1.5 rounded-lg inline-block shadow-sm">Incongruências Detetadas</h5>
                    <ul className="space-y-3 bg-amber-50 p-5 rounded-2xl border border-amber-200">
                      {formData.incongruencias.map((inc, i) => (
                        <li key={i} className="flex flex-col gap-1 text-xs py-2 border-b border-amber-200/50 last:border-0">
                          <span className="font-black text-amber-900 uppercase tracking-wide flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> {inc.descricao}
                          </span>
                          <div className="flex gap-4 ml-5">
                            <span className="text-amber-700">Sistema: <span className="font-bold">{inc.valor_cadastro || '---'}</span></span>
                            <span className="text-amber-900">Campo: <span className="font-black">{inc.valor_apurado || '---'}</span></span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444655] uppercase tracking-widest ml-1">Observações Finais</label>
                <textarea
                  className="w-full h-24 bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl py-6 px-8 text-sm font-medium text-[#444655] resize-none"
                  placeholder="Descreva as conclusões técnicas da auditoria..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              {/* Galeria de Fotos de Campo (se existirem) */}
              {formData.fotos?.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest bg-[#eff4ff] px-3 py-1.5 rounded-lg inline-block shadow-sm">
                    Evidências Fotográficas ({formData.fotos.length})
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.fotos.map((foto, i) => (
                      <div key={i} className="group relative bg-white p-2 rounded-2xl border border-[#c4c5d7]/10 shadow-sm hover:shadow-md transition-all">
                        <img
                          src={foto.data}
                          alt={foto.label}
                          className="w-full h-32 object-cover rounded-xl cursor-pointer"
                          onClick={() => window.open(foto.data, '_blank')}
                        />
                        <div className="absolute inset-x-2 bottom-2 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <p className="text-[8px] text-white font-black uppercase tracking-wider truncate">{foto.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              )}

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
