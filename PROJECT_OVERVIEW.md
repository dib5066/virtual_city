# City-Scale Digital Twin: Project Overview

## 1. Executive Summary
This project is a **City-Scale Digital Twin**—a virtual, real-time replica of a city's sensor network. It is designed to track traffic, air pollution, and weather data simultaneously. 

By utilizing **Virtual Sensor Networks (VSNs)**, the system logically groups sensors (e.g., separating traffic data from environmental data). When certain thresholds are breached (like an air pollution spike), the system instantly generates alerts on a live dashboard. This kind of system is crucial for Smart Cities, allowing city managers and HR/operations to monitor infrastructure in real-time.

---

## 2. Architecture & Tech Stack
The project is divided into three completely decoupled components:

* **Frontend (Dashboard)**: Built with **React.js, Vite, and TailwindCSS**. It uses **React-Leaflet** for the interactive map and **Socket.io-client** to listen for live updates without ever refreshing the page.
* **Backend (Server)**: Built with **Node.js, TypeScript, and Express**. It serves two primary roles:
    1. A REST API connecting to **MongoDB** (via Mongoose) to save historical data.
    2. An event router that parses **MQTT** streams and pushes them through a **Socket.io** WebSocket server.
* **IoT / Sensor Layer**: Currently powered by a **Python** script using the `paho-mqtt` library. It simulates multiple sensors publishing JSON payloads to a public Mosquitto MQTT broker.

---

## 3. How the Data Flows (How it Works)
1. **Data Generation**: The Python script (`sensors/simulator.py`) generates a random number (e.g., Traffic = 120 cars/min) and packages it into a JSON string with GPS coordinates.
2. **Transmission**: The Python script publishes this JSON string to the topic `virtual_city/sensors/...` over the **MQTT Protocol** (the industry standard for lightweight IoT communication).
3. **Ingestion**: The Node.js Backend (`backend/src/mqttHandler.ts`) is "subscribed" to that same MQTT topic. The moment data arrives, the Node backend intercepts it.
4. **Database Storage**: The backend saves a copy of the payload to MongoDB in the `Telemetries` collection, creating an audit log.
5. **Real-time Push**: Simultaneously, the backend blasts the new data to the React Frontend over a WebSocket (`io.emit`).
6. **UI Update**: The React Frontend receives the socket event, finds the specific marker on the Leaflet Map, and instantly updates its popup numbers and triggers the red "Live Alerts" box if it sees an anomaly.

---

## 4. How to Make Changes
If you need to make modifications to the project or present changes, refer to these locations:

**To add a new Simulated Sensor:**
* Open `/sensors/simulator.py`. Find the `sensors = [...]` array at the top and add a new dictionary with a name, type, and unit. Restart the python script.

**To change alert logic (e.g., Alert when Traffic > 150):**
* Open `/backend/src/mqttHandler.ts`. Scroll to the bottom where `io.emit('alert', ...)` is located. Write your standard `if (payload.type === 'traffic' && payload.value > 150)` logic there.

**To change the Map UI or Sidebar:**
* Open `/frontend/src/App.tsx`. All of the HTML/Tailwind structure for the sidebar and alerts lives here.
* Map markers and their colors live in `/frontend/src/components/MapView.tsx`. You can alter the `createIcon(color)` function to change marker styles.

**To add new Database Fields:**
* Open `/backend/src/models/`. You can edit the TypeScript interfaces (e.g. `Sensor.ts` or `Telemetry.ts`) to accept new strings/numbers from the sensors.
