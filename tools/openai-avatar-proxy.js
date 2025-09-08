#!/usr/bin/env node
/**
 * Minimal local proxy to call OpenAI and map a natural language
 * description to DiceBear Adventurer options.
 *
 * Usage:
 *   OPENAI_API_KEY=... node tools/openai-avatar-proxy.js
 *
 * Endpoint:
 *   POST http://localhost:8787/generate-avatar
 *   Body: { description: string, seedHint?: string, options: { [selectId]: string[]|number[] } }
 *   Returns: JSON with fields matching the DiceBear query parameters.
 */

const http = require('http');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
let LOCAL_KEY;
try { LOCAL_KEY = require('./openai-key.local.js').OPENAI_API_KEY; } catch(_) { /* optional */ }
const API_KEY = process.env.OPENAI_API_KEY || (process.env.OPENAI_API_KEY_B64 && Buffer.from(process.env.OPENAI_API_KEY_B64, 'base64').toString('utf8')) || LOCAL_KEY;

if (!API_KEY) {
  console.error('[openai-avatar-proxy] Missing OPENAI_API_KEY');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) { req.destroy(); reject(new Error('BODY_TOO_LARGE')); } });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': typeof obj === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  });
  res.end(body);
}

async function callOpenAI(payload, modelOrder) {
  const models = modelOrder || ['gpt-5-nano', 'gpt-4o-mini'];
  let lastErr;
  for (const model of models) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: payload
        })
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`OpenAI ${resp.status}: ${t}`);
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('OpenAI call failed');
}

function buildMessages({ description, options, seedHint }) {
  const schema = {
    seed: 'string (optional)',
    backgroundType: 'one of options.opt-backgroundType',
    backgroundColor: 'one of options.opt-backgroundColor',
    backgroundRotation: 'one of options.opt-backgroundRotation (integer)',
    radius: 'one of options.opt-radius (integer)',
    rotate: 'one of options.opt-rotate (integer)',
    scale: 'one of options.opt-scale (integer)',
    flip: 'boolean as string "true"/"false" if needed',
    clip: 'boolean as string "true"/"false" if needed',
    translateX: 'one of options.opt-translateX (integer)',
    translateY: 'one of options.opt-translateY (integer)',
    eyes: 'one of options.opt-eyes',
    mouth: 'one of options.opt-mouth',
    eyebrows: 'one of options.opt-eyebrows',
    glasses: 'one of options.opt-glasses',
    glassesProbability: 'one of options.opt-glassesProbability (integer 0-100)',
    earrings: 'one of options.opt-earrings',
    earringsProbability: 'one of options.opt-earringsProbability (integer 0-100)',
    features: 'array of any of options.opt-features',
    featuresProbability: 'one of options.opt-featuresProbability (integer 0-100)',
    hair: 'one of options.opt-hair',
    hairColor: 'one of options.opt-hairColor (hex)',
    hairProbability: 'one of options.opt-hairProbability (integer 0-100)',
    skinColor: 'one of options.opt-skinColor (hex)'
  };
  const sys = {
    role: 'system',
    content: 'You are a precise UI assistant that selects DiceBear Adventurer options from allowed dropdowns. Only respond with valid JSON containing keys whose values are chosen strictly from the provided option lists. Omit keys you don\'t want to change. Prefer readable combinations. Use seedHint if helpful.'
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ task: 'Map description to options', style: 'adventurer', seedHint, description, allowedOptions: options, expectedJsonSchema: schema }, null, 2)
  };
  return [sys, user];
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.url === '/generate-avatar' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const { description, options, seedHint } = body || {};
      if (!description || typeof description !== 'string') return send(res, 400, { error: 'Missing description' });
      if (!options || typeof options !== 'object') return send(res, 400, { error: 'Missing options' });
      if (!API_KEY) return send(res, 500, { error: 'Server missing OPENAI_API_KEY' });

      const messages = buildMessages({ description, options, seedHint });
      const result = await callOpenAI(messages);
      // Ensure only known keys are returned
      const allowedKeys = new Set(['seed','backgroundType','backgroundColor','backgroundRotation','radius','rotate','scale','flip','clip','translateX','translateY','eyes','mouth','eyebrows','glasses','glassesProbability','earrings','earringsProbability','features','featuresProbability','hair','hairColor','hairProbability','skinColor']);
      const clean = {};
      for (const [k,v] of Object.entries(result||{})){
        if (allowedKeys.has(k)) clean[k] = v;
      }
      return send(res, 200, clean);
    } catch (e) {
      console.error('[proxy] error', e);
      return send(res, 500, { error: String(e.message||e) });
    }
  }
  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[openai-avatar-proxy] Listening on http://localhost:${PORT}`);
});
