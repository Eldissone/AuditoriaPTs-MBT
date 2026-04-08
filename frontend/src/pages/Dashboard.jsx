import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Map as MapIcon,
  TrendingUp,
  Layers,
  PlusCircle,
  ArrowUpRight,
  Navigation,
  Search,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import SubstationDetail from './SubstationDetail';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getGpsForMunicipio } from '../utils/angolaGps';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createSubstationIcon = (size) => {
  const iconSize = Math.max(22, Math.min(44, size));
  const svgSize = Math.round(iconSize * 0.56);
  const radius = Math.round(iconSize * 0.25);
  return L.divIcon({
    className: 'custom-substation-icon',
    html: `<div style="background-color: #0d3fd1; width: ${iconSize}px; height: ${iconSize}px; border-radius: ${radius}px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(13, 63, 209, 0.4);">
             <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -(iconSize / 2)]
  });
};

const createPtIcon = (size, selected = false) => {
  const iconSize = Math.max(16, Math.min(34, size));
  const svgSize = Math.round(iconSize * 0.55);
  const border = selected ? 3 : 2;
  const bg = selected ? '#fb923c' : '#5fff9b';
  const borderColor = selected ? '#c2410c' : '#005229';
  const fill = selected ? 'white' : '#005229';
  const shadow = selected
    ? '0 4px 16px rgba(251, 146, 60, 0.6), inset 0 0 8px rgba(255,255,255,0.3)'
    : '0 2px 8px rgba(0,82,41,0.3)';

  return L.divIcon({
    className: selected ? 'custom-pt-icon-selected' : 'custom-pt-icon',
    html: `<div style="background-color: ${bg}; width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: ${border}px solid ${borderColor}; box-shadow: ${shadow};">
             <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="${fill}" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
           </div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -(iconSize / 2)]
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function ZoomSync({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
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
      icon={createSubstationIcon(iconSize)}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="text-sm p-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${sub.status === 'Ativa' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <strong className="text-[#0f1c2c] uppercase">{sub.nome}</strong>
          </div>
          <p className="text-[10px] text-[#747686] mb-1 font-medium">{sub.municipio}</p>
          <hr className="my-2 border-[#c4c5d7]/20" />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase text-[#0d3fd1]">Capacidade: {sub.capacidade_total_mva} MVA</span>
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
    id_subestacao: '',
    estado_operacional: '',
    municipio: '',
  });
  const [selectedSubstation, setSelectedSubstation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-11.2027, 17.8739]);
  const [zoom, setZoom] = useState(6);
  const iconSizes = useMemo(() => {
    const z = zoom;
    const subSize = z < 7 ? 22 : z < 10 ? 28 : z < 13 ? 34 : 40;
    return { subSize };
  }, [zoom]);

  const debounceTimerRef = useRef(null);

  const parseGps = useCallback((gpsString) => {
    if (!gpsString) return null;
    const parts = gpsString.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }, []);

  // API Calls com React Query - Using NEW aggregated endpoints
  const { data: statsData, isLoading: isLoadingStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: mapData, isLoading: isLoadingMap } = useQuery({
    queryKey: ['dashboard-map'],
    queryFn: async () => {
      const res = await api.get('/dashboard/map');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Debounced filter handler
  const handleFilterChange = useCallback((newFilters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setFilters(newFilters);
    }, 500);
  }, []);

  const cards = useMemo(() => [
    {
      title: 'Rede de Subestações',
      value: statsData?.subestacoes || 0,
      icon: Layers,
      color: '#0d3fd1',
      label: 'Locais Registados'
    },
    {
      title: 'Capacidade de Rede',
      value: `${(statsData?.capacidade_total_mva || 0).toLocaleString()} MVA`,
      icon: Zap,
      color: '#fb923c',
      label: 'Potência Total'
    },
    {
      title: 'Clientes (PTs)',
      value: statsData?.clientes || 0,
      icon: Users,
      color: '#5fff9b',
      label: 'Ativos MT/BT'
    },
    {
      title: 'Auditorias Concluídas',
      value: statsData?.tarefas_concluidas || 0,
      icon: CheckCircle2,
      color: '#0dd114',
      label: 'Histórico'
    }
  ], [statsData]);

  const onSelectSubstation = useCallback((subId, sub) => {
    setSelectedSubstation(sub);
  }, []);

  const substationMarkers = useMemo(() => {
    if (!mapData?.subestacoes) return [];

    let filtered = mapData.subestacoes;
    if (filters.municipio) {
      filtered = filtered.filter(s => s.municipio === filters.municipio);
    }

    return filtered;
  }, [mapData, filters.municipio]);

  const uniqueMunicipios = useMemo(() => {
    if (!mapData?.subestacoes) return [];
    return [...new Set(mapData.subestacoes.map(s => s.municipio))].filter(Boolean).sort();
  }, [mapData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Painel de Operações</h2>
          <p className="text-sm text-[#747686] font-medium">Controlo centralizado com agregação de dados em tempo real</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#243141] text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#0f1c2c] transition-all shadow-lg active:scale-95 uppercase">
            <TrendingUp className="w-4 h-4 text-[#5fff9b]" />
            Relatório de Ativos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`bg-white rounded-2xl p-6 shadow-sm border border-[#c4c5d7]/10 group hover:shadow-xl hover:shadow-[#0d3fd1]/5 transition-all relative overflow-hidden ${isLoadingStats ? 'animate-pulse' : ''}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#eff4ff] rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-[#0d3fd1]/5 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div style={{ backgroundColor: `${card.color}15` }} className="p-3 rounded-xl transition-transform group-hover:scale-110">
                  <card.icon style={{ color: card.color }} className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  {isRefetchingStats && (
                    <div className="w-3 h-3 rounded-full border-2 border-[#0d3fd1] border-t-transparent animate-spin"></div>
                  )}
                  <ArrowUpRight className="text-[#c4c5d7] w-4 h-4 group-hover:text-[#0d3fd1] transition-colors" />
                </div>
              </div>
              <h3 className="text-[11px] font-black text-[#747686] uppercase tracking-widest mb-1">{card.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0f1c2c] tracking-tighter">{card.value}</span>
                <span className="text-[10px] font-bold text-[#5fff9b] bg-[#005229] px-1.5 py-0.5 rounded uppercase tracking-tighter">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#c4c5d7]/10 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Geolocalização de Ativos</h3>
            </div>
            <div className="flex gap-4">
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.municipio}
                onChange={e => handleFilterChange({ ...filters, municipio: e.target.value })}
              >
                <option value="">Todos Municípios</option>
                {uniqueMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {selectedSubstation && (
                <button
                  onClick={() => {
                    setSelectedSubstation(null);
                  }}
                  className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-yellow-100 transition-all border border-yellow-100"
                >
                  Limpar Foco
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-[500px] bg-[#eff4ff] rounded-2xl border border-[#c4c5d7]/20 relative overflow-hidden group shadow-inner">
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

              {substationMarkers.map((sub) => (
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

            <div className="absolute bottom-6 right-6 bg-[#243141] text-white p-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] z-[1000]">
              <p className="text-[10px] font-bold text-[#5fff9b] uppercase tracking-widest mb-1">Guia do Mapa</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">Marcadores representam centros de carga (Subestações). Clique para ver detalhes.</p>
            </div>
          </div>
        </div>
      </div>

      {selectedSubstation && (
        <SubstationDetail
          substation={selectedSubstation}
          onClose={() => setSelectedSubstation(null)}
          onFilterPts={() => {
            // Placeholder if we need to filter further
          }}
        />
      )}
    </div>
  );
}