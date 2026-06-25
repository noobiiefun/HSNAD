const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// GET /api/platforms
router.get('/', (req, res) => {
  res.json([
    {
      key: 'saweria',
      name: 'Saweria',
      status: 'supported',
      color: '#32C3A6',
      fields: [
        { key: 'streamKey',       label: 'Stream Key',             type: 'password', required: true },
        { key: 'pollingInterval', label: 'Polling Interval (ms)',  type: 'number',   default: 5000 },
        { key: 'minAmount',       label: 'Minimum Donasi (IDR)',   type: 'number',   default: 0 },
      ],
    },
    { key: 'trakteer',  name: 'Trakteer',  status: 'coming-soon', color: '#E5A832', fields: [] },
    { key: 'sociabuzz', name: 'SociaBuzz', status: 'coming-soon', color: '#9B59B6', fields: [] },
    { key: 'streamlabs',name: 'Streamlabs',status: 'planned',     color: '#53A9D8', fields: [] },
  ]);
});

// POST /api/platforms/saweria/verify — cek stream key valid
router.post('/saweria/verify', async (req, res) => {
  const { streamKey } = req.body;
  if (!streamKey) return res.status(400).json({ valid: false, error: 'Stream key wajib diisi' });

  try {
    const response = await axios.get('https://streaming.saweria.co/transactions', {
      headers: { streamkey: streamKey },
      timeout: 8000,
    });
    res.json(response.status === 200
      ? { valid: true,  message: 'Stream key valid! ✓' }
      : { valid: false, error: 'Stream key tidak valid' }
    );
  } catch (err) {
    res.json(err.response?.status === 401
      ? { valid: false, error: 'Stream key tidak valid atau sudah expired' }
      : { valid: false, error: `Tidak bisa terhubung ke Saweria (${err.message})` }
    );
  }
});

// POST /api/platforms/saweria/restart — restart polling (dipanggil setelah save config)
router.post('/saweria/restart', (req, res) => {
  // Lazy import untuk hindari circular
  try {
    const SaweriaService = require('../services/saweria');
    const { configService, alertQueue } = req.app.locals;
    const cfg = configService.getPlatform('saweria');

    if (req.app.locals.saweriaService) {
      req.app.locals.saweriaService.stopPolling();
    }

    if (cfg?.enabled && cfg?.streamKey) {
      req.app.locals.saweriaService = new SaweriaService(cfg.streamKey, alertQueue);
      req.app.locals.saweriaService.startPolling(cfg.pollingInterval || 5000);
      res.json({ success: true, message: 'Saweria polling restarted' });
    } else {
      res.json({ success: true, message: 'Polling stopped (disabled or no key)' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
