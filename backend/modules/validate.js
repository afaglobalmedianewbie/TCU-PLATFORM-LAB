// modules/validate.js — Zod request validation middleware
'use strict';

const { z } = require('zod');

/**
 * Membuat middleware Express yang memvalidasi req.body dengan Zod schema.
 * @param {import('zod').ZodTypeAny} schema
 */
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      const issues = err instanceof z.ZodError ? err.issues : [];
      return res.status(400).json({
        error: 'Validasi gagal',
        code: 'VALIDATION_ERROR',
        details: issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
    }
  };
}

// ─── Customer Schemas ─────────────────────────────────────────────────────────

const createCustomerSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(3).max(150),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().max(500).optional(),
  planId: z.string().optional(),
});

const updateCustomerSchema = z.object({
  fullName: z.string().min(3).max(150).optional(),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  planId: z.string().optional(),
});

// ─── Billing Schemas ──────────────────────────────────────────────────────────

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1),
  amountIdr: z.number().int().positive(),
  dueDate: z.string().datetime({ message: 'Format tanggal harus ISO 8601' }),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceIdr: z.number().int().positive(),
  speedMbps: z.number().int().positive(),
});

const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  priceIdr: z.number().int().positive().optional(),
  speedMbps: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// ─── Device Schemas ───────────────────────────────────────────────────────────

const registerDeviceSchema = z.object({
  serialNumber: z.string().min(4).max(100),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC address tidak valid'),
  type: z.enum(['ONU', 'OLT', 'CPE', 'SWITCH']),
  model: z.string().max(100).optional(),
  firmwareVer: z.string().max(50).optional(),
  ipAddress: z.string().ip().optional(),
  customerId: z.string().optional(),
});

const addDiagnosticSchema = z.object({
  rxPowerDbm: z.number().optional(),
  txPowerDbm: z.number().optional(),
  uptimeSeconds: z.number().int().nonnegative().optional(),
  errorCount: z.number().int().nonnegative().optional(),
  rawMetrics: z.record(z.unknown()).optional(),
});

module.exports = {
  validateBody,
  createCustomerSchema,
  updateCustomerSchema,
  createInvoiceSchema,
  createPlanSchema,
  updatePlanSchema,
  registerDeviceSchema,
  addDiagnosticSchema,
};
