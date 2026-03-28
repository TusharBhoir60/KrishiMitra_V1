import { calculateDelivery } from '../services/deliveryService.js';
import DeliveryZone from '../models/DeliveryZone.js';

export const getDeliveryEstimate = async (req, res) => {
  const { fromDistrict, toDistrict, quantity, perishability } = req.query;
  if (!fromDistrict || !toDistrict || !quantity || !perishability)
    return res
      .status(400)
      .json({ success: false, message: 'fromDistrict, toDistrict, quantity, and perishability are required' });
  const result = await calculateDelivery(fromDistrict, toDistrict, Number(quantity), perishability);
  return res.status(200).json({ success: true, data: result });
};

export const getDeliveryZones = async (req, res) => {
  const zones = await DeliveryZone.find({ isActive: true });
  return res.status(200).json({ success: true, data: { zones } });
};

