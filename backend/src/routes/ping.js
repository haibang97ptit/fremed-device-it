const router      = require('express').Router();
const auth        = require('../middleware/auth');
const pingService = require('../services/pingService');
const ping        = require('ping');

// POST /api/ping/ip/check — ping 1 IP trực tiếp
router.post('/ip/check', auth, async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ message: 'Thiếu IP' });
  try {
    const result = await ping.promise.probe(ip, { timeout: 3, extra: ['-c', '1'] });
    res.json({
      ip,
      alive: result.alive,
      status: result.alive ? 'online' : 'offline',
      latency: result.alive ? result.avg : null,
    });
  } catch {
    res.json({ ip, alive: false, status: 'offline', latency: null });
  }
});

// POST /api/ping/ip/batch — ping nhiều IP cùng lúc (tối đa 50)
router.post('/ip/batch', auth, async (req, res) => {
  const { ips } = req.body; // [{ id, ip }]
  if (!ips?.length) return res.status(400).json({ message: 'Thiếu danh sách IP' });

  const batch = ips.slice(0, 50);
  const results = await Promise.all(
    batch.map(async ({ id, ip }) => {
      if (!ip) return { id, ip, status: 'unknown', latency: null };
      try {
        const r = await ping.promise.probe(ip, { timeout: 3, extra: ['-c', '1'] });
        return { id, ip, status: r.alive ? 'online' : 'offline', latency: r.alive ? r.avg : null };
      } catch {
        return { id, ip, status: 'offline', latency: null };
      }
    })
  );
  res.json(results);
});

// POST /api/ping/:id — ping 1 thiết bị theo ID (4 gói tin)
router.post('/:id', auth, async (req, res) => {
  try {
    const result = await pingService.pingOne(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
