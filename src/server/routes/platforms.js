const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/platforms — list platform yang tersedia
router.get('/', (req, res) => {
  const platforms = [
    {
      key: 'saweria',
      name: 'Saweria',
      logo: '/overlay/assets/saweria-logo.png',
      status: 'supported',
      fields: [
        { key: 'streamKey', label: 'Stream Key', type: 'password', required: true },
        { key: 'pollingInterval', label: 'Polling Interval (ms)', type: 'number', default: 5000 },
        { key: 'minAmount', label: 'Minimum Amount (IDR)', type: 'number', default: 0 },
      ],
    },
    {
      key: 'trakteer',
      name: 'Trakteer',
      logo: '/overlay/assets/trakteer-logo.png',
      status: 'coming-soon',
      fields: [],
    },
    {
      key: 'sociabuzz',
      name: 'SociaBuzz',
      logo: '/overlay/assets/sociabuzz-logo.png',
      status: 'coming-soon',
      fields: [],
    },
    {
      key: 'streamlabs',
      name: 'Streamlabs',
      logo: '/overlay/assets/streamlabs-logo.png',
      status: 'planned',
      fields: [],
    },
  ];

  res.json(platforms);
});

// POST /api/platforms/saweria/verify — test stream key valid
router.post('/saweria/verify', async (req, res) => {
  const { streamKey } = req.body;
  if (!streamKey) return res.status(400).json({ valid: false, error: 'Stream key required' });

  try {
    const response = await axios.get('https://streaming.saweria.co/transactions', {
      headers: { streamkey: streamKey },
      timeout: 8000,
    });

    if (response.status === 200) {
      res.json({ valid: true, message: 'Stream key valid!' });
    } else {
      res.json({ valid: false, error: 'Invalid stream key' });
    }
  } catch (err) {
    if (err.response?.status === 401) {
      res.json({ valid: false, error: 'Stream key tidak valid' });
    } else {
      res.json({ valid: false, error: 'Tidak bisa terhubung ke Saweria' });
    }
  }
});

module.exports = router;
