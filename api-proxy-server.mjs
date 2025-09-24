#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// NHS ORD API proxy
app.get('/nhs-proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    console.log(`Proxying NHS request to: ${url}`);

    const response = await fetch(url + '?_format=json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`NHS API error: ${response.status}`);
      return res.status(response.status).json({
        error: `NHS API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('NHS proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CQC API proxy - search locations
app.get('/cqc-proxy/locations', async (req, res) => {
  try {
    const baseUrl = 'https://api.service.cqc.org.uk/public/v1/locations';
    const queryParams = new URLSearchParams();

    // Add search parameters
    if (req.query.partnerCode) {
      queryParams.append('partnerCode', req.query.partnerCode);
    }
    if (req.query.locationName) {
      queryParams.append('locationName', req.query.locationName);
    }
    if (req.query.page) {
      queryParams.append('page', req.query.page);
    }
    if (req.query.perPage) {
      queryParams.append('perPage', req.query.perPage || '20');
    }

    const url = `${baseUrl}?${queryParams.toString()}`;
    console.log(`Proxying CQC search to: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`CQC API error: ${response.status}`);
      return res.status(response.status).json({
        error: `CQC API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('CQC proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CQC API proxy - get location details
app.get('/cqc-proxy/locations/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const url = `https://api.service.cqc.org.uk/public/v1/locations/${locationId}`;

    console.log(`Proxying CQC details request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`CQC API error: ${response.status}`);
      return res.status(response.status).json({
        error: `CQC API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('CQC location details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CQC API proxy - get provider details
app.get('/cqc-proxy/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const url = `https://api.service.cqc.org.uk/public/v1/providers/${providerId}`;

    console.log(`Proxying CQC provider request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`CQC API error: ${response.status}`);
      return res.status(response.status).json({
        error: `CQC API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('CQC provider error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NHS ORD API - get all organisations with pagination
app.get('/nhs-ord/organisations', async (req, res) => {
  try {
    const baseUrl = 'https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations';
    const queryParams = new URLSearchParams();

    // Add query parameters
    if (req.query.Status) queryParams.append('Status', req.query.Status);
    if (req.query.Roles) queryParams.append('Roles', req.query.Roles);
    if (req.query.Limit) queryParams.append('Limit', req.query.Limit);
    if (req.query.Offset) queryParams.append('Offset', req.query.Offset);

    // Always request JSON format
    queryParams.append('_format', 'json');

    const url = `${baseUrl}?${queryParams.toString()}`;
    console.log(`Fetching NHS organisations: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`NHS API error: ${response.status}`);
      return res.status(response.status).json({
        error: `NHS API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('NHS organisations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NHS ORD API - get single organisation details
app.get('/nhs-ord/organisations/:odsCode', async (req, res) => {
  try {
    const { odsCode } = req.params;
    const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${odsCode}?_format=json`;

    console.log(`Fetching NHS organisation details: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CheckLoops/1.0'
      }
    });

    if (!response.ok) {
      console.error(`NHS API error: ${response.status}`);
      return res.status(response.status).json({
        error: `NHS API returned ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('NHS organisation details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      nhs: 'available',
      cqc: 'available'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  API PROXY SERVER                         ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}               ║
║                                                           ║
║  Available endpoints:                                     ║
║  • NHS ORD API:                                          ║
║    GET /nhs-proxy?url={encoded_url}                      ║
║    GET /nhs-ord/organisations                            ║
║    GET /nhs-ord/organisations/:odsCode                   ║
║                                                           ║
║  • CQC API:                                              ║
║    GET /cqc-proxy/locations                              ║
║    GET /cqc-proxy/locations/:locationId                  ║
║    GET /cqc-proxy/providers/:providerId                  ║
║                                                           ║
║  • Health Check:                                         ║
║    GET /health                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});