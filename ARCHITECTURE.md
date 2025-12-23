# ElectroFlow ERP - Enterprise Resource Planning System

## 🏭 Overview

ElectroFlow ERP is a comprehensive management system designed for Electronic Industries companies that handle:
- **Order Management**: Track customer orders from creation to delivery
- **Project Management**: Staff tasks, deadlines, and checklists
- **Inventory/Storage Management**: Raw materials, finished goods, imports/exports
- **Export Documentation**: Automated invoices and shipping documents
- **Reporting**: Management dashboards and analytics

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching
- **Recharts** - Charts and visualizations
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Node.js + Express** - REST API
- **TypeScript** - Type safety
- **Prisma ORM** - Database operations
- **PostgreSQL** - Primary database
- **JWT + bcrypt** - Authentication
- **PDFKit** - Document generation
- **Node-cron** - Scheduled tasks

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## 📁 Folder Structure

```
electroflow-erp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── inventoryController.ts
│   │   │   ├── documentController.ts
│   │   │   └── reportController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   └── validation.ts
│   │   ├── models/
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── orders.ts
│   │   │   ├── projects.ts
│   │   │   ├── inventory.ts
│   │   │   ├── documents.ts
│   │   │   └── reports.ts
│   │   ├── services/
│   │   │   ├── pdfService.ts
│   │   │   ├── emailService.ts
│   │   │   └── reportService.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── orders/
│   │   │   │   ├── projects/
│   │   │   │   ├── inventory/
│   │   │   │   ├── documents/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── orders/
│   │   │   ├── projects/
│   │   │   ├── inventory/
│   │   │   └── reports/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 👥 Role-Based Access Control (RBAC)

### Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | System administrator | Full access to all features |
| **MANAGER** | Department manager | Manage orders, projects, reports, limited user management |
| **WAREHOUSE** | Warehouse staff | Inventory management, material tracking |
| **PRODUCTION** | Production staff | View orders, update project tasks |
| **SALES** | Sales team | Create orders, view inventory, generate invoices |
| **VIEWER** | Read-only access | View dashboards and reports only |

---

## 📊 Database Schema

### Core Entities

1. **Users** - System users with roles
2. **Orders** - Customer orders with line items
3. **Projects** - Production projects with tasks
4. **Inventory** - Raw materials and finished goods
5. **Suppliers** - Material suppliers
6. **Customers** - Order customers
7. **Documents** - Generated invoices and export docs
8. **AuditLogs** - System activity tracking

---

## 🚀 Installation Guide

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev
```

### Docker Setup (Recommended)
```bash
docker-compose up -d
```

---

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `POST /api/orders/:id/invoice` - Generate invoice

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/tasks` - Add task
- `PUT /api/projects/:id/tasks/:taskId` - Update task

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update item
- `POST /api/inventory/import` - Record import
- `POST /api/inventory/export` - Record export
- `GET /api/inventory/movements` - Movement history

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/invoice/:orderId` - Generate invoice
- `POST /api/documents/export/:orderId` - Generate export docs
- `GET /api/documents/:id/download` - Download document

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/orders` - Order analytics
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/financial` - Financial summary
