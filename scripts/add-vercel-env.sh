#!/bin/bash
# Script to add environment variables from local .env to Vercel
# Usage: ./scripts/add-vercel-env.sh [production|preview|development]

ENVIRONMENT="${1:-production}"

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

echo "Adding environment variables to Vercel ($ENVIRONMENT environment)..."
echo ""

# Required variables based on src/server/env.ts
REQUIRED_VARS=(
  "VITE_APP_NAME"
  "VITE_APP_EMAIL"
  "VITE_APP_BASE_URL"
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "AUTH_SECRET"
  "DATABASE_URL"
  "REDIS_URL"
  "RESEND_API_KEY"
  "GOOGLE_PLACES_API_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  # Extract value from .env file (handles quoted and unquoted values)
  value=$(grep "^${var}=" .env 2>/dev/null | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/')
  
  if [ -z "$value" ]; then
    echo "⚠️  Warning: $var not found in .env file"
    continue
  fi
  
  echo "Adding $var..."
  echo "$value" | vercel env add "$var" "$ENVIRONMENT" --force 2>&1 | grep -v "Downloading\|Retrieving\|Created\|Updated" || true
done

echo ""
echo "✅ Done! Run 'vercel env ls' to verify all variables were added."

