import axios from 'axios'

const SUPPORTED_LANGUAGES = new Set(['english', 'hindi', 'marathi'])
const LANGUAGE_TO_CODE = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr',
}

const translationCache = new Map()

const CANONICAL_CROPS = {
  tomato: { en: 'Tomato', hi: 'टमाटर', mr: 'टोमॅटो', aliases: ['टोमॅटो', 'टमाटर', 'टमाटे', 'tomato', 'tomatoes'] },
  onion: { en: 'Onion', hi: 'प्याज', mr: 'कांदा', aliases: ['प्याज', 'कांदा', 'onion', 'onions'] },
  potato: { en: 'Potato', hi: 'आलू', mr: 'बटाटा', aliases: ['आलू', 'बटाटा', 'potato', 'potatoes'] },
  rice: { en: 'Rice', hi: 'चावल', mr: 'तांदूळ', aliases: ['चावल', 'तांदूळ', 'rice'] },
  wheat: { en: 'Wheat', hi: 'गेहूं', mr: 'गहू', aliases: ['गेहूं', 'गहू', 'wheat'] },
  maize: { en: 'Maize', hi: 'मक्का', mr: 'मका', aliases: ['मक्का', 'मका', 'maize', 'corn'] },
  cotton: { en: 'Cotton', hi: 'कपास', mr: 'कापूस', aliases: ['कपास', 'कापूस', 'cotton'] },
  sugarcane: { en: 'Sugarcane', hi: 'गन्ना', mr: 'ऊस', aliases: ['गन्ना', 'ऊस', 'sugarcane'] },
  chilli: { en: 'Chilli', hi: 'मिर्च', mr: 'मिरची', aliases: ['मिर्च', 'मिरची', 'chilli', 'chili'] },
  banana: { en: 'Banana', hi: 'केला', mr: 'केळी', aliases: ['केला', 'केळी', 'banana'] },
  grapes: { en: 'Grapes', hi: 'अंगूर', mr: 'द्राक्षे', aliases: ['अंगूर', 'द्राक्षे', 'grapes', 'grape'] },
  pomegranate: { en: 'Pomegranate', hi: 'अनार', mr: 'डाळिंब', aliases: ['अनार', 'डाळिंब', 'pomegranate'] },
}

const aliasToCanonical = new Map()
const aliasLanguageHint = new Map()

for (const crop of Object.values(CANONICAL_CROPS)) {
  for (const alias of crop.aliases || []) {
    const key = String(alias).trim().toLowerCase()
    if (!key) continue
    aliasToCanonical.set(key, crop)

    if (alias === crop.hi) aliasLanguageHint.set(key, 'hindi')
    if (alias === crop.mr) aliasLanguageHint.set(key, 'marathi')
    if (alias === crop.en || /^[a-z\s-]+$/i.test(alias)) aliasLanguageHint.set(key, 'english')
  }
}

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toLowerCase()
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'english'
}

const findCropByAlias = (text = '') => {
  const normalized = String(text || '').trim().toLowerCase()
  if (!normalized) return null

  // Try full string first.
  if (aliasToCanonical.has(normalized)) {
    return aliasToCanonical.get(normalized)
  }

  // Fallback to token-based match for phrases like "टोमॅटोची किंमत".
  const tokens = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  for (const token of tokens) {
    const direct = aliasToCanonical.get(token)
    if (direct) return direct

    // Remove common Hindi/Marathi suffixes if attached to crop token.
    const stripped = token.replace(/(ची|चा|चे|मध्ये|ला|ने|की|का|के|में)$/u, '')
    if (stripped && aliasToCanonical.has(stripped)) {
      return aliasToCanonical.get(stripped)
    }
  }

  return null
}

const translateWithCropDictionary = (text, targetLanguage) => {
  const crop = findCropByAlias(text)
  if (!crop) return null

  const desired = normalizeLanguage(targetLanguage)
  if (desired === 'hindi') return crop.hi
  if (desired === 'marathi') return crop.mr
  return crop.en
}

const getTranslateApiUrls = () => {
  const configured = String(process.env.TRANSLATE_API_URLS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)

  if (configured.length) return configured

  return [
    process.env.TRANSLATE_API_URL || 'https://libretranslate.com/translate',
  ]
}

const callExternalTranslation = async (rawText, sourceLanguage, desiredLanguage) => {
  const urls = getTranslateApiUrls()
  const apiKey = process.env.TRANSLATE_API_KEY

  for (const url of urls) {
    try {
      const payload = {
        q: rawText,
        source: LANGUAGE_TO_CODE[sourceLanguage],
        target: LANGUAGE_TO_CODE[desiredLanguage],
        format: 'text',
      }

      if (apiKey) payload.api_key = apiKey

      const { data } = await axios.post(url, payload, {
        timeout: Number(process.env.TRANSLATE_TIMEOUT_MS || 3000),
      })

      if (data?.translatedText) {
        return data.translatedText
      }
    } catch (error) {
      const status = error?.response?.status
      const details = error?.response?.data || error?.message
      console.error(`Translation endpoint failed (${url})`, status, details)
    }
  }

  return rawText
}

// Simple regex + keyword heuristic. Good enough for now and can be replaced later.
const detectLanguage = (text = '') => {
  const value = String(text || '').trim()
  if (!value) return 'english'

  const crop = findCropByAlias(value)
  if (crop) {
    const key = String(value).trim().toLowerCase()
    if (aliasLanguageHint.has(key)) {
      return aliasLanguageHint.get(key)
    }
  }

  const hasDevanagari = /[\u0900-\u097F]/.test(value)
  if (!hasDevanagari) return 'english'

  const lowered = value.toLowerCase()
  const marathiHints = ['आहे', 'आणि', 'मध्ये', 'करा', 'तुम्ही', 'किंमत', 'चा', 'ची', 'चे']
  const hindiHints = ['है', 'और', 'में', 'कीमत', 'कृपया', 'क्या', 'कौन', 'का', 'की', 'के']

  const marathiScore = marathiHints.reduce((score, token) => (lowered.includes(token) ? score + 1 : score), 0)
  const hindiScore = hindiHints.reduce((score, token) => (lowered.includes(token) ? score + 1 : score), 0)

  return marathiScore > hindiScore ? 'marathi' : 'hindi'
}

const translateText = async (text, targetLanguage = 'english') => {
  const rawText = String(text || '')
  const desiredLanguage = normalizeLanguage(targetLanguage)

  if (!rawText.trim()) return rawText

  const sourceLanguage = detectLanguage(rawText)
  if (sourceLanguage === desiredLanguage) return rawText

  const cropDictionaryHit = translateWithCropDictionary(rawText, desiredLanguage)
  if (cropDictionaryHit) {
    return cropDictionaryHit
  }

  const cacheKey = `${sourceLanguage}:${desiredLanguage}:${rawText}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  try {
    const translated = await callExternalTranslation(rawText, sourceLanguage, desiredLanguage)

    // Keep this lightweight cache for current process. A shared cache can be added later.
    translationCache.set(cacheKey, translated)

    return translated
  } catch (error) {
    console.error('Translation failed:', error?.message || error)
    return rawText
  }
}

export { translateText, detectLanguage }
