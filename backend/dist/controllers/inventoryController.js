"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryItems = getInventoryItems;
exports.getInventoryItemById = getInventoryItemById;
exports.createInventoryItem = createInventoryItem;
exports.updateInventoryItem = updateInventoryItem;
exports.deleteInventoryItem = deleteInventoryItem;
exports.recordMovement = recordMovement;
exports.getMovements = getMovements;
exports.getLowStockItems = getLowStockItems;
exports.getInventoryStats = getInventoryStats;
exports.getCategories = getCategories;
const library_1 = require("@prisma/client/runtime/library");
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
async function getInventoryItems(req, res) {
    try {
        const { type, category, lowStock, search, supplierId } = req.query;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'asc',
        };
        const { skip, take, orderBy } = (0, helpers_1.parsePagination)(paginationParams);
        const where = { isActive: true };
        if (type) {
            where.type = type;
        }
        if (category) {
            where.category = category;
        }
        if (supplierId) {
            where.supplierId = supplierId;
        }
        if (lowStock === 'true') {
            where.quantity = { lte: database_1.default.inventoryItem.fields.reorderPoint };
        }
        if (search) {
            where.OR = [
                { sku: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            database_1.default.inventoryItem.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            country: true,
                        },
                    },
                },
            }),
            database_1.default.inventoryItem.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(items, total, paginationParams));
    }
    catch (error) {
        console.error('Get inventory items error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory items' });
    }
}
async function getInventoryItemById(req, res) {
    try {
        const { id } = req.params;
        const item = await database_1.default.inventoryItem.findUnique({
            where: { id },
            include: {
                supplier: true,
                movements: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                projectMaterials: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                projectNumber: true,
                                name: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        if (!item) {
            res.status(404).json({ error: 'Inventory item not found' });
            return;
        }
        res.json(item);
    }
    catch (error) {
        console.error('Get inventory item by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
}
async function createInventoryItem(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const data = req.body;
        // Check if SKU already exists
        const existingSku = await database_1.default.inventoryItem.findUnique({
            where: { sku: data.sku },
        });
        if (existingSku) {
            res.status(400).json({ error: 'SKU already exists' });
            return;
        }
        // Verify supplier if provided
        if (data.supplierId) {
            const supplier = await database_1.default.supplier.findUnique({
                where: { id: data.supplierId },
            });
            if (!supplier) {
                res.status(400).json({ error: 'Supplier not found' });
                return;
            }
        }
        const item = await database_1.default.inventoryItem.create({
            data: {
                sku: data.sku || (0, helpers_1.generateSku)(data.category, data.name),
                name: data.name,
                description: data.description,
                type: data.type,
                category: data.category,
                quantity: data.quantity || 0,
                minStock: data.minStock || 0,
                maxStock: data.maxStock,
                reorderPoint: data.reorderPoint || 10,
                unitCost: new library_1.Decimal(data.unitCost),
                currency: data.currency || 'USD',
                unit: data.unit || 'PCS',
                weight: data.weight ? new library_1.Decimal(data.weight) : undefined,
                dimensions: data.dimensions,
                hsCode: data.hsCode,
                countryOfOrigin: data.countryOfOrigin,
                supplierId: data.supplierId,
                warehouseZone: data.warehouseZone,
                binLocation: data.binLocation,
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'CREATE',
                entity: 'InventoryItem',
                entityId: item.id,
                newValues: {
                    sku: item.sku,
                    name: item.name,
                    type: item.type,
                },
            },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Create inventory item error:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
}
async function updateInventoryItem(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        const data = req.body;
        const existingItem = await database_1.default.inventoryItem.findUnique({
            where: { id },
        });
        if (!existingItem) {
            res.status(404).json({ error: 'Inventory item not found' });
            return;
        }
        const item = await database_1.default.inventoryItem.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                minStock: data.minStock,
                maxStock: data.maxStock,
                reorderPoint: data.reorderPoint,
                unitCost: data.unitCost ? new library_1.Decimal(data.unitCost) : undefined,
                warehouseZone: data.warehouseZone,
                binLocation: data.binLocation,
                isActive: data.isActive,
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'UPDATE',
                entity: 'InventoryItem',
                entityId: item.id,
                oldValues: {
                    name: existingItem.name,
                    unitCost: existingItem.unitCost,
                },
                newValues: data,
            },
        });
        res.json(item);
    }
    catch (error) {
        console.error('Update inventory item error:', error);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
}
async function deleteInventoryItem(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        const item = await database_1.default.inventoryItem.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        orderItems: true,
                        projectMaterials: true,
                    },
                },
            },
        });
        if (!item) {
            res.status(404).json({ error: 'Inventory item not found' });
            return;
        }
        // Check if item is in use
        if (item._count.orderItems > 0 || item._count.projectMaterials > 0) {
            // Soft delete
            await database_1.default.inventoryItem.update({
                where: { id },
                data: { isActive: false },
            });
            res.json({ message: 'Inventory item deactivated (has related records)' });
            return;
        }
        await database_1.default.inventoryItem.delete({
            where: { id },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'DELETE',
                entity: 'InventoryItem',
                entityId: id,
                oldValues: {
                    sku: item.sku,
                    name: item.name,
                },
            },
        });
        res.json({ message: 'Inventory item deleted successfully' });
    }
    catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
}
// ==================== INVENTORY MOVEMENTS ====================
async function recordMovement(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const data = req.body;
        // Get current item
        const item = await database_1.default.inventoryItem.findUnique({
            where: { id: data.inventoryItemId },
        });
        if (!item) {
            res.status(404).json({ error: 'Inventory item not found' });
            return;
        }
        // Calculate new quantity
        let newQty = item.quantity;
        const isAddition = ['IMPORT', 'PRODUCTION_IN', 'RETURN'].includes(data.type);
        const isSubtraction = ['EXPORT', 'PRODUCTION_OUT', 'SCRAP'].includes(data.type);
        if (isAddition) {
            newQty += data.quantity;
        }
        else if (isSubtraction) {
            newQty -= data.quantity;
            if (newQty < 0) {
                res.status(400).json({
                    error: 'Insufficient stock',
                    available: item.quantity,
                    requested: data.quantity,
                });
                return;
            }
        }
        else if (data.type === 'ADJUSTMENT') {
            // For adjustment, quantity is the new absolute value
            newQty = data.quantity;
        }
        // Create movement and update item in transaction
        const [movement] = await database_1.default.$transaction([
            database_1.default.inventoryMovement.create({
                data: {
                    inventoryItemId: data.inventoryItemId,
                    userId: req.user.userId,
                    supplierId: data.supplierId,
                    type: data.type,
                    quantity: data.quantity,
                    previousQty: item.quantity,
                    newQty,
                    unitCost: item.unitCost,
                    totalCost: new library_1.Decimal(data.quantity).mul(item.unitCost),
                    referenceType: data.referenceType,
                    referenceId: data.referenceId,
                    importBatchNo: data.importBatchNo,
                    importDate: data.importDate ? new Date(data.importDate) : undefined,
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
                    notes: data.notes,
                },
                include: {
                    inventoryItem: {
                        select: {
                            sku: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            database_1.default.inventoryItem.update({
                where: { id: data.inventoryItemId },
                data: { quantity: newQty },
            }),
        ]);
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'MOVEMENT',
                entity: 'InventoryItem',
                entityId: data.inventoryItemId,
                oldValues: { quantity: item.quantity },
                newValues: { quantity: newQty, movementType: data.type },
            },
        });
        res.status(201).json(movement);
    }
    catch (error) {
        console.error('Record movement error:', error);
        res.status(500).json({ error: 'Failed to record movement' });
    }
}
async function getMovements(req, res) {
    try {
        const { inventoryItemId, type, startDate, endDate } = req.query;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 50,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const where = {};
        if (inventoryItemId) {
            where.inventoryItemId = inventoryItemId;
        }
        if (type) {
            where.type = type;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const [movements, total] = await Promise.all([
            database_1.default.inventoryMovement.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    inventoryItem: {
                        select: {
                            sku: true,
                            name: true,
                            unit: true,
                        },
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    supplier: {
                        select: {
                            companyName: true,
                        },
                    },
                },
            }),
            database_1.default.inventoryMovement.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(movements, total, paginationParams));
    }
    catch (error) {
        console.error('Get movements error:', error);
        res.status(500).json({ error: 'Failed to fetch movements' });
    }
}
async function getLowStockItems(req, res) {
    try {
        const items = await database_1.default.$queryRaw `
      SELECT id, sku, name, type, quantity, "minStock", "reorderPoint"
      FROM inventory_items
      WHERE "isActive" = true
        AND quantity <= "reorderPoint"
      ORDER BY (quantity::float / NULLIF("reorderPoint", 0)) ASC
      LIMIT 20
    `;
        res.json(items);
    }
    catch (error) {
        console.error('Get low stock items error:', error);
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
}
async function getInventoryStats(req, res) {
    try {
        const [totalItems, itemsByType, totalValue, lowStockCount, recentImports, recentExports,] = await Promise.all([
            database_1.default.inventoryItem.count({ where: { isActive: true } }),
            database_1.default.inventoryItem.groupBy({
                by: ['type'],
                where: { isActive: true },
                _count: true,
                _sum: { quantity: true },
            }),
            database_1.default.$queryRaw `
        SELECT COALESCE(SUM(quantity * "unitCost"), 0) as total
        FROM inventory_items
        WHERE "isActive" = true
      `,
            database_1.default.inventoryItem.count({
                where: {
                    isActive: true,
                    quantity: { lte: database_1.default.inventoryItem.fields.reorderPoint },
                },
            }),
            database_1.default.inventoryMovement.count({
                where: {
                    type: 'IMPORT',
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
            database_1.default.inventoryMovement.count({
                where: {
                    type: 'EXPORT',
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        res.json({
            totalItems,
            itemsByType: itemsByType.reduce((acc, curr) => {
                acc[curr.type] = {
                    count: curr._count,
                    totalQuantity: curr._sum.quantity,
                };
                return acc;
            }, {}),
            totalValue: totalValue[0]?.total || 0,
            lowStockCount,
            recentImports,
            recentExports,
        });
    }
    catch (error) {
        console.error('Get inventory stats error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
}
async function getCategories(req, res) {
    try {
        const categories = await database_1.default.inventoryItem.groupBy({
            by: ['category'],
            where: { isActive: true },
            _count: true,
        });
        res.json(categories.map(c => ({
            name: c.category,
            count: c._count,
        })));
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}
//# sourceMappingURL=inventoryController.js.map