import { Ambulance, Hospital, RouteOption } from '../types';

export const USER_LOCATION: [number, number] = [13.05060, 80.21140]; // Vadapalani Metro / Arcot Road
export const MAP_CENTER: [number, number] = [13.05150, 80.21000]; // Vadapalani Junction

export const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: 'TN-1001',
    plateNumber: 'TN-09-EM-1001',
    driverName: 'Ramesh K.',
    driverPhone: '+91 98401 23456',
    type: 'ALS (Advanced Life Support)',
    lat: 13.05850,
    lon: 80.20500,
    status: 'AVAILABLE',
    etaMinutes: 4,
    distanceKm: 1.2
  },
  {
    id: 'TN-1002',
    plateNumber: 'TN-01-EM-1002',
    driverName: 'Suresh V.',
    driverPhone: '+91 98402 34567',
    type: 'BLS (Basic Life Support)',
    lat: 13.04420,
    lon: 80.21850,
    status: 'AVAILABLE',
    etaMinutes: 7,
    distanceKm: 2.1
  },
  {
    id: 'TN-1003',
    plateNumber: 'TN-02-EM-1003',
    driverName: 'Karthik M.',
    driverPhone: '+91 98403 45678',
    type: 'Critical Care Unit',
    lat: 13.06100,
    lon: 80.22200,
    status: 'OCCUPIED',
    etaMinutes: 15,
    distanceKm: 3.8
  }
];

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP-01',
    name: 'SIMS Hospital (Vadapalani)',
    type: 'Private Super Specialty',
    availableBeds: 45,
    totalBeds: 345,
    lat: 13.05200,
    lon: 80.20900,
    distanceKm: 0.4,
    phone: '+914420002000',
    address: 'Metro No.1, Jawaharlal Nehru Salai, Vadapalani'
  },
  {
    id: 'HOSP-02',
    name: 'Vijaya Hospital',
    type: 'Private Multi Specialty',
    availableBeds: 28,
    totalBeds: 250,
    lat: 13.05350,
    lon: 80.21350,
    distanceKm: 0.6,
    phone: '+914466646664',
    address: '434, N.S.K. Salai, Vadapalani'
  },
  {
    id: 'HOSP-03',
    name: 'Sooriya Hospital',
    type: 'Private Trauma Care',
    availableBeds: 18,
    totalBeds: 120,
    lat: 13.04750,
    lon: 80.20300,
    distanceKm: 1.1,
    phone: '+914423745555',
    address: '1/1, Arunachalam Rd, Saligramam'
  },
  {
    id: 'HOSP-04',
    name: 'Govt. Royapettah Trauma Center',
    type: 'Government Trauma Center',
    availableBeds: 62,
    totalBeds: 500,
    lat: 13.05800,
    lon: 80.22200,
    distanceKm: 2.4,
    phone: '+914428481111',
    address: 'Westcott Rd, Royapettah'
  }
];

// Road polylines for simulation
export const ROAD_POLYLINE_TO_SCENE: [number, number][] = [
  [13.05850, 80.20500], // Start TN-1001
  [13.05680, 80.20620],
  [13.05490, 80.20780],
  [13.05320, 80.20910],
  [13.05150, 80.21000], // Vadapalani Junction
  [13.05060, 80.21140]  // Accident Scene
];

export const ROAD_POLYLINE_TO_HOSPITAL: [number, number][] = [
  [13.05060, 80.21140], // Accident Scene
  [13.05120, 80.21080],
  [13.05180, 80.20980],
  [13.05200, 80.20900]  // SIMS Hospital
];

export const DRIVER_ROUTE_OPTIONS: Record<string, RouteOption> = {
  fast: {
    id: 'fast',
    name: 'Fast Route (via Arcot Road)',
    eta: '4 mins',
    distance: '1.2 km',
    color: '#3b82f6',
    dashArray: undefined,
    path: ROAD_POLYLINE_TO_SCENE
  },
  easy: {
    id: 'easy',
    name: 'Easy Way / Alternative',
    eta: '6 mins',
    distance: '1.7 km',
    color: '#10b981',
    dashArray: '6, 8',
    path: [
      [13.05850, 80.20500],
      [13.05750, 80.20350],
      [13.05350, 80.20450],
      [13.05000, 80.20700],
      [13.05060, 80.21140]
    ]
  },
  traffic: {
    id: 'traffic',
    name: 'Heavy Traffic (Avoided)',
    eta: '12 mins',
    distance: '2.2 km',
    color: '#ef4444',
    dashArray: '4, 6',
    path: [
      [13.05850, 80.20500],
      [13.06000, 80.20900],
      [13.05600, 80.21400],
      [13.05250, 80.21300],
      [13.05060, 80.21140]
    ]
  }
};
