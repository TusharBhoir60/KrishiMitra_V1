import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { formatINR } from '../../utils/formatCurrency';
import { Package, Truck } from 'lucide-react';

export const BuyerOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders } = useBuyerCart();
  
  const currentTab = searchParams.get('tab') || 'all';

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'active', label: 'In Progress' },
    { id: 'delivered', label: 'Delivered' }
  ];

  const filteredOrders = useMemo(() => {
    if (currentTab === 'delivered') {
      return orders.filter((order) => order.deliveryStatus === 'Delivered');
    }

    if (currentTab === 'active') {
      return orders.filter((order) => order.deliveryStatus !== 'Delivered');
    }

    return orders;
  }, [currentTab, orders]);

  const progressSteps = ['Order Placed', 'Packed', 'Out for Delivery', 'Delivered'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a]">Track Orders</p>
            <h1 className="text-3xl font-display font-bold text-farm-dark">Your purchases</h1>
          </div>
          <Link to="/buyer/marketplace" className="px-5 py-2.5 bg-green-50 text-farm-green font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-2">
            <Package className="w-4 h-4" /> Shop More
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSearchParams({ tab: tab.id })} className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${currentTab === tab.id ? 'bg-farm-green text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <div className="w-16 h-16 bg-green-50 text-farm-green rounded-full flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8" /></div>
            <h3 className="font-display font-bold text-xl text-farm-dark mb-2">No orders to track</h3>
            <p className="text-gray-500 mb-6">Checkout from the marketplace to start seeing progress updates here.</p>
            <Link to="/buyer/marketplace" className="inline-block px-6 py-3 bg-farm-green hover:bg-farm-dark text-white font-bold rounded-xl transition-colors">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const currentStepIndex = progressSteps.indexOf(order.deliveryStatus);

              return (
              <div key={order.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:border-green-200 hover:shadow-md group flex flex-col sm:flex-row gap-5">
                
                {/* Image Placeholder */}
                <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {order.image ? (
                    <img src={order.image} alt={order.cropName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🌾</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-farm-dark line-clamp-1">{order.cropName}</h3>
                      <p className="text-sm text-gray-500 mt-1">Sold by {order.farmerName}</p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-farm-green">{order.deliveryStatus}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
                    <span className="font-bold text-farm-dark">{formatINR(order.totalAmount)}</span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Package className="w-3.5 h-3.5"/> {order.quantity}kg</span>
                    <span className="text-gray-500">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-2">
                      {progressSteps.map((step, index) => {
                        const isDone = index <= currentStepIndex;
                        return (
                          <div key={step} className="flex flex-col items-center gap-2 text-center">
                            <div className={`h-3 w-3 rounded-full ${isDone ? 'bg-farm-green' : 'bg-gray-200'}`} />
                            <p className={`text-[11px] font-medium leading-tight ${isDone ? 'text-farm-dark' : 'text-gray-400'}`}>{step}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            );})}
          </div>
        )}
    </div>
  );
};
