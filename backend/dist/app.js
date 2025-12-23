"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const orders_1 = __importDefault(require("./routes/orders"));
const projects_1 = __importDefault(require("./routes/projects"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const documents_1 = __importDefault(require("./routes/documents"));
const reports_1 = __importDefault(require("./routes/reports"));
const users_1 = __importDefault(require("./routes/users"));
const customers_1 = __importDefault(require("./routes/customers"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
// Initialize Express app
const app = (0, express_1.default)();
// ==================== MIDDLEWARE ====================
// Security headers
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Static files for documents
app.use('/documents', express_1.default.static(path_1.default.join(process.cwd(), 'documents')));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ==================== ROUTES ====================
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/suppliers', suppliers_1.default);
// ==================== ERROR HANDLING ====================
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database operation failed',
            message: err.message,
        });
    }
    // Validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err,
        });
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});
// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    const port = PORT.toString().padEnd(5);
    const env = (process.env.NODE_ENV || 'development').padEnd(11);
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🏭 SANAF ERP Backend Server                     ║
║                                                   ║
║   Server: http://localhost:${port}                   ║
║   Environment: ${env}           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
exports.default = app;
//# sourceMappingURL=app.js.map