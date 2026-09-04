// workers/device-sync-worker.js — background job: mark devices OFFLINE if tidak aktif
'use strict';

const { prisma } = require('../modules/db');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});

// Threshold: device dianggap OFFLINE jika lastSeenAt > OFFLINE_THRESHOLD_MINUTES yang lalu
const OFFLINE_THRESHOLD_MINUTES = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_MINUTES || '10', 10);

async function markOfflineDevices() {
  const thresholdTime = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);

  logger.info({ message: 'device-sync-worker: checking offline devices', thresholdTime });

  const result = await prisma.device.updateMany({
    where: {
      status: 'ONLINE',
      lastSeenAt: { lt: thresholdTime }
    },
    data: { status: 'OFFLINE' }
  });

  logger.info({ message: 'device-sync-worker: devices marked offline', count: result.count });
}

async function markDegradedDevices() {
  // Device dianggap DEGRADED jika rx_power_dbm di diagnostic terakhir < -28 dBm
  const DEGRADED_RX_THRESHOLD = parseFloat(process.env.ONU_DEGRADED_RX_DBM || '-28');

  const recentDiagnostics = await prisma.deviceDiagnostic.findMany({
    where: {
      rxPowerDbm: { lt: DEGRADED_RX_THRESHOLD },
      collectedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 menit terakhir
    },
    select: { deviceId: true }
  });

  const deviceIds = [...new Set(recentDiagnostics.map(d => d.deviceId))];
  if (deviceIds.length === 0) return;

  const result = await prisma.device.updateMany({
    where: { id: { in: deviceIds }, status: 'ONLINE' },
    data: { status: 'DEGRADED' }
  });

  logger.info({ message: 'device-sync-worker: devices marked degraded', count: result.count });
}

async function run() {
  try {
    await markOfflineDevices();
    await markDegradedDevices();
  } catch (err) {
    logger.error({ message: 'device-sync-worker: error', error: err.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
