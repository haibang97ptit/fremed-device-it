const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = '/app/uploads/quy-trinh';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `qt_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quy_trinh ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quy_trinh WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server' }); }
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Thiếu tiêu đề' });
  try {
    const file_name = req.file ? req.file.originalname : null;
    const file_path = req.file ? req.file.filename : null;
    const file_type = req.file ? req.file.mimetype : null;
    const { rows } = await pool.query(
      `INSERT INTO quy_trinh (title, description, file_name, file_path, file_type) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, description || null, file_name, file_path, file_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server' }); }
});

router.put('/:id', auth, upload.single('file'), async (req, res) => {
  const { title, description } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM quy_trinh WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    const file_name = req.file ? req.file.originalname : existing.rows[0].file_name;
    const file_path = req.file ? req.file.filename : existing.rows[0].file_path;
    const file_type = req.file ? req.file.mimetype : existing.rows[0].file_type;
    if (req.file && existing.rows[0].file_path) {
      const oldPath = path.join(uploadDir, existing.rows[0].file_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const { rows } = await pool.query(
      `UPDATE quy_trinh SET title=$1, description=$2, file_name=$3, file_path=$4, file_type=$5 WHERE id=$6 RETURNING *`,
      [title || existing.rows[0].title, description ?? existing.rows[0].description, file_name, file_path, file_type, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM quy_trinh WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    if (existing.rows[0].file_path) {
      const fp = path.join(uploadDir, existing.rows[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await pool.query('DELETE FROM quy_trinh WHERE id = $1', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server' }); }
});

// Download file gốc
router.get('/download/:filename', auth, (req, res) => {
  const fp = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ message: 'File không tồn tại' });
  res.download(fp);
});

// Preview — convert DOCX→HTML, hiển thị PDF/ảnh/txt trên web
router.get('/preview/:filename', auth, async (req, res) => {
  const fp = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ message: 'File không tồn tại' });
  const ext = path.extname(req.params.filename).toLowerCase();

  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.convertToHtml(
        { path: fp },
        { convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(buf) {
              return { src: `data:${image.contentType};base64,${buf}` };
            });
          })
        }
      );
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;color:#333}
        table{border-collapse:collapse;width:100%;margin:10px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f5f5f5}
        img{max-width:100%;height:auto}
        h1{font-size:20px}h2{font-size:17px}h3{font-size:15px}
        p{margin:6px 0}
      </style></head><body>${result.value}</body></html>`;
      return res.type('html').send(html);
    } catch (err) {
      console.error('Mammoth error:', err);
      return res.status(500).json({ message: 'Không thể convert file DOCX' });
    }
  }
  if (ext === '.doc') return res.status(400).json({ message: 'File .doc không hỗ trợ xem online. Vui lòng convert sang .docx' });
  if (ext === '.pdf') { res.type('application/pdf'); return fs.createReadStream(fp).pipe(res); }
  if (['.png','.jpg','.jpeg','.gif','.webp','.bmp'].includes(ext)) return res.sendFile(fp);
  if (['.txt','.md'].includes(ext)) {
    const content = fs.readFileSync(fp, 'utf8');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:monospace;max-width:800px;margin:0 auto;padding:20px;white-space:pre-wrap;line-height:1.6}
    </style></head><body>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`;
    return res.type('html').send(html);
  }
  res.download(fp);
});

module.exports = router;
