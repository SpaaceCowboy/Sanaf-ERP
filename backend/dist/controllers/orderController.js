"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
exports.getOrderStats = getOrderStats;
exports.updateOrderStatus = updateOrderStatus;
exports.generateOrderInvoice = generateOrderInvoice;
const library_1 = require("@prisma/client/runtime/library");
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
async function getOrders(req, res) {
    try {
        const { status, customerId, search, startDate, endDate } = req.query;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
        };
        const { skip, take, orderBy } = (0, helpers_1.parsePagination)(paginationParams);
        // Build where clause
        const where = {};
        if (status) {
            where.status = status;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customer: { companyName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (startDate || endDate) {
            where.orderDate = {};
            if (startDate) {
                where.orderDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.orderDate.lte = new Date(endDate);
            }
        }
        const [orders, total] = await Promise.all([
            database_1.default.order.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    customer: {
                        select: {
                            id: true,
                            companyName: true,
                            contactName: true,
                            country: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: { items: true },
                    },
                },
            }),
            database_1.default.order.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(orders, total, paginationParams));
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}
async function getOrderById(req, res) {
    try {
        const { id } = req.params;
        const order = await database_1.default.order.findUnique({
            where: { id },
            include: {
                customer: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        inventoryItem: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                quantity: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        projectNumber: true,
                        name: true,
                        status: true,
                        progress: true,
                    },
                },
                documents: {
                    select: {
                        id: true,
                        documentNumber: true,
                        type: true,
                        fileName: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}
async function createOrder(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const data = req.body;
        // Verify customer exists
        const customer = await database_1.default.customer.findUnique({
            where: { id: data.customerId },
        });
        if (!customer) {
            res.status(400).json({ error: 'Customer not found' });
            return;
        }
        // Calculate totals
        const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxRate = data.taxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const shippingCost = data.shippingCost || 0;
        const discount = data.discount || 0;
        const totalAmount = subtotal + taxAmount + shippingCost - discount;
        // Create order with items
        const order = await database_1.default.order.create({
            data: {
                orderNumber: (0, helpers_1.generateOrderNumber)(),
                customerId: data.customerId,
                createdById: req.user.userId,
                subtotal: new library_1.Decimal(subtotal),
                taxRate: new library_1.Decimal(taxRate),
                taxAmount: new library_1.Decimal(taxAmount),
                shippingCost: new library_1.Decimal(shippingCost),
                discount: new library_1.Decimal(discount),
                totalAmount: new library_1.Decimal(totalAmount),
                shippingAddress: data.shippingAddress,
                shippingCity: data.shippingCity,
                shippingCountry: data.shippingCountry,
                shippingMethod: data.shippingMethod,
                incoterms: data.incoterms,
                requiredDate: new Date(data.requiredDate),
                notes: data.notes,
                items: {
                    create: data.items.map(item => ({
                        inventoryItemId: item.inventoryItemId,
                        productName: item.productName,
                        productCode: item.productCode,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: new library_1.Decimal(item.unitPrice),
                        totalPrice: new library_1.Decimal(item.quantity * item.unitPrice),
                        hsCode: item.hsCode,
                    })),
                },
            },
            include: {
                customer: true,
                items: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'CREATE',
                entity: 'Order',
                entityId: order.id,
                newValues: {
                    orderNumber: order.orderNumber,
                    customer: customer.companyName,
                    totalAmount: totalAmount,
                },
            },
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
}
async function updateOrder(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        const data = req.body;
        // Check if order exists
        const existingOrder = await database_1.default.order.findUnique({
            where: { id },
        });
        if (!existingOrder) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Update order
        const order = await database_1.default.order.update({
            where: { id },
            data: {
                status: data.status,
                paymentStatus: data.paymentStatus,
                shippingMethod: data.shippingMethod,
                trackingNumber: data.trackingNumber,
                shippedDate: data.shippedDate ? new Date(data.shippedDate) : undefined,
                deliveredDate: data.deliveredDate ? new Date(data.deliveredDate) : undefined,
                notes: data.notes,
            },
            include: {
                customer: true,
                items: true,
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'UPDATE',
                entity: 'Order',
                entityId: order.id,
                oldValues: {
                    status: existingOrder.status,
                    paymentStatus: existingOrder.paymentStatus,
                },
                newValues: data,
            },
        });
        res.json(order);
    }
    catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
}
async function deleteOrder(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        // Check if order exists
        const order = await database_1.default.order.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Check if order can be deleted
        if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
            res.status(400).json({
                error: 'Cannot delete order',
                message: 'Only draft or cancelled orders can be deleted',
            });
            return;
        }
        // Delete order (items will be cascade deleted)
        await database_1.default.order.delete({
            where: { id },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'DELETE',
                entity: 'Order',
                entityId: id,
                oldValues: {
                    orderNumber: order.orderNumber,
                    status: order.status,
                },
            },
        });
        res.json({ message: 'Order deleted successfully' });
    }
    catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
}
async function getOrderStats(req, res) {
    try {
        const [totalOrders, ordersByStatus, recentOrders, monthlyRevenue,] = await Promise.all([
            database_1.default.order.count(),
            database_1.default.order.groupBy({
                by: ['status'],
                _count: true,
            }),
            database_1.default.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: {
                        select: { companyName: true },
                    },
                },
            }),
            database_1.default.order.aggregate({
                where: {
                    orderDate: {
                        gte: new Date(new Date().setDate(1)), // First day of current month
                    },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
            }),
        ]);
        res.json({
            totalOrders,
            ordersByStatus: ordersByStatus.reduce((acc, curr) => {
                acc[curr.status] = curr._count;
                return acc;
            }, {}),
            recentOrders,
            monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        });
    }
    catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Failed to fetch order stats' });
    }
}
async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        // Validate status
        const validStatuses = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }
        // Get current order
        const currentOrder = await database_1.default.order.findUnique({
            where: { id },
        });
        if (!currentOrder) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Update order status
        const updatedOrder = await database_1.default.order.update({
            where: { id },
            data: {
                status: status,
                ...(status === 'SHIPPED' && { shippedDate: new Date() }),
                ...(status === 'DELIVERED' && { deliveredDate: new Date() }),
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                shippedDate: true,
                deliveredDate: true,
                updatedAt: true,
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'UPDATE_STATUS',
                entity: 'Order',
                entityId: id,
                oldValues: { status: currentOrder.status },
                newValues: { status },
                notes,
            },
        });
        res.json({
            message: 'Order status updated successfully',
            order: updatedOrder,
        });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
}
async function generateOrderInvoice(req, res) {
    try {
        const { id } = req.params;
        // Get order with items
        const order = await database_1.default.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
            },
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Generate invoice number
        const invoiceNumber = `INV-${order.orderNumber}-${Date.now()}`;
        // Create invoice document (this would typically generate a PDF)
        // For now, we'll create a basic document record
        const document = await database_1.default.document.create({
            data: {
                documentNumber: invoiceNumber,
                type: 'INVOICE',
                orderId: id,
                generatedById: req.user.userId,
                fileName: `${invoiceNumber}.pdf`,
                filePath: `/documents/${invoiceNumber}.pdf`,
                fileSize: 0, // Would be set after PDF generation
                metadata: {
                    orderNumber: order.orderNumber,
                    customerName: order.customer.companyName,
                    totalAmount: order.totalAmount,
                    currency: 'USD',
                },
            },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'GENERATE_INVOICE',
                entity: 'Order',
                entityId: id,
                newValues: { documentId: document.id, invoiceNumber },
            },
        });
        res.json({
            message: 'Invoice generated successfully',
            document: {
                id: document.id,
                documentNumber: document.documentNumber,
                fileName: document.fileName,
                createdAt: document.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
}
//# sourceMappingURL=orderController.js.map