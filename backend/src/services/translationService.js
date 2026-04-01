import axios from 'axios'

const SUPPORTED_LANGUAGES = new Set(['english', 'hindi', 'marathi'])
const LANGUAGE_TO_CODE = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr',
}

const translationCache = new Map()

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toLowerCase()
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'english'
}

// Simple regex + keyword heuristic. Good enough for now and can be replaced later.
const detectLanguage = (text = '') => {
  const value = String(text || '').trim()
  if (!value) return 'english'

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

  const cacheKey = `${sourceLanguage}:${desiredLanguage}:${rawText}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  try {
    const translateApiUrl = process.env.TRANSLATE_API_URL || 'https://libretranslate.com/translate'

    const { data } = await axios.post(
      translateApiUrl,
      {
        q: rawText,
        source: LANGUAGE_TO_CODE[sourceLanguage],
        target: LANGUAGE_TO_CODE[desiredLanguage],
        format: 'text',
      },
      {
        timeout: Number(process.env.TRANSLATE_TIMEOUT_MS || 3000),
      }
    )

    const translated = data?.translatedText || rawText

    // Keep this lightweight cache for current process. A shared cache can be added later.
    translationCache.set(cacheKey, translated)

    return translated
  } catch (error) {
    console.error('Translation failed:', error?.message || error)
    return rawText
  }
}

export { translateText, detectLanguage }
