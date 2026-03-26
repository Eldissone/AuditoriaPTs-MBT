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

  const [pts, setPts] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [mapCenter, setMapCenter] = useState([-8.8383, 13.2344]); // Luanda
  const [zoom, setZoom] = useState(12);
  const [gpsInput, setGpsInput] = useState({ lat: '', lng: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [subs, ptsRes, audits] = await Promise.all([
          api.get('/subestacoes'),
          api.get('/pts'),
          api.get('/inspecoes')
        ]);

        setStats({
          subestacoes: subs.data.length,
          pts: ptsRes.data.length,
          auditorias: audits.data.length,
          anomalias: audits.data.filter(a => a.nivel_urgencia === 'Critico').length
        });

        setPts(ptsRes.data);
        // Sort by date desc and take top 4
        const sortedAudits = [...audits.data].sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao)).slice(0, 4);
        setRecentAudits(sortedAudits);

      } catch (err) {
        console.error('Erro ao buscar dados do dashboard', err);
      }
    }
    fetchData();
  }, []);

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
    { title: 'Subestações', value: stats.subestacoes, icon: Layers, color: '#0d3fd1', label: 'Monitorizadas' },
    { title: 'Postos (PT)', value: stats.pts, icon: Zap, color: '#5fff9b', label: 'Em Operação' },
    { title: 'Auditorias', value: stats.auditorias, icon: Activity, color: '#243141', label: 'Este Mês' },
    { title: 'Anomalias', value: stats.anomalias, icon: AlertTriangle, color: '#ff4d4d', label: 'Críticas' }
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
          <button className="flex items-center gap-2 bg-[#0d3fd1] text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/20 active:scale-95 uppercase">
            <PlusCircle className="w-4 h-4" />
            Nova Auditoria
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#c4c5d7]/10 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#0d3fd1] rounded-full"></div>
              <h3 className="font-black text-[#0f1c2c] text-lg uppercase tracking-tight">Geo-Localização da Malha</h3>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-[#eff4ff] rounded-lg text-[#0d3fd1] font-bold text-[10px] uppercase tracking-tight hover:bg-[#dbe7ff] transition-all">Ativos</button>
              <button className="p-2 text-[#747686] font-bold text-[10px] uppercase tracking-tight hover:text-[#0f1c2c] transition-all">Em Manutenção</button>
            </div>
          </div>

          <div className="w-full h-[400px] bg-[#eff4ff] rounded-2xl border border-[#c4c5d7]/20 relative overflow-hidden group shadow-inner">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <ChangeView center={mapCenter} zoom={zoom} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {pts.map((pt) => (
                pt.latitude && pt.longitude && (
                  <Marker
                    key={pt.id}
                    position={[pt.latitude, pt.longitude]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>PT: {pt.codigo}</strong><br />
                        Localização: {pt.localizacao}<br />
                        Status: {pt.status || 'Ativo'}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>

            {/* GPS Search Overlay */}
            <div className="absolute top-4 left-4 z-[1000] visible group-hover:visible transition-all">
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
                  <Navigation className="w-3.5 h-3.5 rotate-45" />
                </button>
              </form>
            </div>

            <div className="absolute bottom-6 right-6 bg-[#243141] text-white p-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] z-[1000]">
              <p className="text-[10px] font-bold text-[#5fff9b] uppercase tracking-widest mb-1">Deteção Inteligente</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">{stats.anomalias} PTs reportando estados críticos na malha.</p>
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
    </div>
  );
}