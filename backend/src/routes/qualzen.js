const router = require('express').Router();
const auth = require('../middleware/auth');
const { getMssqlPool } = require('../db/mssqlPool');

router.get('/action-items', auth, async (req, res) => {
  try {
    const pool = await getMssqlPool();
    const result = await pool.request().query(`
      SELECT 
        a.ActionPlanMasterID,
        a.ActionPlanNumber,
        a.ActionPlanDescription,
        a.TargetDate,
        a.CurrentStatus,
        a.ClosureDate,
        a.CreatedDate,
        s.StatusDescription,
        e1.FullName AS ResponsiblePersonName,
        e2.FullName AS DeptHODName,
        e3.FullName AS QAName
      FROM QualZen_ActionPlan.ActionPlanMaster a
      LEFT JOIN QualZen_ActionPlan.ActionPlanHistoryStatus s 
        ON a.CurrentStatus = s.ActionPlanHistoryStatusID
      LEFT JOIN LIMS.vw_UserDetails e1 ON a.ResponsiblePerson = e1.EmpID
      LEFT JOIN LIMS.vw_UserDetails e2 ON a.DeptHOD = e2.EmpID
      LEFT JOIN LIMS.vw_UserDetails e3 ON a.QA = e3.EmpID
      WHERE a.ActionPlanDeptID = 6
      ORDER BY a.CurrentStatus ASC, a.TargetDate ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Qualzen query error:', err);
    res.status(500).json({ message: 'Lỗi kết nối SQL Server: ' + err.message });
  }
});

router.get('/action-items/summary', auth, async (req, res) => {
  try {
    const pool = await getMssqlPool();
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN CurrentStatus = 3 THEN 1 ELSE 0 END) AS openCount,
        SUM(CASE WHEN CurrentStatus = 3 AND TargetDate < GETDATE() THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN CurrentStatus = 3 AND TargetDate >= GETDATE() AND TargetDate <= DATEADD(day, 7, GETDATE()) THEN 1 ELSE 0 END) AS dueSoon,
        SUM(CASE WHEN CurrentStatus = 3 AND TargetDate > DATEADD(day, 7, GETDATE()) THEN 1 ELSE 0 END) AS onTrack,
        SUM(CASE WHEN CurrentStatus != 3 OR ClosureDate IS NOT NULL THEN 1 ELSE 0 END) AS closed
      FROM QualZen_ActionPlan.ActionPlanMaster
      WHERE ActionPlanDeptID = 6
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Qualzen summary error:', err);
    res.status(500).json({ message: 'Lỗi: ' + err.message });
  }
});

module.exports = router;
