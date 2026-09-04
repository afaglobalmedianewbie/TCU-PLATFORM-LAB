// backend/modules/xendit.js
'use strict';

const axios = require('axios');
const { prisma } = require('./db');

async function getXenditConfig() {
  const settings = await prisma.systemSetting.findMany({
    where: { category: 'PAYMENT' }
  });
  const configMap = {};
  settings.forEach(s => { configMap[s.key] = s.value; });

  return {
    secretKey: configMap['XENDIT_SECRET_KEY'] || process.env.XENDIT_SECRET_KEY || '',
    webhookToken: configMap['XENDIT_WEBHOOK_TOKEN'] || process.env.XENDIT_WEBHOOK_TOKEN || ''
  };
}

async function createXenditInvoice(invoice, customer) {
  const config = await getXenditConfig();
  if (!config.secretKey) {
    throw new Error('Xendit Secret Key belum dikonfigurasi di Pengaturan.');
  }

  const authHeader = Buffer.from(config.secretKey + ':').toString('base64');

  const payload = {
    external_id: invoice.id,
    amount: invoice.amountIdr,
    description: 'Tagihan Internet TopClass - Invoice #' + invoice.id,
    customer: {
      given_names: customer.fullName || 'Pelanggan TCU',
      email: customer.user ? customer.user.email : 'billing@topclassuniversal.com',
      mobile_number: customer.phone || '08123456789'
    },
    currency: 'IDR',
    invoice_duration: 86400
  };

  const response = await axios.post('https://api.xendit.co/v2/invoices', payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + authHeader
    }
  });

  return {
    invoiceUrl: response.data.invoice_url,
    status: response.data.status,
    id: response.data.id
  };
}

function verifyXenditCallback(tokenReceived, configuredToken) {
  if (!configuredToken) return true;
  return tokenReceived === configuredToken;
}

module.exports = {
  getXenditConfig,
  createXenditInvoice,
  verifyXenditCallback
};
