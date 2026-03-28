import mongoose from 'mongoose';

const transporterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyName: { type: String, required: true },
    phone: { type: String, required: true },
    zones: [{ type: String }],
    vehicleNumber: { type: String },
    vehicleType: { type: String, enum: ['tempo', 'truck', 'pickup', 'tractor'] },
    capacityKg: { type: Number },
    rating: { type: Number, default: 5 },
    ratingCount: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    isContracted: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Transporter', transporterSchema);

