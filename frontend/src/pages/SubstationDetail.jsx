import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, MapPin, Zap, Building2, Users, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function SubstationDetail({ substation, onClose, onFilterPts }) {
  const storageKey = `@PTAS:subestacao:${substation.id}:imagens`;
  const [imagensLocais, setImagensLocais] = useState([]);
  const [imagemAtiva, setImagemAtiva] = useState(null);

  // Fetch PTs for same localidade (municipio) treating them as the substation's PTs
  const { data: localPts = [] } = useQuery({
    queryKey: ['pts', { localidade: substation.municipio }],
    queryFn: async () => {
      if (!substation.municipio) return [];
      const res = await api.get('/pts', { params: { localidade: substation.municipio } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const somaPotenciasPTs = useMemo(() => {
    return localPts.reduce((acc, pt) => acc + Number(pt.potencia_kva || pt.potencia_total_kva || 0), 0);
  }, [localPts]);

  const handleFilterPts = useCallback(() => {
    onFilterPts(substation.id ? substation.id.toString() : '');
  }, [substation.id, onFilterPts]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setImagensLocais([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setImagensLocais(Array.isArray(parsed) ? parsed : []);
    } catch {
      setImagensLocais([]);
    }
  }, [storageKey]);

  const imagensDaSubestacao = useMemo(() => {
    const fromApi = Array.isArray(substation.imagens) ? substation.imagens : [];
    const single = substation.imagem_url ? [substation.imagem_url] : [];
    const merged = [...fromApi, ...single, ...imagensLocais].filter(Boolean);
    return [...new Set(merged)];
  }, [substation.imagem_url, substation.imagens, imagensLocais]);

  const persistirImagensLocais = (next) => {
    setImagensLocais(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const handleUploadImagens = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    const toDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(file);
    });

    try {
      const dataUrls = await Promise.all(list.map(toDataUrl));
      const next = [...imagensLocais, ...dataUrls];
      persistirImagensLocais(next);
    } catch (e) {
      alert(e.message || 'Erro ao carregar imagens.');
    }
  };

  const handleRemoveImagemLocal = (src) => {
    const next = imagensLocais.filter((x) => x !== src);
    persistirImagensLocais(next);
    if (imagemAtiva === src) setImagemAtiva(null);
  };

  // Count PTs by operational status
  const statusCounts = React.useMemo(() => {
    return {
      operacional: localPts.filter(p => p.estado_operacional === 'Operacional').length,
      critico: localPts.filter(p => p.estado_operacional === 'Crítico').length,
      manutencao: localPts.filter(p => p.estado_operacional === 'Manutenção').length,
      fora: localPts.filter(p => p.estado_operacional === 'Fora de Serviço').length,
    };
  }, [localPts]);

  const proprietariosLocalidadeCount = useMemo(() => {
    if (!localPts || localPts.length === 0) return 0;
    const set = new Set(
      localPts
        .map((pt) => pt.subestacao?.proprietario || pt.proprietario)
        .filter(Boolean)
        .map((p) => String(p).trim().toLowerCase())
    );
    return set.size;
  }, [localPts]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] p-5 sm:p-6 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight truncate">{substation.nome}</h2>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{substation.localizacao}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/0 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#0d3fd1]/10 to-[#5fff9b]/10 rounded-xl p-4 border border-[#0d3fd1]/20">
              <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest mb-2">Código</p>
              <p className="text-xl font-black text-[#0f1c2c]">{substation.codigo}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5fff9b]/10 to-[#0dd114]/10 rounded-xl p-4 border border-[#5fff9b]/20">
              <p className="text-[10px] font-black text-[#005229] uppercase tracking-widest mb-2">Município</p>
              <p className="text-xl font-black text-[#005229]">{substation.municipio || 'N/D'}</p>
            </div>

            <div className="bg-gradient-to-br from-[#243141]/10 to-[#0f1c2c]/10 rounded-xl p-4 border border-[#243141]/20">
              <p className="text-[10px] font-black text-[#243141] uppercase tracking-widest mb-2">Capacidade Suportada (Subst.)</p>
              <p className="text-lg font-black text-[#0f1c2c] bg-white border border-[#c4c5d7]/20 rounded-md px-2 py-1 inline-block mb-2">{(substation.sum_potencia || substation.potencia_total_kva || 0).toLocaleString()} <span className="text-[10px] font-bold">kVA</span></p>
              <div className="pt-2 border-t border-[#243141]/10">
                <p className="text-[9px] font-black text-[#243141]/70 uppercase tracking-widest leading-tight">Soma dos PTs associados</p>
                <p className="text-base font-black text-[#0d3fd1]">{somaPotenciasPTs.toLocaleString()} <span className="text-[9px] font-bold">kVA</span></p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f59e0b]/10 to-[#dc2626]/10 rounded-xl p-4 border border-[#f59e0b]/20">
              <p className="text-[10px] font-black text-[#7c2d12] uppercase tracking-widest mb-2">Proprietários (Localidade)</p>
              <p className="text-xl font-black text-[#dc2626]">{proprietariosLocalidadeCount}</p>
            </div>
          </div>

          {/* PT Status Distribution */}
          <div className="bg-[#f8f9ff] rounded-2xl p-6">
            <h3 className="font-black text-[#0f1c2c] text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#0d3fd1]" />
              Propriétários (PTs) por Estado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 border border-[#c4c5d7]/20">
                <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">PTs na Localidade</p>
                <p className="text-xl font-black text-[#0f1c2c]">{localPts.length}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-[#c4c5d7]/20">
                <p className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Proprietários Únicos</p>
                <p className="text-xl font-black text-[#0d3fd1]">{proprietariosLocalidadeCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Image Gallery */}
          <div className="rounded-2xl overflow-hidden border border-[#c4c5d7]/20 bg-white">
            <div className="p-5 border-b border-[#c4c5d7]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0d3fd1]" />
                <h3 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight">Imagens</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#747686] bg-[#f8f9ff] border border-[#c4c5d7]/20 px-2 py-1 rounded-lg">
                  {imagensDaSubestacao.length}
                </span>
              </div>

              <label className="w-full sm:w-auto text-center cursor-pointer text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-[#eff4ff] text-[#0d3fd1] border border-[#0d3fd1]/10 hover:bg-[#0d3fd1] hover:text-white transition-all">
                Adicionar fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleUploadImagens(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {imagensDaSubestacao.length > 0 ? (
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagensDaSubestacao.map((src) => (
                    <div key={src} className="group relative rounded-xl overflow-hidden border border-[#c4c5d7]/20 bg-gray-100">
                      <button
                        onClick={() => setImagemAtiva(src)}
                        className="w-full"
                        title="Abrir imagem"
                      >
                        <img
                          src={src}
                          alt={substation.nome}
                          className="w-full h-28 object-cover group-hover:scale-[1.02] transition-transform"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjXFLI6ciYJOLq5zeXtbaXPAa0-gaG06Mc3g&s';
                          }}
                        />
                      </button>

                      {imagensLocais.includes(src) && (
                        <button
                          onClick={() => handleRemoveImagemLocal(src)}
                          className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover imagem local"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] font-bold text-[#747686] uppercase tracking-widest opacity-70">
                  Nota: imagens adicionadas aqui ficam guardadas localmente neste navegador.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sem imagens disponíveis</p>
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#c4c5d7]/10">
            <button
              onClick={handleFilterPts}
              className="w-full sm:flex-1 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] text-white font-black py-3 rounded-xl hover:shadow-lg transition-all uppercase text-sm tracking-wider"
            >
              Ver Todos os PTs ({localPts.length})
            </button>
            <button
              onClick={onClose}
              className="w-full sm:flex-1 bg-[#f8f9ff] text-[#0d3fd1] font-black py-3 rounded-xl hover:bg-[#eff4ff] transition-all uppercase text-sm tracking-wider border border-[#c4c5d7]/20"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {imagemAtiva && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImagemAtiva(null)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setImagemAtiva(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Fechar
              </button>
            </div>
            <img
              src={imagemAtiva}
              alt={substation.nome}
              className="w-full max-h-[80vh] object-contain rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
