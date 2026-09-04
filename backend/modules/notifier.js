// backend/modules/notifier.js
'use strict';

const axios = require('axios');
const nodemailer = require('nodemailer');
const { prisma } = require('./db');

async function getNotificationSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: { category: 'NOTIFICATION' }
  });
  const config = {};
  settings.forEach(s => { config[s.key] = s.value; });
  return config;
}

// ─── 1. WhatsApp Driver (Meta Cloud API / Generic Gateway / Fonnte / Waha) ───
async function sendWhatsApp(to, text, config) {
  if (!config) config = await getNotificationSettings();
  const provider = config['WA_PROVIDER'] || 'FONNTE';
  const apiUrl = config['WA_API_URL'] || 'https://api.fonnte.com/send';
  const apiKey = config['WA_API_KEY'] || process.env.WA_API_KEY;

  if (!apiKey || !to) {
    console.warn('[Notifier] WhatsApp tidak terkirim: API Key atau nomor tujuan kosong');
    return false;
  }

  try {
    if (provider === 'META') {
      const phoneId = config['WA_META_PHONE_ID'];
      await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: text }
      }, { headers: { Authorization: `Bearer ${apiKey}` } });
    } else {
      // Fonnte / Generic Gateway format
      await axios.post(apiUrl, {
        target: to.replace(/[^0-9]/g, ''),
        message: text
      }, { headers: { Authorization: apiKey } });
    }
    console.log(`[Notifier] WhatsApp berhasil terkirim ke ${to}`);
    return true;
  } catch (err) {
    console.error('[Notifier] Gagal kirim WhatsApp:', err.response ? err.response.data : err.message);
    return false;
  }
}

// ─── 2. Email Driver (Nodemailer SMTP) ───────────────────────────────────────
async function sendEmail(to, subject, htmlContent, config) {
  if (!config) config = await getNotificationSettings();
  const host = config['SMTP_HOST'] || process.env.SMTP_HOST;
  const port = parseInt(config['SMTP_PORT'] || process.env.SMTP_PORT || '587');
  const user = config['SMTP_USER'] || process.env.SMTP_USER;
  const pass = config['SMTP_PASS'] || process.env.SMTP_PASS;
  const from = config['SMTP_FROM'] || process.env.SMTP_FROM || 'billing@topclassuniversal.com';

  if (!host || !user || !pass || !to) {
    console.warn('[Notifier] Email tidak terkirim: Kredensial SMTP belum lengkap');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"PT Top Class Universal" <${from}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[Notifier] Email berhasil dikirim ke ${to}`);
    return true;
  } catch (err) {
    console.error('[Notifier] Gagal kirim Email:', err.message);
    return false;
  }
}

// ─── 3. Telegram Driver (Telegram Bot API) ───────────────────────────────────
async function sendTelegram(chatId, text, config) {
  if (!config) config = await getNotificationSettings();
  const botToken = config['TELEGRAM_BOT_TOKEN'] || process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || config['TELEGRAM_CHAT_ID_NOC'] || process.env.TELEGRAM_CHAT_ID_NOC;

  if (!botToken || !targetChatId) {
    console.warn('[Notifier] Telegram tidak terkirim: Bot Token atau Chat ID kosong');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: targetChatId,
      text: text,
      parse_mode: 'HTML'
    });
    console.log(`[Notifier] Telegram berhasil dikirim ke ${targetChatId}`);
    return true;
  } catch (err) {
    console.error('[Notifier] Gagal kirim Telegram:', err.response ? err.response.data : err.message);
    return false;
  }
}

// ─── 4. Google Chat Driver (Webhook Space) ───────────────────────────────────
async function sendGoogleChat(text, config) {
  if (!config) config = await getNotificationSettings();
  const webhookUrl = config['GOOGLE_CHAT_WEBHOOK_URL'] || process.env.GOOGLE_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[Notifier] Google Chat tidak terkirim: Webhook URL kosong');
    return false;
  }

  try {
    await axios.post(webhookUrl, { text });
    console.log('[Notifier] Google Chat webhook berhasil terkirim');
    return true;
  } catch (err) {
    console.error('[Notifier] Gagal kirim Google Chat:', err.response ? err.response.data : err.message);
    return false;
  }
}

// ─── Master Dispatcher ───────────────────────────────────────────────────────

async function notifyInvoiceCreated(customer, invoice, paymentUrl) {
  const config = await getNotificationSettings();
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(invoice.amountIdr);

  if (customer.phone) {
    const waText = `Halo *${customer.fullName}*,\n\nTagihan internet PT Top Class Universal Anda periode ini telah terbit:\n\n` +
      `🧾 *Invoice ID:* #${invoice.id}\n` +
      `💰 *Total Tagihan:* ${formattedAmount}\n` +
      `📅 *Jatuh Tempo:* ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}\n\n` +
      `👉 *Bayar Instan (QRIS/VA):*\n${paymentUrl || 'Silakan buka portal pelanggan'}\n\n` +
      `Terima kasih telah menggunakan layanan internet kami!`;
    await sendWhatsApp(customer.phone, waText, config);
  }

  if (customer.user && customer.user.email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0052cc;">Tagihan Internet PT Top Class Universal</h2>
        <p>Yth. <strong>${customer.fullName}</strong>,</p>
        <p>Tagihan internet Anda telah diterbitkan dengan rincian sebagai berikut:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">No. Invoice</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">#${invoice.id}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Tagihan</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #d93025;">${formattedAmount}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Jatuh Tempo</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(invoice.dueDate).toLocaleDateString('id-ID')}</td></tr>
        </table>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentUrl}" style="background: #0052cc; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Bayar Sekarang via QRIS / VA</a>
        </div>
      </div>
    `;
    await sendEmail(customer.user.email, `[Invoice #${invoice.id}] Tagihan Internet TopClass`, html, config);
  }
}

async function notifyPaymentSuccess(customer, invoice, payment) {
  const config = await getNotificationSettings();
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payment.amountIdr);

  if (customer.phone) {
    const waText = `✅ *PEMBAYARAN DITERIMA*\n\n` +
      `Halo *${customer.fullName}*, pembayaran tagihan internet Anda sebesar *${formattedAmount}* telah kami terima.\n\n` +
      `🧾 *Invoice:* #${invoice.id}\n` +
      `💳 *Metode:* ${payment.method}\n` +
      `🕒 *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n` +
      `Layanan internet Anda telah aktif normal. Terima kasih!`;
    await sendWhatsApp(customer.phone, waText, config);
  }

  const tgText = `💰 <b>PEMBAYARAN DITERIMA (LUNAS)</b>\n\n` +
    `👤 <b>Pelanggan:</b> ${customer.fullName}\n` +
    `💵 <b>Jumlah:</b> ${formattedAmount}\n` +
    `🧾 <b>Invoice:</b> #${invoice.id}\n` +
    `💳 <b>Metode:</b> ${payment.method}\n` +
    `🕒 <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}`;
  await sendTelegram(config['TELEGRAM_CHAT_ID_FINANCE'], tgText, config);

  const gcText = `💰 *Pembayaran Sukses:* ${customer.fullName} melunasi Invoice #${invoice.id} (${formattedAmount} via ${payment.method})`;
  await sendGoogleChat(gcText, config);
}

module.exports = {
  getNotificationSettings,
  sendWhatsApp,
  sendEmail,
  sendTelegram,
  sendGoogleChat,
  notifyInvoiceCreated,
  notifyPaymentSuccess
};
