# Remaining Fixes TODO

## Priority 1 - Critical (Must fix before testing)

### customerController.ts
```bash
# File: backend/src/controllers/customerController.ts

# Line 3: Fix import
- import { PrismaClient } from '@prisma/client';
- import { parsePagination, buildPaginatedResponse } from '../utils/helpers';
+ import prisma from '../config/database';
+ import { AuthenticatedRequest, PaginationParams } from '../types/index';
+ import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

# Line 5: Remove
- const prisma = new PrismaClient();

# Lines 17-19: Fix search fields
where.OR = [
-  { name: { contains: search as string, mode: 'insensitive' } },
+  { companyName: { contains: search as string, mode: 'insensitive' } },
+  { contactName: { contains: search as string, mode: 'insensitive' } },
  { email: { contains: search as string, mode: 'insensitive' } },
-  { company: { contains: search as string, mode: 'insensitive' } },
];

# Lines 101, 138, 186: Fix req.user
- userId: req.user!.id,
+ userId: req.user!.userId,

# Lines 103, 140, 188: Fix AuditLog field
- entityType: 'Customer',
+ entity: 'Customer',

# Lines 105, 190: Fix customer reference
- details: { name: customer.name, email: customer.email },
+ details: { companyName: customer.companyName, email: customer.email },

# Line 250: Fix Decimal usage
- const totalRevenue = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
+ const totalRevenue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
```

### supplierController.ts
```bash
# File: backend/src/controllers/supplierController.ts

# Line 3: Fix import (same as customer)
# Line 5: Remove PrismaClient instantiation (same as customer)
# Lines 17-19: Fix search fields (same as customer)

# Lines 38, 61, 160, 168: Fix relation name
- _count: { select: { inventoryItems: true } }
+ _count: { select: { inventory: true } }

# Lines 69, 235, 248: Fix field name
- unitPrice: true,
+ unitCost: true,

# Fix calculations using unitPrice:
- (sum, item) => sum + item.quantity * item.unitPrice,
+ (sum, item) => sum + item.quantity * Number(item.unitCost),

# Lines 101, 138, 186: Fix req.user (same as customer)
# Lines 103, 140, 188: Fix AuditLog field (same as customer)
```

### orderController.ts - Add missing functions
```typescript
// File: backend/src/controllers/orderController.ts
// Add at the end of file before export default

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE_STATUS',
        entity: 'Order',
        entityId: id,
        oldValues: { status: order.status },
        newValues: { status },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function generateOrderInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  // This should probably delegate to documentController.generateInvoice
  // For now, return a redirect response or implement inline
  res.status(501).json({ error: 'Use /api/documents/generate/:orderId instead' });
}
```

## Priority 2 - High (Will cause errors)

### Fix all remaining import extensions
```bash
# Search and replace in these files:
backend/src/controllers/authController.ts:3
backend/src/controllers/orderController.ts:5
backend/src/controllers/inventoryController.ts:5
backend/src/controllers/projectController.ts:3
backend/src/controllers/documentController.ts:6

# Replace pattern:
from '../types/index.js'  →  from '../types/index'
from '../config/database.js'  →  from '../config/database'
from '../utils/helpers.js'  →  from '../utils/helpers'
from '../services/pdfService.js'  →  from '../services/pdfService'
```

### Fix RBAC permissions
```typescript
// File: backend/src/types/index.ts
// Option 1: Add missing permissions

export type Permission =
  | 'orders:read'
  | 'orders:read_own'   // ADD THIS
  | 'orders:create'
  | 'orders:update'
  | 'orders:delete'
  // ... existing ...
  | 'documents:read'
  | 'documents:create'
  | 'documents:generate'  // ADD THIS
  | 'reports:read'
  | 'reports:view'    // ADD THIS (or just use reports:read)
  // ... rest

// Then update RolePermissions to include them in appropriate roles
```

## Priority 3 - Medium (Can workaround)

### Fix invalid Prisma syntax in inventoryController.ts
```typescript
// Lines 33-35: Replace invalid syntax
if (lowStock === 'true') {
-  where.quantity = { lte: prisma.inventoryItem.fields.reorderPoint };
+  // Use raw query or fetch all and filter
+  // This is a complex fix - consider using $queryRaw
}

// Similar fix needed around line 547
```

### Fix PDF service
```typescript
// File: backend/src/services/pdfService.ts

// Replace all instances:
- order.customer.name
+ order.customer.companyName

- order.customer.city
+ order.customer.address  // or remove if not needed

- order.paymentTerms
+ 'Net 30'  // or remove field from Order schema

- item.unit
+ 'PCS'  // default value

- item.countryOfOrigin
+ process.env.COMPANY_COUNTRY || 'USA'

// Fix Decimal conversions:
- order.subtotal.toFixed(2)
+ Number(order.subtotal).toFixed(2)
```

## Quick Commands

```bash
# Generate Prisma client
npx prisma generate

# Check TypeScript errors
npx tsc --noEmit

# Format code
npx prettier --write "src/**/*.ts"

# Run linter
npx eslint "src/**/*.ts" --fix
```

## Testing Checklist

After fixes:
- [ ] TypeScript compiles without errors
- [ ] Prisma generates client successfully
- [ ] Server starts without crashes
- [ ] Auth endpoints work (login, register)
- [ ] User CRUD operations work
- [ ] Order CRUD operations work
- [ ] Customer/Supplier operations work
- [ ] Inventory operations work
- [ ] Document generation works
- [ ] Reports generate correctly
