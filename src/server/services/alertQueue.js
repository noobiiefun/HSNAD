const { v4: uuidv4 } = require('uuid');

class AlertQueueService {
  constructor(io) {
    this.io = io;
    this.queue = [];
    this.isPlaying = false;
    this.currentAlert = null;
  }

  push(alertData) {
    const alert = {
      id: uuidv4(),
      ...alertData,
      queuedAt: Date.now(),
    };

    this.queue.push(alert);
    console.log(`[Queue] Alert added: ${alert.platform} from ${alert.donorName} — Queue length: ${this.queue.length}`);

    if (!this.isPlaying) {
      this._playNext();
    }
  }

  _playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentAlert = null;
      return;
    }

    this.isPlaying = true;
    this.currentAlert = this.queue.shift();

    // Emit ke semua overlay yang connected
    this.io.emit('alert:show', this.currentAlert);
    console.log(`[Queue] Playing alert: ${this.currentAlert.id}`);
  }

  // Dipanggil oleh overlay saat alert selesai tampil
  alertDone(alertId) {
    if (this.currentAlert?.id === alertId) {
      console.log(`[Queue] Alert done: ${alertId}`);
      // Delay sedikit sebelum alert berikutnya
      setTimeout(() => this._playNext(), 500);
    }
  }

  skip() {
    if (this.currentAlert) {
      this.io.emit('alert:skip');
      setTimeout(() => this._playNext(), 300);
    }
  }

  clear() {
    this.queue = [];
    if (this.currentAlert) {
      this.io.emit('alert:skip');
      this.isPlaying = false;
      this.currentAlert = null;
    }
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.queue.length,
      currentAlert: this.currentAlert,
    };
  }
}

module.exports = AlertQueueService;
