# KrishiMitra V1 - Detailed Project Report

## 1. Executive Summary
KrishiMitra V1 is a multi-role agriculture commerce platform with three core pillars:
- Frontend web app for farmers, buyers, transporters, and admins.
- Backend API for authentication, listings, orders, delivery workflows, notifications, and governance.
- Python AI microservice for price prediction, demand forecasting, crop-quality analysis, and rule-based recommendations.

Your system already demonstrates strong full-stack decomposition and role-specific journey design. The most important opportunity now is to evolve from predictive ML features into task-oriented LLM features such as multilingual advisory, dispute summarization, intelligent marketplace search, and decision copilots for pricing and fulfillment.

This report documents your current architecture as implemented and provides a practical LLM expansion roadmap that can be built incrementally without disrupting production behavior.

---

## 2. Project Scope and Goals
### 2.1 Primary Product Goal
Enable transparent and efficient farm-to-buyer transactions with better logistics and decision intelligence.

### 2.2 Current Capability Goals
- Connect buyers and farmers through verified listings and structured order lifecycle.
- Manage delivery and handoff reliability (including OTP flow for transporter operations).
- Provide decision support through ML models (price, demand, quality, recommendation).
- Support admin-level oversight and dispute handling.

### 2.3 Next Capability Goal (Strategic)
Introduce LLM-powered intelligence to convert raw predictions and transactional data into actionable, conversational, and explainable guidance.

---

## 3. Codebase and Technology Landscape
The table below groups the main technologies and libraries used in the project, along with what each one does and why it was chosen.

| Area | Technology / Library | Purpose | Why this library |
| --- | --- | --- | --- |
| Frontend | React | Builds the user interface as a component-based SPA | It is the best fit for a role-based marketplace UI with reusable components |
| Frontend | Vite | Development server and build tool | It gives fast hot reloads and a lightweight production build |
| Frontend | react-router-dom | Page routing and protected navigation | It handles role-specific routes cleanly across farmer, buyer, transporter, and admin flows |
| Frontend | @reduxjs/toolkit, react-redux | Global state management | It reduces Redux boilerplate and keeps auth and app state predictable |
| Frontend | react-hook-form, @hookform/resolvers, yup | Form handling and validation | It is efficient for complex forms such as listings, login, and profile updates |
| Frontend | axios | API requests | It is simple to configure and works well with shared interceptors and tokens |
| Frontend | tailwindcss | Styling | It speeds up consistent UI development without writing large custom CSS files |
| Frontend | framer-motion | Animations | It provides smooth declarative motion for landing pages and interactive UI blocks |
| Frontend | lucide-react | Icons | It offers a clean, lightweight icon set that matches modern React interfaces |
| Frontend | recharts | Charts and dashboards | It is easy to use for analytics views and summary cards |
| Frontend | three, @react-three/fiber, @react-three/drei | 3D graphics and scene helpers | It supports advanced visual sections without leaving the React ecosystem |
| Frontend | i18next, react-i18next | Multi-language support | It is the standard approach for scalable translation workflows |
| Frontend | react-hot-toast | User notifications | It gives fast, unobtrusive feedback for success and error states |
| Frontend | react-intersection-observer | Scroll and visibility tracking | It is useful for animation triggers and lazy in-view UI behavior |
| Backend | Node.js | Server runtime | It fits the API-first architecture and works well with JavaScript across the stack |
| Backend | Express | REST API framework | It is simple, flexible, and well suited to domain-based route modules |
| Backend | mongoose | MongoDB object modeling | It gives schema structure to a NoSQL database and simplifies model logic |
| Backend | jsonwebtoken | Auth token handling | It is the standard way to issue and verify secure session tokens |
| Backend | bcryptjs | Password hashing | It is a proven library for secure password storage |
| Backend | multer | File upload handling | It is the standard tool for multipart form uploads in Express |
| Backend | cloudinary | Image storage and delivery | It removes local file storage complexity and supports optimized media delivery |
| Backend | cors | Cross-origin request support | It enables the frontend and backend to communicate safely across origins |
| Backend | cookie-parser | Cookie parsing | It simplifies reading and managing cookies in Express middleware |
| Backend | express-validator | Request validation | It keeps API payload checks close to the route layer |
| Backend | dotenv | Environment configuration | It keeps secrets and environment-specific values out of source code |
| Backend | nodemon | Development auto-reload | It improves local development speed when editing server code |
| AI Service | FastAPI | ML inference API | It is fast, modern, and well suited to typed Python service endpoints |
| AI Service | pydantic | Request and response schemas | It gives strong validation for prediction payloads and API contracts |
| AI Service | numpy | Numerical computation | It is the base numeric layer for model inputs and transformations |
| AI Service | pandas | Tabular data processing | It is ideal for dataset preparation and feature manipulation |
| AI Service | joblib | Model serialization | It is a common choice for saving and loading scikit-learn artifacts |
| AI Service | httpx | HTTP client | It supports clean service-to-service calls where the AI layer needs to talk to other endpoints |
| AI Service | Pillow | Image preprocessing | It is used to load and transform crop images before quality inference |
| AI Service | scikit-learn | Training and preprocessing | It fits the tabular prediction pipelines used for price and demand models |
| AI Service | requests | External API testing | It is used in local testing scripts for validating service responses |

