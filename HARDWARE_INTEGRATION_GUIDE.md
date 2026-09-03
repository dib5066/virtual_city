# Hardware & Sensor Integration Guide

Currently, this Digital Twin utilizes a Python script to simulate physical sensors. However, the system architecture (MQTT + WebSockets) is explicitly designed for **real hardware**. 

If you want to transition from a simulation to real-world edge devices, follow this guide outlining which sensors to purchase, how to extract their data, and how to plug them into this codebase.

---

## 1. Recommended Physical Sensors
To replicate the simulated environment in real life, you need physical sensors capable of detecting physical environments and converting that to an analog/digital electrical signal.

* **Air Quality & Pollution**: 
  * `MQ-135` Gas Sensor: Detects Ammonia, Benzene, smoke, and CO2. Very cheap and effective.
  * `PMS5003`: Advanced laser dust sensor that accurately measures PM2.5 and PM10 particles.
* **Traffic & Proximity**:
  * `HC-SR04` Ultrasonic Sensor: Perfect for aiming at a road/driveway. Each time distance drops, you count 1 car.
* **Weather & Climate**:
  * `DHT22` or `BME280`: Extremely popular modules for reading Temperature, Humidity, and Barometric Pressure.

---

## 2. Recommended Microcontroller (Edge Node)
A raw sensor cannot connect to the internet by itself. It needs a "brain" to read its electrical output and broadcast it over WiFi.

* **ESP32 or ESP8266 (NodeMCU)**: These are the absolute best choices. They are microcontrollers (like an Arduino) but have **built-in Wi-Fi chips**. They cost £4 / $5 each. 
* *Alternative*: Raspberry Pi Zero W (more expensive, runs full Linux, overkill for simple sensors).

---

## 3. The Data Extraction Process
Here is step-by-step how you get data out of the physical world and into the code:

1. **Wiring**: Connect the Sensor's Output pin to an Input pin (GPIO) on the ESP32. Provide the sensor with Ground and 3.3v Power from the ESP32 pins.
2. **Programming the Node**: Use the **Arduino IDE** (C++) or Micropython to program the ESP32.
3. **Reading Data**: Write code to execute `analogRead(PIN)` or use a specific library (like Adafruit DHT) to easily read the temperature value as an integer variable in C++.

---

## 4. How to Integrate the Hardware into THIS Project
Because this project utilizes **MQTT**, integrating physical hardware requires **absolutely zero changes to our React Frontend or Node.js Backend**. 

### The Protocol Interface
To connect your physical ESP32 to the Digital Twin, you simply need to program the ESP32 to push messages to our MQTT broker.

1. In the Arduino IDE, connect the ESP32 to your local Wi-Fi.
2. Install the `PubSubClient` library to allow the ESP32 to talk MQTT.
3. Connect the `PubSubClient` to the Mosquitto broker: `test.mosquitto.org` on port `1883`.
4. Structure the payload into a JSON string that perfectly matches our database model:
   ```json
   {
     "name": "Live Hardware DHT22",
     "type": "weather",
     "value": 24,
     "unit": "C",
     "location": { "lat": 26.7663, "lng": 83.3689 }
   }
   ```
5. Use `client.publish("virtual_city/sensors/hw_node_1", payload);`

### Handling Accurate Sensor Locations (GPS)
When deploying physical hardware, the system needs to know *where* the sensor is located to map it correctly. You have three main options:

1. **Hardcoding Coordinates (Simplest):** Go to Google Maps, right-click the exact physical location where you installed the sensor, copy the Latitude and Longitude, and strictly hardcode those numbers directly into the `location` field of your ESP32's JSON payload (as shown in Step 4 above).
2. **Hardware GPS Module (Mobile Sensors):** If your sensor is on a moving vehicle, wire a hardware GPS module (like the `NEO-6M`) to your ESP32. Your C++ code will read the live satellites, parse the varying Latitude/Longitude dynamically, and inject it into the JSON payload before every MQTT publish.
3. **Backend Database Config (Enterprise):** If you don't want to hardcode locations onto the microcontrollers, you can register the sensor in the backend MongoDB database first with its static location. The ESP32 will only send its strict `value`, and the Node.js backend will attach the static location to the payload before broadcasting it to the React map.

### Result
The moment the ESP32 runs `client.publish()`, the Node.js backend intercepts the hardware data, saves it to MongoDB, and blasts it to the React UI via WebSockets. The dashboard will instantly spawn a new map marker at its accurate location, completely agnostic to whether the data came from Python or a real physical microcontroller.

---

## 5. Adding Manual Virtual Sensors in the Simulator
If you do not have hardware yet and want to manually configure virtual sensors with specific names and coordinates in the Python simulator:

1. Open `sensors/simulator.py` in your code editor.
2. Locate the `sensors` list configuration at the top of the file.
3. Modify the `name` field of existing sensors or add entirely new ones.
4. Add strict `lat` and `lng` keys to the dictionary to bypass random location generation:
   ```python
   sensors = [
       {
           "id": "sensor_custom", 
           "name": "My Headquarters", 
           "type": "weather", 
           "unit": "C", 
           "lat": 26.7663, 
           "lng": 83.3689
       }
   ]
   ```
5. Restart your simulator by pressing `Ctrl+C` and running `python3 simulator.py`. The virtual sensor will appear instantly on the React map at exactly the coordinates and name you specified.
