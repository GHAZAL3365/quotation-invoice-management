# Ultrakey Invoice Management System

A full-stack application for managing clients, quotations, invoices, and payments. Administrators manage business records; client users can view their own invoices and quotations.

## Features

- Admin dashboard with invoice, quotation, payment, and client summaries
- Client dashboard with the client's own invoices, quotations, and outstanding balance
- Create and manage clients, quotations, and invoices (admin)
- View, print, and download invoice and quotation documents
- Record and review invoice payments (admin)
- Login, client registration, role-based access, and protected API routes
- MongoDB persistence, with a seeded in-memory demo mode when MongoDB is not configured

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose (optional for local demo mode)

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MongoDB, if you want persistent data

## Getting started

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create the server environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.

   Set `JWT_SECRET` to a private value at least 32 characters long. To use MongoDB, set `MONGODB_URI` to your connection string. If it is blank, the server uses temporary in-memory demo data.

3. Create `client/.env` with the API address:

   ```env
   VITE_API_BASE_URL=http://localhost:3365/api/v1
   ```

4. Start the backend and frontend in separate terminals from the project root:

   ```bash
   npm run dev --workspace=server
   ```

   ```bash
   npm run dev --workspace=client
   ```

   The API runs at `http://localhost:3365`; Vite prints the frontend URL in its terminal (usually `http://localhost:5173`).

### Demo accounts

When MongoDB is not configured, the in-memory demo store provides:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Client | `client@example.com` | `client123` |

Demo data is temporary and is recreated when the server restarts. Do not use demo credentials in a deployed environment.

### Create an admin account for MongoDB

Set `MONGODB_URI`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`, then run:

```bash
npm run create-admin --workspace=server
```

The password must be 8–72 bytes. This command creates an admin in MongoDB and will not overwrite an existing account.

## Useful commands

Run these from the project root:

| Command | Description |
|---|---|
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the server; serves `client/dist` when it exists |
| `npm run dev --workspace=client` | Start the Vite development server |
| `npm run dev --workspace=server` | Start the API with automatic restarts |
| `npm run lint --workspace=client` | Lint the frontend |

## API

All API routes are prefixed with `/api/v1`:

- `/auth` — registration, login, logout, and current session
- `/clients` — client records
- `/invoices` — invoices and invoice PDFs
- `/quotations` — quotations and quotation PDFs
- `/payments` — payment records
- `/settings` — business settings
- `/health` — service health

Client access to invoices and quotations is scoped to the client record whose email matches the signed-in account. Administrative actions require an admin account.
