import { Router } from 'express';
import Sensor from './models/Sensor';
import Network from './models/Network';
import Telemetry from './models/Telemetry';

const router = Router();

// Get all sensors
router.get('/sensors', async (req, res) => {
  try {
    const sensors = await Sensor.find().populate('networks');
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensors' });
  }
});

// Get historical telemetry for a sensor
router.get('/telemetry/:sensorId', async (req, res) => {
  try {
    const data = await Telemetry.find({ sensorId: req.params.sensorId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// Get all networks
router.get('/networks', async (req, res) => {
  try {
    const networks = await Network.find().populate('sensors');
    res.json(networks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch networks' });
  }
});

// Create a network
router.post('/networks', async (req, res) => {
  try {
    const { name, description, applicationType, sensors } = req.body;
    const newNetwork = new Network({ name, description, applicationType, sensors });
    await newNetwork.save();
    
    // update sensors with this network
    if (sensors && sensors.length > 0) {
      await Sensor.updateMany(
        { _id: { $in: sensors } },
        { $push: { networks: newNetwork._id } }
      );
    }
    
    res.status(201).json(newNetwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create network' });
  }
});

export default router;
