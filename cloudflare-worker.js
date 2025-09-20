addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Redirect HTTP to HTTPS
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return Response.redirect(url.toString(), 301)
  }

  // Fetch the original response
  const response = await fetch(request)

  // Create a new response with security headers
  const newHeaders = new Headers(response.headers)

  // Content Security Policy - permissive to work with existing inline scripts
  const csp = [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Permissive for compatibility
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",  // Allow all HTTPS images
    "connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')

  // Set security headers
  newHeaders.set('Content-Security-Policy', csp)
  newHeaders.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')  // 2 years
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('X-Frame-Options', 'DENY')
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newHeaders.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()')
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')
  newHeaders.set('Cross-Origin-Resource-Policy', 'same-origin')

  // Cache control for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

/*
DEPLOYMENT INSTRUCTIONS FOR CLOUDFLARE:

1. Log in to your Cloudflare dashboard
2. Go to Workers & Pages
3. Create a new Worker
4. Copy this entire script into the Worker editor
5. Save and deploy the Worker
6. In your domain settings, add a Worker Route:
   - Route: checkloops.co.uk/*
   - Worker: [your-worker-name]
7. Also add route for www if needed: www.checkloops.co.uk/*
8. In SSL/TLS settings, enable "Always Use HTTPS"

NOTE: After deploying, the temporary 'unsafe-inline' and 'unsafe-eval' in script-src
should be removed once all inline scripts are eliminated. The final CSP should be:
script-src 'self' https://*.supabase.co;
*/