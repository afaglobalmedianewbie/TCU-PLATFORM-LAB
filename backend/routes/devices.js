// routes/devices.js
'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../modules/db');
const { requireAuth, requireRole } = require('../modules/auth-middleware');
const { logAudit, AUDIT_ACTIONS } = require('../modules/audit');
const { validateBody, registerDeviceSchema, addDiagnosticSchema } = require('../modules/validate');

// GET /api/devices
router.get('/', requireAuth, requireRole(['ADMIN', 'NOC', 'TECHNICIAN']), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: { customer: { select: { fullName: true } } },
        orderBy: { lastSeenAt: 'desc' }
      }),
      prisma.device.count({ where })
    ]);
    res.json({ data: devices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id
router.get('/:id', requireAuth, requireRole(['ADMIN', 'NOC', 'TECHNICIAN']), async (req, res, next) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: { customer: true, diagnostics: { take: 10, orderBy: { collectedAt: 'desc' } } }
    });
    if (!device) return res.status(404).json({ error: 'Device tidak ditemukan', code: 'NOT_FOUND' });
    res.json(device);
  } catch (err) {
    next(err);
  }
});

// GET /api/devices/:id/diagnostics
router.get('/:id/diagnostics', requireAuth, requireRole(['ADMIN', 'NOC', 'TECHNICIAN']), async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const diagnostics = await prisma.deviceDiagnostic.findMany({
      where: { deviceId: req.params.id },
      take: parseInt(limit),
      orderBy: { collectedAt: 'desc' }
    });
    res.json(diagnostics);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/devices/:id
router.patch('/:id', requireAuth, requireRole(['ADMIN', 'TECHNICIAN']), async (req, res, next) => {
  try {
    const { status, ipAddress, firmwareVer } = req.body;
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(ipAddress && { ipAddress }), ...(firmwareVer && { firmwareVer }) }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.DEVICE_UPDATED, resource: 'Device', resourceId: req.params.id, ipAddress: req.ip });
    res.json(device);
  } catch (err) {
    next(err);
  }
});

// POST /api/devices — register new device
router.post('/', requireAuth, requireRole(['ADMIN', 'TECHNICIAN']), validateBody(registerDeviceSchema), async (req, res, next) => {
  try {
    const device = await prisma.device.create({
      data: { ...req.body, status: 'OFFLINE' },
      include: { customer: { select: { fullName: true } } }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.DEVICE_REGISTERED, resource: 'Device', resourceId: device.id, ipAddress: req.ip });
    res.status(201).json(device);
  } catch (err) {
    next(err);
  }
});

// POST /api/devices/:id/diagnostics — submit diagnostic reading
router.post('/:id/diagnostics', requireAuth, requireRole(['ADMIN', 'NOC', 'TECHNICIAN']), validateBody(addDiagnosticSchema), async (req, res, next) => {
  try {
    const diagnostic = await prisma.deviceDiagnostic.create({
      data: { deviceId: req.params.id, ...req.body }
    });

    // Tentukan status berdasarkan data diagnostik:
    // - Jika rx_power < threshold → DEGRADED, biarkan device-sync-worker menangani lebih lanjut
    // - Jika tidak ada indikasi degraded → ONLINE
    const DEGRADED_RX_THRESHOLD = parseFloat(process.env.ONU_DEGRADED_RX_DBM || '-28');
    const isDegraded = req.body.rxPowerDbm !== undefined && req.body.rxPowerDbm < DEGRADED_RX_THRESHOLD;
    const newStatus = isDegraded ? 'DEGRADED' : 'ONLINE';

    await prisma.device.update({
      where: { id: req.params.id },
      data: { lastSeenAt: new Date(), status: newStatus }
    });

    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.DIAGNOSTIC_ADDED, resource: 'Device', resourceId: req.params.id, ipAddress: req.ip });
    res.status(201).json(diagnostic);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
