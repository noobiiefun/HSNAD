const express = require('express');
const router = express.Router();

// GET /api/config — semua config
router.get('/', (req, res) => {
  const { configService } = req.app.locals;
  res.json(configService.getAll());
});

// GET /api/config/platform/:key
router.get('/platform/:key', (req, res) => {
  const { configService } = req.app.locals;
  const config = configService.getPlatform(req.params.key);
  if (!config) return res.status(404).json({ error: 'Platform not found' });
  res.json(config);
});

// PUT /api/config/platform/:key — update platform config
router.put('/platform/:key', (req, res) => {
  const { configService, io } = req.app.locals;
  const updated = configService.setPlatform(req.params.key, req.body);

  // Broadcast ke overlay
  io.emit('config:update', configService.getAll());

  res.json(updated);
});

// PUT /api/config/platform/:key/alert — update alert config satu platform
router.put('/platform/:key/alert', (req, res) => {
  const { configService, io } = req.app.locals;
  const updated = configService.setPlatformAlert(req.params.key, req.body);

  // Broadcast ke overlay
  io.emit('config:update', configService.getAll());

  res.json(updated);
});

// GET /api/config/overlay
router.get('/overlay', (req, res) => {
  const { configService } = req.app.locals;
  res.json(configService.getOverlay());
});

// PUT /api/config/overlay
router.put('/overlay', (req, res) => {
  const { configService } = req.app.locals;
  const updated = configService.setOverlay(req.body);
  res.json(updated);
});

module.exports = router;
