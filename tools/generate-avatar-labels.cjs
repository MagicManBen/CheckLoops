/* tools/generate-avatar-labels.cjs  — eyes-only test friendly
   Examples:
     node tools/generate-avatar-labels.cjs -m gpt-4o-mini eyes
*/
const fs = require('node:fs/promises');

const argv = process.argv.slice(2);
function readFlag(name, alias) {
  const iLong = argv.indexOf(`--${name}`);
  if (iLong !== -1 && argv[iLong + 1]) return argv[iLong + 1];
  const iShort = alias ? argv.indexOf(`-${alias}`) : -1;
  if (iShort !== -1 && argv[iShort + 1]) return argv[iShort + 1];
  return null;
}

const requested = argv.filter(a => !a.startsWith('-'));
const model = readFlag('model','m') || process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_API_KEY) { console.error('ERROR: OPENAI_API_KEY is required'); process.exit(1); }
console.log(`Model: ${model}`);

// Minimal sets; you can add more later
const variants = {
  eyes: Array.from({ length: 26 }, (_, i) => `variant${String(i+1).padStart(2,'0')}`),
};
const allowed = Object.keys(variants);

// Default to eyes if none specified
const categories = requested.length ? requested : ['eyes'];
for (const c of categories) {
  if (!allowed.includes(c)) {
    console.error(`Unknown category: ${c}. Allowed: ${allowed.join(', ')}`);
    process.exit(1);
  }
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
  u.searchParams.set('glassesProbability','0');
  u.searchParams.set('earringsProbability','0');
  u.searchParams.set('featuresProbability','0');
  u.searchParams.set('hairProbability','0'); // avoid occluding eyes
  // target part
  u.searchParams.set(category, key);
  return u.toString();
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function fallbackLabel(category, key) {
  const m = key.match(/^variant(\d{2})$/);
  return m ? `${cap(category)} Style ${Number(m[1])}` : `${cap(category)} ${key}`;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pngDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DiceBear ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function askOpenAI(imageDataUrl, category, key) {
  const sys = 'You are labeling avatar parts. Reply ONLY valid JSON: {"label":"2-3 words","keywords":["k1","k2"]}';
  const userText = `Name this ${category} option '${key}' in 2-3 concise words.`;

  const body = {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ],
    temperature: 0.2,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
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

async function main() {
  const outJsonPath = 'avatar_labels.generated.json';
  const outSqlPath = 'avatar_option_labels.sql';
  const total = categories.reduce((n,c)=>n+(variants[c]?.length||0),0);
  console.log(`Labeling ${total} variants across: ${categories.join(', ')}`);

  const results = [];
  for (const cat of categories) {
    for (const key of variants[cat]) {
      try {
        const img = await pngDataUrl(dicebearPngUrl(cat, key));
        const { label, keywords } = await askOpenAI(img, cat, key);
        results.push({ option_id: `opt-${cat}`, value_key: key, label, keywords });
        console.log(`OK ${cat}:${key} -> ${label}`);
        await sleep(150);
      } catch (e) {
        console.error(`Failed ${cat}:${key} -> ${e.message}`);
      }
    }
  }

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
    const kw = `{${r.keywords.map(k => `"${String(k).replace(/"/g,'\\"')}"`).join(',')}}`;
    const labelEsc = r.label.replace(/'/g,"''");
    sql += `
insert into public.avatar_option_labels (option_id, value_key, label, keywords)
values ('${r.option_id}', '${r.value_key}', '${labelEsc}', '${kw}')
on conflict (option_id, value_key)
do update set label = excluded.label, keywords = excluded.keywords;`.trim();
  }
  sql += '\n';
  await fs.writeFile(outSqlPath, sql, 'utf8');

  console.log(`\nWrote ${results.length} labels to:\n  - ${outJsonPath}\n  - ${outSqlPath}\nNext: pbcopy < ${outSqlPath}  # then paste into Supabase SQL editor and Run.`);
}

main().catch(err => { console.error(err); process.exit(1); });
