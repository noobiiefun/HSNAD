const express = require('express');
const router  = express.Router();

// GET /api/history?limit=50
router.get('/', (req, res) => {
  const { alertHistory } = req.app.locals;
  const limit = parseInt(req.query.limit) || 50;
  res.json(alertHistory.getAll(limit));
});

// GET /api/history/stats
router.get('/stats', (req, res) => {
  const { alertHistory } = req.app.locals;
  res.json(alertHistory.getStats());
});

// DELETE /api/history — clear
router.delete('/', (req, res) => {
  const { alertHistory } = req.app.locals;
  alertHistory.clear();
  res.json({ success: true });
});

module.exports = router;
