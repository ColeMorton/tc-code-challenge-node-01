# React Component Structure Documentation

## Overview

This document provides a comprehensive analysis of the React component architecture in the Trilogy Care Bill Management System. The application follows Next.js 15 App Router patterns with a clear separation of concerns and component composition principles.

## Component Hierarchy

```
app/
├── page.tsx (Home Page)
├── layout.tsx (Root Layout)
├── bills/
│   ├── page.tsx (Bills Dashboard Page)
│   ├── new/
│   │   └── page.tsx (New Bill Form Page)
│   └── actions.ts (Server Actions)
├── users/
│   └── page.tsx (Users Page)
└── ui/
    ├── bills/
    │   ├── dashboard.tsx (Main Dashboard Component)
    │   ├── form.tsx (Bill Creation Form)
    │   └── table.tsx (User Bills Summary Table)
    ├── dashboard/
    │   └── cards.tsx (Statistics Cards)
    └── skeletons.tsx (Loading States)
```

## Component Relationships & Responsibilities

### 1. BillsDashboard Component (`app/ui/bills/dashboard.tsx`)

**Purpose:** The main interactive dashboard that displays bills organized by workflow stages (Draft, Submitted, Approved, etc.)

**Key Responsibilities:**
- **Data Organization**: Groups bills by stage using `groupBillsByStage()` function
- **Bill Assignment**: Handles real-time bill assignment to users via dropdown selects
- **Error Handling**: Manages assignment errors with user feedback
- **State Management**: Tracks assignment progress and error states
- **User Experience**: Provides loading states and error messages

**Component Composition:**
```typescript
// Receives data from parent page
interface BillsDashboardProps {
  bills: Bill[]
  users: User[]
}

// Internal state management
const [error, setError] = useState<string | null>(null)
const [assigningBillId, setAssigningBillId] = useState<string | null>(null)
```

**Key Features:**
- **Kanban-style Layout**: Bills displayed in columns by stage
- **Interactive Assignment**: Dropdown selects for assigning unassigned bills
- **Real-time Updates**: Uses Server Actions for immediate feedback
- **Accessibility**: Proper ARIA labels and screen reader support
- **Responsive Design**: Adapts to different screen sizes

**Imports & Dependencies:**
- Uses `assignBillAction` from `@/app/bills/actions` for bill assignment
- Imports type definitions from `@/app/lib/definitions`
- Client-side component (`'use client'`) for interactivity

### 2. BillsTable Component (`app/ui/bills/table.tsx`)

**Purpose:** Displays a summary table showing user workload statistics (total bills, submitted, approved per user)

**Key Responsibilities:**
- **Data Display**: Shows user bill counts in tabular format
- **Responsive Design**: Mobile-friendly card layout and desktop table
- **Data Fetching**: Server component that fetches user summary data
- **Visual Hierarchy**: Clear presentation of user statistics

**Component Composition:**
```typescript
// Server component - fetches data directly
export default async function BillsTable() {
  const userSummary = await fetchUserBillsSummary()
  // Renders responsive table/cards
}
```

**Key Features:**
- **Dual Layout**: Table on desktop, cards on mobile
- **User Avatars**: Initial-based avatars for visual identification
- **Color Coding**: Different colors for different bill types
- **Server-Side Rendering**: Data fetched at build/request time

**Data Structure:**
```typescript
interface UserSummary {
  userId: string
  userName: string
  totalBills: number
  totalSubmitted: number
  totalApproved: number
}
```

### 3. BillForm Component (`app/ui/bills/form.tsx`)

**Purpose:** Interactive form for creating new bills with comprehensive validation

**Key Responsibilities:**
- **Form Management**: Handles form state and validation
- **Real-time Validation**: Debounced async validation for bill references
- **User Feedback**: Success/error states with proper UX
- **Navigation**: Handles form submission and redirects
- **Accessibility**: Comprehensive ARIA support and screen reader compatibility

**Component Composition:**
```typescript
// Complex state management
const [formData, setFormData] = useState<BillFormData>({...})
const [validation, setValidation] = useState<FormValidationState>(...)
const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>(...)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState(false)
```

**Key Features:**
- **Dual Validation**: Client-side (Zod) + Server-side (async)
- **Debounced Checking**: 500ms delay for bill reference validation
- **Capacity Display**: Shows user bill capacity in dropdown
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Loading States**: Proper loading indicators during submission

**Validation Strategy:**
```typescript
// Immediate validation with Zod
const fieldError = FieldValidators.billReference(value)

// Debounced async validation
validationTimeoutRef.current = setTimeout(() => {
  handleValidateBillReference(value)
}, 500)
```

### 4. Page Components

#### BillsPage (`app/bills/page.tsx`)
**Purpose:** Server-side page that orchestrates the bills dashboard

**Key Responsibilities:**
- **Data Fetching**: Fetches bills and users data in parallel
- **Suspense Boundaries**: Provides loading states for async components
- **Layout Management**: Provides page structure and navigation

