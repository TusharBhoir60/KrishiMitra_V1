import { formatINR } from '../../utils/formatCurrency';

export const CostBreakdown = ({ cropAmount, deliveryFee, platformFee, totalAmount }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 font-body">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Crop cost</span>
        <span>{formatINR(cropAmount)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Delivery fee</span>
        <span>{deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Platform fee (2%)</span>
        <span>{formatINR(platformFee)}</span>
      </div>
      <hr className="border-gray-200" />
      <div className="flex justify-between font-bold text-farm-green text-lg">
        <span>Total</span>
        <span>{formatINR(totalAmount)}</span>
      </div>
    </div>
  );
};
