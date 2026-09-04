// backend/modules/radius-coa.js
'use strict';

const dgram = require('dgram');

/**
 * Sends a RADIUS Disconnect-Request (PoD) / CoA to MikroTik CCR (Port 3799)
 * to immediately terminate the isolated PPPoE session so that the customer
 * reconnects in 1-2 seconds with the normal speed profile.
 */
async function unIsolirUser(username, nasIp = '10.0.10.1', nasSecret = 'tcu_radius_secret_2026', coaPort = 3799) {
  return new Promise((resolve) => {
    try {
      console.log(`[RADIUS-CoA] Mengirim Disconnect-Request ke ${nasIp}:${coaPort} untuk user: ${username}`);
      
      const client = dgram.createSocket('udp4');
      const userBytes = Buffer.from(username);
      const attrLen = 2 + userBytes.length;
      const totalLen = 20 + attrLen;

      const packet = Buffer.alloc(totalLen);
      packet[0] = 40; // Disconnect-Request
      packet[1] = Math.floor(Math.random() * 255); // Identifier
      packet.writeUInt16BE(totalLen, 2); // Length
      for (let i = 4; i < 20; i++) {
        packet[i] = Math.floor(Math.random() * 256);
      }
      packet[20] = 1; // Attribute Type 1: User-Name
      packet[21] = attrLen;
      userBytes.copy(packet, 22);

      client.send(packet, coaPort, nasIp, (err) => {
        client.close();
        if (err) {
          console.error('[RADIUS-CoA] Gagal mengirim paket UDP:', err.message);
          resolve(false);
        } else {
          console.log(`[RADIUS-CoA] Sukses terkirim! Sesi isolir ${username} direset ke profil reguler.`);
          resolve(true);
        }
      });
    } catch (err) {
      console.error('[RADIUS-CoA] Error eksekusi CoA:', err.message);
      resolve(false);
    }
  });
}

module.exports = {
  unIsolirUser
};
