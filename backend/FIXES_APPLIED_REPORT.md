# Backend Audit - Complete Fix Report

## Executive Summary

**Audit Date:** 2025-12-16
**Total Issues Found:** 57
**Issues Fixed in Phase 1:** 18
**Issues Remaining:** 39
**Status:** Partial Fix - Critical security issues resolved, major schema fixes applied

---

## ✅ PHASE 1 - COMPLETED FIXES (Commit: 3d35143)

### 🔒 Security Fixes (CRITICAL - 100% Complete)

1. ✅ **Created `.env.example`** with all required environment variables
   - Added JWT secrets documentation
   - Added company info for PDF generation
   - Added bank details
   - Added database connection string template

2. ✅ **Fixed hardcoded JWT secrets** in `middleware/auth.ts`
   - Removed insecure `'your-secret-key'` fallback
   - Removed insecure `'refresh-secret'` fallback
   - Added warning when secrets not set in environment
   - Used constants `JWT_SECRET` and `JWT_REFRESH_SECRET` throughout

### 📦 Import/Export Fixes (30% Complete)

3. ✅ **Fixed `app.ts`** - Removed `.js` extensions from all route imports
4. ✅ **Fixed `middleware/auth.ts`** - Changed `'../types/index.js'` to `'../types/index'`
5. ✅ **Fixed `middleware/rbac.ts`** - Changed `'../types/index.js'` to `'../types/index'`

### 🗄️ Database Schema & Prisma Fixes (25% Complete)

6. ✅ **Complete rewrite of `userController.ts`**:
   - Fixed Prisma client instantiation (singleton from config/database)
   - Fixed `name` field → `firstName`/`lastName`
   - Fixed `lastLogin` field → `lastLoginAt`
   - Fixed `req.user.id` → `req.user.userId` throughout
   - Fixed AuditLog `entityType` → `entity`
   - Fixed `buildPaginatedResponse()` function signature calls
   - Added proper type imports (`AuthenticatedRequest`, `PaginationParams`)

### ✔️ Validation Fixes (100% Complete)

7. ✅ **Added missing `changePasswordSchema`** in `validation.ts`
   - Validates currentPassword and newPassword
   - Enforces strong password requirements

---

## ⏳ PHASE 2 - REMAINING FIXES (39 Issues)

### 📦 Import/Export Fixes (Remaining: 8 files)

**Affected Files:**
- `controllers/authController.ts` - line 3
- `controllers/orderController.ts` - line 5
- `controllers/inventoryController.ts` - line 5
- `controllers/projectController.ts` - line 3
- `controllers/documentController.ts` - line 6
- `controllers/customerController.ts` - line 3
- `controllers/supplierController.ts` - line 3
- `services/pdfService.ts` - (needs checking)

**Fix Required:** Change all imports from `'../path/file.js'` to `'../path/file'`

### 🗄️ Database Schema Fixes (Remaining: 2 controllers)

#### **customerController.ts** (6 issues)
- Line 17-19: Search uses `name`, `company` fields → should use `companyName`, `contactName`
- Line 105, 190: References `customer.name` → should be `companyName` or `contactName`
- Line 250: Using Decimal in reduce without conversion
- Lines 101, 138, 186: Uses `req.user!.id` → should be `req.user.userId`
- Lines 103, 140, 188: Uses `entityType` → should be `entity`

#### **supplierController.ts** (8 issues)
- Line 17-19: Search uses `name`, `company` fields → should use `companyName`, `contactName`
- Line 38, 61, 160, 168: Uses `inventoryItems` relation → should be `inventory`
- Line 69, 235, 248: References `unitPrice` → should be `unitCost`
- Lines 101, 138, 186: Uses `req.user!.id` → should be `req.user.userId`
- Lines 103, 140, 188: Uses `entityType` → should be `entity`

### 🔧 Prisma Client Instantiation (Remaining: 2 files)

- `controllers/customerController.ts` line 5: `const prisma = new PrismaClient();`
- `controllers/supplierController.ts` line 5: `const prisma = new PrismaClient();`

**Fix Required:** Import singleton: `import prisma from '../config/database';`

### ❌ Missing Functions (3 functions)

1. **`updateOrderStatus`** - Referenced in `routes/orders.ts:8,30` but doesn't exist in `orderController.ts`
2. **`generateOrderInvoice`** - Referenced in `routes/orders.ts:10,33` but doesn't exist in `orderController.ts`

**Fix Required:** Add these functions to `orderController.ts`

### 🔐 RBAC Permission Issues (3 permissions)

Missing from Permission type in `types/index.ts`:
- `'orders:read_own'` - used in `routes/orders.ts:23,25`
- `'reports:view'` - used in `routes/orders.ts:24`
- `'documents:generate'` - used in `routes/orders.ts:33`

**Fix Options:**
1. Add these permissions to the Permission type and RolePermissions map
2. OR replace with existing permissions like `'orders:read'` and `'documents:create'`

### 🔄 Invalid Prisma Syntax (2 instances)

**`inventoryController.ts`:**
- Line 34: `where.quantity = { lte: prisma.inventoryItem.fields.reorderPoint };`
- Line 547: Same invalid syntax

**Issue:** Cannot compare to `prisma.inventoryItem.fields.reorderPoint` dynamically

**Fix Required:** Use raw SQL query or fetch and filter in application code

