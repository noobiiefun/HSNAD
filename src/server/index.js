const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const path    = require('path');

const alertRoutes    = require('./routes/alerts');
const configRoutes   = require('./routes/config');
const platformRoutes = require('./routes/platforms');
const historyRoutes  = require('./routes/history');

const SaweriaService     = require('./services/saweria');
const AlertQueueService  = require('./services/alertQueue');
const AlertHistoryService= require('./services/alertHistory');
const ConfigService      = require('./services/config');

let io             = null;
let saweriaService = null;

function startExpressServer(port = 5174) {
  return new Promise((resolve, reject) => {
    const app        = express();
    const httpServer = http.createServer(app);

    io = new Server(httpServer, { cors: { origin: '*' } });

    app.use(cors());
    app.use(express.json());

    // Static overlay
    const overlayPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../overlay')
      : path.join(process.resourcesPath, 'overlay');
    app.use('/overlay', express.static(overlayPath));

    // Static sounds
    const soundsPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../public/sounds')
      : path.join(process.resourcesPath, 'sounds');
    app.use('/sounds', express.static(soundsPath));

    // Services
    const configService  = new ConfigService();
    const historyService = new AlertHistoryService();
    const alertQueue     = new AlertQueueService(io, historyService);

    // Routes
    app.use('/api/alerts',    alertRoutes);
    app.use('/api/config',    configRoutes);
    app.use('/api/platforms', platformRoutes);
    app.use('/api/history',   historyRoutes);
    app.get('/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

    // Expose ke routes
    app.locals.io             = io;
    app.locals.alertQueue     = alertQueue;
    app.locals.alertHistory   = historyService;
    app.locals.configService  = configService;

    // Socket.IO
    io.on('connection', (socket) => {
      console.log('[Socket] Connected:', socket.id);

      socket.on('overlay:ready', () => {
        socket.emit('config:update', configService.getAll());
        socket.emit('queue:update',  alertQueue.getStatus());
      });

      socket.on('alert:test', (platform) => {
        alertQueue.push(makeTestAlert(platform));
      });

      socket.on('alert:done', (alertId) => {
        alertQueue.alertDone(alertId);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected:', socket.id);
      });
    });

    // Auto-start Saweria kalau sudah dikonfigurasi
    const sawCfg = configService.getPlatform('saweria');
    if (sawCfg?.enabled && sawCfg?.streamKey) {
      saweriaService = new SaweriaService(sawCfg.streamKey, alertQueue);
      saweriaService.startPolling(sawCfg.pollingInterval || 5000);
    }

    httpServer.listen(port, () => {
      console.log(`[Server] HSNAD running on http://localhost:${port}`);
      resolve(httpServer);
    });
    httpServer.on('error', reject);
  });
}

function makeTestAlert(platform = 'saweria') {
  const map = {
    saweria: {
      platform:  'saweria',
      donorName: 'SaweriaFan',
      amount:    25000,
      currency:  'IDR',
      message:   'Semangat streamnya! 🔥',
      timestamp: Date.now(),
    },
  };
  return map[platform] || map.saweria;
}

module.exports = { startExpressServer, getIO: () => io };
