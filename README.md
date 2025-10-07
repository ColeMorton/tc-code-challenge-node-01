# Trilogy Care Code Challenge

# Task Instructions

## Objective
The goal of this task is to demonstrate your ability to work with ReactJS / NodeJS by building functionality as described below. You are free to determine the best way to structure your code and files to achieve the stated goals. We have however setup a nextjs start app to get you going and save time on setup. If you are familiar with this stack, then please utilise it, otherwise please feel free to use your own. Details of this starter kit can be found after the task instructions.

## Requirements

1. Design Front End Page(s):
   - Design a page to show the following design.
   - Create a page to submit a bill to the API with validation.

   *Design Reference*:

   ![Page Design](https://trilogy-care-public-hosted.s3.ap-southeast-2.amazonaws.com/other/design.png)

2. Create an Endpoint to Add Bills:
   - Implement an API endpoint to add a new bill to the database.
   - Ensure the `bill_reference` field is unique to prevent duplicate entries.

3. Create an Endpoint to assign bills that are 'unassigned':
   - Implement an endpoint that assigns unassigned bills in the `submitted` stage to a user.
   - Ensure that no user is assigned more than 3 bills at any given time.

4. Testing:
   - Write tests for all backend functionality you create to ensure robustness and correctness.

In order to complete this task, you will need to create or modify relevant files in this project. You can determine the best approach to structure your code, JSON and any other files in order to achieve the stated goals and demonstrate the best way to structure and organise your code.

## Additional Notes

This task should take 3 hours to complete.


## How to submit

Send a zip of the files and email: anthonyr@trilogycare.com.au



## Getting Started with the starter kit

1. Install dependencies:
```bash
npm install
```

2. Set up the database (uses SQLite):
```bash
npx prisma generate
npm run db:setup  # Recommended: complete setup with constraints
```

Or manually:
```bash
npm run db:push   # Schema + constraints
npm run db:seed   # Sample data + constraints
```

**Note**: Database constraints (triggers, views, indexes) are automatically applied to enforce business rules including the 3-bill limit per user.

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the homepage.

## Database Schema

The project includes a seeded SQLite database with:
- **Users**: 50 random users with names and emails
- **Bill Stages**: 7 predefined stages (Draft, Submitted, Approved, Paying, On Hold, Rejected, Paid)
- **Bills**: 50 random bills with references, dates, and stage assignments

## API Routes

- `GET /api/users` - Returns all users

## Tech Stack

- Next.js 15 with App Router
- Prisma ORM with SQLite
- TypeScript
- Tailwind CSS

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).