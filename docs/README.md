# Trilogy Care Bill Management System - Documentation

This documentation provides comprehensive information about the Trilogy Care Bill Management System, a full-stack web application built with Next.js, React, and Prisma.

## 📚 Documentation Structure

### Core Documentation
- **[Getting Started](./getting-started/README.md)** - Quick setup and development guide
- **[Architecture](./architecture/README.md)** - System design and technology stack
- **[API Reference](./api/README.md)** - Complete API endpoint documentation

### Advanced Topics
- **[Advanced Guides](./guides/README.md)** - Testing strategies, performance optimization, and best practices
- **[Code Examples](./examples/README.md)** - Practical code patterns and usage examples
- **[Deployment Guide](./deployment/README.md)** - Production deployment and environment setup

### Database & Constraints
- **[Database Constraints](./database-constraints.md)** - Business rule enforcement and database triggers
- **[Constraint Architecture Diagram](./constraint-architecture-diagram.md)** - Visual representation of constraint system

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ System Overview

### Technology Stack
- **Frontend**: Next.js 15.5.2, React 19.1.0, TypeScript 5, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM 6.16.2, SQLite
- **Testing**: Jest 30.1.3, React Testing Library 16.3.0, Playwright 1.51.1

### Key Features
- **Bill Management**: Create, view, and track bills through workflow stages
- **User Assignment**: Assign bills to users with a 3-bill limit per user
- **Stage Workflow**: Bills progress through Draft → Submitted → Approved → Paying → On Hold/Rejected → Paid
- **Real-time Validation**: Check bill reference uniqueness as you type
- **Responsive Design**: Works on desktop and mobile devices

### Business Rules
- Users can have maximum 3 bills assigned at any time
- Only Draft and Submitted stage bills can be assigned
- Bill references must be unique across all bills
- Database constraints enforce business rules at the database level

## 📊 Database Schema

The system uses a relational model with three core entities:

- **User**: System users who can be assigned bills
- **BillStage**: Workflow stages (Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid)
- **Bill**: Bills with references, dates, and stage assignments

## 🧪 Testing Strategy

The project implements a multi-layer testing approach:

1. **Unit Tests**: Fast, mocked tests for business logic and components
2. **Integration Tests**: Real database tests for API functionality
3. **E2E Tests**: Browser-based tests for complete user workflows

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
```

## 🔧 Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npx prisma studio          # Database GUI
npx prisma db push         # Apply schema changes
npm run db:seed            # Seed database

# Testing
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── bills/             # Bills pages and actions
│   ├── lib/               # Shared utilities
│   └── ui/                # UI components
├── lib/                   # Root-level utilities
├── prisma/                # Database schema and migrations
├── __tests__/             # Test suites
└── docs/                  # Documentation
```

## 🔒 Security & Performance

- **Input Validation**: Server-side validation with Zod schemas
- **Database Security**: Foreign key constraints and unique constraints
- **Performance**: Optimized queries with proper indexing
- **Caching**: User capacity caching for performance
- **Monitoring**: Performance metrics and error tracking

## 📈 Monitoring & Maintenance

- **Health Checks**: `/api/health` endpoint for system status
- **Error Handling**: Centralized error definitions and HTTP status mapping
- **Logging**: Structured logging for debugging and monitoring
- **Database Maintenance**: Backup and recovery procedures

## 🤝 Contributing

1. Follow the established code patterns and TypeScript interfaces
2. Write tests for new functionality
3. Update documentation for API changes
4. Ensure database constraints are properly tested

## 📞 Support

For questions or issues:
1. Check the troubleshooting sections in the guides
2. Review the code examples for implementation patterns
3. Examine the test files for usage examples

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Trilogy Care Development Team
