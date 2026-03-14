import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { formatINR } from '../../utils/formatCurrency';

export const BuyerCart = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateCartQuantity, removeFromCart, checkout } = useBuyerCart();

  const handleCheckout = () => {
    const createdOrders = checkout();
    if (createdOrders.length > 0) {
      navigate('/buyer/orders');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a]">Your Cart</p>
          <h1 className="font-display text-3xl font-bold text-farm-dark">Ready for checkout</h1>
        </div>
        <p className="text-sm text-gray-500">{cartItems.length} item{cartItems.length === 1 ? '' : 's'} selected from the marketplace</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-green-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-farm-green">
            <ShoppingCart size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold text-farm-dark">Your cart is empty</h2>
          <p className="mt-2 text-sm text-gray-500">Browse fresh crops from farmers and add them here.</p>
          <button
            onClick={() => navigate('/buyer/marketplace')}
            className="mt-6 rounded-2xl bg-farm-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-farm-dark"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="grid gap-4 rounded-3xl border border-green-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[120px_1fr_auto]"
              >
                <div className="h-28 overflow-hidden rounded-2xl bg-green-50">
                  {item.images?.[0]?.url ? (
                    <img src={item.images[0].url} alt={item.cropName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🌾</div>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-farm-dark">{item.cropName}</h2>
                  <p className="text-sm font-medium text-[#8a5a2b]">{item.farmer?.name || 'Verified Farmer'}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.farmer?.location?.district || 'Local farm'} · {formatINR(item.pricePerKg)}/kg</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f7fbf4] px-2 py-1">
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                      className="rounded-full p-1 text-farm-dark transition-colors hover:bg-green-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-12 text-center text-sm font-bold text-farm-dark">{item.quantity} kg</span>
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                      className="rounded-full p-1 text-farm-dark transition-colors hover:bg-green-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 sm:items-end">
                  <p className="text-xl font-bold text-farm-green">{formatINR(item.quantity * item.pricePerKg)}</p>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl border border-[#e8decb] bg-[#fcfaf5] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a]">Order Summary</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-farm-dark">Checkout</h2>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-farm-dark">{formatINR(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Service</span>
                <span className="font-semibold text-farm-dark">Free</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-farm-dark">Calculated by farmer</span>
              </div>
            </div>
            <div className="my-5 h-px bg-[#e8decb]" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-2xl font-bold text-farm-green">{formatINR(cartTotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="mt-6 w-full rounded-2xl bg-farm-green px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-farm-dark"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};