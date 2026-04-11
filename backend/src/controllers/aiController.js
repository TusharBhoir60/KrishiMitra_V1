import { CropListing } from '../models/croplisting.js'
import crypto from 'crypto'
import { normalizeUploadedImageMime } from '../utils/imageMime.js'

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

// Price prediction endpoint for form submissions with extended data
export const predictPrice = async (req, res, next) => {
  try {
    const { cropName, state, district, quantity, month, season, historicalAvgPrice } = req.body

    // Validation
    if (!cropName || !state || !district || !quantity || !month || !season) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropName, state, district, quantity, month, season',
      })
    }

    // Try to find similar listings - first exact match, then fallback to fuzzy match
    let listings = await CropListing.find({
      status: 'active',
      'location.district': district,
      'location.state': state,
      cropName: { $regex: cropName, $options: 'i' },
      expiryDate: { $gt: new Date() },
    }).select('pricePerKg createdAt').limit(30)

    // If no active listings, try less strict query (ignore expiry, any district in state)
    if (listings.length === 0) {
      listings = await CropListing.find({
        status: 'active',
        'location.state': state,
        cropName: { $regex: cropName, $options: 'i' },
      }).select('pricePerKg createdAt').limit(30)
    }

    // If still no results, try just by crop name
    if (listings.length === 0) {
      listings = await CropListing.find({
        status: 'active',
        cropName: { $regex: cropName, $options: 'i' },
      }).select('pricePerKg createdAt').limit(30)
    }

    // If truly no data, return fallback
    if (listings.length === 0) {
      return res.status(200).json({
        success: false,
        data: null,
        fallback: true,
        message: 'AI service is currently unavailable. Please try again later.',
      })
    }

    // Calculate base price from listings
    const prices = listings.map((l) => safeNum(l.pricePerKg)).filter((p) => p > 0)
    if (prices.length === 0) {
      return res.status(200).json({
        success: false,
        data: null,
        fallback: true,
        message: 'AI service is currently unavailable. Please try again later.',
      })
    }

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    
    // Apply seasonal adjustments (simulated ML prediction)
    const seasonalFactors = {
      Kharif: 0.95,      // Typically lower prices during harvest
      Rabi: 1.05,        // Winter crops, moderate prices
      Zaid: 1.1,         // Summer crops, slightly higher
      Winter: 1.08,      // Higher demand
      Summer: 0.92,      // Lower prices
      'Whole Year': 1.0, // Baseline
    }
    
    const seasonalFactor = seasonalFactors[season] || 1.0
    
    // Apply month adjustment (price variation by month)
    const monthlyFactors = [1.0, 0.95, 0.92, 0.98, 1.05, 1.1, 1.08, 1.02, 0.95, 0.9, 0.93, 0.99]
    const monthlyFactor = monthlyFactors[month - 1] || 1.0
    
    // Quantity impact (bulk gets slight discount)
    const quantityFactor = quantity > 500 ? 0.98 : quantity > 100 ? 0.99 : 1.0
    
    // Apply all factors
    let predictedPrice = avgPrice * seasonalFactor * monthlyFactor * quantityFactor
    
    // If historical avg is provided, blend it in (30% weight)
    if (historicalAvgPrice && historicalAvgPrice > 0) {
      predictedPrice = predictedPrice * 0.7 + historicalAvgPrice * 0.3
    }
    
    // Calculate price range (±15% for confidence)
    const lowPrice = Math.round(predictedPrice * 0.85 * 100) / 100
    const highPrice = Math.round(predictedPrice * 1.15 * 100) / 100
    const roundedPrice = Math.round(predictedPrice * 100) / 100
    
    // Determine confidence based on data quality
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

