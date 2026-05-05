import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Zap, Building2, Users, Calendar, AlertCircle, AlertTriangle, Navigation, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createSubstationIcon = (status) => {
  const color = status === 'Ativa' ? '#0d3fd1' : status === 'Manutenção' ? '#f59e0b' : '#6b7280';
  return L.divIcon({
    className: 'custom-substation-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(13, 63, 209, 0.4);">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createPTIcon = (statusLegal) => {
  const color = statusLegal === 'Legal' ? '#10b981' : statusLegal === 'Não Legal' ? '#ef4444' : statusLegal === 'Legal com Inconformidades' ? '#f59e0b' : '#6b7280';
  return L.divIcon({
    className: 'custom-pt-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
             <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export default function SubstationDetail({ substation, onClose, onFilterPts }) {
  const navigate = useNavigate();
  const storageKey = `@PTAS:subestacao:${substation.id}:imagens`;
  const [imagensLocais, setImagensLocais] = useState([]);
  const [imagemAtiva, setImagemAtiva] = useState(null);

  // Fetch Clientes associated with this specific substation
  const { data: localPts = [] } = useQuery({
    queryKey: ['clientes', { id_subestacao: substation.id }],
    queryFn: async () => {
      if (!substation.id) return [];
      const res = await api.get('/clientes', { params: { id_subestacao: substation.id } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const somaPotenciasPTs = useMemo(() => {
    // Usar APENAS potencia_kva para os PTs individuais (Contratual)
    return localPts.reduce((acc, pt) => acc + Number(pt.potencia_kva || 0), 0);
  }, [localPts]);

  const somaPotenciasAuditadas = useMemo(() => {
    // Usar APENAS potencia_instalada para os PTs individuais (Auditada)
    return localPts.reduce((acc, pt) => acc + Number(pt.potencia_instalada || 0), 0);
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
      legal: localPts.filter(p => p.status_legal === 'Legal').length,
      naoLegal: localPts.filter(p => p.status_legal === 'Não Legal').length,
      comInconformidades: localPts.filter(p => p.status_legal === 'Legal com Inconformidades').length,
      avaliacao: localPts.filter(p => !p.status_legal || p.status_legal === 'Em Avaliação').length,
    };
  }, [localPts]);

  const proprietariosLocalidadeCount = useMemo(() => {
    if (!localPts || localPts.length === 0) return 0;
    const set = new Set(
      localPts
        .map((pt) => pt.proprietario?.nome || pt.proprietario)
        .filter(Boolean)
        .map((p) => String(p).trim().toLowerCase())
    );
    return set.size;
  }, [localPts]);

  const { capacidadeSubestacao, sobrecargaPct, isSobrecarga, overloadClass } = useMemo(() => {
    // Capacidade "Real" registrada (Soma de todas as Subestações da Localidade)
    const cap = Number(substation.capacidade_total_mva || 0) * 1000;
    const sumPTs = somaPotenciasPTs;
    const pct = cap > 0 ? (sumPTs / cap) * 100 : 0;
    const isOverload = pct > 100;

    let overloadColor = '#005229'; // Normal
    if (pct >= 80 && pct <= 100) overloadColor = '#f59e0b'; // Warning
    if (pct > 100) overloadColor = '#dc2626'; // Critical

    return {
      capacidadeSubestacao: cap,
      sobrecargaPct: pct,
      isSobrecarga: isOverload,
      overloadClass: overloadColor
    };
  }, [substation.capacidade_total_mva, somaPotenciasPTs]);

  // Map Helper: Parse GPS string or use lat/lng
  const getCoords = useCallback((obj) => {
    if (!obj) return null;
    if (obj.latitude && obj.longitude) {
      const lat = parseFloat(obj.latitude);
      const lng = parseFloat(obj.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    if (obj.gps) {
      const parts = String(obj.gps).split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
      }
    }
    return null;
  }, []);

  const subCoords = useMemo(() => getCoords(substation), [substation, getCoords]);

  // Calculate traced path from substation to all PTs using nearest neighbor
  const sortedPath = useMemo(() => {
    if (!subCoords || localPts.length === 0) return [];

    const points = localPts
      .map(pt => ({ ...pt, coords: getCoords(pt) }))
      .filter(pt => pt.coords);

    if (points.length === 0) return [];

    let current = subCoords;
    const path = [current];
    const remaining = [...points];

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = Math.sqrt(
          Math.pow(remaining[i].coords[0] - current[0], 2) +
          Math.pow(remaining[i].coords[1] - current[1], 2)
        );
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }

      const next = remaining.splice(nearestIdx, 1)[0];
      current = next.coords;
      path.push(current);
    }

    return path;
  }, [subCoords, localPts, getCoords]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 z-[100] bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] p-5 sm:p-6 flex justify-between items-start gap-4 shadow-md">
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

          {/* Detailed Info & Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 p-6 space-y-4 flex flex-col justify-center">
              <h3 className="font-black text-[#0f1c2c] text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#243141]" />
                Informações da Subestação
              </h3>

              <div>
                <div>
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Substação</label>
                  <p className="text-sm font-bold text-[#0f1c2c] mt-1">{substation.municipio || 'N/D'}</p>

                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest">Quantidade de Clientes</label>
                  <p className="text-sm font-bold text-[#0f1c2c] mt-1">{localPts.length}</p>
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

            <div className="bg-gradient-to-br from-[#243141]/10 to-[#0f1c2c]/10 rounded-2xl p-6 border border-[#243141]/20 relative overflow-hidden flex flex-col justify-center">
              {isSobrecarga && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Excesso de Carga
                </div>
              )}
              <p className="text-[10px] font-black text-[#243141] uppercase tracking-widest mb-3">Análise de Sobrecarga (Nominal)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Capacidade Instalada</p>
                  <p className="text-xl font-black text-[#0f1c2c]">{substation.capacidade_total_mva || 0} <span className="text-[10px] font-bold text-[#747686]">MVA</span></p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-[#c4c5d7]/30"></div>
                <div className="col-span-2 sm:col-span-1 grid grid-cols-2 sm:grid-cols-1 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Carga Contratual</p>
                    <p className="text-lg font-black" style={{ color: overloadClass }}>
                      {somaPotenciasPTs.toLocaleString()} <span className="text-[9px] font-bold opacity-60">kVA</span>
                    </p>
                  </div>
                  <div className="sm:mt-2 sm:pt-2 sm:border-t sm:border-[#c4c5d7]/30">
                    <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Carga Auditada</p>
                    <p className="text-lg font-black text-[#0d3fd1]">
                      {somaPotenciasAuditadas.toLocaleString()} <span className="text-[9px] font-bold opacity-60">kVA</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {capacidadeSubestacao > 0 ? (
                <div className="w-full bg-white/50 rounded-full h-2 mb-1 overflow-hidden pointer-events-none ring-1 ring-black/5 mt-auto">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(sobrecargaPct, 100)}%`, backgroundColor: overloadClass }}
                  ></div>
                </div>
              ) : (
                <p className="text-[9px] font-bold text-red-500 uppercase mt-auto bg-red-50 p-2 rounded-lg border border-red-100">⚠ Capacidade base da Subestação não informada no registo (0 kVA)</p>
              )}
              {capacidadeSubestacao > 0 && (
                <div className="flex justify-between items-center text-[9px] font-bold mt-1">
                  <span className="opacity-60 uppercase">0%</span>
                  <span style={{ color: overloadClass }}>{sobrecargaPct.toFixed(1)}% de saturação</span>
                  <span className="opacity-60 uppercase">100% LIMITE</span>
                </div>
              )}
            </div>
          </div>

          {/* Map View */}
          {subCoords && (
            <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#c4c5d7]/10 flex items-center justify-between bg-[#fcfdff]">
                <h3 className="font-black text-[#0f1c2c] text-sm uppercase tracking-tight flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0d3fd1]" />
                  Mapa de Distribuição e Traçado
                </h3>
                <span className="text-[9px] font-black text-[#747686] uppercase bg-white px-2 py-1 rounded border border-[#c4c5d7]/20 shadow-sm" title={`${localPts.length - localPts.filter(pt => getCoords(pt)).length} PTs sem coordenadas registadas`}>
                  {localPts.filter(pt => getCoords(pt)).length} DE {localPts.length} PTs COM LOCALIZAÇÃO
                </span>
              </div>
              <div className="h-[350px] relative z-0">
                <MapContainer
                  center={subCoords}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Substation Marker */}
                  <Marker position={subCoords} icon={createSubstationIcon(substation.status)}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-black text-[#0d3fd1] uppercase">Substação {substation.nome}</p>
                        <p className="opacity-70 mt-1">{substation.municipio}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* PT Markers */}
                  {localPts.map(pt => {
                    const ptPos = getCoords(pt);
                    if (!ptPos) return null;

                    const distanceMeters = L.latLng(subCoords[0], subCoords[1]).distanceTo(L.latLng(ptPos[0], ptPos[1]));
                    const distanceText = distanceMeters >= 1000
                      ? `${(distanceMeters / 1000).toFixed(2)} km`
                      : `${Math.round(distanceMeters)} m`;

                    return (
                      <Marker key={pt.id} position={ptPos} icon={createPTIcon(pt.status_legal)}>
                        <Popup>
                          <div className="text-xs">
                            <p className="font-black text-[#0f1c2c] uppercase">{pt.id_pt}</p>
                            <p className="opacity-70 mb-1">{pt.proprietario?.nome || pt.proprietario || 'Sem Proprietário'}</p>
                            <p className="text-[10px] text-[#0d3fd1] font-bold flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              Distância: {distanceText}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2 border-y border-gray-100 py-2">
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase">Contratual</p>
                                <p className="text-[10px] font-black text-gray-700">{pt.potencia_kva || 0} kVA</p>
                              </div>
                              <div className="border-l border-gray-100 pl-2">
                                <p className="text-[8px] font-black text-blue-400 uppercase">Auditada</p>
                                <p className="text-[10px] font-black text-blue-700">{pt.potencia_instalada || 0} kVA</p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${pt.status_legal === 'Legal' ? 'bg-green-500' : pt.status_legal === 'Não Legal' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                <span className="font-bold">{pt.status_legal || 'Em Avaliação'}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/ficha-tecnica/${pt.id_pt}`);
                                }}
                                className="w-full bg-[#0d3fd1] text-white text-[9px] font-black uppercase py-1.5 rounded-lg hover:bg-[#0034cc] transition-all text-center"
                              >
                                Ver Ficha Técnica
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Traced Path */}
                  {sortedPath.length > 1 && (
                    <Polyline
                      positions={sortedPath}
                      color="#0d3fd1"
                      weight={3}
                      opacity={0.6}
                      dashArray="5, 10"
                    />
                  )}
                </MapContainer>

                {/* Map Legend Floating */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-[#c4c5d7]/20 shadow-lg z-[1000] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0d3fd1] rounded"></div>
                    <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-tighter">Subestação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                    <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-tighter">Legal (Conforme)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                    <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-tighter">Não Legal (Infracção)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#f59e0b] rounded-full"></div>
                    <span className="text-[9px] font-black text-[#0f1c2c] uppercase tracking-tighter">Legal c/ Inconformidades</span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* PT Status Distribution */}
          <div className="bg-[#f8f9ff] rounded-2xl p-6">
            <h3 className="font-black text-[#0f1c2c] text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0d3fd1]" />
              Status de Legalidade dos PTs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border-l-4 border-emerald-500 shadow-sm">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Legal</p>
                <p className="text-2xl font-black text-emerald-600">{statusCounts.legal}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 shadow-sm">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Não Legal</p>
                <p className="text-2xl font-black text-red-600">{statusCounts.naoLegal}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-amber-500 shadow-sm">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Com Inconformidades</p>
                <p className="text-2xl font-black text-amber-600">{statusCounts.comInconformidades}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Em Avaliação</p>
                <p className="text-2xl font-black text-blue-600">{statusCounts.avaliacao}</p>
              </div>
            </div>
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
            {/* <button
              onClick={handleFilterPts}
              className="w-full sm:flex-1 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc] text-white font-black py-3 rounded-xl hover:shadow-lg transition-all uppercase text-sm tracking-wider"
            >
              Ver Todos os PTs ({localPts.length})
            </button> */}
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
