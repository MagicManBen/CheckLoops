#!/usr/bin/env node
/**
 * Generate human‑readable labels for DiceBear Adventurer options by
 * asking OpenAI (vision) to describe each variant from an SVG sample.
 *
 * Usage:
 *   OPENAI_API_KEY=... node tools/generate-avatar-labels.js [category ...]
 *
 * Categories (any subset): eyes mouth eyebrows glasses earrings hair
 * Default: eyes mouth eyebrows
 *
 * Outputs:
 *   - avatar_labels.generated.json (structured results)
 *   - avatar_option_labels.sql (UPSERT statements you can run in Supabase)
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const CATEGORIES_ALL = ['eyes', 'mouth', 'eyebrows', 'glasses', 'earrings', 'hair'];
const args = process.argv.slice(2).filter(Boolean);
const CATEGORIES = args.length ? args : ['eyes', 'mouth', 'eyebrows'];

function range(n) { return Array.from({ length: n }, (_, i) => i + 1); }
function v2(n) { return String(n).padStart(2, '0'); }

const VARIANTS = {
  eyes: range(26).map(i => `variant${v2(i)}`),
  mouth: range(30).map(i => `variant${v2(i)}`),
  eyebrows: range(15).map(i => `variant${v2(i)}`),
  glasses: range(5).map(i => `variant${v2(i)}`),
  earrings: range(6).map(i => `variant${v2(i)}`),
  hair: [
    ...range(19).map(i => `short${v2(i)}`),
    ...range(26).map(i => `long${v2(i)}`)
  ],
};

const OPTION_ID = {
  eyes: 'opt-eyes',
  mouth: 'opt-mouth',
  eyebrows: 'opt-eyebrows',
  glasses: 'opt-glasses',
  earrings: 'opt-earrings',
  hair: 'opt-hair',
};

function dicebearUrl(type, variant) {
  const base = 'https://api.dicebear.com/7.x/adventurer/svg';
  const params = new URLSearchParams();
  params.set('seed', 'LabelSeed');
  // Keep everything simple so the changed part is obvious
  params.set('backgroundType', 'solid');
  params.append('backgroundColor', 'ffffff');
  params.set('radius', '0');
  params.set('scale', '100');
  params.set('translateX', '0');
  params.set('translateY', '0');
  // Hide occluding accessories unless they are the target
  if (type !== 'glasses') params.set('glassesProbability', '0');
  if (type !== 'earrings') params.set('earringsProbability', '0');
  params.set('featuresProbability', '0');
  // Fixed baseline
  params.set('eyes', 'variant01');
  params.set('mouth', 'variant01');
  params.set('eyebrows', 'variant01');
  params.set('hair', 'short01');
  params.set('hairColor', '9e5622');
  params.set('skinColor', 'f2d3b1');
  // Apply the specific variant
  if (type === 'hair') params.set('hair', variant);
  else params.set(type, variant);
  return `${base}?${params.toString()}`;
}

function toDataUrl(svg) {
  const b64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}

async function fetchSvg(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DiceBear ${res.status}`);
  return res.text();
}

async function labelVariant({ type, variant, imageDataUrl }) {
  const sys = {
    role: 'system',
    content: `You are labeling DiceBear Adventurer avatar options. Return concise, plain JSON with these keys: { label: string (<= 2-3 words), keywords: string[] (lowercase), emoji?: string }.
The image shows a single change for the given category (type). Name the style succinctly (e.g., Smile, Open Smile, Wink, Surprised, Raised, Angry, Round, Cat-eye, Studs, Hoops, Short 5, Long 12).`
  };
  const user = {
    role: 'user',
    content: [
      { type: 'text', text: `Type: ${type}\nVariant: ${variant}\nRespond JSON only.` },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ]
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [sys, user],
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  let parsed = {};
  try { parsed = JSON.parse(content); } catch (_) {}
  const label = (parsed.label || '').trim();
  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [];
  const emoji = typeof parsed.emoji === 'string' ? parsed.emoji : undefined;
  return { label: label || `${type} ${variant}`, keywords, emoji };
}

async function main() {
  const list = [];
  for (const type of CATEGORIES) {
    const variants = VARIANTS[type] || [];
    for (const variant of variants) {
      list.push({ type, variant });
    }
  }

  console.log(`Labeling ${list.length} variants across: ${CATEGORIES.join(', ')}`);

  const out = [];
  const sql = [];
  // Header SQL for table (so user can copy-paste once)
  sql.push(`-- Create table if not exists\ncreate table if not exists public.avatar_option_labels (\n  id bigserial primary key,\n  option_id text not null,\n  value_key text not null,\n  label text not null,\n  keywords text[] default '{}',\n  unique (option_id, value_key)\n);\n`);

  let i = 0;
  for (const item of list) {
    i++;
    const url = dicebearUrl(item.type, item.variant);
    try {
      const svg = await fetchSvg(url);
      const dataUrl = toDataUrl(svg);
      const labeled = await labelVariant({ ...item, imageDataUrl: dataUrl });
      const optionId = OPTION_ID[item.type] || item.type;
      out.push({ option_id: optionId, value_key: item.variant, label: labeled.label, keywords: labeled.keywords, emoji: labeled.emoji });
      const kws = (labeled.keywords || []).map(k => k.replace(/'/g, "''"));
      sql.push(`insert into public.avatar_option_labels (option_id, value_key, label, keywords) values ('${optionId}','${item.variant}','${labeled.label.replace(/'/g, "''")}', '{${kws.join(',')}}') on conflict (option_id, value_key) do update set label=excluded.label, keywords=excluded.keywords;`);
      if (i % 10 === 0) console.log(`.. ${i}/${list.length}`);
      // simple pacing
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.warn(`Failed ${item.type}:${item.variant} -> ${e.message}`);
    }
  }

  const jsonPath = path.join(process.cwd(), 'avatar_labels.generated.json');
  const sqlPath = path.join(process.cwd(), 'avatar_option_labels.sql');
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(sqlPath, sql.join('\n'));
  console.log(`\nWrote ${out.length} labels to:\n- ${jsonPath}\n- ${sqlPath}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });

