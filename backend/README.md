# SANAF ERP - Backend API

RESTful API server for the SANAF ERP system built with Node.js, Express, and TypeScript.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 🛡️ Role-based access control (RBAC)
- ✅ Request validation with Zod
- 🗄️ PostgreSQL database with Prisma ORM
- 📝 Comprehensive audit logging
- 🚦 Rate limiting
- 🔒 Security headers with Helmet
- 🎯 TypeScript for type safety

## Tech Stack

- **Runtime**: Node.js >= 18.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **Password Hashing**: bcryptjs

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@localhost:5432/sanaf_erp"
   JWT_SECRET=your-very-secure-secret-key-min-32-chars
   JWT_REFRESH_SECRET=your-very-secure-refresh-secret-min-32-chars
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Set up the database**
   ```bash
   # Run migrations
   npx prisma migrate dev

   # Generate Prisma Client
   npx prisma generate

   # (Optional) Seed the database
   npm run prisma:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API server will start on `http://localhost:5000`

## Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with initial data
npm run prisma:studio    # Open Prisma Studio GUI
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── orderController.ts
│   │   ├── projectController.ts
│   │   ├── inventoryController.ts
│   │   └── ...
│   ├── routes/             # API route definitions
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   ├── projects.ts
│   │   └── ...
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── rbac.ts         # Role-based access control
│   │   └── validation.ts   # Request validation
│   ├── services/           # Business logic
│   │   └── pdfService.ts
│   ├── utils/              # Utility functions
│   │   └── helpers.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── config/             # Configuration files
│       └── database.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Database seeding script
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - List users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/stats` - Get order statistics

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/tasks` - Create task
- `PUT /api/projects/:projectId/tasks/:taskId` - Update task
- `DELETE /api/projects/:projectId/tasks/:taskId` - Delete task

### Inventory
- `GET /api/inventory` - List inventory items
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `POST /api/inventory/movements` - Record inventory movement
- `GET /api/inventory/movements` - List inventory movements
- `GET /api/inventory/low-stock` - Get low stock items

### Customers & Suppliers
- `GET /api/customers` - List customers
- `GET /api/suppliers` - List suppliers
- Similar CRUD endpoints for both

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/generate/:orderId` - Generate document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/orders` - Orders report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/projects` - Projects report
- `GET /api/reports/financial` - Financial report

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Obtain access token and refresh token
2. **Access Token**: Short-lived (15 minutes), used for API requests
3. **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Making Authenticated Requests

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

When access token expires:
```bash
POST /api/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

## Role-Based Access Control

User roles and their permissions:

- **ADMIN**: Full system access
- **MANAGER**: Manage orders, projects, view reports
- **WAREHOUSE**: Manage inventory
- **PRODUCTION**: Update project tasks
- **SALES**: Create orders, manage customers
- **VIEWER**: Read-only access

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User**: System users with roles
- **Customer**: Customer information
- **Supplier**: Supplier information
- **Order**: Sales orders with items
- **Project**: Projects linked to orders
- **ProjectTask**: Tasks within projects
- **InventoryItem**: Stock items
- **InventoryMovement**: Stock movements
- **Document**: Generated documents
- **AuditLog**: System activity audit trail

## Security

- ✅ JWT secrets should be strong (32+ characters)
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS enabled with configured origins
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ Audit logging for critical operations

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error message",
  "details": {} // Optional additional details
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Production Deployment

### Pre-deployment Checklist

1. Set strong, unique JWT secrets
2. Use production database URL
3. Set `NODE_ENV=production`
4. Remove demo/seed data
5. Configure proper CORS origins
6. Enable database connection pooling
7. Set up database backups
8. Configure process manager (PM2, systemd)
9. Enable HTTPS
10. Set up monitoring and logging

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://your-frontend-domain.com
```

### Running in Production

```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/app.js --name sanaf-erp-api

# Or with node
NODE_ENV=production node dist/app.js
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists
- Check network/firewall settings

### Migration Issues
```bash
# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

### JWT Errors
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set
- Tokens must be sent in Authorization header
- Check token expiration settings

## Support

For issues or questions, contact the development team or refer to the main project README.
