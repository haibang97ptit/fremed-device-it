const router = require('express').Router();
const auth = require('../middleware/auth');
const { getMssqlPool } = require('../db/mssqlPool');

// GET /api/it-sop — lấy danh sách SOP phòng IT
router.get('/', auth, async (req, res) => {
  try {
    const pool = await getMssqlPool();
    const result = await pool.request().query(`
      SELECT
        m.DocumentID,
        m.DocumentNumber,
        m.DocumentNumber_Old,
        m.LastmodifiedDate,
        t.Title,
        v.VersionID,
        v.VersionNumber,
        v.FileName,
        v.Status,
        v.EffectiveDate,
        v.DocumentStatus,
        l.FilePath AS PDFPath
      FROM DMS.AizantIT_DocumentMaster m
      LEFT JOIN DMS.AizantIT_DocVersion v 
        ON m.DocumentID = v.DocumentID
      LEFT JOIN DMS.AizantIT_DocVersionTitle t 
        ON v.VersionID = t.DocTitleID
      OUTER APPLY (
        SELECT TOP 1 loc.FilePath
        FROM DMS.AizantIT_DocumentLocation loc
        WHERE loc.DocVID = v.VersionID
          AND loc.FilePath LIKE '%.pdf'
        ORDER BY loc.CreatedDate DESC
      ) l
      WHERE m.DeptID = 6 
        AND m.DocumentTypeID = 4
      ORDER BY m.DocumentNumber
    `);
    // Gắn thêm base URL cho FilePath
    const rows = result.recordset.map(r => ({
      ...r,
      PDFPath: r.PDFPath ? r.PDFPath : null
    }));
    res.json(rows);
  } catch (err) {
    console.error('IT SOP query error:', err);
    res.status(500).json({ message: 'Lỗi kết nối SQL Server: ' + err.message });
  }
});

module.exports = router;
