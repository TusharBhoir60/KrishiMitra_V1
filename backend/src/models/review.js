import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5.',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters.'],
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews: one buyer can only review one farmer once
reviewSchema.index({ farmerId: 1, buyerId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);