import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Transporter from '../src/models/Transporter.js';

await mongoose.connect(process.env.MONGO_URL);
await Transporter.deleteMany({});
await Transporter.insertMany([
  {
    companyName: 'Raju Transport Co.',
    phone: '9712345678',
    zones: ['Nashik', 'Pune', 'Mumbai', 'Thane', 'Ahmednagar'],
    vehicleNumber: 'MH 15 AB 1234',
    vehicleType: 'truck',
    capacityKg: 5000,
    rating: 4.8,
    completedJobs: 42,
  },
  {
    companyName: 'Kisan Logistics',
    phone: '9823456789',
    zones: ['Pune', 'Satara', 'Kolhapur', 'Sangli'],
    vehicleNumber: 'MH 12 CD 5678',
    vehicleType: 'tempo',
    capacityKg: 1500,
    rating: 4.5,
    completedJobs: 28,
  },
  {
    companyName: 'Agri Movers',
    phone: '9934567890',
    zones: ['Aurangabad', 'Nashik', 'Ahmednagar', 'Latur'],
    vehicleNumber: 'MH 20 EF 9012',
    vehicleType: 'pickup',
    capacityKg: 800,
    rating: 4.6,
    completedJobs: 19,
  },
]);
console.log('Transporters seeded');
await mongoose.disconnect();

