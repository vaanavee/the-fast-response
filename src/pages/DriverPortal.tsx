import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation, Phone, ShieldCheck, HeartPulse, Building2,
  Clock, CheckCircle, RotateCcw, AlertOctagon, ArrowRight
} from 'lucide-react';
import { MissionStage, RouteKey } from '../types';
import {
  USER_LOCATION, MAP_CENTER, DRIVER_ROUTE_OPTIONS,
  ROAD_POLYLINE_TO_HOSPITAL, INITIAL_HOSPITALS
} from '../data/mockData';
import { updateMissionStage } from '../services/api';

// DivIcons for Driver View
const ambulanceIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin marker-blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

const sceneIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin marker-red"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18]
});

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin marker-green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12"/><path d="M6 12h12"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18]
});

export const DriverPortal: React.FC = () => {
  const [missionStage, setMissionStage] = useState<MissionStage>('IDLE');
  const [selectedRoute, setSelectedRoute] = useState<RouteKey>('fast');
  const [currentCoord, setCurrentCoord] = useState<[number, number]>(DRIVER_ROUTE_OPTIONS.fast.path[0]);
  const [pathStep, setPathStep] = useState<number>(0);
  const stepIntervalRef = useRef<any>(null);

  const targetHospital = INITIAL_HOSPITALS[0]; // SIMS Hospital Vadapalani
  const activeRouteData = DRIVER_ROUTE_OPTIONS[selectedRoute];

  // Handle Progression Action Button Click
  const handleStageAction = async () => {
    if (missionStage === 'IDLE') {
      setMissionStage('EN_ROUTE_SCENE');
      setPathStep(0);
      setCurrentCoord(activeRouteData.path[0]);
      await updateMissionStage('EN_ROUTE_SCENE');
    } else if (missionStage === 'AT_SCENE') {
      setMissionStage('EN_ROUTE_HOSPITAL');
      setPathStep(0);
      setCurrentCoord(ROAD_POLYLINE_TO_HOSPITAL[0]);
      await updateMissionStage('EN_ROUTE_HOSPITAL');
    }
  };

  const handleResetMission = async () => {
    setMissionStage('IDLE');
    setPathStep(0);
    setCurrentCoord(DRIVER_ROUTE_OPTIONS.fast.path[0]);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    await updateMissionStage('IDLE');
  };

  // Progression logic during EN_ROUTE_SCENE
  useEffect(() => {
    if (missionStage === 'EN_ROUTE_SCENE') {
      const activePath = activeRouteData.path;
      stepIntervalRef.current = setInterval(() => {
        setPathStep(prev => {
          const next = prev + 1;
          if (next < activePath.length) {
            setCurrentCoord(activePath[next]);
            return next;
          } else {
            // Reached Accident Scene
            clearInterval(stepIntervalRef.current);
            setCurrentCoord(USER_LOCATION);
            setMissionStage('AT_SCENE');
            updateMissionStage('AT_SCENE');
            return prev;
          }
        });
      }, 2000);
    } else if (missionStage === 'EN_ROUTE_HOSPITAL') {
      const hospitalPath = ROAD_POLYLINE_TO_HOSPITAL;
      stepIntervalRef.current = setInterval(() => {
        setPathStep(prev => {
          const next = prev + 1;
          if (next < hospitalPath.length) {
            setCurrentCoord(hospitalPath[next]);
            return next;
          } else {
            // Reached Hospital
            clearInterval(stepIntervalRef.current);
            setCurrentCoord([targetHospital.lat, targetHospital.lon]);
            setMissionStage('COMPLETED');
            updateMissionStage('COMPLETED');
            return prev;
          }
        });
      }, 2000);
    } else {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    }

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [missionStage, selectedRoute]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full min-h-[calc(100vh-5rem)]">
      {/* Mission Control Sidebar */}
      <div className="w-full lg:w-[440px] flex flex-col gap-4 shrink-0">
        {/* Header */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Ambulance Dispatch Portal</h1>
            <p className="text-xs text-emerald-400 font-medium">Mission Telemetry & Navigation Engine</p>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono font-bold">
            Driver ID: TN-1001 (Ramesh K.)
          </div>
        </div>

        {/* Mission Progression Action Button */}
        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-teal-400" />
              <span>Mission State Machine</span>
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300">
              {missionStage}
            </span>
          </div>

          {missionStage === 'IDLE' && (
            <button
              onClick={handleStageAction}
              className="w-full py-4 px-6 rounded-xl font-black text-sm tracking-wide uppercase transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>ACCEPT & START ROUTE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {missionStage === 'EN_ROUTE_SCENE' && (
            <div className="w-full py-4 px-6 rounded-xl font-black text-sm tracking-wide uppercase bg-blue-600/90 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 animate-pulse border border-blue-400/50">
              <Clock className="w-4 h-4 animate-spin" />
              <span>DRIVING TO SCENE... (STEP {pathStep + 1}/{activeRouteData.path.length})</span>
            </div>
          )}

          {missionStage === 'AT_SCENE' && (
            <button
              onClick={handleStageAction}
              className="w-full py-4 px-6 rounded-xl font-black text-sm tracking-wide uppercase transition-all duration-200 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 animate-bounce"
            >
              <HeartPulse className="w-4 h-4" />
              <span>PATIENT STABILIZED — START TRANSPORT</span>
            </button>
          )}

          {missionStage === 'EN_ROUTE_HOSPITAL' && (
            <div className="w-full py-4 px-6 rounded-xl font-black text-sm tracking-wide uppercase bg-purple-600/90 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 animate-pulse border border-purple-400/50">
              <Building2 className="w-4 h-4" />
              <span>DRIVING TO HOSPITAL... (APPROACHING ER)</span>
            </div>
          )}

          {missionStage === 'COMPLETED' && (
            <div className="space-y-3">
              <div className="w-full py-4 px-6 rounded-xl font-black text-sm tracking-wide uppercase bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>MISSION COMPLETED</span>
              </div>
              <button
                onClick={handleResetMission}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-700/60 hover:bg-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset for Next Emergency Call</span>
              </button>
            </div>
          )}
        </div>

        {/* Driver & Vehicle Details Card */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Driver & Vehicle Details</h2>
          </div>
          <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Designated Driver</span>
              <span className="font-bold text-slate-200">Ramesh K. (Badge #4829)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Driver Contact</span>
              <a href="tel:+919840123456" className="text-teal-400 font-mono hover:underline flex items-center space-x-1">
                <Phone className="w-3 h-3" />
                <span>+91 98401 23456</span>
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Vehicle Registration</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                TN-09-EM-1001
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Unit Capability</span>
              <span className="text-emerald-400 font-semibold">ALS (Advanced Life Support)</span>
            </div>
          </div>
        </div>

        {/* Target Hospital Card */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2 mb-3">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Target Receiving Hospital</h2>
          </div>
          <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Facility</span>
              <span className="font-bold text-slate-100">{targetHospital.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Trauma Bed Status</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {targetHospital.availableBeds} Emergency Beds available
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Emergency Desk</span>
              <a
                href={`tel:${targetHospital.phone}`}
                className="text-blue-400 font-mono font-bold hover:underline flex items-center space-x-1"
              >
                <Phone className="w-3 h-3" />
                <span>{targetHospital.phone}</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 border-t border-slate-800 pt-1.5">
              {targetHospital.address}
            </p>
          </div>
        </div>

        {/* Route Decision Engine Card */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl shadow-xl flex-1 flex flex-col">
          <div className="flex items-center space-x-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Route Decision Engine</h2>
          </div>

          <div className="space-y-2">
            {(Object.keys(DRIVER_ROUTE_OPTIONS) as RouteKey[]).map(key => {
              const route = DRIVER_ROUTE_OPTIONS[key];
              const isSelected = selectedRoute === key;
              return (
                <button
                  key={key}
                  disabled={missionStage !== 'IDLE'}
                  onClick={() => setSelectedRoute(key)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-750 border-teal-400/80 shadow-lg'
                      : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-600 opacity-80'
                  } ${missionStage !== 'IDLE' ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: route.color }}
                    ></span>
                    <div>
                      <p className="font-bold text-xs text-slate-200">{route.name}</p>
                      <p className="text-[11px] text-slate-400">{route.distance}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{ color: route.color, backgroundColor: `${route.color}15` }}
                    >
                      {route.eta}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Driver Map */}
      <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-xl overflow-hidden min-h-[500px] lg:min-h-full flex flex-col relative">
        {/* Map Header */}
        <div className="bg-slate-850/95 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Driver HUD: <strong>Unit #TN-1001 • Vadapalani Sector</strong></span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono">
              Coord: {currentCoord[0].toFixed(4)}, {currentCoord[1].toFixed(4)}
            </span>
          </div>
        </div>

        {/* Leaflet Map */}
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

            {/* Current Moving Ambulance */}
            <Marker position={currentCoord} icon={ambulanceIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs text-blue-400">Unit TN-1001 (Your Vehicle)</p>
                  <p className="text-[11px] text-slate-300">Stage: {missionStage}</p>
                  <p className="text-[11px] text-slate-400">Speed: 48 km/h • Siren Active</p>
                </div>
              </Popup>
            </Marker>

            {/* Accident Scene Marker */}
            <Marker position={USER_LOCATION} icon={sceneIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs text-red-400">Emergency Accident Scene</p>
                  <p className="text-[11px] text-slate-300">Vadapalani Arcot Road</p>
                </div>
              </Popup>
            </Marker>

            {/* Target Receiving Hospital Marker */}
            <Marker position={[targetHospital.lat, targetHospital.lon]} icon={hospitalIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-xs text-emerald-400">{targetHospital.name}</p>
                  <p className="text-[11px] text-slate-300">{targetHospital.availableBeds} Emergency Beds</p>
                </div>
              </Popup>
            </Marker>

            {/* Polylines for Driver View */}
            {missionStage !== 'EN_ROUTE_HOSPITAL' && missionStage !== 'COMPLETED' ? (
              // Display Decision Engine Routes while en route to scene
              <>
                <Polyline
                  positions={DRIVER_ROUTE_OPTIONS.fast.path}
                  pathOptions={{
                    color: DRIVER_ROUTE_OPTIONS.fast.color,
                    weight: selectedRoute === 'fast' ? 6 : 3,
                    opacity: selectedRoute === 'fast' ? 0.95 : 0.4
                  }}
                />
                <Polyline
                  positions={DRIVER_ROUTE_OPTIONS.easy.path}
                  pathOptions={{
                    color: DRIVER_ROUTE_OPTIONS.easy.color,
                    weight: selectedRoute === 'easy' ? 6 : 3,
                    opacity: selectedRoute === 'easy' ? 0.95 : 0.4,
                    dashArray: '6, 8'
                  }}
                />
                <Polyline
                  positions={DRIVER_ROUTE_OPTIONS.traffic.path}
                  pathOptions={{
                    color: DRIVER_ROUTE_OPTIONS.traffic.color,
                    weight: selectedRoute === 'traffic' ? 6 : 3,
                    opacity: selectedRoute === 'traffic' ? 0.95 : 0.35,
                    dashArray: '4, 6'
                  }}
                />
              </>
            ) : (
              // Display Hospital Route Polyline while transporting patient
              <Polyline
                positions={ROAD_POLYLINE_TO_HOSPITAL}
                pathOptions={{
                  color: '#10b981',
                  weight: 6,
                  opacity: 0.95
                }}
              />
            )}
          </MapContainer>

          {/* HUD Status Overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-xl z-[1000] text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-slate-200">Active Route: {activeRouteData.name}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {missionStage === 'EN_ROUTE_SCENE' && `Navigating to Accident Scene • Est. ${activeRouteData.eta}`}
              {missionStage === 'AT_SCENE' && 'On Scene: Administering First Response Care'}
              {missionStage === 'EN_ROUTE_HOSPITAL' && `Navigating to ${targetHospital.name} ER Entrance`}
              {missionStage === 'COMPLETED' && 'Patient Handed Over to Emergency Desk'}
              {missionStage === 'IDLE' && 'Standing by for Dispatch Command'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
