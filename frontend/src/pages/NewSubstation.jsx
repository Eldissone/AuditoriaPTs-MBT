import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, MapPin, Zap, Database, Activity, Calendar, Info
} from 'lucide-react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getGpsForMunicipio } from '../utils/angolaGps';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition]
  );
  return position === null ? null : (
    <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef}>
      <Popup minWidth={90}><span>Pino Movível. Arraste-me!</span></Popup>
    </Marker>
  );
}

export default function NewSubstation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    codigo_operacional: '',
    tipo: 'Distribuição',
    tensao_kv_entrada: '',
    tensao_kv_saida: '',
    capacidade_total_mva: '',
    municipio: '',
    latitude: '',
    longitude: '',
    status: 'Ativa',
    data_instalacao: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (isEdit) {
      async function fetchSubstation() {
        try {
          const response = await api.get(`/subestacoes/${id}`);
          const sub = response.data;
          
          setFormData({
            nome: sub.nome || '',
            codigo_operacional: sub.codigo_operacional || '',
            tipo: sub.tipo || 'Distribuição',
            tensao_kv_entrada: sub.tensao_kv_entrada || '',
            tensao_kv_saida: sub.tensao_kv_saida || '',
            capacidade_total_mva: sub.capacidade_total_mva || '',
            municipio: sub.municipio || '',
            latitude: sub.latitude || '',
            longitude: sub.longitude || '',
            status: sub.status || 'Ativa',
            data_instalacao: sub.data_instalacao ? sub.data_instalacao.split('T')[0] : ''
          });
        } catch (error) {
          alert('Erro ao carregar dados da subestação.');
          navigate('/subestacoes');
        } finally {
          setLoading(false);
        }
      }
      fetchSubstation();
    }
  }, [id, isEdit, navigate]);

  const mapCenter = useMemo(() => {
    if (formData.latitude && formData.longitude) {
      return [parseFloat(formData.latitude), parseFloat(formData.longitude)];
    }
    const fallback = getGpsForMunicipio(formData.municipio);
    if (fallback) {
       const parts = fallback.split(',');
       return [parseFloat(parts[0]), parseFloat(parts[1])];
    }
    return [-11.2027, 17.8739]; // Default Angola
  }, [formData.latitude, formData.longitude, formData.municipio]);

  const markerPos = useMemo(() => {
    if (formData.latitude && formData.longitude) {
       return { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) };
    }
    const fallback = getGpsForMunicipio(formData.municipio);
    if (fallback) {
       const parts = fallback.split(',');
       return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
    }
    return { lat: -8.8383, lng: 13.2344 }; // Default Luanda
  }, [formData.latitude, formData.longitude, formData.municipio]);

  const mapZoom = (formData.latitude && formData.longitude) ? 16 : (formData.municipio ? 11 : 6);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({ 
          ...prev, 
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setIsLocating(false);
      },
      () => {
        alert('Não foi possível obter a sua localização');
        setIsLocating(false);
      }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/subestacoes/${id}`, formData);
        alert('Subestação atualizada com sucesso!');
      } else {
        await api.post('/subestacoes', formData);
        alert('Subestação registada com sucesso!');
      }
      navigate('/subestacoes');
    } catch (err) {
      alert('Erro ao guardar: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0d3fd1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/subestacoes')}
            className="p-4 bg-white border border-[#c4c5d7]/20 rounded-2xl text-[#0f1c2c] hover:bg-[#eff4ff] transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-[#0f1c2c] uppercase tracking-tight">
              {isEdit ? 'Editar Subestação' : 'Nova Subestação'}
            </h2>
            <p className="text-xs text-[#747686] font-black uppercase tracking-[0.2em] opacity-60">Gestão de Infraestrutura de Rede</p>
          </div>
        </div>
        <button onClick={handleSubmit} className="flex items-center gap-3 bg-[#00e47c] text-[#005229] px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00c96d] transition-all shadow-xl shadow-[#00e47c]/10 active:scale-95">
          <Save className="w-5 h-5" />
          {isEdit ? 'Atualizar Dados' : 'Gravar Unidade'}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-[#c4c5d7]/20 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Secção 1: Identificação Operacional */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#eff4ff] rounded-xl flex items-center justify-center text-[#0d3fd1]">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0f1c2c] uppercase tracking-widest">Identificação</h3>
                </div>
                <p className="text-xs text-[#747686] font-medium leading-relaxed uppercase opacity-60">Dados core da subestação no sistema operativo.</p>
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Nome da Subestação</label>
                  <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: SE Viana I" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Código Operacional</label>
                  <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] font-mono" value={formData.codigo_operacional} onChange={(e) => setFormData({ ...formData, codigo_operacional: e.target.value })} placeholder="Ex: SE-VIA1" required disabled={isEdit} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Município</label>
                  <input type="text" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c]" value={formData.municipio} onChange={(e) => setFormData({ ...formData, municipio: e.target.value })} placeholder="Ex: Viana" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tipo de Subestação</label>
                  <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] cursor-pointer" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                    <option value="Distribuição">Distribuição</option>
                    <option value="Transporte">Transporte</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-[#c4c5d7]/10" />

            {/* Secção 2: Especificações Técnicas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#eff4ff] rounded-xl flex items-center justify-center text-[#0d3fd1]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0f1c2c] uppercase tracking-widest">Características Técnicas</h3>
                </div>
                <p className="text-xs text-[#747686] font-medium leading-relaxed uppercase opacity-60">Parâmetros elétricos e capacidade nominal.</p>
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão Entrada (kV)</label>
                  <div className="relative">
                    <input type="number" step="0.1" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none" value={formData.tensao_kv_entrada} onChange={(e) => setFormData({ ...formData, tensao_kv_entrada: e.target.value })} placeholder="60" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#0d3fd1]/40 uppercase tracking-widest">kV</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Tensão Saída (kV)</label>
                  <div className="relative">
                    <input type="number" step="0.1" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none" value={formData.tensao_kv_saida} onChange={(e) => setFormData({ ...formData, tensao_kv_saida: e.target.value })} placeholder="15" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#0d3fd1]/40 uppercase tracking-widest">kV</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Capacidade (MVA)</label>
                  <div className="relative">
                    <input type="number" step="0.1" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none" value={formData.capacidade_total_mva} onChange={(e) => setFormData({ ...formData, capacidade_total_mva: e.target.value })} placeholder="40" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#0d3fd1]/40 uppercase tracking-widest">MVA</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Data de Instalação</label>
                  <div className="relative">
                    <input type="date" className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none" value={formData.data_instalacao} onChange={(e) => setFormData({ ...formData, data_instalacao: e.target.value })} />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d3fd1]/20 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Status Operacional</label>
                  <select className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0f1c2c] cursor-pointer" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Ativa">Ativa</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Desativada">Desativada</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-[#c4c5d7]/10" />

            {/* Secção 3: Localização e Mapa */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#eff4ff] rounded-xl flex items-center justify-center text-[#0d3fd1]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0f1c2c] uppercase tracking-widest">Localização GPS</h3>
                </div>
                <p className="text-xs text-[#747686] font-medium leading-relaxed uppercase opacity-60">Geolocalização precisa da infraestrutura.</p>
                
                <div className="mt-8 space-y-4">
                  <button 
                    type="button" 
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[#0d3fd1] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/10"
                  >
                    <MapPin className="w-4 h-4 text-[#5fff9b]" />
                    {isLocating ? 'Obtendo GPS...' : 'Usar Localização Atual'}
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#747686] uppercase tracking-widest ml-1">Coordenadas (Lat, Lng)</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#f8faff] border border-[#c4c5d7]/30 rounded-xl py-4 px-6 text-sm font-bold text-[#0d3fd1] font-mono focus:ring-2 focus:ring-[#0d3fd1]/10 outline-none transition-all" 
                        value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''} 
                        placeholder="Ex: -8.8383, 13.2344"
                        onChange={(e) => {
                          const val = e.target.value;
                          const parts = val.split(',').map(p => p.trim());
                          if (parts.length === 2) {
                            setFormData(prev => ({ ...prev, latitude: parts[0], longitude: parts[1] }));
                          } else if (val === '') {
                            setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
                          }
                        }}
                      />
                      <p className="text-[8px] font-bold text-[#747686] ml-1 opacity-50 uppercase mt-1">Pode colar diretamente do Google Maps</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="w-full h-80 rounded-[2rem] overflow-hidden border-4 border-[#f8faff] shadow-2xl relative z-0 group">
                   <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#c4c5d7]/20 shadow-sm pointer-events-none group-hover:opacity-0 transition-opacity">
                     <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-widest">Arraste o pino para refinar</p>
                   </div>
                   <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                      <ChangeView center={mapCenter} zoom={mapZoom} />
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                      <DraggableMarker position={markerPos} setPosition={(pos) => setFormData({...formData, latitude: pos.lat.toFixed(6), longitude: pos.lng.toFixed(6)})} />
                   </MapContainer>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
