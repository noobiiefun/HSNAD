const { v4: uuidv4 } = require('uuid');

class AlertQueueService {
  constructor(io, historyService) {
    this.io       = io;
    this.history  = historyService;
    this.queue    = [];
    this.isPlaying= false;
    this.current  = null;
  }

  push(alertData) {
    const alert = { id: uuidv4(), ...alertData, queuedAt: Date.now() };
    this.queue.push(alert);
    console.log(`[Queue] +${alert.platform}/${alert.donorName} | Q:${this.queue.length}`);
    if (!this.isPlaying) this._next();
    // Broadcast queue length update ke dashboard
    this.io.emit('queue:update', this.getStatus());
  }

  _next() {
    if (!this.queue.length) {
      this.isPlaying = false;
      this.current   = null;
      this.io.emit('queue:update', this.getStatus());
      return;
    }
    this.isPlaying = true;
    this.current   = this.queue.shift();

    // Catat ke history
    if (this.history) this.history.add(this.current);

    this.io.emit('alert:show',   this.current);
    this.io.emit('queue:update', this.getStatus());
    console.log(`[Queue] Playing: ${this.current.id}`);
  }

  alertDone(alertId) {
    if (this.current?.id === alertId) {
      console.log(`[Queue] Done: ${alertId}`);
      setTimeout(() => this._next(), 500);
    }
  }

  skip() {
    if (this.current) {
      this.io.emit('alert:skip');
      setTimeout(() => this._next(), 300);
    }
  }

  clear() {
    this.queue = [];
    if (this.current) {
      this.io.emit('alert:skip');
      this.isPlaying = false;
      this.current   = null;
    }
    this.io.emit('queue:update', this.getStatus());
  }

  getStatus() {
    return {
      isPlaying:   this.isPlaying,
      queueLength: this.queue.length,
      currentAlert:this.current,
    };
  }
}

module.exports = AlertQueueService;
