const { v4: uuidv4 } = require('uuid');

const MAX_HISTORY = 200;

class AlertHistoryService {
  constructor() {
    this.history = [];
  }

  add(alert) {
    const entry = {
      id:         alert.id || uuidv4(),
      platform:   alert.platform,
      donorName:  alert.donorName,
      amount:     alert.amount,
      currency:   alert.currency || 'IDR',
      message:    alert.message || '',
      timestamp:  alert.timestamp || Date.now(),
      shownAt:    Date.now(),
    };
    this.history.unshift(entry);
    if (this.history.length > MAX_HISTORY) this.history.pop();
    return entry;
  }

  getAll(limit = 50) {
    return this.history.slice(0, limit);
  }

  getStats() {
    const total   = this.history.length;
    const totalRp = this.history.reduce((s, h) => s + (h.amount || 0), 0);
    const byPlatform = {};
    this.history.forEach(h => {
      byPlatform[h.platform] = (byPlatform[h.platform] || 0) + 1;
    });
    return { total, totalRp, byPlatform };
  }

  clear() {
    this.history = [];
  }
}

module.exports = AlertHistoryService;
