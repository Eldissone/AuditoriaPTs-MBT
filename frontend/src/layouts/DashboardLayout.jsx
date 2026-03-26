import React from 'react';
import Navbar from '../components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Navbar />
      <main className="max-w-8xl mx-auto p-4 md:p-8">
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-10 border-t border-[#c4c5d7]/20 mt-12 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
          <div className="text-[9px] font-black text-[#243141] uppercase tracking-[0.4em]">
            © 2026 MBT Energia
          </div>
          <div className="flex gap-8 text-[9px] font-black text-[#243141] uppercase tracking-[0.2em]">
            <span className="cursor-pointer hover:text-[#0d3fd1] transition-colors">Protocolos de Segurança</span>
            <span className="cursor-pointer hover:text-[#0d3fd1] transition-colors">Estado da Malha Central</span>
            <span className="cursor-pointer hover:text-[#0d3fd1] transition-colors">Suporte Engenharia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
