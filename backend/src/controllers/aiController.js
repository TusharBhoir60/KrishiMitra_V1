import { CropListing } from '../models/croplisting.js'

const safeNum = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const getPricePrediction = async (req, res, next) => {
  try {
    const { cropName, district } = req.query
    if (!cropName || !district) {
      return res.status(400).json({ success: false, message: 'cropName and district are required' })
    }

    const listings = await CropListing.find({
      status: 'active',
      'location.district': district,
      cropName: { $regex: cropName, $options: 'i' },
      expiryDate: { $gt: new Date() },
    }).select('pricePerKg createdAt')

    if (!listings.length) {
      return res.status(200).json({ success: true, data: { available: false } })
    }

    const prices = listings.map((l) => safeNum(l.pricePerKg)).filter((p) => p > 0)
    if (!prices.length) {
      return res.status(200).json({ success: true, data: { available: false } })
    }

    const predictedPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

    return res.status(200).json({
      success: true,
      data: {
        available: true,
        predictedPrice,
        confidence: 80,
        trend: 'stable',
        source: 'KrishiBazaar listing average',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMarketTrends = async (req, res, next) => {
  try {
    const { district } = req.query
    if (!district) {
      return res.status(400).json({ success: false, message: 'district is required' })
    }

    const trends = await CropListing.aggregate([
      {
        $match: {
          status: 'active',
          'location.district': district,
          expiryDate: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: '$cropName',
          avgPrice: { $avg: '$pricePerKg' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          avgPrice: { $round: ['$avgPrice', 0] },
          demand: {
            $cond: [{ $gte: ['$count', 5] }, 'high', { $cond: [{ $gte: ['$count', 3] }, 'medium', 'low'] }],
          },
        },
      },
      { $sort: { avgPrice: -1 } },
      { $limit: 10 },
    ])

    return res.status(200).json({ success: true, data: { available: trends.length > 0, topCrops: trends } })
  } catch (error) {
    next(error)
  }
}
