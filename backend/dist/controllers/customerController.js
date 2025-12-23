"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountries = exports.getCustomerStats = exports.getCustomerOrders = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
// Get all customers with pagination
const getCustomers = async (req, res) => {
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
        const [customers, total] = await Promise.all([
            database_1.default.customer.findMany({
                where,
                skip,
                take,
                include: {
                    _count: {
                        select: { orders: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.customer.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(customers, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
exports.getCustomers = getCustomers;
// Get single customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.default.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: { orders: true },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    }
    catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};
exports.getCustomerById = getCustomerById;
// Create new customer
const createCustomer = async (req, res) => {
    try {
        const data = req.body;
        const customer = await database_1.default.customer.create({
            data,
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'CUSTOMER_CREATED',
                    entity: 'Customer',
                    entityId: customer.id,
                    newValues: { companyName: customer.companyName, email: customer.email },
                },
            });
        }
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
};
exports.createCustomer = createCustomer;
// Update customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const existingCustomer = await database_1.default.customer.findUnique({
            where: { id },
        });
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const customer = await database_1.default.customer.update({
            where: { id },
            data,
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'CUSTOMER_UPDATED',
                    entity: 'Customer',
                    entityId: customer.id,
                    newValues: { changes: data },
                },
            });
        }
        res.json(customer);
    }
    catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};
exports.updateCustomer = updateCustomer;
// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCustomer = await database_1.default.customer.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } },
        });
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Check if customer has orders
        if (existingCustomer._count.orders > 0) {
            // Soft delete by deactivating
            await database_1.default.customer.update({
                where: { id },
                data: { isActive: false },
            });
            return res.json({ message: 'Customer deactivated (has existing orders)' });
        }
        // Hard delete if no orders
        await database_1.default.customer.delete({
            where: { id },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'CUSTOMER_DELETED',
                    entity: 'Customer',
                    entityId: id,
                    oldValues: { companyName: existingCustomer.companyName },
                },
            });
        }
        res.json({ message: 'Customer deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};
exports.deleteCustomer = deleteCustomer;
// Get customer order history
const getCustomerOrders = async (req, res) => {
    try {
        const { id } = req.params;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const [orders, total] = await Promise.all([
            database_1.default.order.findMany({
                where: { customerId: id },
                skip,
                take,
                include: {
                    items: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.order.count({ where: { customerId: id } }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(orders, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
};
exports.getCustomerOrders = getCustomerOrders;
// Get customer statistics
const getCustomerStats = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.default.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    select: {
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const totalOrders = customer.orders.length;
        const totalRevenue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const ordersByStatus = customer.orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        // Get orders by month (last 12 months)
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const ordersByMonth = customer.orders
            .filter(order => order.createdAt >= twelveMonthsAgo)
            .reduce((acc, order) => {
            const month = order.createdAt.toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
        res.json({
            totalOrders,
            totalRevenue,
            averageOrderValue,
            ordersByStatus,
            ordersByMonth,
        });
    }
    catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({ error: 'Failed to fetch customer statistics' });
    }
};
exports.getCustomerStats = getCustomerStats;
// Get countries list (for filtering)
const getCountries = async (_req, res) => {
    try {
        const countries = await database_1.default.customer.findMany({
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
exports.getCountries = getCountries;
//# sourceMappingURL=customerController.js.map