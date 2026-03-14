import { getDistance } from '../../config/districtDistances.js';
import DeliveryZone from '../models/DeliveryZone.js';

export async function calculateDelivery(fromDistrict, toDistrict, quantityKg, perishability) {
  const distance = getDistance(fromDistrict, toDistrict);

  if (distance === null) {
    return { available: false, reason: 'Route not covered yet' };
  }

  const zone = await DeliveryZone.findOne({
    minKm: { $lte: distance },
    maxKm: { $gte: distance },
    isActive: true,
  });

  if (!zone) {
    return { available: false, reason: 'No transporter coverage for this route' };
  }

  if (perishability === 'high' && zone.zone !== 'hyperlocal') {
    return {
      available: false,
      reason: 'High perishability crops can only be delivered within hyperlocal zone (same district, under 30km)',
    };
  }

  if (!zone.allowedPerishability.includes(perishability)) {
    return {
      available: false,
      reason: 'This perishability type is not allowed for this delivery zone',
    };
  }

  const cost = quantityKg <= zone.flatRateUpTo ? zone.flatRate : quantityKg * zone.ratePerKg;

  return {
    available: true,
    zone: zone.zone,
    distanceKm: distance,
    ratePerKg: zone.ratePerKg,
    flatRateUpTo: zone.flatRateUpTo,
    flatRate: zone.flatRate,
    estimatedCost: Math.round(cost),
    assured: true,
  };
}

