import { useState } from 'react';
import axios from 'axios';

/**
 * ReviewForm
 * Props:
 *   farmerId  – string  – the farmer being reviewed
 *   orderId   – string  – the completed order this review is tied to
 *   onSuccess – fn()    – called after a successful submission (e.g. refresh list)
 */
export default function ReviewForm({ farmerId, orderId, onSuccess }) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  const activeStars = hovered || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please select a star rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        '/api/reviews',
        { farmerId, orderId, rating, comment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.successBox}>
        <span style={styles.successIcon}>✓</span>
        <p style={styles.successText}>Your review has been submitted. Thank you!</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Leave a Review</h3>

      {/* Star selector */}
      <div style={styles.starsRow} role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            style={{
              ...styles.starBtn,
              color: star <= activeStars ? '#F59E0B' : '#D1D5DB',
              transform: star <= activeStars ? 'scale(1.15)' : 'scale(1)',
            }}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span style={styles.ratingLabel}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        style={styles.textarea}
        placeholder="Share your experience (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
      />
      <div style={styles.charCount}>{comment.length}/1000</div>

      {/* Error */}
      {error && <p style={styles.errorText}>{error}</p>}

      {/* Submit */}
      <button
        type="button"
        style={{
          ...styles.submitBtn,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}

export { ReviewForm };

// ─── Inline styles (swap for Tailwind/CSS modules if your project uses them) ──
const styles = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '24px',
    maxWidth: 480,
  },
  heading: {
    margin: '0 0 16px',
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
  },
  starsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  starBtn: {
    background: 'none',
    border: 'none',
    fontSize: 32,
    cursor: 'pointer',
    padding: 2,
    transition: 'color 0.15s, transform 0.15s',
    lineHeight: 1,
  },
  ratingLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 500,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    color: '#374151',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    margin: '0 0 12px',
  },
  submitBtn: {
    width: '100%',
    padding: '10px 0',
    background: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: 10,
    padding: '16px 20px',
    maxWidth: 480,
  },
  successIcon: {
    fontSize: 20,
    color: '#16A34A',
    fontWeight: 700,
  },
  successText: {
    margin: 0,
    fontSize: 14,
    color: '#166534',
  },
};