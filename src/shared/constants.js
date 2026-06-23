const PORTS = {
  OVERLAY: 5174,
  DASHBOARD_DEV: 3000,
};

const PLATFORMS = {
  SAWERIA: 'saweria',
  TRAKTEER: 'trakteer',
  SOCIABUZZ: 'sociabuzz',
};

const SOCKET_EVENTS = {
  OVERLAY_READY:   'overlay:ready',
  ALERT_SHOW:      'alert:show',
  ALERT_DONE:      'alert:done',
  ALERT_SKIP:      'alert:skip',
  ALERT_TEST:      'alert:test',
  CONFIG_UPDATE:   'config:update',
};

module.exports = { PORTS, PLATFORMS, SOCKET_EVENTS };
