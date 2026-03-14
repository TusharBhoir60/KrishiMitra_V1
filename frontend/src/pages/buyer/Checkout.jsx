import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  CreditCard,
  Smartphone,
  Banknote,
  Package,
  CheckCircle,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../hooks/useAuth';
import { formatINR } from '../../utils/formatCurrency';
import { calcTransportCost, getDistanceKm, estimatedDays } from '../../utils/transportCost';
import { useLanguage } from '../../context/LanguageContext';

const DELIVERY_METHODS = [
  {
    id: 'farmer_delivery',
    label: 'Farmer Delivery',
    desc: 'Farmer arranges delivery from the farm directly to your location.',
    icon: Truck,
    cost: 'Cost set by farmer',
  },
  {
    id: 'buyer_pickup',
    label: 'Farm Pickup',
    desc: 'Collect the produce directly from the farm at your convenience.',
    icon: Store,
    cost: 'Free',
  },
  {
    id: 'krishimitra_transport',
    label: 'KrishiMitra Transport',
    desc: 'Platform-managed logistics with real-time cost based on distance.',
    icon: Package,
    cost: 'Calculated by distance',
  },
];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
];

const resolveId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value._id || value.id || value.userId || '');
};

export const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useBuyerCart();
  const { placeOrder } = useOrders();

  const [deliveryMethod, setDeliveryMethod] = useState('farmer_delivery');
  const [address, setAddress] = useState(
    user?.location?.district ? `${user.location.district}, Maharashtra` : ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '' });
  const [isPlacing, setIsPlacing] = useState(false);

  // Per-item transport cost when KrishiMitra Transport is selected
  const transportBreakdown = useMemo(() => {
    if (deliveryMethod !== 'krishimitra_transport') return [];
    const buyerDistrict = user?.location?.district;
    return cartItems.map((item) => {
      const farmerDistrict = item.farmer?.location?.district;
      const km = getDistanceKm(farmerDistrict, buyerDistrict);
      const cost = calcTransportCost(farmerDistrict, buyerDistrict, item.quantity);
      const days = km !== null ? estimatedDays(km) : null;
      return { id: item._id, cost, km, days, farmerDistrict, buyerDistrict };
    });
  }, [deliveryMethod, cartItems, user]);

  const totalTransport = useMemo(
    () => transportBreakdown.reduce((sum, t) => sum + t.cost, 0),
    [transportBreakdown]
  );

  const grandTotal = cartTotal + totalTransport;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error(t('buyer.checkout.address'));
      return;
    }
    if (!phone.trim()) {
      toast.error(t('buyer.checkout.phone'));
      return;
    }
    if (cartItems.length === 0) {
      toast.error(t('buyer.checkout.emptyCartTitle'));
      navigate('/buyer/cart');
      return;
    }

    setIsPlacing(true);
    try {
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const tb = transportBreakdown.find((t) => t.id === item._id);
        const itemTransportCost = tb?.cost ?? 0;
        const productTotal = item.quantity * item.pricePerKg;
        const buyerId = resolveId(user);
        const farmerId = resolveId(item.farmer) || resolveId(item.farmerId) || resolveId(item.userId);
        if (!farmerId) {
          toast.error(`Missing farmer ID for ${item.cropName}.`);
          continue;
        }

        placeOrder({
          buyerId: buyerId || 'demo-buyer',
          buyerName: user?.name || 'Buyer',
          buyerAddress: address,
          buyerPhone: phone,
          buyerDistrict: user?.location?.district || '',
          farmerId,
          farmerName: item.farmer?.name || 'Verified Farmer',
          farmerDistrict: item.farmer?.location?.district || '',
          cropListingId: item._id,
          cropName: item.cropName,
          productName: item.cropName,
          image: item.images?.[0]?.url || '',
          quantity: item.quantity,
          pricePerKg: item.pricePerKg,
          price: item.pricePerKg,
          productTotal,
          deliveryMethod,
          deliveryInstructions: instructions,
          transportCost: itemTransportCost,
          totalAmount: productTotal + itemTransportCost,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
          estimatedDeliveryDays: tb?.days ?? null,
          distanceKm: tb?.km ?? null,
        });
      }

      clearCart();
      toast.success(`${cartItems.length} order${cartItems.length > 1 ? 's' : ''} placed!`);
      navigate('/buyer/orders');
    } finally {
      setIsPlacing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-farm-dark mb-2">{t('buyer.checkout.emptyCartTitle')}</h2>
        <p className="text-gray-500 mb-6">{t('buyer.checkout.emptyCartSub')}</p>
        <button
          onClick={() => navigate('/buyer/marketplace')}
          className="bg-farm-green text-white px-6 py-3 rounded-2xl font-bold hover:bg-farm-dark transition-colors"
        >
          {t('common.browseMarketplace')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/buyer/cart')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-farm-green mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> {t('buyer.checkout.backToCart')}
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a]">{t('buyer.checkout.secureCheckout')}</p>
        <h1 className="font-display text-3xl font-bold text-farm-dark">{t('buyer.checkout.completeOrder')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {cartItems.length} item{cartItems.length > 1 ? 's' : ''} {t('buyer.checkout.itemsReady')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* ── Section A: Delivery Method ── */}
          <section className="bg-white rounded-3xl border border-green-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                A
              </div>
              <h2 className="font-display text-xl font-bold text-farm-dark">{t('buyer.checkout.deliveryMethod')}</h2>
            </div>

            <div className="space-y-3">
              {DELIVERY_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = deliveryMethod === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-farm-green bg-green-50/60'
                        : 'border-gray-100 hover:border-green-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={m.id}
                      checked={isSelected}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="mt-1 accent-farm-green shrink-0"
                    />
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-farm-green text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-farm-dark">{m.label}</p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            m.id === 'buyer_pickup'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {m.cost}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* KrishiMitra Transport estimate */}
            {deliveryMethod === 'krishimitra_transport' && (
              <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 p-4 space-y-3">
                {transportBreakdown.map((tb, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-semibold text-blue-800">
                      {cartItems.find((c) => c._id === tb.id)?.cropName}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-1 text-blue-700">
                      {tb.farmerDistrict && tb.buyerDistrict && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {tb.farmerDistrict} → {tb.buyerDistrict}
                          {tb.km !== null && <span className="ml-1 text-blue-500">~{tb.km} km</span>}
                        </span>
                      )}
                      {tb.days && (
                        <span className="flex items-center gap-1">
                          <Truck size={13} />
                          {tb.days} days
                        </span>
                      )}
                      <span className="font-bold">Transport: {formatINR(tb.cost)}</span>
                    </div>
                  </div>
                ))}
                {transportBreakdown.length === 0 && (
                  <p className="text-sm text-blue-700">
                    Update your profile district to see transport estimate.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Section B: Address & Delivery Details ── */}
          <section className="bg-white rounded-3xl border border-green-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                B
              </div>
              <h2 className="font-display text-xl font-bold text-farm-dark">{t('buyer.checkout.deliveryDetails')}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                  <MapPin size={14} className="text-farm-green" />
                  {t('buyer.checkout.address')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="House / Plot No., Street, District, State, PIN"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                  <Phone size={14} className="text-farm-green" />
                  {t('buyer.checkout.phone')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                  <MessageSquare size={14} className="text-farm-green" />
                  {t('buyer.checkout.instructions')}
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="E.g., Leave at gate, call before delivery, preferred timing..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── Section C: Payment Gateway ── */}
          <section className="bg-white rounded-3xl border border-green-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                C
              </div>
              <h2 className="font-display text-xl font-bold text-farm-dark">{t('buyer.checkout.payment')}</h2>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-farm-green bg-green-50 text-farm-green'
                        : 'border-gray-100 text-gray-400 hover:border-green-200'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-bold leading-tight text-center">{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI form */}
            {paymentMethod === 'upi' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                />
                <p className="text-xs text-gray-400">
                  * Mock UPI — no real transaction is processed in this demo.
                </p>
              </div>
            )}

            {/* Card form */}
            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="1234  5678  9012  3456"
                    maxLength={19}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Holder Name</label>
                  <input
                    type="text"
                    value={card.holder}
                    onChange={(e) => setCard({ ...card, holder: e.target.value })}
                    placeholder="Name as on card"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry</label>
                    <input
                      type="text"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      placeholder="MM / YY"
                      maxLength={7}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV</label>
                    <input
                      type="password"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-farm-green focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  * Mock card — no real transaction occurs in this demo.
                </p>
              </div>
            )}

            {/* CoD notice */}
            {paymentMethod === 'cod' && (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <Banknote size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Cash on Delivery</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Payment collected upon delivery. Please keep exact change ready.
                    Order is placed first and confirmed after farmer approval.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Right column: Summary & CTA ── */}
        <div className="space-y-4 lg:sticky lg:top-4 h-fit">
          {/* Cart items preview */}
          <div className="bg-white rounded-3xl border border-[#e8decb] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a] mb-3">
              {t('buyer.checkout.orderItems')}
            </p>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 overflow-hidden shrink-0">
                    {item.images?.[0]?.url ? (
                      <img
                        src={item.images[0].url}
                        alt={item.cropName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">🌾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-farm-dark truncate">{item.cropName}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} kg × {formatINR(item.pricePerKg)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-farm-green shrink-0">
                    {formatINR(item.quantity * item.pricePerKg)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-[#fcfaf5] rounded-3xl border border-[#e8decb] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a] mb-4">
              {t('buyer.checkout.priceSummary')}
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t('buyer.checkout.productTotal')}</span>
                <span className="font-semibold text-farm-dark">{formatINR(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('buyer.checkout.transportCost')}</span>
                <span
                  className={`font-semibold ${
                    totalTransport === 0 ? 'text-green-600' : 'text-farm-dark'
                  }`}
                >
                  {totalTransport === 0 ? 'Free' : formatINR(totalTransport)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('buyer.checkout.platformFee')}</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
            </div>

            <div className="my-4 h-px bg-[#e8decb]" />

            <div className="flex justify-between items-center mb-5">
              <span className="font-semibold text-gray-700">{t('buyer.checkout.totalPayable')}</span>
              <span className="text-2xl font-bold text-farm-green">{formatINR(grandTotal)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full rounded-2xl bg-farm-green px-5 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-farm-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2 shadow-lg shadow-farm-green/25"
            >
              {isPlacing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('buyer.checkout.placingOrder')}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('buyer.checkout.placeOrder')}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
              {t('buyer.checkout.pendingNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
