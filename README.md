# AasaMedChem — Minimal Quotations & Inventory App

AasaMedChem is a Next.js (App Router) application for managing chemical/pharma products, buyer quotation requests (RFQs), and admin review (approve/reject). It includes product CRUD, unit-aware pricing and quantity handling, a buyer multi-item RFQ cart, and admin quotation actions with notes.

---

## Features
- Admin
	- Product CRUD (create, update, deactivate)
	- View quotations and Approve/Reject with an optional admin note
- Buyer
	- Browse catalog, add multiple items to an RFQ cart
	- Submit multi-item RFQ with an optional note
	- View submitted quotations and status updates
- Auth and APIs
	- JWT-based authentication with middleware
	- Prisma + PostgreSQL for persistence

---

## Tech stack & high-level design
- Frontend: Next.js (App Router) + React + Tailwind CSS
- Backend: Next.js API route handlers (server components) + middleware for auth
- Database: PostgreSQL via Prisma (Neon-compatible adapter used in seed)
- Auth: JWT signed with `jose`, stored as an HTTP-only cookie `medchem_token`

High-level flow
- Client components/pages call server route handlers or submit forms
- Server route handlers use Prisma to read/write the Postgres database
- Middleware verifies JWT and forwards user info via request headers to APIs

---

## Database schema (key models)
See `prisma/schema.prisma` for full definitions. Key tables/fields:

- `User` (users)
	- `id: String` (cuid)
	- `email: String` (unique)
	- `name: String`
	- `passwordHash: String`
	- `role: Enum(Admin|Buyer)`
	- `company`, `phone`: optional

- `Product` (products)
	- `id: String`
	- `name, sku, casNumber, description, category, grade, purity`
	- `dimension: Enum(WEIGHT|VOLUME|COUNT)`
	- `baseUnit: Enum(g|mL|unit)`
	- `pricePerBase: Decimal(15,6)` — price in INR per base unit
	- `stockQty: Decimal(15,4)`, `minOrderQty: Decimal(15,4)`, `reorderLevel: Decimal(15,4)`
	- `isActive: Boolean`, timestamps, `createdById`

- `Quotation` (quotations)
	- `id: String`, `status: Enum(DRAFT,SUBMITTED,APPROVED,REJECTED)`
	- `notes: String?` (buyer note), `adminNote: String?` (admin explanation)
	- `buyerId: String`, timestamps

- `QuotationItem` (quotation_items)
	- `orderedQtyBase: Decimal(15,4)` — normalized to base unit
	- `orderedUnit: String`, `orderedQtyDisplay: Decimal(15,4)`
	- `unitPriceSnap: Decimal(15,6)`, `lineTotal: Decimal(15,2)`

---

## Unit storage and conversion strategy
- Base units stored in DB:
	- WEIGHT → `g` (gram)
	- VOLUME → `mL` (milliliter)
	- COUNT → `unit`
- Conversion factors are implemented in `lib/units.ts`:
	- `g`: 1
	- `kg`: 1000
	- `mL`: 1
	- `L`: 1000
	- `unit`: 1
- Buyer-entered quantities (e.g., `kg`, `L`) are converted to base units for validation and pricing (`toBaseUnit()`), while `orderedQtyDisplay` preserves the requested value.

---

## How prices and quantities are stored
- `pricePerBase`: Decimal(15,6) — INR per base unit (allows precise small-unit pricing)
- `stockQty`, `minOrderQty`, `reorderLevel`, `orderedQtyBase`, `orderedQtyDisplay`: Decimal(15,4) — fractional base units supported
- `lineTotal`: Decimal(15,2) — monetary totals rounded/stored to 2 decimal places
- Calculations: the server computes line totals using base-unit math and formats with two decimal places before storing (see `app/api/buyer/quotations/route.ts`)

---

## Local setup (development)
1. Clone the repo:
```bash
git clone <repo-url>
cd aasamedchem-assignment
```
2. Create `.env` with at least:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=replace_with_strong_random_value
NODE_ENV=development
```
3. Install and prepare:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
4. Open `http://localhost:3000`.

The seed script creates sample users/products (see Test credentials below).

---

## Connect to Neon (Postgres)
- Create a Neon project and copy the `DATABASE_URL`.
- Set `DATABASE_URL` in your environment (local `.env` and production env vars).
- Apply migrations in production with:
```bash
npx prisma migrate deploy
```

---

## Deploy / Re-deploy to Vercel
1. Push repo to GitHub and import into Vercel.
2. In Vercel Project Settings, set env vars: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
3. Vercel will run the build step. Ensure `npx prisma generate` runs during build (it typically does).
4. Run migrations safely (prefer CI step or one-off): `npx prisma migrate deploy` against production DB.

Notes: run migrations and `prisma generate` as controlled steps (CI or manual) rather than automatic in a running production process.

---

## Test credentials (seeded)
The seed script (`prisma/seed.ts`) creates two accounts for testing:
- Admin: `admin@aasamedchem.com` / `admin@123`
- Buyer: `buyer@pharmaco.com` / `buyer@123`

Use these accounts to exercise both admin and buyer experiences.

---

## Quick usage guide
- Admin
	- `/admin/dashboard`: overview
	- `/admin/products`: create/edit/deactivate products
	- `/admin/quotations`: review submitted RFQs; Approve or Reject and optionally add an `adminNote` (useful when rejecting)
- Buyer
	- `/buyer/browse`: browse catalog and add items to the RFQ cart
	- `RFQ cart` (sidebar): adjust items, add a note, submit a multi-item RFQ
	- `/buyer/my-quotations`: view status and admin notes

Typical buyer RFQ flow:
1. Add items from `/buyer/browse` to the cart (multi-item supported).
2. Add an optional note in the cart and `Submit RFQ`.
3. Admin reviews `/admin/quotations` and sets status; buyer sees updates and admin notes.

---

## Where to look in the code
- Pages & APIs: `app/` and `app/api/`
- Components: `components/` (buyer/admin UIs)
- Prisma schema & seed: `prisma/schema.prisma`, `prisma/seed.ts`
- Validation: `lib/validation.ts`
- Units & conversions: `lib/units.ts`

---

If you want, I can add a `Dockerfile`, a GitHub Actions workflow to run migrations, or persist RFQ carts server-side for logged-in buyers. Tell me which you prefer next.
