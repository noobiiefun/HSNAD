const Store = require('electron-store');

const DEFAULT_ALERT = {
  enabled:         true,
  duration:        8,
  textDelay:       0.5,
  layout:          'image-above-text',
  imageUrl:        '',
  imageSize:       50,
  // Sound
  sound:           'default',
  soundUrl:        '',
  soundVolume:     70,
  // Message
  messageTemplate: '{name} donasi {amount}!',
  // Animation
  animationIn:     'bounceIn',
  animationOut:    'fadeOut',
  textAnimation:   'wiggle',
  // Font
  font:            'Inter',
  fontSize:        28,
  fontWeight:      '700',
  // Color
  textColor:       '#FFFFFF',
  highlightColor:  '#32C3A6',
  backgroundColor: 'rgba(15,15,23,0.88)',
  // Filter
  minAmount:       0,
};

const DEFAULT_CONFIG = {
  platforms: {
    saweria: {
      enabled:         false,
      streamKey:       '',
      pollingInterval: 5000,
      alert: { ...DEFAULT_ALERT },
    },
  },
  overlay: {
    width:    400,
    height:   300,
    position: 'top-center',
  },
};

class ConfigService {
  constructor() {
    try {
      this.store = new Store({
        name:     'hsnad-config',
        defaults: DEFAULT_CONFIG,
      });
    } catch {
      this._mem = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  _get(key)        { return this.store ? this.store.get(key) : this._mem[key]; }
  _set(key, value) { this.store ? this.store.set(key, value) : (this._mem[key] = value); }

  getAll() {
    return { platforms: this._get('platforms'), overlay: this._get('overlay') };
  }

  getPlatform(key) {
    return (this._get('platforms') || {})[key] || null;
  }

  setPlatform(key, data) {
    const all = this._get('platforms') || {};
    all[key]  = { ...all[key], ...data };
    this._set('platforms', all);
    return all[key];
  }

  getPlatformAlert(key) {
    return this.getPlatform(key)?.alert || { ...DEFAULT_ALERT };
  }

  setPlatformAlert(key, alertConfig) {
    const p = this.getPlatform(key) || {};
    return this.setPlatform(key, { ...p, alert: { ...(p.alert || DEFAULT_ALERT), ...alertConfig } });
  }

  getOverlay()      { return this._get('overlay'); }
  setOverlay(data)  { this._set('overlay', { ...this._get('overlay'), ...data }); return this._get('overlay'); }
  reset()           { this.store ? this.store.clear() : (this._mem = JSON.parse(JSON.stringify(DEFAULT_CONFIG))); }

  static get DEFAULT_ALERT() { return DEFAULT_ALERT; }
}

module.exports = ConfigService;
