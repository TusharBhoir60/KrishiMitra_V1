import { formatINR } from '../../utils/formatCurrency';

export const DeliveryBadge = ({ method, zone, estimatedCost, assured, available = true }) => {
  if (method === 'farmer_delivers') {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-800 border-amber-200 border text-sm font-medium font-body">
        🚜 Farmer delivers · Free
      </div>
    );
  }
  if (method === 'buyer_pickup') {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 border-blue-200 border text-sm font-medium font-body">
        📍 Buyer pickup · Free
      </div>
    );
  }
  
  if (method === 'platform_transporter') {
    if (available) {
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 border-purple-200 border text-sm font-medium font-body">
          🚛 Platform Assured · {formatINR(estimatedCost)}
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 border-gray-200 border text-sm font-medium font-body">
          🚛 Transport not available on this route
        </div>
      );
    }
  }

  return null;
};
