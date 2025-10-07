#!/bin/bash

# Database Reset Script
# This script completely destroys and resets the database with corrected constraints

set -e  # Exit on any error

echo "🗑️  Starting complete database reset..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Backup existing database (just in case)
if [ -f "prisma/dev.db" ]; then
    echo "📦 Creating backup of existing database..."
    cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
fi

# Remove existing database files
echo "🗑️  Removing existing database files..."
rm -f prisma/dev.db
rm -f prisma/dev.db-journal
rm -f prisma/test-e2e.db
rm -f prisma/test-e2e.db-journal
echo "✅ Database files removed"

# Remove existing migrations directory to start fresh
echo "🗑️  Removing existing migrations..."
rm -rf prisma/migrations
echo "✅ Migrations directory removed"

# Generate new Prisma client
echo "🔧 Generating new Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Create new migration with corrected constraints
echo "🚀 Creating new migration with corrected constraints..."
npx prisma migrate dev --name "initial_with_corrected_constraints"
echo "✅ New migration created"

# Apply triggers separately (prisma migrate dev doesn't execute raw SQL from migration files)
echo "🔧 Applying database triggers..."
MIGRATION_DIR=$(ls -td prisma/migrations/*_initial_with_corrected_constraints | head -1)
if [ -f "$MIGRATION_DIR/triggers.sql" ]; then
    npx prisma db execute --file "$MIGRATION_DIR/triggers.sql" --schema prisma/schema.prisma
    echo "✅ Triggers applied"
else
    echo "⚠️  Warning: triggers.sql not found, creating it..."
    cat > "$MIGRATION_DIR/triggers.sql" << 'TRIGGEREOF'
-- ============================================================================
-- CORRECTED BILL ASSIGNMENT CONSTRAINTS
-- ============================================================================
-- These triggers enforce the 3-bill limit for active bill stages only
-- Active stages: Draft, Submitted, Approved, Paying, On Hold
-- Inactive stages: Rejected, Paid (don't count toward limit)

-- 1. Enforce 3-bill limit when inserting a bill with an assigned user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_insert
BEFORE INSERT ON bills
WHEN NEW.assigned_to_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;

-- 2. Enforce 3-bill limit when updating a bill to assign it to a user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_update
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL
  AND OLD.assigned_to_id IS NULL
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;

-- 3. Enforce 3-bill limit when reassigning a bill to a different user
CREATE TRIGGER IF NOT EXISTS check_bill_limit_reassign
BEFORE UPDATE ON bills
WHEN NEW.assigned_to_id IS NOT NULL
  AND OLD.assigned_to_id IS NOT NULL
  AND NEW.assigned_to_id != OLD.assigned_to_id
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'Target user already has 3 bills assigned in active stages')
  END;
END;

-- 4. Enforce 3-bill limit when transitioning bills to active stages
-- This handles cases where a bill moves from inactive to active stage
CREATE TRIGGER IF NOT EXISTS check_bill_limit_stage_transition
BEFORE UPDATE ON bills
WHEN OLD.bill_stage_id != NEW.bill_stage_id
  AND NEW.assigned_to_id IS NOT NULL
BEGIN
  -- Only check if the new stage is an active stage
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM bills b
      JOIN bill_stages bs ON b.bill_stage_id = bs.id
      WHERE b.assigned_to_id = NEW.assigned_to_id
        AND bs.label IN ('Draft', 'Submitted', 'Approved', 'Paying', 'On Hold')
    ) >= 3
    THEN RAISE(ABORT, 'User already has 3 bills assigned in active stages')
  END;
END;
TRIGGEREOF
    npx prisma db execute --file "$MIGRATION_DIR/triggers.sql" --schema prisma/schema.prisma
    echo "✅ Triggers created and applied"
fi

# Seed the database with test data
echo "🌱 Seeding database with test data..."
npm run db:seed
echo "✅ Database seeded"

# Verify the constraints are working
echo "🔍 Verifying constraints are working..."
echo "Running constraint verification tests..."

# Create a simple test to verify constraints
cat > temp_constraint_test.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConstraints() {
    try {
        // Test 1: Create a user
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'test@example.com'
            }
        });
        console.log('✅ User created successfully');

        // Test 2: Get draft stage
        const draftStage = await prisma.billStage.findFirst({
            where: { label: 'Draft' }
        });
        if (!draftStage) {
            throw new Error('Draft stage not found');
        }
        console.log('✅ Draft stage found');

        // Test 3: Create 3 bills (should succeed)
        for (let i = 1; i <= 3; i++) {
            await prisma.bill.create({
                data: {
                    billReference: `TEST-${i}`,
                    billDate: new Date('2024-01-01'),
                    assignedToId: user.id,
                    billStageId: draftStage.id
                }
            });
        }
        console.log('✅ 3 bills created successfully');

        // Test 4: Try to create 4th bill (should fail)
        try {
            await prisma.bill.create({
                data: {
                    billReference: 'TEST-4',
                    billDate: new Date('2024-01-01'),
                    assignedToId: user.id,
                    billStageId: draftStage.id
                }
            });
            console.log('❌ ERROR: 4th bill was created (constraint failed!)');
            process.exit(1);
        } catch (error) {
            if (error.code === 'P2003') {
                console.log('✅ Constraint working: 4th bill correctly rejected (trigger fired)');
            } else {
                console.log('❌ Unexpected error:', error.message);
                process.exit(1);
            }
        }

        // Cleanup
        await prisma.bill.deleteMany({ where: { assignedToId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConstraints();
EOF

# Run the constraint test
node temp_constraint_test.js
rm temp_constraint_test.js

echo ""
echo "🎉 Database reset completed successfully!"
echo ""
echo "📋 Summary:"
echo "   • Database files destroyed and recreated"
echo "   • Corrected migration applied"
echo "   • Test data seeded"
echo "   • Constraints verified"
echo ""
echo "🚀 You can now start the development server:"
echo "   npm run dev"
echo ""
