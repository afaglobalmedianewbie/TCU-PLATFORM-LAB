// routes/health.js
'use strict';

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { prisma } = require('../modules/db');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'tcu-backend', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message });
  }
});

module.exports = router;
