# Clauth - AI-Designed Clothing Crowdfunding Platform

This is a Next.js 14 (App Router) web app called Clauth - a crowdfunding platform for AI-designed clothing. The project uses TypeScript and is structured with the following key directories:

## File Structure

```
/app - Main application directory using Next.js 14 App Router
  /clothing - Clothing-related routes
  /user - User-specific routes
  /api - API endpoints
  /admin - Admin control panel
  /design - Clothing design/creation interface
  /discover - Marketplace/discovery features
  /my-preorders - User's preorder management
  /profile - User profiles
  /settings - User settings
  /login & /signup - Authentication routes
/components - Reusable React components
/lib - Core utilities and configurations
/prisma - Database schema and migrations
/public - Static assets
/utils - Helper functions
```

## Tech Stack

- Frontend: Next.js 14 (App Router), React, TailwindCSS
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js with Google Sign-In
- Storage: Supabase for AI-generated clothing images
- Payments: Stripe integration with manual capture and guest checkout
- SEO: Dynamic metadata with route-level head.js files

## Key Features

### 1. AI-Powered Clothing Creation

- Users can generate custom clothing items using descriptive prompts
- AI-generated images stored in Supabase
- Design customization and preview

### 2. Marketplace Features

- Featured clothing section
- Trending items
- "Almost-There" section for items close to funding goal
- Progress bars for funding status

### 3. Social Features

- User profiles with customizable bios
- Comments with nested replies
- Like system
- Social sharing with rich metadata
- Editable user profiles with real-time updates

### 4. E-commerce

- Preorder system with funding goals
- Stripe integration for payments
- Guest checkout support
- Manual payment capture
- Order management

### 5. Admin Features

- Content moderation
- Clothing item visibility control
- Deletion capabilities
- User management

### 6. SEO & Sharing

- Dynamic metadata generation
- Open Graph tags
- Twitter cards
- Route-level head.js implementation

### 7. User Experience

- Consistent text contrast and readability across all components
- Intuitive bio editing with pencil icon interface
- Clear placeholder text in form inputs
- Responsive design with mobile-first approach
- Loading states and error handling for all user actions
- Clean navigation with streamlined UI elements

## Implementation Details

The application uses server-side rendering (SSR) for metadata and initial page loads, while features like image generation and comment interactions are client-rendered for optimal performance. Data is persisted in PostgreSQL via Prisma, with proper relationships between users, clothing items, comments, and orders.

### Recent Updates

- Added user bio functionality with default empty string in database
- Created dedicated API endpoint for bio updates
- Improved text readability across the application
- Enhanced form placeholder visibility
- Streamlined profile page navigation
- Added real-time session updates for profile changes
