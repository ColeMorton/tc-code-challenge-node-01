# System Architecture

[← Back to Documentation](../README.md) | [Database Architecture](database.md) | [Component Architecture](components.md)

This document provides a high-level overview of the Bill Management System architecture, including technology stack and system design. For detailed implementation information, see the linked architecture documents.

## Technology Stack

### Frontend
- **Next.js 15.5.2**: React framework with App Router for modern web development
- **React 19.1.0**: Component-based UI library with hooks and context
- **TypeScript ^5**: Static typing for improved developer experience and code quality
- **Tailwind CSS ^4**: Utility-first CSS framework for rapid UI development
- **@tailwindcss/postcss**: PostCSS integration for Tailwind CSS

### Backend
- **Next.js API Routes**: Server-side API endpoints using App Router conventions
- **Prisma ORM 6.16.2**: Type-safe database client and schema management
- **SQLite**: Lightweight, file-based database for development and testing
- **Server Actions**: Server-side business logic with `'use server'` directives

See [Database Architecture](database.md) for detailed schema and constraint information.

### Development & Testing
- **Jest 30.1.3**: JavaScript testing framework with multi-project configuration
- **React Testing Library 16.3.0**: Component testing utilities
- **Playwright 1.51.1**: End-to-end testing framework
- **ESLint 9**: Code linting and formatting
- **TypeScript 5**: Type checking and compilation
- **Supertest 7.1.4**: HTTP integration testing

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                     # REST API route handlers
│   │   ├── bills/              # Bill-related endpoints
│   │   │   ├── route.ts       # GET /api/bills
│   │   │   └── assign/        # POST /api/bills/assign
│   │   ├── users/             # GET /api/users
│   │   └── health/            # GET /api/health
│   ├── bills/                  # Bills pages and Server Actions
│   │   ├── page.tsx           # Bills dashboard
│   │   ├── new/               # New bill form
│   │   └── actions.ts         # Server Actions
│   ├── lib/                    # Shared utilities and types
│   │   ├── infrastructure/    # Prisma client and database
│   │   ├── validation/        # Input validation
│   │   ├── error/             # Error definitions
│   │   └── types/             # TypeScript definitions
│   ├── ui/                     # UI components
│   │   ├── bills/             # Bill-specific components
│   │   ├── dashboard/         # Dashboard components
│   │   └── skeletons.tsx      # Loading skeletons
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Homepage
│   └── globals.css            # Global styles
├── lib/                        # Root-level utilities
│   ├── cache.ts               # Caching utilities
│   ├── monitoring.ts          # Performance monitoring
│   └── database-constraints.ts # Database constraint logic
├── prisma/                     # Database configuration
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migrations
├── __tests__/                  # Test suites
│   ├── api/                   # Unit tests (mocked)
│   ├── integration/           # Integration tests (real DB)
│   ├── unit/                  # Frontend component tests
│   └── e2e/                   # End-to-end tests
└── docs/                       # Documentation
    ├── reference/             # Technical specifications
    ├── guides/                # Tutorials and workflows
    ├── architecture/          # System design documents
    ├── examples/              # Code examples
    └── deployment/            # Setup instructions
```

See [Component Architecture](components.md) for detailed frontend structure and component organization.

## Database Architecture

The system uses SQLite with Prisma ORM and implements a multi-layer defense strategy for business rule enforcement.

### Core Entities

- **User**: System users who can be assigned bills
- **BillStage**: Workflow stages (Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid)
- **Bill**: Bills with references, dates, and stage assignments

### Key Features

- **3-Bill Assignment Limit**: Users can have maximum 3 bills assigned (active stages only)
- **Database Constraints**: SQLite triggers enforce business rules at database level
- **Performance Optimization**: Indexed queries and database views for efficiency
- **Data Integrity**: Foreign key constraints and unique constraints

See [Database Architecture](database.md) for comprehensive schema, constraints, and performance details.

## Frontend Architecture

The frontend follows Next.js 15 App Router patterns with clear separation of concerns and component composition principles.

### Key Features

- **Server/Client Component Split**: Server components for data fetching, client components for interactivity
- **Server Actions Integration**: Type-safe server-side operations with automatic revalidation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Comprehensive ARIA support and keyboard navigation
- **Performance**: Parallel data fetching, debounced validation, and optimistic updates

### Component Organization

- **Page Components**: Server-side data fetching and orchestration
- **UI Components**: Reusable, focused components with clear responsibilities
- **Layout System**: Consistent responsive design patterns
- **State Management**: Local state with React hooks, no global state management

See [Component Architecture](components.md) for detailed component structure, patterns, and implementation details.

## Backend Architecture

The backend combines REST API endpoints with Server Actions for a hybrid approach that provides both external integration capabilities and type-safe internal operations.

### API Design

**REST API Endpoints**
- Resource-based URLs (`/api/users`, `/api/bills`, `/api/health`)
- Standard HTTP methods (GET, POST)
- JSON request/response format
- Consistent error handling with HTTP status codes

**Server Actions**
- Type-safe server-side functions
- Automatic cache invalidation and UI updates
- Form integration and optimistic updates
- Business logic enforcement with validation

### Data Layer

**Prisma ORM Integration**
- Type-safe database queries and migrations
- Connection pooling and optimization
- Development/production environment handling
- Singleton pattern prevents connection leaks

## Security Considerations

- **Input Validation**: Server-side validation with Zod schemas and TypeScript type checking
- **Database Security**: Foreign key constraints, unique constraints, and ORM-based queries prevent injection
- **Authentication**: Currently no authentication (development/demo), ready for middleware integration
- **Error Handling**: Centralized error definitions without sensitive data exposure

## Performance Considerations

- **Database Optimization**: Indexed fields, efficient Prisma queries, and connection pooling
- **Frontend Optimization**: Next.js code splitting, static asset optimization, and Turbopack
- **Caching Strategy**: Browser caching for static assets, user capacity caching for performance
- **Loading States**: Component-level loading states and optimistic updates for better UX

## Scalability Design

- **Current Benefits**: Stateless API design, database-agnostic ORM, component-based frontend, comprehensive testing
- **Future Considerations**: Database migration path (SQLite → PostgreSQL), API rate limiting, CDN integration, microservices potential

## Development Patterns

- **Code Organization**: Domain-driven folder structure with separation of concerns
- **Error Handling**: Fail-fast approach with consistent error formats and client-side boundaries
- **Testing Strategy**: Multi-layer approach (unit, integration, e2e) with real database testing
- **Type Safety**: TypeScript interfaces throughout the application

## Implementation Status

- ✅ **Core Features**: Bill management, user assignment, stage workflow
- ✅ **Database Constraints**: 3-bill limit enforcement with triggers and application logic
- ✅ **Server Actions**: Type-safe server-side operations with form integration
- ✅ **REST API**: External integration endpoints with proper error handling
- 🚧 **Authentication**: Ready for implementation, not yet implemented
- 📋 **Performance Monitoring**: Basic monitoring implemented, advanced metrics planned

## Related Documentation

- [Database Architecture](database.md) - Detailed schema, constraints, and performance
- [Component Architecture](components.md) - Frontend structure and patterns
- [API Reference](../reference/api.md) - REST endpoint specifications
- [Server Actions Reference](../reference/server-actions.md) - Server-side operations
- [Data Operations Guide](../guides/data-operations.md) - When to use Server Actions vs REST API

This architecture provides a solid foundation for a bill management system while maintaining simplicity and enabling future growth.