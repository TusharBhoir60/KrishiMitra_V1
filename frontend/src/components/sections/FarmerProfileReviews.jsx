import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ratingLabel = (rating) => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Very Good';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Fair';
  return 'Needs work';
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const renderStars = (rating) => {
  return Array.from({ length: 5 }).map((_, index) => {
    const fill = clamp(rating - index, 0, 1);

    return (
      <span key={index} className="relative inline-flex h-4 w-4">
        <Star className="absolute inset-0 h-4 w-4 text-slate-200" aria-hidden="true" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]" aria-hidden="true" />
        </span>
      </span>
    );
  });
};

export const FarmerProfileReviews = ({
  farmerId,
  farmerName,
  farmerLocation,
  className = '',
}) => {
  const [data, setData] = useState({ avgRating: 0, totalReviews: 0, reviews: [] });
  const [loading, setLoading] = useState(Boolean(farmerId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmerId) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`/api/reviews/farmer/${farmerId}`);
        setData(response.data || { avgRating: 0, totalReviews: 0, reviews: [] });
      } catch {
        setError('Could not load buyer reviews right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [farmerId]);

  const visibleReviews = useMemo(() => (data.reviews || []).slice(0, 3), [data.reviews]);
  const summaryStars = useMemo(() => data.avgRating || 0, [data.avgRating]);
  const totalReviews = data.totalReviews || 0;
  const averageText = summaryStars > 0 ? summaryStars.toFixed(1) : '0.0';

  const reviewsLink = farmerId ? `/buyer/farmers/${farmerId}/reviews` : '/buyer/marketplace';

  return (
    <section className={`rounded-2xl border border-emerald-100 bg-white shadow-sm ${className}`}>
      <div className="border-b border-emerald-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <h2 className="text-sm font-bold text-farm-dark">Buyer Reviews</h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Reputation snapshot for {farmerName || 'this farmer'}{farmerLocation ? ` · ${farmerLocation}` : ''}
        </p>
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-20 rounded-2xl bg-gray-50 animate-pulse" />
            <div className="space-y-3">
              <div className="h-20 rounded-2xl bg-gray-50 animate-pulse" />
              <div className="h-20 rounded-2xl bg-gray-50 animate-pulse" />
              <div className="h-20 rounded-2xl bg-gray-50 animate-pulse" />
            </div>
          </div>
        ) : (
          error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 px-4 py-5 ring-1 ring-emerald-100">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">Average rating</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-farm-dark">{averageText}</span>
                    <div className="pb-1">
                      <div className="flex items-center gap-0.5">{renderStars(summaryStars)}</div>
                      <p className="mt-1 text-xs font-semibold text-gray-600">
                        {totalReviews} review{totalReviews === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">{ratingLabel(summaryStars)}</p>
                </div>

                <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const row = (data.reviews || []).filter((review) => Math.round(review.rating) === stars).length;
                    const width = totalReviews ? `${(row / totalReviews) * 100}%` : '0%';

                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="flex w-11 items-center justify-end gap-0.5 font-semibold text-gray-700">
                          <span>{stars}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width }} />
                        </div>
                        <span className="w-8 text-right font-semibold text-gray-500">{row}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(visibleReviews || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-4 text-sm text-emerald-700">
                    No reviews yet. Buyers will see reviews here after the first completed order.
                  </div>
                ) : (
                  visibleReviews.map((review) => {
                    const buyerName = review.buyer?.name || 'Anonymous';
                    const buyerInitial = buyerName.charAt(0).toUpperCase();
                    const reviewDate = formatDate(review.createdAt);

                    return (
                      <article key={review._id} className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-black text-white">
                            {buyerInitial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-farm-dark">{buyerName}</p>
                                <p className="text-xs font-medium text-gray-500">{reviewDate}</p>
                              </div>
                              <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                            </div>

                            {review.comment && (
                              <p className="mt-2 text-sm leading-6 text-gray-600">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )
        )}

        <Link
          to={reviewsLink}
          state={{ farmerName, farmerLocation }}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-farm-green px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-farm-mid"
        >
          See all {totalReviews} reviews
        </Link>
      </div>
    </section>
  );
};

export default FarmerProfileReviews;