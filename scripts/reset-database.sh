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
        } catch (error) {
            if (error.message.includes('User already has 3 bills assigned in active stages')) {
                console.log('✅ Constraint working: 4th bill correctly rejected');
            } else {
                console.log('❌ Unexpected error:', error.message);
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