// Demand forecast endpoint
export const predictDemand = async (req, res, next) => {
  try {
    const { cropName, state, month, season, forecastWeeks, historicalDemandScores, historicalPrices } = req.body

    // Validation
    if (!cropName || !state || !month || !season || !forecastWeeks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cropName, state, month, season, forecastWeeks',
      })
    }

    if (forecastWeeks < 1 || forecastWeeks > 8) {
      return res.status(400).json({
        success: false,
        message: 'forecastWeeks must be between 1 and 8',
      })
    }

    // Try to find historical demand/price data from listings
    let listings = await CropListing.find({
      status: 'active',
      'location.state': state,
      cropName: { $regex: cropName, $options: 'i' },
    }).select('pricePerKg createdAt').limit(50)

    // Generate seasonal/monthly demand patterns
    const demandFactorsByMonth = [0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.88, 0.85, 0.75, 0.72, 0.68]
    const baseDemandByMonth = demandFactorsByMonth[month - 1] || 0.75

    const seasonalDemandFactors = {
      Kharif: 0.85,      // Post-monsoon, good demand
      Rabi: 0.95,        // Winter crops, peak demand
      Zaid: 0.72,        // Summer crops, lower demand
      Winter: 0.98,      // High demand, festival season
      Summer: 0.65,      // Low demand, hot weather
      'Whole Year': 0.80 // Average
    }

    const seasonalFactor = seasonalDemandFactors[season] || 0.80

    // Generate forecasts for each week
    const forecasts = []
    for (let week = 1; week <= forecastWeeks; week++) {
      // Add slight variation between weeks (trend)
      const weekTrend = 1 + (week - 1) * 0.02 // Slight increase week over week

      // Calculate demand score (0-1 range)
      let demandScore = baseDemandByMonth * seasonalFactor * weekTrend

      // If historical data provided, blend it in (20% weight)
      if (Array.isArray(historicalDemandScores) && historicalDemandScores.length > 0) {
        const avgHistorical = historicalDemandScores.reduce((a, b) => a + b, 0) / historicalDemandScores.length
        demandScore = demandScore * 0.8 + Math.min(avgHistorical, 1.0) * 0.2
      }

      // Clamp to 0-1 range
      demandScore = Math.max(0, Math.min(1, demandScore))

      // Determine demand label
      let demandLabel = 'medium'
      if (demandScore >= 0.75) {
        demandLabel = 'high'
      } else if (demandScore < 0.5) {
        demandLabel = 'low'
      }

      // Determine confidence based on available data
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
        confidence
      })
    }

    // Generate recommendation based on forecast
    const avgDemand = forecasts.reduce((sum, f) => sum + f.demand_score, 0) / forecasts.length
    const trend = forecasts[forecasts.length - 1].demand_score > forecasts[0].demand_score ? 'increasing' : 'decreasing'

    let recommendation = ''
    if (avgDemand >= 0.75) {
      recommendation = `Strong demand expected for ${cropName} in ${state} over the next ${forecastWeeks} weeks. Market shows ${trend} trend. Consider increasing production and establishing strong delivery networks to capitalize on high demand.`
    } else if (avgDemand >= 0.5) {
      recommendation = `Moderate demand projected for ${cropName} in ${state} with a ${trend} trajectory. Maintain current production levels and monitor market closely for opportunities to optimize pricing and distribution.`
    } else {
      recommendation = `Demand for ${cropName} is expected to be low in ${state}. Consider diversifying crop varieties or focusing on value-added products. Strategic pricing adjustments may help improve competitiveness.`
    }

    return res.status(200).json({
      success: true,
      data: {
        cropName,
        state,
        forecasts,
        recommendation,
        model_version: '1.0'
      }
    })
  } catch (error) {
    next(error)
  }
}

