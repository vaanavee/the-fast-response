import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle, Phone, Clock, MapPin, Building2,
  Ambulance as AmbulanceIcon, RotateCcw,
  Sparkles, Radio
} from 'lucide-react';
import { Ambulance, Hospital } from '../types';
import {
  INITIAL_AMBULANCES, INITIAL_HOSPITALS, USER_LOCATION,
  MAP_CENTER, ROAD_POLYLINE_TO_SCENE
} from '../data/mockData';
import { sendSOSAlert, resetDispatch } from '../services/api';

// Custom Marker DivIcons
const userIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin marker-blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18]
});

const getAmbulanceIcon = (status: string) => {
  const colorClass = status === 'DISPATCHED' ? 'marker-blue' : status === 'OCCUPIED' ? 'marker-orange' : 'marker-red';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin ${colorClass}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin marker-green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12"/><path d="M6 12h12"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18]
});

export const UserPortal: React.FC = () => {
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [hospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [liveEta, setLiveEta] = useState<number>(4);
  const simulationIntervalRef = useRef<any>(null);

  // Handle SOS Alert trigger
  const handleTriggerSOS = async () => {
    if (sosActive) return;
    setSosActive(true);
    setSimulationIndex(0);
    setLiveEta(4);

    // Update TN-1001 status to DISPATCHED
    setAmbulances(prev => prev.map(amb =>
      amb.id === 'TN-1001' ? { ...amb, status: 'DISPATCHED' } : amb
    ));

    await sendSOSAlert(USER_LOCATION[0], USER_LOCATION[1]);
  };

  // Simulation loop: progress ambulance along road polyline every 2 seconds
  useEffect(() => {
    if (sosActive) {
      simulationIntervalRef.current = setInterval(() => {
        setSimulationIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex < ROAD_POLYLINE_TO_SCENE.length) {
            const nextCoord = ROAD_POLYLINE_TO_SCENE[nextIndex];
            setAmbulances(current => current.map(amb => {
              if (amb.id === 'TN-1001') {
                return {
                  ...amb,
                  lat: nextCoord[0],
                  lon: nextCoord[1],
                  etaMinutes: Math.max(1, Math.round(4 * (1 - nextIndex / ROAD_POLYLINE_TO_SCENE.length)))
                };
              }
              return amb;
            }));
            setLiveEta(Math.max(1, Math.round(4 * (1 - nextIndex / ROAD_POLYLINE_TO_SCENE.length))));
            return nextIndex;
          } else {
            // Reached accident scene
            clearInterval(simulationIntervalRef.current);
            setLiveEta(0);
            return prev;
          }
        });
      }, 2000);
    } else {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    }

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [sosActive]);

  const handleReset = async () => {
    setSosActive(false);
    setSimulationIndex(0);
    setLiveEta(4);
    setAmbulances(INITIAL_AMBULANCES);
    await resetDispatch();
  };

  const dispatchedAmbulance = ambulances.find(a => a.id === 'TN-1001');

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full min-h-[calc(100vh-5rem)]">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-[440px] flex flex-col gap-4 shrink-0">
        {/* Header */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Thefirstresponse360</h1>
            <p className="text-xs text-teal-400 font-medium">Tamil Nadu Emergency Portal</p>
          </div>
          <a
            href="tel:108"
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>DIAL 108</span>
          </a>
        </div>

        {/* SOS Action Card */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700/80 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sosActive ? 'bg-red-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${sosActive ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                {sosActive ? 'Emergency Live Broadcast' : 'System Standby — One-Touch SOS'}
              </span>
            </div>
            {sosActive && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 hover:underline"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <button
            onClick={handleTriggerSOS}
            disabled={sosActive}
            className={`w-full py-5 px-6 rounded-2xl font-black text-lg tracking-wider uppercase transition-all duration-300 shadow-2xl flex flex-col items-center justify-center space-y-1 relative group ${
              sosActive
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white cursor-default ring-4 ring-red-500/40 animate-pulse'
                : 'bg-gradient-to-r from-red-500 hover:from-red-600 to-rose-600 hover:to-rose-700 text-white shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`w-7 h-7 ${sosActive ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
              <span className="text-xl font-extrabold">
                {sosActive ? 'SOS BROADCASTED' : 'SOS ALERT'}
              </span>
            </div>
            <span className="text-[11px] font-medium tracking-normal text-red-100/90">
              {sosActive
                ? `Dispatched: Lat 13.05060, Lon 80.21140 (ETA: ${liveEta === 0 ? 'ARRIVED AT SCENE' : `${liveEta} mins`})`
                : 'Press to immediately dispatch closest emergency unit & broadcast coordinates'}
            </span>
          </button>

          {sosActive && (
            <div className="mt-3.5 p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Telemetry: <strong>#TN-1001 dispatched</strong></span>
              </div>
              <span className="font-mono bg-red-900/60 px-2 py-0.5 rounded text-[11px] border border-red-400/20">
                {simulationIndex >= ROAD_POLYLINE_TO_SCENE.length - 1 ? 'UNIT ON SCENE' : `APPROACHING (${liveEta} MIN)`}
              </span>
            </div>
          )}
        </div>

        {/* Live Nearby Units List */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AmbulanceIcon className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Live Nearby Units</h2>
            </div>
            <span className="text-xs bg-slate-700/80 text-teal-300 px-2 py-0.5 rounded-full font-mono">
              {ambulances.length} Active
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {ambulances.map(amb => (
              <div
                key={amb.id}
                className="p-3 bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 rounded-xl flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{amb.id}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        amb.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : amb.status === 'DISPATCHED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {amb.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{amb.driverName} • {amb.type}</p>
                  <p className="text-[11px] text-slate-500">{amb.plateNumber}</p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-1 text-teal-400 text-xs font-mono font-bold">
                    <Clock className="w-3 h-3" />
                    <span>{amb.id === 'TN-1001' && sosActive ? `${liveEta} min` : `${amb.etaMinutes} min`}</span>
                  </div>
                  <a
                    href={`tel:${amb.driverPhone.replace(/\s+/g, '')}`}
                    className="flex items-center space-x-1 text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-600 transition-colors"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Hospitals Section */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Target Facilities & Capacity</h2>
            </div>
            <span className="text-[11px] text-slate-400">Emergency Beds</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {hospitals.map(hosp => (
              <div
                key={hosp.id}
                className="p-3 bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 rounded-xl flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-xs text-slate-100">{hosp.name}</h3>
                  <p className="text-[11px] text-slate-400">{hosp.type} • {hosp.distanceKm} km</p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      {hosp.availableBeds} Emergency Beds available
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${hosp.phone}`}
                  className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map (Leaflet) */}
      <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-xl overflow-hidden min-h-[500px] lg:min-h-full flex flex-col relative">
        {/* Map Top Bar */}
        <div className="bg-slate-850/95 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Scenario: <strong>Vadapalani, Chennai (Arcot Rd / 100 Ft Rd)</strong></span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Scene</span>
            </span>
            <span className="flex items-center space-x-1 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Ambulance</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Hospital</span>
            </span>
          </div>
        </div>

        {/* Leaflet Map Container */}
        <div className="w-full flex-1 relative min-h-[480px]">
          <MapContainer
            center={MAP_CENTER}
            zoom={15}
            scrollWheelZoom={true}
            className="w-full h-full dark-tiles"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User / Accident Scene Marker */}
            <Marker position={USER_LOCATION} icon={userIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs text-blue-400">Accident Scene / Citizen SOS</p>
                  <p className="text-[11px] text-slate-300">Lat: 13.05060, Lon: 80.21140</p>
                  <p className="text-[11px] text-slate-400">Vadapalani Metro / Arcot Road</p>
                </div>
              </Popup>
            </Marker>

            {/* Ambulances */}
            {ambulances.map(amb => (
              <Marker
                key={amb.id}
                position={[amb.lat, amb.lon]}
                icon={getAmbulanceIcon(amb.status)}
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-xs text-red-400">{amb.id} ({amb.plateNumber})</p>
                    <p className="text-[11px] text-slate-200">Driver: {amb.driverName}</p>
                    <p className="text-[11px] text-slate-300">Status: <strong className="text-teal-300">{amb.status}</strong></p>
                    <p className="text-[11px] text-slate-400">ETA: {amb.id === 'TN-1001' && sosActive ? `${liveEta} mins` : `${amb.etaMinutes} mins`}</p>
                    <a href={`tel:${amb.driverPhone.replace(/\s+/g, '')}`} className="text-xs text-blue-400 underline mt-1 block">
                      Call {amb.driverPhone}
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Hospitals */}
            {hospitals.map(hosp => (
              <Marker
                key={hosp.id}
                position={[hosp.lat, hosp.lon]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-xs text-emerald-400">{hosp.name}</p>
                    <p className="text-[11px] text-slate-300">{hosp.type}</p>
                    <p className="text-[11px] text-emerald-300 font-semibold">{hosp.availableBeds} Emergency Beds Available</p>
                    <p className="text-[11px] text-slate-400">Distance: {hosp.distanceKm} km</p>
                    <a href={`tel:${hosp.phone}`} className="text-xs text-blue-400 underline mt-1 block">
                      Emergency Desk: {hosp.phone}
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Animated Road Polyline to Scene when SOS is active */}
            {sosActive && (
              <Polyline
                positions={ROAD_POLYLINE_TO_SCENE}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 5,
                  opacity: 0.85
                }}
              />
            )}
          </MapContainer>

          {/* Floating Live Dispatch Status Overlay */}
          {sosActive && dispatchedAmbulance && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-blue-500/50 p-4 rounded-xl shadow-2xl z-[1000] flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wider">Active Telemetry Step</h4>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    ETA: {liveEta === 0 ? 'ARRIVED' : `${liveEta} MIN`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Unit <strong>#TN-1001 ({dispatchedAmbulance.driverName})</strong> en route via Jawaharlal Nehru Rd to scene.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
