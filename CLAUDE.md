# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoPrintFarm is a Shopify embedded app that connects Raspberry Pi-based 3D print farms to merchant stores for automatic order synchronization and print-on-demand fulfillment. The app allows merchants to connect multiple Pi devices, which then automatically receive new orders via API polling.

**Current Status**: Early development. OAuth and webhook infrastructure is configured. Device management UI is scaffolded but requires database integration. Webhook handlers for `orders/create` and `orders/updated` need implementation.

## Development Commands

### Core Commands
```bash
npm run dev              # Start Shopify app dev server (starts Cloudflare tunnel, hot reload)
npm run build            # Build production bundle with React Router
npm start                # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking (includes React Router typegen)
```

### Database Commands
```bash
npm run prisma -- migrate dev --name <migration_name>  # Create and apply new migration
npm run prisma -- migrate deploy                       # Apply migrations in production
npm run prisma -- generate                             # Generate Prisma Client
npm run prisma -- studio                               # Open Prisma Studio GUI
```

### Shopify CLI Commands
```bash
npm run config:link      # Link to existing Shopify app configuration
npm run config:use       # Switch between app configurations
npm run deploy           # Deploy app to Shopify
npm run generate         # Generate Shopify app extensions
npm run env              # Manage environment variables
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + React Router v7 (file-based routing)
- **Backend**: Node.js with React Router server-side rendering
- **UI Framework**: Shopify Polaris (via `<s-*>` custom elements in embedded app)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Authentication**:
  - Shopify OAuth for merchants (via `@shopify/shopify-app-react-router`)
  - Custom API keys for Raspberry Pi devices (to be implemented)
- **Deployment**: Render (render.com)

### Key File Patterns

**Route Structure** (`app/routes/`):
- `app._index.tsx` - Main dashboard (shows store info, device count, order count)
- `app.tsx` - App layout wrapper with nav (Dashboard, Devices, Orders)
- `app.devices.tsx` - Device management page (currently mock data)
- `app.additional.tsx` - Orders page (placeholder)
- `auth.$.tsx`, `auth.login/` - OAuth flow handlers
- `webhooks.app.uninstalled.tsx` - Cleanup webhook (deletes sessions)
- `webhooks.app.scopes_update.tsx` - Scopes update webhook

**Note**: Webhook routes for `orders/create` and `orders/updated` are configured in `shopify.app.toml` but handlers are NOT yet implemented.

**Server Modules** (`*.server.ts` files):
- `app/shopify.server.ts` - Shopify API client config, exports `authenticate`, `sessionStorage`
- `app/db.server.ts` - Prisma client singleton (uses global in dev to prevent hot-reload issues)

**React Router v7 Conventions**:
- Loaders: `export const loader = async ({ request }: LoaderFunctionArgs)` - server-side data fetching
- Actions: `export const action = async ({ request }: ActionFunctionArgs)` - server-side mutations
- Error Boundaries: `export function ErrorBoundary()` - uses `boundary.error(useRouteError())`
- Headers: `export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs)` - required for Shopify embedded apps

### Authentication Flow

**Merchant Authentication** (handled by `@shopify/shopify-app-react-router`):
1. User installs app or navigates to app URL
2. OAuth flow initiated via `auth.login/route.tsx`
3. Shopify redirects to callback with auth code
4. Session stored in Prisma database (Session model)
5. Routes under `/app` require `authenticate.admin(request)` in loaders

**Device Authentication** (planned):
- Pi devices will use API key authentication
- Keys stored in database (not yet modeled in Prisma schema)
- Devices poll `/api/orders` endpoint (to be created)

### Shopify API Integration

**API Version**: October 2025 (`ApiVersion.October25` in `shopify.server.ts`)

**GraphQL Admin API**:
- Access via `admin.graphql()` returned from `authenticate.admin(request)`
- Example in `app._index.tsx`: fetches shop info and order count

**Access Scopes** (configured in `shopify.app.toml`):
- `read_orders` - Required for fetching order data
- `read_products` - Required for product information

**Webhooks** (configured in `shopify.app.toml`):
- `app/uninstalled` - Implemented (deletes sessions)
- `app/scopes_update` - Implemented (stub)
- `orders/create` - NOT YET IMPLEMENTED
- `orders/updated` - NOT YET IMPLEMENTED

### Database Schema

Currently minimal (Prisma schema at `prisma/schema.prisma`):
- `Session` model - Stores Shopify OAuth sessions (managed by `@shopify/shopify-app-session-storage-prisma`)

**To be added**:
- `Device` model - Raspberry Pi devices with API keys
- `Order` model - Cached order data for device polling
- `SyncLog` model - Track device sync activity

### UI Components (Shopify Polaris)

The app uses Shopify's embedded app components via custom elements:
- `<s-page>` - Page container
- `<s-section>` - Content sections with optional aside slots
- `<s-stack>` - Flexbox layout (direction: "inline" | "block")
- `<s-box>` - Container with padding, borders
- `<s-text>` - Typography (variants: "heading-lg", "heading-sm", "body-sm")
- `<s-button>` - Buttons (variant: "primary" | "tertiary")
- `<s-badge>` - Status badges
- `<s-app-nav>` - Navigation links

These are NOT standard React components - they're Shopify's web components for embedded apps.

## Development Workflow

### Running Locally
1. `npm run dev` - Starts dev server with Cloudflare tunnel
2. Select Partner organization and development store when prompted
3. Press `p` to open app preview URL in Shopify admin
4. Changes hot-reload automatically

### Adding New Routes
- Create file in `app/routes/` following React Router v7 conventions
- Files under `app/` require authentication - add `authenticate.admin(request)` to loader
- Public API routes go in `routes/api.*.tsx` (use `authenticate.public` or custom auth)

### Adding Webhook Handlers
- Webhook routes must match URI pattern in `shopify.app.toml`
- Export `action` function (POST requests)
- Use `authenticate.webhook(request)` to verify Shopify signature
- Return empty `Response()` on success

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npm run prisma -- migrate dev --name <description>` to create migration
3. Prisma Client auto-regenerates
4. Use `db` (imported from `app/db.server.ts`) for queries

