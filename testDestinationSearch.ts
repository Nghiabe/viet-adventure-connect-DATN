import fetch from 'node-fetch';

async function testDestinationSearch() {
  try {
    console.log('🧪 Testing Destination Search API...');
    
    // Test 1: Search for "Ha Long"
    console.log('\n1. Testing search for "Ha Long"...');
    const response1 = await fetch('http://localhost:5173/api/destinations/search?q=Ha%20Long&limit=5');
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    // Test 2: Search for "Vịnh"
    console.log('\n2. Testing search for "Vịnh"...');
    const response2 = await fetch('http://localhost:5173/api/destinations/search?q=Vịnh&limit=5');
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    // Test 3: Empty search
    console.log('\n3. Testing empty search...');
    const response3 = await fetch('http://localhost:5173/api/destinations/search?q=&limit=5');
    const data3 = await response3.json();
    console.log('Response:', JSON.stringify(data3, null, 2));
    
    console.log('\n✅ Destination Search API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDestinationSearch();













