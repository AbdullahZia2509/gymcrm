/**
 * Test script to verify superadmin access across gyms
 * 
 * This script tests various API endpoints to ensure that superadmin users
 * can access data across all gyms without gym-based filtering.
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:5000/api';
let token = '';

// Test user credentials (should be a superadmin)
const credentials = {
  email: 'superadmin@example.com',
  password: 'password123'
};

// Helper function to log results
const logResult = (endpoint, success, data = null, error = null) => {
  console.log(`\n=== Testing ${endpoint} ===`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) {
      if (Array.isArray(data)) {
        console.log(`Retrieved ${data.length} items`);
        if (data.length > 0) {
          console.log('Sample item:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
        }
      } else {
        console.log('Data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
    }
  } else {
    console.log('❌ FAILED');
    console.error('Error:', error);
  }
};

// Login and get token
const login = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth`, credentials);
    token = response.data.token;
    console.log('Successfully logged in as superadmin');
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return false;
  }
};

// Test endpoints
const testEndpoints = async () => {
  const headers = { 'x-auth-token': token };
  
  // Test endpoints
  const endpoints = [
    { name: 'Members', url: '/members' },
    { name: 'Memberships', url: '/memberships' },
    { name: 'Payments', url: '/payments' },
    { name: 'Attendance', url: '/attendance' },
    { name: 'Classes', url: '/classes' },
    { name: 'Staff', url: '/staff' },
    { name: 'Reports - Revenue', url: '/reports/revenue?period=monthly' },
    { name: 'Reports - Membership', url: '/reports/membership' },
    { name: 'Reports - Attendance', url: '/reports/attendance?period=monthly' },
    { name: 'Reports - Classes', url: '/reports/classes' },
    { name: 'Settings', url: '/settings' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`, { headers });
      logResult(endpoint.name, true, response.data);
    } catch (error) {
      logResult(endpoint.name, false, null, error.response?.data || error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  console.log('=== SUPERADMIN ACCESS TEST ===');
  console.log('Testing if superadmin can access data across all gyms\n');
  
  const isLoggedIn = await login();
  if (isLoggedIn) {
    await testEndpoints();
  }
};

runTests();
