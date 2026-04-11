import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema({
  zone: { type: String, enum: ['hyperlocal', 'district', 'regional', 'interstate'], required: true },
  minKm: { type: Number, required: true },
  maxKm: { type: Number, required: true },
  ratePerKg: { type: Number, required: true },
  flatRateUpTo: { type: Number, required: true },
  flatRate: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  allowedPerishability: [{ type: String, enum: ['high', 'medium', 'low'] }],
});

export default mongoose.model('DeliveryZone', deliveryZoneSchema);

