"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupplierCountries = exports.getSupplierStats = exports.getSupplierItems = exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getSuppliers = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
// Get all suppliers with pagination
const getSuppliers = async (req, res) => {
    try {
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const { search, country, isActive } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: 'insensitive' } },
                { contactName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (country) {
            where.country = country;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const [suppliers, total] = await Promise.all([
            database_1.default.supplier.findMany({
                where,
                skip,
                take,
                include: {
                    _count: {
                        select: { inventory: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.supplier.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(suppliers, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};
exports.getSuppliers = getSuppliers;
// Get single supplier by ID
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await database_1.default.supplier.findUnique({
            where: { id },
            include: {
                inventory: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        quantity: true,
                        unitCost: true,
                    },
                },
                _count: {
                    select: { inventory: true },
                },
            },
        });
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    }
    catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
};
exports.getSupplierById = getSupplierById;
// Create new supplier
const createSupplier = async (req, res) => {
    try {
        const data = req.body;
        const supplier = await database_1.default.supplier.create({
            data,
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'SUPPLIER_CREATED',
                    entity: 'Supplier',
                    entityId: supplier.id,
                    newValues: { companyName: supplier.companyName, email: supplier.email },
                },
            });
        }
        res.status(201).json(supplier);
    }
    catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
};
exports.createSupplier = createSupplier;
// Update supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const existingSupplier = await database_1.default.supplier.findUnique({
            where: { id },
        });
        if (!existingSupplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        const supplier = await database_1.default.supplier.update({
            where: { id },
            data,
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'SUPPLIER_UPDATED',
                    entity: 'Supplier',
                    entityId: supplier.id,
                    newValues: { changes: data },
                },
            });
        }
        res.json(supplier);
    }
    catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
};
exports.updateSupplier = updateSupplier;
// Delete supplier
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const existingSupplier = await database_1.default.supplier.findUnique({
            where: { id },
            include: { _count: { select: { inventory: true } } },
        });
        if (!existingSupplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        // Check if supplier has inventory items
        if (existingSupplier._count.inventory > 0) {
            // Soft delete by deactivating
            await database_1.default.supplier.update({
                where: { id },
                data: { isActive: false },
            });
            return res.json({ message: 'Supplier deactivated (has linked inventory items)' });
        }
        // Hard delete if no inventory items
        await database_1.default.supplier.delete({
            where: { id },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'SUPPLIER_DELETED',
                    entity: 'Supplier',
                    entityId: id,
                    oldValues: { companyName: existingSupplier.companyName },
                },
            });
        }
        res.json({ message: 'Supplier deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
};
exports.deleteSupplier = deleteSupplier;
// Get supplier inventory items
const getSupplierItems = async (req, res) => {
    try {
        const { id } = req.params;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const [items, total] = await Promise.all([
            database_1.default.inventoryItem.findMany({
                where: { supplierId: id },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.inventoryItem.count({ where: { supplierId: id } }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(items, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching supplier items:', error);
        res.status(500).json({ error: 'Failed to fetch supplier items' });
    }
};
exports.getSupplierItems = getSupplierItems;
// Get supplier statistics
const getSupplierStats = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await database_1.default.supplier.findUnique({
            where: { id },
            include: {
                inventory: {
                    select: {
                        quantity: true,
                        unitCost: true,
                        type: true,
                    },
                },
            },
        });
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        const totalItems = supplier.inventory.length;
        const totalValue = supplier.inventory.reduce((sum, item) => sum + (item.quantity * Number(item.unitCost)), 0);
        const itemsByType = supplier.inventory.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});
        res.json({
            totalItems,
            totalValue,
            itemsByType,
        });
    }
    catch (error) {
        console.error('Error fetching supplier stats:', error);
        res.status(500).json({ error: 'Failed to fetch supplier statistics' });
    }
};
exports.getSupplierStats = getSupplierStats;
// Get supplier countries list
const getSupplierCountries = async (_req, res) => {
    try {
        const countries = await database_1.default.supplier.findMany({
            where: { country: { not: null } },
            select: { country: true },
            distinct: ['country'],
            orderBy: { country: 'asc' },
        });
        res.json(countries.map(c => c.country).filter(Boolean));
    }
    catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};
exports.getSupplierCountries = getSupplierCountries;
//# sourceMappingURL=supplierController.js.map