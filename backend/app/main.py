import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Ensure both backend root and current directory are on sys.path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
root_dir = backend_dir.parent

for p in [str(backend_dir), str(current_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Flexible imports supporting all execution methods (uvicorn, direct python, module)
try:
    from app.models import (
        Ambulance, Hospital, CrashAlertRequest, SOSDispatchRequest
    )
    from app.data import (
        MOCK_AMBULANCES, MOCK_HOSPITALS, ROAD_POLYLINE_TO_SCENE, 
        ROAD_POLYLINE_TO_HOSPITAL, ALTERNATIVE_ROUTES
    )
except ImportError:
    try:
        from models import (
            Ambulance, Hospital, CrashAlertRequest, SOSDispatchRequest
        )
        from data import (
            MOCK_AMBULANCES, MOCK_HOSPITALS, ROAD_POLYLINE_TO_SCENE, 
            ROAD_POLYLINE_TO_HOSPITAL, ALTERNATIVE_ROUTES
        )
    except ImportError:
        from backend.app.models import (
            Ambulance, Hospital, CrashAlertRequest, SOSDispatchRequest
        )
        from backend.app.data import (
            MOCK_AMBULANCES, MOCK_HOSPITALS, ROAD_POLYLINE_TO_SCENE, 
            ROAD_POLYLINE_TO_HOSPITAL, ALTERNATIVE_ROUTES
        )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Thefirstresponse360")

app = FastAPI(
    title="Thefirstresponse360 / Golden Hour API",
    description="Emergency Response & Rapid Ambulance Coordination Platform Backend",
    version="1.0.0"
)

# CORS Middleware configured to allow all origins for multi-device testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager for multi-client real-time synchronization
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting event: {message.get('type')}")
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(connection)
        for dead_conn in disconnected:
            if dead_conn in self.active_connections:
                self.active_connections.remove(dead_conn)

manager = ConnectionManager()

# Global in-memory state for demo coordination
platform_state = {
    "sos_active": False,
    "current_mission_stage": "IDLE", # IDLE, EN_ROUTE_SCENE, AT_SCENE, EN_ROUTE_HOSPITAL, COMPLETED
    "dispatched_ambulance_id": "TN-1001",
    "selected_hospital_id": "HOSP-01",
    "ambulANCES": list(MOCK_AMBULANCES),
    "ambulances": list(MOCK_AMBULANCES),
    "hospitals": list(MOCK_HOSPITALS),
    "user_location": {"lat": 13.05060, "lon": 80.21140},
    "last_alert": None
}

@app.get("/")
def health_check():
    """Health check and platform status."""
    return {
        "status": "online",
        "platform": "Thefirstresponse360 / Golden Hour",
        "version": "1.0.0",
        "location": "Vadapalani, Chennai (Tamil Nadu)",
        "active_clients": len(manager.active_connections),
        "sos_active": platform_state["sos_active"],
        "mission_stage": platform_state["current_mission_stage"]
    }

@app.get("/api/ambulances/nearby", response_model=List[Ambulance])
def get_nearby_ambulances(
    lat: float = Query(13.05060, description="Citizen Latitude"),
    lon: float = Query(80.21140, description="Citizen Longitude")
):
    """Returns nearby mock ambulance telemetry, distances, driver details, and availability."""
    return platform_state["ambulances"]

@app.get("/api/hospitals/nearby", response_model=List[Hospital])
def get_nearby_hospitals(
    lat: float = Query(13.05060, description="Citizen Latitude"),
    lon: float = Query(80.21140, description="Citizen Longitude")
):
    """Returns hospitals, available emergency beds, and contacts."""
    return platform_state["hospitals"]

@app.get("/api/routes")
def get_routes():
    """Returns routing data for both citizen simulation and driver navigation."""
    return {
        "to_scene": ROAD_POLYLINE_TO_SCENE,
        "to_hospital": ROAD_POLYLINE_TO_HOSPITAL,
        "alternatives": ALTERNATIVE_ROUTES
    }

@app.post("/api/dispatch/sos")
async def trigger_sos(request: SOSDispatchRequest):
    """Trigger SOS dispatch and alert all connected sessions."""
    platform_state["sos_active"] = True
    platform_state["current_mission_stage"] = "EN_ROUTE_SCENE"
    
    # Mark TN-1001 as DISPATCHED
    for amb in platform_state["ambulances"]:
        if amb["id"] == "TN-1001":
            amb["status"] = "DISPATCHED"

    event = {
        "type": "SOS_BROADCAST",
        "timestamp": datetime.utcnow().isoformat(),
        "payload": {
            "user_location": {"lat": request.user_lat, "lon": request.user_lon},
            "ambulance_id": "TN-1001",
            "mission_stage": "EN_ROUTE_SCENE",
            "status": "DISPATCHED",
            "message": "Emergency SOS triggered! Ambulance #TN-1001 dispatched to location."
        }
    }
    await manager.broadcast(event)
    return {"success": True, "event": event}

@app.post("/api/dispatch/reset")
async def reset_dispatch():
    """Reset platform demo state back to IDLE."""
    platform_state["sos_active"] = False
    platform_state["current_mission_stage"] = "IDLE"
    for amb in platform_state["ambulances"]:
        if amb["id"] == "TN-1001":
            amb["status"] = "AVAILABLE"
            amb["lat"] = 13.05850
            amb["lon"] = 80.20500

    event = {
        "type": "STATE_RESET",
        "timestamp": datetime.utcnow().isoformat(),
        "payload": {
            "mission_stage": "IDLE",
            "sos_active": False
        }
    }
    await manager.broadcast(event)
    return {"success": True, "message": "Platform state reset successfully"}

@app.post("/api/driver/update-mission")
async def update_driver_mission(stage: str = Query(..., description="Target mission stage")):
    """Update mission progression state machine."""
    valid_stages = ["IDLE", "EN_ROUTE_SCENE", "AT_SCENE", "EN_ROUTE_HOSPITAL", "COMPLETED"]
    if stage not in valid_stages:
        raise HTTPException(status_code=400, detail="Invalid mission stage")

    platform_state["current_mission_stage"] = stage
    
    # Update ambulance status
    for amb in platform_state["ambulances"]:
        if amb["id"] == "TN-1001":
            if stage == "IDLE":
                amb["status"] = "AVAILABLE"
            elif stage in ["EN_ROUTE_SCENE", "AT_SCENE"]:
                amb["status"] = "DISPATCHED"
            elif stage == "EN_ROUTE_HOSPITAL":
                amb["status"] = "OCCUPIED"
            elif stage == "COMPLETED":
                amb["status"] = "AVAILABLE"

    event = {
        "type": "MISSION_STAGE_UPDATE",
        "timestamp": datetime.utcnow().isoformat(),
        "payload": {
            "mission_stage": stage,
            "ambulance_id": "TN-1001"
        }
    }
    await manager.broadcast(event)
    return {"success": True, "stage": stage}

@app.post("/api/alerts/crash")
async def receive_crash_alert(alert: CrashAlertRequest):
    """
    IoT / ESP32 Hardware Crash Detection Endpoint.
    Receives automatic crash telemetry and broadcasts to all clients.
    """
    logger.critical(f"AUTOMATIC CRASH SENSOR TRIGGERED: {alert}")
    platform_state["last_alert"] = alert.model_dump()
    platform_state["sos_active"] = True
    platform_state["current_mission_stage"] = "EN_ROUTE_SCENE"

    event = {
        "type": "HARDWARE_CRASH_ALERT",
        "timestamp": datetime.utcnow().isoformat(),
        "payload": {
            "lat": alert.lat,
            "lon": alert.lon,
            "severity": alert.severity,
            "status": alert.status,
            "device_id": alert.device_id,
            "message": "Automated impact crash sensor triggered! Emergency dispatch broadcasted."
        }
    }
    await manager.broadcast(event)
    return {
        "status": "ALERT_PROCESSED",
        "dispatched": True,
        "payload": alert
    }

@app.websocket("/ws/dispatch")
async def websocket_dispatch_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint supporting concurrent clients (user, driver, hospital).
    Broadcasts dispatch status updates and emergency triggers instantly across all connected sessions.
    """
    await manager.connect(websocket)
    # Send current platform state immediately upon connecting
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "timestamp": datetime.utcnow().isoformat(),
        "payload": {
            "sos_active": platform_state["sos_active"],
            "current_mission_stage": platform_state["current_mission_stage"],
            "user_location": platform_state["user_location"],
            "ambulances": platform_state["ambulances"]
        }
    })
    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed_data = json.loads(data)
                logger.info(f"Received WS message: {parsed_data}")
                
                # Check for actions from client
                action = parsed_data.get("action")
                if action == "TRIGGER_SOS":
                    platform_state["sos_active"] = True
                    platform_state["current_mission_stage"] = "EN_ROUTE_SCENE"
                    for amb in platform_state["ambulances"]:
                        if amb["id"] == "TN-1001":
                            amb["status"] = "DISPATCHED"
                    await manager.broadcast({
                        "type": "SOS_BROADCAST",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": parsed_data.get("payload", {})
                    })
                elif action == "UPDATE_MISSION_STAGE":
                    new_stage = parsed_data.get("stage", "IDLE")
                    platform_state["current_mission_stage"] = new_stage
                    await manager.broadcast({
                        "type": "MISSION_STAGE_UPDATE",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": {"mission_stage": new_stage}
                    })
                elif action == "AMBULANCE_STEP":
                    # Broadcast dynamic location update
                    await manager.broadcast({
                        "type": "AMBULANCE_LOCATION_STEP",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": parsed_data.get("payload", {})
                    })
                elif action == "RESET":
                    platform_state["sos_active"] = False
                    platform_state["current_mission_stage"] = "IDLE"
                    for amb in platform_state["ambulances"]:
                        if amb["id"] == "TN-1001":
                            amb["status"] = "AVAILABLE"
                            amb["lat"] = 13.05850
                            amb["lon"] = 80.20500
                    await manager.broadcast({
                        "type": "STATE_RESET",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": {"mission_stage": "IDLE", "sos_active": False}
                    })
                else:
                    await manager.broadcast({
                        "type": "GENERIC_BROADCAST",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": parsed_data
                    })
            except json.JSONDecodeError:
                await websocket.send_text("Invalid JSON payload")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
