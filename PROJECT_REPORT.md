# KrishiMitra - Project Report

## Executive Summary

**KrishiMitra** is a comprehensive agricultural e-commerce and logistics platform designed to bridge the gap between farmers and buyers while providing data-driven insights through artificial intelligence. The platform streamlines crop transactions, manages delivery logistics, and provides predictive analytics for pricing, demand forecasting, and quality assessment—all within a secure, role-based ecosystem.

---

## 1. Project Overview

### 1.1 Project Name
**KrishiMitra** (Farmer Friend)

### 1.2 Project Type
Full-stack web application with AI/ML microservices

### 1.3 Primary Objective
To create a transparent, efficient marketplace for agricultural products while eliminating middlemen, reducing transaction costs, and providing intelligent insights for better decision-making.

### 1.4 Target Users
- **Farmers**: Crop sellers, listing management, order fulfillment
- **Buyers**: Bulk purchasing, marketplace browsing, order tracking
- **Transporters**: Logistics management, delivery coordination
- **Admins**: Platform oversight, user management, dispute resolution

### 1.5 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React.js, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express.js, MongoDB |
| **AI/ML Service** | Python 3.x, FastAPI, scikit-learn, pandas |
| **Database** | MongoDB (Atlas), Mongoose ODM |
| **Authentication** | JWT (Access & Refresh Tokens), bcryptjs |
| **Notifications** | Notification Service (In-app) |
| **Delivery** | Custom delivery zone system, Transporter network |

---

## 2. System Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │  Farmer Portal   │  │  Buyer Portal    │  │  Admin Dashboard ││
│  │  (React.js)      │  │  (React.js)      │  │  (React.js)      ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│  └──────────────────────────────────────────────────────────────┘
│                              ▼
│  ┌─────────────────────────────────────────────────────────────┐
│  │     Backend API Gateway (Express.js Server)                 │
│  │     - CORS & Security Middleware                            │
│  │     - OAuth/JWT Authentication                              │
│  │     - Request Validation & Error Handling                   │
│  └─────────────────────────────────────────────────────────────┘
│
├─────────────────────────────────────────────────────────────────┐
│                  ROUTING LAYER                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Auth Routes  │ │Listing Routes│ │Order Routes  │ ...         │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
│
├─────────────────────────────────────────────────────────────────┐
│              SERVICE & BUSINESS LOGIC LAYER                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • User Service       • Listing Service                     │ │
│  │ • Order Service      • Delivery Service                    │ │
│  │ • Notification Srv   • Review Service                      │ │
│  │ • OTP Service        • Transporter Service                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
├─────────────────────────────────────────────────────────────────┐
│              DATABASE & DATA ACCESS LAYER                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ MongoDB Database │  │ Mongoose Models  │  │ Data Validation│ │
│  │ (Atlas Cloud)    │  │ (ODM)            │  │ & Schemas      │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┐
│         AI/ML MICROSERVICE (Python FastAPI)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Price Prediction Model                                  │ │
│  │ • Demand Forecasting Engine                               │ │
│  │ • Crop Quality Assessment                                 │ │
│  │ • Recommendation System                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Description

#### **Frontend Layer**
- **Technology**: React.js with Vite bundler
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: Context API, Redux/Zustand (if applicable)
- **UI Components**: Reusable components for forms, listings, orders, profiles

#### **Backend Layer**
- **Framework**: Express.js (Node.js)
- **Entry Point**: `server.js` → `src/app.js`
- **Port**: 5000 (default)

#### **Database Layer**
- **Primary DB**: MongoDB Atlas (Cloud)
- **ORM**: Mongoose
- **Connection**: Secure URI with credentials in `.env`

#### **AI/ML Microservice**
- **Framework**: FastAPI (Python)
- **Port**: 8000 (typical)
- **Dependencies**: scikit-learn, pandas, numpy, FastAPI, Uvicorn

---

## 3. Core Features

### 3.1 Authentication & User Management

#### User Roles
1. **Farmer**
   - Register with farm details (size, type: organic/conventional/mixed)
   - Create and manage crop listings
   - Accept/reject orders
   - Track order fulfillment
   - Profile management

2. **Buyer**
   - Browse marketplace
   - Search crops by category, price range, quality
   - Add items to cart
   - Place orders with delivery options
   - Track orders
   - Write reviews

3. **Transporter**
   - View available delivery jobs
   - Accept jobs
   - Track active deliveries
   - View trip history
   - Manage profile

4. **Admin**
   - User management & verification
   - Dispute resolution
   - Platform analytics
   - System oversight

#### Authentication Mechanism
- **JWT (JSON Web Tokens)**: Dual-token system
  - **Access Token**: Short-lived (15-30 mins), used for API requests
  - **Refresh Token**: Long-lived (7-30 days), stored in HTTP-only cookies
- **Password Security**: bcryptjs hashing (salt rounds: 10)
- **Email Verification**: OTP-based verification system

### 3.2 Crop Listing & Marketplace

#### Crop Listing Features
- **Farmer Side**:
  - Create listings with: crop name, category, quantity, price, quality grade
  - Upload product images
  - Set minimum order quantity
  - Track inventory in real-time
  - Update listing status (active/sold_out/inactive)

