import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

const prisma = new PrismaClient();

// Get all suppliers with pagination
export const getSuppliers = async (req: Request, res: Response) => {
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

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { inventoryItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json(buildPaginatedResponse(suppliers, total, page, limit));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

// Get single supplier by ID
export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            unitPrice: true,
          },
        },
        _count: {
          select: { inventoryItems: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

// Create new supplier
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const supplier = await prisma.supplier.create({
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SUPPLIER_CREATED',
        entityType: 'Supplier',
        entityId: supplier.id,
        details: { name: supplier.name, email: supplier.email },
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SUPPLIER_UPDATED',
        entityType: 'Supplier',
        entityId: supplier.id,
        details: { changes: data },
      },
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// Delete supplier
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { inventoryItems: true } } },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier has inventory items
    if (existingSupplier._count.inventoryItems > 0) {
      // Soft delete by deactivating
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({ message: 'Supplier deactivated (has linked inventory items)' });
    }

    // Hard delete if no inventory items
    await prisma.supplier.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SUPPLIER_DELETED',
        entityType: 'Supplier',
        entityId: id,
        details: { name: existingSupplier.name },
      },
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};

// Get supplier inventory items
export const getSupplierItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { supplierId: id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where: { supplierId: id } }),
    ]);

    res.json(buildPaginatedResponse(items, total, page, limit));
  } catch (error) {
    console.error('Error fetching supplier items:', error);
    res.status(500).json({ error: 'Failed to fetch supplier items' });
  }
};

// Get supplier statistics
export const getSupplierStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          select: {
            quantity: true,
            unitPrice: true,
            type: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const totalItems = supplier.inventoryItems.length;
    const totalValue = supplier.inventoryItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const itemsByType = supplier.inventoryItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalItems,
      totalValue,
      itemsByType,
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({ error: 'Failed to fetch supplier statistics' });
  }
};

// Get supplier countries list
export const getSupplierCountries = async (_req: Request, res: Response) => {
  try {
    const countries = await prisma.supplier.findMany({
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
