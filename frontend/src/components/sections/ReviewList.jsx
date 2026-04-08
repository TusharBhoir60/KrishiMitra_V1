import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * ReviewList
 * Props:
 *   farmerId – string – fetch and display reviews for this farmer
 */
export default function ReviewList({ farmerId }) {
  const [data, setData]       = useState({ avgRating: 0, totalReviews: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!farmerId) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/reviews/farmer/${farmerId}`);
        setData(res.data);
      } catch {
        setError('Could not load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [farmerId]);

  if (loading) return <p style={styles.muted}>Loading reviews…</p>;
  if (error)   return <p style={styles.error}>{error}</p>;

  const { avgRating, totalReviews, reviews } = data;

  return (
    <div style={styles.wrapper}>
      {/* Summary bar */}
      <div style={styles.summaryBar}>
        <span style={styles.avgNumber}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
        <div style={styles.summaryRight}>
          <StarRow rating={Math.round(avgRating)} size={20} />
          <span style={styles.totalText}>
            {totalReviews === 0
              ? 'No reviews yet'
              : `${totalReviews} review${totalReviews > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Review cards */}
      {reviews.length === 0 ? (
        <p style={styles.muted}>Be the first to review this farmer.</p>
      ) : (
        <ul style={styles.list}>
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </ul>
      )}
    </div>
  );
}

export { ReviewList };

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const { rating, comment, createdAt, buyer } = review;
  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <li style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.avatar}>{buyer?.name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <p style={styles.buyerName}>{buyer?.name || 'Anonymous'}</p>
          <StarRow rating={rating} size={14} />
        </div>
        <span style={styles.date}>{date}</span>
      </div>
      {comment && <p style={styles.comment}>{comment}</p>}
    </li>
  );
}

function StarRow({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ fontSize: size, color: s <= rating ? '#F59E0B' : '#D1D5DB', lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    maxWidth: 600,
  },
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 20,
  },
  avgNumber: {
    fontSize: 40,
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1,
  },
  summaryRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  totalText: {
    fontSize: 13,
    color: '#6B7280',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#D1FAE5',
    color: '#065F46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  buyerName: {
    margin: '0 0 2px',
    fontWeight: 600,
    fontSize: 14,
    color: '#111827',
  },
  date: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9CA3AF',
    whiteSpace: 'nowrap',
  },
  comment: {
    margin: 0,
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.6,
  },
  muted: {
    fontSize: 14,
    color: '#6B7280',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
  },
};