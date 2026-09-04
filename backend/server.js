// TCU-PLATFORM-V10 Backend API Server
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createLogger, format, transports } = require('winston');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const billingRoutes = require('./routes/billing');
const deviceRoutes = require('./routes/devices');
const networkRoutes = require('./routes/network');
const healthRoutes = require('./routes/health');

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'production';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()]
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/network', networkRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ message: err.message, stack: err.stack, path: req.path });
  res.status(err.status || 500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ message: `TCU Backend API started`, port: PORT, env: NODE_ENV });
});

module.exports = app;
