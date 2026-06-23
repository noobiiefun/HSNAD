const express = require('express');
const router = express.Router();

// GET /api/alerts/status — status queue
router.get('/status', (req, res) => {
  const { alertQueue } = req.app.locals;
  res.json(alertQueue.getStatus());
});

// POST /api/alerts/test — trigger test alert
router.post('/test', (req, res) => {
  const { alertQueue, io } = req.app.locals;
  const { platform = 'saweria' } = req.body;

  const testAlerts = {
    saweria: {
      platform: 'saweria',
      donorName: 'SaweriaFan123',
      amount: 25000,
      currency: 'IDR',
      message: 'Semangat streamnya! 🔥',
      timestamp: Date.now(),
    },
  };

  const alert = testAlerts[platform] || testAlerts.saweria;
  alertQueue.push(alert);

  res.json({ success: true, message: 'Test alert queued', alert });
});

// POST /api/alerts/skip — skip current alert
router.post('/skip', (req, res) => {
  const { alertQueue } = req.app.locals;
  alertQueue.skip();
  res.json({ success: true });
});

// DELETE /api/alerts/clear — clear queue
router.delete('/clear', (req, res) => {
  const { alertQueue } = req.app.locals;
  alertQueue.clear();
  res.json({ success: true });
});

// POST /api/alerts/done — overlay report alert selesai
router.post('/done', (req, res) => {
  const { alertQueue } = req.app.locals;
  const { alertId } = req.body;
  if (alertId) alertQueue.alertDone(alertId);
  res.json({ success: true });
});

module.exports = router;
