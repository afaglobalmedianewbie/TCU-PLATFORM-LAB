// modules/audit.js — audit logging ke Prisma AuditLog
'use strict';

const { prisma } = require('./db');

const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PAYMENT: 'payment',
  REFUND: 'refund',
  INVOICE_CREATED: 'invoice_created',
  INVOICE_ADJUSTED: 'invoice_adjusted',
  PAYMENT_RECONCILED: 'payment_reconciled',
  DEVICE_REGISTERED: 'device_registered',
  DEVICE_UPDATED: 'device_updated',
  DIAGNOSTIC_ADDED: 'diagnostic_added',
  PLAN_CREATED: 'plan_created',
  PLAN_UPDATED: 'plan_updated',
};

/**
 * Menulis audit log ke database.
 * Dirancang fail-safe — tidak pernah melempar error ke atas.
 */
async function logAudit({ userId, action, resource, resourceId, metadata, ipAddress } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: action || 'unknown',
        resource: resource || 'unknown',
        resourceId: resourceId || null,
        metadata: metadata || undefined,
        ipAddress: ipAddress || null,
      }
    });
  } catch (err) {
    console.error(`[AUDIT_ERROR] ${err.message}`);
  }
}

module.exports = { logAudit, AUDIT_ACTIONS };