This stack is intentionally split by layer: React and Vite handle the user experience, Express and MongoDB handle transactional application logic, and FastAPI plus the Python ML stack handle prediction and inference.

---

## 4. Implemented Architecture (As Observed)

## 4.1 Frontend Architecture
### Route Partitioning
Your frontend is cleanly segmented by role:
- Public: landing, login, register
- Farmer module: dashboard, listing CRUD, order handling, profile
- Buyer module: marketplace, cart, checkout, order detail/history, profile
- Transporter module: jobs, active job flow, history, profile
- Admin module: dashboard, users, disputes

This modular route organization improves maintainability and simplifies route-level access control.

### State and API Layer
- Central API instance injects bearer token and handles 401 resets.
- Endpoint-level modules encapsulate feature APIs (`ordersApi`, `aiApi`, etc.).
- Role-aware order fetching logic exists, with dedicated buyer retrieval helpers.

### Frontend Strengths
- Clear role-driven UX boundaries.
- Good baseline for secure auth propagation.
- Scalable endpoint abstraction for adding future AI/LLM actions.

### Frontend Gaps to Address
- LLM UI surfaces are not yet present (assistant panel, explainability cards, chat-driven filtering).
- AI features currently appear as discrete endpoint calls, not integrated as guided workflows.

---

## 4.2 Backend Architecture
### API Composition
The Express app mounts domain routes under `/api/*` and includes:
- CORS strategy with local dev flexibility
- JSON/urlencoded parsing and cookie support
- Centralized error middleware
- Health endpoint

### Domain and Workflow Design
The order model is robust and tracks:
- Buyer/farmer/listing relations
- Delivery mode and transport lifecycle states
- Payment lifecycle (`pending`, `held`, `released`, `refunded`)
- Dispute and review sub-documents

### Operational Automation
Background jobs in server startup logic:
- Payment auto-release job (hourly)
- Pending order expiry + inventory restoration job (5-minute cadence)

These jobs reduce manual reconciliation and protect transactional integrity.

### Backend Strengths
- Practical and realistic order state machine.
- Strong role-based route controls.
- Good real-world operational automation patterns.

### Backend Gaps to Address
- Current backend AI controller calculates trends from DB averages; it does not yet proxy to your Python FastAPI ML service.
- LLM orchestration layer does not yet exist (prompt management, tool-calling safety, output validation).

---

## 4.3 AI Microservice Architecture
Your FastAPI service is organized by phased intelligence modules:
- Phase 1: Price prediction
- Phase 2: Demand forecasting
- Phase 3: Image quality analysis
- Phase 4: Rule-based crop recommendation
- Phase 5: Price range estimation

