import mqtt from 'mqtt';
import { Server } from 'socket.io';
import Sensor from './models/Sensor';
import Telemetry from './models/Telemetry';
import Network from './models/Network';

export const setupMqtt = (io: Server) => {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com'; // Using public broker for demo
  const client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log(`Connected to MQTT broker at ${brokerUrl}`);
    client.subscribe('virtual_city/sensors/+', (err) => {
      if (err) console.error('Subscription error:', err);
      else console.log('Subscribed to virtual_city/sensors/+');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const sensorId = topic.split('/').pop();
      if (!sensorId) return;

      // Ensure Sensor exists or upsert it
      let sensor = await Sensor.findOne({ sensorId });
      if (!sensor) {
        sensor = new Sensor({
          sensorId,
          name: payload.name || `Sensor ${sensorId}`,
          type: payload.type || 'unknown',
          location: payload.location || { lat: 0, lng: 0 },
          status: 'active'
        });
        await sensor.save();
      }

      // Save Telemetry data
      const telemetry = new Telemetry({
        sensorId,
        type: payload.type || 'unknown',
        value: payload.value,
        unit: payload.unit || '',
        timestamp: new Date()
      });
      await telemetry.save();

      // Emit live data via Socket.io to frontend
      io.emit('sensor-update', {
        sensorId,
        type: payload.type,
        value: payload.value,
        unit: payload.unit,
        location: sensor.location,
        timestamp: telemetry.timestamp
      });

      // Simple threshold alert logging
      if (payload.type === 'pollution' && payload.value > 150) {
        console.log(`[ALERT] High pollution detected at ${sensorId}: ${payload.value} AQI`);
        io.emit('alert', { sensorId, message: 'High pollution detected', value: payload.value });
      }

    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });

  client.on('error', (error) => {
    console.error('MQTT error:', error);
  });
};
