# SANAF ERP - Frontend

Modern, responsive frontend application for the SANAF ERP system built with Next.js 14 and TypeScript.

## Features

- ⚡ **Next.js 14** with App Router
- 🎨 **Tailwind CSS** for styling
- 🔄 **React Query** for data fetching and caching
- 📝 **React Hook Form** with Zod validation
- 🎭 **Framer Motion** for animations
- 📊 **Recharts** for data visualization
- 🌙 **Dark mode** by default
- 📱 **Responsive design**
- 🔐 **JWT authentication** with automatic token refresh

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── projects/
│   │   │   ├── inventory/
│   │   │   ├── documents/
│   │   │   ├── reports/
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   └── layout.tsx      # Dashboard layout
│   │   ├── auth/               # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable components
│   │   ├── ui/                 # UI components (shadcn/ui)
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   └── providers/          # Context providers
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.ts          # Authentication hook
│   ├── lib/                    # Utilities and helpers
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   └── styles/                 # Global styles
│       └── globals.css
├── public/                     # Static assets
├── .env.example               # Environment variables template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

## Key Features

### Authentication

The app uses JWT-based authentication with automatic token refresh:

- Login/Register pages
- Protected routes with automatic redirects
- Token stored in localStorage
- Automatic token refresh on expiry
- Logout functionality

### Dashboard

Comprehensive dashboard with:
- Overview statistics
- Revenue trends chart
- Order status distribution
- Inventory by type
- Low stock alerts
- Overdue project warnings

### Order Management

- List all orders with filtering and search
- Create new orders with items
- View order details
- Update order status
- Track shipping and delivery

### Project Management

- Create and manage projects
- Task tracking with drag-and-drop
- Progress monitoring
- Assign team members
- Link projects to orders

### Inventory Management

- Track inventory items
- Record stock movements
- Low stock alerts
- Supplier management
- Category filtering

### Document Management

- Generate invoices
- Create packing lists
- Export documents
- Download PDFs

### Reports & Analytics

- Dashboard overview
- Order reports
- Inventory reports
- Project reports
- Financial reports

## Components

### UI Components (shadcn/ui)

Pre-built, customizable components:
- Button
- Input
- Select
- Dialog
- Dropdown Menu
- Card
- Badge
- Progress
- Avatar
- Checkbox
- Label

### Layout Components

- **DashboardLayout**: Main dashboard wrapper with sidebar and header
- **Sidebar**: Navigation menu with role-based filtering
- **Header**: Top navigation with user menu

## State Management

### Global State (Zustand)

- **Auth State**: User authentication and permissions
  - Login/logout
  - User information
  - Token management
  - Permission checking

### Server State (React Query)

- API data fetching and caching
- Automatic refetching
- Optimistic updates
- Error handling

## API Integration

The frontend communicates with the backend API through axios:

```typescript
// Example API call
import { ordersApi } from '@/lib/api';

const orders = await ordersApi.list({ status: 'CONFIRMED' });
```

### API Client Features

- Automatic token injection
- Token refresh on 401 errors
- Request/response interceptors
- Type-safe API methods
- Error handling

## Styling

### Tailwind CSS

Utility-first CSS framework with custom configuration:

- Custom color palette (electric, volt, circuit, carbon)
- Dark mode support
- Responsive breakpoints
- Custom animations

### Component Styling

Using the `cn()` utility for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

## Forms

Forms use React Hook Form with Zod validation:

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## Routing

Using Next.js 14 App Router:

- **Public routes**: `/auth/login`, `/auth/register`
- **Protected routes**: All dashboard routes require authentication
- **Automatic redirects**: Unauthenticated users redirected to login

## Authentication Flow

1. User logs in via `/auth/login`
2. Access token stored in memory
3. Refresh token stored in localStorage
4. Tokens included in API requests
5. On 401 error, refresh token used to get new access token
6. On refresh failure, user redirected to login

## Role-Based UI

Components adapt based on user role:

```typescript
const { hasPermission, hasRole } = useAuth();

{hasPermission('orders:create') && (
  <Button>Create Order</Button>
)}
```

## Production Build

### Build the application

```bash
npm run build
```

This creates an optimized production build in `.next/`

### Environment Variables

For production, set:
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Deployment

#### Vercel (Recommended)

```bash
vercel deploy
```

#### Other Platforms

```bash
npm run build
npm run start
```

The app runs on port 3000 by default.

## Performance Optimization

- ✅ Server components by default
- ✅ Image optimization with Next.js Image
- ✅ Code splitting and lazy loading
- ✅ React Query caching
- ✅ Optimistic UI updates

## Security

- ✅ JWT tokens not exposed in URLs
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ Input validation
- ✅ XSS protection
- ✅ CSRF protection (via SameSite cookies in backend)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Hot Reload

Next.js provides fast refresh - changes appear instantly without losing state.

### TypeScript

Full TypeScript support with strict mode enabled. Use type definitions from `/src/types/index.ts`.

### Debugging

Use React DevTools and Redux DevTools for debugging state and components.

## Troubleshooting

### API Connection Issues

- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Authentication Issues

- Clear localStorage
- Check token expiration
- Verify backend JWT secrets match

## Customization

### Branding

Update branding in:
- `src/app/layout.tsx` - Page title and metadata
- `src/components/layout/Sidebar.tsx` - Logo and name
- `src/app/auth/login/page.tsx` - Login page branding

### Colors

Edit `tailwind.config.ts` to customize the color scheme.

### Theme

The app uses dark mode by default. To change:
- Edit `src/app/layout.tsx` - Remove `className="dark"`

## Support

For issues or questions, contact the development team or refer to the main project README.
