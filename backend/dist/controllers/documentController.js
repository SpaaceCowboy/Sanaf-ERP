"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocuments = getDocuments;
exports.getDocumentById = getDocumentById;
exports.generateInvoice = generateInvoice;
exports.downloadDocument = downloadDocument;
exports.deleteDocument = deleteDocument;
exports.regenerateDocument = regenerateDocument;
exports.getDocumentTypes = getDocumentTypes;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const pdfService_1 = require("../services/pdfService");
const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || './documents';
// Ensure documents directory exists
if (!fs_1.default.existsSync(DOCUMENTS_DIR)) {
    fs_1.default.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}
async function getDocuments(req, res) {
    try {
        const { type, orderId } = req.query;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const where = {};
        if (type) {
            where.type = type;
        }
        if (orderId) {
            where.orderId = orderId;
        }
        const [documents, total] = await Promise.all([
            database_1.default.document.findMany({
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
            database_1.default.document.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(documents, total, paginationParams));
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
}
async function getDocumentById(req, res) {
    try {
        const { id } = req.params;
        const document = await database_1.default.document.findUnique({
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
    }
    catch (error) {
        console.error('Get document by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
}
async function generateInvoice(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { orderId } = req.params;
        const { type = 'INVOICE' } = req.body;
        // Get order with all details
        const order = await database_1.default.order.findUnique({
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
        const documentNumber = (0, helpers_1.generateDocumentNumber)(type);
        const fileName = `${documentNumber}.pdf`;
        const filePath = path_1.default.join(DOCUMENTS_DIR, fileName);
        // Generate PDF based on type
        let pdfBuffer;
        switch (type) {
            case 'INVOICE':
            case 'PROFORMA_INVOICE':
                pdfBuffer = await (0, pdfService_1.generateInvoicePdf)(order, documentNumber, type === 'PROFORMA_INVOICE');
                break;
            case 'PACKING_LIST':
                pdfBuffer = await (0, pdfService_1.generatePackingListPdf)(order, documentNumber);
                break;
            case 'COMMERCIAL_INVOICE':
                pdfBuffer = await (0, pdfService_1.generateCommercialInvoicePdf)(order, documentNumber);
                break;
            default:
                res.status(400).json({ error: 'Invalid document type' });
                return;
        }
        // Save PDF to disk
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        // Create document record
        const document = await database_1.default.document.create({
            data: {
                documentNumber,
                type: type,
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
        await database_1.default.auditLog.create({
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
    }
    catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ error: 'Failed to generate document' });
    }
}
async function downloadDocument(req, res) {
    try {
        const { id } = req.params;
        const document = await database_1.default.document.findUnique({
            where: { id },
        });
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        // Check if file exists
        if (!fs_1.default.existsSync(document.filePath)) {
            res.status(404).json({ error: 'Document file not found' });
            return;
        }
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.setHeader('Content-Length', document.fileSize);
        const fileStream = fs_1.default.createReadStream(document.filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
}
async function deleteDocument(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        const document = await database_1.default.document.findUnique({
            where: { id },
        });
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        // Delete file if exists
        if (fs_1.default.existsSync(document.filePath)) {
            fs_1.default.unlinkSync(document.filePath);
        }
        // Delete record
        await database_1.default.document.delete({
            where: { id },
        });
        // Log audit
        await database_1.default.auditLog.create({
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
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
}
async function regenerateDocument(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { id } = req.params;
        const existingDoc = await database_1.default.document.findUnique({
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
        if (fs_1.default.existsSync(existingDoc.filePath)) {
            fs_1.default.unlinkSync(existingDoc.filePath);
        }
        await database_1.default.document.delete({ where: { id } });
        // Forward to generate with same type
        req.params.orderId = existingDoc.orderId;
        req.body.type = existingDoc.type;
        await generateInvoice(req, res);
    }
    catch (error) {
        console.error('Regenerate document error:', error);
        res.status(500).json({ error: 'Failed to regenerate document' });
    }
}
async function getDocumentTypes(req, res) {
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
    }
    catch (error) {
        console.error('Get document types error:', error);
        res.status(500).json({ error: 'Failed to fetch document types' });
    }
}
//# sourceMappingURL=documentController.js.map