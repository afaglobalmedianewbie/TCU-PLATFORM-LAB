// backend/routes/settings.js
'use strict';

const express = require('express');
const router = express.Router();
const { prisma } = require('../modules/db');
const { requireAuth, requireRole } = require('../modules/auth-middleware');
const notifier = require('../modules/notifier');

// GET /api/settings/integrations — Retrieve current integration settings
router.get('/integrations', requireAuth, requireRole(['ADMIN', 'NOC']), async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const config = {};
    settings.forEach(s => {
      // Sensor secret keys jika panjang > 6
      if (s.isSecret && s.value) {
        const len = s.value.length;
        config[s.key] = s.value.substring(0, 4) + '****' + s.value.substring(Math.max(4, len - 4));
      } else {
        config[s.key] = s.value;
      }
    });

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    res.json({
      settings: config,
      webhooks: {
        midtrans: `${baseUrl}/api/billing/webhook/midtrans`,
        xendit: `${baseUrl}/api/billing/webhook/xendit`
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/integrations — Save integration settings
router.post('/integrations', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const updates = req.body;
    const secretKeys = [
      'MIDTRANS_SERVER_KEY', 'XENDIT_SECRET_KEY', 'WA_API_KEY',
      'SMTP_PASS', 'TELEGRAM_BOT_TOKEN', 'GOOGLE_CHAT_WEBHOOK_URL'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.includes('****')) continue;

      let category = 'GENERAL';
      if (key.startsWith('MIDTRANS_') || key.startsWith('XENDIT_') || key.startsWith('PAYMENT_') || key === 'ACTIVE_PAYMENT_GATEWAY') {
        category = 'PAYMENT';
      } else if (key.startsWith('WA_') || key.startsWith('SMTP_') || key.startsWith('TELEGRAM_') || key.startsWith('GOOGLE_CHAT_') || key.startsWith('NOTIF_')) {
        category = 'NOTIFICATION';
      }

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value), category, isSecret: secretKeys.includes(key) },
        create: { key, value: String(value), category, isSecret: secretKeys.includes(key) }
      });
    }

    res.json({ success: true, message: 'Pengaturan integrasi berhasil disimpan' });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/integrations/test — Test connectivity to a specific channel
router.post('/integrations/test', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { channel, target } = req.body;
    let success = false;
    let message = '';

    if (channel === 'whatsapp') {
      success = await notifier.sendWhatsApp(target, 'Halo dari TCU-PLATFORM! Uji coba integrasi WhatsApp berhasil.');
      message = success ? `Pesan WhatsApp berhasil dikirim ke ${target}` : 'Gagal mengirim WhatsApp. Periksa API Key / URL.';
    } else if (channel === 'email') {
      success = await notifier.sendEmail(target, 'Test Email TCU Platform', '<p>Halo! Uji coba pengiriman email dari TCU-PLATFORM berhasil.</p>');
      message = success ? `Email uji coba berhasil dikirim ke ${target}` : 'Gagal mengirim Email. Periksa konfigurasi SMTP.';
    } else if (channel === 'telegram') {
      success = await notifier.sendTelegram(target, '🤖 <b>TCU Platform Alert:</b> Uji coba integrasi Telegram Bot berhasil!');
      message = success ? `Pesan Telegram berhasil dikirim ke Chat ID: ${target}` : 'Gagal mengirim Telegram. Periksa Bot Token & Chat ID.';
    } else if (channel === 'google_chat') {
      success = await notifier.sendGoogleChat('🔔 *TCU Platform Alert:* Uji coba integrasi Google Chat Space berhasil!');
      message = success ? 'Pesan Google Chat berhasil dikirim ke Webhook Space' : 'Gagal mengirim Google Chat. Periksa Webhook URL.';
    } else {
      return res.status(400).json({ error: 'Channel tidak dikenal', code: 'INVALID_CHANNEL' });
    }

    res.json({ success, message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
