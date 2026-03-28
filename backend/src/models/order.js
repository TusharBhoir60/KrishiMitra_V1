import mongoose, { Schema } from 'mongoose'

const orderSchema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropListing: {
      type: Schema.Types.ObjectId,
      ref: 'CropListing',
      required: true,
    },
    orderDetails: {
      cropName: { type: String, required: true },
      quantity: { type: Number, required: true },
      pricePerKg: { type: Number, required: true },
      cropAmount: { type: Number, required: true },
      grade: { type: String },
      harvestDate: { type: Date },
    },
    delivery: {
      method: {
        type: String,
        enum: ['farmer_delivers', 'buyer_pickup', 'platform_transporter'],
        required: true,
      },
      zone: { type: String },
      distanceKm: { type: Number },
      deliveryFee: { type: Number, default: 0 },
      platformFee: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      pickup: {
        scheduledDate: { type: Date },
        scheduledSlot: { type: String },
        transporter: { type: Schema.Types.ObjectId, ref: 'Transporter' },
        otpCode: { type: String },
        otpGeneratedAt: { type: Date },
        otpVerifiedAt: { type: Date },
        farmerConfirmedLoading: { type: Boolean, default: false },
      },
      agreedDate: { type: Date },
      buyerAddress: { type: String },
      farmAddress: { type: String },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'declined',
        'expired',
        'scheduled',
        'dispatched',
        'in_transit',
        'delivered',
        'completed',
        'disputed',
        'resolved',
        'cancelled',
      ],
      default: 'pending',
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'held', 'released', 'refunded'],
        default: 'pending',
      },
      mockTransactionId: { type: String },
      autoReleaseAt: { type: Date },
      releasedAt: { type: Date },
    },
    acceptanceDeadline: { type: Date },
    buyerNote: { type: String },
    dispute: {
      raisedBy: { type: String, enum: ['buyer', 'farmer'] },
      reason: { type: String },
      description: { type: String },
      raisedAt: { type: Date },
      evidence: [{ type: String }],
      resolution: { type: String },
    },
    farmerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date },
    },
    transporterReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
)

orderSchema.pre('save', function (next) {
  if (this.isNew) {
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + 12)
    this.acceptanceDeadline = deadline
    this.payment.mockTransactionId = 'MOCK-' + Date.now()
    this.payment.status = 'held'
  }
  next()
})

orderSchema.index({ farmer: 1 })
orderSchema.index({ buyer: 1 })
orderSchema.index({ status: 1 })

export const Order = mongoose.model('Order', orderSchema)