### Model Serving Pattern
- Lazy singleton-style model loader loads artifacts on first use.
- Availability checks and meaningful 503 errors when models are missing.
- Typed request/response schemas with validation.

### Training System
Separate scripts for:
- `Train_price.py` (RandomForest + feature pipeline)
- `Train_demand.py` (XGBoost/fallback + demand label modeling)
- `Train_Quality.py` (MobileNetV2 transfer learning with multi-head output)

### Recorded Metrics (Current Artifacts)
- Price model: high goodness of fit (R2 around 0.93)
- Demand model: strong classification utility for demand bands
- Quality model metrics file currently reports zero accuracies and needs verification/retraining pipeline audit

### AI Strengths
- Good separation between training and inference.
- Phase-based route design supports incremental expansion.
- Typed contracts ready for production gateway integration.

### AI Gaps to Address
- Backend to FastAPI integration is not fully wired for production usage.
- Quality model metric publication appears inconsistent and should be corrected before relying on model quality scores in user-facing decisions.

---

## 5. System-Level Assessment

## 5.1 What Is Working Well
- End-to-end marketplace workflow is already substantial.
- Order lifecycle and logistics modeling are practical.
- ML service has clear module boundaries and deterministic endpoints.
- Frontend route architecture is scalable by role.

## 5.2 Key Risks
- AI integration mismatch: Node-side AI endpoints are currently heuristic, not model-backed from FastAPI.
- Potential environment/packaging issues in AI dependency file encoding and naming consistency.
- Quality model trust risk due to metric artifact inconsistency.
- No LLM governance layer yet (prompt injection handling, hallucination controls, policy filters).

---

## 6. Detailed LLM Expansion Strategy

## 6.1 Why Add LLMs Here
Your system has rich structured data and clear user intents. LLMs can convert that into high-value user guidance, not just predictions.

High-impact opportunities:
- Farmers: listing optimization and pricing explanation in local language.
- Buyers: smart crop discovery by natural language intent.
- Transporters: route and exception assistant for delivery disruptions.
- Admins: dispute summarization and risk triage.

## 6.2 Recommended LLM Feature Modules
### Module A: Multilingual Agri Assistant
- Conversational helper for buyers/farmers.
- Integrates crop search, order status query, and simple agronomy FAQ.
- Supports Hindi/Marathi/English with translation-aware prompts.

### Module B: Explainable AI Narratives
- Convert numeric outputs from price/demand models into clear rationale:
  - "Price is high because seasonal supply is low and local demand trend is rising."
- Show confidence and uncertainty in plain language.

### Module C: Smart Marketplace Search
- Query format: "Show fresh tomatoes under Rs 30/kg in Pune district with quick delivery."
- LLM parses intent to structured filters passed to existing listing APIs.

### Module D: Dispute Copilot for Admin
- Summarize long disputes, evidence notes, and event timelines.
- Suggest resolution templates while preserving human final approval.

### Module E: Listing Quality Advisor
- Suggest title/description improvements and best listing time window.
- Can combine price/demand inference + LLM generation.

---

## 6.3 Target LLM Architecture (Practical)
Implement a backend LLM orchestration service instead of direct frontend-to-model calls.

Core components:
- Prompt templates with strict instruction hierarchy.
- Tool/function calling for safe access to:
  - listings search
  - order lookup
  - AI prediction endpoints
  - delivery estimates
- Output schema validation (JSON schema / zod-like pattern).
- Guardrails:
  - role-aware data access
  - prompt-injection filters
  - PII redaction in logs
  - max-token and timeout controls

Suggested flow:
1. Frontend sends user intent to `/api/llm/assist`.
2. Backend resolves role and context.
3. LLM selects tools (function calling) instead of free-form guessing.
4. Backend composes grounded response from tool outputs.
5. Frontend renders answer + optional action CTA.

