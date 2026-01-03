# Applying Stripe Migration

Since Prisma migrations require database authentication, here are your options:

## Option 1: Apply SQL Directly in Supabase (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jwngafjfbubjkdhhjfkc/sql
2. Copy the SQL from `supabase/migrations/004_add_stripe_fields.sql`
3. Paste and run it in the SQL Editor
4. Then run: `pnpm prisma generate` to update TypeScript types

## Option 2: Fix Prisma Connection

Your `.env` needs both connection strings:

```env
# Pooled connection (for app runtime)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.jwngafjfbubjkdhhjfkc.supabase.co:5432/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.jwngafjfbubjkdhhjfkc.supabase.co:5432/postgres"
```

**To get these:**
1. Go to Supabase Dashboard → Settings → Database
2. Under "Connection string", select:
   - "Transaction" mode → use for `DATABASE_URL`
   - "Direct connection" → use for `DIRECT_URL`
3. Replace `[YOUR-PASSWORD]` with your actual database password

## Option 3: Use Prisma DB Push (Alternative)

If migrations still fail, you can use `db push` which syncs schema without migrations:

```bash
pnpm prisma db push
```

Then run:
```bash
pnpm prisma generate
```

