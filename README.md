# Thefirstresponse360 / Golden Hour

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald)](https://github.com/vaanavee/the-fast-response)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-blue)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20WebSockets-teal)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20%7C%20React--Leaflet-green)](https://leafletjs.com/)

An advanced emergency response and rapid ambulance coordination platform designed to minimize response times during critical medical and road accident emergencies ("The Golden Hour").

---

## 🚑 Key Features

### 1. Public / Citizen Emergency SOS Portal (`/`)
- **One-Touch Emergency SOS**: Large, pulsing action button broadcasting immediate emergency coordinates to the dispatch network.
- **High-Visibility Emergency Quick-Dial**: Direct click-to-dial `108` emergency ambulance hotline.
- **Live Nearby Units Telemetry**: Real-time cards displaying nearby units (ALS, BLS, Critical Care), registration plates, driver names, dynamic ETA countdown, and one-click direct driver calls.
- **Target Facilities & Capacity**: Displays nearby trauma hospitals (e.g., SIMS Hospital, Vijaya Hospital, Sooriya Hospital) with live emergency bed availability and direct hospital helpline integration.
- **Interactive Leaflet Dark-Mode Map**: Realistic scenario centered on Vadapalani, Chennai (`[13.0515, 80.2100]`) featuring radar-pulse circular markers and 2-second dynamic route progression.

### 2. Ambulance Driver Portal (`/driver`)
- **Unified Mission State Machine**:
  - `IDLE` ➔ `EN_ROUTE_SCENE` ➔ `AT_SCENE` ➔ `EN_ROUTE_HOSPITAL` ➔ `COMPLETED`
- **Route Decision Engine**: Real-time routing options with multi-polyline visualization:
  - **Fast Route**: Solid blue line (ETA: 4 mins)
  - **Easy Way / Alternative**: Dashed emerald line (ETA: 6 mins)
  - **Heavy Traffic (Avoided)**: Dashed red line (ETA: 12 mins)
- **Live Driver HUD & Target Hospital Integration**: Shows receiving hospital bed availability and contact desk with dynamic switching to hospital transport polylines.

### 3. Real-Time Backend & WebSocket Engine (FastAPI)
- **REST Endpoints**:
  - `GET /`: Health check and platform status.
  - `GET /api/ambulances/nearby?lat={lat}&lon={lon}`: Nearby ambulance telemetry and driver details.
  - `GET /api/hospitals/nearby?lat={lat}&lon={lon}`: Nearby trauma centers and available bed counts.
  - `POST /api/dispatch/sos`: Triggers emergency broadcast across all connected clients.
  - `POST /api/alerts/crash`: Ingestion endpoint for IoT hardware crash sensors.
- **WebSockets (`/ws/dispatch`)**: Multi-client connection manager synchronizing user, ambulance driver, and hospital consoles in real time.

### 4. IoT / ESP32 Hardware Crash Detection Module (`esp32/firmware.ino`)
- C++ firmware sketch for ESP32 microcontroller with Wi-Fi connectivity.
- Monitors digital crash/impact sensor on **Pin 4**.
- Triggers audible alarm pattern on buzzer **Pin 5**.
- Automatically posts emergency crash telemetry payload:
  ```json
  {
    "lat": 13.0506,
    "lon": 80.2114,
    "severity": "HIGH",
    "status": "PENDING_OFFLINE_ALERT"
  }
  ```

---

## 🛠️ Tech Stack & Directory Structure

```
the-fast-response/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI server with CORS & WebSockets
│   │   ├── models.py        # Pydantic schemas
│   │   └── data.py          # Vadapalani, Chennai telemetry & route waypoints
│   └── requirements.txt
├── esp32/
│   └── firmware.ino         # ESP32 automatic crash sensor firmware
├── src/
│   ├── components/
│   │   └── Navbar.tsx       # Floating pill role switcher & status HUD
│   ├── pages/
│   │   ├── UserPortal.tsx   # Citizen emergency SOS portal
│   │   └── DriverPortal.tsx # Ambulance mission control portal
│   ├── data/
│   │   └── mockData.ts      # Scenario data & route definitions
│   ├── services/
│   │   └── api.ts           # REST API & WebSocket client
│   ├── types/
│   │   └── index.ts         # TypeScript data contracts
│   ├── App.tsx
│   ├── index.css            # Dark mode map & pulse animations
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v18+ recommended) & **npm**
- **Python** (3.9+) & **pip**
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/vaanavee/the-fast-response.git
cd the-fast-response
```

---

### Step 2: Frontend Setup

1. Install Node dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server (accessible over local network via `--host 0.0.0.0`):
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
   Open your browser at `http://localhost:5173` or `http://<your-ip>:5173`.

---

### Step 3: Backend Setup (FastAPI & WebSockets)

#### On Windows (PowerShell):
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### On macOS / Linux (Bash):
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Step 4: ESP32 IoT Crash Detection Flashing (Optional)
1. Open Arduino IDE or PlatformIO.
2. Install the **ESP32 Board Package** and ensure `WiFi.h` and `HTTPClient.h` are installed.
3. Open `esp32/firmware.ino`.
4. Update `ssid`, `password`, and `serverEndpoint` with your backend server IP (e.g. `http://192.168.1.100:8000/api/alerts/crash`).
5. Connect your ESP32 board and click **Upload**.

---

## 🌐 Multi-Device Testing & Network Access
The frontend and backend both bind to `0.0.0.0`, allowing mobile devices on the same Wi-Fi network to participate in live emergency dispatch simulations simultaneously:
- **Citizen Phone**: Open `http://<your-local-ip>:5173/`
- **Ambulance Tablet**: Open `http://<your-local-ip>:5173/driver`

---

## 📄 License
MIT License. Built for emergency services optimization and public healthcare coordination.
