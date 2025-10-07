# Getting Started

This guide will help you quickly set up and start working with the Trilogy Care Bill Management System. Follow these steps to get the application running on your local machine.

## Quick Start (5 Minutes)

### 1. Prerequisites Check

Ensure you have these installed:
```bash
node --version    # Should be 18.x or higher
npm --version     # Should be 9.x or higher
git --version     # Any recent version
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd tc-code-challenge-node-01

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

### 3. Verify Installation

Open your browser to `http://localhost:3000` and you should see:
- ✅ Homepage with navigation
- ✅ Bills Dashboard at `/bills`
- ✅ Add New Bill form at `/bills/new`

**🎉 You're ready to start developing!**

## Understanding the Application

### What You're Working With

The **Trilogy Care Bill Management System** is a full-stack web application that helps manage bills through different workflow stages. It's designed as a code challenge to demonstrate modern web development skills.

**Core Features:**
- **Bill Management**: Create, view, and track bills through workflow stages
- **User Assignment**: Assign bills to users with a 3-bill limit per user
- **Stage Workflow**: Bills progress through Draft → Submitted → Approved → Paying → On Hold/Rejected → Paid
- **Real-time Validation**: Check bill reference uniqueness as you type
- **Responsive Design**: Works on desktop and mobile devices

### Project Structure Overview

```
📁 Project Root
├── 📁 app/                    # Next.js App Router (main application)
│   ├── 📁 api/               # Backend API endpoints
│   ├── 📁 bills/             # Bills-related pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage
├── 📁 lib/                   # Shared utilities
├── 📁 prisma/                # Database schema and seeding
├── 📁 __tests__/             # Test suites (unit, integration, e2e)
└── 📁 docs/                  # Documentation (you are here!)
```

## Key Workflows

### 1. Creating a New Bill

**Frontend**: `/bills/new`
1. User enters bill reference and date
2. System validates reference uniqueness in real-time
3. User optionally assigns to a user
4. Form submission creates bill in "Draft" stage

**API**: `POST /api/bills`
- Validates required fields and unique reference
- Creates bill in Draft stage
- Returns created bill with relationships

### 2. Managing Bills Dashboard

**Frontend**: `/bills`
1. Displays bills in Kanban-style columns by stage
2. Shows assignment status (assigned user or "Unassigned")
3. Allows manual assignment via dropdown for Draft/Submitted bills
4. Real-time updates after assignments

**API**: Multiple endpoints
- `GET /api/bills` - Fetch all bills with relationships
- `POST /api/bills/assign` - Assign bills to users
- `GET /api/users` - Fetch available users

### 3. Bill Assignment Logic

**Business Rules:**
- Users can have maximum 3 bills assigned at any time
- Only Draft and Submitted stage bills can be assigned
- Auto-assignment finds oldest unassigned bill in assignable stages
- Manual assignment allows specific bill selection

## Development Workflows

### Making Changes

**1. Frontend Changes (React Components)**
```bash
# Edit files in app/ directory
# Changes auto-reload with Turbopack
npm run dev
```

**2. Backend Changes (API Routes)**
```bash
# Edit files in app/api/ directory
# Changes auto-reload
npm run dev
```

**3. Database Changes**
```bash
# Edit prisma/schema.prisma
npx prisma db push      # Apply changes
npx prisma generate     # Update TypeScript types
```

### Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit           # Fast unit tests (mocked)
npm run test:integration    # Real database tests
npm run test:e2e           # End-to-end browser tests

# Watch mode for development
npm run test:watch
```

### Code Quality

```bash
# Check TypeScript types
npx tsc --noEmit

# Lint code
npm run lint

# Format code (if configured)
npm run format
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route file**: `app/api/your-endpoint/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const data = await prisma.yourModel.findMany()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

2. **Add tests**: `__tests__/api/your-endpoint.test.ts`
3. **Test manually**: `curl http://localhost:3000/api/your-endpoint`

### Adding a New Page

1. **Create page file**: `app/your-page/page.tsx`
```typescript
export default function YourPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold">Your Page</h1>
    </div>
  )
}
```

2. **Add navigation**: Update relevant components with links
3. **Add tests**: `__tests__/unit/your-page.test.tsx`

### Modifying Database Schema

1. **Edit schema**: `prisma/schema.prisma`
```prisma
model YourModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  @@map("your_table")
}
```

2. **Apply changes**:
```bash
npx prisma db push       # Update database
npx prisma generate      # Update TypeScript types
```

3. **Update seed data**: `prisma/seed.ts` (if needed)

## Understanding the Tech Stack

### Frontend (React/Next.js)
- **Next.js 15.5.2**: App Router for modern routing and server components
- **React 19.1.0**: Latest React with hooks and concurrent features
- **TypeScript 5**: Static typing for better development experience
- **Tailwind CSS v4**: Utility-first styling framework

### Backend (Next.js API)
- **API Routes**: Server-side endpoints using Next.js conventions
- **Prisma ORM 6.16.2**: Type-safe database access with auto-generated client
- **SQLite**: Lightweight database perfect for development
- **Server Actions**: Server-side business logic with `'use server'` directives

### Testing Stack
- **Jest 30.1.3**: JavaScript testing framework with multi-project configuration
- **React Testing Library 16.3.0**: Component testing utilities
- **Playwright 1.51.1**: End-to-end browser testing
- **Supertest 7.1.4**: HTTP integration testing

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
npm run db:seed
```

**Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

**TypeScript Errors**
```bash
# Check all TypeScript errors
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next
```

**Tests Failing**
```bash
# Clear test cache
npm test -- --clearCache

# Run tests with debug output
DEBUG=* npm test
```

### Getting Help

**Built-in Tools:**
- `npx prisma studio` - Database GUI browser
- Browser DevTools - Network tab for API debugging
- VS Code TypeScript - Hover for type information

**Useful Commands:**
```bash
# View database contents
npx prisma studio

# Generate fresh test data
npm run db:seed

# Check what's running on ports
lsof -i :3000
```

## Next Steps

Once you have the application running:

1. **Explore the UI**: Visit `/bills` to see the dashboard and `/bills/new` to create bills
2. **Try the API**: Use browser dev tools or curl to test API endpoints
3. **Run the tests**: `npm test` to see the comprehensive test suite
4. **Read the docs**: Check out other documentation in the `/docs` folder
5. **Start coding**: Begin implementing features or improvements

### Recommended Learning Path

1. **Start with the frontend**: Modify the bills dashboard styling
2. **Add API functionality**: Create a new endpoint for bill statistics
3. **Enhance the database**: Add new fields to track bill metadata
4. **Write tests**: Add test coverage for your new features
5. **Deploy**: Try deploying to Vercel or another platform

### Project Challenges to Try

- Add bill search and filtering functionality
- Implement bill history tracking
- Add user dashboard showing assigned bills
- Create bill statistics and reporting
- Add authentication and authorization
- Implement real-time updates with websockets

**Happy coding! 🚀**