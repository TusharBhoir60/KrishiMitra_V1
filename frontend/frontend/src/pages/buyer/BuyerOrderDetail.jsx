import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { Badge } from '../../components/ui/Badge';
import { CostBreakdown } from '../../components/ui/CostBreakdown';
import { StatusProgress } from '../../components/ui/StatusProgress';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { getNextAction } from '../../utils/orderStatusHelpers';
import { formatDateTime } from '../../utils/formatDate';
import { ShoppingBag, Truck, CheckCircle, Navigation, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const BuyerOrderDetail = () => {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await ordersApi.getOrderById(id);
      setOrder(res.data?.data);
    } catch (e) {
      toast.error('Order not found');
      navigate('/buyer/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (actionStr) => {
    try {
      if (actionStr === 'cancel') {
        if(window.confirm('Cancel this pending order?')) {
          await ordersApi.declineOrder(id, 'Buyer cancelled request'); // Reusing decline endpoint for cancellation logic since buyer cancels
          toast.success('Order cancelled');
        }
      } else if (actionStr === 'confirm-received') {
        setShowReview(true);
      }
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await ordersApi.confirmReceived(id, { rating: 5, review: e.target.review.value });
      toast.success('Order completed and payment released!');
      setShowReview(false);
      fetchOrder();
    } catch (err) {
      toast.error('Failed to confirm receipt');
    }
  };

  if (loading || !order) return <div className="p-6 grid gap-6 max-w-4xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-display font-bold text-farm-dark">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm mt-1">{formatDateTime(order.createdAt).split(',')[0]}</p>
          </div>
          {order.status === 'pending' && <button onClick={() => handleAction('cancel')} className="text-red-500 font-medium hover:text-red-700 text-sm border border-red-200 px-4 py-2 rounded-lg">Cancel Request</button>}
        </div>

        {/* Status Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <StatusProgress currentStatus={order.status} deliveryMethod={order.deliveryMethod} />
        </div>

        {/* Action center depending on status */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-500/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          
          {order.status === 'pending' && (
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-farm-dark">Waiting for Farmer</h3>
              <p className="text-gray-600 mb-4">Your order request has been sent to {order.farmer?.name}. They have 12 hours to respond.</p>
              <div className="inline-block"><CountdownTimer deadline={order.acceptanceDeadline} /></div>
            </div>
          )}

          {order.status === 'accepted' && order.deliveryMethod === 'farmer_delivers' && (
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-farm-dark">Farmer is preparing delivery</h3>
              <p className="text-gray-600">The farmer will deliver the items to your address on {formatDateTime(order.preferredDate).split(',')[0]}.</p>
            </div>
          )}

          {order.status === 'accepted' && order.deliveryMethod === 'buyer_pickup' && (
            <div className="p-6">
              <h3 className="font-bold text-lg mb-3 text-farm-dark flex items-center gap-2"><MapPin className="text-blue-500 w-5 h-5"/> Collect your crop</h3>
              <p className="font-medium text-farm-dark bg-gray-50 p-4 border border-gray-200 rounded-xl mb-4">{order.farmer?.location?.address || `${order.farmer?.location?.village}, ${order.farmer?.location?.district}`}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.farmer?.location?.village + ' ' + order.farmer?.location?.district)}`} target="_blank" rel="noreferrer" className="inline-flex py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md gap-2 items-center">
                <Navigation className="w-5 h-5" /> Get Directions
              </a>
            </div>
          )}

          {order.status === 'scheduled' && order.deliveryMethod === 'platform_transporter' && (
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-farm-dark">Pickup Scheduled</h3>
              <p className="text-gray-600">The transporter will pick up the crop on {formatDateTime(order.pickupDetails?.date).split(',')[0]} at {order.pickupDetails?.slot}.</p>
              <div className="mt-4 p-4 border border-purple-200 bg-purple-50 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-600"><Truck className="w-6 h-6"/></div>
                <div>
                  <p className="font-bold text-purple-900">{order.transporter?.name}</p>
                  <p className="text-sm text-purple-800 tracking-wider font-mono">{order.transporter?.vehicleNumber}</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'in_transit' && (
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-farm-dark flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500"/> Order is on the way!</h3>
              <div className="relative pl-6 space-y-4 mt-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-100"></div>
                  <p className="font-medium text-farm-dark">Picked up from farm</p>
                  <p className="text-xs text-gray-500">Confirmed by OTP</p>
                </div>
                
                <div className="relative pt-2">
                  <div className="absolute -left-[23px] top-3 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-100 animate-pulse"></div>
                  <p className="font-medium text-farm-dark text-blue-700">In transit to your address</p>
                  <p className="text-xs text-blue-500 font-bold mt-1">Expected delivery today</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'delivered' && !showReview && (
            <div className="p-6 bg-green-50">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 border-2 border-green-500"><CheckCircle className="w-8 h-8"/></div>
              <h3 className="font-bold text-2xl mb-2 text-green-900">Your order has arrived! 🎉</h3>
              <div className="text-sm text-green-800 mb-6 space-y-2 font-medium">
                <p>□ Check quantity: {order.quantity}kg</p>
                <p>□ Check quality: Grade {order.grade}</p>
              </div>
              
              <button onClick={() => handleAction('confirm-received')} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 text-lg transition-transform hover:-translate-y-1">
                ✓ Confirm Received · Release Payment
              </button>
              
              <p className="text-xs text-green-700 font-medium text-center mt-4 uppercase tracking-widest">
                Auto-releases in 48 hours
              </p>
            </div>
          )}

          {showReview && (
            <div className="p-6 bg-green-50">
              <h3 className="font-bold text-xl mb-4 text-green-900">Rate your experience</h3>
              <form onSubmit={submitReview}>
                <div className="bg-white p-4 rounded-xl border border-green-200 mb-4">
                  <p className="font-bold mb-2">Rate Farmer ({order.farmer?.name})</p>
                  <div className="flex gap-2 text-3xl text-amber-400 mb-2 cursor-pointer">★★★★★</div>
                  <textarea name="review" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm" placeholder="Write a review..."></textarea>
                </div>
                <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">Submit Review & Finish</button>
              </form>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6"/></div>
                <div>
                  <h3 className="font-bold text-xl text-green-800">Order Completed</h3>
                  <p className="text-green-700 text-sm">Thank you for purchasing on KrishiMitra.</p>
                </div>
              </div>
              <button onClick={() => navigate(`/buyer/crops/${order.listing?._id}`)} className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-100">Buy Again</button>
            </div>
          )}

          {order.status === 'disputed' && (
            <div className="p-6 bg-red-50 text-red-900 border-2 border-red-200">
              <h3 className="font-bold text-xl mb-2">Order Under Dispute</h3>
              <p className="text-sm">Our admin team is investigating the issue. SLAs guarantee a response within 48 hours.</p>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-farm-dark border-b border-gray-100 pb-2">Farmer</h3>
            <p className="font-medium text-lg text-farm-dark">{order.farmer?.name}</p>
            <p className="text-gray-500 mb-3">{order.farmer?.location?.district}</p>
            {order.status !== 'pending' && <p className="font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 truncate">{order.farmer?.phone}</p>}
          </div>

          <CostBreakdown cropAmount={order.cropAmount} deliveryFee={order.deliveryFee} platformFee={order.platformFee} totalAmount={order.totalAmount} />
        </div>

      </div>
    </div>
  );
};
