const axios = require('axios');

const SAWERIA_API = 'https://streaming.saweria.co/transactions';

class SaweriaService {
  constructor(streamKey, alertQueue) {
    this.streamKey = streamKey;
    this.alertQueue = alertQueue;
    this.pollingInterval = null;
    this.lastTransactionId = null;
    this.isRunning = false;
  }

  async fetchLatest() {
    try {
      const response = await axios.get(SAWERIA_API, {
        headers: {
          'streamkey': this.streamKey,
        },
        timeout: 10000,
      });

      const transactions = response.data?.data || [];
      return transactions;
    } catch (err) {
      if (err.response?.status === 401) {
        console.error('[Saweria] Invalid stream key!');
      } else {
        console.error('[Saweria] Polling error:', err.message);
      }
      return [];
    }
  }

  async poll() {
    const transactions = await this.fetchLatest();

    if (!transactions.length) return;

    // Pada poll pertama, set lastId tanpa trigger alert
    if (this.lastTransactionId === null) {
      this.lastTransactionId = transactions[0]?.id || null;
      console.log('[Saweria] Initialized, last transaction ID:', this.lastTransactionId);
      return;
    }

    // Cari transaksi baru (lebih baru dari lastTransactionId)
    const newTransactions = [];
    for (const tx of transactions) {
      if (tx.id === this.lastTransactionId) break;
      newTransactions.push(tx);
    }

    if (newTransactions.length > 0) {
      this.lastTransactionId = newTransactions[0].id;

      // Push ke queue (urutan dari yang terlama)
      for (const tx of newTransactions.reverse()) {
        this.alertQueue.push(this._parseTransaction(tx));
      }
    }
  }

  _parseTransaction(tx) {
    return {
      platform: 'saweria',
      donorName: tx.donatur_name || 'Anonymous',
      amount: tx.amount || 0,
      currency: 'IDR',
      message: tx.donatur_message || '',
      rawAmount: tx.amount,
      timestamp: new Date(tx.created_at).getTime() || Date.now(),
      avatar: tx.donatur_avatar || null,
    };
  }

  startPolling(intervalMs = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;

    // Langsung poll pertama kali
    this.poll();

    this.pollingInterval = setInterval(() => {
      this.poll();
    }, intervalMs);

    console.log(`[Saweria] Polling started every ${intervalMs}ms`);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('[Saweria] Polling stopped');
  }

  updateStreamKey(newKey) {
    this.streamKey = newKey;
    this.lastTransactionId = null; // Reset agar tidak miss donasi
    console.log('[Saweria] Stream key updated');
  }
}

module.exports = SaweriaService;
