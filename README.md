# DineQR Frontend

Mobile-first restaurant QR code ordering system frontend built with React, TypeScript, and Tailwind CSS.

## Features

- **Customer UI** (Mobile-first)
  - QR code-based table menu access
  - Browse menu by categories
  - Add items to cart with special instructions
  - Real-time order status tracking
  - No login required

- **Admin UI** (Responsive)
  - Table & QR code management
  - Menu items & categories CRUD
  - Real-time orders dashboard (Kanban-style)
  - Bill generation & payment tracking
  - Sound notifications for new orders

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **State Management**: React Context
- **Real-time**: WebSockets
- **Package Manager**: Bun

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── admin/
│   │       └── AdminLayout.tsx     # Responsive admin layout
│   ├── hooks/
│   │   └── useWebSocket.ts         # WebSocket hook
│   ├── pages/
│   │   ├── MenuPage.tsx            # Customer menu
│   │   ├── CartPage.tsx            # Customer cart
│   │   ├── OrdersPage.tsx          # Customer order tracking
│   │   └── admin/
│   │       ├── TablesPage.tsx      # Table & QR management
│   │       ├── MenuManagementPage.tsx
│   │       ├── OrdersDashboard.tsx
│   │       └── BillingPage.tsx
│   ├── services/
│   │   └── api.ts                  # API client
│   ├── stores/
│   │   ├── CartContext.tsx         # Cart state
│   │   └── SessionContext.tsx      # Session state
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── vite.config.ts
└── package.json
```

## Routes

### Customer Routes

| Route                    | Description                     |
| ------------------------ | ------------------------------- |
| `/menu?table={qr_token}` | Menu page (QR code entry point) |
| `/cart`                  | Shopping cart                   |
| `/orders`                | Order status tracking           |

### Admin Routes

| Route            | Description                   |
| ---------------- | ----------------------------- |
| `/admin`         | Redirects to orders dashboard |
| `/admin/tables`  | Table & QR code management    |
| `/admin/menu`    | Menu items & categories       |
| `/admin/billing` | Bill generation & payments    |

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Backend API running at `http://localhost:8000`

### Installation

1. Install dependencies:

   ```bash
   cd frontend
   bun install
   ```

2. Configure environment:

   ```bash
   # .env file
   VITE_API_URL=http://localhost:8000
   ```

3. Start development server:
   ```bash
   bun run dev
   ```

## Build

```bash
bun run build
```

## Notes

- Prices are displayed in Indian Rupees (₹)
- Customer UI is optimized for mobile with safe area padding for notched devices
- Admin UI is responsive with collapsible sidebar on desktop and bottom navigation on mobile
- Backend returns Decimal fields as strings - they are converted to numbers in the API service
- QR codes are returned as base64 strings and converted to data URLs for display/download
