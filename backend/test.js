import axios from 'axios';
import chalk from 'chalk';

// Configuration
const BASE_URL = process.env.PORT || 'http://localhost:5000';
const API_INSTANCE = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Test Results
let passed = 0;
let failed = 0;
const results = [];

// Store tokens and IDs for testing
let accessToken = null;
let refreshToken = null;
let userId = null;
let listingId = null;
let orderId = null;
let notificationId = null;

// Helper function to test endpoints
async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    let response;
    const config = { headers };

    if (accessToken && !headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    switch (method.toUpperCase()) {
      case 'GET':
        response = await API_INSTANCE.get(url, config);
        break;
      case 'POST':
        response = await API_INSTANCE.post(url, data, config);
        break;
      case 'PATCH':
        response = await API_INSTANCE.patch(url, data, config);
        break;
      case 'PUT':
        response = await API_INSTANCE.put(url, data, config);
        break;
      case 'DELETE':
        response = await API_INSTANCE.delete(url, config);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }

    passed++;
    const result = `${chalk.green('✓')} ${name} - Status: ${response.status}`;
    console.log(result);
    results.push(result);
    return response.data;
  } catch (error) {
    failed++;
    const errorMsg = error.response?.data?.message || error.message;
    const result = `${chalk.red('✗')} ${name} - Error: ${errorMsg}`;
    console.log(result);
    results.push(result);
    throw error;
  }
}

