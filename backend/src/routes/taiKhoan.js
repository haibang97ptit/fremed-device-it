const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/tai-khoan
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  const params = [];
  let where = '';
  if (search) {
    params.push(`%${search}%`);
    where = `WHERE thiet_bi ILIKE $1 OR tai_khoan ILIKE $1 OR ghi_chu ILIKE $1`;
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tai_khoan_tb ${where} ORDER BY thiet_bi ASC`, params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/tai-khoan
router.post('/', auth, async (req, res) => {
  const { thiet_bi, tai_khoan, mat_khau, ghi_chu } = req.body;
  if (!thiet_bi) return res.status(400).json({ message: 'Thiếu tên thiết bị' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tai_khoan_tb (thiet_bi, tai_khoan, mat_khau, ghi_chu) VALUES ($1,$2,$3,$4) RETURNING *`,
      [thiet_bi, tai_khoan || null, mat_khau || null, ghi_chu || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/tai-khoan/:id
router.put('/:id', auth, async (req, res) => {
  const { thiet_bi, tai_khoan, mat_khau, ghi_chu } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tai_khoan_tb SET thiet_bi=$1, tai_khoan=$2, mat_khau=$3, ghi_chu=$4
       WHERE id=$5 RETURNING *`,
      [thiet_bi, tai_khoan || null, mat_khau || null, ghi_chu || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/tai-khoan/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tai_khoan_tb WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/tai-khoan/import (CSV/Excel)
router.post('/import', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Thiếu file' });

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      const content = fs.readFileSync(req.file.path, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        records.push(row);
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      // Sử dụng xlsx library nếu có, fallback sang CSV
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } catch {
        return res.status(400).json({ message: 'Không đọc được file Excel. Hãy thử export CSV.' });
      }
    } else {
      return res.status(400).json({ message: 'Chỉ hỗ trợ .csv, .xlsx, .xls' });
    }

    // Map columns — hỗ trợ nhiều tên cột
    let imported = 0;
    await pool.query('BEGIN');
    for (const r of records) {
      const thiet_bi  = r.thiet_bi || r['thiết bị'] || r.device || r['tên thiết bị'] || '';
      const tai_khoan = r.tai_khoan || r['tài khoản'] || r.username || r.account || '';
      const mat_khau  = r.mat_khau || r['mật khẩu'] || r.password || '';
      const ghi_chu   = r.ghi_chu || r['ghi chú'] || r.note || r.notes || '';

      if (!thiet_bi) continue;

      await pool.query(
        `INSERT INTO tai_khoan_tb (thiet_bi, tai_khoan, mat_khau, ghi_chu) VALUES ($1,$2,$3,$4)`,
        [thiet_bi, tai_khoan || null, mat_khau || null, ghi_chu || null]
      );
      imported++;
    }
    await pool.query('COMMIT');

    // Xóa file tạm
    fs.unlinkSync(req.file.path);

    res.json({ message: `Import thành công ${imported} bản ghi`, imported });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Lỗi import: ' + err.message });
  }
});

module.exports = router;
