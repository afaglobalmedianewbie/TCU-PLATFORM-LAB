// routes/network.js
'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../modules/db');
const { requireAuth, requireRole } = require('../modules/auth-middleware');

// GET /api/network/sessions — active RADIUS sessions
router.get('/sessions', requireAuth, requireRole(['ADMIN', 'NOC']), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, username } = req.query;
    const where = { stopTime: null };
    if (username) where.username = { contains: username };

    const [sessions, total] = await Promise.all([
      prisma.radiusSession.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { startTime: 'desc' }
      }),
      prisma.radiusSession.count({ where })
    ]);
    res.json({ data: sessions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/network/stats — aggregate traffic stats
router.get('/stats', requireAuth, requireRole(['ADMIN', 'NOC']), async (req, res, next) => {
  try {
    const [activeSessions, offlineDevices, onlineDevices] = await Promise.all([
      prisma.radiusSession.count({ where: { stopTime: null } }),
      prisma.device.count({ where: { status: 'OFFLINE' } }),
      prisma.device.count({ where: { status: 'ONLINE' } })
    ]);
    res.json({ activeSessions, offlineDevices, onlineDevices, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
