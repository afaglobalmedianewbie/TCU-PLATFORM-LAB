// backend/modules/midtrans.js
'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./db');

async function getMidtransConfig() {
  const settings = await prisma.systemSetting.findMany({
    where: { category: 'PAYMENT' }
  });
  const configMap = {};
  settings.forEach(s => { configMap[s.key] = s.value; });

  return {
    serverKey: configMap['MIDTRANS_SERVER_KEY'] || process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: configMap['MIDTRANS_CLIENT_KEY'] || process.env.MIDTRANS_CLIENT_KEY || '',
    merchantId: configMap['MIDTRANS_MERCHANT_ID'] || process.env.MIDTRANS_MERCHANT_ID || '',
    isProduction: (configMap['MIDTRANS_IS_PROD'] || process.env.MIDTRANS_IS_PROD || 'false') === 'true'
  };
}

async function createSnapTransaction(invoice, customer) {
  const config = await getMidtransConfig();
  if (!config.serverKey) {
    throw new Error('Midtrans Server Key belum dikonfigurasi di Pengaturan.');
  }

  const baseUrl = config.isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const authHeader = Buffer.from(config.serverKey + ':').toString('base64');

  const payload = {
    transaction_details: {
      order_id: invoice.id,
      gross_amount: invoice.amountIdr
    },
    customer_details: {
      first_name: customer.fullName || 'Pelanggan TCU',
      email: customer.user ? customer.user.email : 'billing@topclassuniversal.com',
      phone: customer.phone || '08123456789'
    },
    item_details: [
      {
        id: invoice.planId || 'PLAN-INTERNET',
        price: invoice.amountIdr,
        quantity: 1,
        name: invoice.plan ? `Paket Internet ${invoice.plan.name}` : 'Tagihan Internet TopClass'
      }
    ]
  };

  const response = await axios.post(baseUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Basic ' + authHeader
    }
  });

  return {
    token: response.data.token,
    redirectUrl: response.data.redirect_url
  };
}

function verifySignature(orderId, statusCode, grossAmount, signatureKey, serverKey) {
  const hash = crypto.createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  return hash === signatureKey;
}

module.exports = {
  getMidtransConfig,
  createSnapTransaction,
  verifySignature
};
