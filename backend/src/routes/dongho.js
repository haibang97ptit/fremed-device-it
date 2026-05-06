const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const ping   = require('ping');

// GET /api/dongho/status — lấy tất cả đồng hồ từ device_ip, ping kiểm tra online/offline
router.get('/status', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.ip, i.name, i.vlan, i.idban, p.name AS phongban_name
       FROM device_ip i
       LEFT JOIN phongban p ON i.idban = p.id
       WHERE i.name ILIKE '%Đồng hồ%'
       ORDER BY i.name`
    );

    // Ping tất cả đồng thời, timeout 3 giây
    const results = await Promise.all(
      rows.map(async (row) => {
        if (!row.ip) {
          return { ...row, status: 'unknown', latency: null };
        }
        try {
          const res = await ping.promise.probe(row.ip, {
            timeout: 3,
            extra: ['-c', '1'],
          });
          return {
            ...row,
            status:  res.alive ? 'online' : 'offline',
            latency: res.alive ? res.avg : null,
          };
        } catch {
          return { ...row, status: 'offline', latency: null };
        }
      })
    );

    const online  = results.filter(r => r.status === 'online').length;
    const offline = results.filter(r => r.status === 'offline').length;

    res.json({
      total:   results.length,
      online,
      offline,
      unknown: results.length - online - offline,
      devices: results,
    });
  } catch (err) {
    console.error('dongho/status error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