// Main test suite
async function runTests() {
  console.log(chalk.bold.blue('\n========== KrishiBazaar API Test Suite ==========\n'));

  // 1. Health Check
  console.log(chalk.bold.cyan('1. Health Check\n'));
  try {
    await testEndpoint('Health Check', 'GET', '/api/health');
  } catch (error) {
    console.log(chalk.red('Server is not running. Please start the server first.\n'));
    process.exit(1);
  }

  // 2. Authentication Tests
  console.log(chalk.bold.cyan('\n2. Authentication Tests\n'));
  try {
    // Register User
    const registerData = {
      name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'testPassword123',
      role: 'farmer',
      phone: '+919876543210',
      district: 'Pune',
      state: 'Maharashtra',
    };

    const registerResponse = await testEndpoint(
      'Register User',
      'POST',
      '/api/auth/register',
      registerData
    );
    userId = registerResponse.data?.data?.user?._id || registerResponse.data?.user?._id;

    // Login User
    const loginData = {
      email: registerData.email,
      password: registerData.password,
    };

    const loginResponse = await testEndpoint(
      'Login User',
      'POST',
      '/api/auth/login',
      loginData
    );
    accessToken = loginResponse.data?.accessToken;
    refreshToken = loginResponse.data?.refreshToken;

    // Get Current User
    const currentUserResponse = await testEndpoint('Get Current User', 'GET', '/api/auth/me');
    userId = currentUserResponse?.data?.data?._id || userId;

    // Update Profile
    const updateData = {
      name: `Updated User ${Date.now()}`,
      phone: '+919876543211',
    };
    await testEndpoint('Update Profile', 'PATCH', '/api/auth/me', updateData);

    // Refresh Token
    await testEndpoint(
      'Refresh Access Token',
      'POST',
      '/api/auth/refresh-token',
      { refreshToken }
    );
  } catch (error) {
    console.log(chalk.yellow('\nAuth tests: Some tests failed (this is OK if endpoints have validation)\n'));
  }

  // 3. Listing Tests
  console.log(chalk.bold.cyan('\n3. Listing Tests\n'));
  try {
    // Get All Listings
    await testEndpoint('Get All Listings', 'GET', '/api/listings');

    // Create Listing (only if farmer)
    try {
      const listingData = new FormData();
      listingData.append('cropName', 'Tomato');
      listingData.append('quantity', '100');
      listingData.append('pricePerKg', '50');
      listingData.append('description', 'Fresh tomatoes from farm');
      listingData.append('state', 'Maharashtra');
      listingData.append('district', 'Pune');
      listingData.append('harvestDate', new Date().toISOString());

      const createListingResponse = await testEndpoint(
        'Create Listing',
        'POST',
        '/api/listings',
        listingData,
        { 'Content-Type': 'multipart/form-data' }
      );
      listingId = createListingResponse.data?.data?._id || createListingResponse.data?._id;

      // Get My Listings
      if (userId) {
        await testEndpoint('Get My Listings', 'GET', '/api/listings/my');
      }

      // Get Single Listing
      if (listingId) {
        await testEndpoint('Get Single Listing', 'GET', `/api/listings/${listingId}`);

        // Update Listing
        const updateListingData = {
          pricePerKg: '60',
          quantity: '150',
        };
        await testEndpoint(
          'Update Listing',
          'PUT',
          `/api/listings/${listingId}`,
          updateListingData
        );
      }
    } catch (error) {
      console.log(chalk.yellow('Listing creation test failed (might need proper role/permissions)\n'));
    }
  } catch (error) {
    console.log(chalk.yellow('Listing tests: Some tests failed\n'));
  }

  // 4. Order Tests
  console.log(chalk.bold.cyan('\n4. Order Tests\n'));
  try {
    // Get Incoming Orders (Farmer only) - using the farmer token
    try {
      await testEndpoint('Get Incoming Orders', 'GET', '/api/orders/incoming');
    } catch (error) {
      console.log(chalk.yellow('  (Incoming orders test requires farmer role)'));
    }

    // Get My Orders - Create a buyer account for this test
    try {
      const buyerRegisterData = {
        name: `Test Buyer ${Date.now()}`,
        email: `buyer${Date.now()}@example.com`,
        password: 'buyerPassword123',
        role: 'buyer',
        phone: '+919876543220',
        district: 'Pune',
        state: 'Maharashtra',
      };

      // Temporarily store farmer token and clear it for buyer registration
      const farmerToken = accessToken;
      accessToken = null;

      const buyerRegisterResponse = await testEndpoint(
        'Register Buyer',
        'POST',
        '/api/auth/register',
        buyerRegisterData
      );

      const buyerLoginData = {
        email: buyerRegisterData.email,
        password: buyerRegisterData.password,
      };

      const buyerLoginResponse = await testEndpoint(
        'Login Buyer',
        'POST',
        '/api/auth/login',
        buyerLoginData
      );

      const buyerAccessToken = buyerLoginResponse.data?.data?.accessToken || buyerLoginResponse.data?.accessToken;
      accessToken = buyerAccessToken; // Switch to buyer token

      await testEndpoint('Get My Orders', 'GET', '/api/orders/my');

      accessToken = farmerToken; // Switch back to farmer token
    } catch (error) {
      console.log(chalk.yellow('  (My orders test requires buyer role)'));
    }
  } catch (error) {
    console.log(chalk.yellow('Order tests: Some tests failed\n'));
  }

  // 5. Notification Tests
  console.log(chalk.bold.cyan('\n5. Notification Tests\n'));
  try {
    // Get Notifications
    const notificationsResponse = await testEndpoint(
      'Get Notifications',
      'GET',
      '/api/notifications'
    );
    notificationId = notificationsResponse.data?.[0]?._id;

    // Get Unread Count
    await testEndpoint('Get Unread Count', 'GET', '/api/notifications/unread-count');

    // Mark All as Read
    try {
      await testEndpoint('Mark All Notifications as Read', 'PATCH', '/api/notifications/read-all');
    } catch (error) {
      console.log(chalk.yellow('  (No notifications to mark as read)'));
    }

    // Mark Single as Read
    if (notificationId) {
      try {
        await testEndpoint(
          'Mark Notification as Read',
          'PATCH',
          `/api/notifications/${notificationId}/read`
        );
      } catch (error) {
        console.log(chalk.yellow('  (Could not mark notification as read)'));
      }
    }
  } catch (error) {
    console.log(chalk.yellow('Notification tests: Some tests failed\n'));
  }

  // 6. Review Tests
  console.log(chalk.bold.cyan('\n6. Review Tests\n'));
  try {
    // Get Reviews by Farmer
    if (userId) {
      try {
        const reviewResponse = await testEndpoint('Get Reviews by Farmer', 'GET', `/api/reviews/farmer/${userId}`);
        const reviewData = reviewResponse?.data || reviewResponse;
        const reviewCount = reviewData?.reviews?.length || 0;
        const avgRating = typeof reviewData?.avgRating === 'number' ? reviewData.avgRating : 0;

        console.log(
          chalk.green(
            `  Review endpoint OK: ${reviewCount} review(s), average rating ${avgRating.toFixed(1)}`
          )
        );
      } catch (error) {
        console.log(chalk.yellow('  (Could not fetch reviews for farmer)'));
      }
    }
  } catch (error) {
    console.log(chalk.yellow('Review tests: Some tests failed\n'));
  }
 
  // 7. Transporter Tests
  console.log(chalk.bold.cyan('\n7. Transporter Tests\n'));
  try {
    // Get All Transporters (assuming public endpoint)
    try {
      await testEndpoint('Get All Transporters', 'GET', '/api/transporters');
    } catch (error) {
      console.log(chalk.yellow('  (Transporters endpoint test failed)'));
    }
  } catch (error) {
    console.log(chalk.yellow('Transporter tests: Some tests failed\n'));
  }

  // 8. Delivery Tests
  console.log(chalk.bold.cyan('\n8. Delivery Tests\n'));
  try {
    // Get Delivery Zones (assuming public endpoint)
    try {
      await testEndpoint('Get Delivery Info', 'GET', '/api/delivery');
    } catch (error) {
      console.log(chalk.yellow('  (Delivery endpoint test failed)'));
    }
  } catch (error) {
    console.log(chalk.yellow('Delivery tests: Some tests failed\n'));
  }

  // 9. Admin Tests
  console.log(chalk.bold.cyan('\n9. Admin Tests\n'));
  try {
    // Get Admin Dashboard Stats (Admin only)
    try {
      await testEndpoint('Get Admin Dashboard Stats', 'GET', '/api/admin/dashboard');
    } catch (error) {
      console.log(chalk.yellow('  (Admin dashboard test requires admin role)'));
    }
  } catch (error) {
    console.log(chalk.yellow('Admin tests: Some tests failed\n'));
  }

  // 10. AI Routes Tests
  console.log(chalk.bold.cyan('\n10. AI Routes Tests\n'));
  try {
    // Get AI Recommendations (if available)
    try {
      await testEndpoint('Get AI Recommendations', 'GET', '/api/ai/recommendations');
    } catch (error) {
      console.log(chalk.yellow('  (AI recommendations endpoint test failed)'));
    }
  } catch (error) {
    console.log(chalk.yellow('AI tests: Some tests failed\n'));
  }

  // Print Summary
  console.log(chalk.bold.cyan('\n========== Test Summary ==========\n'));
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  console.log(chalk.blue(`Total: ${passed + failed}\n`));

  if (failed === 0) {
    console.log(chalk.green.bold('All tests passed! ✓\n'));
  } else {
    console.log(chalk.yellow.bold(`${failed} tests failed. Please review the errors above.\n`));
  }

  // Logout (optional - only if token exists)
  if (accessToken) {
    try {
      console.log(chalk.bold.cyan('Logging out...\n'));
      await testEndpoint('Logout', 'POST', '/api/auth/logout', {});
    } catch (error) {
      console.log(chalk.yellow('Logout failed (this is OK)\n'));
    }
  }
}

// Run tests
runTests().catch((error) => {
  console.error(chalk.red('\nUnexpected error during tests:'), error.message);
  process.exit(1);
});
