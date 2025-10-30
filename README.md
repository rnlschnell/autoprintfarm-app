# AutoPrintFarm Shopify App

Shopify app to connect Raspberry Pi-based 3D print farms to merchant stores, enabling automatic order synchronization for print-on-demand fulfillment.

## Overview

This app allows merchants running 3D printing businesses to:
- Install the app in their Shopify store
- Connect one or more Raspberry Pi print farm devices
- Automatically receive new orders on their Pi devices
- Manage device access and monitor order sync status

## Tech Stack

- **Frontend:** React + React Router + Shopify Polaris
- **Backend:** Node.js + Shopify API
- **Database:** SQLite (development), PostgreSQL (production - planned)
- **Authentication:** OAuth 2.0 (Shopify) + Custom API keys (Pi devices)
- **Hosting:** Vercel/Railway (planned)

## Current Status

- ✅ App scaffolded with React Router template
- ✅ OAuth configured with Shopify
- ✅ Access scopes set: `read_orders`, `read_products`
- ✅ Webhook subscriptions configured: `orders/create`, `orders/updated`
- ✅ Embedded in Shopify admin
- ✅ Git initialized
- 🔄 TODO: Add Supabase/PostgreSQL integration
- 🔄 TODO: Build device management UI
- 🔄 TODO: Implement webhook handlers for orders
- 🔄 TODO: Create API endpoints for Pi devices
- 🔄 TODO: Update AutoPrintFarm Pi software to poll orders

## Prerequisites

Before you begin, you'll need:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) (v18 or higher)
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup)
3. **Development Store**: Set up a [development store](https://help.shopify.com/en/partners/dashboard/development-stores) for testing
4. **Shopify CLI**: Already installed globally

## Local Development

### Install Dependencies

```bash
cd autoprintfarm
npm install
```

### Start Development Server

```bash
npm run dev
```

This will:
- Start the local development server
- Create a Cloudflare tunnel for HTTPS access
- Prompt you to select your Partner organization and dev store
- Open the app installation URL in your browser

Press `p` in the terminal to open the app preview URL.

### Development Workflow

1. Make changes to files in `app/routes/` for pages and API endpoints
2. Changes are hot-reloaded automatically
3. Test in your development store's Shopify admin (Apps menu)

## Project Structure

```
autoprintfarm/
├── app/
│   ├── routes/
│   │   ├── app._index.jsx              # Main dashboard
│   │   ├── app.additional.jsx          # Additional page example
│   │   └── webhooks/                   # Webhook handlers
│   ├── shopify.server.js               # Shopify API configuration
│   └── root.jsx                        # App root component
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Database migrations
├── public/                             # Static assets
├── extensions/                         # Shopify extensions (if any)
├── .env                                # Environment variables (not in git)
├── .gitignore                          # Git ignore rules
├── shopify.app.toml                    # App configuration
├── package.json                        # Dependencies
└── README.md                           # This file
```

## Configuration

### Access Scopes

The app requests the following permissions:
- `read_orders` - Read order data from merchant's store
- `read_products` - Read product information

### Webhooks

The app subscribes to:
- `orders/create` - Notified when new orders are created
- `orders/updated` - Notified when orders are updated
- `app/uninstalled` - Cleanup when merchant uninstalls

## Environment Variables

Create a `.env` file (already in `.gitignore`):

```env
# Shopify (auto-populated by CLI during dev)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Future: Add Supabase or PostgreSQL connection
# DATABASE_URL=

# Future: Encryption key for sensitive data
# ENCRYPTION_KEY=
```

## Deployment

*Deployment guide will be added after Supabase integration and production setup*

## Architecture (Planned)

```
Merchant's Shopify Store
         ↓ (OAuth + Webhooks)
AutoPrintFarm Shopify App (Embedded UI + API)
         ↓ (Custom API Keys)
Raspberry Pi Devices (AutoPrintFarm Software)
```

## Resources

- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [React Router Docs](https://reactrouter.com/en/main)
- [Shopify Polaris Components](https://polaris.shopify.com/)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)

## License

MIT

## Support

For issues or questions, contact: [your-email@example.com]
