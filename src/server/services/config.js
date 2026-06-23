const Store = require('electron-store');

const DEFAULT_CONFIG = {
  platforms: {
    saweria: {
      enabled: false,
      streamKey: '',
      pollingInterval: 5000, // ms
      alert: {
        enabled: true,
        duration: 8,           // detik
        textDelay: 1,
        layout: 'image-above-text',
        imageUrl: '',
        imageSize: 50,
        sound: 'default',
        soundVolume: 50,
        messageTemplate: '{name} donasi {amount}! {message}',
        animationIn: 'fadeIn',
        animationOut: 'fadeOut',
        textAnimation: 'wiggle',
        font: 'Inter',
        fontSize: 48,
        fontWeight: '700',
        textColor: '#FFFFFF',
        highlightColor: '#32C3A6',
        backgroundColor: 'transparent',
        minAmount: 0,        // filter donasi minimum
      },
    },
  },
  overlay: {
    width: 400,
    height: 300,
    position: 'top-center',
  },
};

class ConfigService {
  constructor() {
    // Cek apakah di Electron atau standalone
    let StoreClass = Store;
    try {
      this.store = new StoreClass({
        name: 'hey-streamer-config',
        defaults: DEFAULT_CONFIG,
      });
    } catch {
      // Fallback ke in-memory jika tidak di Electron
      this._memory = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  _get(key) {
    if (this.store) return this.store.get(key);
    return this._memory[key];
  }

  _set(key, value) {
    if (this.store) return this.store.set(key, value);
    this._memory[key] = value;
  }

  getAll() {
    return {
      platforms: this._get('platforms'),
      overlay: this._get('overlay'),
    };
  }

  getPlatform(platformKey) {
    const platforms = this._get('platforms') || {};
    return platforms[platformKey] || null;
  }

  setPlatform(platformKey, data) {
    const platforms = this._get('platforms') || {};
    platforms[platformKey] = { ...platforms[platformKey], ...data };
    this._set('platforms', platforms);
    return platforms[platformKey];
  }

  getPlatformAlert(platformKey) {
    const platform = this.getPlatform(platformKey);
    return platform?.alert || DEFAULT_CONFIG.platforms.saweria.alert;
  }

  setPlatformAlert(platformKey, alertConfig) {
    const platform = this.getPlatform(platformKey) || {};
    const updated = {
      ...platform,
      alert: { ...(platform.alert || {}), ...alertConfig },
    };
    return this.setPlatform(platformKey, updated);
  }

  getOverlay() {
    return this._get('overlay');
  }

  setOverlay(data) {
    const current = this._get('overlay') || {};
    this._set('overlay', { ...current, ...data });
    return this._get('overlay');
  }

  reset() {
    if (this.store) this.store.clear();
    else this._memory = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

module.exports = ConfigService;