## Important Patterns

### Embedded App Requirements
- All route exports must include `headers` function using `boundary.headers()`
- Error boundaries must use `boundary.error(useRouteError())`
- These ensure Shopify's required headers are included in responses

### Server-Side Only Imports
- Modules ending in `.server.ts` are tree-shaken from client bundles
- Always import `shopify.server.ts` and `db.server.ts` only in loaders/actions

### Environment Variables
- `SHOPIFY_API_KEY` - Auto-populated by Shopify CLI during dev
- `SHOPIFY_API_SECRET` - Auto-populated by Shopify CLI during dev
- `SHOPIFY_APP_URL` - App URL (Cloudflare tunnel in dev)
- `SCOPES` - Comma-separated OAuth scopes
- `DATABASE_URL` - Not used (SQLite file path in `schema.prisma` for dev)

## Deployment

The app is configured to deploy on **Render** (render.com), one of the platforms with official Shopify deployment guides.

**Why Render:**
- Free tier for development and testing
- Managed PostgreSQL with automatic backups and high availability
- Native support for background workers and cron jobs (useful for device polling)
- Automatic preview environments for pull requests
- Official MCP (Model Context Protocol) server for AI-assisted development
- Simpler setup compared to alternatives (no complex infrastructure management)

**Deployment Steps** (when ready):
1. Configure Render service via dashboard or `render.yaml`
2. Set environment variables (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, etc.)
3. Provision PostgreSQL database on Render
4. Update `DATABASE_URL` in environment variables
5. Run `npm run prisma -- migrate deploy` on first deploy
6. Update Shopify app configuration with production URL

## Next Steps (Per README.md)

The following features are planned but not yet implemented:
1. **PostgreSQL integration on Render** - Replace SQLite with Render's managed PostgreSQL
2. **Device management backend** - Create Device model, API key generation
3. **Webhook handlers** - Implement `orders/create` and `orders/updated` handlers
4. **API endpoints for Pi devices** - Build authenticated polling endpoints
5. **Update Pi software** - AutoPrintFarm Pi client to poll for orders

## Related Documentation

- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [React Router v7 Docs](https://reactrouter.com/en/main)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Prisma Docs](https://www.prisma.io/docs)
