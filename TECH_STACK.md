# MyCEO Platform - Tech Stack

A comprehensive overview of the technologies and frameworks used to build the MyCEO LMS Platform.

---

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | Core UI library |
| **TypeScript** | 5.3 | Static typing & type safety |
| **Vite** | 5.0 | Build tool & development server |
| **React Router DOM** | 6.21 | Client-side routing |
| **TailwindCSS** | 3.4 | Utility-first CSS framework |

### UI Components & Libraries

| Library | Purpose |
|---------|---------|
| **Radix UI** | Headless, accessible UI primitives (Dialog, Dropdown, Select, Tabs, Toast) |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization & charts |
| **dnd-kit** | Drag and drop functionality |
| **clsx / tailwind-merge** | Conditional class utilities |

### State Management & Data Fetching

| Library | Purpose |
|---------|---------|
| **Zustand** | Client-side state management |
| **TanStack React Query** | Server state management & caching |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

---

## Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service (Authentication, Database, Edge Functions, Storage) |
| **PostgreSQL** | Relational database (via Supabase) |

---

## Payments

| Technology | Purpose |
|------------|---------|
| **Stripe** | Payment processing & subscriptions |

---

## Deployment & Hosting

| Technology | Purpose |
|------------|---------|
| **Vercel** | Frontend deployment & hosting |
| **Vercel Speed Insights** | Performance monitoring |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager (monorepo workspaces) |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Vitest** | Unit testing framework |
| **Testing Library** | React component testing |

---

## Architecture

- **Monorepo** structure using pnpm workspaces
  - `apps/web` - Main web application
  - `packages/` - Shared packages
  - `supabase/` - Database migrations & edge functions
- **SSO Integration** for cross-application authentication
- **Role-based access control** (Parent, Child, Admin)

---

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0
