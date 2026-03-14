# Frontend–Backend Integration Status (KrishiBazaar / KrishiMitra)

This document lists what is **integrated** with the real backend, what is still **mock or missing**, and **what to do** to complete integration.

---

## Backend base

- **URL:** `http://localhost:5000` (API under `/api/...`)
- **Stack:** Node, Express, MongoDB/Mongoose
- **Auth:** JWT `accessToken` (and optional refresh token). Frontend stores `token` in localStorage and sends `Authorization: Bearer <token>`.

---

## ✅ Integrated (frontend calls real backend)

| Area | Frontend API | Backend route(s) | Notes |
|------|--------------|------------------|--------|
| **Auth** | `authApi` (login, register, getMe) | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` | Login returns `user` + `accessToken`; frontend stores as `token`. |
| **Listings (crops)** | `cropsApi` | `GET/POST/PUT/DELETE /api/listings`, `GET /api/listings/my` | Backend uses `/listings` (not `/crops`). Listing shape: `delivery` → frontend alias `deliveryOptions`. |
| **Orders** | `ordersApi` | `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders/incoming`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status` (accept/decline), `PATCH .../schedule-pickup`, `.../dispatch`, `.../confirm-handoff`, `.../verify-otp`, `.../mark-delivered`, `.../confirm-received` | Buyer uses `/my`, farmer uses `/incoming`. Single order: `GET /orders/:id`. |
| **Notifications** | `notificationsApi` | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH .../read-all`, `PATCH .../:id/read` | Unread badge and mark read are live. |
| **Transporter jobs** | `deliveryApi` (part) | `GET /api/transporter/my-jobs`, `GET /api/transporter/my-jobs/:orderId`, `PATCH /api/orders/:id/verify-otp`, `PATCH /api/orders/:id/mark-delivered` | Assigned jobs, job detail, OTP pickup, mark delivered are live. |
| **Dispute** | `ordersApi.raiseDispute` | `POST /api/orders/:id/dispute` (multipart: reason, description, evidence) | Use when building dispute form (buyer/farmer). |

---

## ⚠️ Still mock or not implemented

### 1. Delivery estimate (before placing order)

- **Frontend:** `deliveryApi.getEstimate({ fromDistrict, toDistrict, quantity, perishability })` used on CropDetail and OrderConfirm.
- **Backend:** No standalone “delivery estimate” endpoint. Delivery cost is computed inside `placeOrder` when method is `platform_transporter`.
- **To integrate (choose one):**
  - **Option A (recommended):** Add backend route e.g. `POST /api/orders/delivery-estimate` or `GET /api/delivery/estimate?from=&to=&quantity=&perishability=` that uses the same `calculateDelivery` logic and returns `{ estimatedCost, zone, distanceKm }`. Then in `deliveryApi.getEstimate` call this endpoint instead of the mock.
  - **Option B:** Keep mock on frontend and show “Estimated at checkout” until order is placed.

### 2. Transporter: “Available jobs” and “Accept job”

- **Frontend:** `deliveryApi.getAvailableJobs()`, `deliveryApi.acceptJob(id)` (e.g. TransporterDashboard, AvailableJobs page).
- **Backend:** Transporter is **assigned** when the farmer schedules a pickup (no “browse and accept” pool). So there is no “available jobs” list or “accept job” API.
- **To integrate:**
  - Either **remove or repurpose** “Available jobs” in the UI (e.g. show only “Assigned jobs” from `getAssignedJobs`).
  - Or **add backend** support for a job pool (e.g. unassigned orders in transporter zones and `POST /api/transporter/jobs/:orderId/accept`). This is a larger feature.

### 3. Transporter: `updateJobStatus` (at_farm, in_transit, etc.)

- **Frontend:** `deliveryApi.updateJobStatus(id, { status })` (e.g. “Start pickup”, “Start delivery”).
- **Backend:** No generic “update job status” for transporter. Only `verify-otp` (pickup) and `mark-delivered` exist.
- **To integrate:** Either rely only on OTP + mark delivered in the UI, or add backend endpoints for intermediate statuses (e.g. `at_farm`, `in_transit`) if you want them.

### 4. Admin APIs

- **Frontend:** `adminApi` (platform stats, disputes, users, verify user) used by admin dashboard.
- **Backend:** No admin routes in the current app.
- **To integrate:** Add backend routes (e.g. under `/api/admin`) for stats, disputes list/resolve, users list, verify user, then replace mock implementations in `frontend/src/api/endpoints/adminApi.js` with real axios calls.

### 5. AI / price prediction

- **Frontend:** `aiApi` (e.g. price prediction, market trends).
- **Backend:** No AI or price-prediction endpoints.
- **To integrate:** Add backend services and routes (e.g. `/api/ai/price-prediction`, `/api/ai/market-trends`), then wire `aiApi` to them; or keep mock for demo.

### 6. Auth: profile update and refresh token

- **Frontend:** `authApi.updateProfile(data)`.
- **Backend:** No `PATCH /api/auth/me` for profile update. Refresh token exists (`POST /api/auth/refresh-token`) but frontend does not use it yet.
- **To integrate:** Add `PATCH /api/auth/me` (or similar) for profile update. Optionally implement refresh flow in the frontend (store refresh token, call refresh before 401, retry request).

### 7. Disputes (buyer/farmer)

- **Frontend:** `ordersApi.raiseDispute(orderId, { reason, description, evidence[] })` is implemented and calls the backend.
- **Backend:** `POST /api/orders/:id/dispute` with `reason`, `description`, and optional `evidence` files exists.
- **To integrate:** Ensure any dispute form (e.g. on order detail or `/farmer/orders/:id/dispute`) calls `ordersApi.raiseDispute(id, payload)` with the form data and optional file list for evidence.

---

## Summary: what to do next

| Item | Where | Action |
|------|--------|--------|
| Delivery estimate | Backend | Add GET or POST delivery-estimate endpoint using existing `calculateDelivery`; then wire `deliveryApi.getEstimate`. |
| Transporter “available jobs” | Backend + Frontend | Either remove/repurpose UI or add job-pool + accept API. |
| Transporter `updateJobStatus` | Backend + Frontend | Add status endpoints or simplify UI to OTP + mark delivered only. |
| Admin | Backend + Frontend | Add `/api/admin/*` and replace mock `adminApi`. |
| AI | Backend + Frontend | Add AI routes and wire `aiApi`, or keep mock. |
| Profile update | Backend | Add `PATCH /api/auth/me`. Optionally wire refresh token in frontend. |
| Dispute submit | Frontend | `raiseDispute` is in `ordersApi`; wire the dispute form to it (reason, description, evidence files). |

---

## Running the stack

1. **Backend:** From repo root, `cd backend && npm install && npm run dev` (or your start script). Ensure MongoDB is running and `.env` has DB and JWT secrets.
2. **Frontend:** `cd frontend && npm install`. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL=http://localhost:5000/api` if needed. Run `npm run dev`.
3. CORS is set for `http://localhost:5173`; adjust on the backend if you use another origin.

---

*Last updated to reflect integration of auth, listings, orders, notifications, and transporter assigned jobs + OTP + mark delivered.*
