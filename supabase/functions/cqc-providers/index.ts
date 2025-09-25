// CQC proxy with JWT ON= default (Authorization by an official Supabase JWT)
// We'll pass the Anon key as Bearer in tests/curls. From the database, we use the service key.
// *IF* you want to hardcode the CQC key, replace CCC_API_KEY!

Deno.serve(async (req) => {
  const inUrl = new URL(req.url);
  const path = inUrl.pathname.replace(/^\/cqc-providers/, '') || '/providers';
  const target = `https://api.cqc.org.uk/public/v1${path}${inUrl.search}`;

  const headers = new Headers({
    'Accept': 'application/json',
    'User-Agent': 'CheckLoops/1.0 (+info@checkloops.co.uk)',
    'Ocp-Apim-Subscription-Key': '5b91c30763b4466e89727c0c555e47a6'
  });

  const r = await fetch(target, { headers });
  const body = await r.text();

  return new Response(body, {
    status: r.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
});
