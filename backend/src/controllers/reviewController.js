import mongoose from 'mongoose';
import { Review } from '../models/review.js';
import { Order } from '../models/order.js'; 

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Buyer creates a review for a farmer they have a completed order with.
const createReview = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { farmerId, orderId, rating, comment } = req.body;

    if (!farmerId || !orderId || !rating) {
      return res.status(400).json({ message: 'farmerId, orderId, and rating are required.' });
    }

    // 1. Verify a real completed order exists between this buyer and farmer
    const completedOrder = await Order.findOne({
      _id: orderId,
      buyer: buyerId,
      farmer: farmerId,
      status: 'completed',
    });

    if (!completedOrder) {
      return res.status(403).json({
        message: 'You can only review a farmer after a completed order with them.',
      });
    }

    // 2. Check for an existing review (belt-and-suspenders; DB index is the hard guard)
    const existingReview = await Review.findOne({ farmerId, buyerId });
    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this farmer. You can edit your existing review.',
      });
    }

    // 3. Create review
    const review = await Review.create({ farmerId, buyerId, orderId, rating, comment });

    return res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (err) {
    // Handle MongoDB duplicate-key error as a safety net
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'You have already reviewed this farmer.',
      });
    }
    console.error('createReview error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ─── GET /api/reviews/farmer/:farmerId ────────────────────────────────────────
// Public. Returns all reviews for a farmer + aggregated stats.
const getReviewsByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Aggregation for fresh avgRating and totalReviews
    const [stats] = await Review.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
      {
        $group: {
          _id: '$farmerId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats ? parseFloat(stats.avgRating.toFixed(1)) : 0;
    const totalReviews = stats ? stats.totalReviews : 0;

    // Fetch reviews with buyer name populated
    const reviews = await Review.find({ farmerId })
      .populate('buyerId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Shape the response
    const shaped = reviews.map(({ _id, rating, comment, createdAt, buyerId }) => ({
      _id,
      rating,
      comment,
      createdAt,
      buyer: { name: buyerId?.name || 'Unknown' },
    }));

    return res.status(200).json({ avgRating, totalReviews, reviews: shaped });
  } catch (err) {
    console.error('getReviewsByFarmer error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ─── PATCH /api/reviews/:id ───────────────────────────────────────────────────
// Buyer edits their own review.
const updateReview = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own reviews.' });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    return res.status(200).json({ message: 'Review updated successfully.', review });
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ─── DELETE /api/reviews/:id ──────────────────────────────────────────────────
// Buyer deletes their own review.
const deleteReview = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews.' });
    }

    await review.deleteOne();

    return res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export { createReview, getReviewsByFarmer, updateReview, deleteReview };