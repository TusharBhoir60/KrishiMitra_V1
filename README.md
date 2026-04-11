# Krishimitra 🌾  
**AI-Enabled Agricultural Marketplace Platform**

Krishimitra is a full-stack, role-based agriculture marketplace that connects **Farmers, Buyers, Transporters, and Admins** in one unified platform.  
It combines core marketplace workflows with AI-powered decision support for better pricing, planning, and operational transparency.

---

## 🚀 Key Features

### 1) Multi-Role Platform
- **Farmer**: Create/manage crop listings, receive/manage orders
- **Buyer**: Browse marketplace, add to cart, checkout, track orders
- **Transporter**: Accept jobs, update trip status, OTP-based pickup/delivery verification
- **Admin**: Manage users, monitor platform data, review disputes

### 2) Marketplace Workflow
- Product listing and editing
- Cart and checkout flow
- Order placement and order detail tracking
- Protected route architecture by role

### 3) Logistics & Delivery Flow
- Transport job acceptance
- Status transitions:  
  `pending → scheduled → at_farm → in_transit → at_buyer → delivered/completed`
- OTP verification at pickup and delivery for trust and accountability

### 4) Dispute Workflow
- Buyer/user can raise dispute (`/orders/:id/dispute`)
- Admin-side dispute management support

### 5) AI Integration (Decision Support)
- Price prediction
- Demand forecasting
- Crop recommendation
- Price range prediction
- Optional quality analysis support (as model availability permits)

---

## 🏗️ Project Architecture

Krishimitra follows a modular architecture:

- **Frontend**: React app for all role-based dashboards and user flows
- **Backend**: Node.js/Express API for auth, business logic, and AI proxy integration
- **AI Service**: FastAPI-based ML inference service with trained model endpoints
- **Database**: Stores users, listings, orders, delivery jobs, disputes, etc.

### Design Principle
Frontend does **not** directly call AI endpoints.  
Backend exposes stable `/api/ml/*` proxy routes and handles validation, timeout, fallback, and normalization.

---

## 🧠 AI Modules

### Crop Recommendation (Classification)
Inputs:
- `soil_type`
- `season`
- `region`

Output:
- Top recommended crops with confidence

### Price Range Prediction (Regression)
Inputs:
- `crop_type`
- `month`
- `historical_avg_price`
- `last_week_price`
- `demand_index`

Output:
- Predicted price
- Low/high range
- Confidence label

### Why Random Forest / XGBoost?
- Strong for tabular mixed agricultural data
- Handles nonlinear seasonal/market relationships
- Robust to noisy real-world inputs
- Practical deployment with good explainability

---

## 📁 Suggested Repository Structure

```text
project-root/
│
├── frontend/                 # React application
│
├── backend/                  # Node/Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   └── .env
│
└── AI/                       # FastAPI + ML training/inference
    ├── api/
    ├── training/
    ├── models/saved/
    └── requirements.txt
```

---

## ⚙️ Backend–AI API Contract

Backend proxy endpoints:

- `POST /api/ml/price` → AI `/api/price/predict`
- `POST /api/ml/demand` → AI `/api/demand/forecast`
- `POST /api/ml/recommend-crop` → AI `/api/recommendation/predict`
- `POST /api/ml/predict-price-range` → AI `/api/price-range/predict`
- Optional: quality proxy endpoint

### Error Handling Policy
- Normalize and return AI errors (`422`, `503`, `500`)
- Timeout + optional retry
- Graceful fallback for non-critical AI operations

---

## 🛠️ Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Lucide Icons
- react-hot-toast

### Backend
- Node.js
- Express.js
- Prisma (if configured)
- Axios (AI service communication)
- JWT/Auth middleware (project-specific)

### AI Service
- Python
- FastAPI
- scikit-learn
- joblib
- pandas / numpy

---

## 🔐 Authentication & Authorization

- Protected routes for logged-in users
- Role-based route access:
  - Farmer-only
  - Buyer-only
  - Transporter-only
  - Admin-only

---

## 🧪 Local Development Setup

## 1) Clone repository
```bash
git clone <your-repo-url>
cd <repo-folder>
```

## 2) Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## 3) Run Backend
```bash
cd backend
npm install
npm run dev
```

Create `.env` in backend:
```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
# add DB/auth secrets as per your setup
```

## 4) Run AI Service
```bash
cd AI
python -m venv venv
# activate venv (Windows)
venv\Scripts\activate
# or (Linux/Mac)
source venv/bin/activate

pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## 5) Train models (if needed)
```bash
python training/train_crop_recommendation.py
python training/train_price_range.py
```

---

## ✅ Current Project Status

- Core multi-role marketplace implemented
- Transporter active-job flow stabilized
- Dispute route integrated in protected routing
- AI model training completed
- Backend ML proxy integration in progress/partially complete (depends on current branch)

---

## ⚠️ Known Challenges

- Schema normalization across modules (e.g., `quality.grade` vs `grade`)
- Nested route scoping complexity
- AI service availability handling in real-world conditions

---

## 🔮 Future Enhancements

- Real-time mandi and weather data ingestion
- Model drift detection and monitoring dashboard
- SHAP/LIME explainability views
- Personalization based on historical transaction behavior
- Regional language + voice-assisted interactions
- CI/CD model version rollout and rollback support

---

## 👥 Contributors

- Project Team: Krishimitra Development Group  
(Add member names/roles here)

---

## 📄 License

This project is for academic/research and demonstration purposes unless otherwise specified.  
(Add your final license: MIT/Apache-2.0/Proprietary)

---

## 🙌 Acknowledgements

- Faculty mentors and project reviewers
- Open-source communities around React, Node.js, FastAPI, and scikit-learn
