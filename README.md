# GM CRM

A lightweight multi-industry CRM portal builder for HR teams, gyms, schools, and restaurants.

## What Works

- Parent dashboard to create multiple business dashboards
- Industry templates for HR, Gym, School, and Restaurant
- Business-level branding, package, hosting mode, and domain
- Admin and client/member/customer/employee portal modes
- Industry-specific modules, records, statuses, and notification logs
- Postgres-ready database API with local browser fallback when no database is configured

## Database Setup

1. Create a Postgres database.

   Recommended lightweight managed options:
   - Neon
   - Supabase
   - Railway Postgres
   - Render Postgres

2. Copy `.env.example` to `.env`.

3. Set `DATABASE_URL`.

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/gmcrm?schema=public"
   ```

   For production/serverless hosting, use a pooled Postgres connection string when your provider offers one.

4. Generate Prisma client.

   ```bash
   npm run db:generate
   ```

5. Push schema to the database.

   ```bash
   npm run db:push
   ```

6. Start the app.

   ```bash
   npm run dev
   ```

Open `http://127.0.0.1:3000`.

## Storage Behavior

- If `DATABASE_URL` is configured and reachable, dashboards save to Postgres.
- If no database is configured, the app falls back to browser local storage for demo use.
- The header shows `Postgres`, `Syncing`, or `Local demo` so you know where data is saving.

## Architecture

The MVP uses a hybrid scalable model:

- `Business` table stores one row per business dashboard.
- `records` JSON stores industry module records.
- `notifications` JSON stores lightweight notification history.
- Indexed fields: `industryKey`, `domain`, `updatedAt`.

This keeps the first version fast to build and easy to sell. As usage grows, high-volume modules can be split into normalized tables without changing the product concept.

Recommended scaling path:

- Add authentication and tenant membership tables.
- Add subscription and billing tables.
- Move high-volume records into module tables when needed.
- Add background jobs for WhatsApp/SMS/email sending.
- Use object storage for uploaded documents.
- Add rate limits and audit logs before public launch.
- Use pooled Postgres connections in production.

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:push
npm run db:studio
```
