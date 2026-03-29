import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, 
  ShieldAlert, UserCheck, UserX, Key, 
  Check, X, AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    email: '',
    role: 'auditor',
    password: '',
    ativo: true,
    permissoes: ['/pts', '/subestacoes', '/ficha-tecnica', '/minhas-tarefas']
  });
  
  const availablePermissions = [
    { id: '/', label: 'Painel Central' },
    { id: '/subestacoes', label: 'Subestações' },
    { id: '/pts', label: 'Auditorias PT' },
    { id: '/ficha-tecnica', label: 'Ficha Técnica' },
    { id: '/minhas-tarefas', label: 'Minhas Tarefas' },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/utilizadores');
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({
        ...user,
        password: '',
        permissoes: user.permissoes || []
      });
    } else {
      setFormData({
        id: null,
        nome: '',
        email: '',
        role: 'auditor',
        password: '',
        ativo: true,
        permissoes: ['/pts', '/subestacoes', '/ficha-tecnica', '/minhas-tarefas']
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permId)
        ? prev.permissoes.filter(p => p !== permId)
        : [...prev.permissoes, permId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      if (!payload.password) {
        delete payload.password;
      }
      
      if (payload.id) {
        await api.put(`/utilizadores/${payload.id}`, payload);
      } else {
        if (!payload.password) payload.password = '123456'; // Senha padrão se não enviada
        await api.post('/utilizadores', payload);
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      alert("Erro ao salvar utilizador.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem a certeza que deseja inativar este utilizador?')) {
      try {
        await api.delete(`/utilizadores/${id}`);
        fetchUsers();
      } catch (err) {
        alert("Erro ao inativar utilizador.");
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#243141] flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#0d3fd1]" />
            GESTÃO DE UTILIZADORES
          </h1>
          <p className="text-sm font-bold text-[#c4c5d7] mt-1 uppercase tracking-widest">
            {users.length} utilizadores registados
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[#0d3fd1] hover:bg-[#0a2f9e] text-white font-bold rounded-xl transition-all uppercase text-sm tracking-tight shadow-lg shadow-[#0d3fd1]/20 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Novo Utilizador
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#c4c5d7]/30 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-[#c4c5d7]/30 bg-[#f8f9ff] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#c4c5d7]/50 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#0d3fd1]/20 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#c4c5d7]/30 text-[10px] uppercase font-black tracking-widest text-[#243141]">
                <th className="px-6 py-4">Utilizador</th>
                <th className="px-6 py-4">Papel</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Último Acesso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c5d7]/20">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0d3fd1]/10 flex items-center justify-center text-[#0d3fd1] font-black shrink-0">
                        {user.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#243141] text-sm">{user.nome}</div>
                        <div className="font-medium text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.ativo ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        <UserCheck className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                        <UserX className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {user.ultimo_acesso ? new Date(user.ultimo_acesso).toLocaleString('pt-PT') : 'Nunc acessou'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-slate-400 hover:text-[#0d3fd1] hover:bg-[#0d3fd1]/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.ativo && (
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#c4c5d7]/30 flex items-center justify-between bg-[#f8f9ff]">
              <h2 className="text-lg font-black text-[#243141] uppercase tracking-tight">
                {formData.id ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-[#243141]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-black text-[#243141] uppercase tracking-wider mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-4 py-2 bg-[#f8f9ff] border border-[#c4c5d7]/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#243141] uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-[#f8f9ff] border border-[#c4c5d7]/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#243141] uppercase tracking-wider mb-2">Papel / Função</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-[#f8f9ff] border border-[#c4c5d7]/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/30"
                  >
                    <option value="auditor">Auditor (Normal)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#243141] uppercase tracking-wider mb-2">
                    Senha {formData.id && '(Opcional)'}
                  </label>
                  <input
                    type="password"
                    placeholder={formData.id ? 'Deixe em branco para manter' : 'Senha'}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 bg-[#f8f9ff] border border-[#c4c5d7]/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/30"
                  />
                </div>
              </div>

              {formData.role !== 'admin' && (
                <div className="mb-6 p-4 bg-slate-50 border border-[#c4c5d7]/30 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-[#243141] uppercase tracking-tight flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#0d3fd1]" />
                      Permissões de Acesso (Separadores)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availablePermissions.map(perm => {
                      const isSelected = formData.permissoes.includes(perm.id);
                      return (
                        <label 
                          key={perm.id} 
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-[#0d3fd1] bg-[#0d3fd1]/5' : 'border-[#c4c5d7]/30 hover:border-[#c4c5d7]'}`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#0d3fd1] border-[#0d3fd1]' : 'border-[#c4c5d7]'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="text-sm font-semibold text-[#243141]">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-slate-500 font-medium">Selecione quais páginas o utilizador poderá acessar e visualizar no menu principal.</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.ativo}
                    onChange={e => setFormData({...formData, ativo: e.target.checked})}
                    className="w-4 h-4 text-[#0d3fd1] rounded focus:ring-[#0d3fd1]"
                  />
                  <span className="text-sm font-bold text-[#243141]">Conta Ativa</span>
                </label>
                
                <div className="flex gap-3">
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-[#0d3fd1] text-white font-bold rounded-lg shadow-lg hover:bg-[#0a2f9e] transition-all">
                    {formData.id ? 'Salvar Alterações' : 'Criar Utilizador'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
