const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');

const alertRoutes   = require('./routes/alerts');
const configRoutes  = require('./routes/config');
const platformRoutes= require('./routes/platforms');
const historyRoutes = require('./routes/history');

const SaweriaService      = require('./services/saweria');
const AlertQueueService   = require('./services/alertQueue');
const AlertHistoryService = require('./services/alertHistory');
const ConfigService       = require('./services/config');

let io = null;

// ── Path resolver: benar di dev & production ──────────────────────────────────
function resolvePath(devRelPath, prodFolder) {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../../', devRelPath);
  }
  // Di production, extra resources ada di process.resourcesPath
  return path.join(process.resourcesPath, prodFolder);
}

function startExpressServer(port = 5174) {
  return new Promise((resolve, reject) => {
    const app        = express();
    const httpServer = http.createServer(app);

    io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      transports: ['websocket', 'polling'],
    });

    // ── Middleware ──
    app.use(cors());
    app.use(express.json({ limit: '2mb' }));

    // ── Static: Overlay HTML (masuk ke OBS) ──
    const overlayDir = resolvePath('overlay', 'overlay');
    app.use('/overlay', express.static(overlayDir));
    console.log(`[Server] Overlay dir: ${overlayDir}`);

    // ── Static: Sounds ──
    const soundsDir = resolvePath('public/sounds', 'sounds');
    app.use('/sounds', express.static(soundsDir));
    console.log(`[Server] Sounds dir: ${soundsDir}`);

    // ── Static: Logo assets untuk overlay ──
    const overlayAssetsDir = resolvePath('overlay/assets', path.join('overlay', 'assets'));
    app.use('/overlay-assets', express.static(overlayAssetsDir));

    // ── Services ──
    const configService  = new ConfigService();
    const historyService = new AlertHistoryService();
    const alertQueue     = new AlertQueueService(io, historyService);

    // ── Routes ──
    app.use('/api/alerts',    alertRoutes);
    app.use('/api/config',    configRoutes);
    app.use('/api/platforms', platformRoutes);
    app.use('/api/history',   historyRoutes);

    // ── Health check ──
    app.get('/health', (_, res) => res.json({
      status:  'ok',
      version: '1.0.0',
      port,
      uptime:  process.uptime(),
    }));

    // ── Expose ke routes via app.locals ──
    app.locals.io             = io;
    app.locals.alertQueue     = alertQueue;
    app.locals.alertHistory   = historyService;
    app.locals.configService  = configService;

    // ── Socket.IO ──
    io.on('connection', (socket) => {
      console.log(`[Socket] Connected: ${socket.id}`);

      socket.on('overlay:ready', () => {
        socket.emit('config:update', configService.getAll());
        socket.emit('queue:update',  alertQueue.getStatus());
        console.log(`[Socket] Overlay ready, config sent to ${socket.id}`);
      });

      socket.on('alert:test', (platform) => {
        alertQueue.push(makeTestAlert(platform));
      });

      socket.on('alert:done', (alertId) => {
        alertQueue.alertDone(alertId);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
      });
    });

    // ── Auto-start Saweria polling jika sudah dikonfigurasi ──
    const sawCfg = configService.getPlatform('saweria');
    if (sawCfg?.enabled && sawCfg?.streamKey) {
      const saw = new SaweriaService(sawCfg.streamKey, alertQueue);
      saw.startPolling(sawCfg.pollingInterval || 5000);
      app.locals.saweriaService = saw;
      console.log('[Server] Saweria polling auto-started');
    }

    httpServer.listen(port, '127.0.0.1', () => {
      console.log(`[Server] HSNAD running on http://127.0.0.1:${port}`);
      resolve(httpServer);
    });

    httpServer.on('error', (err) => {
      console.error('[Server] Error:', err);
      reject(err);
    });
  });
}

function makeTestAlert(platform = 'saweria') {
  const map = {
    saweria: {
      platform:  'saweria',
      donorName: 'StreamerFan88',
      amount:    25000,
      currency:  'IDR',
      message:   'Semangat streamnya kak! 🔥',
      timestamp: Date.now(),
    },
  };
  return map[platform] ?? map.saweria;
}

module.exports = { startExpressServer, getIO: () => io };
