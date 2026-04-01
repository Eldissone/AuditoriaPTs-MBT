import React, { useCallback } from 'react';
import { X, MapPin, Zap, Building2, Users, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function SubstationDetail({ substation, onClose, onFilterPts }) {
  // Fetch PTs for this substation
  const { data: subPts = [] } = useQuery({
    queryKey: ['pts', { id_subestacao: substation.id }],
    queryFn: async () => {
      const res = await api.get('/pts', { params: { id_subestacao: substation.id } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleFilterPts = useCallback(() => {
    onFilterPts(substation.id.toString());
  }, [substation.id, onFilterPts]);

  // Count PTs by operational status
  const statusCounts = React.useMemo(() => {
    return {
      operacional: subPts.filter(p => p.estado_operacional === 'Operacional').length,
      critico: subPts.filter(p => p.estado_operacional === 'Crítico').length,
      manutencao: subPts.filter(p => p.estado_operacional === 'Manutenção').length,
      fora: subPts.filter(p => p.estado_operacional === 'Fora de Serviço').length,
    };
  }, [subPts]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] p-6 flex justify-between items-start">
          <div>
            <h2 className="text-white text-2xl font-black uppercase tracking-tight">{substation.nome}</h2>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {substation.localizacao}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/0 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#0d3fd1]/10 to-[#5fff9b]/10 rounded-xl p-4 border border-[#0d3fd1]/20">
              <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-2">Código</p>
              <p className="text-xl font-black text-[#0f1c2c]">{substation.codigo}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5fff9b]/10 to-[#0dd114]/10 rounded-xl p-4 border border-[#5fff9b]/20">
              <p className="text-[10px] font-black text-[#005229] uppercase tracking-widest mb-2">Município</p>
              <p className="text-xl font-black text-[#005229]">{substation.municipio || 'N/D'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#243141]/10 to-[#0f1c2c]/10 rounded-xl p-4 border border-[#243141]/20">
              <p className="text-[10px] font-black text-[#243141] uppercase tracking-widest mb-2">Potência Total</p>
              <p className="text-lg font-black text-[#0f1c2c]">{(substation.potencia_total_kva / 1000).toFixed(1)}K <span className="text-[10px] font-bold">kVA</span></p>
            </div>

            <div className="bg-gradient-to-br from-[#f59e0b]/10 to-[#dc2626]/10 rounded-xl p-4 border border-[#f59e0b]/20">
              <p className="text-[10px] font-black text-[#7c2d12] uppercase tracking-widest mb-2">Total PTs</p>
              <p className="text-xl font-black text-[#dc2626]">{subPts.length}</p>
            </div>
          </div>

          {/* PT Status Distribution */}
          <div className="bg-[#f8f9ff] rounded-2xl p-6">
            <h3 className="font-black text-[#0f1c2c] text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#0d3fd1]" />
              Propriétários (PTs) por Estado
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border-l-4 border-green-500">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Operacional</p>
                <p className="text-2xl font-black text-green-600">{statusCounts.operacional}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-red-500">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Crítico</p>
                <p className="text-2xl font-black text-red-600">{statusCounts.critico}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-yellow-500">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Manutenção</p>
                <p className="text-2xl font-black text-yellow-600">{statusCounts.manutencao}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-gray-500">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Fora de Serviço</p>
                <p className="text-2xl font-black text-gray-600">{statusCounts.fora}</p>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 p-6 space-y-4">
            <h3 className="font-black text-[#0f1c2c] text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#243141]" />
              Informações da Subestação
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Tipo</label>
                <p className="text-sm font-bold text-[#0f1c2c] mt-1">{substation.tipo || 'N/D'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Distrito</label>
                <p className="text-sm font-bold text-[#0f1c2c] mt-1">{substation.distrito || 'N/D'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Tensão (kV)</label>
                <p className="text-sm font-bold text-[#0f1c2c] mt-1">{substation.tensao_nominal || 'N/D'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Transformadores</label>
                <p className="text-sm font-bold text-[#0f1c2c] mt-1">{substation.num_transformadores || 'N/D'}</p>
              </div>
            </div>

            {substation.descricao && (
              <div>
                <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Descrição</label>
                <p className="text-sm text-[#0f1c2c] mt-2 bg-[#f8f9ff] p-3 rounded-lg">{substation.descricao}</p>
              </div>
            )}

            {substation.observacoes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Observações</p>
                  <p className="text-sm text-yellow-800 mt-1">{substation.observacoes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Section */}
          <div className="rounded-2xl overflow-hidden border border-[#c4c5d7]/20 bg-gray-100">
            {substation.imagem_url ? (
              <img
                src={substation.imagem_url}
                alt={substation.nome}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjXFLI6ciYJOLq5zeXtbaXPAa0-gaG06Mc3g&s';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sem imagem disponível</p>
                <p className="text-xs text-gray-400 mt-1">{substation.nome}</p>
              </div>
            )}
          </div>

          {/* Recent PTs List 
          <div>
            <h3 className="font-black text-[#0f1c2c] text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0d3fd1]" />
              Proprietários Recentes ({subPts.length})
            </h3>
            {subPts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subPts.slice(0, 5).map((pt) => (
                  <div key={pt.id} className="bg-[#f8f9ff] rounded-lg p-3 border border-[#c4c5d7]/10 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-[#0f1c2c]">{pt.parceiro_negocios || pt.id_pt}</p>
                      <p className="text-xs text-[#747686]">{pt.localizacao}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${pt.estado_operacional === 'Operacional' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                ))}
                {subPts.length > 5 && (
                  <p className="text-xs text-[#747686] text-center py-2">+ {subPts.length - 5} mais</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#747686] text-center py-8">Nenhum proprietário associado</p>
            )}
          </div>
          */}
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#c4c5d7]/10">
            <button
              onClick={handleFilterPts}
              className="flex-1 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] text-white font-black py-3 rounded-xl hover:shadow-lg transition-all uppercase text-sm tracking-wider"
            >
              Ver Todos os PTs ({subPts.length})
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-[#f8f9ff] text-[#0d3fd1] font-black py-3 rounded-xl hover:bg-[#eff4ff] transition-all uppercase text-sm tracking-wider border border-[#c4c5d7]/20"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
