/* tools/generate-avatar-labels.cjs
   Goals:
   1) GUARANTEE unique labels vs. previous runs (if avatar_labels.generated.json exists)
      and within THIS run.
   2) Use the CHEAPEST vision model by default: gpt-4o-mini (override with -m).

   Usage:
     node tools/generate-avatar-labels.cjs eyes
     node tools/generate-avatar-labels.cjs eyes mouth eyebrows glasses earrings hair
     node tools/generate-avatar-labels.cjs -m gpt-4o-mini eyes mouth eyebrows
*/

const fs = require('node:fs/promises');

// -------- CLI flags --------
const argv = process.argv.slice(2);
function readFlag(name, alias) {
  const iLong = argv.indexOf(`--${name}`);
  if (iLong !== -1 && argv[iLong + 1] && !argv[iLong + 1].startsWith('-')) return argv[iLong + 1];
  const iShort = alias ? argv.indexOf(`-${alias}`) : -1;
  if (iShort !== -1 && argv[iShort + 1] && !argv[iShort + 1].startsWith('-')) return argv[iShort + 1];
  return null;
}

// -------- Config --------
const model = readFlag('model','m') || process.env.OPENAI_MODEL || 'gpt-4o-mini'; // cheapest vision model
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is required in the environment');
  process.exit(1);
}
console.log(`Model: ${model}`);

// Variants (DiceBear Adventurer)
const variants = {
  eyes: Array.from({ length: 26 }, (_, i) => `variant${String(i+1).padStart(2,'0')}`),
  mouth: Array.from({ length: 30 }, (_, i) => `variant${String(i+1).padStart(2,'0')}`),
  eyebrows: Array.from({ length: 15 }, (_, i) => `variant${String(i+1).padStart(2,'0')}`),
  glasses: Array.from({ length: 5 },  (_, i) => `variant${String(i+1).padStart(2,'0')}`),
  earrings: Array.from({ length: 6 },  (_, i) => `variant${String(i+1).padStart(2,'0')}`),
  hair: [
    ...Array.from({ length: 19 }, (_, i) => `short${String(i+1).padStart(2,'0')}`),
    ...Array.from({ length: 26 }, (_, i) => `long${String(i+1).padStart(2,'0')}`),
  ],
};
const allowed = Object.keys(variants);
const requested = argv.filter(a => allowed.includes(a));
const categories = requested.length ? requested : ['eyes'];
console.log(`Categories: ${categories.join(', ')}`);

// -------- Helpers --------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');

function fallbackLabel(category, key) {
  const mVar = key.match(/^variant(\d{2})$/);
  if (mVar) return `${cap(category)} Style ${Number(mVar[1])}`;
  const mHair = key.match(/^(short|long)(\d{2})$/);
  if (mHair) return `${mHair[1] === 'short' ? 'Short' : 'Long'} ${Number(mHair[2])}`;
  return `${cap(category)} ${key}`;
}

function dicebearPngUrl(category, key) {
  const u = new URL('https://api.dicebear.com/7.x/adventurer/png');
  u.searchParams.set('seed','labeler');
  u.searchParams.set('backgroundColor','ffffff');
  u.searchParams.set('radius','0');
  // neutral baseline
  u.searchParams.set('eyes','variant01');
  u.searchParams.set('mouth','variant01');
  u.searchParams.set('eyebrows','variant01');
  u.searchParams.set('glasses','variant01');
  u.searchParams.set('earrings','variant01');
  u.searchParams.set('features','');
  // only show accessories/hair when labeling that category
  u.searchParams.set('glassesProbability',  category === 'glasses'  ? '100' : '0');
  u.searchParams.set('earringsProbability', category === 'earrings' ? '100' : '0');
  u.searchParams.set('featuresProbability','0');
  u.searchParams.set('hairProbability',     category === 'hair'     ? '100' : '0');
  // apply target
  u.searchParams.set(category, key);
  return u.toString();
}

async function pngDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DiceBear ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// Ask OpenAI with optional "avoid" hint
async function askOpenAI(imageDataUrl, category, key, avoidList = []) {
  const avoidText = avoidList.length ? ` Avoid any of these labels: ${avoidList.join(', ')}.` : '';
  const sys = 'You label avatar parts. Reply ONLY valid JSON: {"label":"2-3 words","keywords":["k1","k2"]}';
  const userText = `Name this ${category} option '${key}' in 2-3 concise, human-friendly words.${avoidText}`;

  const body = {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ] }
    ],
    temperature: 0.2,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  let parsed;
  try { parsed = JSON.parse(content); } catch {}
  if (!parsed || typeof parsed !== 'object' || !parsed.label) {
    return { label: fallbackLabel(category, key), keywords: [] };
  }
  if (!Array.isArray(parsed.keywords)) parsed.keywords = [];
  return parsed;
}

