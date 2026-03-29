/**
 * KrishiBazaar API integration tests (manual / CI-friendly).
 *
 * Usage (from backend/):
 *   node test.js
 *
 * Required for authenticated + ML tests:
 *   TEST_EMAIL, TEST_PASSWORD   — existing user (any role works for ML / notifications / AI)
 *
 * Optional (role-specific sections; skipped if unset):
 *   TEST_FARMER_EMAIL, TEST_FARMER_PASSWORD
 *   TEST_BUYER_EMAIL, TEST_BUYER_PASSWORD
 *   TEST_TRANSPORTER_EMAIL, TEST_TRANSPORTER_PASSWORD
 *   TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
 *
 * Optional:
 *   API_BASE=http://localhost:5000
 *   ML_SERVICE_URL=http://localhost:8000   — pinged for diagnostics only
 */

import axios, { isAxiosError } from 'axios'
import dotenv from 'dotenv'
import FormData from 'form-data'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const API_BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}`
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/** Minimal 1×1 PNG (valid for /api/ml/quality) */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

const api = axios.create({
  baseURL: API_BASE,
  validateStatus: () => true,
  timeout: 60000,
})

const results = []

function fail(msg) {
  throw new Error(msg)
}

/** Axios often omits `message` on ECONNREFUSED; normalize for readable failures. */
function formatError(e) {
  if (!e) return 'unknown error'
  if (isAxiosError(e)) {
    const code = e.code
    if (code === 'ECONNREFUSED' || code === 'EHOSTUNREACH') {
      return `${code}: nothing listening at ${API_BASE} — start the backend first (e.g. npm run dev)`
    }
    if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
      return `${code || e.message}: request timed out — is ${API_BASE} reachable?`
    }
    const status = e.response?.status
    const body = e.response?.data
    const parts = [e.message || code, status && `HTTP ${status}`, body && `body: ${JSON.stringify(body).slice(0, 240)}`].filter(
      Boolean
    )
    return parts.join(' | ') || String(e)
  }
  return e.message || String(e)
}

async function test(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  ✓ ${name}`)
  } catch (e) {
    const msg = formatError(e)
    results.push({ name, ok: false, error: msg })
    console.log(`  ✗ ${name}`)
    console.log(`    ${msg}`)
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function extractLogin(res) {
  const d = res.data?.data
  if (!d?.accessToken) return null
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    user: d.user,
  }
}

const samplePriceBody = {
  cropName: 'Tomato',
  state: 'Maharashtra',
  district: 'Pune',
  quantity: 100,
  month: 6,
  season: 'Kharif',
  historicalAvgPrice: 40,
}

const sampleDemandBody = {
  cropName: 'Tomato',
  state: 'Maharashtra',
  month: 6,
  season: 'Kharif',
  forecastWeeks: 2,
}

const sampleRecommendBody = {
  soilType: 'loamy',
  topK: 3,
}

const samplePriceRangeBody = {
  cropType: 'Tomato',
  historicalAvgPrice: 35,
  state: 'Maharashtra',
  district: 'Pune',
  quantity: 50,
  month: 6,
  season: 'Kharif',
}

