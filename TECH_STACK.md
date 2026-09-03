# Virtual City — Tech Stack & Project Summary

## Summary

**Virtual City** is a city-scale digital twin: a virtual, real-time replica of a
municipal sensor network that monitors **traffic**, **air pollution**, and
**weather** at once. Simulated IoT sensors publish JSON telemetry over MQTT; a
Node.js backend ingests the stream, stores it in MongoDB, and fans it out to a
React dashboard over WebSockets. The dashboard renders every sensor on an
interactive map, plots historical trends, and raises live alerts when a reading
crosses a threshold (e.g. pollution > 150 AQI).

The system is built around **Virtual Sensor Networks (VSNs)** — logical groupings
that let operators slice the physical sensor pool by application (traffic vs.
environment) without changing the hardware layout.

### Data flow

```
Python simulator ──MQTT──▶ Node backend ──┬──▶ MongoDB (Telemetry audit log)
(paho-mqtt)     virtual_city/sensors/+     │
                                           └──WebSocket──▶ React dashboard
                                              (socket.io)     (map + charts + alerts)
```

1. **Generate** — `sensors/simulator.py` builds a JSON payload (value, type, unit, GPS) per sensor.
2. **Transmit** — publishes to `virtual_city/sensors/<sensorId>` on a public MQTT broker.
3. **Ingest** — `backend/src/mqttHandler.ts` is subscribed to that topic and intercepts each message.
4. **Persist** — backend upserts the `Sensor` and appends a `Telemetry` document in MongoDB.
5. **Push** — backend emits `sensor-update` (and `alert` on threshold breach) over Socket.io.
6. **Render** — React updates the corresponding Leaflet marker, chart, and the live alerts panel.

---

## Tech Stack

### Frontend — `frontend/`
| Concern | Technology |
| --- | --- |
| Framework | React 19 |
| Build tool / dev server | Vite 8 |
| Language | TypeScript ~5.9 |
| Styling | Tailwind CSS 3.4 + PostCSS + Autoprefixer |
| Map | Leaflet 1.9 + React-Leaflet 5 |
| Charts | Recharts 3 |
| Icons | lucide-react |
| Realtime transport | socket.io-client 4 |
| Linting | ESLint 9 + typescript-eslint |

Key files: `src/App.tsx` (layout, socket wiring, alerts), `src/components/MapView.tsx`
(markers/icons), `src/components/SensorChart.tsx` (historical telemetry fetch + plot).
Backend endpoints are currently hard-coded to `http://localhost:5001`.

### Backend — `backend/`
| Concern | Technology |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript 5.9 (CommonJS, run via ts-node) |
| HTTP framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| MQTT client | mqtt 5 |
| Realtime server | socket.io 4 |
| Middleware / config | cors, dotenv |

Key files: `src/index.ts` (bootstrap: Express + HTTP server + Socket.io + Mongo),
`src/mqttHandler.ts` (MQTT subscribe → persist → emit + threshold alerts),
`src/routes.ts` (REST API), `src/models/` (`Sensor`, `Telemetry`, `Network` schemas).

**REST API** (prefix `/api`):
- `GET /sensors` — all sensors, with populated networks
- `GET /telemetry/:sensorId` — last 100 readings, newest first
- `GET /networks` — all VSNs, with populated sensors
- `POST /networks` — create a VSN and link its sensors

**Socket.io events:** `sensor-update`, `alert`.

### IoT / Sensor layer — `sensors/`
| Concern | Technology |
| --- | --- |
| Language | Python 3 (virtualenv in `sensors/venv/`) |
| MQTT library | paho-mqtt |
| Broker | public broker (`broker.hivemq.com:1883`) |
| Payload | JSON (id, name, type, unit, value, location) |
| Topic | `virtual_city/sensors/<sensorId>` |

Key file: `sensors/simulator.py` — the `sensors = [...]` array defines the simulated
fleet (traffic / pollution / weather) with fixed GPS coordinates around Gorakhpur.

### Infrastructure / config
| Item | Value |
| --- | --- |
| Backend port | `5001` (env `PORT`) |
| MongoDB URI | env `MONGO_URI`, default `mongodb://127.0.0.1:27017/virtual_city` |
| MQTT broker | env `MQTT_BROKER`, default `mqtt://broker.hivemq.com` |
| CORS | open (`origin: '*'`) |

---

## Running locally

```bash
# 1. Backend  (requires a running MongoDB)
cd backend && npm install && npx ts-node src/index.ts

# 2. Frontend
cd frontend && npm install && npm run dev

# 3. Sensor simulator
cd sensors && source venv/bin/activate && python simulator.py
```

---

## Related documents
- `PROJECT_OVERVIEW.md` — narrative overview and change-guide.
- `HARDWARE_ARCHITECTURE.md` — physical sensor architecture.
- `HARDWARE_INTEGRATION_GUIDE.md` — swapping the simulator for real hardware.
