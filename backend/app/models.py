from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Pydantic Schemas

class Coordinate(BaseModel):
    lat: float
    lon: float

class Ambulance(BaseModel):
    id: str
    plateNumber: str
    driverName: str
    driverPhone: str
    type: str  # ALS, BLS, Critical Care
    lat: float
    lon: float
    status: str  # AVAILABLE, DISPATCHED, OCCUPIED, EN_ROUTE_SCENE, AT_SCENE, EN_ROUTE_HOSPITAL
    etaMinutes: int
    distanceKm: float

class Hospital(BaseModel):
    id: str
    name: str
    type: str  # Private, Govt
    availableBeds: int
    totalBeds: int
    lat: float
    lon: float
    distanceKm: float
    phone: str
    address: str

class CrashAlertRequest(BaseModel):
    lat: float
    lon: float
    severity: str = "HIGH"
    status: str = "PENDING_OFFLINE_ALERT"
    device_id: Optional[str] = "ESP32-CRASH-01"

class SOSDispatchRequest(BaseModel):
    user_lat: float
    user_lon: float
    emergency_type: str = "ROAD_ACCIDENT"
    contact_number: Optional[str] = "108"
    notes: Optional[str] = "Critical immediate emergency"

class DispatchEvent(BaseModel):
    event_type: str  # SOS_ALERT, AMBULANCE_UPDATE, MISSION_STAGE_CHANGE, CRASH_ALERT
    timestamp: str
    payload: dict
