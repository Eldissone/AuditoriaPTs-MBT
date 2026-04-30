import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldAlert,
  ArrowUpRight,
  CreditCard,
  User,
  Phone,
  Mail,
  Activity,
  Layers,
  CheckCircle2,
  Briefcase,
  Edit3,
  X,
  Save
} from 'lucide-react';
import api from '../services/api';

export default function ProprietarioDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proprietario, setProprietario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchProprietario(); }, [id]);

  async function fetchProprietario() {
    try {
      setLoading(true);
      const res = await api.get(`/proprietarios/${id}`);
      setProprietario(res.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do proprietário', err);
      alert('Erro ao carregar dados do proprietário.');
      navigate('/gestao-clientes');
    } finally {
      setLoading(false);
    }
  }

  function openEdit() {
    setEditData({
      nome: proprietario.nome || '',
      nif: proprietario.nif || '',
      email: proprietario.email || '',
      telefone: proprietario.telefone || '',
      tipo_cliente: proprietario.tipo_cliente || '',
      responsavel_financeiro: proprietario.responsavel_financeiro || '',
      contacto_resp_financeiro: proprietario.contacto_resp_financeiro || '',
      conta_contrato: proprietario.conta_contrato || '',
      parceiro_negocios: proprietario.parceiro_negocios || '',
      categoria_tarifa: proprietario.categoria_tarifa || '',
      txt_categoria_tarifa: proprietario.txt_categoria_tarifa || '',
      montante_divida: proprietario.montante_divida ?? '',
      num_facturas_atraso: proprietario.num_facturas_atraso ?? '',
      concessionaria: proprietario.concessionaria || '',
      zona: proprietario.zona || '',
      operador: proprietario.operador || '',
    });
    setEditOpen(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const payload = { ...editData };
      if (payload.montante_divida !== '') payload.montante_divida = parseFloat(payload.montante_divida) || 0;
      else delete payload.montante_divida;
      if (payload.num_facturas_atraso !== '') payload.num_facturas_atraso = parseInt(payload.num_facturas_atraso) || 0;
      else delete payload.num_facturas_atraso;

      const res = await api.put(`/proprietarios/${id}`, payload);
      setProprietario(prev => ({ ...prev, ...res.data }));
      setEditOpen(false);
    } catch (err) {
      console.error('Erro ao guardar proprietário', err);
      alert('Erro ao guardar alterações: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }

  const field = (k, label, type = 'text') => (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-[#747686] uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={editData[k] ?? ''}
        onChange={e => setEditData(d => ({ ...d, [k]: e.target.value }))}
        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-3 px-4 text-sm font-bold text-[#0f1c2c] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all"
      />
    </div>
  );

  if (loading) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black #0d3fd1 uppercase tracking-widest">Carregando Perfil Comercial...</p>
    </div>
  );

  if (!proprietario) return null;

  return (
    <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#c4c5d7]/20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-[#f8faff] border border-[#c4c5d7]/20 rounded-2xl hover:bg-white transition-all shadow-inner group">
            <ArrowLeft className="w-5 h-5 text-[#444655] group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-purple-200">
              <Briefcase className="w-7 h-7 #0d3fd1" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">{proprietario.nome}</h2>
                <span className="bg-purple-50 text-purple-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-purple-100">Proprietário</span>
              </div>
              <div className="flex items-center gap-4 text-[#747686] text-[10px] font-bold uppercase tracking-wider">
                {proprietario.nif && <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-purple-400" /> NIF: {proprietario.nif}</span>}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={openEdit}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          Editar Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Col ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Financial Health */}
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden">
            <div className={`px-6 py-4 flex items-center justify-between ${Number(proprietario.montante_divida) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${Number(proprietario.montante_divida) > 0 ? 'text-red-700' : 'text-green-700'}`}>Saúde Financeira</h3>
              {Number(proprietario.montante_divida) > 0 ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-1">Dívida Total Acumulada</p>
                <p className={`text-3xl font-black tracking-tight ${Number(proprietario.montante_divida) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Number(proprietario.montante_divida || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-sm">Kz</span>
                </p>
                {Number(proprietario.num_facturas_atraso) > 0 && (
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 mt-2 inline-block">
                    {proprietario.num_facturas_atraso} Faturas Pendentes
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#c4c5d7]/10">
                <div>
                  <p className="text-[8px] font-black text-[#747686] uppercase tracking-widest mb-1">Categoria Tarifária</p>
                  <p className="text-xs font-black text-[#0f1c2c]">{proprietario.categoria_tarifa || '—'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-[#747686] uppercase tracking-widest mb-1">Contrato SAP</p>
                  <p className="text-xs font-black text-[#0f1c2c]">{proprietario.conta_contrato || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm p-6 space-y-6">
            <h3 className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-purple-500" /> Dados de Contacto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f8faff] rounded-xl text-[#747686]"><Phone className="w-4 h-4" /></div>
                <div>
                  <p className="text-[8px] font-black text-[#747686] uppercase tracking-widest">Telefone</p>
                  <p className="text-[11px] font-bold text-[#0f1c2c]">{proprietario.telefone || 'Não Registado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f8faff] rounded-xl text-[#747686]"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="text-[8px] font-black text-[#747686] uppercase tracking-widest">E-mail</p>
                  <p className="text-[11px] font-bold text-[#0f1c2c]">{proprietario.email || 'Não Registado'}</p>
                </div>
              </div>
              {proprietario.responsavel_financeiro && (
                <div className="pt-4 border-t border-[#c4c5d7]/10">
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest mb-3">Responsável Financeiro</p>
                  <div className="flex items-center gap-3 bg-[#eff4ff]/60 p-3 rounded-2xl border border-[#0d3fd1]/5">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[10px] text-[#0d3fd1] shadow-sm">
                      {proprietario.responsavel_financeiro[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#0f1c2c]">{proprietario.responsavel_financeiro}</p>
                      <p className="text-[9px] font-bold text-[#747686]">{proprietario.contacto_resp_financeiro || ''}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Col: PTs ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-[#c4c5d7]/20 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-8 py-6 border-b border-[#c4c5d7]/10 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0f1c2c] uppercase tracking-tight">Ativos Técnicos Associados</h3>
                  <p className="text-[9px] font-bold text-[#747686] uppercase tracking-widest">Postos de Transformação (PTs)</p>
                </div>
              </div>
              <div className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <span className="text-[10px] font-black text-blue-700">{proprietario.pts?.length || 0} Ativos</span>
              </div>
            </div>

            {/* Scrollable Container for Table */}
            <div className={`overflow-x-auto custom-scrollbar ${proprietario.pts?.length > 15 ? 'max-h-[650px] overflow-y-auto' : ''}`}>
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#f8faff] z-20 shadow-sm">
                  <tr className="text-[#747686]">
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest">ID PT / Código</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Potência</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Localidade</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Inspecções</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c5d7]/10">
                  {(() => {
                    const ITEMS_PER_PAGE = 15;
                    const totalItems = proprietario.pts?.length || 0;
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const paginatedItems = (proprietario.pts || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    return (
                      <>
                        {paginatedItems.map(pt => (
                          <tr key={pt.id} className="hover:bg-[#f8faff] transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-[#0d3fd1] uppercase">{pt.id_pt}</span>
                                <span className="text-[9px] font-bold text-[#747686]">{pt.tipo_instalacao}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5"><span className="text-[11px] font-black text-[#0f1c2c]">{pt.potencia_kva} kVA</span></td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#747686]">
                                <MapPin className="w-3 h-3 text-purple-400" />
                                {pt.bairro || pt.localizacao || pt.municipio}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${pt.estado_operacional === 'Operacional' ? 'bg-green-50 text-green-700 border-green-100' :
                                  pt.estado_operacional === 'Crítico' ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                }`}>{pt.estado_operacional}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-[#0f1c2c]">{pt._count?.inspecoes || 0}</span>
                                <span className="text-[8px] font-bold text-[#c4c5d7] uppercase">Total</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => navigate(`/ficha-tecnica/${pt.id_pt}`)}
                                className="p-2.5 bg-white border border-[#c4c5d7]/30 rounded-xl text-[#0d3fd1] hover:bg-[#0d3fd1] hover:text-white transition-all shadow-sm active:scale-90"
                                title="Ficha Técnica"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {totalPages > 1 && (
                          <tr className="bg-[#fcfdff]">
                            <td colSpan={6} className="px-8 py-4">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">
                                  Página {currentPage} de {totalPages} <span className="mx-2 opacity-20">|</span> Total {totalItems} PTs
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 bg-white border border-[#c4c5d7]/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#eff4ff] disabled:opacity-30 transition-all"
                                  >
                                    Anterior
                                  </button>
                                  <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 bg-white border border-[#c4c5d7]/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#eff4ff] disabled:opacity-30 transition-all"
                                  >
                                    Próxima
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                  {!proprietario.pts?.length && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-[10px] font-black text-[#747686] uppercase tracking-widest opacity-30 italic">
                        Este proprietário não possui activos técnicos associados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto p-8 bg-[#fcfdff] border-t border-[#c4c5d7]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">
                  Última Atualização: {new Date(proprietario.atualizado_em).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de Edição ──────────────────────────────────────────────────── */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#c4c5d7]/10 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 #0d3fd1" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0f1c2c] uppercase tracking-tight">Editar Cadastro</h3>
                  <p className="text-[9px] font-bold text-[#747686] uppercase tracking-widest">Proprietário / Cliente Comercial</p>
                </div>
              </div>
              <button onClick={() => setEditOpen(false)} className="p-2 hover:bg-[#f8faff] rounded-xl transition-all text-[#747686]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-8 space-y-6">
              {/* Identificação */}
              <div>
                <p className="text-[10px] font-black #0d3fd1 uppercase tracking-widest mb-4">Identificação</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('nome', 'Nome / Razão Social')}
                  {field('nif', 'NIF')}
                  {field('tipo_cliente', 'Tipo de Cliente')}
                  {field('conta_contrato', 'Conta / Contrato SAP')}
                  {field('parceiro_negocios', 'Parceiro de Negócios')}
                </div>
              </div>

              {/* Contactos */}
              <div className="pt-4 border-t border-[#c4c5d7]/10">
                <p className="text-[10px] font-black #0d3fd1 uppercase tracking-widest mb-4">Contactos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('telefone', 'Telefone')}
                  {field('email', 'E-mail', 'email')}
                  {field('responsavel_financeiro', 'Responsável Financeiro')}
                  {field('contacto_resp_financeiro', 'Contacto Financeiro')}
                </div>
              </div>

              {/* Dados Comerciais */}
              <div className="pt-4 border-t border-[#c4c5d7]/10">
                <p className="text-[10px] font-black #0d3fd1 uppercase tracking-widest mb-4">Dados Comerciais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('categoria_tarifa', 'Categoria Tarifária')}
                  {field('txt_categoria_tarifa', 'Descrição Tarifa')}
                  {field('concessionaria', 'Concessionária')}
                  {field('zona', 'Zona')}
                  {field('operador', 'Operador')}
                </div>
              </div>

              {/* Financeiro */}
              <div className="pt-4 border-t border-[#c4c5d7]/10">
                <p className="text-[10px] font-black #0d3fd1 uppercase tracking-widest mb-4">Situação Financeira</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('montante_divida', 'Montante da Dívida (Kz)', 'number')}
                  {field('num_facturas_atraso', 'Nº Faturas em Atraso', 'number')}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#c4c5d7]/10 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setEditOpen(false)}
                className="px-6 py-3 bg-[#f8faff] text-[#444655] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#eff4ff] transition-all border border-[#c4c5d7]/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