- **Buyer Side**:
  - Advanced search & filtering (crop type, price range, quality grade, location)
  - Sort by: price, rating, distance, availability
  - View crop details with images and farmer profile
  - Check quality certifications
  - Read reviews from previous buyers

#### Data Model
```
Crop Listing
├── farmer (FK: User)
├── cropName
├── category (vegetable, grain, fruit, spice, dairy, other)
├── quantity & availableQty
├── pricePerKg
├── quality (grade: A/B/C, perishability)
├── harvestDate
├── images
├── location (farm address)
└── status (active/sold_out/inactive)
```

### 3.3 Order Management System

#### Order Lifecycle

```
1. PENDING           (Buyer places order → Farmer reviews)
   ↓
2. ACCEPTED/REJECTED (Farmer accepts or rejects)
   ├─→ REJECTED: Buyer notified, inventory restored
   └─→ ACCEPTED: Proceeds to next stage
   ↓
3. READY_FOR_PICKUP  (Farmer prepares crop)
   ↓
4. IN_TRANSIT        (Transporter picks up & delivers)
   ↓
5. DELIVERED         (Delivery confirmed)
   ↓
6. COMPLETED         (Order finalized, reviewed)

ALTERNATIVE PATHS:
- EXPIRED: Order not accepted within deadline
- CANCELLED: User-initiated cancellation
- DISPUTE: Initiated by buyer or farmer
```

#### Order Details
```
Order Schema
├── buyer (FK: User)
├── farmer (FK: User)
├── cropListing (FK: CropListing)
│
├── orderDetails
│   ├── cropName, quantity, pricePerKg
│   ├── cropAmount, grade, harvestDate
│   └── totalAmount
│
├── delivery
│   ├── method (farmer_delivers/buyer_pickup/platform_transporter)
│   ├── zone, distanceKm
│   ├── deliveryFee, platformFee, totalAmount
│   ├── pickup (scheduledDate, slot, transporter, OTP, confirmation)
│   └── agreedDate, buyerAddress, farmAddress
│
├── payment
│   ├── status (pending/held/released/failed)
│   ├── autoReleaseAt, releasedAt
│   └── amount
│
└── status (pending/accepted/rejected/ready_for_pickup/in_transit/delivered/completed/expired/cancelled)
```

#### Automated Jobs
**Server Background Jobs** (run on intervals):

1. **Order Expiry Job** (Every 5 minutes)
   - Finds pending orders with expired acceptance deadline
   - Sets status to 'expired'
   - Restores inventory to farmer's crop listing
   - Notifies farmer & buyer of expiration

2. **Auto-Release Payment Job** (Every 1 hour)
   - Finds held payments past their auto-release time
   - Releases payment to farmer's account
   - Ensures timely fund settlement

### 3.4 Delivery & Logistics

#### Delivery Zones
- Platform maintains delivery zones based on districts
- Calculates distances between farm and delivery location
- Applies distance-based delivery fee (if platform transporter used)

#### Delivery Methods
1. **Farmer Delivers**: Farmer arranges own transportation
2. **Buyer Pickup**: Buyer collects from farm
3. **Platform Transporter**: Platform arranges reliable transporter

#### OTP-Based Verification
- OTP generated at pickup time
- Farmer confirms loading when transporter arrives
- OTP verified during delivery completion
- Prevents fraud and ensures accountability

#### Transporter Model
```
Transporter
├── user (FK: User)
├── vehicleType, vehicleNumber
├── capacity (kg)
├── serviceZones (array of districts)
├── isAvailable, averageRating
└── completedTrips
```

### 3.5 Payment System

#### Payment Flow
```
Order Created (Payment: PENDING)
        ↓
Farmer Accepts (Payment: HELD - held until delivery)
        ↓
Delivery Completed
        ↓
Payment Auto-Released OR Manual Release by Buyer
        ↓
Farmer Account Credited
```

#### Features
- **Escrow-Like System**: Payment held until delivery confirmed
- **Auto-Release**: Payments automatically released after specified period
- **Security**: Prevents fraud through staged payment release
- **Transaction History**: Transparent tracking for all parties

### 3.6 Review & Rating System

#### Review Features
- **Post-Delivery Reviews**: Buyers can rate crops (1-5 stars)
- **Farmer Reputation**: Average rating affects visibility
- **Quality Feedback**: Comments on crop quality, packaging, delivery
- **Farmer Response**: Farmers can respond to reviews

#### Review Model
```
Review
├── buyer (FK: User)
├── farmer (FK: User)
├── order (FK: Order)
├── rating (1-5)
├── comment, images
├── quality, packaging, delivery ratings
└── farmerResponse
```

### 3.7 Notification System

#### Notification Types
- **Order Updates**: Pending, accepted, ready, in-transit, delivered
- **Payment Updates**: Payment held, released
- **Delivery Updates**: Transporter assigned, pickup scheduled
- **System Alerts**: Order expiry, payment deadlines
- **Review Notifications**: New reviews, farmer responses

#### Delivery Methods
- In-app notifications (stored in database)
- SMS/Email (extensible)
- Real-time push (via WebSockets - if implemented)

