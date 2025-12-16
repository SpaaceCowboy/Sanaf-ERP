import PDFDocument from 'pdfkit';
import { Order, OrderItem, Customer } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Company info from environment
const companyInfo = {
  name: process.env.COMPANY_NAME || 'Electronic Industries Ltd.',
  address: process.env.COMPANY_ADDRESS || '123 Industrial Zone, Tech City',
  phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
  email: process.env.COMPANY_EMAIL || 'contact@electroindustries.com',
  website: process.env.COMPANY_WEBSITE || 'www.electroindustries.com',
  taxId: process.env.COMPANY_TAX_ID || 'TAX-123456789',
  bankName: process.env.COMPANY_BANK_NAME || 'International Business Bank',
  bankAccount: process.env.COMPANY_BANK_ACCOUNT || '****4567',
  bankSwift: process.env.COMPANY_BANK_SWIFT || 'IBBKUS33',
};

type OrderWithRelations = Order & {
  customer: Customer;
  items: OrderItem[];
};

// Helper function to draw table
function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  startX: number,
  startY: number,
  colWidths: number[]
) {
  const rowHeight = 25;
  let y = startY;

  // Draw header background
  doc.fillColor('#1a365d').rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();

  // Draw header text
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 5, y + 8, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });

  y += rowHeight;

  // Draw rows
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
  rows.forEach((row, rowIndex) => {
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.fillColor('#f7fafc').rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
    }

    doc.fillColor('#1a1a1a');
    x = startX;
    row.forEach((cell, i) => {
      doc.text(cell, x + 5, y + 8, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  // Draw border
  doc.strokeColor('#e2e8f0').lineWidth(0.5);
  doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), y - startY).stroke();

  return y;
}

// Generate Invoice PDF
export async function generateInvoicePdf(
  order: OrderWithRelations,
  invoiceNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `invoice-${invoiceNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header with company branding
    doc.fillColor('#1a365d').fontSize(24).font('Helvetica-Bold').text(companyInfo.name, 50, 50);
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(companyInfo.address, 50, 80)
      .text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, 50, 95)
      .text(`Tax ID: ${companyInfo.taxId}`, 50, 110);

    // Invoice title
    doc.fillColor('#1a365d').fontSize(28).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoiceNumber}`, 400, 85, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, 400, 100, { align: 'right' })
      .text(`Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 400, 115, { align: 'right' });

    // Divider
    doc.strokeColor('#e2e8f0').lineWidth(2).moveTo(50, 140).lineTo(545, 140).stroke();

    // Bill To section
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 160);
    doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica')
      .text(order.customer.name, 50, 180)
      .text(order.customer.address || '', 50, 195)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 50, 210)
      .text(`Email: ${order.customer.email}`, 50, 225)
      .text(`Phone: ${order.customer.phone || 'N/A'}`, 50, 240);

    // Ship To section
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('SHIP TO:', 300, 160);
    doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica')
      .text(order.shippingAddress || order.customer.address || '', 300, 180)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 300, 195);

    // Order details
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text(`Order #: ${order.orderNumber}`, 300, 225)
      .text(`Payment Terms: ${order.paymentTerms || 'Net 30'}`, 300, 240);

    // Items table
    const headers = ['Item', 'Description', 'HS Code', 'Qty', 'Unit Price', 'Total'];
    const colWidths = [80, 150, 70, 40, 70, 85];
    const rows = order.items.map(item => [
      item.productName,
      item.description || '-',
      item.hsCode || '-',
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);

    const tableEndY = drawTable(doc, headers, rows, 50, 280, colWidths);

    // Totals section
    const totalsX = 380;
    let totalsY = tableEndY + 20;

    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text('Subtotal:', totalsX, totalsY)
      .text(`$${order.subtotal.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 20;
    doc.text('Tax:', totalsX, totalsY)
      .text(`$${order.tax.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 20;
    doc.text('Shipping:', totalsX, totalsY)
      .text(`$${order.shippingCost.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 25;
    doc.fillColor('#1a365d').fontSize(14).font('Helvetica-Bold')
      .text('TOTAL:', totalsX, totalsY)
      .text(`$${order.totalAmount.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    // Payment information
    const paymentY = totalsY + 60;
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('PAYMENT INFORMATION', 50, paymentY);
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text(`Bank: ${companyInfo.bankName}`, 50, paymentY + 20)
      .text(`Account: ${companyInfo.bankAccount}`, 50, paymentY + 35)
      .text(`SWIFT: ${companyInfo.bankSwift}`, 50, paymentY + 50);

    // Notes
    if (order.notes) {
      doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('Notes:', 50, paymentY + 80);
      doc.fillColor('#4a5568').fontSize(9).font('Helvetica').text(order.notes, 50, paymentY + 95, { width: 300 });
    }

    // Footer
    doc.fillColor('#718096').fontSize(8).font('Helvetica')
      .text('Thank you for your business!', 50, 750, { align: 'center', width: 495 })
      .text(`${companyInfo.website}`, 50, 765, { align: 'center', width: 495 });

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

// Generate Proforma Invoice PDF
export async function generateProformaInvoicePdf(
  order: OrderWithRelations,
  proformaNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `proforma-${proformaNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Similar structure to invoice but marked as PROFORMA
    doc.fillColor('#1a365d').fontSize(24).font('Helvetica-Bold').text(companyInfo.name, 50, 50);
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(companyInfo.address, 50, 80)
      .text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, 50, 95);

    // Proforma title with watermark effect
    doc.fillColor('#e53e3e').fontSize(28).font('Helvetica-Bold').text('PROFORMA INVOICE', 320, 50, { align: 'right' });
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(`Proforma #: ${proformaNumber}`, 400, 85, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, 400, 100, { align: 'right' })
      .text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 400, 115, { align: 'right' });

    doc.strokeColor('#e2e8f0').lineWidth(2).moveTo(50, 140).lineTo(545, 140).stroke();

    // Customer details
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('TO:', 50, 160);
    doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica')
      .text(order.customer.name, 50, 180)
      .text(order.customer.address || '', 50, 195)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 50, 210)
      .text(`Email: ${order.customer.email}`, 50, 225);

    // Items table
    const headers = ['Item', 'Description', 'HS Code', 'Qty', 'Unit Price', 'Total'];
    const colWidths = [80, 150, 70, 40, 70, 85];
    const rows = order.items.map(item => [
      item.productName,
      item.description || '-',
      item.hsCode || '-',
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);

    const tableEndY = drawTable(doc, headers, rows, 50, 260, colWidths);

    // Totals
    const totalsX = 380;
    let totalsY = tableEndY + 20;

    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text('Subtotal:', totalsX, totalsY)
      .text(`$${order.subtotal.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 20;
    doc.text('Estimated Tax:', totalsX, totalsY)
      .text(`$${order.tax.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 20;
    doc.text('Estimated Shipping:', totalsX, totalsY)
      .text(`$${order.shippingCost.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 25;
    doc.fillColor('#1a365d').fontSize(14).font('Helvetica-Bold')
      .text('ESTIMATED TOTAL:', totalsX - 50, totalsY)
      .text(`$${order.totalAmount.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    // Disclaimer
    doc.fillColor('#e53e3e').fontSize(9).font('Helvetica-Bold')
      .text('THIS IS NOT AN INVOICE', 50, totalsY + 50, { align: 'center', width: 495 });
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text('This proforma invoice is for reference purposes only. Final pricing may vary.', 50, totalsY + 65, { align: 'center', width: 495 });

    // Terms and conditions
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, totalsY + 100);
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text('• Prices are valid for 30 days from the date of this proforma', 50, totalsY + 115)
      .text('• Payment terms: 50% advance, 50% before shipment', 50, totalsY + 130)
      .text('• Delivery time: 4-6 weeks after order confirmation', 50, totalsY + 145)
      .text(`• Incoterms: ${order.incoterms || 'FOB'}`, 50, totalsY + 160);

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

// Generate Packing List PDF
export async function generatePackingListPdf(
  order: OrderWithRelations,
  packingNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `packing-list-${packingNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fillColor('#1a365d').fontSize(24).font('Helvetica-Bold').text(companyInfo.name, 50, 50);
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(companyInfo.address, 50, 80);

    doc.fillColor('#2d3748').fontSize(28).font('Helvetica-Bold').text('PACKING LIST', 350, 50, { align: 'right' });
    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(`Packing List #: ${packingNumber}`, 400, 85, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, 400, 100, { align: 'right' })
      .text(`Order #: ${order.orderNumber}`, 400, 115, { align: 'right' });

    doc.strokeColor('#e2e8f0').lineWidth(2).moveTo(50, 140).lineTo(545, 140).stroke();

    // Shipper and Consignee
    doc.fillColor('#1a365d').fontSize(11).font('Helvetica-Bold').text('SHIPPER:', 50, 160);
    doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
      .text(companyInfo.name, 50, 175)
      .text(companyInfo.address, 50, 188);

    doc.fillColor('#1a365d').fontSize(11).font('Helvetica-Bold').text('CONSIGNEE:', 300, 160);
    doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
      .text(order.customer.name, 300, 175)
      .text(order.shippingAddress || order.customer.address || '', 300, 188)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 300, 201);

    // Shipping details
    doc.fillColor('#1a365d').fontSize(11).font('Helvetica-Bold').text('SHIPPING DETAILS:', 50, 230);
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text(`Incoterms: ${order.incoterms || 'FOB'}`, 50, 245)
      .text(`Destination: ${order.destinationPort || 'TBD'}`, 50, 258)
      .text(`Origin: ${order.originPort || 'TBD'}`, 200, 258);

    // Items table with packing details
    const headers = ['Item #', 'Product', 'Description', 'Qty', 'Unit', 'Net Wt (kg)', 'Gross Wt (kg)'];
    const colWidths = [40, 100, 130, 40, 40, 70, 75];
    const rows = order.items.map((item, index) => [
      (index + 1).toString(),
      item.productName,
      item.description || '-',
      item.quantity.toString(),
      item.unit || 'PCS',
      ((item.quantity * 0.5).toFixed(2)), // Estimated net weight
      ((item.quantity * 0.6).toFixed(2))  // Estimated gross weight
    ]);

    const tableEndY = drawTable(doc, headers, rows, 50, 290, colWidths);

    // Package summary
    const summaryY = tableEndY + 30;
    doc.fillColor('#1a365d').fontSize(11).font('Helvetica-Bold').text('PACKAGE SUMMARY:', 50, summaryY);

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalNetWeight = order.items.reduce((sum, item) => sum + item.quantity * 0.5, 0);
    const totalGrossWeight = order.items.reduce((sum, item) => sum + item.quantity * 0.6, 0);

    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(`Total Packages: ${Math.ceil(totalItems / 10)}`, 50, summaryY + 20)
      .text(`Total Items: ${totalItems}`, 200, summaryY + 20)
      .text(`Total Net Weight: ${totalNetWeight.toFixed(2)} kg`, 50, summaryY + 40)
      .text(`Total Gross Weight: ${totalGrossWeight.toFixed(2)} kg`, 200, summaryY + 40)
      .text(`Dimensions: As per individual packages`, 50, summaryY + 60);

    // Special instructions
    if (order.notes) {
      doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('SPECIAL INSTRUCTIONS:', 50, summaryY + 100);
      doc.fillColor('#4a5568').fontSize(9).font('Helvetica').text(order.notes, 50, summaryY + 115, { width: 400 });
    }

    // Signature area
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text('Prepared by: _______________________', 50, 700)
      .text('Date: _______________________', 50, 720)
      .text('Checked by: _______________________', 300, 700)
      .text('Date: _______________________', 300, 720);

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

// Generate Commercial Invoice PDF
export async function generateCommercialInvoicePdf(
  order: OrderWithRelations,
  commercialInvoiceNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `commercial-invoice-${commercialInvoiceNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fillColor('#1a365d').fontSize(24).font('Helvetica-Bold').text(companyInfo.name, 50, 50);
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text(companyInfo.address, 50, 78)
      .text(`Tax ID: ${companyInfo.taxId}`, 50, 91);

    doc.fillColor('#c53030').fontSize(22).font('Helvetica-Bold').text('COMMERCIAL INVOICE', 300, 50, { align: 'right' });
    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text(`Invoice #: ${commercialInvoiceNumber}`, 400, 78, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, 400, 91, { align: 'right' })
      .text(`Order Ref: ${order.orderNumber}`, 400, 104, { align: 'right' });

    doc.strokeColor('#c53030').lineWidth(2).moveTo(50, 125).lineTo(545, 125).stroke();

    // Exporter and Importer
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('EXPORTER/SELLER:', 50, 140);
    doc.fillColor('#1a1a1a').fontSize(8).font('Helvetica')
      .text(companyInfo.name, 50, 153)
      .text(companyInfo.address, 50, 164)
      .text(`Tax ID: ${companyInfo.taxId}`, 50, 175);

    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('IMPORTER/BUYER:', 300, 140);
    doc.fillColor('#1a1a1a').fontSize(8).font('Helvetica')
      .text(order.customer.name, 300, 153)
      .text(order.customer.address || '', 300, 164)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 300, 175)
      .text(`Tax ID: ${order.customer.taxId || 'N/A'}`, 300, 186);

    // Shipping details
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('SHIPMENT DETAILS:', 50, 210);
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text(`Port of Loading: ${order.originPort || 'TBD'}`, 50, 223)
      .text(`Port of Discharge: ${order.destinationPort || 'TBD'}`, 200, 223)
      .text(`Incoterms: ${order.incoterms || 'FOB'}`, 350, 223)
      .text(`Country of Origin: ${process.env.COMPANY_COUNTRY || 'USA'}`, 50, 236)
      .text(`Final Destination: ${order.customer.country || 'TBD'}`, 200, 236)
      .text(`Payment Terms: ${order.paymentTerms || 'Net 30'}`, 350, 236);

    // Items table with HS codes
    const headers = ['Item', 'Description', 'HS Code', 'Origin', 'Qty', 'Unit Price', 'Total'];
    const colWidths = [70, 120, 70, 50, 35, 70, 80];
    const rows = order.items.map(item => [
      item.productName,
      item.description || '-',
      item.hsCode || '-',
      item.countryOfOrigin || process.env.COMPANY_COUNTRY || 'USA',
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);

    const tableEndY = drawTable(doc, headers, rows, 50, 260, colWidths);

    // Totals
    const totalsX = 380;
    let totalsY = tableEndY + 15;

    doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
      .text('FOB Value:', totalsX, totalsY)
      .text(`$${order.subtotal.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 15;
    doc.text('Freight:', totalsX, totalsY)
      .text(`$${order.shippingCost.toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 15;
    doc.text('Insurance:', totalsX, totalsY)
      .text(`$${(order.subtotal * 0.01).toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    totalsY += 20;
    doc.fillColor('#c53030').fontSize(12).font('Helvetica-Bold')
      .text('CIF VALUE:', totalsX, totalsY)
      .text(`$${(order.subtotal + order.shippingCost + order.subtotal * 0.01).toFixed(2)}`, totalsX + 80, totalsY, { align: 'right', width: 85 });

    // Declaration
    doc.fillColor('#1a365d').fontSize(9).font('Helvetica-Bold').text('DECLARATION:', 50, totalsY + 50);
    doc.fillColor('#4a5568').fontSize(7).font('Helvetica')
      .text('We declare that the invoice shows the actual price of the goods described and that all particulars are true and correct.', 50, totalsY + 63, { width: 300 })
      .text('The goods are of origin as stated above and comply with the origin rules of the importing country.', 50, totalsY + 85, { width: 300 });

    // Signature
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text('Authorized Signature: _______________________', 50, 700)
      .text(`Name: ${process.env.COMPANY_AUTHORIZED_NAME || 'Authorized Representative'}`, 50, 720)
      .text(`Title: ${process.env.COMPANY_AUTHORIZED_TITLE || 'Export Manager'}`, 50, 735)
      .text(`Date: ${new Date().toLocaleDateString()}`, 300, 700);

    // Stamp area
    doc.strokeColor('#e2e8f0').lineWidth(1)
      .rect(400, 695, 100, 50).stroke();
    doc.fillColor('#a0aec0').fontSize(7).text('COMPANY STAMP', 420, 715);

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

// Generate Certificate of Origin PDF
export async function generateCertificateOfOriginPdf(
  order: OrderWithRelations,
  certificateNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `certificate-origin-${certificateNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Border
    doc.strokeColor('#1a365d').lineWidth(3).rect(40, 40, 515, 712).stroke();
    doc.strokeColor('#1a365d').lineWidth(1).rect(45, 45, 505, 702).stroke();

    // Header
    doc.fillColor('#1a365d').fontSize(24).font('Helvetica-Bold')
      .text('CERTIFICATE OF ORIGIN', 50, 60, { align: 'center', width: 495 });

    doc.fillColor('#4a5568').fontSize(10).font('Helvetica')
      .text(`Certificate No: ${certificateNumber}`, 50, 95, { align: 'center', width: 495 });

    doc.strokeColor('#1a365d').lineWidth(1).moveTo(100, 115).lineTo(495, 115).stroke();

    // Exporter details
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('1. EXPORTER (Name, full address, country)', 60, 130);
    doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
      .text(companyInfo.name, 70, 145)
      .text(companyInfo.address, 70, 158);

    // Consignee details
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('2. CONSIGNEE (Name, full address, country)', 60, 190);
    doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
      .text(order.customer.name, 70, 205)
      .text(order.customer.address || '', 70, 218)
      .text(`${order.customer.city || ''}, ${order.customer.country || ''}`, 70, 231);

    // Transport details
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('3. MEANS OF TRANSPORT AND ROUTE', 60, 260);
    doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
      .text(`From: ${order.originPort || 'TBD'}`, 70, 275)
      .text(`To: ${order.destinationPort || 'TBD'}`, 70, 288)
      .text(`Terms: ${order.incoterms || 'FOB'}`, 70, 301);

    // Country of origin
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('4. COUNTRY OF ORIGIN', 320, 260);
    doc.fillColor('#1a1a1a').fontSize(12).font('Helvetica')
      .text(process.env.COMPANY_COUNTRY || 'UNITED STATES', 320, 280);

    // Country of destination
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('5. COUNTRY OF DESTINATION', 320, 310);
    doc.fillColor('#1a1a1a').fontSize(12).font('Helvetica')
      .text(order.customer.country || 'TBD', 320, 330);

    // Goods description
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('6. DESCRIPTION OF GOODS', 60, 360);

    let goodsY = 380;
    order.items.forEach((item, index) => {
      doc.fillColor('#1a1a1a').fontSize(9).font('Helvetica')
        .text(`${index + 1}. ${item.productName}`, 70, goodsY)
        .text(`HS Code: ${item.hsCode || 'N/A'}`, 280, goodsY)
        .text(`Qty: ${item.quantity} ${item.unit || 'PCS'}`, 400, goodsY);
      goodsY += 20;
    });

    // Certification statement
    doc.fillColor('#1a365d').fontSize(10).font('Helvetica-Bold').text('7. CERTIFICATION', 60, 520);
    doc.fillColor('#1a1a1a').fontSize(8).font('Helvetica')
      .text('The undersigned hereby declares that the above details and statements are correct, that all the goods were produced in', 70, 540, { width: 420 })
      .text(`${process.env.COMPANY_COUNTRY || 'UNITED STATES'} and that they comply with the origin requirements specified for those goods.`, 70, 565, { width: 420 });

    // Signature blocks
    doc.strokeColor('#e2e8f0').lineWidth(1).rect(60, 620, 200, 80).stroke();
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text('Signature of Exporter:', 70, 630)
      .text('Name: _______________________', 70, 665)
      .text('Date: _______________________', 70, 680);

    doc.strokeColor('#e2e8f0').lineWidth(1).rect(290, 620, 200, 80).stroke();
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
      .text('Certification Authority:', 300, 630)
      .text('Stamp & Signature:', 300, 655)
      .text('Date: _______________________', 300, 680);

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export default {
  generateInvoicePdf,
  generateProformaInvoicePdf,
  generatePackingListPdf,
  generateCommercialInvoicePdf,
  generateCertificateOfOriginPdf,
};
