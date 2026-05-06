const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const path   = require('path');
const fs     = require('fs');

const pdfDir = '/app/uploads/phieu-de-nghi';
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

// Helper: đếm số phiếu đã tạo trong tháng/năm hiện tại (trước phiếu hiện tại)
async function countInMonth(excludeId = null) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let query = `SELECT COUNT(*) as cnt FROM phieu_de_nghi
    WHERE EXTRACT(MONTH FROM created_at) = $1
    AND EXTRACT(YEAR FROM created_at) = $2`;
  const params = [month, year];
  if (excludeId) {
    query += ` AND id != $3`;
    params.push(excludeId);
  }
  const { rows } = await pool.query(query, params);
  return parseInt(rows[0].cnt) || 0;
}

// GET /api/phieu-de-nghi/next-pr - Lấy số PR tiếp theo
router.get('/next-pr', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT so_pr FROM phieu_de_nghi WHERE so_pr IS NOT NULL ORDER BY created_at DESC LIMIT 1`
    );
    let nextNum = 26001; // default
    if (rows.length && rows[0].so_pr) {
      // Tách số từ so_pr, VD: "IT/PR/26016" -> 26016
      const match = rows[0].so_pr.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    res.json({ next_pr: `IT/PR/${nextNum}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/phieu-de-nghi
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  const params = [];
  const where = [];
  if (search) {
    params.push(`%${search}%`);
    where.push(`(nguoi_de_nghi ILIKE $${params.length} OR so_pr ILIKE $${params.length})`);
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const { rows } = await pool.query(
      `SELECT * FROM phieu_de_nghi ${whereClause} ORDER BY created_at DESC`, params
    );

    // Tính lan_trong_thang cho từng phiếu
    // Group by month/year, sort by created_at ASC trong mỗi group
    const monthMap = {};
    const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    for (const r of sorted) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap[key]) monthMap[key] = 0;
      monthMap[key]++;
      r.lan_trong_thang = monthMap[key];
    }

    // Trả về theo thứ tự DESC
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/phieu-de-nghi/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM phieu_de_nghi WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/phieu-de-nghi
router.post('/', auth, async (req, res) => {
  const { nguoi_de_nghi, phong_ban, items, so_pr, truong_phong, soat_xet } = req.body;
  if (!nguoi_de_nghi || !items || !items.length) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO phieu_de_nghi (nguoi_de_nghi, phong_ban, items, so_pr, truong_phong, soat_xet)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nguoi_de_nghi, phong_ban || 'IT', JSON.stringify(items),
       so_pr || null, truong_phong || null, soat_xet || null]
    );

    // Tính lan_trong_thang
    const phieu = rows[0];
    const count = await countInMonth();
    phieu.lan_trong_thang = count;

    res.status(201).json(phieu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/phieu-de-nghi/:id
router.put('/:id', auth, async (req, res) => {
  const { nguoi_de_nghi, phong_ban, items, so_pr, truong_phong, soat_xet } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE phieu_de_nghi
       SET nguoi_de_nghi=$1, phong_ban=$2, items=$3, so_pr=$4, truong_phong=$5, soat_xet=$6
       WHERE id=$7 RETURNING *`,
      [nguoi_de_nghi, phong_ban || 'IT', JSON.stringify(items || []),
       so_pr || null, truong_phong || null, soat_xet || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/phieu-de-nghi/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM phieu_de_nghi WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Không tìm thấy' });

    if (existing.rows[0].file_path) {
      const fp = path.join(pdfDir, existing.rows[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await pool.query('DELETE FROM phieu_de_nghi WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/phieu-de-nghi/download/:filename
router.get('/download/:filename', auth, (req, res) => {
  const fp = path.join(pdfDir, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ message: 'File không tồn tại' });
  res.download(fp);
});

module.exports = router;
