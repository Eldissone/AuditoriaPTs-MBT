import React, { useEffect, useState } from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Map as MapIcon,
  TrendingUp,
  Layers,
  Activity,
  PlusCircle,
  ArrowUpRight,
  Navigation,
  Search
} from 'lucide-react';
import api from '../services/api';
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
  html: `<div style="background-color: #0d3fd1; width: 32px; height: 32px; border-radius: 8px; display: flex; items-center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(13, 63, 209, 0.4);">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    subestacoes: 0,
    pts: 0,
    auditorias: 0,
    anomalias: 0
  });

  const [subestacoes, setSubestacoes] = useState([]);
  const [filters, setFilters] = useState({
    id_subestacao: '',
    estado_operacional: '',
    municipio: '',
    bairro: ''
  });
  const [selectedPtId, setSelectedPtId] = useState(null);
  const [pts, setPts] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [mapCenter, setMapCenter] = useState([-8.8383, 13.2344]); // Luanda
  const [zoom, setZoom] = useState(12);
  const [gpsInput, setGpsInput] = useState({ lat: '', lng: '' });
  const [isLocating, setIsLocating] = useState(false);

  const parseGps = (gpsString) => {
    if (!gpsString) return null;
    const parts = gpsString.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const params = {};
        if (filters.id_subestacao) params.id_subestacao = filters.id_subestacao;
        if (filters.estado_operacional) params.estado_operacional = filters.estado_operacional;
        if (filters.municipio) params.municipio = filters.municipio;
        if (filters.bairro) params.bairro = filters.bairro;

        const [subs, ptsRes, audits] = await Promise.all([
          api.get('/subestacoes'),
          api.get('/pts', { params }),
          api.get('/inspecoes')
        ]);

        const subestacoesList = subs.data.data || subs.data;
        setSubestacoes(subestacoesList);

        // Filter subestacoes if id_subestacao is selected for stats
        const displayedSubs = filters.id_subestacao
          ? subestacoesList.filter(s => s.id === Number(filters.id_subestacao))
          : subestacoesList;

        const currentPts = ptsRes.data;

        // Calculate unique locations (Municípios + Distritos)
        const uniqueLocais = new Set(
          currentPts.map(p => p.municipio || p.localizacao || 'Luanda')
        ).size;

        // Filter audits based on current PTs
        const currentPtIds = new Set(currentPts.map(p => p.id_pt));
        const filteredAudits = audits.data.filter(a => currentPtIds.has(a.id_pt));

        setStats({
          subestacoes: displayedSubs.length,
          pts: currentPts.length,
          auditorias: filteredAudits.length,
          locais: uniqueLocais,
          anomalias: filteredAudits.filter(a => a.nivel_urgencia === 'Critico').length
        });

        setPts(currentPts);

        const sortedAudits = [...filteredAudits].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao)).slice(0, 4);
        setRecentAudits(sortedAudits);

      } catch (err) {
        console.error('Erro ao buscar dados do dashboard', err);
      }
    }
    fetchData();
  }, [filters, selectedPtId]);

  const handleCurrentLocation = () => {
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
  };

  const handleGpsSearch = (e) => {
    e.preventDefault();
    const lat = parseFloat(gpsInput.lat);
    const lng = parseFloat(gpsInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setZoom(16);
    }
  };

  const cards = [
    { title: 'Subestações', value: stats.locais, icon: Layers, color: '#0d3fd1', label: filters.id_subestacao || 'Subestações' },
    { title: 'Postos (PT)', value: stats.pts, icon: Zap, color: '#5fff9b', label: filters.estado_operacional || 'Em Operação' },
    { title: 'Auditorias', value: stats.auditorias, icon: Activity, color: '#243141', label: 'Ciclo Ativo' },
    { title: 'Locais', value: stats.locais, icon: MapIcon, color: '#ff4d4d', label: 'Distritos/Mun.' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[#0f1c2c] text-2xl font-black uppercase tracking-tight">Painel de Operações</h2>
          <p className="text-sm text-[#747686] font-medium">Controlo centralizado da malha de distribuição</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#243141] text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#0f1c2c] transition-all shadow-lg active:scale-95 uppercase">
            <TrendingUp className="w-4 h-4 text-[#5fff9b]" />
            Relatório Global
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-[#c4c5d7]/10 group hover:shadow-xl hover:shadow-[#0d3fd1]/5 transition-all relative overflow-hidden">
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
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Localização da Substação</h3>
            </div>
            <div className="flex gap-4">
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.id_subestacao}
                onChange={e => setFilters({ ...filters, id_subestacao: e.target.value })}
              >
                <option value="">Todas Subestações</option>
                {Array.isArray(subestacoes) && subestacoes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.estado_operacional}
                onChange={e => setFilters({ ...filters, estado_operacional: e.target.value })}
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
                onChange={e => setFilters({ ...filters, municipio: e.target.value })}
              >
                <option value="">Todos Municípios</option>
                {[...new Set(pts.map(p => p.municipio))].filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                className="bg-[#eff4ff] border-0 rounded-lg px-4 py-2 text-[10px] font-bold text-[#0d3fd1] outline-none ring-1 ring-[#c4c5d7]/20"
                value={filters.bairro}
                onChange={e => setFilters({ ...filters, bairro: e.target.value })}
              >
                <option value="">Todos Bairros</option>
                {[...new Set(pts.map(p => p.bairro))].filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {selectedPtId && (
                <button
                  onClick={() => setSelectedPtId(null)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100 transition-all border border-red-100"
                >
                  Limpar Foco (PT: {selectedPtId})
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
              {Array.isArray(subestacoes) && subestacoes.map((sub) => {
                const pos = parseGps(sub.gps);
                return pos && (
                  <Marker
                    key={`sub-${sub.id}`}
                    position={[pos.lat, pos.lng]}
                    icon={substationIcon}
                    eventHandlers={{
                      click: () => {
                        setFilters({ ...filters, id_subestacao: sub.id.toString() });
                        setMapCenter([pos.lat, pos.lng]);
                        setZoom(14);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-sm p-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-4 h-4 text-[#0d3fd1]" />
                          <strong className="text-[#0f1c2c] uppercase">Subestação: {sub.nome}</strong>
                        </div>
                        <p className="text-[10px] text-[#747686] mb-1 font-medium italic">{sub.localizacao}</p>
                        <hr className="my-2 border-[#c4c5d7]/20" />
                        <div className="flex flex-col gap-1 mb-3">
                          <span className="text-[9px] font-black uppercase text-[#0d3fd1]">Código: {sub.codigo}</span>
                          <span className="text-[9px] font-bold">Potência Total: {sub.potencia_total_kva} kVA</span>
                        </div>
                        <button
                          onClick={() => setFilters({ ...filters, id_subestacao: sub.id.toString() })}
                          className="w-full bg-[#0d3fd1] text-white text-[9px] font-black uppercase py-2 rounded-lg hover:bg-[#0034cc] transition-all"
                        >
                          Ver PTs Desta Subestação
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {pts.map((pt) => {
                const pos = parseGps(pt.gps);
                return pos && (
                  <Marker
                    key={pt.id}
                    position={[pos.lat, pos.lng]}
                    eventHandlers={{
                      click: () => {
                        setSelectedPtId(pt.id_pt);
                        setMapCenter([pos.lat, pos.lng]);
                        setZoom(16);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-sm p-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${pt.estado_operacional === 'Operacional' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <strong className="text-[#0f1c2c] uppercase">PT: {pt.id_pt}</strong>
                        </div>
                        <p className="text-[10px] text-[#747686] mb-1 font-medium italic">{pt.localizacao}</p>
                        <hr className="my-2 border-[#c4c5d7]/20" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase text-[#0d3fd1]">Subestação: {pt.subestacao?.nome || 'N/A'}</span>
                          <span className="text-[9px] font-bold">Potência: {pt.potencia_kva} kVA</span>
                        </div>
                        <button
                          onClick={() => setSelectedPtId(pt.id_pt)}
                          className="w-full mt-3 bg-[#0d3fd1] text-white text-[9px] font-black uppercase py-2 rounded-lg hover:bg-[#0034cc] transition-all"
                        >
                          Filtrar Dash
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* GPS Search Overlay */}
            {/* <div className="absolute top-4 left-4 z-[1000] visible group-hover:visible transition-all">
              <form onSubmit={handleGpsSearch} className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-2xl border border-[#c4c5d7]/30">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="Lat"
                    value={gpsInput.lat}
                    onChange={e => setGpsInput({ ...gpsInput, lat: e.target.value })}
                    className="w-20 bg-[#eff4ff] border-0 rounded-lg py-1 px-2 text-[10px] font-bold outline-none ring-1 ring-[#c4c5d7]/20 focus:ring-[#0d3fd1]"
                  />
                  <input
                    type="text"
                    placeholder="Lng"
                    value={gpsInput.lng}
                    onChange={e => setGpsInput({ ...gpsInput, lng: e.target.value })}
                    className="w-20 bg-[#eff4ff] border-0 rounded-lg py-1 px-2 text-[10px] font-bold outline-none ring-1 ring-[#c4c5d7]/20 focus:ring-[#0d3fd1]"
                  />
                </div>
                <button type="submit" className="bg-[#0d3fd1] text-white p-2.5 rounded-lg hover:bg-[#0034cc] transition-all">
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={isLocating}
                  className={`p-2.5 rounded-lg transition-all ${isLocating ? 'bg-gray-100 text-gray-400' : 'bg-[#5fff9b] text-[#005229] hover:bg-[#4ae085]'}`}
                  title="Minha Localização"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div> */}

            <div className="absolute bottom-6 right-6 bg-[#243141] text-white p-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] z-[1000]">
              <p className="text-[10px] font-bold text-[#5fff9b] uppercase tracking-widest mb-1">Deteção Inteligente</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">{stats.anomalias} PTs reportando estados críticos na malha.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-[#243141] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 h-full flex flex-col">
          <h3 className="font-black text-white text-lg uppercase tracking-tight mb-6">Auditorias Recentes</h3>

          <div className="space-y-4 flex-grow overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {recentAudits.length > 0 ? (
              recentAudits.map((audit) => (
                <div key={audit.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-white px-2 py-0.5 rounded bg-[#0d3fd1] uppercase tracking-wider">{audit.id_pt}</span>
                    <span className="text-[9px] font-bold text-white/40 uppercase">
                      {new Date(audit.data_inspecao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 group-hover:text-[#5fff9b] transition-colors uppercase tracking-tight truncate">{audit.pt?.localizacao || 'Localização Desconhecida'}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${audit.nivel_urgencia === 'Critico' ? 'bg-red-500' : 'bg-[#5fff9b]'}`}></div>
                    <span className="text-[10px] font-medium text-white/60 tracking-tight">Status: {audit.tipo}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                Nenhuma auditoria recente
              </div>
            )}
          </div>

          <button className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all border border-white/10">Ver Histórico Completo</button>
        </div>
      </div>
    </div>
  );
}