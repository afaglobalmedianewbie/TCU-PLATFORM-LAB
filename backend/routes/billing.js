// routes/billing.js
'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../modules/db');
const { requireAuth, requireRole } = require('../modules/auth-middleware');
const { logAudit, AUDIT_ACTIONS } = require('../modules/audit');
const { validateBody, createInvoiceSchema, createPlanSchema, updatePlanSchema } = require('../modules/validate');
const midtrans = require('../modules/midtrans');
const xendit = require('../modules/xendit');
const notifier = require('../modules/notifier');
const { unIsolirUser } = require('../modules/radius-coa');

// GET /api/billing/invoices
router.get('/invoices', requireAuth, requireRole(['ADMIN', 'NOC']), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: { customer: { select: { fullName: true } }, plan: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);
    res.json({ data: invoices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/invoices/:id
router.get('/invoices/:id', requireAuth, async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { customer: true, plan: true, payments: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan', code: 'NOT_FOUND' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/invoices/:id/pay
router.post('/invoices/:id/pay', requireAuth, requireRole(['ADMIN', 'NOC']), async (req, res, next) => {
  try {
    const { amountIdr, method, reference } = req.body;
    if (!amountIdr || !method) {
      return res.status(400).json({ error: 'amountIdr dan method diperlukan', code: 'VALIDATION_ERROR' });
    }

    // Validasi status invoice — hanya UNPAID atau OVERDUE yang bisa dibayar
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!existing) return res.status(404).json({ error: 'Invoice tidak ditemukan', code: 'NOT_FOUND' });
    if (!['UNPAID', 'OVERDUE'].includes(existing.status)) {
      return res.status(409).json({ error: `Invoice tidak dapat dibayar: status saat ini ${existing.status}`, code: 'INVOICE_NOT_PAYABLE' });
    }

    const [payment, invoice] = await prisma.$transaction([
      prisma.payment.create({
        data: { invoiceId: req.params.id, amountIdr: parseInt(amountIdr), method, reference }
      }),
      prisma.invoice.update({
        where: { id: req.params.id, status: { in: ['UNPAID', 'OVERDUE'] } },
        data: { status: 'PAID', paidAt: new Date() }
      })
    ]);

    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.PAYMENT, resource: 'Invoice', resourceId: req.params.id, metadata: { method, amountIdr }, ipAddress: req.ip });
    res.status(201).json({ payment, invoice });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/invoices — create invoice manually
router.post('/invoices', requireAuth, requireRole(['ADMIN', 'NOC']), validateBody(createInvoiceSchema), async (req, res, next) => {
  try {
    const { customerId, planId, amountIdr, dueDate, periodStart, periodEnd } = req.body;
    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        planId,
        amountIdr,
        status: 'UNPAID',
        dueDate: new Date(dueDate),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
      include: { customer: { select: { fullName: true } }, plan: { select: { name: true } } }
    });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.INVOICE_CREATED, resource: 'Invoice', resourceId: invoice.id, ipAddress: req.ip });
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/plans
router.get('/plans', requireAuth, async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceIdr: 'asc' } });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/plans
router.post('/plans', requireAuth, requireRole(['ADMIN']), validateBody(createPlanSchema), async (req, res, next) => {
  try {
    const plan = await prisma.plan.create({ data: { ...req.body, isActive: true } });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.PLAN_CREATED, resource: 'Plan', resourceId: plan.id, ipAddress: req.ip });
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/billing/plans/:id
router.patch('/plans/:id', requireAuth, requireRole(['ADMIN']), validateBody(updatePlanSchema), async (req, res, next) => {
  try {
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
    await logAudit({ userId: req.user.id, action: AUDIT_ACTIONS.PLAN_UPDATED, resource: 'Plan', resourceId: plan.id, ipAddress: req.ip });
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/invoices/:id/checkout — Generate Payment Gateway Link
router.post('/invoices/:id/checkout', requireAuth, async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { customer: { include: { user: true } }, plan: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan', code: 'NOT_FOUND' });
    if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice sudah lunas', code: 'ALREADY_PAID' });

    // Cek gateway aktif dari pengaturan
    const activeGw = await prisma.systemSetting.findUnique({ where: { key: 'ACTIVE_PAYMENT_GATEWAY' } });
    const gateway = activeGw ? activeGw.value : 'MIDTRANS';

    let paymentResult = null;
    if (gateway === 'XENDIT') {
      paymentResult = await xendit.createXenditInvoice(invoice, invoice.customer);
      return res.json({ gateway: 'XENDIT', paymentUrl: paymentResult.invoiceUrl, id: paymentResult.id });
    } else {
      // Default: Midtrans Snap
      paymentResult = await midtrans.createSnapTransaction(invoice, invoice.customer);
      return res.json({ gateway: 'MIDTRANS', token: paymentResult.token, paymentUrl: paymentResult.redirectUrl });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/webhook/midtrans — Realtime Callback from Midtrans
router.post('/webhook/midtrans', async (req, res, next) => {
  try {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, payment_type } = req.body;

    const midConfig = await midtrans.getMidtransConfig();
    const isValid = midtrans.verifySignature(order_id, status_code, gross_amount, signature_key, midConfig.serverKey);
    if (!isValid) {
      console.warn(`[Webhook-Midtrans] Invalid Signature untuk order_id: ${order_id}`);
      return res.status(403).json({ error: 'Invalid signature', code: 'FORBIDDEN' });
    }

    if (['capture', 'settlement'].includes(transaction_status)) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: order_id },
        include: { customer: { include: { user: true } }, plan: true }
      });

      if (invoice && invoice.status !== 'PAID') {
        const [payment] = await prisma.$transaction([
          prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amountIdr: Math.round(parseFloat(gross_amount)),
              method: `MIDTRANS_${payment_type ? payment_type.toUpperCase() : 'ONLINE'}`,
              reference: req.body.transaction_id || order_id
            }
          }),
          prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID', paidAt: new Date() }
          })
        ]);

        console.log(`[Webhook-Midtrans] Invoice #${invoice.id} berhasil dilunasi via ${payment_type}!`);

        // 1. Kirim notifikasi WhatsApp & Telegram
        await notifier.notifyPaymentSuccess(invoice.customer, invoice, payment);

        // 2. Eksekusi Instant Un-Isolir ke MikroTik CCR via RADIUS CoA (Port 3799)
        const username = invoice.customer.user ? invoice.customer.user.email : invoice.customerId;
        await unIsolirUser(username);
      }
    }

    res.json({ success: true, message: 'Midtrans webhook processed' });
  } catch (err) {
    console.error('[Webhook-Midtrans] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/webhook/xendit — Realtime Callback from Xendit
router.post('/webhook/xendit', async (req, res, next) => {
  try {
    const callbackToken = req.headers['x-callback-token'];
    const xenditConfig = await xendit.getXenditConfig();

    if (!xendit.verifyXenditCallback(callbackToken, xenditConfig.webhookToken)) {
      return res.status(403).json({ error: 'Invalid callback token', code: 'FORBIDDEN' });
    }

    const { external_id, status, paid_amount, payment_method } = req.body;
    if (status === 'PAID') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: external_id },
        include: { customer: { include: { user: true } }, plan: true }
      });

      if (invoice && invoice.status !== 'PAID') {
        const [payment] = await prisma.$transaction([
          prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amountIdr: parseInt(paid_amount),
              method: `XENDIT_${payment_method || 'ONLINE'}`,
              reference: req.body.id || external_id
            }
          }),
          prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID', paidAt: new Date() }
          })
        ]);

        console.log(`[Webhook-Xendit] Invoice #${invoice.id} berhasil dilunasi via Xendit!`);

        // Notifikasi & un-isolir
        await notifier.notifyPaymentSuccess(invoice.customer, invoice, payment);
        const username = invoice.customer.user ? invoice.customer.user.email : invoice.customerId;
        await unIsolirUser(username);
      }
    }

    res.json({ success: true, message: 'Xendit webhook processed' });
  } catch (err) {
    console.error('[Webhook-Xendit] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
