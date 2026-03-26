import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Key, Eye, EyeOff, ArrowRight, Info } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (signed) navigate('/');
  }, [signed, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-[#f8f9ff] min-h-screen flex flex-col font-body text-[#0f1c2c]">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-[#eff4ff] rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-[#d6e3f9] rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

        <div className="w-full max-w-[480px] z-10">
          <div className="flex flex-col items-center mb-10">

          </div>

          <div className="bg-white/80 backdrop-blur-[20px] rounded-xl shadow-[0px_20px_40px_rgba(15,28,44,0.08)] overflow-hidden border border-[#c4c5d7]/20">
            <div className=" px-6 py-3 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#5fff9b]/40"></div>
              </div>
            </div>

            <div className="p-10">
              <div className="mb-8">
                <h1 className="text-[#0f1c2c] text-2xl font-black tracking-tighter">Login</h1>

                <p className="text-[#444655] text-sm">Insira suas credenciais especializadas para iniciar a sessão do sistema.</p>
              </div>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm animate-shake">
                  {error}
                </div>
              )}

              {/* <div className="bg-[#eff4ff] border border-[#0d3fd1]/10 p-4 mb-6 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-[#0d3fd1] mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Modo Mock Ativo</p>
                  <p className="text-[11px] text-[#444655] font-medium leading-normal">Use <span className="font-bold">auditor@ptas.ao</span> com qualquer senha para entrar.</p>
                </div>
              </div> */}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group">
                  <label className="block text-xs font-bold text-[#444655] uppercase tracking-wider ml-1" htmlFor="email">email ou nome de utilizador</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 w-[2px] h-0 group-focus-within:h-full bg-[#5fff9b] transition-all duration-300"></div>
                    <div className="absolute left-4 pointer-events-none">
                      <Mail className="text-[#747686] w-4.5 h-4.5" />
                    </div>
                    <input
                      className="w-full bg-[#eff4ff] border-none rounded-lg py-4 pl-12 pr-4 text-sm font-medium focus:ring-0 text-[#0f1c2c] placeholder:text-[#747686]/50 transition-colors"
                      id="email"
                      type="email"
                      placeholder="utilizador@ptas.industrial.net"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-xs font-bold text-[#444655] uppercase tracking-wider" htmlFor="password">Senha</label>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 w-[2px] h-0 group-focus-within:h-full bg-[#5fff9b] transition-all duration-300"></div>
                    <div className="absolute left-4 pointer-events-none">
                      <Key className="text-[#747686] w-4.5 h-4.5" />
                    </div>
                    <input
                      className="w-full bg-[#eff4ff] border-none rounded-lg py-4 pl-12 pr-12 text-sm font-medium focus:ring-0 text-[#0f1c2c] placeholder:text-[#747686]/50 transition-colors"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-[#747686] hover:text-[#0f1c2c] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <a className="text-[10px] font-bold text-[#0d3fd1] hover:underline uppercase tracking-tight" href="#">Recuperar Chave</a>


                <button
                  className="w-full group relative overflow-hidden bg-[#0d3fd1] text-white font-bold text-sm tracking-wide py-4 rounded-lg shadow-lg hover:shadow-[#0d3fd1]/20 transition-all duration-300 active:scale-[0.98]"
                  type="submit"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center justify-center gap-2">
                    <span>INICIALIZAR SESSÃO</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </form>
            </div>


          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-[#747686] font-medium tracking-widest uppercase opacity-60 max-w-[320px] mx-auto leading-relaxed">
              Material Classificado. Apenas pessoal autorizado PTAS. Todas as sequências de acesso são registadas via malha de subestação encriptada.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 flex justify-center items-center gap-8 border-t border-[#c4c5d7]/10">
        <span className="text-[10px] text-[#444655] font-bold tracking-widest">© 2026 MBT Energia</span>
        <div className="flex gap-4">
          <a className="text-[10px] text-[#747686] hover:text-[#0d3fd1] font-bold tracking-widest transition-colors" href="#">PRIVACIDADE</a>
          <a className="text-[10px] text-[#747686] hover:text-[#0d3fd1] font-bold tracking-widest transition-colors" href="#">PROTOCOLOS DE SEGURANÇA</a>
        </div>
      </footer>
    </div>
  );
}
