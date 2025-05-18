// Load testing script for CloudGuard API using k6
// To run this test, install k6 (https://k6.io/docs/getting-started/installation/)
// and run: k6 run load-test.js

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Define custom metrics
const errors = new Counter('errors');
const authFailures = new Rate('auth_failures');
const apiDuration = new Trend('api_duration');

// Configuration options
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 100 }, // Ramp up to 100 users over 30 seconds
    { duration: '1m', target: 100 },  // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],   // 99% success rate
    'auth_failures': ['rate<0.01'],   // 99% successful authentication
    'api_duration': ['p(95)<1000'],   // 95% of API calls under 1000ms
  },
};

// Shared array of user credentials for testing
const userCredentials = new SharedArray('users', function() {
  return [
    { username: 'demo', password: 'password' },
    { username: 'testuser1', password: 'password123' },
    { username: 'testuser2', password: 'password123' },
  ];
});

// Variables to store tokens
let authTokens = {};

// Helper function to authenticate a user
function authenticate(username, password) {
  const url = 'http://localhost:8080/api/login';
  const payload = JSON.stringify({
    username: username,
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(url, payload, params);
  
  // Record response time
  apiDuration.add(response.timings.duration);
  
  // Check for successful login
  if (response.status !== 200) {
    authFailures.add(1);
    errors.add(1);
    console.log(`Authentication failed for user ${username}: ${response.status}`);
    return null;
  }
  
  try {
    const result = JSON.parse(response.body);
    return result.token;
  } catch (e) {
    authFailures.add(1);
    errors.add(1);
    console.log(`Error parsing authentication response: ${e.message}`);
    return null;
  }
}

// Test endpoints with authentication
function testAuthenticatedEndpoints(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  // Test user info endpoint
  const userResponse = http.get('http://localhost:8080/api/user', params);
  apiDuration.add(userResponse.timings.duration);
  check(userResponse, {
    'User data retrieved successfully': (r) => r.status === 200,
    'User data contains username': (r) => JSON.parse(r.body).username !== undefined,
  });
  
  // Test resources endpoint
  const resourcesResponse = http.get('http://localhost:8080/api/resources', params);
  apiDuration.add(resourcesResponse.timings.duration);
  check(resourcesResponse, {
    'Resources retrieved successfully': (r) => r.status === 200,
  });
  
  // Test AWS resources endpoint
  const awsResourcesResponse = http.get('http://localhost:8080/api/aws-resources', params);
  apiDuration.add(awsResourcesResponse.timings.duration);
  check(awsResourcesResponse, {
    'AWS resources retrieved successfully': (r) => r.status === 200 || r.status === 404, // 404 is acceptable if no AWS credentials
  });
  
  // Test AI cost prediction endpoint
  const predictionResponse = http.get('http://localhost:8080/api/ai-cost/predict', params);
  apiDuration.add(predictionResponse.timings.duration);
  check(predictionResponse, {
    'Cost prediction retrieved successfully': (r) => r.status === 200 || r.status === 404, // 404 is acceptable if no resources
  });
}

// Test public endpoints
function testPublicEndpoints() {
  // Test health endpoint
  const healthResponse = http.get('http://localhost:8080/api/health');
  apiDuration.add(healthResponse.timings.duration);
  check(healthResponse, {
    'Health check is successful': (r) => r.status === 200,
  });
}

// Main test function
export default function() {
  // 20% of the time, just test public endpoints
  if (Math.random() < 0.2) {
    testPublicEndpoints();
    sleep(1);
    return;
  }
  
  // Select a random user credential
  const userCred = randomItem(userCredentials);
  const username = userCred.username;
  
  // Check if we already have a token for this user
  let token = authTokens[username];
  
  // If not, authenticate to get a token
  if (!token) {
    token = authenticate(username, userCred.password);
    if (token) {
      authTokens[username] = token;
    } else {
      // Authentication failed, just test public endpoints
      testPublicEndpoints();
      sleep(1);
      return;
    }
  }
  
  // Test authenticated endpoints
  testAuthenticatedEndpoints(token);
  
  // Sleep between iterations to simulate real user behavior
  sleep(Math.random() * 3 + 1);
}