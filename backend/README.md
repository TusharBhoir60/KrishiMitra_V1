# KrishiBazaar Backend

A robust Node.js/Express.js backend API server for the KrishiBazaar agricultural marketplace platform. This server handles user authentication, crop listings management, order processing, delivery zone management, transporter coordination, and real-time notifications.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## 🎯 Overview

KrishiBazaar Backend is a comprehensive REST API built with Express.js that facilitates the agricultural marketplace ecosystem. It connects farmers, buyers, and transporters, managing the complete lifecycle of agricultural transactions from listing creation to delivery completion.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Cloudinary (for image uploads)
- **File Handling:** Multer
- **Notifications:** Real-time notification service
- **OTP Service:** Email-based OTP generation and verification

## ✨ Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Farmer, Buyer, Transporter, Admin)
  - OTP verification for phone numbers
  - Secure password management

- **Crop Listings Management**
  - Create, read, update, delete crop listings
  - Image uploads with Cloudinary integration
  - Search and filter functionality
  - Inventory management

- **Order Processing**
  - Create and manage orders
  - Order status tracking
  - Order history and details
  - Order cancellation and refunds

- **Delivery Management**
  - District-based distance calculation
  - Delivery zone configuration
  - Real-time delivery tracking
  - Delivery cost estimation

- **Transporter Coordination**
  - Transporter registration and management
  - Transporter ratings and reviews
  - Delivery assignment
  - Transporter performance metrics

- **Notification System**
  - Real-time order notifications
  - Delivery status updates
  - User activity notifications
  - Email and SMS alerts

## 📦 Prerequisites

