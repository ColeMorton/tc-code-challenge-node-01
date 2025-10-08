# Bill Management System - Documentation

This documentation provides comprehensive information about the Bill Management System, a full-stack web application built with Next.js, React, and Prisma.

## 📚 Documentation Structure

### Quick Start
- **[Getting Started](./getting-started/README.md)** - Quick setup and development guide
- **[Data Operations Guide](./guides/data-operations.md)** - How to work with data (Server Actions vs REST API)

### Reference Documentation
- **[API Reference](./reference/api.md)** - REST endpoint specifications
- **[Server Actions Reference](./reference/server-actions.md)** - Server-side operations and functions
- **[Data Models Reference](./reference/data-models.md)** - Complete TypeScript interface definitions
- **[Error Codes Reference](./reference/error-codes.md)** - Error handling patterns and codes
- **[Hooks Reference](./reference/hooks.md)** - Custom React hooks for state management
- **[Utilities Reference](./reference/utilities.md)** - Reusable utility functions

### Architecture & Design
- **[System Architecture](./architecture/README.md)** - High-level system design and technology stack
- **[Database Architecture](./architecture/database.md)** - Schema, constraints, and performance optimization
- **[Component Architecture](./architecture/components.md)** - React component structure and patterns

### Development Guides
- **[Testing Guide](./guides/testing-guide.md)** - Testing strategies, configurations, and best practices
- **[Advanced Guides](./guides/README.md)** - Performance optimization, security, and troubleshooting
- **[Code Examples](./examples/README.md)** - Practical code patterns and usage examples
- **[Deployment Guide](./deployment/README.md)** - Production deployment and environment setup

## 🎯 Documentation Guide

### Separation of Concerns

This documentation is organized with clear separation of concerns:

- **Reference**: Technical specifications and API documentation
- **Guides**: Tutorials, workflows, and how-to instructions  
- **Architecture**: System design and component organization
- **Examples**: Working code samples and patterns

### Implementation Status

Throughout the documentation, you'll see status markers:
- ✅ **Implemented** - Feature exists and is documented
- 🚧 **Partial** - Feature partially implemented
- 📋 **Planned** - Feature documented but not yet implemented

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
- **Frontend**: Next.js 15.5.2, React 19.1.0, TypeScript ^5, Tailwind CSS ^4
- **Backend**: Next.js API Routes, Prisma ORM 6.16.2, SQLite
- **Testing**: Jest 30.1.3, React Testing Library 16.3.0, Playwright 1.51.1

### Key Features
- ✅ **Bill Management**: Create, view, and track bills through workflow stages
- ✅ **User Assignment**: Assign bills to users with a 3-bill limit per user (active stages only)
- ✅ **Stage Workflow**: Bills progress through Draft → Submitted → Approved → Paying → On Hold/Rejected → Paid
- ✅ **Real-time Validation**: Check bill reference uniqueness as you type
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Modern React Architecture**: Custom hooks for state management and performance optimization
- ✅ **Composable Components**: Reusable UI patterns with clear separation of concerns
- ✅ **Performance Optimized**: Memoization patterns and efficient rendering

### Business Rules
- Users can have maximum 3 bills assigned at any time (active stages only)
- Only Draft and Submitted stage bills can be assigned
- Bill references must be unique across all bills
- Database constraints enforce business rules at the database level

## 📊 Database Schema

The system uses a relational model with three core entities:

- **User**: System users who can be assigned bills
- **BillStage**: Workflow stages (Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid)
- **Bill**: Bills with references, dates, and stage assignments

See [Database Architecture](./architecture/database.md) for detailed schema and constraint information.

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

See [Testing Guide](./guides/testing-guide.md) for comprehensive testing documentation.

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
│   ├── api/               # REST API endpoints
│   ├── bills/             # Bills pages and Server Actions
│   ├── hooks/             # Custom React hooks (NEW)
│   ├── lib/               # Shared utilities and types
│   │   ├── utils/         # Utility functions (NEW)
│   │   └── ...
│   └── ui/                # UI components
├── lib/                   # Root-level utilities
├── prisma/                # Database schema and migrations
├── __tests__/             # Test suites (unit, integration, e2e)
└── docs/                  # Documentation
```

See [Component Architecture](./architecture/components.md) for detailed frontend structure.

## 🔒 Security & Performance

- **Input Validation**: Server-side validation with Zod schemas
- **Database Security**: Foreign key constraints and unique constraints
- **Performance**: Optimized queries with proper indexing and React memoization
- **Caching**: User capacity caching for performance
- **Monitoring**: Performance metrics and error tracking
- **Modern React Patterns**: Custom hooks, memoization, and efficient state management
- **Component Optimization**: 80% complexity reduction in form components
- **Error Handling**: Centralized error management with consistent UX patterns

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
1. Check the [Advanced Guides](./guides/README.md) troubleshooting sections
2. Review the [Code Examples](./examples/README.md) for implementation patterns
3. Examine the test files for usage examples
4. See [Data Operations Guide](./guides/data-operations.md) for data handling patterns

## Related Documentation

- [Getting Started](./getting-started/README.md) - Quick setup guide
- [Data Operations Guide](./guides/data-operations.md) - Server Actions vs REST API
- [Testing Guide](./guides/testing-guide.md) - Comprehensive testing documentation
- [Database Architecture](./architecture/database.md) - Schema and constraints
- [Component Architecture](./architecture/components.md) - Modern React architecture with hooks
- [Hooks Reference](./reference/hooks.md) - Custom hooks for state management
- [Utilities Reference](./reference/utilities.md) - Reusable utility functions

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Maintainer**: Project Maintainer