---

## 4. API Routes & Endpoints

### 4.1 Route Structure

```
/api/auth                → Authentication (login, register, token refresh)
/api/listings            → Crop listings management
/api/crops               → Crop browsing (alias for listings)
/api/orders              → Order management
/api/notifications       → User notifications
/api/transporter         → Transporter operations
/api/transporters        → Transporter queries
/api/delivery            → Delivery management
/api/admin               → Admin operations
/api/ai                  → AI/ML predictions (price, demand, quality)
/api/reviews             → Review management
/api/health              → Health check endpoint
```

### 4.2 Key Endpoints (Examples)

#### Authentication
```
POST   /api/auth/register         → User registration
POST   /api/auth/login            → User login
POST   /api/auth/refresh-token    → Refresh access token
POST   /api/auth/logout           → Logout
```

#### Crop Listings
```
GET    /api/listings              → Get all listings (with filters)
GET    /api/listings/:id          → Get listing details
POST   /api/listings              → Create listing (Farmer)
PUT    /api/listings/:id          → Update listing (Farmer)
DELETE /api/listings/:id          → Delete listing (Farmer)
```

#### Orders
```
GET    /api/orders                → Get user's orders
GET    /api/orders/:id            → Get order details
POST   /api/orders                → Create order (Buyer)
PUT    /api/orders/:id/accept     → Accept order (Farmer)
PUT    /api/orders/:id/reject     → Reject order (Farmer)
PUT    /api/orders/:id/status     → Update order status
```

#### AI/ML Services
```
POST   /api/ai/predict-price      → Price prediction
POST   /api/ai/forecast-demand    → Demand forecasting
POST   /api/ai/assess-quality     → Quality assessment
POST   /api/ai/recommendations    → Get recommendations
```

---

## 5. Data Flow & User Journeys

### 5.1 Farmer's Journey

```
┌─────────────────────────────────────────────────────────────┐
│ FARMER WORKFLOW                                             │
└─────────────────────────────────────────────────────────────┘

1. REGISTRATION & SETUP
   ├─ Register with email, password
   ├─ Select "Farmer" role
   ├─ Fill farm details (size, type, location)
   ├─ Verify email via OTP
   └─ Profile setup complete

2. CREATE CROP LISTING
   ├─ Go to "My Listings"
   ├─ Click "Add New Listing"
   ├─ Fill crop details:
   │  ├─ Crop name, category
   │  ├─ Quantity, price per kg
   │  ├─ Quality grade
   │  ├─ Harvest date
   │  └─ Upload images
   ├─ AI Suggestion: System suggests optimal price via price prediction
   └─ Listing published → Visible in marketplace

3. RECEIVE & MANAGE ORDERS
   ├─ Buyer places order for their crop
   ├─ Farmer receives notification
   ├─ Go to "Orders" tab
   ├─ Review order details:
   │  ├─ Buyer info, quantity, total amount
   │  ├─ Delivery method, scheduled pickup
   │  └─ Payment status (held in escrow)
   ├─ DECISION:
   │  ├─ ACCEPT → Prepare crop for pickup
   │  └─ REJECT → Inventory restored, buyer notified
   └─ If ACCEPTED, status changes to READY_FOR_PICKUP

4. FULFILL ORDER
   ├─ Prepare crop for delivery/pickup
   ├─ If platform transporter:
   │  ├─ Transporter arrives with OTP
   │  ├─ Farmer verifies OTP
   │  ├─ Farmer confirms loading in app
   │  └─ Transporter takes possession
   ├─ If buyer pickup:
   │  ├─ Buyer arranges time
   │  ├─ Handover confirmation
   │  └─ Order marked delivered
   └─ Status → DELIVERED

5. RECEIVE PAYMENT
   ├─ After delivery confirmed
   ├─ Payment automatically released (or manually by buyer)
   ├─ Funds credited to farmer account
   ├─ Notification: "Payment received"
   └─ Order marked COMPLETED

6. MANAGE REPUTATION
   ├─ Buyer leaves review & rating
   ├─ Farmer sees feedback
   ├─ Farmer can respond to reviews
   └─ Rating affects future visibility
```

### 5.2 Buyer's Journey

