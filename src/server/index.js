const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Routes
const alertRoutes = require('./routes/alerts');
const configRoutes = require('./routes/config');
const platformRoutes = require('./routes/platforms');

// Services
const SaweriaService = require('./services/saweria');
const AlertQueueService = require('./services/alertQueue');
const ConfigService = require('./services/config');

let io = null;
let saweriaService = null;
let alertQueue = null;

function startExpressServer(port = 5174) {
  return new Promise((resolve, reject) => {
    const app = express();
    const httpServer = http.createServer(app);

    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Serve overlay HTML statis
    const overlayPath = path.join(
      process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../overlay')
        : path.join(process.resourcesPath, 'overlay')
    );
    app.use('/overlay', express.static(overlayPath));

    // API Routes
    app.use('/api/alerts', alertRoutes);
    app.use('/api/config', configRoutes);
    app.use('/api/platforms', platformRoutes);

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

    // Init services
    const configService = new ConfigService();
    alertQueue = new AlertQueueService(io);

    // Socket.IO connection
    io.on('connection', (socket) => {
      console.log('[Socket] Client connected:', socket.id);

      // Kirim config saat overlay connect
      socket.on('overlay:ready', () => {
        const config = configService.getAll();
        socket.emit('config:update', config);
        console.log('[Socket] Overlay ready, config sent');
      });

      // Dashboard request test alert
      socket.on('alert:test', (platformKey) => {
        const testAlert = generateTestAlert(platformKey);
        alertQueue.push(testAlert);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected:', socket.id);
      });
    });

    // Pass io & queue ke routes via app.locals
    app.locals.io = io;
    app.locals.alertQueue = alertQueue;
    app.locals.configService = configService;

    // Start Saweria polling jika sudah dikonfigurasi
    const saweriaConfig = configService.getPlatform('saweria');
    if (saweriaConfig?.enabled && saweriaConfig?.streamKey) {
      saweriaService = new SaweriaService(saweriaConfig.streamKey, alertQueue);
      saweriaService.startPolling();
      console.log('[Server] Saweria polling started');
    }

    httpServer.listen(port, () => {
      console.log(`[Server] Hey Streamer running on http://localhost:${port}`);
      resolve(httpServer);
    });

    httpServer.on('error', reject);
  });
}

function generateTestAlert(platformKey = 'saweria') {
  const samples = {
    saweria: {
      id: `test-${Date.now()}`,
      platform: 'saweria',
      donorName: 'TestUser123',
      amount: 10000,
      currency: 'IDR',
      message: 'Halo! Ini test alert dari Saweria 🎉',
      timestamp: Date.now(),
    },
  };
  return samples[platformKey] || samples.saweria;
}

module.exports = { startExpressServer, getIO: () => io, getAlertQueue: () => alertQueue };
