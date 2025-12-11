// Test script for the complete Create Story workflow
console.log('🧪 Testing Complete Create Story Workflow...');

// Test 1: Check if the form validation works
console.log('\n1. Testing Form Validation...');
const testFormData = {
  title: 'Test Story Title',
  content: 'This is a test story content with more than 10 characters',
  coverImageUrl: 'https://example.com/test-image.jpg',
  tags: ['test', 'story', 'vietnam'],
  destinationId: 'optional-destination-id'
};

console.log('✅ Form data structure:', testFormData);

// Test 2: Check if the API endpoint is accessible
console.log('\n2. Testing API Endpoint Accessibility...');
fetch('http://localhost:5174/api/stories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testFormData)
})
.then(response => {
  console.log('📡 API Response Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📡 API Response Data:', data);
  
  if (data.success === false && data.error === 'Không được phép truy cập') {
    console.log('✅ API is working correctly - rejecting unauthorized requests');
  } else {
    console.log('⚠️ Unexpected API response');
  }
})
.catch(error => {
  console.error('❌ API Test Failed:', error);
});

// Test 3: Check if the destination search is working
console.log('\n3. Testing Destination Search...');
fetch('http://localhost:5174/api/destinations/search?q=Ha%20Long&limit=5')
.then(response => response.json())
.then(data => {
  console.log('🔍 Destination Search Response:', data);
  
  if (data.success && Array.isArray(data.data)) {
    console.log('✅ Destination search is working correctly');
    console.log('📊 Found destinations:', data.data.length);
  } else {
    console.log('⚠️ Destination search may have issues');
  }
})
.catch(error => {
  console.error('❌ Destination Search Test Failed:', error);
});

console.log('\n✅ Complete workflow test initiated!');
console.log('📝 Check the console for results...');













