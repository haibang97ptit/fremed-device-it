const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/tasks — lấy tất cả task
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // optional filter
    let query = 'SELECT * FROM tasks';
    const params = [];
    if (type && (type === 'daily' || type === 'qa')) {
      query += ' WHERE task_type = $1';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  const { title, description, task_type, status, task_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Thiếu tiêu đề' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, task_type, status, task_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description || null, task_type || 'daily', status || 'todo', task_date || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, task_type, status, task_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, task_type=$3, status=$4, task_date=$5
       WHERE id=$6 RETURNING *`,
      [title, description || null, task_type, status, task_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH /api/tasks/:id/status — quick update status (drag & drop hoặc chuyển nhanh)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!['todo', 'doing', 'done'].includes(status)) {
    return res.status(400).json({ message: 'Status không hợp lệ' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
