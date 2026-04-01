import mongoose, { Schema } from 'mongoose'

const cropListingSchema = new Schema(
  {
    farmer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    title_original: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['vegetable', 'grain', 'fruit', 'spice', 'dairy', 'other'],
      default: 'other',
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity (in kg) is required'],
      min: [1, 'Quantity must be at least 1 kg'],
    },
    availableQty: {
      type: Number,
      required: true,
    },
    minOrderQty: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      default: 'kg',
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Price per kg is required'],
      min: [0, 'Price cannot be negative'],
    },
    quality: {
      grade: {
        type: String,
        enum: ['A', 'B', 'C'],
        required: true,
      },
      perishability: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: true,
      },
      description: {
        type: String,
      },
    },
    images: [
      {
        type: String,
      },
    ],
    imageUploadedAt: {
      type: Date,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    location: {
      state: {
        type: String,
        default: 'Maharashtra',
      },
      district: {
        type: String,
        required: true,
      },
      taluka: {
        type: String,
      },
      village: {
        type: String,
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    description_original: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'marathi'],
      default: 'english',
    },
    delivery: {
      farmerDelivers: {
        type: Boolean,
        default: false,
      },
      buyerPickup: {
        type: Boolean,
        default: true,
      },
      platformTransporter: {
        type: Boolean,
        default: false,
      },
      priceIncludesDelivery: {
        type: Boolean,
        default: false,
      },
      additionalDeliveryCharge: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold_out', 'expired', 'removed'],
      default: 'active',
    },
    inquiryCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    suggestedPrice: {
      type: Number,
    },
    marketAvgPrice: {
      type: Number,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

cropListingSchema.pre('save', function () {
  if (this.isNew || this.isModified('quality.perishability')) {
    const days = { high: 3, medium: 7, low: 90 }
    const d = new Date()
    d.setDate(d.getDate() + days[this.quality.perishability])
    this.expiryDate = d
  }
})

cropListingSchema.index({ cropName: 'text', 'location.district': 'text' })
cropListingSchema.index({ 'location.district': 1, status: 1 })
cropListingSchema.index({ category: 1, status: 1 })

export const CropListing = mongoose.model('CropListing', cropListingSchema)