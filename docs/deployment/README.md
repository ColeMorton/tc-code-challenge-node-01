# Deployment Guide

This document provides comprehensive instructions for setting up, configuring, and deploying the Trilogy Care Bill Management System.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control
- **Operating System**: macOS, Linux, or Windows with WSL2

### Development Tools (Recommended)
- **VS Code**: With TypeScript and Prisma extensions
- **Database Browser**: For SQLite inspection (DB Browser for SQLite)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd tc-code-challenge-node-01
```

### 2. Install Dependencies
```bash
npm install
```

This installs all required packages including:
- Next.js 15 with Turbopack
- Prisma ORM with SQLite
- TypeScript and Tailwind CSS
- Testing frameworks (Jest, Playwright)

### 3. Environment Configuration

Create or verify the `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# Optional: Database URL for testing
# TEST_DATABASE_URL="file:./test.db"
```

**Environment Variables Explained:**
- `DATABASE_URL`: SQLite database file location for development
- Relative path `./dev.db` creates database in project root
- No additional database server required for development

## Database Setup

### 1. Generate Prisma Client
```bash
npx prisma generate
```

This generates TypeScript types and the Prisma client based on the schema.

### 2. Create Database Schema
```bash
npx prisma db push
```

This creates the SQLite database file and tables according to `prisma/schema.prisma`.

### 3. Seed Database with Sample Data
```bash
npm run db:seed
```

This populates the database with:
- **50 random users** with names and emails
- **7 bill stages** with predefined colors and labels
- **50 sample bills** with random dates and assignments

**Sample Data Includes:**
- Users: John Doe, Jane Smith, etc. with example.com emails
- Bill Stages: Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid
- Bills: BILL-0001 through BILL-0050 with realistic date ranges

## Development Deployment

### 1. Start Development Server
```bash
npm run dev
```

**Features:**
- Runs on `http://localhost:3000`
- Fast hot reloading with Next.js development server
- Automatic TypeScript compilation
- Real-time file watching

### 2. Available Development Commands
```bash
# Development server with Next.js
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Database operations
npx prisma studio        # Database GUI browser
npx prisma db push       # Apply schema changes
npm run db:seed          # Re-seed database
```

## Testing Deployment

### 1. Run All Tests
```bash
npm test
```

This runs both unit and integration tests with proper database isolation.

### 2. Specific Test Suites
```bash
# Unit tests only (fast, mocked)
npm run test:unit

# Integration tests only (real database)
npm run test:integration

# End-to-end tests
npm run test:e2e

# Test coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 3. E2E Testing with Playwright
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed
```

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

**Build Features:**
- Optimized production builds with Next.js
- Generates static assets and server-side functions
- TypeScript compilation and optimization
- Tailwind CSS optimization for minimal bundle size

### 2. Start Production Server
```bash
npm start
```

Serves the production build on `http://localhost:3000`.

### 3. Production Environment Variables

Create `.env.production` for production-specific settings:

```env
# Production database (example with PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/billmanagement"

# Next.js optimization
NODE_ENV="production"

# Optional: Custom port
PORT=3000
```

## Database Migration Strategy

### Development to Production

**SQLite to PostgreSQL Migration:**

1. **Export data from SQLite:**
```bash
npx prisma db pull  # Generate schema from existing DB
npx prisma migrate dev --name init  # Create initial migration
```

2. **Update database provider in `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

3. **Apply migration to production database:**
```bash
npx prisma migrate deploy
```

### Schema Updates
```bash
# After making schema changes
npx prisma db push           # Development
npx prisma migrate dev       # Create migration
npx prisma migrate deploy    # Production deployment
```

## Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Environment Setup:**
   - Add `DATABASE_URL` in Vercel dashboard
   - Configure PostgreSQL database (Vercel Postgres)
   - Set up automatic deployments from Git

### Railway

1. **Deploy with Railway CLI:**
```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

2. **Database Setup:**
   - Add PostgreSQL service in Railway dashboard
   - Copy database URL to environment variables

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bill-management .
docker run -p 3000:3000 -e DATABASE_URL="file:./prod.db" bill-management
```

## Performance Optimization

### Production Optimizations

1. **Database Connection Pooling:**
```typescript
// In production, configure Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

2. **Static Asset Optimization:**
- Next.js automatic image optimization
- Next.js bundle optimization
- Tailwind CSS optimization

3. **Caching Strategy:**
- Browser caching for static assets
- API response caching (implement as needed)
- CDN integration for global delivery

## Monitoring and Maintenance

### Health Checks

Create `app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'healthy', timestamp: new Date() })
}
```

### Database Maintenance
```bash
# Backup SQLite database
cp dev.db backup-$(date +%Y%m%d).db

# Database introspection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset
```

### Log Management
- Application logs via `console.log` statements
- Error tracking integration (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics)

## Security Considerations

### Production Security Checklist

- [ ] Environment variables properly secured
- [ ] Database credentials not in source code
- [ ] HTTPS enabled for production
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive data
- [ ] Database access restricted to application

### Authentication Setup (Future)

When adding authentication:
1. Choose provider (NextAuth.js, Auth0, Clerk)
2. Update API routes with authentication middleware
3. Implement role-based access control
4. Secure database operations

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Regenerate Prisma client
npx prisma generate

# Check database URL format
echo $DATABASE_URL
```

**Build Failures:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev  # Full debug output
DEBUG=prisma* npm run dev  # Prisma-specific logs
```

## Backup and Recovery

### Database Backup
```bash
# SQLite backup
cp dev.db backups/backup-$(date +%Y%m%d-%H%M%S).db

# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql
```

### Recovery Process
1. Stop application
2. Restore database from backup
3. Run any pending migrations
4. Restart application
5. Verify data integrity

This deployment guide ensures reliable setup and operation of the bill management system across development, testing, and production environments.