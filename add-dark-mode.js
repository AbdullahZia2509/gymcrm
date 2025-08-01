const axios = require('axios');

// Function to add the darkMode setting
async function addDarkModeSetting() {
  try {
    // You'll need to replace YOUR_AUTH_TOKEN with your actual token
    const token = 'YOUR_AUTH_TOKEN';
    
    const response = await axios.post('http://localhost:5001/api/settings', {
      key: 'darkMode',
      value: false,
      category: 'appearance',
      label: 'Dark Mode',
      description: 'Enable dark mode for the application',
      type: 'boolean',
      isPublic: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    console.log('Dark mode setting created successfully!');
    console.log(response.data);
  } catch (error) {
    console.error('Error creating setting:', 
      error.response ? error.response.data : error.message);
  }
}

console.log('To add the darkMode setting, edit this file to add your auth token');
console.log('Then run: node add-dark-mode.js');
// addDarkModeSetting(); // Uncomment this line after adding your token

