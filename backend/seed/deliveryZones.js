import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import DeliveryZone from '../src/models/DeliveryZone.js';

await mongoose.connect(process.env.MONGO_URL);
await DeliveryZone.deleteMany({});
await DeliveryZone.insertMany([
  {
    zone: 'hyperlocal',
    minKm: 0,
    maxKm: 30,
    ratePerKg: 0.8,
    flatRateUpTo: 500,
    flatRate: 350,
    allowedPerishability: ['high', 'medium', 'low'],
  },
  {
    zone: 'district',
    minKm: 31,
    maxKm: 100,
    ratePerKg: 1.5,
    flatRateUpTo: 500,
    flatRate: 700,
    allowedPerishability: ['medium', 'low'],
  },
  {
    zone: 'regional',
    minKm: 101,
    maxKm: 300,
    ratePerKg: 2.8,
    flatRateUpTo: 500,
    flatRate: 1200,
    allowedPerishability: ['low'],
  },
  {
    zone: 'interstate',
    minKm: 301,
    maxKm: 9999,
    ratePerKg: 4.5,
    flatRateUpTo: 500,
    flatRate: 2000,
    allowedPerishability: ['low'],
  },
]);
console.log('Delivery zones seeded');
await mongoose.disconnect();