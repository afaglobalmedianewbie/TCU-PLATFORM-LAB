// routes/customers.js
'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../modules/db');
const { requireAuth, requireRole } = require('../modules/auth-middleware');
const { logAudit, AUDIT_ACTIONS } = require('../modules/audit');
const { validateBody, createCustomerSchema, updateCustomerSchema } = require('../modules/validate');

// GET /api/customers
router.get('/', requireAuth, requireRole(['ADMIN', 'NOC', 'TECHNICIAN']), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: { plan: true, user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);
    res.json({ data: customers, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { plan: true, devices: true, invoices: { take: 5, orderBy: { createdAt: 'desc' } } }
    });
    if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan', code: 'NOT_FOUND' });

    // CUSTOMER role hanya boleh melihat data miliknya sendiri
    if (req.user.role === 'CUSTOMER' && customer.userId !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak', code: 'FORBIDDEN' });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/:id
router.patch('/:id', requireAuth, requireRole(['ADMIN', 'NOC']), validateBody(updateCustomerSchema), async (req, res, next) => {
  try {
    const { fullName, phone, address, status, planId } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { ...(fullName && { fullName }), ...(phone && { phone }), ...(address && { address }), ...(status && { status }), ...(planId && { planId }) }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.UPDATE, resource: 'Customer', resourceId: req.params.id, ipAddress: req.ip });
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// POST /api/customers
router.post('/', requireAuth, requireRole(['ADMIN', 'NOC']), validateBody(createCustomerSchema), async (req, res, next) => {
  try {
    const { userId, fullName, phone, address, planId } = req.body;
    const customer = await prisma.customer.create({
      data: { userId, fullName, phone, address, planId, status: 'ACTIVE' },
      include: { plan: true, user: { select: { email: true } } }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.CREATE, resource: 'Customer', resourceId: customer.id, ipAddress: req.ip });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id — soft delete (set status TERMINATED)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { status: 'TERMINATED' }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.DELETE, resource: 'Customer', resourceId: req.params.id, ipAddress: req.ip });
    res.json({ message: 'Pelanggan dinonaktifkan', id: customer.id, status: customer.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
