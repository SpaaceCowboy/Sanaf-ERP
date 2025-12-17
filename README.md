# SANAF ERP

A comprehensive Enterprise Resource Planning system designed to streamline business operations, manage orders, track projects, control inventory, and automate documentation.

## Features

- 📦 **Order Management**: Create, track, and manage orders from draft to delivery
- 🏗️ **Project Management**: Plan and execute projects with task tracking and progress monitoring
- 📊 **Inventory Control**: Track stock levels, manage suppliers, and handle inventory movements
- 📄 **Document Generation**: Automatically generate invoices, packing lists, and export documents
- 📈 **Reporting & Analytics**: Real-time dashboards and comprehensive reports
- 👥 **User Management**: Role-based access control with multiple user levels
- 🔒 **Security**: JWT authentication, rate limiting, and audit logging

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database management and migrations
- **JWT** - Authentication & authorization
- **Zod** - Runtime validation

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Recharts** - Data visualization

## Project Structure

```
Sanaf-ERP/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, RBAC
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   └── config/       # Configuration files
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/             # Frontend Next.js app
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sanaf-ERP
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma migrate dev
   npx prisma generate
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local if needed
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## Environment Variables

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/sanaf_erp"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Default Users

For demo/development purposes:

- **Admin**: `admin@sanaf.com` / `Admin123!`
- **Manager**: `manager@sanaf.com` / `Manager123!`

> ⚠️ **Security Note**: Remove or change these demo credentials before deploying to production!

## User Roles & Permissions

- **ADMIN**: Full system access
- **MANAGER**: Order, project, and report management
- **WAREHOUSE**: Inventory management
- **PRODUCTION**: Project execution and updates
- **SALES**: Order creation and customer management
- **VIEWER**: Read-only access

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Database Management

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## API Documentation

The API follows RESTful conventions. Main endpoints:

- `/api/auth` - Authentication (login, register, refresh)
- `/api/users` - User management
- `/api/orders` - Order management
- `/api/projects` - Project management
- `/api/inventory` - Inventory management
- `/api/documents` - Document generation
- `/api/customers` - Customer management
- `/api/suppliers` - Supplier management
- `/api/reports` - Reports and analytics

## Production Deployment

### Important Production Checklist

1. ✅ Set strong JWT secrets
2. ✅ Use production database with backups
3. ✅ Remove or disable demo credentials
4. ✅ Enable HTTPS/SSL
5. ✅ Set appropriate CORS origins
6. ✅ Configure rate limiting
7. ✅ Set up error monitoring (e.g., Sentry)
8. ✅ Enable database connection pooling
9. ✅ Set up automated backups
10. ✅ Review and update security headers

### Deployment Options

- **Backend**: Deploy to services like Railway, Render, DigitalOcean, AWS, etc.
- **Frontend**: Deploy to Vercel, Netlify, or any Node.js hosting
- **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, Supabase, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or support, please contact the development team or create an issue in the repository.
