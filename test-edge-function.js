async function testEdgeFunction() {
    const url = 'https://unveoqnlqnobufhublyw.supabase.co/functions/v1/status-check';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
    };

    try {
        console.log('Testing checkSupabase...');
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ action: 'checkSupabase', params: {} })
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        console.log('\nTesting getStatistics...');
        const response2 = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ action: 'getStatistics', params: {} })
        });

        const data2 = await response2.json();
        console.log('Response:', JSON.stringify(data2, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEdgeFunction();