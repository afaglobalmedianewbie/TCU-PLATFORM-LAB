// workers/billing-worker.js — background job: generate monthly invoices
'use strict';

const { prisma } = require('../modules/db');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});

async function generateMonthlyInvoices() {
  logger.info({ message: 'billing-worker: generating monthly invoices' });

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);

  const activeCustomers = await prisma.customer.findMany({
    where: { status: 'ACTIVE', planId: { not: null } },
    include: { plan: true }
  });

  // Pre-fetch semua invoice yang sudah ada untuk period ini — hindari N+1 query
  const existingInvoices = await prisma.invoice.findMany({
    where: { periodStart },
    select: { customerId: true }
  });
  const existingCustomerIds = new Set(existingInvoices.map(inv => inv.customerId));

  let created = 0;
  let skipped = 0;

  for (const customer of activeCustomers) {
    if (existingCustomerIds.has(customer.id)) {
      skipped++;
      continue;
    }

    await prisma.invoice.create({
      data: {
        customerId: customer.id,
        planId: customer.planId,
        amountIdr: customer.plan.priceIdr,
        status: 'UNPAID',
        dueDate,
        periodStart,
        periodEnd
      }
    });
    created++;
  }

  logger.info({ message: 'billing-worker: done', created, skipped });
}

async function markOverdueInvoices() {
  logger.info({ message: 'billing-worker: marking overdue invoices' });
  const result = await prisma.invoice.updateMany({
    where: { status: 'UNPAID', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' }
  });
  logger.info({ message: 'billing-worker: overdue marked', count: result.count });
}

async function run() {
  try {
    await generateMonthlyInvoices();
    await markOverdueInvoices();
  } catch (err) {
    logger.error({ message: 'billing-worker: error', error: err.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
