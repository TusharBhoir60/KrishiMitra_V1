import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const FARMER_DEMO = {
  name: 'Sunil Patil',
  location: 'Nashik, Maharashtra',
  averageRating: 4.3,
  totalReviews: 128,
  breakdown: [
    { stars: 5, count: 80 },
    { stars: 4, count: 30 },
    { stars: 3, count: 12 },
    { stars: 2, count: 4 },
    { stars: 1, count: 2 },
  ],
  reviews: [
    {
      id: 'r1',
      buyer: 'Ananya Sharma',
      rating: 5,
      date: '2 days ago',
      comment: 'Fresh, neatly packed, and delivered on time. Felt like buying from a trusted local market.',
      cropName: 'Tomatoes',
      cropQty: '50kg',
    },
    {
      id: 'r2',
      buyer: 'Rohit Verma',
      rating: 4,
      date: '6 days ago',
      comment: 'Good quality produce and clear communication from the farmer throughout the order.',
      cropName: 'Wheat',
      cropQty: '100kg',
    },
    {
      id: 'r3',
      buyer: 'Priya Desai',
      rating: 5,
      date: '1 week ago',
      comment: 'Excellent farm-to-home experience. The vegetables were crisp and exactly as described.',
      cropName: 'Organic Spinach',
      cropQty: '20kg',
    },
    {
      id: 'r4',
      buyer: 'Karan Mehta',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Packaging was strong and the produce arrived in great condition. Would order again.',
      cropName: 'Onions',
      cropQty: '75kg',
    },
    {
      id: 'r5',
      buyer: 'Meera Iyer',
      rating: 5,
      date: '3 weeks ago',
      comment: 'Very reliable seller. Quality was consistently better than the nearby market.',
      cropName: 'Rice',
      cropQty: '80kg',
    },
    {
      id: 'r6',
      buyer: 'Amit Joshi',
      rating: 3,
      date: '3 weeks ago',
      comment: 'Overall good, but delivery took a little longer than expected. Crops were still fresh.',
      cropName: 'Potatoes',
      cropQty: '40kg',
    },
  ],
};

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest', label: 'Lowest Rated' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const starFill = (rating, index) => clamp(rating - index, 0, 1);

const renderStars = (rating) => {
  return Array.from({ length: 5 }).map((_, index) => {
    const fill = starFill(rating, index);

    return (
      <span key={index} className="relative inline-flex h-4 w-4 sm:h-5 sm:w-5">
        <Star className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 text-slate-200" aria-hidden="true" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]" aria-hidden="true" />
        </span>
      </span>
    );
  });
};

const renderAvatar = (name) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-black text-white shadow-sm shadow-emerald-500/20">
      {initial}
    </div>
  );
};

export const FarmerReviewsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const farmerName = location.state?.farmerName || FARMER_DEMO.name;
  const farmerLocation = location.state?.farmerLocation || FARMER_DEMO.location;
  const [sortBy, setSortBy] = useState('recent');

  const sortedReviews = useMemo(() => {
    const list = [...FARMER_DEMO.reviews];

    if (sortBy === 'highest') {
      return list.sort((left, right) => right.rating - left.rating);
    }

    if (sortBy === 'lowest') {
      return list.sort((left, right) => left.rating - right.rating);
    }

    return list;
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">Farmer reviews</p>
            <h1 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-2xl">{farmerName}</h1>
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{farmerLocation}</p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:flex">
            <Filter className="h-4 w-4" />
            {FARMER_DEMO.totalReviews} reviews
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_70px_-35px_rgba(22,163,74,0.28)]">
          <div className="bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-emerald-100">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">Average rating</p>
                  <div className="mt-1 flex items-end gap-3">
                    <span className="text-5xl font-black tracking-tight text-slate-900">{FARMER_DEMO.averageRating.toFixed(1)}</span>
                    <div className="pb-1">
                      <div className="flex items-center gap-0.5">{renderStars(FARMER_DEMO.averageRating)}</div>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{FARMER_DEMO.totalReviews} reviews</p>
                    </div>
                  </div>
                </div>

                <div className="hidden rounded-3xl border border-white/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Profile</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{farmerName}</p>
                  <p className="text-sm text-slate-500">{farmerLocation}</p>
                </div>
              </div>

              <div className="grid gap-2 rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm md:grid-cols-2">
                {FARMER_DEMO.breakdown.map((item) => {
                  const width = `${(item.count / FARMER_DEMO.totalReviews) * 100}%`;

                  return (
                    <div key={item.stars} className="flex items-center gap-3 text-sm">
                      <div className="flex w-14 items-center justify-end gap-0.5 font-semibold text-slate-700">
                        <span>{item.stars}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      </div>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-600">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-100 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                <Quote className="h-3.5 w-3.5" />
                Buyer feedback
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {SORT_OPTIONS.map((option) => {
                  const active = sortBy === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortBy(option.id)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
            <div className="max-h-[calc(100vh-22rem)] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-20rem)]">
              {sortedReviews.map((review, index) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {renderAvatar(review.buyer)}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-bold text-slate-900">{review.buyer}</h2>
                          <p className="text-xs font-medium text-slate-500">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {review.cropName} · {review.cropQty}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Showing {sortedReviews.length} reviews for <span className="font-semibold text-slate-700">{farmerName}</span>
          </p>
          <Link
            to="/buyer/marketplace"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Back to listing
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FarmerReviewsPage;