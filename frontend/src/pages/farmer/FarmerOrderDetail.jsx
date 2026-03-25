import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { useAuth } from '../../hooks/useAuth';
import { StatusProgress } from '../../components/ui/StatusProgress';
import { CostBreakdown } from '../../components/ui/CostBreakdown';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { getNextAction } from '../../utils/orderStatusHelpers';
import { formatDateTime } from '../../utils/formatDate';
import { Phone, MapPin, Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export const FarmerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await ordersApi.getOrderById(id);
      setOrder(res.data?.data);
    } catch (e) {
      toast.error('Order not found');
      navigate('/farmer/orders');
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
      if (actionStr === 'accept') {
        await ordersApi.acceptOrder(id);
        toast.success('Order accepted!');
      } else if (actionStr === 'decline') {
        if (!declineReason) return toast.error('Please provide a reason');
        await ordersApi.declineOrder(id, declineReason);
        toast.success('Order declined');
      } else if (actionStr === 'schedule-pickup') {
        if (!pickupDate || !pickupSlot) return toast.error('Select date and slot');
        await ordersApi.schedulePickup(id, { date: pickupDate, slot: pickupSlot });
        toast.success('Pickup slot scheduled for transporter');
      } else if (actionStr === 'dispatch') {
        await ordersApi.dispatchOrder(id);
        toast.success('Order marked as dispatched');
      } else if (actionStr === 'confirm-handoff') {
        await ordersApi.confirmHandoff(id);
        toast.success('Handoff to buyer confirmed');
      }
      fetchOrder();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update order');
    }
  };

  if (loading || !order) return <div className="p-6 grid gap-6 max-w-4xl mx-auto"><SkeletonCard/><SkeletonCard/></div>;

  const nextAction = getNextAction(order, 'farmer');

  // FIX: read from order.delivery.method instead of order.deliveryMethod
  const deliveryMethod = order.delivery?.method;

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const dayAfter = dayjs().add(2, 'day').format('YYYY-MM-DD');
  const slots = ['6:00 AM - 9:00 AM', '10:00 AM - 1:00 PM', '2:00 PM - 5:00 PM'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-display font-bold text-farm-dark">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          {order.status === 'pending' && <CountdownTimer deadline={order.acceptanceDeadline} />}
        </div>

        {/* Status Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          {/* FIX: pass delivery.method not deliveryMethod */}
          <StatusProgress currentStatus={order.status} deliveryMethod={deliveryMethod} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Buyer Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg border-b border-gray-100 pb-3 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-farm-green" /> Buyer Details</h3>
              {order.status === 'pending' ? (
                <div>
                  <p className="font-medium text-farm-dark text-lg">{order.buyer?.name}</p>
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">Contact details and full address will be revealed after you accept the order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-farm-dark text-lg">{order.buyer?.name}</p>
                      <p className="text-gray-600">{order.buyer?.location?.village}, {order.buyer?.location?.district}</p>
                    </div>
                    <a href={`tel:${order.buyer?.phone}`} className="w-10 h-10 bg-green-50 text-farm-green rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                  {/* FIX: use deliveryMethod variable */}
                  {(deliveryMethod === 'farmer_delivers' || deliveryMethod === 'platform_transporter') && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs uppercase font-bold text-gray-400 mb-1">Delivery Address</p>
                      <p className="text-farm-dark font-medium">{order.delivery?.buyerAddress}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION CENTER based on Status & Method */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-farm-green/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-farm-green"></div>
              
              {/* PENDING ACTIONS */}
              {order.status === 'pending' && (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-farm-dark">Action Required</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => handleAction('accept')} className="flex-1 py-3 bg-farm-green hover:bg-farm-dark text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Accept Order
                    </button>
                    <div className="flex-1 flex gap-2">
                      <input value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Reason for decline..." className="flex-1 border border-gray-300 rounded-xl px-3 outline-none focus:ring-2 focus:ring-red-200" />
                      <button onClick={() => handleAction('decline')} className="px-4 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FIX: use deliveryMethod variable for all checks below */}
              {order.status === 'accepted' && deliveryMethod === 'farmer_delivers' && (
                <div>
                  <h3 className="font-bold text-lg mb-2 text-farm-dark">🚜 Arrange Delivery</h3>
                  <p className="text-gray-600 mb-4">You chose to deliver this order yourself. Click below when you start the journey.</p>
                  <button onClick={() => handleAction('dispatch')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5" /> Mark as Dispatched
                  </button>
                </div>
              )}

              {order.status === 'accepted' && deliveryMethod === 'buyer_pickup' && (
                <div>
                  <h3 className="font-bold text-lg mb-2 text-farm-dark">📍 Awaiting Buyer Handoff</h3>
                  <p className="text-gray-600 mb-4">The buyer is responsible for picking this up from your farm. Once they physically collect the crops, confirm below.</p>
                  <button onClick={() => handleAction('confirm-handoff')} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Confirm Handoff Completed
                  </button>
                </div>
              )}

              {order.status === 'accepted' && deliveryMethod === 'platform_transporter' && (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-farm-dark flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Schedule Transporter Pickup</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
                    <div className="flex gap-2">
                      {[{d: today, l: 'Today'}, {d: tomorrow, l: 'Tomorrow'}, {d: dayAfter, l: 'Day After'}].map(opt => (
                        <button key={opt.d} onClick={() => setPickupDate(opt.d)} className={`flex-1 py-2 rounded-lg border font-medium ${pickupDate === opt.d ? 'bg-purple-100 border-purple-500 text-purple-800 ring-2 ring-purple-500/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Time Slot</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map(s => (
                        <button key={s} onClick={() => setPickupSlot(s)} className={`py-2 text-xs sm:text-sm rounded-lg border font-medium px-1 ${pickupSlot === s ? 'bg-purple-100 border-purple-500 text-purple-800 ring-2 ring-purple-500/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => handleAction('schedule-pickup')} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors">
                    Confirm Pickup Slot
                  </button>
                </div>
              )}

              {order.status === 'scheduled' && deliveryMethod === 'platform_transporter' && (
                <div className="text-center">
                  <h3 className="font-bold text-xl mb-1 text-farm-dark">Truck is Assigned</h3>
                  {/* FIX: use order.delivery.pickup.scheduledDate */}
                  <p className="text-gray-500 mb-6">Transporter will arrive on {formatDateTime(order.delivery?.pickup?.scheduledDate)}</p>
                  
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 inline-block">
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Verification OTP</p>
                    <div className="flex justify-center gap-3">
                      {/* FIX: use order.delivery.pickup.otpCode */}
                      {order.delivery?.pickup?.otpCode?.split('').map((digit, i) => (
                        <div key={i} className="w-14 h-16 bg-white border-2 border-green-500 rounded-xl flex items-center justify-center text-3xl font-bold text-green-700 shadow-sm">{digit}</div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-4 max-w-xs mx-auto">Show this 4-digit code to the transporter when loading the items into their truck.</p>
                  </div>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-8 h-8" /></div>
                  <h3 className="font-bold text-xl text-green-800 mb-2">Payment Released</h3>
                  <p className="text-gray-600">The order is completed and funds have been credited to your KrishiMitra wallet.</p>
                </div>
              )}
              
              {order.status === 'disputed' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5"/> Order Under Dispute</h3>
                  {/* FIX: use order.dispute.reason */}
                  <p className="text-sm text-red-700 mb-4">{order.dispute?.reason}</p>
                  <textarea placeholder="Submit your response / explanation to the platform admins..." className="w-full p-3 rounded-xl border border-red-200 outline-none focus:ring-2 focus:ring-red-400 text-sm mb-3" rows={3}></textarea>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm w-full">Submit Response to Admin</button>
                  <p className="text-xs text-red-500 mt-2 text-center">Platform Admin SLA: 48 Hours</p>
                </div>
              )}

              {['in_transit', 'delivered', 'declined', 'cancelled'].includes(order.status) && (
                <div className="text-center py-4">
                  <p className="text-gray-600 font-medium">Order is currently {order.status.replace('_', ' ')}.</p>
                  <p className="text-sm text-gray-500 mt-2">No further action required right now.</p>
                </div>
              )}
            </div>

            {/* Transporter Info if assigned */}
            {order.delivery?.pickup?.transporter && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700"><Truck className="w-6 h-6" /></div>
                  <div>
                    {/* FIX: use order.delivery.pickup.transporter.* */}
                    <h4 className="font-bold text-farm-dark">{order.delivery.pickup.transporter.companyName}</h4>
                    <p className="text-sm text-gray-500">Vehicle: {order.delivery.pickup.transporter.vehicleNumber}</p>
                  </div>
                </div>
                <a href={`tel:${order.delivery.pickup.transporter.phone}`} className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100"><Phone className="w-5 h-5 text-farm-dark" /></a>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Crop Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <img src={order.cropListing?.images?.[0]?.url || 'https://via.placeholder.com/400x200?text=Crop'} className="w-full h-32 object-cover rounded-xl mb-4" alt="crop" />
              {/* FIX: use order.orderDetails.* */}
              <h3 className="font-bold text-xl text-farm-dark mb-1">{order.orderDetails?.cropName}</h3>
              <p className="text-farm-green font-bold text-lg mb-4">₹{order.orderDetails?.pricePerKg}/kg</p>
              
              <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between"><span>Grade:</span> <span className="font-medium text-farm-dark">{order.orderDetails?.grade}</span></div>
                <div className="flex justify-between"><span>Quantity:</span> <span className="font-medium text-farm-dark">{order.orderDetails?.quantity}kg</span></div>
                <div className="flex justify-between"><span>Ordered on:</span> <span className="font-medium text-farm-dark">{formatDateTime(order.createdAt).split(',')[0]}</span></div>
              </div>
            </div>

            {/* FIX: use order.delivery.* and order.orderDetails.* for cost fields */}
            <CostBreakdown
              cropAmount={order.orderDetails?.cropAmount}
              deliveryFee={order.delivery?.deliveryFee}
              platformFee={order.delivery?.platformFee}
              totalAmount={order.delivery?.totalAmount}
            />
            
            {!['completed', 'cancelled', 'disputed', 'declined'].includes(order.status) && (
              <button onClick={() => navigate(`/farmer/orders/${id}/dispute`)} className="w-full py-3 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex justify-center items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Raise Issue / Dispute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};