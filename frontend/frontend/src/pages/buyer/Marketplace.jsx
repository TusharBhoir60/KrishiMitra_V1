import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Search, SlidersHorizontal, MapPin, Star, ShoppingCart, Leaf } from 'lucide-react';

const CropCard = ({ crop }) => {
  const navigate = useNavigate();
  const { addToCart } = useBuyerCart();

  return (
    <div onClick={() => navigate(`/buyer/crops/${crop._id}`)} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-green-50 to-[#eee2ca]">
        {crop.images?.length > 0 ? (
          <img src={crop.images[0].url} alt={crop.cropName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🌱</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          <Badge type="grade" value={crop.grade} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a5a2b]">
            <Leaf size={10} /> Fresh Harvest
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-display text-2xl font-bold text-farm-dark">{crop.cropName}</h3>
            <p className="mt-1 text-sm font-medium text-[#8a5a2b]">{crop.farmer?.name || 'Verified Farmer'}</p>
          </div>
          <span className="shrink-0 rounded-2xl bg-green-50 px-3 py-2 text-lg font-bold text-farm-green">{formatINR(crop.pricePerKg)}/kg</span>
        </div>
        
        <p className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="h-4 w-4" /> {crop.farmer?.location?.district || 'Village market'}
        </p>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="rounded-2xl bg-[#f7fbf4] p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Available</p>
            <p className="font-semibold text-farm-dark">{crop.availableQty} kg</p>
          </div>
          <div className="rounded-2xl bg-[#fcfaf5] p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Minimum</p>
            <p className="font-semibold text-farm-dark">{crop.minOrderQty} kg</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1 text-sm text-amber-600">
          <Star size={15} className="fill-current" />
          <span className="font-semibold">{crop.farmer?.rating || crop.rating || '4.8'}</span>
          <span className="text-gray-400">trusted by local buyers</span>
        </div>
        
        <div className="mt-auto pt-5">
          <button
            onClick={(event) => {
              event.stopPropagation();
              addToCart(crop, crop.minOrderQty || 1);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-farm-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-farm-dark"
          >
            <ShoppingCart size={16} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filters = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Platform Assured'];
  const activeFilter = searchParams.get('category') || 'All';

  useEffect(() => {
    let timeoutId;
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const params = { status: 'active' };
        if (activeFilter !== 'All') {
          if (activeFilter === 'Platform Assured') params.platformTransporter = true;
          else params.category = activeFilter.slice(0, -1).toLowerCase();
        }
        if (search) params.search = search;
        
        const res = await cropsApi.getListings(params);
        setCrops(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load crops:", err);
      } finally {
        setLoading(false);
      }
    };
    
    timeoutId = setTimeout(fetchCrops, 400); // Debounce
    return () => clearTimeout(timeoutId);
  }, [activeFilter, search]);

  return (
    <div className="pb-10 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-[linear-gradient(135deg,#1b4332_0%,#52b788_100%)] px-6 py-8 text-white shadow-lg shadow-green-100 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-100">Buyer Marketplace</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Fresh crops from local farmers</h1>
          <p className="mt-2 max-w-2xl text-sm text-green-50/90 sm:text-base">
            Browse verified listings, compare prices, and add produce to your cart for a simple farm-to-home checkout.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="sticky top-[84px] z-20 flex gap-2 md:static md:top-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search crops, farmers, or grades" className="w-full rounded-2xl border border-green-100 bg-white py-3 pl-12 pr-4 outline-none ring-0 transition-shadow focus:shadow-md" />
            </div>
            <button className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white px-4 py-3 font-medium text-gray-600 shadow-sm transition-colors hover:bg-green-50">
              <SlidersHorizontal className="h-5 w-5" /> <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button key={f} onClick={() => setSearchParams({ category: f })} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeFilter === f ? 'bg-farm-green text-white shadow-md shadow-green-100' : 'border border-green-100 bg-white text-gray-600 hover:bg-green-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-6 text-sm font-medium text-gray-500">{crops.length} products available now</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>
        ) : crops.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-green-100 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-farm-green"><Search className="h-8 w-8" /></div>
            <h3 className="font-display font-bold text-xl text-farm-dark mb-2">No crops found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map(crop => <CropCard key={crop._id} crop={crop} />)}
          </div>
        )}

      </div>
    </div>
  );
};