**Component Composition:**
```typescript
// Parallel data fetching
const [bills, users] = await Promise.all([
  getBills(),
  getUsers()
])

// Suspense wrapper for loading states
<Suspense fallback={<BillsDashboardSkeleton />}>
  <BillsDashboardWrapper />
</Suspense>
```

#### NewBillPage (`app/bills/new/page.tsx`)
**Purpose:** Server-side page for the bill creation form

**Key Responsibilities:**
- **User Data**: Fetches users with bill counts for capacity checking
- **Layout**: Provides form page structure
- **Data Preparation**: Includes user bill counts for form validation

### 5. Supporting Components

#### Skeletons (`app/ui/skeletons.tsx`)
**Purpose:** Loading state components that match the structure of actual content

**Components:**
- `BillsDashboardSkeleton`: Matches the kanban board layout
- `BillCardSkeleton`: Matches individual bill cards
- `TableRowSkeleton`: Matches table rows
- `CardSkeleton`: General purpose card skeleton

**Key Features:**
- **Shimmer Animation**: CSS-based loading animation
- **Structure Matching**: Skeletons mirror actual component structure
- **Responsive**: Adapts to different screen sizes

#### Cards (`app/ui/dashboard/cards.tsx`)
**Purpose:** Statistics display components for dashboard metrics

**Components:**
- `CardWrapper`: Fetches and displays multiple statistics
- `Card`: Reusable card component for individual metrics

## Component Communication Patterns

### 1. Props Down, Events Up
```typescript
// Parent passes data down
<BillsDashboard bills={bills} users={users} />

// Child calls parent actions
const result = await assignBillAction({ billId, userId })
```

### 2. Server Actions for Data Mutations
```typescript
// Form submission uses Server Actions
await createBill({
  billReference: formData.billReference,
  billDate: formData.billDate,
  assignedToId: formData.assignedToId || undefined
})
```

### 3. Suspense for Loading States
```typescript
// Page-level Suspense boundaries
<Suspense fallback={<BillsDashboardSkeleton />}>
  <BillsDashboardWrapper />
</Suspense>
```

## State Management Patterns

### 1. Local State for UI
```typescript
// Component-specific state
const [error, setError] = useState<string | null>(null)
const [assigningBillId, setAssigningBillId] = useState<string | null>(null)
```

### 2. Form State Management
```typescript
// Complex form state with validation
const [formData, setFormData] = useState<BillFormData>({...})
const [validation, setValidation] = useState<FormValidationState>(...)
const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>(...)
```

### 3. Server State via Server Components
```typescript
// Server components fetch data directly
const userSummary = await fetchUserBillsSummary()
```

## Accessibility Features

### 1. ARIA Labels and Roles
```typescript
// Proper semantic markup
<div role="region" aria-label="Bills organized by stage">
<div role="article" aria-labelledby={`bill-${bill.id}-title`}>
```

### 2. Screen Reader Support
```typescript
// Live regions for dynamic content
<div aria-live="polite" aria-live="assertive">
// Hidden status announcements
<div className="sr-only" aria-live="polite">
```

### 3. Keyboard Navigation
```typescript
// Focus management and keyboard accessibility
className="focus:outline-none focus:ring-2 focus:ring-blue-500"
```

## Performance Optimizations

### 1. Parallel Data Fetching
```typescript
// Fetch multiple data sources simultaneously
const [bills, users] = await Promise.all([
  getBills(),
  getUsers()
])
```

### 2. Debounced Validation
```typescript
// Prevent excessive API calls
validationTimeoutRef.current = setTimeout(() => {
  handleValidateBillReference(value)
}, 500)
```

### 3. Lazy Loading with Suspense
```typescript
// Code splitting and loading states
<Suspense fallback={<BillsDashboardSkeleton />}>
  <BillsDashboardWrapper />
</Suspense>
```

## Testing Considerations

### 1. Test IDs for E2E Testing
```typescript
// Comprehensive test identifiers
data-testid="dashboard-title"
data-testid="bill-card-${bill.billReference}"
data-testid="assignment-select-${bill.billReference}"
```

### 2. Component Isolation
- Each component has clear responsibilities
- Props interfaces are well-defined
- Components can be tested in isolation

### 3. Error Boundary Readiness
- Components handle errors gracefully
- Error states are properly managed
- User feedback is comprehensive

## Key Design Patterns

### 1. Container/Presentational Pattern
- **Container Components**: `BillsPage`, `NewBillPage` (data fetching, orchestration)
- **Presentational Components**: `BillsDashboard`, `BillForm` (UI logic, user interaction)

### 2. Composition over Inheritance
- Small, focused components that compose together
- Reusable UI elements (skeletons, cards)
- Clear separation of concerns

### 3. Server/Client Component Split
- **Server Components**: Data fetching, static content
- **Client Components**: Interactive features, state management

This architecture provides a solid foundation for maintainable, scalable React applications with clear separation of concerns and excellent user experience.
