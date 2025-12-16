import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

const prisma = new PrismaClient();

// Get all customers with pagination
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const { search, country, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (country) {
      where.country = country as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
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
      prisma.customer.count({ where }),
    ]);

    res.json(buildPaginatedResponse(customers, total, page, limit));
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get single customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
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
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create new customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const customer = await prisma.customer.create({
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: customer.id,
        details: { name: customer.name, email: customer.email },
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CUSTOMER_UPDATED',
        entityType: 'Customer',
        entityId: customer.id,
        details: { changes: data },
      },
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has orders
    if (existingCustomer._count.orders > 0) {
      // Soft delete by deactivating
      await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({ message: 'Customer deactivated (has existing orders)' });
    }

    // Hard delete if no orders
    await prisma.customer.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CUSTOMER_DELETED',
        entityType: 'Customer',
        entityId: id,
        details: { name: existingCustomer.name },
      },
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Get customer order history
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id },
        skip,
        take,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { customerId: id } }),
    ]);

    res.json(buildPaginatedResponse(orders, total, page, limit));
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
};

// Get customer statistics
export const getCustomerStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
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
    const totalRevenue = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = customer.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get orders by month (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const ordersByMonth = customer.orders
      .filter(order => order.createdAt >= twelveMonthsAgo)
      .reduce((acc, order) => {
        const month = order.createdAt.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    res.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByMonth,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
};

// Get countries list (for filtering)
export const getCountries = async (_req: Request, res: Response) => {
  try {
    const countries = await prisma.customer.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });

    res.json(countries.map(c => c.country).filter(Boolean));
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};