```
┌─────────────────────────────────────────────────────────────┐
│ BUYER WORKFLOW                                              │
└─────────────────────────────────────────────────────────────┘

1. REGISTRATION & SETUP
   ├─ Register with email, password
   ├─ Select "Buyer" role
   ├─ Fill personal details & delivery address
   ├─ Verify email via OTP
   └─ Profile setup complete

2. EXPLORE MARKETPLACE
   ├─ Go to "Marketplace"
   ├─ View featured crops
   ├─ Search/Filter options:
   │  ├─ Crop name/category
   │  ├─ Price range
   │  ├─ Quality grade (A/B/C)
   │  ├─ Location/Distance
   │  └─ Farmer rating
   └─ Results sorted by relevance/price/rating

3. VIEW CROP DETAILS
   ├─ Click on crop listing
   ├─ See full details:
   │  ├─ Images, description, quantity available
   │  ├─ Price per kg, quality certifications
   │  ├─ Farmer profile & ratings
   │  ├─ Previous buyer reviews
   │  └─ Harvest date & freshness info
   ├─ AI Feature: "Price Prediction"
   │  └─ Shows historical price trends & forecast
   └─ ADD TO CART or PROCEED TO ORDER

4. PLACE ORDER
   ├─ Review cart items
   ├─ Click "Checkout"
   ├─ Enter/Select:
   │  ├─ Delivery address
   │  ├─ Delivery method:
   │  │  ├─ Farmer delivers
   │  │  ├─ Buyer picks up
   │  │  └─ Platform transporter (with fee)
   │  └─ Preferred delivery date/slot
   ├─ Review order summary:
   │  ├─ Crop amount, delivery fee, platform fee
   │  └─ Total amount
   ├─ Confirm order
   └─ Payment held in escrow

5. TRACK ORDER
   ├─ Go to "My Orders"
   ├─ See order status in real-time:
   │  ├─ PENDING: Waiting for farmer acceptance
   │  ├─ ACCEPTED: Farmer preparing
   │  ├─ READY_FOR_PICKUP: Ready for transporter/pickup
   │  ├─ IN_TRANSIT: On the way
   │  └─ DELIVERED: Arrived
   ├─ View farmer & transporter info
   ├─ Receive notifications at each stage
   └─ Chat/contact farmer if needed

6. RECEIVE & VERIFY DELIVERY
   ├─ Receive crop at specified address
   ├─ Inspect quality, quantity
   ├─ Confirm delivery in app
   ├─ May request buyer-side OTP verification
   └─ Order status → DELIVERED

7. RELEASE PAYMENT & REVIEW
   ├─ Click "Confirm Received"
   ├─ Payment released to farmer
   ├─ Write review:
   │  ├─ Rate crop (1-5 stars)
   │  ├─ Comment on quality, packaging, delivery
   │  └─ Upload photos if needed
   ├─ Submit review
   └─ Order marked COMPLETED
```

### 5.3 Transporter's Journey

```
┌─────────────────────────────────────────────────────────────┐
│ TRANSPORTER WORKFLOW                                        │
└─────────────────────────────────────────────────────────────┘

1. REGISTRATION & SETUP
   ├─ Register as transporter
   ├─ Fill vehicle details:
   │  ├─ Vehicle type, number
   │  ├─ Capacity (kg)
   │  ├─ Service zones
   │  └─ Contact info
   ├─ Verification by admin
   └─ Profile active

2. VIEW AVAILABLE JOBS
   ├─ Go to "Available Jobs"
   ├─ See list of pending pickups:
   │  ├─ Pickup location (farm address)
   │  ├─ Delivery location (buyer address)
   │  ├─ Distance, estimated fee
   │  ├─ Pickup date/slot
   │  └─ Crop details
   └─ Filter by zone, distance, availability

3. ACCEPT JOB
   ├─ Click "Accept Job"
   ├─ Job assigned to transporter
   ├─ Status change: Order → IN_TRANSIT (assigned)
   ├─ Farmer notified of transporter
   └─ Transporter gets farmer contact & address

4. PICKUP PROCESS
   ├─ Navigate to farm location
   ├─ Arrive at pickup time
   ├─ Farmer provides OTP
   ├─ Transporter verifies OTP in app
   ├─ Farmer confirms loading in app
   ├─ Load crop into vehicle
   ├─ Take photos of loaded cargo (optional)
   └─ Depart for delivery

5. IN-TRANSIT
   ├─ Drive to buyer's delivery address
   ├─ App shows real-time tracking (if GPS integrated)
   ├─ Receive periodic updates
   └─ Maintain temperature/conditions (if needed)

6. DELIVERY
   ├─ Arrive at buyer's delivery address
   ├─ Call buyer for final confirmation
   ├─ Unload crop
   ├─ Get buyer signature/OTP confirmation
   ├─ Mark delivery as "COMPLETED"
   ├─ Receive payment (delivery fee)
   └─ Job closed

7. TRIP HISTORY & RATINGS
   ├─ View all completed trips
   ├─ See earnings
   ├─ Check buyer/farmer ratings received
   ├─ Maintain high rating for more job offers
   └─ Monitor performance metrics
```

### 5.4 Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN OPERATIONS                                            │
└─────────────────────────────────────────────────────────────┘

1. USER MANAGEMENT
   ├─ View all registered users
   ├─ Filter by role (farmer/buyer/transporter)
   ├─ Verify email status
   ├─ Check completion metrics (orders count, rating)
   ├─ Ban/Suspend abusive users
   └─ Send notifications/warnings

2. PLATFORM ANALYTICS
   ├─ Total transactions
   ├─ Revenue metrics
   ├─ Popular crops/categories
   ├─ Peak hours/seasonal trends
   ├─ User growth metrics
   └─ Payment statistics

3. DISPUTE RESOLUTION
   ├─ View open disputes
   ├─ Investigate claim (review evidence)
   ├─ Contact parties involved
   ├─ Make judgment call
   ├─ Process refunds if needed
   └─ Update dispute status

