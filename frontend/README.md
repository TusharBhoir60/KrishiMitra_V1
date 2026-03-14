# KrishiBazaar Frontend

A modern, responsive React + Vite frontend application for the KrishiBazaar agricultural marketplace platform. This interface connects farmers, buyers, and transporters in a seamless user experience.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling & Design](#styling--design)
- [Performance](#performance)
- [Browser Support](#browser-support)
- [Contributing](#contributing)

## 🎯 Overview

KrishiBazaar Frontend is a feature-rich React application built with Vite for optimal performance. It provides role-based interfaces for farmers, buyers, transporters, and administrators to interact with the agricultural marketplace ecosystem.

## 🛠 Tech Stack

- **Framework:** React 18.x
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Context API:** For language switching and cart management
- **Package Manager:** npm

## ✨ Features

### User Roles & Interfaces
- **Farmer Dashboard**
  - Create and manage crop listings
  - View incoming orders
  - Track sales and revenue
  - Manage inventory
  - Accept/reject orders

- **Buyer Interface**
  - Browse crop listings
  - Search and filter crops
  - Add items to cart
  - Place orders
  - Track order status
  - Order history
  - Manage wishlist

- **Transporter Portal**
  - View assigned deliveries
  - Update delivery status
  - Track performance metrics
  - Manage delivery rates
  - View earnings

- **Admin Dashboard**
  - User management
  - Platform analytics
  - Order monitoring
  - Dispute resolution
  - System configuration

### Core Features
- **Authentication**
  - Secure login/registration
  - Role-based access control
  - JWT token management
  - Session persistence

- **Crop Marketplace**
  - Advanced search and filtering
  - Crop details with images
  - Price comparisons
  - Availability tracking
  - Ratings and reviews

- **Shopping Cart**
  - Add/remove items
  - Quantity management
  - Real-time price calculation
  - Persistent cart storage

- **Order Management**
  - Order creation and confirmation
  - Real-time status tracking
  - Order history
  - Delivery estimates

- **Notifications**
  - Real-time order updates
  - Delivery notifications
  - System alerts
  - Push notifications (if configured)

- **Internationalization**
  - Multi-language support
  - Language switching
  - Localized content

- **Responsive Design**
  - Mobile-first approach
  - Tablet optimization
  - Desktop experience
  - Progressive Web App ready

## 📦 Prerequisites

- **Node.js:** v16.0.0 or higher
- **npm:** v7.0.0 or higher
- **Modern Browser:** Chrome, Firefox, Safari, or Edge (latest versions)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd KrishiBazaar/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment Configuration
Create a `.env.local` file in the frontend root directory (see [Environment Variables](#environment-variables))

### 4. Start Development Server
```bash
npm run dev
```

## ⚙️ Configuration

### Vite Configuration
The Vite configuration is defined in `vite.config.js`:
- HMR (Hot Module Replacement) enabled for development
- Optimized build output
- CSS preprocessing with PostCSS

### Tailwind CSS
Tailwind configuration is in `tailwind.config.js`:
- Customized color palette
- Extended spacing and sizing
- Custom fonts and typography

### ESLint
Code quality is maintained with ESLint configuration in `eslint.config.js`:
- React-specific rules
- Best practices enforcement
- Code style consistency

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Application runs on `http://localhost:5173`

Features:
- Hot Module Replacement (HMR)
- Fast refresh on file changes
- Development tools enabled
- Source maps for debugging

### Build for Production
```bash
npm run build
```
Generates optimized build in `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

### Lint Code
```bash
npm run lint
```
Checks code quality and style consistency

## 📁 Project Structure

```
frontend/
├── public/                        # Static assets
├── src/
│   ├── api/
│   │   ├── axiosConfig.js         # Axios instance configuration
│   │   └── endpoints/
│   │       ├── adminApi.js        # Admin API calls
│   │       ├── aiApi.js           # AI service integration
│   │       ├── authApi.js         # Authentication API
│   │       ├── cropsApi.js        # Crop listings API
│   │       ├── deliveryApi.js     # Delivery API
│   │       ├── notificationsApi.js # Notifications API
│   │       └── ordersApi.js       # Orders API
│   ├── assets/                    # Images, fonts, media
│   ├── components/
│   │   ├── buyer/
│   │   │   └── CropCard.jsx       # Crop display card
│   │   ├── common/
│   │   │   ├── EmptyState.jsx     # Empty state display
│   │   │   ├── LoadingSpinner.jsx # Loading indicator
│   │   │   ├── ProtectedRoute.jsx # Auth protection
│   │   │   ├── RoleRoute.jsx      # Role-based routing
│   │   │   └── SkeletonCard.jsx   # Loading skeleton
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx      # Main app wrapper
│   │   │   ├── AppNavbar.jsx      # App navigation bar
│   │   │   ├── BottomNav.jsx      # Mobile bottom navigation
│   │   │   ├── BuyerLayout.jsx    # Buyer-specific layout
│   │   │   ├── FarmerLayout.jsx   # Farmer-specific layout
│   │   │   ├── Footer.jsx         # Page footer
│   │   │   └── Navbar.jsx         # Public navigation
│   │   ├── sections/
│   │   │   ├── CTASection.jsx     # Call-to-action section
│   │   │   ├── FeaturesSection.jsx # Features showcase
│   │   │   ├── HeroSection.jsx    # Landing page hero
│   │   │   ├── HowItWorksSection.jsx # Tutorial section
│   │   │   ├── MarketplacePreview.jsx # Marketplace demo
│   │   │   ├── ScrollFarmScene.jsx # Animated farm scene
│   │   │   └── StatsRow.jsx       # Statistics display
│   │   └── ui/
│   │       └── ...                # Reusable UI components
│   ├── context/
│   │   ├── BuyerCartContext.jsx   # Shopping cart state
│   │   └── LanguageContext.jsx    # Language preference state
│   ├── data/
│   │   └── translations.js        # Multilingual content
│   ├── hooks/
│   │   ├── useAuth.js             # Authentication hook
│   │   ├── useDeliveryEstimate.js # Delivery calculation hook
│   │   └── useNotifications.js    # Notifications hook
│   ├── pages/
│   │   ├── LandingPage.jsx        # Public landing page
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── OTPVerification.jsx
│   │   │   └── ...
│   │   ├── buyer/
│   │   │   ├── BuyerDashboard.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── CropDetails.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   └── ...
│   │   ├── farmer/
│   │   │   ├── FarmerDashboard.jsx
│   │   │   ├── CreateListing.jsx
│   │   │   ├── MyListings.jsx
│   │   │   ├── OrderRequests.jsx
│   │   │   └── ...
│   │   └── transporter/
│   │       ├── TransporterDashboard.jsx
│   │       ├── DeliveryList.jsx
│   │       ├── DeliveryTracking.jsx
│   │       └── ...
│   ├── store/
│   │   ├── index.js               # Redux store setup
│   │   └── slices/
│   │       ├── authSlice.js       # Auth state
│   │       ├── cartSlice.js       # Cart state
│   │       ├── orderSlice.js      # Order state
│   │       └── ...                # Other slices
│   ├── utils/
│   │   ├── districtList.js        # District data
│   │   ├── formatCurrency.js      # Currency formatting
│   │   ├── formatDate.js          # Date formatting
│   │   └── orderStatusHelpers.js  # Order status utilities
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # Global app styles
│   ├── index.css                  # Global styles
│   └── main.jsx                   # React entry point
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS configuration
├── eslint.config.js               # ESLint configuration
├── package.json                   # Dependencies and scripts
├── README.md                      # This file
└── .env.local                     # Environment variables (not tracked)
```

## 🔐 Environment Variables

Create a `.env.local` file in the frontend root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1/
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_STORAGE_KEY=krishiBazaar_token
VITE_USER_STORAGE_KEY=krishiBazaar_user

# Features
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=false

# External Services
VITE_CLOUDINARY_URL=https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_RAZORPAY_KEY=your_razorpay_key

# Google Maps (if using)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Environment
VITE_APP_NAME=KrishiBazaar
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

## 🎨 Component Architecture

### Layout Structure
```
App
├── Public Routes
│   ├── Landing Page
│   ├── Login/Register
│   └── About/Contact
└── Protected Routes
    ├── Buyer Layout
    │   ├── Buyer Dashboard
    │   ├── Marketplace
    │   ├── Cart
    │   └── Orders
    ├── Farmer Layout
    │   ├── Farmer Dashboard
    │   ├── Listings
    │   └── Orders
    ├── Transporter Layout
    │   ├── Transporter Dashboard
    │   └── Deliveries
    └── Admin Layout
        ├── Admin Dashboard
        ├── Users
        └── Analytics
```

### Component Hierarchy
- **Layout Components:** Provide structure and navigation
- **Page Components:** Full-page views for different routes
- **Section Components:** Reusable page sections
- **UI Components:** Atomic, reusable UI elements
- **Common Components:** Protection, loading, empty states

## 🔄 State Management

### Redux Store
Manages global application state:
- User authentication state
- Cart contents
- Orders and order history
- Filters and preferences

### Context API
Manages lightweight state:
- Language/localization settings
- Theme preferences
- User preferences

### Local Storage
Persists:
- JWT tokens
- User preferences
- Cart data
- Language selection

## 📡 API Integration

### Axios Configuration
```javascript
// src/api/axiosConfig.js
- Base URL setup
- Automatic token injection
- Request/response interceptors
- Error handling
```

### API Endpoints
Organized by feature:
- **Auth:** Login, register, verify OTP
- **Crops:** Search, filter, get details
- **Orders:** Create, get status, history
- **Delivery:** Estimate, track, rates
- **Notifications:** Get, mark read
- **Admin:** User management, analytics

### Error Handling
- Automatic error response formatting
- User-friendly error messages
- Retry mechanisms for failed requests
- Request timeout handling

## 🎨 Styling & Design

### Tailwind CSS
- Utility-first CSS framework
- Custom color scheme
- Responsive breakpoints
- Dark mode support (if configured)

### Design System
- Consistent spacing and sizing
- Typography hierarchy
- Color palette
- Component variants

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Flexible layouts
- Touch-friendly interfaces

## ⚡ Performance

### Optimization Strategies
- Code splitting with React.lazy
- Image optimization
- CSS minification
- JavaScript bundling
- Lazy loading components
- Memoization with React.memo
- Virtual scrolling for lists

### Build Output
- Optimized bundle size
- Chunked assets
- Cache busting
- Minified CSS and JS

### Development
- Fast HMR with Vite
- Instant server start
- Native ES modules

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile browsers:
- iOS Safari 12+
- Android Chrome
- Samsung Internet

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Install dependencies: `npm install`
3. Make changes and test: `npm run dev`
4. Lint code: `npm run lint`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/your-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Support

For support, email support@krishibazaar.com or create an issue in the repository.

## 🔗 Related Documentation

- [Backend README](../backend/README.md)
- [API Documentation](../backend/README.md#-api-endpoints)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Last Updated:** March 2024
**Version:** 1.0.0
**Status:** Active Development
>>>>>>> 3d846af77303fcd9b71103a738594b8a2c1a974d