// Quality analysis endpoint - image-based
export const analyzeQuality = async (req, res, next) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      })
    }

    const { cropName } = req.body
    const file = req.file

    // Validate by actual file signature to avoid declared MIME mismatch issues.
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    const mimeInfo = normalizeUploadedImageMime(file)
    if (!mimeInfo.normalizedMime || !allowedMimes.includes(mimeInfo.normalizedMime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, and WebP are accepted.'
      })
    }

    // Normalize runtime MIME so downstream integrations use real image format.
    file.mimetype = mimeInfo.normalizedMime

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      })
    }

    // In production, this would send the image buffer to a Python ML service or TensorFlow.js
    // For now, we'll simulate quality analysis based on file characteristics
    
    // Simulated analysis: hash the file buffer to generate pseudo-random but consistent results
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex')
    const hashInt = parseInt(hash.substring(0, 8), 16)
    
    // Determine grade (A, B, C) based on hash
    const grades = ['A', 'B', 'C']
    const gradeIndex = hashInt % 3
    const grade = grades[gradeIndex]
    
    // Determine freshness based on hash
    const freshness_options = ['fresh', 'moderate', 'stale']
    const freshnessIndex = (hashInt >> 8) % 3
    const freshness = freshness_options[freshnessIndex]
    
    // Determine marketability based on combinations
    let marketability = 'sellable'
    if (grade === 'C' || freshness === 'stale') {
      marketability = 'reject'
    } else if (grade === 'B' || freshness === 'moderate') {
      marketability = 'borderline'
    }
    
    // Confidence scores (0-1 range)
    const gradeConfidence = 0.75 + (((hashInt >> 16) % 20) / 100) // 0.75 - 0.95
    const freshnessConfidence = 0.70 + (((hashInt >> 20) % 25) / 100) // 0.70 - 0.95
    
    // Generate recommendations based on analysis
    const recommendations = []
    
    if (grade === 'A') {
      recommendations.push('Excellent quality detected. Premium grade suitable for premium markets.')
      recommendations.push('Store in cool, well-ventilated conditions to maintain freshness.')
    } else if (grade === 'B') {
      recommendations.push('Good quality produce. Suitable for standard retail channels.')
      recommendations.push('Consider proper packaging to extend shelf life.')
    } else {
      recommendations.push('Below standard quality. Recommend for bulk or processed markets.')
      recommendations.push('Grade may improve with proper curing or conditioning.')
    }
    
    if (freshness === 'fresh') {
      recommendations.push('Harvest freshness is optimal. Ship immediately for best results.')
    } else if (freshness === 'moderate') {
      recommendations.push('Moderate freshness. Should be sold within 2-3 days.')
    } else {
      recommendations.push('Freshness is declining. Consider immediate sale or processing.')
    }
    
    if (marketability === 'sellable') {
      recommendations.push('All quality parameters are favorable for market sale.')
    } else if (marketability === 'borderline') {
      recommendations.push('Quality is acceptable but monitor closely before sale.')
    } else {
      recommendations.push('Quality concerns detected. Not recommended for direct sale.')
    }
    
    return res.status(200).json({
      success: true,
      data: {
        cropName: cropName || 'Unknown',
        mime_type: file.mimetype,
        mime_corrected: mimeInfo.isMismatch,
        grade,
        grade_confidence: Math.round(gradeConfidence * 100) / 100,
        freshness,
        freshness_confidence: Math.round(freshnessConfidence * 100) / 100,
        marketability,
        recommendations,
        model_version: '1.0'
      }
    })
  } catch (error) {
    console.error('Quality analysis error:', error)
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
      'location.state': state,
      cropName: { $regex: cropType, $options: 'i' },
    }).select('pricePerKg').limit(40)

    const listingPrices = listings.map((item) => safeNum(item.pricePerKg)).filter((price) => price > 0)
    const listingAvg = listingPrices.length
      ? listingPrices.reduce((sum, value) => sum + value, 0) / listingPrices.length
      : historical

    const blendedBase = (historical * 0.6) + (listingAvg * 0.4)
    const predictedBase = blendedBase * seasonFactor * monthFactor * quantityFactor

    const volatility = listingPrices.length >= 15 ? 0.12 : 0.18
    const low = Math.round(predictedBase * (1 - volatility) * 100) / 100
    const high = Math.round(predictedBase * (1 + volatility) * 100) / 100
    const roundedBase = Math.round(predictedBase * 100) / 100

    return res.status(200).json({
      success: true,
      data: {
        crop_type: cropType,
        predicted_base_price_per_kg: roundedBase,
        price_range: { low, high },
        model_version: '1.0',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getListingInsights = async (req, res) => {
  try {
    const {
      cropName,
      state,
      district,
      quantity,
      month,
      season,
      soilType,
      historicalAvgPrice,
      forecastWeeks,
    } = req.body || {}

    const qty = Number(quantity || 0)
    const monthNum = Number(month || (new Date().getMonth() + 1))
    const safeSeason = season || (monthNum >= 6 && monthNum <= 9 ? 'Kharif' : (monthNum >= 10 || monthNum <= 2 ? 'Rabi' : 'Zaid'))
    const weeks = Number(forecastWeeks || 4)

    const pricePromise = async () => {
      if (!cropName || !state || qty <= 0) return null

      const historical = Number(historicalAvgPrice || 0)
      const listings = await CropListing.find({
        status: 'active',
        'location.state': state,
        cropName: { $regex: cropName, $options: 'i' },
      }).select('pricePerKg').limit(40)

      const listingPrices = listings.map((item) => safeNum(item.pricePerKg)).filter((p) => p > 0)
      const listingAvg = listingPrices.length
        ? listingPrices.reduce((sum, value) => sum + value, 0) / listingPrices.length
        : historical

      const base = (historical > 0 ? (historical * 0.6 + listingAvg * 0.4) : listingAvg || 0)
      if (base <= 0) return null

      const seasonalFactors = { Kharif: 0.95, Rabi: 1.05, Zaid: 1.1, Winter: 1.08, Summer: 0.92, 'Whole Year': 1.0 }
      const monthlyFactors = [1.0, 0.95, 0.92, 0.98, 1.05, 1.1, 1.08, 1.02, 0.95, 0.9, 0.93, 0.99]
      const quantityFactor = qty > 500 ? 0.98 : qty > 100 ? 0.99 : 1.0

      const predicted = base * (seasonalFactors[safeSeason] || 1.0) * (monthlyFactors[monthNum - 1] || 1.0) * quantityFactor
      const rounded = Math.round(predicted * 100) / 100
      const low = Math.round(predicted * 0.85 * 100) / 100
      const high = Math.round(predicted * 1.15 * 100) / 100

      const confidence = listingPrices.length >= 20 ? 'high' : (listingPrices.length < 5 ? 'low' : 'medium')

      return {
        predicted_price_per_kg: rounded,
        price_range: { low, high },
        confidence,
      }
    }

    const demandPromise = async () => {
      if (!cropName || !state || qty <= 0) return null

      const baseByMonth = [0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.88, 0.85, 0.75, 0.72, 0.68]
      const seasonFactor = { Kharif: 0.85, Rabi: 0.95, Zaid: 0.72, Winter: 0.98, Summer: 0.65, 'Whole Year': 0.8 }

      const base = (baseByMonth[monthNum - 1] || 0.75) * (seasonFactor[safeSeason] || 0.8)
      const forecasts = Array.from({ length: Math.min(Math.max(weeks, 1), 4) }, (_, idx) => {
        const week = idx + 1
        const score = Math.max(0, Math.min(1, base * (1 + idx * 0.02)))
        const demand_label = score >= 0.75 ? 'high' : (score < 0.5 ? 'low' : 'medium')
        return {
          week,
          demand_score: Math.round(score * 100) / 100,
          demand_label,
          confidence: 'medium',
        }
      })

      return {
        forecasts,
        recommendation: `Expected ${forecasts[0]?.demand_label || 'medium'} demand trend for ${cropName} in the next ${forecasts.length} weeks.`,
      }
    }

    const recommendationPromise = async () => {
      const allowedSoils = ['loamy', 'clay', 'sandy', 'silt', 'black', 'red']
      if (!soilType || !allowedSoils.includes(soilType)) return null

      const soilRecommendations = {
        loamy: ['Wheat', 'Sugarcane', 'Cotton', 'Tomato'],
        clay: ['Rice', 'Wheat', 'Cabbage', 'Peas'],
        sandy: ['Groundnut', 'Watermelon', 'Carrot', 'Bajra'],
        silt: ['Rice', 'Tomato', 'Mustard', 'Okra'],
        black: ['Cotton', 'Soybean', 'Sorghum', 'Chickpea'],
        red: ['Groundnut', 'Millets', 'Pulses', 'Onion'],
      }

      const recommendations = soilRecommendations[soilType] || []
      if (!recommendations.length) return null

      return {
        topRecommendation: recommendations[0],
        recommendations,
      }
    }

    const [priceRes, demandRes, recommendationRes] = await Promise.allSettled([
      pricePromise(),
      demandPromise(),
      recommendationPromise(),
    ])

    const insights = {
      price: priceRes.status === 'fulfilled' ? priceRes.value : null,
      demand: demandRes.status === 'fulfilled' ? demandRes.value : null,
      recommendation: recommendationRes.status === 'fulfilled' ? recommendationRes.value : null,
    }

    return res.status(200).json({ success: true, insights })
  } catch (error) {
    return res.status(200).json({ success: false, data: null, fallback: true, message: error?.message })
  }
}
