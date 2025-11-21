# MyCEO LMS Platform

A parent-focused LMS subscription platform where parents subscribe via Stripe, add children, and track learning progress. Children access content via unique codes, complete modules, build virtual companies, and earn achievements.

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Payment**: Stripe (Checkout + Webhooks)
- **Structure**: Monorepo with pnpm workspaces

## Project Structure

```
myceo/
├── apps/
│   └── web/              # React frontend app
├── packages/
│   └── shared/          # Shared types and utilities
├── supabase/            # Supabase migrations and functions
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account (cloud dashboard)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up Supabase project:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or use an existing one
   - Navigate to Settings → API to get your project URL and anon key

3. Set up environment variables:
   - Create a `.env` file in `apps/web/` directory
   - Add the following variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (optional, for Stripe integration)
   ```
   - Replace with your actual values from Supabase Dashboard (Settings → API)
   - See [docs/stripe-setup.md](./docs/stripe-setup.md) for Stripe configuration

4. Run database migrations:
   - In Supabase Dashboard, go to SQL Editor
   - Run the migration files from `supabase/migrations/` in order:
     - `20240101000000_initial_schema.sql`
     - `20240101000001_rls_policies.sql`
     - `20240101000002_functions.sql`
   - Or use Supabase CLI (optional): `pnpm supabase:migrate` (requires linking to cloud project)

5. Deploy Edge Functions (if needed):
   - In Supabase Dashboard, go to Edge Functions
   - Deploy functions from `supabase/functions/` directory
   - For Stripe integration, see [docs/stripe-setup.md](./docs/stripe-setup.md)

6. Start the development server:
```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run tests
- `pnpm supabase:migrate` - Run database migrations (requires Supabase CLI and linked project)

## Development

See [docs/context.md](./docs/context.md) for detailed feature specifications and [lms-full-implementation-plan.plan.md](./lms-full-implementation-plan.plan.md) for the implementation plan.

## Stripe Integration

For setting up Stripe payments and subscriptions, see [docs/stripe-setup.md](./docs/stripe-setup.md).

## License

Private - All rights reserved



