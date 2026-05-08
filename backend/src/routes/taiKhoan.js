const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== SYSTEMS ====================

// GET /api/tai-khoan/systems — lấy tất cả hệ thống + tài khoản + quy trình
router.get('/systems', auth, async (req, res) => {
  try {
    const { rows: systems } = await pool.query(
      `SELECT * FROM it_systems ORDER BY parent_id NULLS FIRST, name ASC`
    );
    const { rows: accounts } = await pool.query(
      `SELECT * FROM it_accounts ORDER BY system_id, tai_khoan`
    );
    const { rows: links } = await pool.query(
      `SELECT sq.system_id, sq.id AS link_id, q.id AS quy_trinh_id, q.title, q.description, q.file_path, q.file_name
       FROM system_quy_trinh sq
       JOIN quy_trinh q ON sq.quy_trinh_id = q.id
       ORDER BY sq.system_id, q.title`
    );

    // Gắn accounts + quy_trinh vào systems
    const systemMap = {};
    systems.forEach(s => { s.accounts = []; s.children = []; s.quy_trinh = []; systemMap[s.id] = s; });
    accounts.forEach(a => { if (systemMap[a.system_id]) systemMap[a.system_id].accounts.push(a); });
    links.forEach(l => { if (systemMap[l.system_id]) systemMap[l.system_id].quy_trinh.push(l); });

    // Build tree
    const roots = [];
    systems.forEach(s => {
      if (s.parent_id && systemMap[s.parent_id]) {
        systemMap[s.parent_id].children.push(s);
      } else {
        roots.push(s);
      }
    });

    res.json(roots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/tai-khoan/systems
router.post('/systems', auth, async (req, res) => {
  const { name, type, parent_id, description, ip_address } = req.body;
  if (!name) return res.status(400).json({ message: 'Thiếu tên hệ thống' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO it_systems (name, type, parent_id, description, ip_address) 
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, type || 'server', parent_id || null, description || null, ip_address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/tai-khoan/systems/:id
router.put('/systems/:id', auth, async (req, res) => {
  const { name, type, parent_id, description, ip_address } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE it_systems SET name=$1, type=$2, parent_id=$3, description=$4, ip_address=$5
       WHERE id=$6 RETURNING *`,
      [name, type, parent_id || null, description || null, ip_address || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/tai-khoan/systems/:id
router.delete('/systems/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM it_systems WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==================== ACCOUNTS ====================

// POST /api/tai-khoan/accounts
router.post('/accounts', auth, async (req, res) => {
  const { system_id, tai_khoan, mat_khau, role, ghi_chu } = req.body;
  if (!system_id || !tai_khoan) return res.status(400).json({ message: 'Thiếu thông tin' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO it_accounts (system_id, tai_khoan, mat_khau, role, ghi_chu) 
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [system_id, tai_khoan, mat_khau || null, role || 'admin', ghi_chu || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/tai-khoan/accounts/:id
router.put('/accounts/:id', auth, async (req, res) => {
  const { tai_khoan, mat_khau, role, ghi_chu } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE it_accounts SET tai_khoan=$1, mat_khau=$2, role=$3, ghi_chu=$4
       WHERE id=$5 RETURNING *`,
      [tai_khoan, mat_khau || null, role || 'admin', ghi_chu || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/tai-khoan/accounts/:id
router.delete('/accounts/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM it_accounts WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==================== QUY TRÌNH LIÊN KẾT ====================

// GET /api/tai-khoan/quy-trinh — lấy tất cả quy trình cho dropdown
router.get('/quy-trinh', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description FROM quy_trinh ORDER BY title`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/tai-khoan/link-quy-trinh — gắn quy trình vào hệ thống
router.post('/link-quy-trinh', auth, async (req, res) => {
  const { system_id, quy_trinh_id } = req.body;
  if (!system_id || !quy_trinh_id) return res.status(400).json({ message: 'Thiếu thông tin' });
  try {
    await pool.query(
      `INSERT INTO system_quy_trinh (system_id, quy_trinh_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [system_id, quy_trinh_id]
    );
    res.json({ message: 'Đã gắn quy trình' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/tai-khoan/link-quy-trinh/:linkId — gỡ quy trình
router.delete('/link-quy-trinh/:linkId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM system_quy_trinh WHERE id = $1', [req.params.linkId]);
    res.json({ message: 'Đã gỡ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
