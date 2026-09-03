import paho.mqtt.client as mqtt
import time
import json
import random

# Configuration
BROKER = "broker.hivemq.com"
PORT = 1883
BASE_TOPIC = "virtual_city/sensors"

# You can manually configure the sensor names and locations below
# If 'lat' and 'lng' are provided, the sensor will be placed exactly there.
# Otherwise, it will fallback to a random location near the base coordinates.
BASE_LAT = 26.7663
BASE_LNG = 83.3689
 
sensors = [
    {"id": "sensor_001", "name": "MMMUT Main Gate", "type": "traffic", "unit": "cars/min", "lat": 26.729832, "lng": 83.431340},
    {"id": "sensor_002", "name": "Kunraghat Gorakhpur", "type": "traffic", "unit": "cars/min", "lat": 26.747942, "lng": 83.413791},
    {"id": "sensor_003", "name": "MMMUT MPH Hall", "type": "pollution", "unit": "AQI", "lat": 26.731787, "lng": 83.434262},
    {"id": "sensor_004", "name": "MMMUT Stadium Main Gate", "type": "pollution", "unit": "AQI", "lat": 26.731687, "lng": 83.436627},
    {"id": "sensor_005", "name": "MMMUT Ramanujan Hostel", "type": "weather", "unit": "C", "lat": 26.728561, "lng": 83.439991},
    {"id": "sensor_006","name": "Dibyanshu Room", "type": "weather", "unit": "C", "lat": 26.730538, "lng": 83.424832},
    {"id": "sensor_007","name": "Nitesh Room", "type": "pollution", "unit": "AQI", "lat": 26.728592, "lng": 83.427659}
]


# Assign locations manually if provided, otherwise use random locations near the base coordinates
for s in sensors:
    if "lat" in s and "lng" in s:
        s['location'] = {
            "lat": s["lat"],
            "lng": s["lng"]
        }
    else:
        s['location'] = {
            "lat": BASE_LAT + random.uniform(-0.02, 0.02),
            "lng": BASE_LNG + random.uniform(-0.02, 0.02)
        }

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker with result code {rc}")

client = mqtt.Client()
client.on_connect = on_connect

print(f"Connecting to {BROKER}:{PORT}...")
client.connect(BROKER, PORT, 60)

# Start network loop in non-blocking mode
client.loop_start()

def generate_value(sensor_type):
    if sensor_type == "traffic":
        return random.randint(10, 200) # Cars per minute
    elif sensor_type == "pollution":
        return random.randint(20, 200) # AQI varying widely
    elif sensor_type == "weather":
        return random.randint(15, 35) # Temperature in C

print("Starting sensor simulation. Press Ctrl+C to exit.")
try:
    while True:
        for s in sensors:
            val = generate_value(s['type'])

            # occasional spike for pollution to trigger alerts in backend
            if s['type'] == 'pollution' and random.random() > 0.9:
                val = random.randint(151, 300) # Unhealthy level!

            payload = {
                "name": s['name'],
                "type": s['type'],
                "value": val,
                "unit": s['unit'],
                "location": s['location']
            }

            topic = f"{BASE_TOPIC}/{s['id']}"
            client.publish(topic, json.dumps(payload))
            print(f"[{s['type'].upper()}] Published {val} to {topic}")

        # Wait some time before next batch of metrics
        time.sleep(5)
except KeyboardInterrupt:
    print("Simulation stopped")
finally:
    client.loop_stop()
    client.disconnect()
