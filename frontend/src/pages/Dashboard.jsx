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
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import SubstationDetail from './SubstationDetail';
import { MapContainer, TileLayer, Marker, Popup, useMap, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Substation Icon
const substationIcon = L.divIcon({
  className: 'custom-substation-icon',
  html: `<div style="background-color: #0d3fd1; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(13, 63, 209, 0.4);">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Custom PT Icon - Default
const ptIcon = L.divIcon({
  className: 'custom-pt-icon',
  html: `<div style="background-color: #5fff9b; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #005229; box-shadow: 0 2px 8px rgba(0,82,41,0.3);">
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#005229" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
         </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12]
});

// Custom PT Icon - Selected (highlighted)
const ptIconSelected = L.divIcon({
  className: 'custom-pt-icon-selected',
  html: `<div style="background-color: #fb923c; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #c2410c; box-shadow: 0 4px 16px rgba(251, 146, 60, 0.6), inset 0 0 8px rgba(255,255,255,0.3);">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Memoized PT Marker Component
const PtMarker = React.memo(({ pt, parseGps, onSelectPt, onMapCenter, onZoomChange }) => {
  const pos = parseGps(pt.gps);
  if (!pos) return null;

  const handleClick = useCallback(() => {
    onSelectPt(pt.id_pt);
    onMapCenter([pos.lat, pos.lng]);
    onZoomChange(16);
  }, [pt.id_pt, pos.lat, pos.lng, onSelectPt, onMapCenter, onZoomChange]);

  return (
    <Marker
      key={pt.id}
      position={[pos.lat, pos.lng]}
      icon={ptIcon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="text-sm p-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${pt.estado_operacional === 'Operacional' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <strong className="text-[#0f1c2c] uppercase">{pt.parceiro_negocios || pt.id_pt}</strong>
          </div>
          <p className="text-[10px] text-[#747686] mb-1 font-medium italic">{pt.localizacao}</p>
          <hr className="my-2 border-[#c4c5d7]/20" />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase text-[#0d3fd1]">Subestação: {pt.subestacao?.nome || 'N/A'}</span>
            <span className="text-[9px] font-bold">Potência: {pt.potencia_kva} kVA</span>
          </div>
          <button
            onClick={() => onSelectPt(pt.id_pt)}
            className="w-full mt-3 bg-[#0d3fd1] text-white text-[9px] font-black uppercase py-2 rounded-lg hover:bg-[#0034cc] transition-all"
          >
            Filtrar Dash
          </button>
        </div>
      </Popup>
    </Marker>
  );
});

PtMarker.displayName = 'PtMarker';

// Memoized Substation Marker Component
const SubstationMarker = React.memo(({ sub, parseGps, onSelectSubstation, onMapCenter, onZoomChange }) => {
  const pos = parseGps(sub.gps);
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
      icon={substationIcon}
      eventHandlers={{ click: handleClick }}
    />
  );
});

SubstationMarker.displayName = 'SubstationMarker';

export default function Dashboard() {
  const [filters, setFilters] = useState({
    id_subestacao: '',
    estado_operacional: '',
    municipio: '',
    bairro: ''
  });
  const [selectedPtId, setSelectedPtId] = useState(null);
  const [selectedSubstation, setSelectedSubstation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-11.2027, 17.8739]);
  const [zoom, setZoom] = useState(6);
  const [gpsInput, setGpsInput] = useState({ lat: '', lng: '' });
  const [isLocating, setIsLocating] = useState(false);
  const debounceTimerRef = useRef(null);

  const parseGps = useCallback((gpsString) => {
    if (!gpsString) return null;
    const parts = gpsString.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }, []);

  // API Calls com React Query - Auto-updating counters
  const { data: subestacoes = [], isRefetching: isRefetchingSubs } = useQuery({
    queryKey: ['subestacoes'],
    queryFn: async () => {
      const res = await api.get('/subestacoes');
      return res.data.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  const { data: pts = [], isRefetching: isRefetchingPts } = useQuery({
    queryKey: ['pts', filters],
    queryFn: async () => {
      const params = {};
      if (filters.id_subestacao) params.id_subestacao = filters.id_subestacao;
      if (filters.estado_operacional) params.estado_operacional = filters.estado_operacional;
      if (filters.municipio) params.municipio = filters.municipio;
      if (filters.bairro) params.bairro = filters.bairro;
      const res = await api.get('/pts', { params });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  // Fetch tasks/tarefas realizadas
  const { data: tasks = [], isRefetching: isRefetchingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tarefas');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
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

  // Memoized stats calculation
  const stats = useMemo(() => {
    const displayedSubs = filters.id_subestacao
      ? subestacoes.filter(s => s.id === Number(filters.id_subestacao))
      : subestacoes;

    const uniqueLocais = new Set(
      pts.map(p => p.municipio || p.localizacao || 'Luanda')
    ).size;

    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;

    return {
      subestacoes: displayedSubs.length,
      pts: pts.length,
      locais: uniqueLocais,
      tasksCompleted: completedTasks,
    };
  }, [filters, subestacoes, pts, tasks]);

  // Memoized filter options
  const{ municipios, bairros } = useMemo(() => ({
    municipios: [...new Set(pts.map(p => p.municipio))].filter(Boolean),
    bairros: [...new Set(pts.map(p => p.bairro))].filter(Boolean)
  }), [pts]);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setZoom(15);
        setIsLocating(false);
      },
      () => {
        alert('Não foi possível obter a sua localização');
        setIsLocating(false);
      }
    );
  }, []);

  const handleGpsSearch = useCallback((e) => {
    e.preventDefault();
    const lat = parseFloat(gpsInput.lat);
    const lng = parseFloat(gpsInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setZoom(16);
    }
  }, [gpsInput]);

  const cards = useMemo(() => [
    { title: 'Subestações/Localidades', value: stats.locais, icon: Layers, color: '#0d3fd1', label: 'Distritos/Mun.' },
    { title: 'Proprietários (PT)', value: stats.pts, icon: Zap, color: '#5fff9b', label: filters.estado_operacional || 'Em Operação' },
    { title: 'Tarefas Realizadas', value: stats.tasksCompleted, icon: CheckCircle2, color: '#0dd114', label: 'Concluídas' }
  ], [stats, filters.estado_operacional]);

  const onSelectSubstation = useCallback((subId, sub) => {
    setSelectedSubstation(sub);
  }, []);

  const onSelectPt = useCallback((ptId) => {
    setSelectedPtId(ptId);
  }, []);

  // Contar PTs por subestação
  const getPtsCountBySubstation = useCallback((substationId) => {
    return pts.filter(pt => pt.id_subestacao === substationId).length;
  }, [pts]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Painel de Operações</h2>
          <p className="text-sm text-[#747686] font-medium">Controlo centralizado com atualização automática a cada 30 segundos</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#243141] text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#0f1c2c] transition-all shadow-lg active:scale-95 uppercase">
            <TrendingUp className="w-4 h-4 text-[#5fff9b]" />
            Relatório Global
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const isRefetching = (idx === 0 || idx === 1) ? (isRefetchingPts || isRefetchingSubs) : (idx === 2) ? isRefetchingTasks : false;
          return (
            <div key={idx} className={`bg-white rounded-2xl p-6 shadow-sm border border-[#c4c5d7]/10 group hover:shadow-xl hover:shadow-[#0d3fd1]/5 transition-all relative overflow-hidden ${isRefetching ? 'animate-pulse' : ''}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#eff4ff] rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-[#0d3fd1]/5 transition-colors"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div style={{ backgroundColor: `${card.color}15` }} className="p-3 rounded-xl transition-transform group-hover:scale-110">
                    <card.icon style={{ color: card.color }} className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isRefetching && (
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
          );
        })}
      </div>

      <div className="">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#c4c5d7]/10 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Mapa de Subestações (Municípios)</h3>
            </div>
            <div className="flex gap-4">
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.estado_operacional}
                onChange={e => handleFilterChange({ ...filters, estado_operacional: e.target.value })}
              >
                <option value="">Todos Estados</option>
                <option value="Operacional">Operacional</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Crítico">Crítico</option>
                <option value="Fora de Serviço">Fora de Serviço</option>
              </select>
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.municipio}
                onChange={e => handleFilterChange({ ...filters, municipio: e.target.value })}
              >
                <option value="">Todos Municípios</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.bairro}
                onChange={e => handleFilterChange({ ...filters, bairro: e.target.value })}
              >
                <option value="">Todos Bairros</option>
                {bairros.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {selectedPtId && (
                <button
                  onClick={() => setSelectedPtId(null)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100 transition-all border border-red-100"
                >
                  Limpar Foco PT
                </button>
              )}
              {selectedSubstation && (
                <button
                  onClick={() => setSelectedSubstation(null)}
                  className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-yellow-100 transition-all border border-yellow-100"
                >
                  Limpar Subestação
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-[450px] bg-[#eff4ff] rounded-2xl border border-[#c4c5d7]/20 relative overflow-hidden group shadow-inner">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              style={{ height: '100%', width: '100%', zIndex: '1' }}
              zoomControl={false}
            >
              <ChangeView center={mapCenter} zoom={zoom} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Substation Markers */}
              {Array.isArray(subestacoes) && subestacoes.map((sub) => (
                <SubstationMarker
                  key={`sub-${sub.id}`}
                  sub={sub}
                  parseGps={parseGps}
                  onSelectSubstation={onSelectSubstation}
                  onMapCenter={setMapCenter}
                  onZoomChange={setZoom}
                />
              ))}

              {/* PT Markers */}
              {pts.map((pt) => (
                <PtMarker
                  key={pt.id}
                  pt={pt}
                  parseGps={parseGps}
                  onMapCenter={setMapCenter}
                  onZoomChange={setZoom}
                />
              ))}
            </MapContainer>

            <div className="absolute bottom-6 right-6 bg-[#243141] text-white p-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] z-[1000]">
              <p className="text-[10px] font-bold text-[#5fff9b] uppercase tracking-widest mb-1">Informações do Mapa</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">Clique nos marcadores para visualizar detalhes das subestações e proprietários.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Substation Detail Modal */}
      {selectedSubstation && (
        <SubstationDetail
          substation={selectedSubstation}
          onClose={() => setSelectedSubstation(null)}
          onFilterPts={(subId) => handleFilterChange({ ...filters, id_subestacao: subId })}
        />
      )}
    </div>
  );
}