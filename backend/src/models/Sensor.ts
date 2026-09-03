import mongoose, { Schema, Document } from 'mongoose';

export interface ISensor extends Document {
  sensorId: string;
  name: string;
  type: string; // e.g., 'traffic', 'pollution', 'weather'
  location: {
    lat: number;
    lng: number;
  };
  status: string; // 'active' | 'inactive'
  networks: mongoose.Types.ObjectId[];
}

const SensorSchema: Schema = new Schema({
  sensorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, default: 'active' },
  networks: [{ type: Schema.Types.ObjectId, ref: 'Network' }]
});

export default mongoose.model<ISensor>('Sensor', SensorSchema);
