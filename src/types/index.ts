export type AmbulanceStatus = 'AVAILABLE' | 'DISPATCHED' | 'OCCUPIED' | 'EN_ROUTE_SCENE' | 'AT_SCENE' | 'EN_ROUTE_HOSPITAL';

export interface Ambulance {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  type: string;
  lat: number;
  lon: number;
  status: AmbulanceStatus;
  etaMinutes: number;
  distanceKm: number;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  availableBeds: number;
  totalBeds: number;
  lat: number;
  lon: number;
  distanceKm: number;
  phone: string;
  address: string;
}

export type MissionStage = 'IDLE' | 'EN_ROUTE_SCENE' | 'AT_SCENE' | 'EN_ROUTE_HOSPITAL' | 'COMPLETED';

export type RouteKey = 'fast' | 'easy' | 'traffic';

export interface RouteOption {
  id: RouteKey;
  name: string;
  eta: string;
  distance: string;
  color: string;
  dashArray?: string;
  path: [number, number][];
}