- **Node.js:** v14.0.0 or higher
- **npm:** v6.0.0 or higher
- **MongoDB:** Local or cloud instance (MongoDB Atlas recommended)
- **Cloudinary Account:** For image storage
- **Email Service:** SMTP configuration for OTP delivery

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd KrishiBazaar/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment Configuration
Create a `.env` file in the backend root directory (see [Environment Variables](#environment-variables))

### 4. Seed Initial Data (Optional)
```bash
npm run seed
```

This will populate initial data for delivery zones and transporters.

## ⚙️ Configuration

### Database Configuration
Database configuration is handled in `src/config/db.js`. The connection string is defined via the `MONGODB_URI` environment variable.

```javascript
// src/config/db.js
const connectDB = async () => {
  // Connection logic
};
```

### Cloudinary Setup
Configure Cloudinary credentials in your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
# or, for older setups:
# CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### District Distances
Distance calculations between districts are configured in:
```
config/districtDistances.js
```

Update this file to reflect accurate distances between districts in your region.

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3000` (or port specified in `.env`)

### Production Mode
```bash
npm start
```

### With Seed Data
```bash
npm run seed
npm start
```

The server will start on the configured port and establish a connection to MongoDB.

## 📡 API Endpoints

### Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| POST | `/send-otp` | Send OTP to phone |
| POST | `/verify-otp` | Verify phone OTP |
| POST | `/refresh-token` | Refresh JWT token |
| GET | `/profile` | Get user profile |
| PUT | `/profile/update` | Update user profile |

### Crop Listings Routes (`/api/v1/listings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all listings |
| GET | `/:id` | Get listing details |
| POST | `/` | Create new listing |
| PUT | `/:id` | Update listing |
| DELETE | `/:id` | Delete listing |
| GET | `/farmer/:farmerId` | Get farmer's listings |
| POST | `/:id/upload-image` | Upload listing image |

### Order Routes (`/api/v1/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all orders |
| GET | `/:id` | Get order details |
| POST | `/` | Create new order |
| PUT | `/:id` | Update order |
| DELETE | `/:id` | Cancel order |
| GET | `/status/:orderId` | Get order status |
| GET | `/buyer/:buyerId` | Get buyer's orders |
| GET | `/farmer/:farmerId` | Get farmer's orders |

### Delivery Routes (`/api/v1/delivery`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/zones` | Get all delivery zones |
| GET | `/estimate` | Calculate delivery cost/time |
| POST | `/assign` | Assign delivery to transporter |
| GET | `/status/:deliveryId` | Get delivery status |
| PUT | `/status/:deliveryId` | Update delivery status |

### Transporter Routes (`/api/v1/transporters`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all transporters |
| GET | `/:id` | Get transporter details |
| POST | `/` | Register transporter |
| PUT | `/:id` | Update transporter info |
| GET | `/:id/deliveries` | Get transporter's deliveries |
| POST | `/:id/rate` | Rate transporter |

### Notification Routes (`/api/v1/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all notifications |
| GET | `/unread` | Get unread notifications |
| PUT | `/:id/read` | Mark notification as read |
| DELETE | `/:id` | Delete notification |
| POST | `/send` | Send notification (Admin) |

## 📁 Project Structure

```
backend/
├── config/
│   └── districtDistances.js       # Inter-district distance data
├── seed/
│   ├── deliveryZones.js           # Initial delivery zones data
│   └── transporters.js            # Initial transporter data
├── src/
│   ├── app.js                     # Express app configuration
│   ├── config/
│   │   └── db.js                  # Database connection
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── deliveryController.js  # Delivery management
│   │   ├── Listingcontroller.js   # Crop listings
│   │   ├── notificationController.js # Notifications
│   │   ├── ordercontroller.js     # Order processing
│   │   └── transporterController.js # Transporter management
│   ├── middlewares/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── roleCheck.js           # Role-based authorization
│   ├── models/
│   │   ├── croplisting.js         # Crop listing schema
│   │   ├── DeliveryZone.js        # Delivery zone schema
│   │   ├── Notification.js        # Notification schema
│   │   ├── order.js               # Order schema
│   │   ├── Transporter.js         # Transporter schema
│   │   └── user.model.js          # User schema
│   ├── routes/
│   │   ├── authRoute.js           # Auth endpoints
│   │   ├── deliveryRoutes.js      # Delivery endpoints
│   │   ├── listing.routes.js      # Listing endpoints
│   │   ├── notificationRoutes.js  # Notification endpoints
│   │   ├── order.routes.js        # Order endpoints
│   │   └── transporterRoutes.js   # Transporter endpoints
│   ├── services/
│   │   ├── deliveryService.js     # Delivery business logic
│   │   ├── notificationService.js # Notification logic
│   │   └── otpService.js          # OTP generation/verification
│   └── utils/
│       ├── ApiError.js            # Custom error class
│       ├── ApiResponse.js         # Standardized response format
│       ├── asyncHandler.js        # Async error wrapper
│       ├── cloudinary.js          # Cloudinary configuration
│       └── multer.js              # File upload configuration
├── server.js                      # Server entry point
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## 🔐 Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/krishibazaar

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
# CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=noreply@krishibazaar.com

# OTP Configuration
OTP_EXPIRY=10
OTP_LENGTH=6

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Payment Gateway (if applicable)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  role: String (farmer, buyer, transporter, admin),
  profileImage: String (Cloudinary URL),
  address: {
    street: String,
    city: String,
    state: String,
    district: String,
    pincode: String
  },
  isPhoneVerified: Boolean,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Crop Listing Model
```javascript
{
  farmerId: ObjectId (ref: User),
  cropName: String,
  category: String,
  variety: String,
  quantity: Number,
  unit: String (kg, quintal, etc.),
  pricePerUnit: Number,
  description: String,
  images: [String] (Cloudinary URLs),
  district: String,
  availability: Date,
  certifications: [String],
  status: String (active, inactive, sold),
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  buyerId: ObjectId (ref: User),
  listingId: ObjectId (ref: CropListing),
  farmerId: ObjectId (ref: User),
  quantity: Number,
  totalPrice: Number,
  deliveryAddress: String,
  deliveryZone: String,
  status: String (pending, confirmed, shipped, delivered, cancelled),
  paymentStatus: String (pending, completed, failed),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Registration/Login:** User credentials are verified, and JWT tokens are issued
2. **Token Validation:** Every protected route verifies the JWT in the Authorization header
3. **Role-Based Access:** Middleware checks user role to authorize specific endpoints
4. **Phone OTP:** Additional security layer for phone number verification

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

## ⚠️ Error Handling

The API uses standardized error responses:

```javascript
{
  success: false,
  statusCode: 400,
  message: "Error description",
  errors: [...],
  data: null
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Support

For support, email support@krishibazaar.com or create an issue in the repository.

---

**Last Updated:** March 2024
**Version:** 1.0.0
