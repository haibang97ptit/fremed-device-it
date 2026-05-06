const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// ============================================================
// THẺ TỪ
// ============================================================

// GET /api/cards?search=&idban=
router.get('/cards', auth, async (req, res) => {
  const { search, idban } = req.query;
  const params = [], where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(c.name ILIKE $${params.length} OR c.card ILIKE $${params.length})`);
  }
  if (idban) { params.push(idban); where.push(`c.idban = $${params.length}`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.name AS phongban_name
       FROM device_card c
       LEFT JOIN phongban p ON c.idban = p.id
       ${whereClause} ORDER BY c.id`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.post('/cards', auth, async (req, res) => {
  const { idban, card, name } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO device_card (idban,card,name) VALUES ($1,$2,$3) RETURNING *`,
      [idban||null, card||null, name||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.put('/cards/:id', auth, async (req, res) => {
  const { idban, card, name } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE device_card SET idban=$1,card=$2,name=$3 WHERE id=$4 RETURNING *`,
      [idban||null, card||null, name||null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.delete('/cards/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM device_card WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

// ============================================================
// IP TĨNH
// ============================================================

// GET /api/ips?search=&idban=&vlan=
router.get('/ips', auth, async (req, res) => {
  const { search, idban, vlan } = req.query;
  const params = [], where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(i.name ILIKE $${params.length} OR i.ip ILIKE $${params.length})`);
  }
  if (idban) { params.push(idban); where.push(`i.idban = $${params.length}`); }
  if (vlan)  { params.push(vlan);  where.push(`i.vlan  = $${params.length}`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const { rows } = await pool.query(
      `SELECT i.*, p.name AS phongban_name
       FROM device_ip i
       LEFT JOIN phongban p ON i.idban = p.id
       ${whereClause} ORDER BY i.vlan, i.ip`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.post('/ips', auth, async (req, res) => {
  const { idban, ip, name, vlan } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO device_ip (idban,ip,name,vlan) VALUES ($1,$2,$3,$4) RETURNING *`,
      [idban||null, ip||null, name||null, vlan||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.put('/ips/:id', auth, async (req, res) => {
  const { idban, ip, name, vlan } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE device_ip SET idban=$1,ip=$2,name=$3,vlan=$4 WHERE id=$5 RETURNING *`,
      [idban||null, ip||null, name||null, vlan||null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.delete('/ips/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM device_ip WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: 'Lỗi server' }); }
});

module.exports = router;
