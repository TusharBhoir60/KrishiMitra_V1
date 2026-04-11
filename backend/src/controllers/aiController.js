import { CropListing } from '../models/croplisting.js'
import { analyzeUploadedCropImage } from '../utils/qualityAnalysis.js'

const safeNum = (value, fallback = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getPricePrediction = async (req, res, next) => {
  try {
    const { cropName, district } = req.query

    if (!cropName || !district) {
      return res.status(400).json({ success: false, message: 'cropName and district are required' })
    }

    const listings = await CropListing.find({
      status: 'active',
      isAvailable: true,
      'location.district': district,
      cropName: { $regex: escapeRegex(cropName), $options: 'i' },
      expiryDate: { $gt: new Date() },
    }).select('pricePerKg createdAt')

    if (!listings.length) {
      return res.status(200).json({ success: true, data: { available: false } })
    }

    const prices = listings.map((listing) => safeNum(listing.pricePerKg)).filter((price) => price > 0)
    if (!prices.length) {
      return res.status(200).json({ success: true, data: { available: false } })
    }

    const predictedPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)

    return res.status(200).json({
      success: true,
      data: {
        available: true,
        predictedPrice,
        confidence: 80,
        trend: 'stable',
        source: 'KrishiMitra listing average',
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
          isAvailable: true,
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

export const predictPrice = async (req, res, next) => {
  try {
    const { cropName, state, district, quantity, month, season, historicalAvgPrice } = req.body

    if (!cropName || !state || !district || !quantity || !month || !season) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropName, state, district, quantity, month, season',
      })
    }

    let listings = await CropListing.find({
      status: 'active',
      isAvailable: true,
      'location.district': district,
      'location.state': state,
      cropName: { $regex: escapeRegex(cropName), $options: 'i' },
      expiryDate: { $gt: new Date() },
    }).select('pricePerKg createdAt').limit(30)

    if (!listings.length) {
      listings = await CropListing.find({
        status: 'active',
        isAvailable: true,
        'location.state': state,
        cropName: { $regex: escapeRegex(cropName), $options: 'i' },
      }).select('pricePerKg createdAt').limit(30)
    }

    if (!listings.length) {
      listings = await CropListing.find({
        status: 'active',
        isAvailable: true,
        cropName: { $regex: escapeRegex(cropName), $options: 'i' },
      }).select('pricePerKg createdAt').limit(30)
    }

    if (!listings.length) {
      return res.status(200).json({
        success: false,
        data: null,
        fallback: true,
        message: 'AI service is currently unavailable. Please try again later.',
      })
    }

    const prices = listings.map((listing) => safeNum(listing.pricePerKg)).filter((price) => price > 0)
    if (!prices.length) {
      return res.status(200).json({
        success: false,
        data: null,
        fallback: true,
        message: 'AI service is currently unavailable. Please try again later.',
      })
    }

    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const seasonalFactors = {
      Kharif: 0.95,
      Rabi: 1.05,
      Zaid: 1.1,
      Winter: 1.08,
      Summer: 0.92,
      'Whole Year': 1.0,
    }
    const seasonalFactor = seasonalFactors[season] || 1.0
    const monthlyFactors = [1.0, 0.95, 0.92, 0.98, 1.05, 1.1, 1.08, 1.02, 0.95, 0.9, 0.93, 0.99]
    const monthIndex = Number(month) - 1
    const monthlyFactor = monthlyFactors[monthIndex] || 1.0
    const quantityFactor = Number(quantity) > 500 ? 0.98 : Number(quantity) > 100 ? 0.99 : 1.0

    let predictedPrice = avgPrice * seasonalFactor * monthlyFactor * quantityFactor

    if (historicalAvgPrice && Number(historicalAvgPrice) > 0) {
      predictedPrice = predictedPrice * 0.7 + Number(historicalAvgPrice) * 0.3
    }

    const lowPrice = Math.round(predictedPrice * 0.85 * 100) / 100
    const highPrice = Math.round(predictedPrice * 1.15 * 100) / 100
    const roundedPrice = Math.round(predictedPrice * 100) / 100

    let confidence = 'medium'
    if (prices.length >= 20) {
      confidence = 'high'
    } else if (prices.length < 5) {
      confidence = 'low'
    }

    return res.status(200).json({
      success: true,
      data: {
        cropName,
        predicted_price_per_kg: roundedPrice,
        price_range: { low: lowPrice, high: highPrice },
        confidence,
        model_version: '1.0',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const predictDemand = async (req, res, next) => {
  try {
    const { cropName, state, month, season, forecastWeeks, historicalDemandScores } = req.body

    if (!cropName || !state || !month || !season || !forecastWeeks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropName, state, month, season, forecastWeeks',
      })
    }

    const normalizedForecastWeeks = Number(forecastWeeks)
    if (normalizedForecastWeeks < 1 || normalizedForecastWeeks > 8) {
      return res.status(400).json({
        success: false,
        message: 'forecastWeeks must be between 1 and 8',
      })
    }

    const listings = await CropListing.find({
      status: 'active',
      isAvailable: true,
      'location.state': state,
      cropName: { $regex: escapeRegex(cropName), $options: 'i' },
    }).select('pricePerKg createdAt').limit(50)

    const demandFactorsByMonth = [0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.88, 0.85, 0.75, 0.72, 0.68]
    const baseDemandByMonth = demandFactorsByMonth[Number(month) - 1] || 0.75

    const seasonalDemandFactors = {
      Kharif: 0.85,
      Rabi: 0.95,
      Zaid: 0.72,
      Winter: 0.98,
      Summer: 0.65,
      'Whole Year': 0.8,
    }

    const seasonalFactor = seasonalDemandFactors[season] || 0.8

    const forecasts = []
    for (let week = 1; week <= normalizedForecastWeeks; week += 1) {
      const weekTrend = 1 + (week - 1) * 0.02
      let demandScore = baseDemandByMonth * seasonalFactor * weekTrend

      if (Array.isArray(historicalDemandScores) && historicalDemandScores.length > 0) {
        const avgHistorical = historicalDemandScores.reduce((sum, score) => sum + Number(score || 0), 0) / historicalDemandScores.length
        demandScore = demandScore * 0.8 + Math.min(avgHistorical, 1.0) * 0.2
      }

      demandScore = Math.max(0, Math.min(1, demandScore))

      let demandLabel = 'medium'
      if (demandScore >= 0.75) {
        demandLabel = 'high'
      } else if (demandScore < 0.5) {
        demandLabel = 'low'
      }

      let confidence = 'medium'
      if (listings.length >= 15) {
        confidence = 'high'
      } else if (listings.length < 5) {
        confidence = 'low'
      }

      forecasts.push({
        week,
        demand_score: Math.round(demandScore * 100) / 100,
        demand_label: demandLabel,
        confidence,
      })
    }

    const avgDemand = forecasts.reduce((sum, item) => sum + item.demand_score, 0) / forecasts.length
    const trend = forecasts[forecasts.length - 1].demand_score > forecasts[0].demand_score ? 'increasing' : 'decreasing'

    let recommendation = ''
    if (avgDemand >= 0.75) {
      recommendation = `Strong demand expected for ${cropName} in ${state} over the next ${normalizedForecastWeeks} weeks. Market shows ${trend} trend.`
    } else if (avgDemand >= 0.5) {
      recommendation = `Moderate demand projected for ${cropName} in ${state} with a ${trend} trajectory.`
    } else {
      recommendation = `Demand for ${cropName} is expected to be low in ${state}. Consider diversified selling or value-added products.`
    }

    return res.status(200).json({
      success: true,
      data: {
        cropName,
        state,
        forecasts,
        recommendation,
        model_version: '1.0',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const analyzeQuality = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' })
    }

    const analysis = analyzeUploadedCropImage(req.file, req.body.cropName)
    if (!analysis.ok) {
      return res.status(400).json({ success: false, message: analysis.error })
    }

    return res.status(200).json({ success: true, data: analysis.data })
  } catch (error) {
    next(error)
  }
}

export const recommendCrop = async (req, res, next) => {
  try {
    const { soilType, topK = 3 } = req.body
    const allowedSoils = ['loamy', 'clay', 'sandy', 'silt', 'black', 'red']

    if (!soilType || !allowedSoils.includes(soilType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing soilType' })
    }

    const normalizedTopK = Math.max(1, Math.min(10, Number(topK) || 3))

    const soilRecommendations = {
      loamy: ['Wheat', 'Sugarcane', 'Cotton', 'Tomato', 'Potato', 'Maize', 'Groundnut', 'Onion', 'Soybean', 'Chickpea'],
      clay: ['Rice', 'Wheat', 'Broccoli', 'Cabbage', 'Beans', 'Peas', 'Mustard', 'Lentil', 'Barley', 'Jute'],
      sandy: ['Groundnut', 'Watermelon', 'Carrot', 'Radish', 'Pearl Millet', 'Potato', 'Cucumber', 'Sesame', 'Bajra', 'Bottle Gourd'],
      silt: ['Rice', 'Tomato', 'Chili', 'Brinjal', 'Mustard', 'Sunflower', 'Spinach', 'Okra', 'Coriander', 'Green Gram'],
      black: ['Cotton', 'Soybean', 'Sorghum', 'Pigeon Pea', 'Wheat', 'Linseed', 'Maize', 'Sunflower', 'Chickpea', 'Groundnut'],
      red: ['Groundnut', 'Millets', 'Pulses', 'Tobacco', 'Potato', 'Maize', 'Castor', 'Sesame', 'Tomato', 'Onion'],
    }

    const recommendations = (soilRecommendations[soilType] || []).slice(0, normalizedTopK)
    if (!recommendations.length) {
      return res.status(200).json({ success: false, data: null, fallback: true })
    }

    return res.status(200).json({
      success: true,
      topRecommendation: recommendations[0],
      recommendations,
      model_version: '1.0',
    })
  } catch (error) {
    next(error)
  }
}

export const predictPriceRange = async (req, res, next) => {
  try {
    const { cropType, historicalAvgPrice, state, district, quantity, month, season } = req.body

    if (!cropType || !historicalAvgPrice || !state || !district || !quantity || !month || !season) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropType, historicalAvgPrice, state, district, quantity, month, season',
      })
    }

    const historical = Number(historicalAvgPrice)
    const qty = Number(quantity)
    const monthNum = Number(month)

    if (historical <= 0 || qty <= 0 || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input values for historicalAvgPrice, quantity, or month',
      })
    }

    const seasonFactors = {
      Kharif: 0.95,
      Rabi: 1.04,
      Zaid: 1.08,
      Winter: 1.06,
      Summer: 0.93,
      'Whole Year': 1.0,
    }

    const monthlyFactors = [1.0, 0.97, 0.95, 0.98, 1.03, 1.07, 1.06, 1.02, 0.96, 0.92, 0.94, 0.99]
    const seasonFactor = seasonFactors[season] || 1.0
    const monthFactor = monthlyFactors[monthNum - 1] || 1.0
    const quantityFactor = qty > 1000 ? 0.97 : qty > 300 ? 0.985 : 1.0

    const listings = await CropListing.find({
      status: 'active',
      isAvailable: true,
      cropName: { $regex: escapeRegex(cropType), $options: 'i' },
      'location.state': state,
      'location.district': district,
    }).select('pricePerKg createdAt').limit(30)

    const listingPrices = listings.map((listing) => safeNum(listing.pricePerKg)).filter((price) => price > 0)
    const listingAverage = listingPrices.length ? listingPrices.reduce((sum, price) => sum + price, 0) / listingPrices.length : historical

    const basePrice = (historical * 0.65) + (listingAverage * 0.35)
    const adjusted = basePrice * seasonFactor * monthFactor * quantityFactor
    const spread = adjusted * 0.15

    return res.status(200).json({
      success: true,
      data: {
        cropType,
        predicted_base_price_per_kg: Math.round(adjusted * 100) / 100,
        price_range: {
          low: Math.round((adjusted - spread) * 100) / 100,
          high: Math.round((adjusted + spread) * 100) / 100,
        },
        confidence: listingPrices.length >= 10 ? 'high' : listingPrices.length >= 5 ? 'medium' : 'low',
        model_version: '1.0',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getListingInsights = async (req, res, next) => {
  try {
    const { cropName, state, district, quantity, soilType } = req.body

    if (!cropName || !state || !district) {
      return res.status(400).json({ success: false, message: 'cropName, state, and district are required' })
    }

    const listingCount = await CropListing.countDocuments({
      status: 'active',
      isAvailable: true,
      cropName: { $regex: escapeRegex(cropName), $options: 'i' },
      'location.state': state,
      'location.district': district,
    })

    const insights = [
      listingCount > 10 ? 'Strong local market activity found.' : 'Limited nearby market data available.',
      quantity ? `Your listing size of ${quantity} kg looks suitable for the current market.` : 'Add quantity for more precise guidance.',
      soilType ? `Soil type ${soilType} can help refine crop success recommendations.` : 'Add soil type for better agronomy suggestions.',
    ]

    return res.status(200).json({
      success: true,
      data: {
        available: true,
        insights,
        model_version: '1.0',
      },
    })
  } catch (error) {
    next(error)
  }
}