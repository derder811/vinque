// Simple test to check localStorage and API functionality
console.log('=== Profile Picture Debug Test ===');

// Simulate what the frontend should have in localStorage
const testUser = {
  customer_id: 3,
  First_name: 'Jake',
  Last_name: 'De Dog'
};

console.log('Test user data:', testUser);

// Test the URL construction logic from Header.jsx
const API_URL = 'http://localhost:4280';
const profilePic = '1753443490457-g-coin_logo_bg(black).png';
const profileSrc = profilePic 
  ? `${API_URL}/uploads/${profilePic.replace(/^\/?uploads\/?/, '')}`
  : '/profile_icon.png';

console.log('Profile picture filename:', profilePic);
console.log('Constructed profile URL:', profileSrc);

// Check if the API endpoint would be called correctly
const apiUrl = `${API_URL}/api/header/search?customer_id=${testUser.customer_id}`;
console.log('API URL that frontend should call:', apiUrl);

console.log('\n=== Instructions ===');
console.log('1. Check if user is logged in (localStorage should contain user data)');
console.log('2. Verify the API returns profile_pic for the logged-in user');
console.log('3. Check browser console for any JavaScript errors');
console.log('4. Clear browser cache and localStorage if needed');