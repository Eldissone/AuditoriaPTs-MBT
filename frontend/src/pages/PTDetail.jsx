import React, { useCallback } from 'react';
import { X, MapPin, Zap, Building2, AlertCircle, Lightbulb, Calendar } from 'lucide-react';

export default function PTDetail({ pt, onClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Operacional':
        return { bg: '#005229', text: '#5fff9b', label: '✓ Operacional' };
      case 'Crítico':
        return { bg: '#7c2d12', text: '#fb923c', label: '⚠ Crítico' };
      case 'Manutenção':
        return { bg: '#78350f', text: '#fbbf24', label: '🔧 Manutenção' };
      case 'Fora de Serviço':
        return { bg: '#374151', text: '#d1d5db', label: '✕ Fora de Serviço' };
      default:
        return { bg: '#6b7280', text: '#d1d5db', label: '? Desconhecido' };
    }
  };

  const statusStyle = getStatusColor(pt.estado_operacional);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with status badge */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-white text-2xl font-black uppercase tracking-tight">{pt.parceiro_negocios || 'PT'}</h2>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {pt.localizacao}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: statusStyle.bg }}
              className="px-3 py-1.5 rounded-full flex items-center gap-2"
            >
              <span style={{ color: statusStyle.text }} className="text-[10px] font-black uppercase tracking-wider">
                {statusStyle.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#0d3fd1]/10 to-[#5fff9b]/10 rounded-xl p-4 border border-[#0d3fd1]/20">
              <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-2">ID PT</p>
              <p className="text-lg font-black text-[#0f1c2c]">{pt.id_pt}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5fff9b]/10 to-[#0dd114]/10 rounded-xl p-4 border border-[#5fff9b]/20">
              <p className="text-[10px] font-black text-[#005229] uppercase tracking-widest mb-2">Potência (kVA)</p>
              <p className="text-lg font-black text-[#0f1c2c]">{pt.potencia_kva?.toLocaleString() || 'N/A'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#243141]/10 to-[#0f1c2c]/10 rounded-xl p-4 border border-[#747686]/20">
              <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest mb-2">Subestação</p>
              <p className="text-lg font-black text-[#0d3fd1]">{pt.subestacao?.nome || 'N/A'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#f59e0b]/10 to-[#fb923c]/10 rounded-xl p-4 border border-[#fb923c]/20">
              <p className="text-[10px] font-black text-[#92400e] uppercase tracking-widest mb-2">Tipos</p>
              <p className="text-sm font-bold text-[#0f1c2c] line-clamp-2">{pt.tipos || 'N/A'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-[#a78bfa]/10 rounded-xl p-4 border border-[#a78bfa]/20">
              <p className="text-[10px] font-black text-[#6b21a8] uppercase tracking-widest mb-2">Bairro</p>
              <p className="text-sm font-bold text-[#0f1c2c]">{pt.bairro || 'N/A'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#ec4899]/10 to-[#f472b6]/10 rounded-xl p-4 border border-[#f472b6]/20">
              <p className="text-[10px] font-black text-[#831843] uppercase tracking-widest mb-2">Município</p>
              <p className="text-sm font-bold text-[#0f1c2c]">{pt.municipio || 'N/A'}</p>
            </div>
          </div>

          {/* Detailed Info Section */}
          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#c4c5d7]/20">
            <h3 className="text-lg font-black text-[#0f1c2c] uppercase tracking-tight mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0d3fd1]" />
              Informações Detalhadas
            </h3>

            <div className="space-y-3">
              {pt.coordenadas && (
                <div className="flex justify-between items-center pb-3 border-b border-[#c4c5d7]/20">
                  <span className="text-[10px] font-bold text-[#747686] uppercase tracking-widest">Coordenadas GPS</span>
                  <span className="text-sm font-medium text-[#0f1c2c]">{pt.coordenadas}</span>
                </div>
              )}

              {pt.gps && (
                <div className="flex justify-between items-center pb-3 border-b border-[#c4c5d7]/20">
                  <span className="text-[10px] font-bold text-[#747686] uppercase tracking-widest">GPS</span>
                  <span className="text-sm font-medium text-[#0f1c2c]">{pt.gps}</span>
                </div>
              )}

              {pt.descricao && (
                <div className="pb-3 border-b border-[#c4c5d7]/20">
                  <p className="text-[10px] font-bold text-[#747686] uppercase tracking-widest mb-2">Descrição</p>
                  <p className="text-sm text-[#0f1c2c]">{pt.descricao}</p>
                </div>
              )}

              {pt.observacoes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-1">Observações</p>
                    <p className="text-sm text-yellow-900">{pt.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] text-white px-6 py-3 rounded-lg text-sm font-black uppercase hover:shadow-lg transition-all"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
