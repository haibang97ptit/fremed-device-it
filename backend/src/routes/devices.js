const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/devices?search=&idban=&idmay=&page=1&limit=50
router.get('/', auth, async (req, res) => {
  const { search, idban, idmay, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const where  = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(d.name ILIKE $${params.length} OR d.service_tag ILIKE $${params.length} OR d.mac_address ILIKE $${params.length})`);
  }
  if (idban) { params.push(idban); where.push(`d.idban = $${params.length}`); }
  if (idmay) { params.push(idmay); where.push(`d.idmay = $${params.length}`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM device_it d ${whereClause}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT d.*, p.name AS phongban_name, l.name AS loaimay_name
       FROM device_it d
       LEFT JOIN phongban p ON d.idban = p.id
       LEFT JOIN loaimay  l ON d.idmay = l.id
       ${whereClause}
       ORDER BY d.id
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page: +page, limit: +limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/devices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, p.name AS phongban_name, l.name AS loaimay_name
       FROM device_it d
       LEFT JOIN phongban p ON d.idban = p.id
       LEFT JOIN loaimay  l ON d.idmay = l.id
       WHERE d.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/devices
router.post('/', auth, async (req, res) => {
  const { idmay, idban, name, service_tag, express_code, mac_address, ngay_mua, details, tinh_trang, ip_address } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO device_it (idmay,idban,name,service_tag,express_code,mac_address,ngay_mua,details,tinh_trang,ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [idmay||null, idban||null, name||null, service_tag||null, express_code||null,
       mac_address||null, ngay_mua||null, details||null, tinh_trang||null, ip_address||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/devices/:id
router.put('/:id', auth, async (req, res) => {
  const { idmay, idban, name, service_tag, express_code, mac_address, ngay_mua, details, tinh_trang, ip_address } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE device_it SET idmay=$1,idban=$2,name=$3,service_tag=$4,express_code=$5,
       mac_address=$6,ngay_mua=$7,details=$8,tinh_trang=$9,ip_address=$10
       WHERE id=$11 RETURNING *`,
      [idmay||null, idban||null, name||null, service_tag||null, express_code||null,
       mac_address||null, ngay_mua||null, details||null, tinh_trang||null, ip_address||null,
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/devices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM device_it WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json({ message: 'Đã xóa thiết bị' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