// Ensure uniqueness; if still colliding, append variant or -vNN
function forceUniqueLabel(rawLabel, category, key, usedSet) {
  let base = (rawLabel || '').trim();
  if (!base) base = fallbackLabel(category, key);
  let label = base;
  let L = norm(label);
  let attempt = 0;
  const mVar = key.match(/(\d{2})$/);
  const suffixCandidate = mVar ? ` ${mVar[1]}` : '';
  while (usedSet.has(L)) {
    attempt++;
    if (attempt === 1 && suffixCandidate) {
      label = `${base}${suffixCandidate}`;
    } else {
      label = `${base} - v${String(attempt).padStart(2,'0')}`;
    }
    L = norm(label);
  }
  usedSet.add(L);
  return label;
}

async function main() {
  const outJsonPath = 'avatar_labels.generated.json';
  const outSqlPath  = 'avatar_option_labels.sql';

  // Seed used labels from previous runs (if file exists)
  const used = new Set();
  try {
    const prevTxt = await fs.readFile(outJsonPath, 'utf8');
    const prev = JSON.parse(prevTxt);
    for (const r of prev) if (r && r.label) used.add(norm(r.label));
  } catch {/* no previous file is fine */}

  const results = [];
  let stopRequested = false;

  // Write outputs (also used on Ctrl+C)
  async function writeOutputs() {
    await fs.writeFile(outJsonPath, JSON.stringify(results, null, 2), 'utf8');

    let sql = `
create table if not exists public.avatar_option_labels (
  id bigserial primary key,
  option_id text not null,
  value_key text not null,
  label text not null,
  keywords text[] default '{}',
  unique (option_id, value_key)
);
`.trim();

    for (const r of results) {
      const kw = `{${(r.keywords||[]).map(k => `"${String(k).replace(/"/g,'\\"')}"`).join(',')}}`;
      const labelEsc = r.label.replace(/'/g,"''");
      sql += `
insert into public.avatar_option_labels (option_id, value_key, label, keywords)
values ('${r.option_id}', '${r.value_key}', '${labelEsc}', '${kw}')
on conflict (option_id, value_key)
do update set label = excluded.label, keywords = excluded.keywords;`.trim();
    }
    sql += '\n';
    await fs.writeFile(outSqlPath, sql, 'utf8');
  }

  // Graceful Ctrl+C
  process.on('SIGINT', async () => {
    if (stopRequested) process.exit(1);
    stopRequested = true;
    console.log('\nSIGINT received — writing partial outputs…');
    await writeOutputs();
    console.log('Partial outputs written. Exiting.');
    process.exit(1);
  });

  const total = categories.reduce((n,c)=>n+(variants[c]?.length||0),0);
  console.log(`Labeling ${total} variants across: ${categories.join(', ')}`);

  for (const cat of categories) {
    for (const key of variants[cat]) {
      try {
        const img = await pngDataUrl(dicebearPngUrl(cat, key));

        // attempt 1: small avoid list (last 25) to save tokens
        const avoidSmall = Array.from(used).slice(-25).map(x => x.replace(/\b\w/g,m=>m.toUpperCase()));
        let { label, keywords } = await askOpenAI(img, cat, key, avoidSmall);

        // attempt 2: if duplicate, try again with larger avoid list (last 200)
        if (used.has(norm(label))) {
          const avoidFull = Array.from(used).slice(-200).map(x => x.replace(/\b\w/g,m=>m.toUpperCase()));
          const second = await askOpenAI(img, cat, key, avoidFull);
          if (second && second.label) label = second.label;
          if (second && Array.isArray(second.keywords)) keywords = second.keywords;
        }

        // final uniqueness guarantee
        label = forceUniqueLabel(label, cat, key, used);

        results.push({ option_id: `opt-${cat}`, value_key: key, label, keywords: keywords||[] });
        console.log(`OK ${cat}:${key} -> ${label}`);
        await sleep(120);
      } catch (e) {
        console.error(`Failed ${cat}:${key} -> ${e.message}`);
      }
      if (stopRequested) break;
    }
    if (stopRequested) break;
  }

  await writeOutputs();
  console.log(`\nWrote ${results.length} labels to:\n  - ${outJsonPath}\n  - ${outSqlPath}\nNext: pbcopy < ${outSqlPath}  # paste into Supabase.`);
}

main().catch(err => { console.error(err); process.exit(1); });
