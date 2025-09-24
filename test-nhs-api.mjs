// Test NHS ORD API directly

async function testAPI() {
  const url = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Status=Active&Roles=RO177&Limit=5&_format=json';

  console.log('Testing URL:', url);

  try {
    // Test 1: Basic fetch
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'CheckLoop-Setup/1.0'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (response.ok) {
      const data = await response.json();
      console.log('Success! Found organisations:', data.Organisations?.length);
      console.log('First org:', data.Organisations?.[0]);
    } else {
      const text = await response.text();
      console.log('Error response body:', text);
    }

    // Test 2: Try without User-Agent
    console.log('\nTest 2: Without User-Agent header');
    const response2 = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('Response status:', response2.status);

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();