4. TRANSPORTER VERIFICATION
   ├─ Review transporter applications
   ├─ Verify documents & vehicle details
   ├─ Approve or reject
   └─ Manage active transporter network

5. CONTENT MODERATION
   ├─ Review reported listings/reviews
   ├─ Remove inappropriate content
   ├─ Issue warnings to users
   └─ Maintain community standards
```

---

## 6. AI/ML Microservice (Python FastAPI)

### 6.1 ML Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│           Python FastAPI Microservice                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Server (http://localhost:8000)              │  │
│  │  - CORS enabled for Node.js backend requests        │  │
│  │  - Request logging & monitoring middleware           │  │
│  │  - Global exception handler                          │  │
│  └──────────────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ML Prediction Routes                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ /predict-price       → Price Prediction       │  │  │
│  │  │ /forecast-demand     → Demand Forecasting     │  │  │
│  │  │ /assess-quality      → Quality Assessment     │  │  │
│  │  │ /recommendations     → Crop Recommendations   │  │  │
│  │  │ /get-metrics         → Get trained metrics    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Trained ML Models (Pickle/Joblib)           │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ • price_model.pkl          (Linear Regression)│  │  │
│  │  │ • demand_model.pkl         (Time Series ARIMA)│  │  │
│  │  │ • quality_model.pkl        (Classification)   │  │  │
│  │  │ • recommendation_model.pkl (Collaborative CF) │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Feature Engineering & Data Processing            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ • Price Normalizer    • Demand Calculator     │  │  │
│  │  │ • Seasonal Adjuster   • Quality Encoder       │  │  │
│  │  │ • Distance Calculator • Location Features     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Data Storage (Models & Metrics)              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ /Models/Saved/                                 │  │  │
│  │  │ • price_metrics.json                           │  │  │
│  │  │ • demand_metrics.json                          │  │  │
│  │  │ • quality_metrics.json                         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 ML Models

#### 1. **Price Prediction Model**
- **Purpose**: Predict optimal market price for crops based on historical data
- **Input Features**:
  - Crop type, grade, harvest date
  - Season, market demand
  - Historical prices
  - Distance to market
- **Output**: Recommended price range (min, avg, max)
- **Algorithm**: Linear Regression / Ensemble (Random Forest)
- **Use Case**: Farmer suggests optimal price; Buyer sees price trends

#### 2. **Demand Forecasting Model**
- **Purpose**: Predict crop demand for upcoming periods
- **Input Features**:
  - Historical sales data
  - Seasonal patterns
  - Market trends
  - Weather data
- **Output**: Demand forecast (units needed in next week/month)
- **Algorithm**: ARIMA / Prophet (Time Series)
- **Use Case**: Farmers plan production; Platform optimizes inventory

#### 3. **Quality Assessment Model**
- **Purpose**: Predict crop quality grade based on characteristics
- **Input Features**:
  - Crop appearance metrics (color, size, texture)
  - Harvest date, storage conditions
  - Farmer quality history
- **Output**: Predicted quality grade (A/B/C) + confidence score
- **Algorithm**: Classification (Logistic Regression / SVM)
- **Use Case**: Auto-grade crops during listing; Verify farmer claims

#### 4. **Recommendation Engine**
- **Purpose**: Recommend relevant crops to buyers
- **Input Features**:
  - Buyer's purchase history
  - Similar buyer profiles
  - Crop popularity
  - Seasonal availability
- **Output**: Top N recommended crops
- **Algorithm**: Collaborative Filtering / Content-Based
- **Use Case**: Personalized marketplace recommendations

### 6.3 Data Flow: ML Integration

```
1. DATA COLLECTION
   ├─ Frontend/Backend collects market data
   ├─ Order history, pricing, demand patterns
   ├─ Weather, location, seasonal factors
   └─ Storage → Datasets/ folder (CSV)

