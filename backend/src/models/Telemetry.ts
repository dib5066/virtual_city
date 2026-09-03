import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetry extends Document {
  sensorId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
}

const TelemetrySchema: Schema = new Schema({
  sensorId: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Optionally create a time-series or standard index for queries
TelemetrySchema.index({ sensorId: 1, timestamp: -1 });

export default mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
