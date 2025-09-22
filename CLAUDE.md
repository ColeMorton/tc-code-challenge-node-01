# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Setup
```bash
npx prisma generate    # Generate Prisma client
npx prisma db push     # Sync database with schema
npm run db:seed        # Seed database with sample data
```

### Development
```bash
npm run dev            # Start development server with Turbopack (http://localhost:3000)
npm run build          # Production build with Turbopack
npm run start          # Start production server
npm run lint           # Run ESLint
```

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Path Aliases**: `@/*` maps to project root

### Database Schema
The project uses Prisma with three main models:

- **User**: Has id, name, email, and can have multiple bills assigned
- **BillStage**: Defines bill workflow stages (Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid)
- **Bill**: Contains bill_reference, dates, stage, and assigned user

Key relationships:
- Bills are assigned to Users (many-to-one)
- Bills have a BillStage (many-to-one)

### Project Structure
- `app/api/`: Next.js API route handlers
- `lib/prisma.ts`: Prisma client singleton instance
- `prisma/`: Database schema and seed script
- API routes follow Next.js App Router conventions (route.ts files)

## Task Requirements

This is a Trilogy Care code challenge that requires implementing:

1. **Frontend Pages**:
   - Page matching the design mockup (showing bills/stages)
   - Bill submission form with validation

2. **API Endpoints**:
   - Add new bills (ensure unique `bill_reference`)
   - Assign unassigned bills in 'submitted' stage (max 3 bills per user)

3. **Testing**:
   - Tests for all backend functionality

## Key Implementation Notes

- The database is pre-seeded with 50 users, 7 bill stages, and 50 sample bills
- Prisma client is initialized as a singleton in `lib/prisma.ts` to prevent connection issues
- The project has pre-configured permissions for Prisma and npm commands in `.claude/settings.local.json`
- Currently only one API endpoint exists: `GET /api/users`