---

## 6.4 Model Selection Guidance
Use a hybrid strategy:
- Hosted model for initial speed (high-quality instruction following).
- Optional local open-source model for cost/privacy-sensitive tasks.

Decision criteria:
- Accuracy on agricultural-domain prompts
- Multilingual quality
- Cost per 1K tokens
- Latency under expected user load
- Compliance/data residency needs

---

## 6.5 LLM Data and Knowledge Strategy (RAG)
Add a retrieval layer for grounded answers.

Knowledge sources:
- Internal: listing schema docs, order policies, dispute policy, delivery rules.
- External curated docs: mandi trends, seasonal crop guidance, government advisories.

RAG pipeline:
1. Ingest docs and chunk them.
2. Embed and store in vector DB.
3. Retrieve top relevant chunks for each query.
4. Inject retrieved facts into prompt context.
5. Require answer citation metadata for auditability.

---

## 7. 90-Day Implementation Roadmap

## Phase 1 (Weeks 1-3): Foundation
- Create backend LLM module (`/api/llm/*`) with role checks.
- Implement prompt templates and structured output parser.
- Add basic assistant UI for buyer/farmer dashboards.
- Integrate AI model outputs into explanation cards.

## Phase 2 (Weeks 4-7): Tool Calling + RAG
- Add secure function-calling layer for listings/orders/delivery.
- Build minimal vector store for policy + FAQ documents.
- Launch multilingual assistant responses.
- Add response quality telemetry (latency, fallback rate, user feedback).

## Phase 3 (Weeks 8-12): Advanced Ops
- Add admin dispute summarization copilot.
- Add listing optimization copilot for farmers.
- Implement safety controls (prompt injection tests, data leakage checks).
- Run A/B evaluation: LLM-assisted vs non-assisted conversion and resolution times.

---

## 8. Engineering Changes Required

## 8.1 Backend Additions
- New route module: `/api/llm`.
- New service layer for provider abstraction (`openai`, `azure`, `local`).
- Tool adapters mapping to existing services/controllers.
- Conversation logging with privacy filters.

## 8.2 Frontend Additions
- Reusable chat/assistant drawer component.
- Actionable response cards (search filters, recommended listing updates, order next-step buttons).
- User feedback controls (thumbs up/down + reason tags).

## 8.3 AI Service Additions
- Internal endpoint wrappers for explainability payloads.
- Quality metric retraining and artifact validation pipeline.
- Optional confidence calibration endpoint.

---

## 9. Governance, Safety, and Reliability

## 9.1 Safety Controls
- Prompt injection detection and denylist/allowlist patterns.
- Output moderation for unsafe/aggressive recommendations.
- Hard separation of user-private data by role and ownership.

## 9.2 Reliability Controls
- Fallback responses when LLM/tool call fails.
- Retry with exponential backoff for transient provider errors.
- Circuit-breaker threshold for repeated failures.

## 9.3 Evaluation Framework
Track:
- Helpfulness score from users
- Resolution time for disputes
- Buyer conversion after AI recommendations
- Farmer listing success rate improvements
- Hallucination/error rate from audit samples

---

## 10. Immediate Action Plan (High Priority)
1. Connect backend AI routes to FastAPI service instead of only listing averages.
2. Audit and fix quality model metrics pipeline before exposing confidence to users.
3. Standardize AI dependency and model paths/casing to avoid deployment drift.
4. Implement first LLM endpoint for one constrained use-case (buyer crop search assistant).
5. Add telemetry and safety checks from day one.

---

## 11. Final Conclusion
KrishiMitra V1 is already a solid full-stack foundation with real operational depth in marketplace and order logistics. Your AI module design is good and production-friendly in structure. The next major leap is orchestration: unify backend business tools, predictive AI, and LLM reasoning into guided workflows.

If executed in phases, LLM features can materially improve user trust, transaction efficiency, and platform differentiation while preserving safety and control.
