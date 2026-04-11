import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Plus, Edit2, Trash2, Package, TrendingUp, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export const MyListings = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await cropsApi.getMyListings();
      setListings(res.data?.data || []);
    } catch {
      toast.error(t('farmer.listings.loadingFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('farmer.listings.deleteConfirm'))) return;
    try {
      await cropsApi.deleteListing(id);
      toast.success(t('farmer.listings.deleted'));
      fetchListings();
    } catch {
      toast.error(t('farmer.listings.deleteFailed'));
    }
  };

  const filters = ['all', 'active', 'inactive', 'sold_out'];
  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter);
  const dateLocale = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'mr' ? 'mr-IN' : 'en-IN';

  if (loading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-farm-dark">{t('farmer.listings.title')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t('farmer.listings.summary', { total: listings.length, active: listings.filter(l => l.status === 'active').length })}</p>
          </div>
          <Link
            to="/farmer/listings/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-farm-green hover:bg-farm-dark text-white font-medium rounded-xl transition-colors shadow-md shadow-farm-green/25 text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={17} /> {t('farmer.listings.addNewCrop')}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Layers,     label: t('farmer.listings.total'),    value: listings.length,                             color: 'text-gray-700  bg-gray-50  border-gray-100'   },
            { icon: TrendingUp, label: t('farmer.listings.active'),   value: listings.filter(l => l.status==='active').length,    color: 'text-farm-green bg-green-50 border-green-100'  },
            { icon: Package,    label: t('farmer.listings.soldOut'), value: listings.filter(l => l.status==='sold_out').length,  color: 'text-red-600 bg-red-50 border-red-100'        },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 p-4 rounded-xl border ${s.color}`}>
              <s.icon size={18} />
              <div>
                <p className="text-xs font-medium opacity-70">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border ${
                filter === f
                  ? 'bg-farm-green text-white border-farm-green shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? t('farmer.listings.all') : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🌾</div>
            <h3 className="font-bold text-xl text-farm-dark mb-2">
              {filter === 'all'
                ? t('farmer.listings.noListingsYet')
                : t('farmer.listings.noListingsForFilter', { filter: filter.replace('_', ' ') })}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
              {filter === 'all' ? t('farmer.listings.buyersWaiting') : t('farmer.listings.tryDifferentFilter')}
            </p>
            {filter === 'all' && (
              <Link
                to="/farmer/listings/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-farm-green text-white font-medium rounded-xl hover:bg-farm-dark transition-colors"
              >
                <Plus size={17} /> {t('farmer.listings.createFirstListing')}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => (
              <div
                key={listing._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
              >
                {/* Image */}
                <div className="h-44 bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.cropName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🌱</div>
                  )}
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge type="grade" value={listing.grade} />
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      listing.status === 'active' ? 'bg-green-500 text-white' :
                      listing.status === 'sold_out' ? 'bg-red-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {listing.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <span className="font-bold text-farm-green text-sm">{formatINR(listing.pricePerKg)}<span className="font-normal text-gray-500 text-xs">/kg</span></span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-farm-dark mb-1 line-clamp-1">{listing.cropName}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">{t('farmer.listings.totalQty')}</p>
                      <p className="font-semibold text-farm-dark">{listing.quantity} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">{t('farmer.listings.available')}</p>
                      <p className="font-semibold text-farm-dark">{listing.availableQty} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">{t('farmer.listings.minOrder')}</p>
                      <p className="font-semibold text-farm-dark">{listing.minOrderQty} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">{t('farmer.listings.harvest')}</p>
                      <p className="font-semibold text-farm-dark">
                        {listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString(dateLocale, { day:'numeric', month:'short' }) : '–'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => navigate(`/farmer/listings/${listing._id}/edit`)}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-farm-pale hover:bg-green-100 text-farm-green font-semibold rounded-xl text-sm transition-colors"
                    >
                      <Edit2 size={15} /> {t('farmer.listings.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(listing._id)}
                      className="px-3.5 py-2.5 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-xl transition-colors"
                      title={t('farmer.listings.deleteListing')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
