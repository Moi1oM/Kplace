## 1. Frequently Used Commands
```bash
# General
pnpm install
pnpm run dev
pnpm run build

# Prisma (DB)
npx prisma generate
npx prisma migrate dev --name <migration-name>
npx prisma studio

# Vercel
vercel dev
vercel
vercel --prod
```
## 2. Core Files & Utilities
prisma/schema.prisma: Single source of truth for the database schema.
lib/db.ts: Singleton Prisma Client instance.
lib/utils.ts: Global utilities, including cn() for Tailwind classes.
components/Map.tsx: Main client component for Naver Maps.
components/ui/: UI components from shadcn/ui.
middleware.ts: Core authentication logic using Clerk.
## 3. Code Style Guidelines
Language: TypeScript (Strict Mode)
Formatting: Enforced by ESLint & Prettier.
Components: Functional components with Hooks. Props are typed.
Naming: PascalCase for components, kebab-case for routes.
Imports: Use absolute paths (@/components/...).
Styling: Tailwind CSS utility classes only. Use cn() for conditional classes.
## 4. Testing Guideline
Unit/Component: Jest + React Testing Library.
E2E: Playwright.
Focus: Test critical user flows (e.g., login, core interactions) and complex utility functions. Mock all external APIs (Clerk, Naver Maps).
## 5. Repository Etiquette
Branches:
main: Production.
develop: Main development branch.
feature/<description>: New features.
Commits: Use Conventional Commits (feat:, fix:, chore:).
Pull Requests (PRs):
Target develop from feature/*.
Must pass all CI checks.
Use Squash and Merge.
## 6. Developer Environment
Node.js: Use nvm (see .nvmrc for version).
Env Vars: Create .env.local from .env.example.
코드 스니펫
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
VS Code Extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense.
## 7. Project Caveats
Naver Maps: Must be used in a 'use client' component.
Prisma & Supabase: NEVER edit the DB schema via the Supabase UI. Use prisma migrate only.
Clerk: Authentication is managed in middleware.ts. Be careful when changing route rules.
## 8. Preferred Libraries
UI: shadcn/ui
State: Zustand for global state, React Hooks for local.
Data Fetching: TanStack Query (React Query) for client-side.
Forms: React Hook Form + Zod.
Utils: clsx, tailwind-merge, date-fns.
## 9. Architecture
Framework: Next.js (App Router).
Auth: Clerk (handles all user management and sessions).
Database: Supabase Postgres.
ORM: Prisma (the only way to interact with the database).
Deployment: Vercel (CI/CD from GitHub).
- If you are using libary / external APIs you must search on the web and find docs and ensure that use existing and not deprecated functions