#!/bin/bash

# Security verification script
# Checks for exposed sensitive information before committing

echo "=== Security Verification ==="
echo "Checking for exposed sensitive data..."
echo

# Check for service role keys
echo "1. Checking for service role keys..."
SERVICE_ROLE_COUNT=$(grep -r "service_role" . \
  --include="*.js" \
  --include="*.html" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir="node_modules" \
  --exclude-dir=".git" \
  --exclude="*.md" \
  --exclude=".env*" 2>/dev/null | \
  grep -v "// " | \
  grep -v "^[[:space:]]*\*" | \
  wc -l)

if [ "$SERVICE_ROLE_COUNT" -gt 0 ]; then
  echo "   ⚠️  Found $SERVICE_ROLE_COUNT references to service_role (check if they're just comments)"
  grep -r "service_role" . \
    --include="*.js" \
    --include="*.html" \
    --include="*.ts" \
    --exclude-dir="node_modules" \
    --exclude-dir=".git" \
    --exclude="*.md" \
    --exclude=".env*" 2>/dev/null | \
    grep -v "// " | \
    grep -v "^[[:space:]]*\*"
else
  echo "   ✅ No service role references found"
fi

echo
echo "2. Checking for hardcoded JWT tokens..."
JWT_COUNT=$(grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . \
  --include="*.js" \
  --include="*.html" \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  --exclude-dir=".git" \
  --exclude=".env*" 2>/dev/null | wc -l)

if [ "$JWT_COUNT" -gt 0 ]; then
  echo "   ⚠️  Found $JWT_COUNT JWT tokens (verify they're only anon keys)"
  echo "   Checking if they contain 'service_role'..."
  SERVICE_JWT=$(grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . \
    --include="*.js" \
    --include="*.html" \
    --include="*.ts" \
    --exclude-dir="node_modules" \
    --exclude-dir=".git" \
    --exclude=".env*" 2>/dev/null | \
    grep "service_role" | wc -l)

  if [ "$SERVICE_JWT" -gt 0 ]; then
    echo "   ❌ CRITICAL: Found service role JWT tokens in code!"
  else
    echo "   ✅ No service role JWT tokens found (anon keys are OK)"
  fi
else
  echo "   ✅ No JWT tokens found"
fi

echo
echo "3. Checking .gitignore..."
if grep -q "^\.env$" .gitignore; then
  echo "   ✅ .env is in .gitignore"
else
  echo "   ❌ .env is NOT in .gitignore - add it immediately!"
fi

echo
echo "4. Checking for test/utility scripts..."
TEST_SCRIPTS=$(ls -1 2>/dev/null | grep -E "^(test_|fix_|create-|update_|console_)" | wc -l)
if [ "$TEST_SCRIPTS" -gt 0 ]; then
  echo "   ⚠️  Found $TEST_SCRIPTS test/utility scripts - review before committing"
else
  echo "   ✅ No obvious test scripts found"
fi

echo
echo "5. Checking for sensitive file patterns..."
SENSITIVE=$(ls -1 2>/dev/null | grep -E "\.(env|key|pem|crt|p12)$" | grep -v ".env.example" | wc -l)
if [ "$SENSITIVE" -gt 0 ]; then
  echo "   ⚠️  Found potentially sensitive files:"
  ls -1 2>/dev/null | grep -E "\.(env|key|pem|crt|p12)$" | grep -v ".env.example"
else
  echo "   ✅ No sensitive file patterns found"
fi

echo
echo "=== Security Check Complete ==="
echo
echo "Before pushing to GitHub:"
echo "1. Ensure no service role keys are in the code"
echo "2. Verify .env is in .gitignore"
echo "3. Delete or gitignore test scripts"
echo "4. Review the SECURITY.md file"
echo
echo "Admin features requiring service role access should use:"
echo "- Supabase Edge Functions (recommended)"
echo "- Or a secure backend server"