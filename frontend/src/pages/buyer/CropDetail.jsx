import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { Badge } from '../../components/ui/Badge';
import { DeliveryBadge } from '../../components/ui/DeliveryBadge';
import { PricePredictionCard } from '../../components/ui/PricePredictionCard';
import { FarmerRatingBadge } from '../../components/common/FarmerRatingBadge';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { MapPin, ShieldCheck, ShoppingCart, Truck, History, Star } from 'lucide-react';
import dayjs from 'dayjs';

export const CropDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useBuyerCart();
  
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await cropsApi.getListingById(id, user?.location?.district);
        setCrop(res.data?.data);
        
        // If logged in and transporter available, get delivery estimate
        if (user && res.data?.data?.deliveryOptions?.platformTransporter) {
          const estRes = await deliveryApi.getEstimate({
            fromDistrict: res.data.data.farmer.location.district,
            toDistrict: user.location.district,
            quantity: res.data.data.minOrderQty, // default check
            perishability: res.data.data.perishability
          });
          setEstimate(estRes.data?.data);
        }
      } catch {
        navigate('/buyer/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, user, navigate]);

  if (loading || !crop) return <div className="max-w-4xl mx-auto p-6"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Images */}
          <div className="aspect-square md:aspect-auto md:h-[500px] bg-gray-200 rounded-3xl overflow-hidden relative shadow-sm border border-gray-100">
            {crop.images?.length > 0 ? (
              <img src={crop.images[0].url} alt={crop.cropName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-white/50">🌾</div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge type="grade" value={crop.grade} />
                <Badge type="perishability" value={crop.perishability} />
              </div>
              <h1 className="text-4xl font-display font-bold text-farm-dark mb-2">{crop.cropName}</h1>
              <p className="text-3xl font-bold text-farm-green">{formatINR(crop.pricePerKg)}<span className="text-lg text-gray-500 font-medium">/kg</span></p>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 text-blue-900 font-medium">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">📦</div>
              <div>
                <p>{crop.availableQty}kg available in stock</p>
                <p className="text-sm font-normal opacity-80 mt-0.5">Minimum order: {crop.minOrderQty}kg</p>
              </div>
            </div>

            {/* Farmer Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 text-green-700 font-bold text-xl rounded-full flex items-center justify-center shrink-0">
                {crop.farmer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-farm-dark">{crop.farmer.name}</h3>
                  {crop.farmer.isVerified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {crop.farmer.location.district}, {crop.farmer.location.state}</p>
                <div className="text-sm font-medium mt-2 flex items-center gap-2">
                  <span className="text-amber-500 flex items-center gap-0.5">★ {crop.farmer.rating || 5.0}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">{crop.farmer.completedOrders || 0} orders</span>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mb-2">
              <PricePredictionCard cropName={crop.cropName} district={crop.farmer.location.district} userPrice={crop.pricePerKg} />
            </div>

            <div>
              <FarmerRatingBadge />
              <Link
                to={`/buyer/farmers/${crop.farmer?._id || crop.farmerId}/reviews`}
                state={{ farmerName: crop.farmer?.name, farmerLocation: `${crop.farmer.location.district}, ${crop.farmer.location.state}` }}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Star className="h-4 w-4 fill-current" />
                See all reviews
              </Link>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><History className="w-3.5 h-3.5"/> Harvested</p>
                <p className="font-medium text-farm-dark">{dayjs().diff(crop.harvestDate, 'day')} days ago</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Expires in</p>
                <p className="font-medium text-farm-dark">{crop.perishability === 'high' ? '2 days' : crop.perishability === 'medium' ? '5 days' : '10+ days'}</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed font-body">{crop.description || 'Fresh produce straight from the farm. Quality guaranteed and inspected prior to sale.'}</p>

          </div>
        </div>

        {/* Delivery Options Detailed View */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-2xl font-display font-bold text-farm-dark mb-6 border-b border-gray-100 pb-4">Available Delivery Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crop.deliveryOptions?.farmerDelivers && (
              <div className="p-5 rounded-2xl border-2 border-green-50 bg-green-50/30">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-4"><Truck className="w-6 h-6"/></div>
                <h3 className="font-bold text-lg text-farm-dark">🚜 Farmer Delivers</h3>
                <p className="text-sm text-gray-600 mt-2">The farmer will transport the crop directly to your location.</p>
                <div className="mt-4 pt-4 border-t border-green-100">
                  <span className="font-bold text-green-700">{crop.deliveryOptions.deliveryCharge > 0 ? `${formatINR(crop.deliveryOptions.deliveryCharge)} Extra` : 'Free Delivery'}</span>
                </div>
              </div>
            )}
            
            {crop.deliveryOptions?.platformTransporter && (
              <div className="p-5 rounded-2xl border-2 border-purple-50 bg-purple-50/30">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6"/></div>
                <h3 className="font-bold text-lg text-farm-dark">🚛 Platform Assured</h3>
                <p className="text-sm text-gray-600 mt-2">Verified independent transporter picks up and delivers directly to you securely.</p>
                <div className="mt-4 pt-4 border-t border-purple-100 flex items-center justify-between">
                  <span className="font-bold text-purple-700">{estimate ? formatINR(estimate.cost) : 'Cost calculated at checkout'}</span>
                </div>
              </div>
            )}

            {crop.deliveryOptions?.buyerPickup && (
              <div className="p-5 rounded-2xl border-2 border-blue-50 bg-blue-50/30">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4"><MapPin className="w-6 h-6"/></div>
                <h3 className="font-bold text-lg text-farm-dark">📍 Pickup from Farm</h3>
                <p className="text-sm text-gray-600 mt-2">You arrange your own transport and pick it up from the farm in {crop.farmer.location.district}.</p>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <span className="font-bold text-blue-700">Free</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-3 border-t border-gray-200 bg-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:bottom-auto md:right-8 md:top-24 md:w-80 md:border-none md:bg-transparent md:shadow-none">
        <button
          onClick={() => addToCart(crop, crop.minOrderQty || 1)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-farm-green py-4 text-lg font-bold text-white shadow-lg shadow-green-200 transition-all hover:-translate-y-1 hover:bg-farm-dark md:py-5"
        >
          <ShoppingCart className="w-5 h-5" /> Add to Cart
        </button>
        <Link to="/buyer/cart" className="w-full rounded-xl border border-green-100 bg-white px-4 py-3 text-center text-sm font-semibold text-farm-dark transition-colors hover:bg-green-50">
          Go to Cart
        </Link>
      </div>

    </div>
  );
};
