# KrishiMitra Frontend

Frontend for KrishiMitra, a farm-to-buyer marketplace where farmers sell directly to buyers.

## Tech

- React 19
- Vite 8
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Branch

This README is for the `frontend` branch.

Mount in `app.js`:
```js
import orderRoutes from './routes/order.routes.js'
app.use('/api/orders', orderRoutes)
```

---

## API Reference (Dev B endpoints)

### Listing Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/listings` | farmer | Create listing with optional image |
| `GET` | `/api/listings` | public | Marketplace — supports filters |
| `GET` | `/api/listings/my` | farmer | Farmer's own listings (all, incl. deleted) |
| `GET` | `/api/listings/:id` | public | Single listing detail |
| `PUT` | `/api/listings/:id` | farmer | Update listing — partial update safe |
| `DELETE` | `/api/listings/:id` | farmer | Soft delete — sets isAvailable: false |

### Order Routes (farmer only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/orders/incoming` | farmer | All orders on farmer's listings |
| `PATCH` | `/api/orders/:id/status` | farmer | Accept or reject a pending order |

---

## Security Decisions

| Rule | Where enforced |
|---|---|
| JWT verified on every protected route | `authMiddleware.js` (Dev A) |
| Role checked before controller runs | `roleMiddleware.js` (Dev A) |
| Ownership verified before update/delete | `listingController.js`, `orderController.js` |
| `totalPrice` always calculated server-side | `orderController.js` |
| Marketplace never shows soft-deleted listings | `isAvailable: true` filter in `getAllListings` |
| Passwords never returned in responses | `.populate()` field selection throughout |
| Files never touch disk | `multer.memoryStorage()` |

---

## Postman Testing

All 14 checks have been verified:

| # | Test | Expected |
|---|---|---|
| 1 | Create listing with image | `201` + Cloudinary URL in `imageUrl` |
| 2 | Create listing without image | `201` + `imageUrl: ""` |
| 3 | Buyer tries to create listing | `403` |
| 4 | Upload wrong file type | `400` + mimetype message |
| 5 | Upload file over 5MB | `400` + size message |
| 6 | Get all listings + filters | `200` + correct filtered results |
| 7 | Get single listing / bad ID | `200` / `404` |
| 8 | Get my listings | `200` + includes soft-deleted |
| 9 | Update listing + ownership guard | `200` / `403` |
| 10 | Soft delete + verify both routes | hidden from marketplace, visible in `/my` |
| 11 | Get incoming orders | `200` + correct populates |
| 12 | Accept an order | `200` |
| 13 | Update already-accepted order | `400` |
| 14 | Invalid status value | `400` |

---

## What Remains

### Waiting on Dev A
- `middleware/authMiddleware.js` — verifies JWT, attaches `req.user`
- `middleware/roleMiddleware.js` — named export `{ roleMiddleware }`
- `controllers/authController.js` — register, login, logout, getMe
- `controllers/orderController.js` — buyer methods (placeOrder, getMyOrders)

### Frontend (not started)
- Auth pages — register + login with role selector
- `AuthContext` + Axios interceptor
- Farmer dashboard — create listing form, my listings, incoming orders
- Buyer marketplace — browse, filter, listing detail, place order, track orders

### Phase 2 — AI / ML
- Python Flask microservice
- scikit-learn price prediction model
- Integration with AgriConnect backend

---

## Packages

```bash
npm install cloudinary multer
```

All other dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`) are part of the base project setup.
>>>>>>> 3d846af77303fcd9b71103a738594b8a2c1a974d
