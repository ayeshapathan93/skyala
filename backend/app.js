const express = require('express');
const cors = require('cors');

const productRoutes = require('./modules/inventory/product.route');
const stockRoutes = require('./modules/stock/stock.route');
const customerRoutes = require('./modules/customers/customer.route');
const invoiceCrudRoutes = require('./modules/invoices/invoice.route');
const dashboardRoutes = require('./modules/dashboard/dashboard.route');
const transactionRoutes = require('./modules/transactions/transaction.route');
const reportsRoutes = require('./modules/reports/reports.route');
const expensesRoutes = require('./modules/expenses/expenses.route');

const billRoutes = require('./routes/billRoutes');
const invoicePdfRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const customerSummaryRoutes = require('./routes/customerSummaryRoutes');
const { protect } = require('./middleware/authMiddleware');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ----- Core Middleware -----
// Parse allowed origins from environment variable or use defaults
const getAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://skyala.vercel.app',
  ];

  // If FRONTEND_URL is set, parse it (comma-separated values)
  if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',')
      .map((url) => url.trim())
      .filter((url) => url);
    // Combine with defaults, removing duplicates
    return [...new Set([...defaultOrigins, ...envOrigins])];
  }

  return defaultOrigins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ----- Health Check -----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Debug: list mounted route bases (helps confirm you're hitting the right backend)
app.get('/api/routes', (req, res) => {
  const stack = app._router?.stack || [];
  const routes = stack
    .filter((layer) => layer && layer.name === 'router' && layer.regexp)
    .map((layer) => String(layer.regexp));
  res.json({ success: true, routes });
});

// ----- Routes -----
app.use('/api/auth', authRoutes);
app.use('/api/products', protect, productRoutes);
app.use('/api/stock', protect, stockRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/invoices', protect, invoiceCrudRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/reports', protect, reportsRoutes);
app.use('/api/expenses', protect, expensesRoutes);
app.use('/api', protect, transactionRoutes);

// Legacy/Existing endpoints kept for now
app.use('/api/bills', protect, billRoutes);
app.use('/api/generate-bill', invoicePdfRoutes);
app.use('/generate-bill', invoicePdfRoutes); // alias: POST /generate-bill
app.use('/api/customer-summary', customerSummaryRoutes);

// ----- Error Handling -----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
