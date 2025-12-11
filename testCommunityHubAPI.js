// Test script for the Community Hub API
const fetch = require('node-fetch');

async function testCommunityHubAPI() {
  try {
    console.log('Testing Community Hub API...');
    
    const response = await fetch('http://localhost:5173/api/community/hub', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received successfully');
    console.log('Response structure:', {
      success: data.success,
      cached: data.cached,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : []
    });

    if (data.data) {
      console.log('\n📊 Data breakdown:');
      console.log('- Featured Story:', data.data.featuredStory ? 'Present' : 'None');
      console.log('- Latest Stories:', data.data.latestStories?.length || 0);
      console.log('- Trending Tags:', data.data.trendingTags?.length || 0);
      console.log('- Top Authors:', data.data.topAuthors?.length || 0);
      console.log('- Community Stats:', data.data.communityStats ? 'Present' : 'None');
    }

    console.log('\n🎉 Community Hub API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test
testCommunityHubAPI();
