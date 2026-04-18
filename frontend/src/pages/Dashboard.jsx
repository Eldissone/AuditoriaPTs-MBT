import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Zap,
  TrendingUp,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Users,
  Filter,
  X,
  Building2,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import SubstationDetail from './SubstationDetail';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createSubstationIcon = (size, status) => {
  const iconSize = Math.max(22, Math.min(44, size));
  const svgSize = Math.round(iconSize * 0.56);
  const radius = Math.round(iconSize * 0.25);
  const color = status === 'Ativa' ? '#0d3fd1' : status === 'Manutenção' ? '#f59e0b' : '#6b7280';
  return L.divIcon({
    className: 'custom-substation-icon',
    html: `<div style="background-color: ${color}; width: ${iconSize}px; height: ${iconSize}px; border-radius: ${radius}px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(13, 63, 209, 0.4);">
             <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -(iconSize / 2)]
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function ZoomSync({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

// Memoized Substation Marker Component
const SubstationMarker = React.memo(({ sub, parseGps, iconSize, onSelectSubstation, onMapCenter, onZoomChange }) => {
  const pos = parseGps(sub.gps) || (sub.latitude && sub.longitude ? { lat: sub.latitude, lng: sub.longitude } : null);
  if (!pos) return null;

  const handleClick = useCallback(() => {
    onSelectSubstation(sub.id.toString(), sub);
    onMapCenter([pos.lat, pos.lng]);
    onZoomChange(14);
  }, [sub, pos.lat, pos.lng, onSelectSubstation, onMapCenter, onZoomChange]);

  return (
    <Marker
      key={`sub-${sub.id}`}
      position={[pos.lat, pos.lng]}
      icon={createSubstationIcon(iconSize, sub.status)}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="text-sm p-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${sub.status === 'Ativa' ? 'bg-green-500' : sub.status === 'Manutenção' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
            <strong className="text-[#0f1c2c] uppercase">{sub.nome}</strong>
          </div>
          <p className="text-[10px] text-[#747686] mb-1 font-medium">{sub.municipio} · {sub.tipo}</p>
          <hr className="my-2 border-[#c4c5d7]/20" />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase text-[#0d3fd1]">Capacidade: {sub.capacidade_total_mva || 0} MVA</span>
            <span className="text-[9px] font-bold">Ativos Vinculados: {sub._count?.pts || 0}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

SubstationMarker.displayName = 'SubstationMarker';

export default function Dashboard() {
  const [filters, setFilters] = useState({
    municipio: '',
    status: '',
    tipo: '',
    id_subestacao: '',
  });
  const [activeFilters, setActiveFilters] = useState({
    municipio: '',
    status: '',
    tipo: '',
    id_subestacao: '',
  });
  const [selectedSubstation, setSelectedSubstation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-11.2027, 17.8739]);
  const [zoom, setZoom] = useState(6);

  const debounceTimerRef = useRef(null);
  const hasInitialFocused = useRef(false);

  const iconSizes = useMemo(() => {
    const z = zoom;
    const subSize = z < 7 ? 22 : z < 10 ? 28 : z < 13 ? 34 : 40;
    return { subSize };
  }, [zoom]);

  const parseGps = useCallback((gpsString) => {
    if (!gpsString) return null;
    const parts = gpsString.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }, []);

  // Stats query — refetches when active filters change
  const { data: statsData, isLoading: isLoadingStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ['dashboard-stats', activeFilters],
    queryFn: async () => {
      const params = {};
      if (activeFilters.municipio) params.municipio = activeFilters.municipio;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.id_subestacao) params.id_subestacao = activeFilters.id_subestacao;
      const res = await api.get('/dashboard/stats', { params });
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Map data — static, full dataset for client-side filtering
  const { data: mapData, isLoading: isLoadingMap } = useQuery({
    queryKey: ['dashboard-map'],
    queryFn: async () => {
      const res = await api.get('/dashboard/map');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto-focus logic: centers the map on the substation cluster once data is loaded
  useEffect(() => {
    if (!isLoadingMap && mapData?.subestacoes && mapData.subestacoes.length > 0 && !hasInitialFocused.current) {
      const points = mapData.subestacoes
        .map(s => parseGps(s.gps) || (s.latitude && s.longitude ? { lat: s.latitude, lng: s.longitude } : null))
        .filter(Boolean);

      if (points.length > 0) {
        const sumLat = points.reduce((acc, p) => acc + p.lat, 0);
        const sumLng = points.reduce((acc, p) => acc + p.lng, 0);
        const avgLat = sumLat / points.length;
        const avgLng = sumLng / points.length;

        setMapCenter([avgLat, avgLng]);
        setZoom(10);
        hasInitialFocused.current = true;
      }
    }
  }, [mapData, isLoadingMap, parseGps]);

  // Handle auto-focus when a specific substation is filtered
  useEffect(() => {
    if (activeFilters.id_subestacao && mapData?.subestacoes) {
      const target = mapData.subestacoes.find(s => String(s.id) === String(activeFilters.id_subestacao));
      if (target) {
        const coords = parseGps(target.gps) || (target.latitude && target.longitude ? { lat: target.latitude, lng: target.longitude } : null);
        if (coords) {
          setMapCenter([coords.lat, coords.lng]);
          setZoom(14);
        }
      }
    }
  }, [activeFilters.id_subestacao, mapData, parseGps]);

  // Apply filters with debounce
  const applyFilters = useCallback((newFilters) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setActiveFilters(newFilters);
    }, 400);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    applyFilters(updated);
  }, [filters, applyFilters]);

  const clearFilters = useCallback(() => {
    const empty = { municipio: '', status: '', tipo: '', id_subestacao: '' };
    setFilters(empty);
    setActiveFilters(empty);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const hasActiveFilters = activeFilters.municipio || activeFilters.status || activeFilters.tipo || activeFilters.id_subestacao;

  // Derive computed stats from filtered map data for KPIs
  const filteredSubs = useMemo(() => {
    if (!mapData?.subestacoes) return [];
    return mapData.subestacoes.filter(s => {
      if (activeFilters.id_subestacao && String(s.id) !== String(activeFilters.id_subestacao)) return false;
      if (activeFilters.municipio && s.municipio !== activeFilters.municipio) return false;
      if (activeFilters.status && s.status !== activeFilters.status) return false;
      if (activeFilters.tipo && s.tipo !== activeFilters.tipo) return false;
      return true;
    });
  }, [mapData, activeFilters]);

  const uniqueMunicipios = useMemo(() => {
    if (!mapData?.subestacoes) return [];
    return [...new Set(mapData.subestacoes.map(s => s.municipio))].filter(Boolean).sort();
  }, [mapData]);

  const uniqueTipos = useMemo(() => {
    if (!mapData?.subestacoes) return [];
    return [...new Set(mapData.subestacoes.map(s => s.tipo))].filter(Boolean).sort();
  }, [mapData]);

  // Cards derive values from statsData (server-filtered) for counts 
  // but from filteredSubs for MVA capacity when tipo filter active (not passed to server)
  const derivedCapacity = useMemo(() => {
    if (!hasActiveFilters) return statsData?.capacidade_total_mva || 0;
    return filteredSubs.reduce((acc, s) => acc + Number(s.capacidade_total_mva || 0), 0);
  }, [hasActiveFilters, filteredSubs, statsData]);

  const derivedSubCount = hasActiveFilters ? filteredSubs.length : (statsData?.subestacoes || 0);
  const derivedClientCount = hasActiveFilters ? filteredSubs.reduce((acc, s) => acc + (s._count?.pts || 0), 0) : (statsData?.clientes || 0);

  const cards = useMemo(() => [
    {
      title: 'Rede de Subestações',
      value: derivedSubCount,
      icon: Layers,
      color: '#0d3fd1',
      label: hasActiveFilters ? 'Filtradas' : 'Locais Registados'
    },
    {
      title: 'Capacidade de Rede',
      value: `${Number(derivedCapacity).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} MVA`,
      icon: Zap,
      color: '#fb923c',
      label: hasActiveFilters ? 'Filtrado' : 'Potência Total'
    },
    {
      title: 'Clientes (PTs)',
      value: derivedClientCount,
      icon: Users,
      color: '#5fff9b',
      label: hasActiveFilters ? 'Filtrados' : 'Ativos MT/BT'
    },
    {
      title: 'Auditorias Concluídas',
      value: statsData?.tarefas_concluidas || 0,
      icon: CheckCircle2,
      color: '#0dd114',
      label: 'Histórico'
    }
  ], [derivedSubCount, derivedCapacity, derivedClientCount, statsData, hasActiveFilters]);

  const onSelectSubstation = useCallback((subId, sub) => {
    setSelectedSubstation(sub);
  }, []);

  const isLoading = isLoadingStats || isLoadingMap;

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Painel de Operações</h2>
          <p className="text-sm text-[#747686] font-medium">Controllo centralizado com agregação de dados em tempo real</p>
        </div>

      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`bg-white rounded-2xl p-6 shadow-sm border ${hasActiveFilters ? 'border-[#0d3fd1]/20' : 'border-[#c4c5d7]/10'} group hover:shadow-xl hover:shadow-[#0d3fd1]/5 transition-all relative overflow-hidden ${isLoadingStats ? 'animate-pulse' : ''}`}>
            {hasActiveFilters && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0d3fd1] to-[#0034cc]" />
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#eff4ff] rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-[#0d3fd1]/5 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div style={{ backgroundColor: `${card.color}15` }} className="p-3 rounded-xl transition-transform group-hover:scale-110">
                  <card.icon style={{ color: card.color }} className="w-6 h-6" />
                </div>
                <ArrowUpRight className="text-[#c4c5d7] w-4 h-4 group-hover:text-[#0d3fd1] transition-colors" />
              </div>
              <h3 className="text-[11px] font-black text-[#747686] uppercase tracking-widest mb-1">{card.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0f1c2c] tracking-tighter">{card.value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${hasActiveFilters ? 'text-[#0d3fd1] bg-[#eff4ff]' : 'text-[#5fff9b] bg-[#005229]'}`}>
                  {card.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#c4c5d7]/20 shadow-sm px-6 py-4">
        <div className="flex items-center">

          {/* ESQUERDA */}
          <div className="flex items-center gap-2 text-[10px] font-black text-[#747686] uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5 text-[#0d3fd1]" />
            Filtros
          </div>

          {/* DIREITA */}
          <div className="ml-auto flex flex-wrap items-center gap-3">

            {/* Município */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Município</label>
              <select
                value={filters.municipio}
                onChange={e => handleFilterChange('municipio', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none min-w-[150px]"
              >
                <option value="">Todos Municípios</option>
                {uniqueMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Estado</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none min-w-[130px]"
              >
                <option value="">Todos os Estados</option>
                <option value="Ativa">Ativa</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Desativada">Desativada</option>
              </select>
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo</label>
              <select
                value={filters.tipo}
                onChange={e => handleFilterChange('tipo', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none min-w-[130px]"
              >
                <option value="">Todos os Tipos</option>
                {uniqueTipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Subestação */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-black text-[#747686] uppercase tracking-widest ml-1">Subestação</label>
              <select
                value={filters.id_subestacao}
                onChange={e => handleFilterChange('id_subestacao', e.target.value)}
                className="bg-[#f8f9ff] border border-[#c4c5d7]/30 rounded-lg px-3 py-2 text-[10px] font-bold text-[#0f1c2c] outline-none min-w-[180px]"
              >
                <option value="">Todas Subestações</option>
                {(mapData?.subestacoes || []).map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* Badges */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap ml-2">
                {activeFilters.municipio && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-blue-100">
                    <Building2 className="w-3 h-3" /> {activeFilters.municipio}
                  </span>
                )}
                {activeFilters.id_subestacao && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-amber-100">
                    <Zap className="w-3 h-3" /> {mapData?.subestacoes?.find(s => String(s.id) === String(activeFilters.id_subestacao))?.nome || 'Subestação'}
                  </span>
                )}
                {activeFilters.status && (
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-green-100">
                    <Activity className="w-3 h-3" /> {activeFilters.status}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-100 transition-all active:scale-95 ml-1"
                >
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>
            )}

            {(isRefetchingStats || isLoading) && (
              <div className="w-3 h-3 rounded-full border-2 border-[#0d3fd1] border-t-transparent animate-spin" />
            )}

          </div>
        </div>
      </div>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#c4c5d7]/10 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
            <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Geolocalização de Ativos</h3>
            {hasActiveFilters && (
              <span className="text-[9px] font-black bg-[#0d3fd1] text-white px-2 py-1 rounded-lg uppercase tracking-widest">
                {filteredSubs.length} subestações visíveis
              </span>
            )}
          </div>
          {selectedSubstation && (
            <button
              onClick={() => setSelectedSubstation(null)}
              className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-yellow-100 transition-all border border-yellow-100"
            >
              Limpar Foco
            </button>
          )}
        </div>

        <div className="w-full h-[500px] bg-[#eff4ff] rounded-2xl border border-[#c4c5d7]/20 relative overflow-hidden shadow-inner">
          {isLoadingMap && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-[#0d3fd1] uppercase tracking-widest">Mapeando Ativos...</p>
            </div>
          )}
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%', zIndex: '1' }}
            zoomControl={false}
          >
            <ChangeView center={mapCenter} zoom={zoom} />
            <ZoomSync onZoomChange={setZoom} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredSubs.map((sub) => (
              <SubstationMarker
                key={sub.id}
                sub={sub}
                parseGps={parseGps}
                iconSize={iconSizes.subSize}
                onSelectSubstation={onSelectSubstation}
                onMapCenter={setMapCenter}
                onZoomChange={setZoom}
              />
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-6 right-6 bg-[#243141] text-white p-4 rounded-xl shadow-2xl border border-white/10 z-[1000]">
            <p className="text-[10px] font-bold text-[#5fff9b] uppercase tracking-widest mb-2">Legenda</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#0d3fd1]"></div>
                <span className="text-[9px] font-medium opacity-80">Ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#f59e0b]"></div>
                <span className="text-[9px] font-medium opacity-80">Manutenção</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#6b7280]"></div>
                <span className="text-[9px] font-medium opacity-80">Desativada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSubstation && (
        <SubstationDetail
          substation={selectedSubstation}
          onClose={() => setSelectedSubstation(null)}
          onFilterPts={() => { }}
        />
      )}
    </div>
  );
}