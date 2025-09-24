// NHS ORD API Proxy Server
// Run this server to bypass CORS restrictions

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3456;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'NHS ORD Proxy' });
});

// Proxy endpoint for NHS ORD API
app.get('/api/nhs/organisations', async (req, res) => {
  try {
    const {
      status = 'Active',
      role = 'RO76',
      limit = 500,
      offset = 0
    } = req.query;

    // Build URL based on role type
    let url;
    const BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0';

    if (role === 'RO76') {
      url = `${BASE}/organisations?Status=${status}&NonPrimaryRoleId=RO76&Limit=${limit}&Offset=${offset}&_format=json`;
    } else if (role === 'RO177') {
      url = `${BASE}/organisations?Status=${status}&PrimaryRoleId=RO177&Limit=${limit}&Offset=${offset}&_format=json`;
    } else {
      url = `${BASE}/organisations?Status=${status}&Limit=${limit}&Offset=${offset}&_format=json`;
    }

    console.log(`Fetching from NHS ORD: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'CheckLoop-Proxy/1.0'
      }
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      console.error(`NHS ORD returned status: ${response.status}`);
      return res.status(response.status).json({
        error: `NHS ORD API returned status ${response.status}`,
        status: response.status
      });
    }

    // Parse response
    let data;
    if (contentType.includes('json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response from NHS ORD');
        return res.status(502).json({
          error: 'Invalid response from NHS ORD API',
          contentType
        });
      }
    }

    // Log success
    const orgCount = data?.Organisations?.length || 0;
    console.log(`Successfully fetched ${orgCount} organisations`);

    // Send data to client
    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: error.message,
      type: 'PROXY_ERROR'
    });
  }
});

// Batch fetch endpoint - get ALL GP practices
app.get('/api/nhs/all-gp-practices', async (req, res) => {
  try {
    console.log('Fetching ALL GP practices...');
    let allPractices = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore && offset < 20000) { // Safety limit
      const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Status=Active&NonPrimaryRoleId=RO76&Limit=${limit}&Offset=${offset}&_format=json`;

      console.log(`Fetching batch: offset=${offset}, limit=${limit}`);

      const response = await fetch(url, {
        headers: {
          'Accept': '*/*',
          'User-Agent': 'CheckLoop-Proxy/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const orgs = data?.Organisations || [];

        if (orgs.length === 0) {
          hasMore = false;
        } else {
          allPractices = allPractices.concat(orgs);
          offset += orgs.length;

          if (orgs.length < limit) {
            hasMore = false;
          }
        }
      } else {
        console.error(`Failed at offset ${offset}, status: ${response.status}`);
        hasMore = false;
      }
    }

    console.log(`Total GP practices fetched: ${allPractices.length}`);

    res.json({
      Organisations: allPractices,
      total: allPractices.length,
      source: 'NHS ORD API'
    });

  } catch (error) {
    console.error('Batch fetch error:', error);
    res.status(500).json({
      error: error.message,
      type: 'BATCH_FETCH_ERROR'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     NHS ORD Proxy Server Running!          ║
║                                            ║
║     URL: http://localhost:${PORT}            ║
║                                            ║
║     Endpoints:                             ║
║     /api/nhs/organisations                 ║
║     /api/nhs/all-gp-practices              ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});