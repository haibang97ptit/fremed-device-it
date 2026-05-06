const ping = require('ping');
const pool = require('../db/pool');

async function pingOne(deviceId) {
  const id = parseInt(deviceId);
  const { rows } = await pool.query(
    'SELECT id, name, ip_address FROM device_it WHERE id = $1', [id]
  );
  if (!rows.length || !rows[0].ip_address) throw new Error('Thiết bị không có IP');

  const device = rows[0];
  const result = await ping.promise.probe(device.ip_address, {
    timeout: 5,
    extra: ['-c', '4'],  // gửi 4 gói tin
  });

  return {
    ip: device.ip_address,
    alive: result.alive,
    status: result.alive ? 'online' : 'offline',
    packetLoss: result.packetLoss,
    latency: {
      min: result.min,
      avg: result.avg,
      max: result.max,
    },
    output: result.output,
  };
}

module.exports = { pingOne };
