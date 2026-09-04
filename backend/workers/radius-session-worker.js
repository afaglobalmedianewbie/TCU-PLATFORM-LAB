// workers/radius-session-worker.js — background job: tutup stale RADIUS sessions
'use strict';

const { prisma } = require('../modules/db');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});

// Session dianggap stale jika masih OPEN tapi lebih dari STALE_HOURS jam
const STALE_SESSION_HOURS = parseInt(process.env.RADIUS_STALE_SESSION_HOURS || '24', 10);

async function closeStaleOpenSessions() {
  const staleThreshold = new Date(Date.now() - STALE_SESSION_HOURS * 60 * 60 * 1000);

  logger.info({ message: 'radius-session-worker: checking stale sessions', staleThreshold });

  const result = await prisma.radiusSession.updateMany({
    where: {
      stopTime: null,
      startTime: { lt: staleThreshold }
    },
    data: {
      stopTime: new Date(),
      terminateCause: 'Lost-Carrier'
    }
  });

  logger.info({ message: 'radius-session-worker: stale sessions closed', count: result.count });
}

async function reportActiveSessions() {
  const activeCount = await prisma.radiusSession.count({ where: { stopTime: null } });
  logger.info({ message: 'radius-session-worker: active sessions', count: activeCount });
}

async function run() {
  try {
    await reportActiveSessions();
    await closeStaleOpenSessions();
  } catch (err) {
    logger.error({ message: 'radius-session-worker: error', error: err.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
