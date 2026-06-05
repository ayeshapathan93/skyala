require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { protect } = require('./middlewares/auth.middleware');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const setupSwagger = require('./config/swagger');
const logger = require('./config/logger');
const authService = require('./services/auth.service');
const billService = require('./services/bill.service');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const stockRoutes = require('./routes/stock.routes');
const billRoutes = require('./routes/bill.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authController = require('./controllers/auth.controller');
const validate = require('./middlewares/validate.middleware');
const { setupSchema } = require('./validators/auth.validator');

const app = express();

const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const frameAncestors = ["'self'", ...corsOrigins];
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors,
      },
    },
  })
);
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(apiLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SKYLA API is running', timestamp: new Date().toISOString() });
});

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.get('/api/auth/me', protect, authController.me);
app.get('/api/auth/business', protect, authController.getProfile);
app.put('/api/auth/business', protect, validate(setupSchema), authController.updateProfile);

app.use('/api/customers', protect, customerRoutes);
app.use('/api/products', protect, productRoutes);
app.use('/api/stock', protect, stockRoutes);
app.use('/api/bills', protect, billRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);

// Legacy alias for invoice PDF generation
app.get('/api/invoices/:id/pdf', protect, require('./controllers/bill.controller').downloadPdf);
app.get('/api/invoices/:id/html', protect, require('./controllers/bill.controller').getHtml);

app.use(notFound);
app.use(errorHandler);

app.onReady = async () => {
  await authService.seedAdminUser();
  await billService.ensureBillingIndexes();
  logger.info('SKYLA application ready');
};

module.exports = app;
