const router      = require('express').Router();
const auth        = require('../middleware/auth');
const pingService = require('../services/pingService');

// POST /api/ping/:id — ping 1 thiết bị (4 gói tin)
router.post('/:id', auth, async (req, res) => {
  try {
    const result = await pingService.pingOne(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
