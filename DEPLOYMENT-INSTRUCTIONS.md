# NHS GP Practice Dropdown - Production Deployment

## ✅ Current Status

The NHS GP practice dropdown is now configured to fetch **REAL NHS data** directly from the NHS ORD API.

## What's Working

1. **Direct NHS ORD API Access**
   - Successfully fetches GP practices using `Roles=RO177` parameter
   - Returns real NHS GP practice data (e.g., "THE DENSHAM SURGERY - A81001")
   - NO mock/placeholder data

2. **Multi-Layer Fallback System**
   ```
   1. Supabase cache (if configured)
   2. Local proxy server (if running)
   3. Direct NHS ORD API
   ```

3. **Tested & Verified Endpoints**
   - Working: `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Status=Active&Roles=RO177&Limit=100&_format=json`
   - Returns: Real GP practices with ODS codes

## For Production Deployment

### Option 1: Direct Browser Access (May Hit CORS)
Current setup attempts direct API access. If CORS blocks:

### Option 2: Run Local Proxy Server
```bash
# Already configured in nhs-proxy-server.mjs
node nhs-proxy-server.mjs

# Server runs on http://localhost:3456
# Endpoints:
# - /api/nhs/organisations
# - /api/nhs/all-gp-practices
```

### Option 3: Supabase Setup (Recommended for Production)
```sql
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS gp_practices_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ods_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(200),
  postcode VARCHAR(20),
  phone VARCHAR(50),
  status VARCHAR(50),
  primary_role VARCHAR(100),
  last_updated TIMESTAMP DEFAULT NOW(),
  raw_data JSONB
);

CREATE INDEX idx_gp_practices_ods_code ON gp_practices_cache(ods_code);
CREATE INDEX idx_gp_practices_name ON gp_practices_cache(name);
CREATE INDEX idx_gp_practices_postcode ON gp_practices_cache(postcode);

GRANT SELECT ON gp_practices_cache TO anon;
GRANT SELECT ON gp_practices_cache TO authenticated;
```

Then run:
```bash
node setup-gp-practices.mjs
```

## What You'll See

When clicking the dropdown:
1. **Loading state**: "Loading NHS GP practices..."
2. **Success**: Dropdown fills with real GP practices
   - Format: "THE DENSHAM SURGERY (A81001)"
   - Searchable by name or ODS code
3. **On selection**:
   - Stores ODS code in `window.ctx.site_id`
   - Fires `checkloops:siteSelected` event

## Verified NHS Data Examples

```
THE DENSHAM SURGERY - A81001
QUEENS PARK MEDICAL CENTRE - A81002
ACKLAM MEDICAL CENTRE - A81004
SPRINGWOOD SURGERY - A81005
TENNANT STREET MEDICAL PRACTICE - A81006
```

## Testing in Browser Console

```javascript
// Check if data loads
window.populateORDSites()

// Check selected value
console.log(window.ctx.site_id)

// Listen for selection events
document.addEventListener('checkloops:siteSelected', e => {
  console.log('Selected:', e.detail.ods)
})
```

## Important Notes

⚠️ **NO MOCK DATA** - The system now only uses real NHS data
✅ **API Parameters**: Uses `Roles=RO177` which returns GP practices
✅ **Format Required**: Must include `_format=json` in API calls
✅ **Real ODS Codes**: All codes are genuine NHS Organisation Data Service codes