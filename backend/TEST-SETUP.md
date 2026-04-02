# API Test Suite Documentation

## Overview
The `test.js` file is a comprehensive test suite that checks all the APIs in the KrishiBazaar backend system. It tests authentication, listings, orders, notifications, reviews, transporters, delivery, admin, and AI routes.

## Prerequisites
Make sure you have Node.js installed on your system.

## Setup Instructions

### 1. Install Dependencies
First, install the required packages including the testing dependencies:

```bash
npm install
```

This will install all dependencies including:
- `axios` - For making HTTP requests
- `chalk` - For colored console output

### 2. Start the Backend Server
In one terminal window, start your backend server:

```bash
npm run dev
```

Or

```bash
npm start
```

Make sure the server is running on `http://localhost:8000` (or update the `BASE_URL` in test.js if using a different port).

### 3. Run the Tests
In another terminal window, run the test suite:

```bash
npm test
```

Or directly:

```bash
node test.js
```

## Test Coverage

The test suite includes the following test categories:

### 1. **Health Check**
   - Tests if the server is running and responding

### 2. **Authentication Tests**
   - Register User
   - Login User
   - Get Current User
   - Update Profile
   - Refresh Access Token

### 3. **Listing Tests**
   - Get All Listings
   - Create Listing
   - Get My Listings
   - Get Single Listing
   - Update Listing

### 4. **Order Tests**
   - Get Incoming Orders (Farmer)
   - Get My Orders (Buyer)

### 5. **Notification Tests**
   - Get Notifications
   - Get Unread Count
   - Mark All as Read
   - Mark Single as Read

### 6. **Review Tests**
   - Get Reviews by Farmer

### 7. **Transporter Tests**
   - Get All Transporters

### 8. **Delivery Tests**
   - Get Delivery Information

### 9. **Admin Tests**
   - Get Admin Dashboard Stats

### 10. **AI Routes Tests**
   - Get AI Recommendations

## Understanding Test Output

The test suite will display:
- ✓ (Green checkmark) for **passed tests**
- ✗ (Red X) for **failed tests**
- Each test shows the HTTP status code or error message

### Example Output:
```
========== KrishiBazaar API Test Suite ==========

1. Health Check

✓ Health Check - Status: 200

2. Authentication Tests

✓ Register User - Status: 201
✓ Login User - Status: 200
✓ Get Current User - Status: 200
✓ Update Profile - Status: 200
✓ Refresh Access Token - Status: 200

========== Test Summary ==========

Passed: 45
Failed: 5
Total: 50

5 tests failed. Please review the errors above.
```

## Configuration

### Changing the API URL
If your backend is running on a different port or host, update the `BASE_URL` in `test.js`:

```javascript
const BASE_URL = process.env.API_URL || 'http://localhost:8000';
// Change 8000 to your port if different
```

Or set the `API_URL` environment variable:

```bash
# On Windows PowerShell
$env:API_URL = 'http://localhost:3000'
node test.js

# On Windows CMD
set API_URL=http://localhost:3000
node test.js

# On macOS/Linux
export API_URL=http://localhost:3000
node test.js
```

## Troubleshooting

### "Server is not running" Error
- Make sure your backend server is running with `npm run dev` or `npm start`
- Check if the correct port is being used (default: 8000)

### CORS-related Errors
- Ensure CORS is properly configured in your server
- Check that the frontend/test client origin is in the allowed origins list

### Authentication Failures
- The test creates a new user each time it runs (timestamp-based email)
- Make sure your database is accessible
- Check authentication middleware configuration

### Role-based Errors
- Some tests may fail if the authenticated user doesn't have the required role
- This is expected behavior - tests are designed to handle role-based access control

## Tips for Testing

1. **Run tests regularly** - After making changes to API endpoints
2. **Check error messages** - They provide clues about what's wrong
3. **Review failed tests** - Yellow warnings are often expected (e.g., role limitations)
4. **Update test data** - Modify registration data if needed (names, emails, etc.)
5. **Monitor server logs** - Watch the backend console while tests run

## Extending the Test Suite

To add new tests:

1. Use the `testEndpoint()` helper function
2. Pass the test name, HTTP method, URL, and optional data
3. Example:

```javascript
await testEndpoint(
  'My New Test',
  'POST',
  '/api/my-endpoint',
  { data: 'value' }
);
```

## Notes

- Tests generate unique user accounts (with timestamps) to avoid conflicts
- Bearer tokens are automatically included in requests
- FormData is used for endpoints that require file uploads
- Some tests may fail due to role-based access control - this is expected
- Tests handle errors gracefully and continue with the next test