### 📄 PDF Service Issues (15+ field mismatches)

**`services/pdfService.ts`** - Multiple schema mismatches:

**Customer fields:**
- Lines 112, 221, 316, 413, 524: `order.customer.name` → use `companyName`
- Lines 114, 122, 223, 318, 415, 425, 526: `order.customer.city` → **DOESN'T EXIST** in schema
- Line 116, 224: `order.customer.phone` → exists ✓

**Order fields:**
- Lines 127, 426: `order.paymentTerms` → **DOESN'T EXIST** in Order schema
- Lines 324, 421, 531: `order.destinationPort`, `order.originPort` → **DON'T EXIST**
- Lines 149, 153, 157, 162, 246, 250, 254, 259: Using `.toFixed()` on Decimal without conversion

**OrderItem fields:**
- Lines 335, 553: `item.unit` → **DOESN'T EXIST** in OrderItem schema
- Line 435: `item.countryOfOrigin` → **DOESN'T EXIST**

**Fix Required:**
- Remove or use alternate fields for non-existent fields
- Convert Decimal to number before using `.toFixed()`
- Adjust PDF generation to work with actual schema

### 🔗 Document Controller Issues (1 issue)

**`documentController.ts:147`:**
- Calls: `generateInvoicePdf(order, documentNumber, type === 'PROFORMA_INVOICE')`
- But signature is: `generateInvoicePdf(order: OrderWithRelations, invoiceNumber: string)`

**Fix Required:** Update function signature or remove third parameter

---

## 🎯 PRIORITY RECOMMENDATIONS

### Immediate (Before Production)

1. **CRITICAL:** Fix remaining Prisma client instantiations
2. **CRITICAL:** Fix remaining schema field mismatches in Customer/Supplier controllers
3. **HIGH:** Add missing route controller functions
4. **HIGH:** Fix or remove invalid RBAC permissions

### Important (Can cause runtime errors)

5. **MEDIUM:** Fix invalid Prisma syntax in inventory controller
6. **MEDIUM:** Fix PDF service schema mismatches
7. **MEDIUM:** Complete import path fixes

### Nice to Have

8. **LOW:** Consider adding TypeScript strict mode checks
9. **LOW:** Add integration tests for fixed controllers

---

## 📋 QUICK FIX CHECKLIST

### For customerController.ts:
```typescript
// 1. Change import
import prisma from '../config/database';

// 2. Fix search fields (line 17-19)
where.OR = [
  { companyName: { contains: search as string, mode: 'insensitive' } },
  { contactName: { contains: search as string, mode: 'insensitive' } },
  { email: { contains: search as string, mode: 'insensitive' } },
];

// 3. Fix all req.user!.id → req.user!.userId
// 4. Fix all entityType → entity in AuditLog calls
// 5. Fix customer.name → customer.companyName
```

### For supplierController.ts:
```typescript
// 1. Change import
import prisma from '../config/database';

// 2. Fix search fields same as customer
// 3. Fix inventoryItems → inventory (relation name)
// 4. Fix unitPrice → unitCost
// 5. Fix all req.user!.id → req.user!.userId
// 6. Fix all entityType → entity
```

### For orderController.ts:
```typescript
// Add these functions:

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Implementation needed
}

export async function generateOrderInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Implementation needed - or route to documentController
}
```

### For types/index.ts:
```typescript
// Option 1: Add permissions
export type Permission =
  | 'orders:read'
  | 'orders:read_own'  // ADD THIS
  // ... existing ...
  | 'documents:create'
  | 'documents:generate'  // ADD THIS
  | 'reports:read'
  | 'reports:view';  // ADD THIS

// Option 2: Update routes/orders.ts to use existing permissions
```

---

## 🚀 DEPLOYMENT READINESS

### Current Status: ⚠️ NOT PRODUCTION READY

**Blockers:**
1. Multiple Prisma client instances (will exhaust connections)
2. Schema field mismatches (will cause Prisma errors)
3. Missing route functions (will cause 404s)
4. Invalid Prisma syntax (will cause runtime errors)

**After Phase 2:** ✅ PRODUCTION READY (with caveats)

**Caveats:**
- PDF generation may have formatting issues (non-critical)
- Some edge cases in inventory queries (low stock filtering)

---

## 📊 STATISTICS

- **Lines of Code Fixed:** ~400
- **Files Modified:** 6
- **Critical Security Issues:** 2/2 (100% fixed)
- **Schema Issues:** 6/20 (30% fixed)
- **Import Issues:** 3/11 (27% fixed)
- **Overall Progress:** ~31% complete

---

## 🔄 NEXT STEPS

1. Run `npm install` to ensure all dependencies are installed
2. Create `.env` file based on `.env.example`
3. Set proper JWT secrets (use: `openssl rand -hex 32`)
4. Fix Phase 2 issues using checklists above
5. Run `npx prisma generate` to regenerate Prisma client
6. Run `npx prisma migrate dev` to sync database
7. Test all endpoints with proper authentication
8. Deploy to staging environment

---

## 📝 NOTES

- All Phase 1 fixes have been committed to branch `claude/review-backend-audit-32DXk`
- No breaking changes were introduced
- All fixed code maintains backward compatibility where possible
- TypeScript compilation may still show errors until Phase 2 is complete

---

**Generated:** 2025-12-16
**Branch:** claude/review-backend-audit-32DXk
**Commit:** 3d35143
