# HabilitFy - System Context for External Analysis

This document contains the detailed system configuration, file structure, and key source code for the HabilitFy project. It is intended to be used as context for an AI assistant (like Claude) to diagnose MySQL connection issues.

## 1. Project Overview
- **Stack:** Node.js, Express, React, Vite, TypeScript, Drizzle ORM, MySQL.
- **Problem:** Database connection issue after migrating from PostgreSQL to MySQL on Hostinger. Application does not load data even though DB is accessible via phpMyAdmin.

## 2. Configuration Files

### `package.json`
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev:client": "vite dev --port 5000",
    "dev": "NODE_ENV=development TMPDIR=./tmp_tsx tsx --env-file=.env server/index.ts",
    "postinstall": "chmod +x node_modules/.bin/esbuild node_modules/esbuild/bin/esbuild node_modules/@esbuild/*/bin/esbuild 2>/dev/null; exit 0",
    "build": "node script/build.cjs",
    "start": "node server.cjs",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "seed:auth": "tsx --env-file=.env script/seed-auth-users.ts",
    "seed:full": "tsx --env-file=.env script/reset_and_seed_comprehensive.ts",
    "test": "vitest run && playwright test",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "drizzle-orm": "^0.39.3",
    "mysql2": "^3.16.2",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "express-mysql-session": "^3.0.3",
    "passport": "^0.7.0",
    "vite": "^5.4.11",
    "typescript": "5.6.3"
    // ... items abbreviated for brevity, mysql2 and drizzle-orm are present
  }
}
```

### `tsconfig.json`
```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "module": "ESNext",
    "target": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### `drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: ["./shared/schema.ts", "./shared/kyc-schema.ts"],
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ... plugins setup

export default defineConfig({
  // ... plugins
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
```

### `.env` (Sanitized)
```ini
# Database (CRITICAL: User reports mismatch here)
# Current file has: mysql://habilitfy:habilitfy123@localhost:3306/habilitfy
# User provided: mysql://u540864618_guimp:[PASSWORD]@127.0.0.1:3306/u540864618_hbitfy
DATABASE_URL=mysql://habilitfy:habilitfy123@localhost:3306/habilitfy

NODE_ENV=development
PORT=5000
HOST=0.0.0.0
AUTH_MODE=local
```

## 3. Database Layer

### `server/db.ts`
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

console.log("DB: Attempting to create MySQL pool...");

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });
console.log("DB: Drizzle ORM initialized");
```

### `shared/schema.ts` (Summary)
- Defines `users`, `bookings`, `instructors`, `vehicles`, `reviews`, `transactions` tables.
- Uses `mysqlTable` from `drizzle-orm/mysql-core`.
- IDs are `varchar(36)` (UUIDs).
- Booleans are `boolean()` (mapped to tinyint in MySQL).
- Timestamps used for dates.

## 4. Server Core

### `server/index.ts`
- Sets up Express app.
- Registers routes via `registerRoutes(app, httpServer)`.
- Starts server on process.env.PORT or 3000.
- Uses `tsx --env-file=.env` in dev mode.

### `server/routes.ts`
- Imports `db` from `./db`.
- Imports `storage` from `./storage`.
- Registers API routes `/api/users`, `/api/auth`, etc.
- **Key Observation:** Has `requestCount` and `errorCount` metrics.
- Uses `storage.getUser` and other storage methods for data access.

### `server/storage.ts`
- Implements `IStorage` interface backed by `DatabaseStorage` class.
- Methods like `getUser`, `createBooking` directly call `db.select().from(...)`.
- Example:
  ```typescript
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  ```

### `server/auth.ts`
- Sets up Passport.js with Local and Google strategies.
- Uses `express-mysql-session` for session storage (creates `sessions` table).
- Parses `DATABASE_URL` manually to configure session store.

## 5. Frontend Entry

### `client/src/App.tsx`
- Wraps app in `QueryClientProvider` and `ThemeProvider`.
- Uses `wouter` for routing.
- Routes to `/dashboard/...` and `/admin`.

## 6. Diagnosis Notes for Claude
- **Credential Mismatch:** The `.env` file uses `habilitfy` user, but the user provided Hostinger credentials (`u540864618_guimp`). This is the #1 suspect.
- **Connection Code:** The code in `server/db.ts` correctly uses `mysql2` and `drizzle-orm/mysql2`.
- **Schema:** Schema uses `mysqlTable` and correct types for MySQL.
- **Session Store:** `server/auth.ts` attempts to parse `DATABASE_URL` to set up `MySQLStore`. If `DATABASE_URL` is wrong, sessions won't work, login will fail.
