/**
 * Thefirstresponse360 / Golden Hour — IoT Crash Detection & Telemetry
 * ESP32 Firmware for Automatic Accident Detection & Emergency Dispatch
 *
 * Hardware Connections:
 * - Crash / Vibration / Shock Sensor: GPIO 4 (Digital Input with Pullup)
 * - Emergency Warning Buzzer: GPIO 5 (Digital Output)
 * - Status LED: GPIO 2 (Built-in LED)
 */

#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Thefirstresponse360 Backend Dispatch Server URL
// Replace with your local machine or cloud server IP
const char* serverEndpoint = "http://192.168.1.100:8000/api/alerts/crash";

// Pin Definitions
const int CRASH_SENSOR_PIN = 4;
const int BUZZER_PIN = 5;
const int STATUS_LED_PIN = 2;

// Location Telemetry (Vadapalani, Chennai mock or GPS module readings)
const float DEFAULT_LAT = 13.05060;
const float DEFAULT_LON = 80.21140;

// Debounce & State Management
bool crashAlertSent = false;
unsigned long lastTriggerTime = 0;
const unsigned long COOLDOWN_PERIOD_MS = 15000; // 15 seconds cooldown

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("  Thefirstresponse360 - ESP32 Crash Detection Unit");
  Serial.println("==================================================");

  // Configure Pins
  pinMode(CRASH_SENSOR_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  // Ensure Wi-Fi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, LOW);
    connectWiFi();
  } else {
    digitalWrite(STATUS_LED_PIN, HIGH);
  }

  // Read impact / crash sensor (Active LOW when impact switch closes)
  int sensorState = digitalRead(CRASH_SENSOR_PIN);
  unsigned long now = millis();

  if (sensorState == LOW && (!crashAlertSent || (now - lastTriggerTime > COOLDOWN_PERIOD_MS))) {
    Serial.println("\n[CRITICAL WARNING] Severe impact detected on Pin 4!");
    lastTriggerTime = now;
    crashAlertSent = true;

    // Trigger audible alarm pattern
    triggerAlarm();

    // Dispatch JSON payload to the central backend
    dispatchCrashAlert(DEFAULT_LAT, DEFAULT_LON, "HIGH", "PENDING_OFFLINE_ALERT");
  }

  // Auto-reset alert status after cooldown
  if (crashAlertSent && (now - lastTriggerTime > COOLDOWN_PERIOD_MS)) {
    crashAlertSent = false;
    Serial.println("[SYSTEM] Ready for telemetry sensing.");
  }

  delay(50);
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection failed. Will retry in loop...");
  }
}

void triggerAlarm() {
  for (int i = 0; i < 4; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(150);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void dispatchCrashAlert(float lat, float lon, const char* severity, const char* status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP ERROR] Cannot send alert: WiFi is not connected.");
    return;
  }

  HTTPClient http;
  Serial.print("[HTTP] Dispatching emergency crash telemetry to: ");
  Serial.println(serverEndpoint);

  http.begin(serverEndpoint);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload matching the backend specification:
  // {"lat": 13.0506, "lon": 80.2114, "severity": "HIGH", "status": "PENDING_OFFLINE_ALERT"}
  char payload[256];
  snprintf(payload, sizeof(payload),
    "{\"lat\": %.5f, \"lon\": %.5f, \"severity\": \"%s\", \"status\": \"%s\"}",
    lat, lon, severity, status
  );

  Serial.print("[HTTP] Request Payload: ");
  Serial.println(payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Alert response code: %d\n", httpResponseCode);
    Serial.print("[HTTP] Server Response: ");
    Serial.println(response);
  } else {
    Serial.printf("[HTTP] Error sending alert POST, code: %d\n", httpResponseCode);
  }

  http.end();
}
