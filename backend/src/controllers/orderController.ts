import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/database.js';
import { AuthenticatedRequest, CreateOrderDto, UpdateOrderDto, PaginationParams } from '../types/index.js';
import { generateOrderNumber, parsePagination, buildPaginatedResponse } from '../utils/helpers.js';

export async function getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, customerId, search, startDate, endDate } = req.query;
    const paginationParams: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    
    const { skip, take, orderBy } = parsePagination(paginationParams);
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { companyName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        (where.orderDate as Record<string, Date>).gte = new Date(startDate as string);
      }
      if (endDate) {
        (where.orderDate as Record<string, Date>).lte = new Date(endDate as string);
      }
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count({ where }),
    ]);
    
    res.json(buildPaginatedResponse(orders, total, paginationParams));
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
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
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const data: CreateOrderDto = req.body;
    
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    
    if (!customer) {
      res.status(400).json({ error: 'Customer not found' });
      return;
    }
    
    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = data.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const shippingCost = data.shippingCost || 0;
    const discount = data.discount || 0;
    const totalAmount = subtotal + taxAmount + shippingCost - discount;
    
    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: data.customerId,
        createdById: req.user.userId,
        subtotal: new Decimal(subtotal),
        taxRate: new Decimal(taxRate),
        taxAmount: new Decimal(taxAmount),
        shippingCost: new Decimal(shippingCost),
        discount: new Decimal(discount),
        totalAmount: new Decimal(totalAmount),
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
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.quantity * item.unitPrice),
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
    await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function updateOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    const data: UpdateOrderDto = req.body;
    
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });
    
    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    
    // Update order
    const order = await prisma.order.update({
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
    await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
}

export async function deleteOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    // Check if order exists
    const order = await prisma.order.findUnique({
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
    await prisma.order.delete({
      where: { id },
    });
    
    // Log audit
    await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
}

export async function getOrderStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [
      totalOrders,
      ordersByStatus,
      recentOrders,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { companyName: true },
          },
        },
      }),
      prisma.order.aggregate({
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
      }, {} as Record<string, number>),
      recentOrders,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
}
