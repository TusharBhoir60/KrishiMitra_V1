import { useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Star } from 'lucide-react';

const REVIEW_COPY = {
  1: { label: 'Poor', note: 'Something felt off with the delivery.' },
  2: { label: 'Fair', note: 'It was okay, but needs improvement.' },
  3: { label: 'Good', note: 'A solid experience overall.' },
  4: { label: 'Great', note: 'Fast, fresh, and dependable.' },
  5: { label: 'Excellent', note: 'A top-tier farm-to-table experience.' },
};

const SAMPLE_REVIEW = {
  buyerName: 'Aarav Sharma',
  farmerName: 'Sunil Patil',
  cropName: 'Organic Tomatoes',
  orderId: 'KM-24816',
  deliveredAt: 'Delivered today at 6:40 PM',
};

const DEFAULT_SUCCESS_DELAY = 1100;

export default function ReviewForm({ farmerId, orderId, onSuccess } = {}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const activeRating = hoveredRating || rating;
  const currentCopy = REVIEW_COPY[activeRating] || {
    label: 'Tap to rate',
    note: 'Tell us how your delivery went.',
  };

  const scorePercent = useMemo(() => (rating ? `${(rating / 5) * 100}%` : '0%'), [rating]);

  const submitReview = async (payload) => {
    const hasRealTarget = Boolean(payload.farmerId && payload.orderId);

    if (hasRealTarget) {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/reviews',
        {
          farmerId: payload.farmerId,
          orderId: payload.orderId,
          rating: payload.rating,
          comment: payload.comment,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 650));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!rating) {
      setError('Please choose a star rating before submitting.');
      return;
    }

    setLoading(true);

    try {
      await submitReview({
        farmerId,
        orderId,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);
      window.setTimeout(() => {
        onSuccess?.({
          rating,
          comment: comment.trim(),
        });
      }, DEFAULT_SUCCESS_DELAY);
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_20px_70px_-30px_rgba(22,163,74,0.45)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50" />
        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 14 }}
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-200/80"
          >
            <CheckCircle2 className="h-11 w-11" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Order feedback saved
          </motion.div>

          <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Review Submitted! 🌾</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Thanks for helping farmers like {SAMPLE_REVIEW.farmerName} build trust through every delivery.
          </p>

          <div className="mt-5 flex w-full items-center justify-between rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-left shadow-sm backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Your rating</p>
              <p className="mt-1 text-base font-bold text-slate-900">{rating} / 5 - {REVIEW_COPY[rating]?.label || 'Excellent'}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: rating }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_24px_80px_-35px_rgba(22,163,74,0.35)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400" />

      <div className="p-5 sm:p-6">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 ring-1 ring-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Post-delivery review</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">How was your farm-fresh order?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {SAMPLE_REVIEW.buyerName}, tell us about your delivery from {SAMPLE_REVIEW.farmerName}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Crop</p>
              <p className="mt-1 font-bold text-slate-900">{SAMPLE_REVIEW.cropName}</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Order</p>
              <p className="mt-1 font-bold text-slate-900">{SAMPLE_REVIEW.orderId}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-emerald-700">{SAMPLE_REVIEW.deliveredAt}</p>
        </div>

        <div className="mb-5">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-4 py-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Tap to rate your delivery</p>
              <motion.p
                key={currentCopy.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1 text-2xl font-black tracking-tight text-slate-900"
              >
                {currentCopy.label}
              </motion.p>
              <p className="mt-1 text-sm text-slate-500">{currentCopy.note}</p>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Review rating">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                const active = starValue <= activeRating;

                return (
                  <motion.button
                    key={starValue}
                    type="button"
                    aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                    aria-pressed={rating === starValue}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onFocus={() => setHoveredRating(starValue)}
                    onBlur={() => setHoveredRating(0)}
                    onClick={() => setRating(starValue)}
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.12 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    className="group relative grid h-14 w-14 place-items-center rounded-full outline-none"
                  >
                    <span
                      className={`absolute inset-0 rounded-full transition-all duration-300 ${
                        active ? 'bg-amber-400/20 blur-xl' : 'bg-transparent'
                      }`}
                    />
                    <Star
                      className={`relative z-10 h-8 w-8 transition-all duration-300 ${
                        active
                          ? 'scale-110 fill-amber-400 text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.65)]'
                          : 'text-slate-300 group-hover:text-amber-300'
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: scorePercent }}
              />
            </div>
          </div>
        </div>

        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="review-comment">
          Add a comment <span className="font-normal text-slate-400">optional</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Tell us what you liked about the delivery, freshness, packaging, or farmer support..."
          rows={4}
          maxLength={1000}
          className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Help other buyers and farmers improve the next delivery.</span>
          <span>{comment.length}/1000</span>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !rating}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-700 hover:shadow-emerald-600/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:shadow-none"
        >
          {loading ? 'Submitting review...' : 'Submit Review'}
        </button>

        <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.22em] text-emerald-600">
          Your feedback helps strengthen the farm network
        </p>
      </div>
    </motion.form>
  );
}

export { ReviewForm };