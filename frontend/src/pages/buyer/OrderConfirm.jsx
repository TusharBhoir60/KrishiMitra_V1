import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { useAuth } from '../../hooks/useAuth';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { CostBreakdown } from '../../components/ui/CostBreakdown';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { MapPin, Truck, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrderConfirm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState('');
  const [address, setAddress] = useState(user?.location?.address || '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const buyerDistrict = user?.location?.district;

  useEffect(() => {
    cropsApi.getListingById(id, buyerDistrict).then(res => {
      setCrop(res.data?.data);
      setQty(res.data?.data?.minOrderQty || 1);
      
      // Select first available method
      if (res.data?.data?.deliveryOptions) {
        if (res.data.data.deliveryOptions.farmerDelivers) setMethod('farmer_delivers');
        else if (res.data.data.deliveryOptions.buyerPickup) setMethod('buyer_pickup');
        else if (res.data.data.deliveryOptions.platformTransporter) setMethod('platform_transporter');
      }
    }).catch(() => {
      toast.error('Listing not found');
      navigate('/buyer/marketplace');
    }).finally(() => setLoading(false));
  }, [id, navigate, buyerDistrict]);

  useEffect(() => {
    if (method === 'platform_transporter' && crop) {
      deliveryApi.getEstimate({
        fromDistrict: crop.farmer.location.district,
        toDistrict: buyerDistrict,
        quantity: qty,
        perishability: crop.perishability
      }).then(res => setEstimate(res.data?.data))
        .catch(() => setEstimate(null));
    }
  }, [method, qty, crop, buyerDistrict]);

  const handleSubmit = async () => {
    try {
      if (qty < crop.minOrderQty) return toast.error(`Minimum order is ${crop.minOrderQty}kg`);
      if (qty > crop.availableQty) return toast.error(`Only ${crop.availableQty}kg available`);
      if (!method) return toast.error('Select a delivery method');
      if (method === 'farmer_delivers' && !address) return toast.error('Address is required');
      if ((method === 'farmer_delivers' || method === 'buyer_pickup') && !date) return toast.error('Date is required');

      setSubmitting(true);
      const res = await ordersApi.createOrder({
        listingId: id,
        quantity: qty,
        deliveryMethod: method,
        deliveryAddress: method === 'farmer_delivers' ? address : undefined,
        preferredDate: method !== 'platform_transporter' ? date : undefined,
        specialInstructions: notes
      });

      toast.success('Order placed! Waiting for farmer approval.');
      navigate(`/buyer/orders/${res.data.data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
      setSubmitting(false);
    }
  };

  if (loading || !crop) return <div className="max-w-3xl mx-auto p-6"><SkeletonCard/></div>;

  const cropCost = qty * crop.pricePerKg;
  let deliveryFee = 0;
  if (method === 'farmer_delivers') deliveryFee = crop.deliveryOptions.deliveryCharge || 0;
  else if (method === 'platform_transporter') deliveryFee = estimate?.cost || 0;
  
  const platformFee = cropCost * 0.02;
  const total = cropCost + deliveryFee + platformFee;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 pt-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 font-medium mb-4 hover:text-farm-dark"><ArrowLeft className="w-4 h-4"/> Back to crop</button>
        <h1 className="text-3xl font-display font-bold text-farm-dark mb-8">Confirm Your Order</h1>

        {/* Item Summary */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 mb-6">
          <img src={crop.images?.[0]?.url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-xl object-cover" alt="crop"/>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-farm-dark line-clamp-1">{crop.cropName}</h3>
            <p className="text-sm text-gray-500">{crop.farmer.name} · {crop.farmer.location.district}</p>
            <p className="text-farm-green font-bold mt-1">{formatINR(crop.pricePerKg)}/kg</p>
          </div>
        </div>

        {/* Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-farm-dark mb-4">Quantity (kg)</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setQty(Math.max(crop.minOrderQty, qty - 1))} className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-200">-</button>
            <input type="number" value={qty} onChange={e => setQty(Math.max(crop.minOrderQty, Math.min(crop.availableQty, Number(e.target.value))))} className="w-24 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-farm-green outline-none" />
            <button onClick={() => setQty(Math.min(crop.availableQty, qty + 1))} className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-200">+</button>
          </div>
          <p className="text-sm text-gray-500 mt-3">Min: {crop.minOrderQty}kg · Max: {crop.availableQty}kg</p>
        </div>

        {/* Delivery Method */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-farm-dark mb-4">Delivery Method</h2>
          <div className="grid gap-3">
            
            {crop.deliveryOptions?.farmerDelivers && (
              <label className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${method === 'farmer_delivers' ? 'border-farm-green bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="delivery" checked={method==='farmer_delivers'} onChange={() => setMethod('farmer_delivers')} className="w-5 h-5 accent-farm-green" />
                    <div>
                      <h4 className="font-bold flex items-center gap-2"><Truck className="w-4 h-4"/> Farmer Delivers</h4>
                      <p className="text-sm text-gray-500">Delivered directly to your address</p>
                    </div>
                  </div>
                  <span className="font-bold">{crop.deliveryOptions.deliveryCharge > 0 ? formatINR(crop.deliveryOptions.deliveryCharge) : 'Free'}</span>
                </div>
              </label>
            )}

            {crop.deliveryOptions?.buyerPickup && (
              <label className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${method === 'buyer_pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="delivery" checked={method==='buyer_pickup'} onChange={() => setMethod('buyer_pickup')} className="w-5 h-5 accent-blue-600" />
                    <div>
                      <h4 className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> Pick up from Farm</h4>
                      <p className="text-sm text-gray-500">Farm in {crop.farmer.location.district}</p>
                    </div>
                  </div>
                  <span className="font-bold">Free</span>
                </div>
              </label>
            )}

            {crop.deliveryOptions?.platformTransporter && (
              <label className={`p-4 border-2 rounded-xl transition-colors ${!estimate && method !== 'platform_transporter' ? 'opacity-50' : method === 'platform_transporter' ? 'border-purple-500 bg-purple-50' : 'cursor-pointer border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="delivery" checked={method==='platform_transporter'} onChange={() => setMethod('platform_transporter')} disabled={!estimate && method !== 'platform_transporter'} className="w-5 h-5 accent-purple-600" />
                    <div>
                      <h4 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Platform Assured</h4>
                      <p className="text-sm text-gray-500">Verified independent truck transporter</p>
                    </div>
                  </div>
                  <span className="font-bold text-purple-700">{estimate ? formatINR(estimate.cost) : 'Checking...'}</span>
                </div>
              </label>
            )}
            
          </div>

          {/* Conditional Inputs based on Method */}
          {method === 'farmer_delivers' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fadeUp">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Delivery Address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-farm-green" rows={3} placeholder="Provide landmarks and pin code"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Delivery Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-farm-green" />
              </div>
            </div>
          )}

          {method === 'buyer_pickup' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fadeUp">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Expected Pickup Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">The exact farm address and coordinates will be shared with you after the farmer accepts the order.</p>
            </div>
          )}

        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-farm-dark mb-4">Special Instructions</h2>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-farm-light" rows={2} placeholder="Any specific requirements for packaging, timing, or quality?"></textarea>
        </div>

        <CostBreakdown cropAmount={cropCost} deliveryFee={deliveryFee} platformFee={platformFee} totalAmount={total} />

        <div className="mt-8 flex justify-end">
          <button onClick={handleSubmit} disabled={submitting || !method} className={`w-full md:w-auto px-8 py-4 ${method ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'} text-white font-bold text-lg flex justify-center items-center gap-2 rounded-xl transition-colors shadow-lg shadow-blue-600/30`}>
            {submitting ? 'Placing Order...' : 'Confirm Order & Notify Farmer'} <ArrowRight className="w-5 h-5"/>
          </button>
        </div>

      </div>
    </div>
  );
};
