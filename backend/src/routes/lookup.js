const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/lookup/phongban
router.get('/phongban', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM phongban ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.post('/phongban', auth, async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO phongban (name) VALUES ($1) RETURNING *', [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.delete('/phongban/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM phongban WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

// GET /api/lookup/loaimay
router.get('/loaimay', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM loaimay ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.post('/loaimay', auth, async (req, res) => {
  const { name, idban } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO loaimay (name, idban) VALUES ($1, $2) RETURNING *',
      [name, idban||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.delete('/loaimay/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM loaimay WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

// GET /api/lookup/dashboard — thống kê tổng quan
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [devices, cards, ips, byPhong, byLoai, statusCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM device_it'),
      pool.query('SELECT COUNT(*) FROM device_card'),
      pool.query('SELECT COUNT(*) FROM device_ip'),
      pool.query(`
        SELECT p.name, COUNT(d.id) AS count
        FROM phongban p
        LEFT JOIN device_it d ON d.idban = p.id
        GROUP BY p.id, p.name ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT l.name, COUNT(d.id) AS count
        FROM loaimay l
        LEFT JOIN device_it d ON d.idmay = l.id
        GROUP BY l.id, l.name ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT tinh_trang, COUNT(*) AS count
        FROM device_it
        WHERE tinh_trang IS NOT NULL AND tinh_trang != ''
        GROUP BY tinh_trang ORDER BY count DESC
      `),
    ]);

    res.json({
      total: {
        devices:  parseInt(devices.rows[0].count),
        cards:    parseInt(cards.rows[0].count),
        ips:      parseInt(ips.rows[0].count),
      },
      byPhongban: byPhong.rows,
      byLoaimay:  byLoai.rows,
      byStatus:   statusCount.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