2. DATA PREPROCESSING
   ├─ Clean & normalize data
   ├─ Handle missing values
   ├─ Extract features
   ├─ Train-test split
   └─ Scripts: preprocessing/*.py

3. MODEL TRAINING
   ├─ Train models on historical data
   ├─ Hyperparameter tuning
   ├─ Cross-validation
   ├─ Performance metrics evaluation
   ├─ Save trained models → Models/Saved/
   └─ Scripts: training/Train_*.py

4. MODEL SERVING
   ├─ FastAPI loads pickled models
   ├─ Listens on /api/ai routes
   ├─ Accepts prediction requests from Node backend
   └─ Returns predictions as JSON

5. INTEGRATION
   ├─ Backend calls ML API when needed
   ├─ Frontend displays predictions
   └─ Results used for recommendations & insights
```

---

## 7. Technical Stack Details

### 7.1 Frontend (React.js)

**Key Libraries:**
```json
{
  "react": "18.x",
  "react-router-dom": "6.x (routing)",
  "tailwind-css": "(styling)",
  "axios": "(HTTP client)",
  "react-hot-toast": "(notifications)",
  "vite": "(bundler)",
  "eslint": "(linting)"
}
```

**Folder Structure:**
```
frontend/src/
├── pages/           (Page components)
│   ├── buyer/       (Buyer-specific pages)
│   ├── farmer/      (Farmer-specific pages)
│   ├── transporter/ (Transporter pages)
│   ├── admin/       (Admin pages)
│   └── auth/        (Login, Register)
├── components/      (Reusable components)
├── api/             (API integration layer)
├── context/         (Context API for state)
├── hooks/           (Custom hooks)
├── store/           (Redux/Zustand if used)
├── i18n/            (Internationalization)
├── utils/           (Helper functions)
└── assets/          (Images, icons, etc.)
```

### 7.2 Backend (Node.js + Express)

**Key Libraries:**
```json
{
  "express": "4.x (web framework)",
  "mongoose": "6.x (MongoDB ODM)",
  "jsonwebtoken": "(JWT handling)",
  "bcryptjs": "(password hashing)",
  "cors": "(CORS middleware)",
  "dotenv": "(environment variables)",
  "nodemon": "(development auto-reload)"
}
```

**Folder Structure:**
```
backend/src/
├── routes/          (API endpoints)
├── controllers/     (Business logic)
├── models/          (MongoDB schemas)
├── services/        (Business services)
├── middlewares/     (Express middlewares)
├── utils/           (Helper utilities)
├── config/          (Configuration)
└── app.js           (Express app setup)
```

**Middleware Stack:**
- CORS Handler (origin validation)
- JSON Parser (large payload support)
- Cookie Parser (JWT refresh token handling)
- Error Handler (centralized error catching)
- Auth Middleware (JWT verification)
- Role-Based Access Control (roleCheck middleware)

### 7.3 Database (MongoDB)

**Key Collections:**
```
users
├── email, password, role, phone, location
├── refreshToken, createdAt
└── role-specific fields (farmSize, completedOrders, etc.)

croplistings
├── farmer (reference), cropName, category
├── quantity, availableQty, pricePerKg
├── quality, harvestDate, images
└── status

orders
├── buyer, farmer, cropListing (references)
├── orderDetails, delivery, payment
├── status, timestamps
└── metadata

notifications
├── user (reference), type, content
├── read, createdAt

reviews
├── buyer, farmer, order (references)
├── rating, comment, images

transporters
├── user (reference), vehicle details
├── serviceZones, capacity, rating

notifications
├── recipient, message, type, read

(Additional collections for disputes, transactions, etc.)
```

**Indexes:**
- `users.email` (unique, for fast login)
- `orders.buyer`, `orders.farmer` (for user queries)
- `croplistings.farmer` (for farmer listings)
- `croplistings.status` (for filtering)
- Compound indexes for complex queries

### 7.4 AI/ML Service (Python)

**Framework & Libraries:**
```python
fastapi==0.100.0
uvicorn==0.23.0
pydantic==2.0
scikit-learn==1.3.0
pandas==2.0
numpy==1.24
joblib==1.3
python-dotenv==1.0
```

**Key Files:**
```
AI/
├── API/
│   ├── main.py       (FastAPI app setup)
│   └── routes/       (Prediction endpoints)
│
├── preprocessing/
│   ├── price_preprocessor.py
│   ├── demand_preprocessor.py
│   ├── Image_preprocessor.py
│   └── quality_preprocessor.py
│
├── training/
│   ├── Train_price.py       (Train price model)
│   ├── Train_demand.py      (Train demand model)
│   └── Train_Quality.py     (Train quality model)
│
├── Models/
│   └── Saved/
│       ├── price_metrics.json
│       ├── demand_metrics.json
│       └── quality_metrics.json
│
└── Tests/
    ├── Test_Endpoints.py    (API testing)
    └── test_*.py            (Unit tests)
```

---

## 8. Security Measures

### 8.1 Authentication & Authorization

- **Password Hashing**: bcryptjs (salt rounds: 10+)
- **JWT Tokens**: 
  - Access Token: Short-lived, revoked on logout
  - Refresh Token: HTTP-only cookie, httpOnly flag set
- **Role-Based Access Control (RBAC)**: Routes restricted by user role
- **Token Blacklisting**: Logout invalidates tokens

### 8.2 Data Protection

- **Environment Variables**: Sensitive data in `.env` (not committed)
- **Database Encryption**: MongoDB at-rest encryption enabled
- **TLS/SSL**: HTTPS for production
- **API Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Mongoose schema validation + Pydantic models

### 8.3 Transaction Safety

- **Atomic Operations**: MongoDB transactions for critical operations
- **Payment Escrow**: Payments held until delivery confirmed
- **Two-Factor Verification**: OTP for critical operations (pickup, delivery)
- **Audit Trails**: All transactions logged with timestamps

### 8.4 CORS & API Security

- **CORS Policy**: Whitelist allowed origins
- **CSRF Protection**: Tokens for state-changing operations
- **Helmet.js**: Recommended for additional HTTP headers
- **Request Validation**: Strict schema validation on all inputs

---

## 9. Deployment & Infrastructure

### 9.1 Development Environment

**Local Setup:**
```bash
# Frontend
cd frontend
npm install
npm run dev          # runs on http://localhost:5173

# Backend
cd backend
npm install
npm start            # runs on http://localhost:5000

# AI/ML Service
cd AI/API
pip install -r Requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 9.2 Production Deployment

**Backend Hosting Options:**
- Heroku, Railway, Render, DigitalOcean, AWS EC2

**Frontend Hosting:**
- Vercel, Netlify, AWS S3 + CloudFront

**Database:**
- MongoDB Atlas (Cloud)

**ML Service:**
- Can be deployed alongside backend or separately:
  - Docker containerization
  - Kubernetes orchestration (optional)
  - API Gateway for routing

### 9.3 Environment Variables

**Backend (.env):**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
NODE_ENV=development
```

**AI/ML Service (.env):**
```
FASTAPI_PORT=8000
FASTAPI_ENV=development
MODEL_PATH=./Models/Saved
```

---

## 10. System Flow Diagram

### 10.1 Order Processing Flow

```
┌─ START ─────────────────────────────────────────────────────┐
│                                                              │
├─ BUYER SIDE ─────────────────────────────────────────────────┤
│                                                              │
│  1. Browse marketplace                                       │
│  2. View crop details (AI price prediction shown)            │
│  3. Add to cart                                              │
│  4. Proceed to checkout                                      │
│  5. Select delivery method & address                         │
│  6. Confirm order → Order created (status: PENDING)          │
│  7. Payment goes into escrow (HELD)                          │
│                                                              │
├─ FARMER SIDE ─────────────────────────────────────────────────┤
│                                                              │
│  1. Receives order notification                              │
│  2. Reviews order details                                    │
│  3. Decides: ACCEPT or REJECT                                │
│     └─ If REJECT: Inventory restored, buyer refunded        │
│     └─ If ACCEPT: Proceeds to next step                      │
│  4. Prepares crop for pickup/delivery (READY_FOR_PICKUP)     │
│                                                              │
├─ TRANSPORTER SIDE (if platform delivery) ──────────────────────┤
│                                                              │
│  1. Transporter views available jobs                         │
│  2. Accepts pickup job                                       │
│  3. Navigates to farm location                               │
│  4. Arrives at pickup time                                   │
│  5. Farmer provides OTP → Verified in app                    │
│  6. Load crop, take photos                                   │
│  7. Status: IN_TRANSIT                                       │
│  8. Navigate to buyer's address                              │
│  9. Unload crop                                              │
│  10. Get buyer signature/OTP confirmation                    │
│  11. Mark delivery COMPLETED                                 │
│                                                              │
├─ PAYMENT PROCESSING ─────────────────────────────────────────┤
│                                                              │
│  1. Delivery confirmed                                       │
│  2. Payment auto-release OR manual release by buyer          │
│  3. Funds credit to farmer                                   │
│  4. Notification: Payment received                           │
│  5. Transporter receives delivery fee                        │
│                                                              │
├─ POST-DELIVERY ──────────────────────────────────────────────┤
│                                                              │
│  1. Buyer inspects crop                                      │
│  2. Write review: rating, comment, photos                    │
│  3. Farmer responds to review (optional)                     │
│  4. Order marked COMPLETED                                   │
│  5. Ratings affect future visibility & trust                │
│                                                              │
└─ END ───────────────────────────────────────────────────────┘
```

### 10.2 Background Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SERVER BACKGROUND JOBS (Non-stop, in parallel)             │
└─────────────────────────────────────────────────────────────┘

JOB 1: ORDER EXPIRY CHECK (Every 5 minutes)
├─ Query: Find pending orders with acceptanceDeadline < now
├─ For each expired order:
│   ├─ Set status → EXPIRED
│   ├─ Restore inventory to farmer's listing
│   ├─ If crop was sold_out → Change to active
│   └─ Notify farmer & buyer: "Order Expired"
└─ Repeat

JOB 2: PAYMENT AUTO-RELEASE (Every 1 hour)
├─ Query: Find held payments with autoReleaseAt < now
├─ For each payment:
│   ├─ Set status → RELEASED
│   ├─ Record releasedAt timestamp
│   └─ Update farmer's account balance
└─ Repeat

RESULT: Orders automatically managed; Inventory stays accurate; Payments released on schedule
```

---

## 11. Key Features & Benefits

### 11.1 For Farmers
✅ Direct market access (eliminate middlemen)
✅ Real-time order management
✅ AI-powered price recommendations
✅ Transparent payment system
✅ Quality verification & reputation building
✅ Multi-delivery options
✅ Demand forecasting insights

### 11.2 For Buyers
✅ Fresh produce directly from farmers
✅ Transparent pricing & quality info
✅ Price history & trend analysis
✅ Personalized crop recommendations
✅ Flexible delivery options
✅ Secure payment system
✅ Detailed crop information & reviews

### 11.3 For Transporters
✅ Flexible job scheduling
✅ Earning opportunities
✅ GPS-integrated tracking
✅ Reputation-based system
✅ Transparent commission model

### 11.4 For Admin
✅ Real-time platform analytics
✅ User management & verification
✅ Dispute resolution tools
✅ Revenue tracking
✅ Community moderation

---

## 12. Technology Justification

| Component | Technology | Why? |
|-----------|-----------|------|
| **Frontend** | React.js | Reusable components, large ecosystem, community support |
| **Bundler** | Vite | Fast builds, modern ES modules, excellent DX |
| **Styling** | Tailwind CSS | Utility-first, responsive design, rapid prototyping |
| **Backend** | Node.js + Express | JavaScript across stack, npm ecosystem, scalability |
| **Database** | MongoDB | Flexible schema, horizontal scaling, cloud-native |
| **ML/AI** | Python + FastAPI | Rich ML libraries, FastAPI performance, easy integration |
| **Auth** | JWT + bcryptjs | Stateless, scalable, industry standard |
| **Payment** | Escrow model | User protection, fraud prevention |

---

## 13. Future Enhancements

### Phase 2 Features
- **Mobile App**: React Native / Flutter for iOS & Android
- **Advanced Payments**: Integration with Razorpay, PayPal, or Stripe
- **Real-time Tracking**: GPS integration for transporter tracking
- **Video Verification**: Supplier verification through video
- **Blockchain**: Immutable transaction records for trust
- **IoT Integration**: Temperature/humidity monitoring during transit
- **Subscription Model**: Premium seller accounts with marketing tools
- **Analytics Dashboard**: Detailed business intelligence for users

### Scaling Considerations
- **Microservices**: Break monolith into independent services
- **Caching**: Redis for frequently accessed data
- **Message Queue**: RabbitMQ/Kafka for async processing
- **CDN**: Distribute static assets globally
- **Load Balancing**: Nginx/HAProxy for traffic distribution
- **Database Sharding**: Horizontal scaling for MongoDB

---

## 14. Testing Strategy

### 14.1 Test Types Implemented

1. **Unit Tests**: Individual function & service testing
   - Files: `AI/Tests/test_*.py`, `backend/test.js`

2. **Integration Tests**: API endpoint testing
   - File: `AI/Tests/Test_Endpoints.py`, `backend/test.js`

3. **End-to-End Tests**: Full user journey testing
   - Recommended: Cypress, Playwright
   - Test: Registration → Listing → Order → Delivery → Review

### 14.2 Critical Test Cases

```
Authentication Tests:
✓ Register with valid/invalid credentials
✓ Login success/failure
✓ Token refresh functionality
✓ Role-based access control

Order Tests:
✓ Create order (inventory check)
✓ Accept/reject order (status update)
✓ Expire pending orders (background job)
✓ Payment release (escrow system)

Delivery Tests:
✓ OTP generation & verification
✓ Transporter assignment
✓ Delivery completion & tracking

ML Tests:
✓ Price prediction accuracy
✓ Demand forecast validation
✓ Quality assessment reliability
✓ Recommendation effectiveness
```

---

## 15. Troubleshooting & Known Issues

### Issue: MongoDB Connection Error
**Error**: `getaddrinfo ENOTFOUND ac-qg1pjsx-shard-00-01.pwzgzc5.mongodb.net`

**Causes**:
- Invalid connection string in `.env`
- Network connectivity issues
- MongoDB Atlas IP whitelist issue
- DNS resolution failure

**Solution**:
- Verify MONGODB_URI in `.env`
- Add current IP to MongoDB Atlas IP whitelist
- Check internet connectivity
- Restart server

### Issue: Payment Hold Timeout
**Error**: `Connection pool for ac-qg1pjsx-shard-00-01.pwzgzc5.mongodb.net:27017 timed out`

**Causes**:
- Background job timeout
- Database connection pool exhaustion
- Long-running operations

**Solution**:
- Increase connection pool size in Mongoose
- Optimize database queries
- Add connection pooling middleware
- Monitor slow logs

---

## 16. Conclusion

**KrishiMitra** is a comprehensive, production-ready agricultural marketplace platform that leverages modern web technologies, AI/ML insights, and robust logistics management to transform farmer-buyer interactions. With role-based access, automated background jobs, secure payments, and intelligent recommendations, it provides a complete ecosystem for agricultural commerce.

The platform is designed for scalability, security, and user experience, with clear pathways for future enhancements and market expansion.

---

## Appendix

### A. Quick Start Guide
```bash
# 1. Clone repository
git clone <repo-url>
cd KrishiMitra_V1

# 2. Backend setup
cd backend
npm install
npm start  # http://localhost:5000

# 3. Frontend setup (in new terminal)
cd ../frontend
npm install
npm run dev  # http://localhost:5173

# 4. AI/ML Service (in new terminal)
cd ../AI/API
pip install -r Requirements.txt
python -m uvicorn main:app --reload --port 8000

# App ready at http://localhost:5173
```

### B. API Health Check
```bash
curl http://localhost:5000/api/health
# Response: { "success": true, "message": "KrishiBazaar API running" }
```

### C. Environment Setup Checklist
- [ ] `.env` file created with all required variables
- [ ] MongoDB Atlas account & connection string obtained
- [ ] JWT secrets configured
- [ ] CORS origins whitelisted
- [ ] Node.js & Python installed & verified
- [ ] Dependencies installed & versions compatible
- [ ] Database collections initialized
- [ ] ML models trained & saved
- [ ] API routes tested
- [ ] Frontend build verified

---

**Document Created**: 2026-03-31  
**Version**: 1.0  
**Status**: Complete & Ready for Development
