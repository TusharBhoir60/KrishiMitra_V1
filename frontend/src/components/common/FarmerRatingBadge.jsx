import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const DEMO_REVIEW_DATA = {
  averageRating: 4.3,
  totalReviews: 128,
  breakdown: [
    { stars: 5, count: 80 },
    { stars: 4, count: 30 },
    { stars: 3, count: 12 },
    { stars: 2, count: 4 },
    { stars: 1, count: 2 },
  ],
  recentReviews: [
    {
      buyer: 'Ananya Sharma',
      rating: 5,
      comment: 'Fresh, neatly packed, and delivered on time. Felt like buying from a trusted local market.',
      date: '2 days ago',
    },
    {
      buyer: 'Rohit Verma',
      rating: 4,
      comment: 'Good quality produce and clear communication from the farmer throughout the order.',
      date: '6 days ago',
    },
    {
      buyer: 'Priya Desai',
      rating: 5,
      comment: 'Excellent farm-to-home experience. The vegetables were crisp and exactly as described.',
      date: '1 week ago',
    },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const renderStarFill = (fill, index) => {
  const percentage = clamp(fill, 0, 1) * 100;

  return (
    <span key={index} className="relative inline-flex h-5 w-5 sm:h-6 sm:w-6">
      <Star className="absolute inset-0 h-5 w-5 sm:h-6 sm:w-6 text-slate-200" aria-hidden="true" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${percentage}%` }}>
        <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]" aria-hidden="true" />
      </span>
    </span>
  );
};

const renderBuyerAvatar = (buyer) => {
  const initial = buyer.trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-black text-white shadow-sm shadow-emerald-500/20">
      {initial}
    </div>
  );
};

const renderMiniStars = (rating) => {
  return Array.from({ length: 5 }).map((_, index) => {
    const fill = clamp(rating - index, 0, 1);
    return (
      <span key={index} className="relative inline-flex h-3.5 w-3.5">
        <Star className="absolute inset-0 h-3.5 w-3.5 text-amber-100" aria-hidden="true" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
        </span>
      </span>
    );
  });
};

export const FarmerRatingBadge = ({ compact = false, className = '' } = {}) => {
  const { averageRating, totalReviews, breakdown, recentReviews } = DEMO_REVIEW_DATA;

  if (compact) {
    return (
      <div
        className={`rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm shadow-emerald-100/60 ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Farmer rating</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">{averageRating.toFixed(1)}</span>
              <div className="flex items-center gap-0.5">{renderStarFill(1, 0).slice ? null : null}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, index) => renderStarFill(clamp(averageRating - index, 0, 1), index))}</div>
            <p className="text-xs font-semibold text-slate-600">{totalReviews} reviews</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_70px_-35px_rgba(22,163,74,0.35)] ${className}`}
    >
      <div className="bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Farmer reputation</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Trusted by {totalReviews} buyers</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A quick snapshot of the farmer&apos;s marketplace reputation before you add to cart or complete checkout.
            </p>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-slate-900">{averageRating.toFixed(1)}</span>
              <div className="pb-1">
                <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => renderStarFill(clamp(averageRating - index, 0, 1), index))}</div>
                <p className="mt-1 text-sm font-semibold text-slate-600">{totalReviews} reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Rating breakdown</p>
              <p className="text-xs text-slate-500">Share of reviews by star level</p>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              Verified marketplace ratings
            </div>
          </div>

          <div className="space-y-3">
            {breakdown.map((item) => {
              const width = `${(item.count / totalReviews) * 100}%`;

              return (
                <div key={item.stars} className="flex items-center gap-3 text-sm">
                  <div className="flex w-12 items-center justify-end gap-0.5 font-semibold text-slate-700">
                    <span>{item.stars}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  </div>

                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width }}
                    />
                  </div>

                  <span className="w-12 text-right font-semibold text-slate-600">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Recent reviews</p>
              <p className="text-xs text-slate-500">3 most recent buyer experiences</p>
            </div>
            <Quote className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            {recentReviews.map((review) => (
              <article
                key={`${review.buyer}-${review.date}`}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {renderBuyerAvatar(review.buyer)}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h4 className="font-bold text-slate-900">{review.buyer}</h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{review.date}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-1">{renderMiniStars(review.rating)}</div>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FarmerRatingBadge;