"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getOrderReport = getOrderReport;
exports.getInventoryReport = getInventoryReport;
exports.getProjectReport = getProjectReport;
exports.getFinancialReport = getFinancialReport;
const database_1 = __importDefault(require("../config/database"));
async function getDashboardStats(req, res) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [
        // Order stats
        totalOrders, monthlyOrders, lastMonthOrders, ordersByStatus, monthlyRevenue, lastMonthRevenue, 
        // Inventory stats
        totalInventoryItems, lowStockItems, inventoryValue, 
        // Project stats
        totalProjects, activeProjects, overdueProjects, 
        // Recent activity
        recentOrders, recentProjects,] = await Promise.all([
            // Orders
            database_1.default.order.count(),
            database_1.default.order.count({
                where: { orderDate: { gte: startOfMonth } },
            }),
            database_1.default.order.count({
                where: {
                    orderDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
            }),
            database_1.default.order.groupBy({
                by: ['status'],
                _count: true,
            }),
            database_1.default.order.aggregate({
                where: {
                    orderDate: { gte: startOfMonth },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
            }),
            database_1.default.order.aggregate({
                where: {
                    orderDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
            }),
            // Inventory
            database_1.default.inventoryItem.count({ where: { isActive: true } }),
            database_1.default.$queryRaw `
        SELECT COUNT(*) as count
        FROM inventory_items
        WHERE "isActive" = true AND quantity <= "reorderPoint"
      `,
            database_1.default.$queryRaw `
        SELECT COALESCE(SUM(quantity * "unitCost"), 0) as total
        FROM inventory_items
        WHERE "isActive" = true
      `,
            // Projects
            database_1.default.project.count(),
            database_1.default.project.count({
                where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } },
            }),
            database_1.default.project.count({
                where: {
                    status: { in: ['PLANNING', 'IN_PROGRESS'] },
                    dueDate: { lt: now },
                },
            }),
            // Recent activity
            database_1.default.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    customer: {
                        select: { companyName: true },
                    },
                },
            }),
            database_1.default.project.findMany({
                take: 5,
                where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } },
                orderBy: { dueDate: 'asc' },
                select: {
                    id: true,
                    projectNumber: true,
                    name: true,
                    status: true,
                    progress: true,
                    dueDate: true,
                    manager: {
                        select: { firstName: true, lastName: true },
                    },
                },
            }),
        ]);
        // Calculate trends
        const orderTrend = lastMonthOrders > 0
            ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
            : '0';
        const currentRevenue = Number(monthlyRevenue._sum.totalAmount || 0);
        const previousRevenue = Number(lastMonthRevenue._sum.totalAmount || 0);
        const revenueTrend = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : '0';
        res.json({
            orders: {
                total: totalOrders,
                thisMonth: monthlyOrders,
                trend: orderTrend,
                byStatus: ordersByStatus.reduce((acc, curr) => {
                    acc[curr.status] = curr._count;
                    return acc;
                }, {}),
            },
            revenue: {
                thisMonth: currentRevenue,
                lastMonth: previousRevenue,
                trend: revenueTrend,
            },
            inventory: {
                totalItems: totalInventoryItems,
                lowStock: Number(lowStockItems[0]?.count || 0),
                totalValue: inventoryValue[0]?.total || 0,
            },
            projects: {
                total: totalProjects,
                active: activeProjects,
                overdue: overdueProjects,
            },
            recentOrders,
            recentProjects,
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}
async function getOrderReport(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();
        const [totalOrders, totalRevenue, ordersByStatus, ordersByCountry, topProducts, dailyOrders,] = await Promise.all([
            database_1.default.order.count({
                where: {
                    orderDate: { gte: start, lte: end },
                },
            }),
            database_1.default.order.aggregate({
                where: {
                    orderDate: { gte: start, lte: end },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
                _avg: { totalAmount: true },
            }),
            database_1.default.order.groupBy({
                by: ['status'],
                where: {
                    orderDate: { gte: start, lte: end },
                },
                _count: true,
                _sum: { totalAmount: true },
            }),
            database_1.default.order.groupBy({
                by: ['shippingCountry'],
                where: {
                    orderDate: { gte: start, lte: end },
                    status: { not: 'CANCELLED' },
                },
                _count: true,
                _sum: { totalAmount: true },
            }),
            database_1.default.orderItem.groupBy({
                by: ['productName', 'productCode'],
                where: {
                    order: {
                        orderDate: { gte: start, lte: end },
                        status: { not: 'CANCELLED' },
                    },
                },
                _sum: { quantity: true, totalPrice: true },
                orderBy: { _sum: { totalPrice: 'desc' } },
                take: 10,
            }),
            database_1.default.$queryRaw `
        SELECT 
          DATE("orderDate") as date,
          COUNT(*) as count,
          COALESCE(SUM("totalAmount"), 0) as revenue
        FROM orders
        WHERE "orderDate" >= ${start} AND "orderDate" <= ${end}
          AND status != 'CANCELLED'
        GROUP BY DATE("orderDate")
        ORDER BY date ASC
      `,
        ]);
        res.json({
            period: { start, end },
            summary: {
                totalOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                averageOrderValue: totalRevenue._avg.totalAmount || 0,
            },
            ordersByStatus: ordersByStatus.map(s => ({
                status: s.status,
                count: s._count,
                revenue: s._sum.totalAmount || 0,
            })),
            ordersByCountry: ordersByCountry
                .map(c => ({
                country: c.shippingCountry,
                count: c._count,
                revenue: c._sum.totalAmount || 0,
            }))
                .sort((a, b) => Number(b.revenue) - Number(a.revenue)),
            topProducts: topProducts.map(p => ({
                productName: p.productName,
                productCode: p.productCode,
                quantity: p._sum.quantity || 0,
                revenue: p._sum.totalPrice || 0,
            })),
            dailyTrend: dailyOrders.map(d => ({
                date: d.date,
                count: Number(d.count),
                revenue: Number(d.revenue),
            })),
        });
    }
    catch (error) {
        console.error('Get order report error:', error);
        res.status(500).json({ error: 'Failed to fetch order report' });
    }
}
async function getInventoryReport(req, res) {
    try {
        const [summary, itemsByType, itemsByCategory, lowStockItems, topValueItems, recentMovements, movementsSummary,] = await Promise.all([
            database_1.default.$queryRaw `
        SELECT 
          COUNT(*) as "totalItems",
          COALESCE(SUM(quantity), 0) as "totalQuantity",
          COALESCE(SUM(quantity * "unitCost"), 0) as "totalValue"
        FROM inventory_items
        WHERE "isActive" = true
      `,
            database_1.default.inventoryItem.groupBy({
                by: ['type'],
                where: { isActive: true },
                _count: true,
                _sum: { quantity: true },
            }),
            database_1.default.inventoryItem.groupBy({
                by: ['category'],
                where: { isActive: true },
                _count: true,
                _sum: { quantity: true },
            }),
            database_1.default.$queryRaw `
        SELECT 
          i.id, i.sku, i.name, i.type, i.quantity, 
          i."minStock", i."reorderPoint",
          s."companyName" as "supplierName"
        FROM inventory_items i
        LEFT JOIN suppliers s ON i."supplierId" = s.id
        WHERE i."isActive" = true AND i.quantity <= i."reorderPoint"
        ORDER BY (i.quantity::float / NULLIF(i."reorderPoint", 0)) ASC
        LIMIT 20
      `,
            database_1.default.$queryRaw `
        SELECT 
          id, sku, name, quantity, "unitCost",
          (quantity * "unitCost") as "totalValue"
        FROM inventory_items
        WHERE "isActive" = true
        ORDER BY "totalValue" DESC
        LIMIT 10
      `,
            database_1.default.inventoryMovement.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    type: true,
                    quantity: true,
                    previousQty: true,
                    newQty: true,
                    createdAt: true,
                    inventoryItem: {
                        select: { sku: true, name: true },
                    },
                    user: {
                        select: { firstName: true, lastName: true },
                    },
                },
            }),
            database_1.default.inventoryMovement.groupBy({
                by: ['type'],
                where: {
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
                _count: true,
                _sum: { quantity: true },
            }),
        ]);
        res.json({
            summary: {
                totalItems: Number(summary[0]?.totalItems || 0),
                totalQuantity: Number(summary[0]?.totalQuantity || 0),
                totalValue: summary[0]?.totalValue || 0,
            },
            itemsByType: itemsByType.map(t => ({
                type: t.type,
                count: t._count,
                totalQuantity: t._sum.quantity || 0,
            })),
            itemsByCategory: itemsByCategory.map(c => ({
                category: c.category,
                count: c._count,
                totalQuantity: c._sum.quantity || 0,
            })),
            lowStockItems,
            topValueItems,
            recentMovements,
            movementsSummary: movementsSummary.map(m => ({
                type: m.type,
                count: m._count,
                totalQuantity: m._sum.quantity || 0,
            })),
        });
    }
    catch (error) {
        console.error('Get inventory report error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory report' });
    }
}
async function getProjectReport(req, res) {
    try {
        const [projectsByStatus, projectsByPriority, overdueProjects, taskCompletion, projectsWithProgress, teamPerformance,] = await Promise.all([
            database_1.default.project.groupBy({
                by: ['status'],
                _count: true,
            }),
            database_1.default.project.groupBy({
                by: ['priority'],
                _count: true,
            }),
            database_1.default.project.findMany({
                where: {
                    status: { in: ['PLANNING', 'IN_PROGRESS'] },
                    dueDate: { lt: new Date() },
                },
                select: {
                    id: true,
                    projectNumber: true,
                    name: true,
                    dueDate: true,
                    progress: true,
                    manager: {
                        select: { firstName: true, lastName: true },
                    },
                },
                orderBy: { dueDate: 'asc' },
            }),
            database_1.default.$queryRaw `
        SELECT 
          COUNT(*) as "totalTasks",
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as "completedTasks"
        FROM project_tasks
      `,
            database_1.default.project.findMany({
                where: {
                    status: { in: ['PLANNING', 'IN_PROGRESS'] },
                },
                select: {
                    id: true,
                    projectNumber: true,
                    name: true,
                    progress: true,
                    dueDate: true,
                    _count: {
                        select: { tasks: true },
                    },
                },
                orderBy: { dueDate: 'asc' },
                take: 10,
            }),
            database_1.default.$queryRaw `
        SELECT 
          u.id as "managerId",
          u."firstName",
          u."lastName",
          COUNT(p.id) as "totalProjects",
          COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED') as "completedProjects",
          COALESCE(AVG(p.progress), 0) as "averageProgress"
        FROM users u
        LEFT JOIN projects p ON u.id = p."managerId"
        WHERE u.role IN ('ADMIN', 'MANAGER')
        GROUP BY u.id, u."firstName", u."lastName"
        HAVING COUNT(p.id) > 0
        ORDER BY "completedProjects" DESC
      `,
        ]);
        res.json({
            summary: {
                byStatus: projectsByStatus.reduce((acc, curr) => {
                    acc[curr.status] = curr._count;
                    return acc;
                }, {}),
                byPriority: projectsByPriority.reduce((acc, curr) => {
                    acc[curr.priority] = curr._count;
                    return acc;
                }, {}),
                taskCompletion: {
                    total: Number(taskCompletion[0]?.totalTasks || 0),
                    completed: Number(taskCompletion[0]?.completedTasks || 0),
                    rate: taskCompletion[0]?.totalTasks
                        ? (Number(taskCompletion[0].completedTasks) / Number(taskCompletion[0].totalTasks) * 100).toFixed(1)
                        : '0',
                },
            },
            overdueProjects,
            activeProjects: projectsWithProgress,
            teamPerformance: teamPerformance.map(t => ({
                managerId: t.managerId,
                name: `${t.firstName} ${t.lastName}`,
                totalProjects: Number(t.totalProjects),
                completedProjects: Number(t.completedProjects),
                averageProgress: Number(t.averageProgress).toFixed(1),
            })),
        });
    }
    catch (error) {
        console.error('Get project report error:', error);
        res.status(500).json({ error: 'Failed to fetch project report' });
    }
}
async function getFinancialReport(req, res) {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const monthlyRevenue = await database_1.default.$queryRaw `
      SELECT 
        EXTRACT(MONTH FROM "orderDate") as month,
        COUNT(*) as "orderCount",
        COALESCE(SUM("totalAmount"), 0) as revenue
      FROM orders
      WHERE EXTRACT(YEAR FROM "orderDate") = ${targetYear}
        AND status != 'CANCELLED'
      GROUP BY EXTRACT(MONTH FROM "orderDate")
      ORDER BY month
    `;
        const [yearTotal, paymentStatus, topCustomers, avgOrderValue,] = await Promise.all([
            database_1.default.order.aggregate({
                where: {
                    orderDate: {
                        gte: new Date(targetYear, 0, 1),
                        lt: new Date(targetYear + 1, 0, 1),
                    },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true, taxAmount: true, shippingCost: true, discount: true },
                _count: true,
            }),
            database_1.default.order.groupBy({
                by: ['paymentStatus'],
                where: {
                    orderDate: {
                        gte: new Date(targetYear, 0, 1),
                        lt: new Date(targetYear + 1, 0, 1),
                    },
                },
                _count: true,
                _sum: { totalAmount: true },
            }),
            database_1.default.$queryRaw `
        SELECT 
          c.id as "customerId",
          c."companyName",
          COUNT(o.id) as "orderCount",
          COALESCE(SUM(o."totalAmount"), 0) as "totalSpent"
        FROM customers c
        JOIN orders o ON c.id = o."customerId"
        WHERE EXTRACT(YEAR FROM o."orderDate") = ${targetYear}
          AND o.status != 'CANCELLED'
        GROUP BY c.id, c."companyName"
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,
            database_1.default.order.aggregate({
                where: {
                    orderDate: {
                        gte: new Date(targetYear, 0, 1),
                        lt: new Date(targetYear + 1, 0, 1),
                    },
                    status: { not: 'CANCELLED' },
                },
                _avg: { totalAmount: true },
            }),
        ]);
        // Fill in missing months with zeros
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const found = monthlyRevenue.find(m => Number(m.month) === i + 1);
            return {
                month: i + 1,
                monthName: new Date(2000, i).toLocaleString('default', { month: 'short' }),
                orderCount: found ? Number(found.orderCount) : 0,
                revenue: found ? Number(found.revenue) : 0,
            };
        });
        res.json({
            year: targetYear,
            summary: {
                totalRevenue: yearTotal._sum.totalAmount || 0,
                totalTax: yearTotal._sum.taxAmount || 0,
                totalShipping: yearTotal._sum.shippingCost || 0,
                totalDiscount: yearTotal._sum.discount || 0,
                orderCount: yearTotal._count,
                averageOrderValue: avgOrderValue._avg.totalAmount || 0,
            },
            monthlyRevenue: monthlyData,
            paymentStatus: paymentStatus.map(p => ({
                status: p.paymentStatus,
                count: p._count,
                amount: p._sum.totalAmount || 0,
            })),
            topCustomers: topCustomers.map(c => ({
                customerId: c.customerId,
                companyName: c.companyName,
                orderCount: Number(c.orderCount),
                totalSpent: Number(c.totalSpent),
            })),
        });
    }
    catch (error) {
        console.error('Get financial report error:', error);
        res.status(500).json({ error: 'Failed to fetch financial report' });
    }
}
//# sourceMappingURL=reportController.js.map