async function run() {
  console.log(`\nKrishiBazaar API tests\n  API_BASE: ${API_BASE}\n  ML_SERVICE_URL (diag): ${ML_SERVICE_URL}\n`)

  let accessToken = null
  let refreshToken = null

  await test('GET /api/health — 200', async () => {
    const res = await api.get('/api/health')
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (!res.data?.success) fail('expected success: true')
  })

  await test('GET /api/delivery/zones — 200', async () => {
    const res = await api.get('/api/delivery/zones')
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/listings — 200 (public)', async () => {
    const res = await api.get('/api/listings')
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  try {
    const mlPing = await axios.get(`${ML_SERVICE_URL}/health`, { validateStatus: () => true, timeout: 5000 })
    if (mlPing.status === 200 && mlPing.data?.status) {
      console.log(`  · ML service reachable at ${ML_SERVICE_URL}`)
    } else {
      console.log(`  · ML service not healthy (${mlPing.status}) — /api/ml/* may return fallback until FastAPI is up`)
    }
  } catch {
    console.log(`  · ML service unreachable — /api/ml/* may return fallback (start FastAPI on ${ML_SERVICE_URL})`)
  }

  const email = process.env.TEST_EMAIL
  const password = process.env.TEST_PASSWORD

  if (!email || !password) {
    console.log('\n  Skipping authenticated tests (set TEST_EMAIL and TEST_PASSWORD in backend/.env)\n')
    printSummary()
    process.exit(results.some((r) => !r.ok) ? 1 : 0)
    return
  }

  await test('POST /api/auth/login — 200', async () => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.status !== 200) fail(`login failed: ${res.status} ${JSON.stringify(res.data)}`)
    const session = extractLogin(res)
    if (!session?.accessToken) fail('no accessToken in response')
    accessToken = session.accessToken
    refreshToken = session.refreshToken
  })

  const t = accessToken

  await test('GET /api/auth/me — 200 (Bearer)', async () => {
    const res = await api.get('/api/auth/me', { headers: authHeaders(t) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (!res.data?.data?.email && !res.data?.data?._id) fail('expected user payload')
  })

  await test('POST /api/auth/refresh-token — 200', async () => {
    if (!refreshToken) {
      fail('no refreshToken from login')
      return
    }
    const res = await api.post('/api/auth/refresh-token', { refreshToken })
    if (res.status !== 200) fail(`expected 200, got ${res.status}: ${JSON.stringify(res.data)}`)
    const nextAccess = res.data?.data?.accessToken
    const nextRefresh = res.data?.data?.refreshToken
    if (!nextAccess) fail('no new accessToken')
    accessToken = nextAccess
    refreshToken = nextRefresh || refreshToken
  })

  const bearer = accessToken

  await test('PATCH /api/auth/me — 200', async () => {
    const res = await api.patch(
      '/api/auth/me',
      { name: `Test User ${Date.now()}` },
      { headers: authHeaders(bearer) }
    )
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/notifications — 200', async () => {
    const res = await api.get('/api/notifications', { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/notifications/unread-count — 200', async () => {
    const res = await api.get('/api/notifications/unread-count', { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/ai/price-prediction — 200', async () => {
    const res = await api.get('/api/ai/price-prediction', {
      headers: authHeaders(bearer),
      params: { cropName: 'Tomato', district: 'Pune' },
    })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/ai/market-trends — 200', async () => {
    const res = await api.get('/api/ai/market-trends', {
      headers: authHeaders(bearer),
      params: { district: 'Pune' },
    })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('GET /api/delivery/estimate — 200 (auth)', async () => {
    const res = await api.get('/api/delivery/estimate', {
      headers: authHeaders(bearer),
      params: {
        fromDistrict: 'Pune',
        toDistrict: 'Mumbai',
        quantity: 10,
        perishability: 'medium',
      },
    })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  await test('POST /api/ml/price — 200', async () => {
    const res = await api.post('/api/ml/price', samplePriceBody, { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (res.data?.fallback) {
      console.log('    (note: ML fallback — ensure FastAPI is running and models exist for real inference)')
    }
  })

  await test('POST /api/ml/demand — 200', async () => {
    const res = await api.post('/api/ml/demand', sampleDemandBody, { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (res.data?.fallback) console.log('    (note: ML fallback)')
  })

  await test('POST /api/ml/recommend-crop — 200', async () => {
    const res = await api.post('/api/ml/recommend-crop', sampleRecommendBody, { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (res.data?.fallback) console.log('    (note: ML fallback)')
  })

  await test('POST /api/ml/predict-price-range — 200', async () => {
    const res = await api.post('/api/ml/predict-price-range', samplePriceRangeBody, { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (res.data?.fallback) console.log('    (note: ML fallback)')
  })

  await test('POST /api/ml/listing-insights — 200', async () => {
    const res = await api.post(
      '/api/ml/listing-insights',
      { ...samplePriceBody, soilType: 'loamy' },
      { headers: authHeaders(bearer) }
    )
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    if (!res.data?.insights) fail('expected insights object')
  })

  await test('POST /api/ml/quality — multipart image', async () => {
    const form = new FormData()
    form.append('file', TINY_PNG, { filename: 'probe.png', contentType: 'image/png' })
    form.append('cropName', 'Tomato')
    const res = await api.post('/api/ml/quality', form, {
      headers: { ...form.getHeaders(), ...authHeaders(bearer) },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
    if (res.status !== 200 && res.status !== 500 && res.status !== 503) {
      fail(`expected 200/500/503, got ${res.status}`)
    }
    if (res.status !== 200) {
      console.log(`    (note: quality returned ${res.status} — model or inference issue on ML service)`)
    }
  })

  const farmerEmail = process.env.TEST_FARMER_EMAIL
  const farmerPassword = process.env.TEST_FARMER_PASSWORD
  if (farmerEmail && farmerPassword) {
    let farmerToken = null
    await test('[farmer] POST /api/auth/login', async () => {
      const res = await api.post('/api/auth/login', { email: farmerEmail, password: farmerPassword })
      if (res.status !== 200) fail(`farmer login failed: ${res.status}`)
      farmerToken = extractLogin(res)?.accessToken
      if (!farmerToken) fail('no farmer token')
    })
    await test('[farmer] GET /api/listings/my — 200', async () => {
      const res = await api.get('/api/listings/my', { headers: authHeaders(farmerToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
    await test('[farmer] GET /api/orders/incoming — 200', async () => {
      const res = await api.get('/api/orders/incoming', { headers: authHeaders(farmerToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
  } else {
    console.log('\n  (Skipping farmer tests: set TEST_FARMER_EMAIL / TEST_FARMER_PASSWORD)\n')
  }

  const buyerEmail = process.env.TEST_BUYER_EMAIL
  const buyerPassword = process.env.TEST_BUYER_PASSWORD
  if (buyerEmail && buyerPassword) {
    let buyerToken = null
    await test('[buyer] POST /api/auth/login', async () => {
      const res = await api.post('/api/auth/login', { email: buyerEmail, password: buyerPassword })
      if (res.status !== 200) fail(`buyer login failed: ${res.status}`)
      buyerToken = extractLogin(res)?.accessToken
      if (!buyerToken) fail('no buyer token')
    })
    await test('[buyer] GET /api/orders/my — 200', async () => {
      const res = await api.get('/api/orders/my', { headers: authHeaders(buyerToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
  } else {
    console.log('  (Skipping buyer tests: set TEST_BUYER_EMAIL / TEST_BUYER_PASSWORD)\n')
  }

  const tpEmail = process.env.TEST_TRANSPORTER_EMAIL
  const tpPassword = process.env.TEST_TRANSPORTER_PASSWORD
  if (tpEmail && tpPassword) {
    let tpToken = null
    await test('[transporter] POST /api/auth/login', async () => {
      const res = await api.post('/api/auth/login', { email: tpEmail, password: tpPassword })
      if (res.status !== 200) fail(`transporter login failed: ${res.status}`)
      tpToken = extractLogin(res)?.accessToken
      if (!tpToken) fail('no transporter token')
    })
    await test('[transporter] GET /api/transporter/available-jobs — 200', async () => {
      const res = await api.get('/api/transporter/available-jobs', { headers: authHeaders(tpToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
    await test('[transporter] GET /api/transporter/my-jobs — 200', async () => {
      const res = await api.get('/api/transporter/my-jobs', { headers: authHeaders(tpToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
  } else {
    console.log('  (Skipping transporter tests: set TEST_TRANSPORTER_EMAIL / TEST_TRANSPORTER_PASSWORD)\n')
  }

  const adminEmail = process.env.TEST_ADMIN_EMAIL
  const adminPassword = process.env.TEST_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    let adminToken = null
    await test('[admin] POST /api/auth/login', async () => {
      const res = await api.post('/api/auth/login', { email: adminEmail, password: adminPassword })
      if (res.status !== 200) fail(`admin login failed: ${res.status}`)
      adminToken = extractLogin(res)?.accessToken
      if (!adminToken) fail('no admin token')
    })
    await test('[admin] GET /api/admin/stats — 200', async () => {
      const res = await api.get('/api/admin/stats', { headers: authHeaders(adminToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
    await test('[admin] GET /api/admin/users — 200', async () => {
      const res = await api.get('/api/admin/users', { headers: authHeaders(adminToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
    await test('[admin] GET /api/admin/disputes — 200', async () => {
      const res = await api.get('/api/admin/disputes', { headers: authHeaders(adminToken) })
      if (res.status !== 200) fail(`expected 200, got ${res.status}`)
    })
  } else {
    console.log('  (Skipping admin tests: set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)\n')
  }

  await test('POST /api/auth/logout — 200', async () => {
    const res = await api.post('/api/auth/logout', {}, { headers: authHeaders(bearer) })
    if (res.status !== 200) fail(`expected 200, got ${res.status}`)
  })

  printSummary()
  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n── Summary: ${passed} passed, ${failed} failed ──\n`)
  if (failed) process.exitCode = 1
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
