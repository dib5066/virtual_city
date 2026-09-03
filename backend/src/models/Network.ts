import mongoose, { Schema, Document } from 'mongoose';

export interface INetwork extends Document {
  name: string;
  description: string;
  applicationType: string;
  sensors: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const NetworkSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  applicationType: { type: String, required: true },
  sensors: [{ type: Schema.Types.ObjectId, ref: 'Sensor' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INetwork>('Network', NetworkSchema);
