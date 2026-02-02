# Vitamin & Supplement Tracker

A web application for tracking daily vitamins and supplements, with automatic ingredient and dosage fetching from product identifiers.

## Features

- **Dashboard** - Daily nutrient summary with interactive charts showing % of Daily Value
- **UPC Lookup** - Add supplements by scanning or entering barcode numbers (powered by Open Food Facts API)
- **Multi-User Support** - Track intake separately for multiple household members
- **Nutrient Aggregation** - Automatic calculation of total daily intake across all supplements
- **Historical View** - Browse past intake with customizable date ranges (7/14/30 days)
- **Insights & Feedback** - Informational alerts for:
  - Nutrients exceeding upper intake levels
  - Potential deficiencies in key nutrients
  - Redundancies (same nutrient from multiple sources)
- **Product Management** - View saved products, nutrient details, and export to CSV
- **RDI Calculations** - Compare intake against FDA Reference Daily Intake values

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **API**: Open Food Facts (free, no API key required)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bcole88888/vitamins.git
   cd vitamins
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with default users |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Project Structure

```
vitamins/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script for default users
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── add/page.tsx       # Add supplement
│   │   ├── history/page.tsx   # Historical view
│   │   ├── products/page.tsx  # Product management
│   │   ├── insights/page.tsx  # Insights & feedback
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities & API clients
│   └── types/                 # TypeScript types
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List all users |
| `/api/products` | GET, POST, DELETE | Product CRUD |
| `/api/intake` | GET, POST, DELETE | Intake logging |
| `/api/lookup/[upc]` | GET | Lookup product by UPC |
| `/api/nutrients` | GET | Aggregated nutrient data |

## Data Model

- **Users** - Household members tracking supplements
- **Products** - Supplements with UPC, brand, serving info
- **Nutrients** - Per-product nutrient data (name, amount, unit)
- **IntakeLogs** - Daily intake records (user, product, quantity, date)

## Adding Supplements

1. **By UPC**: Enter the barcode number on the "Add Supplement" page
2. **By Search**: Search Open Food Facts database by product name
3. **Quick Add**: Re-log previously added products with one click

## Disclaimer

This application is for **informational purposes only** and does not constitute medical advice. Nutrient data is sourced from third-party databases and may not be complete or accurate. Always consult with a healthcare provider before making changes to your supplement regimen.

## License

MIT
