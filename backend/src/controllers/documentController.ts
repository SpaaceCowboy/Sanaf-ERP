import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database.js';
import { AuthenticatedRequest, PaginationParams } from '../types/index.js';
import { generateDocumentNumber, parsePagination, buildPaginatedResponse, formatCurrency, formatDate } from '../utils/helpers.js';
import { generateInvoicePdf, generatePackingListPdf, generateCommercialInvoicePdf } from '../services/pdfService.js';

const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || './documents';

// Ensure documents directory exists
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

export async function getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { type, orderId } = req.query;
    const paginationParams: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    
    const { skip, take } = parsePagination(paginationParams);
    
    const where: Record<string, unknown> = {};
    
    if (type) {
      where.type = type;
    }
    
    if (orderId) {
      where.orderId = orderId;
    }
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: { companyName: true },
              },
            },
          },
          generatedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);
    
    res.json(buildPaginatedResponse(documents, total, paginationParams));
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: true,
          },
        },
        generatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    res.json(document);
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
}

export async function generateInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { orderId } = req.params;
    const { type = 'INVOICE' } = req.body;
    
    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    
    // Generate document number
    const documentNumber = generateDocumentNumber(type);
    const fileName = `${documentNumber}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);
    
    // Generate PDF based on type
    let pdfBuffer: Buffer;
    
    switch (type) {
      case 'INVOICE':
      case 'PROFORMA_INVOICE':
        pdfBuffer = await generateInvoicePdf(order, documentNumber, type === 'PROFORMA_INVOICE');
        break;
      case 'PACKING_LIST':
        pdfBuffer = await generatePackingListPdf(order, documentNumber);
        break;
      case 'COMMERCIAL_INVOICE':
        pdfBuffer = await generateCommercialInvoicePdf(order, documentNumber);
        break;
      default:
        res.status(400).json({ error: 'Invalid document type' });
        return;
    }
    
    // Save PDF to disk
    fs.writeFileSync(filePath, pdfBuffer);
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        documentNumber,
        type: type as 'INVOICE' | 'PROFORMA_INVOICE' | 'PACKING_LIST' | 'COMMERCIAL_INVOICE',
        orderId: order.id,
        generatedById: req.user.userId,
        fileName,
        filePath,
        fileSize: pdfBuffer.length,
        metadata: {
          orderNumber: order.orderNumber,
          customerName: order.customer.companyName,
          totalAmount: order.totalAmount.toString(),
        },
      },
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'GENERATE',
        entity: 'Document',
        entityId: document.id,
        newValues: {
          type,
          documentNumber,
          orderId: order.id,
        },
      },
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
}

export async function downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      res.status(404).json({ error: 'Document file not found' });
      return;
    }
    
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    // Delete file if exists
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete record
    await prisma.document.delete({
      where: { id },
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        entity: 'Document',
        entityId: id,
        oldValues: {
          documentNumber: document.documentNumber,
          type: document.type,
        },
      },
    });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

export async function regenerateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    const existingDoc = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!existingDoc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    if (!existingDoc.orderId) {
      res.status(400).json({ error: 'Cannot regenerate document without order' });
      return;
    }
    
    // Delete old document
    if (fs.existsSync(existingDoc.filePath)) {
      fs.unlinkSync(existingDoc.filePath);
    }
    
    await prisma.document.delete({ where: { id } });
    
    // Forward to generate with same type
    req.params.orderId = existingDoc.orderId;
    req.body.type = existingDoc.type;
    
    await generateInvoice(req, res);
  } catch (error) {
    console.error('Regenerate document error:', error);
    res.status(500).json({ error: 'Failed to regenerate document' });
  }
}

export async function getDocumentTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const types = [
      { value: 'INVOICE', label: 'Invoice', description: 'Standard sales invoice' },
      { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice', description: 'Pre-shipment invoice' },
      { value: 'PACKING_LIST', label: 'Packing List', description: 'Shipment contents list' },
      { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice', description: 'For customs clearance' },
      { value: 'BILL_OF_LADING', label: 'Bill of Lading', description: 'Shipping document' },
      { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin', description: 'Country of origin certification' },
      { value: 'EXPORT_LICENSE', label: 'Export License', description: 'Export authorization' },
      { value: 'CUSTOMS_DECLARATION', label: 'Customs Declaration', description: 'Customs clearance form' },
    ];
    
    res.json(types);
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({ error: 'Failed to fetch document types' });
  }
}
