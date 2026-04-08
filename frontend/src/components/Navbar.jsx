import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  FileText,
  History,
  Settings,
  ShieldAlert,
  LogOut,
  ClipboardList,
  CheckSquare,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allPTs, setAllPTs] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch all Clientes for searching
    api.get('/clientes').then(res => setAllPTs(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = allPTs.filter(pt =>
        (pt.id_pt && pt.id_pt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (pt.localizacao && pt.localizacao.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, allPTs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPT = (id_pt) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/ficha-tecnica/${id_pt}`);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelectPT(searchResults[0].id_pt);
    }
  };

  const allMenuItems = [
    { name: 'Painel Central', icon: LayoutDashboard, path: '/' },
    { name: 'Subestações', icon: MapPin, path: '/subestacoes' },
    { name: 'Gestão', icon: Database, path: '/gestao-clientes' },
    { name: 'Minhas Tarefas', icon: CheckSquare, path: '/minhas-tarefas' },
    { name: 'Relatórios', icon: FileText, path: '/relatorios-clientes' },
    { name: 'Ficha Técnica', icon: History, path: '/ficha-tecnica' },
  ];

  if (user?.role === 'admin') {
    allMenuItems.splice(5, 0, { name: 'Utilizadores', icon: User, path: '/usuarios' });
    allMenuItems.splice(3, 0, { name: 'Tarefas (Gestão)', icon: ClipboardList, path: '/tarefas' });
  }

  const menuItems = user?.role === 'admin'
    ? allMenuItems
    : allMenuItems.filter(item => item.path === '/' || item.path === '/configuracoes' || (user?.permissoes || []).includes(item.path));

  return (
    <header className="bg-[#243141] text-white sticky top-0 z-50 shadow-xl border-b border-white/5">
      {/* Top Bar / Brand & User */}
      <div className="max-w-full mx-auto px-8 md:px-16 h-14 flex items-center justify-between border-b border-white/5 ">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-tighter uppercase whitespace-nowrap">MBT Energia<span className="text-[9px] text-[#5fff9b] tracking-[0.2em] font-bold opacity-60 ml-2"></span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 bg-[#5fff9b] rounded-full animate-pulse"></div>

          </div>

          <button className="sm:hidden text-white/60 hover:text-white transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-3 pl-2 group cursor-pointer border-l border-white/10 ml-2">
            <div className="hidden xs:block text-right">
              <p className="text-[10px] font-black tracking-tight uppercase leading-none group-hover:text-[#5fff9b] transition-colors">{user?.nome || 'Operador'}</p>
              <p className="text-[8px] font-bold text-[#5fff9b] opacity-40 uppercase tracking-tighter">{user?.role || 'AUDITOR'}</p>
            </div>
            <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center border border-[#5fff9b]/20 hover:border-[#5fff9b]/60 transition-all">
              <User className="text-white w-3.5 h-3.5" />
            </div>

            <button
              onClick={signOut}
              className="ml-4 p-2.5 text-white/40 hover:text-[#ff4d4d] hover:bg-red-500/10 rounded-lg transition-all"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="max-w-full mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Horizontal Desktop Menu */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-tight transition-all uppercase whitespace-nowrap
                ${isActive
                  ? 'bg-white/10 text-[#5fff9b] shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex-grow md:flex-grow-0 max-w-sm ml-auto relative group" ref={searchRef}>
          <input
            type="text"
            placeholder="Procurar Cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            onFocus={() => searchQuery.trim() && setShowResults(true)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#0d3fd1]/40 focus:bg-white/10 transition-all outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-3.5 h-3.5 group-focus-within:text-[#0d3fd1]" />

          {/* Results Dropdown */}
          {showResults && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a3749] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
              {searchResults.length > 0 ? (
                searchResults.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => handleSelectPT(pt.id_pt)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                  >
                    <div className="flex flex-col truncate max-w-[200px]">
                      <p className="text-[10px] font-black text-[#5fff9b] uppercase tracking-tighter">{pt.id_pt}</p>
                      <p className="text-[9px] text-white/60 uppercase truncate">{pt.localizacao}</p>
                    </div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      VER FICHA
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[10px] text-white/40 font-bold uppercase tracking-widest text-center">
                  Nenhum Cliente encontrado
                </div>
              )}
            </div>
          )}
        </div>


      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1a2533] border-t border-white/5 absolute w-full transition-all animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-tight transition-all uppercase
                  ${isActive
                    ? 'bg-[#0d3fd1] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
