import { Order, OrderItem, Customer } from '@prisma/client';
type OrderWithRelations = Order & {
    customer: Customer;
    items: OrderItem[];
};
export declare function generateInvoicePdf(order: OrderWithRelations, invoiceNumber: string): Promise<string>;
export declare function generateProformaInvoicePdf(order: OrderWithRelations, proformaNumber: string): Promise<string>;
export declare function generatePackingListPdf(order: OrderWithRelations, packingNumber: string): Promise<string>;
export declare function generateCommercialInvoicePdf(order: OrderWithRelations, commercialInvoiceNumber: string): Promise<string>;
export declare function generateCertificateOfOriginPdf(order: OrderWithRelations, certificateNumber: string): Promise<string>;
declare const _default: {
    generateInvoicePdf: typeof generateInvoicePdf;
    generateProformaInvoicePdf: typeof generateProformaInvoicePdf;
    generatePackingListPdf: typeof generatePackingListPdf;
    generateCommercialInvoicePdf: typeof generateCommercialInvoicePdf;
    generateCertificateOfOriginPdf: typeof generateCertificateOfOriginPdf;
};
export default _default;
//# sourceMappingURL=pdfService.d.ts.map