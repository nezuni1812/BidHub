const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const expressWinston = require('express-winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const levels = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3
};

/**
 * Filter logs by level
 */
const levelFilter = (level) => winston.format((info) => (info.level === level ? info : false))();

/**
 * Create daily rotate file transport
 */
const dailyRotateFile = (level) => new DailyRotateFile({
  level: level,
  dirname: 'logs',
  filename: `%DATE%-${level}.json`,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    levelFilter(level)
  )
});

/**
 * Elasticsearch transport configuration
 */
const esTransportOpts = {
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  level: 'info',
  indexPrefix: 'bidhub-log'
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

/**
 * Create transports for all levels
 */
const levelsList = Object.keys(levels);
const rotateTransports = levelsList.map(dailyRotateFile);

/**
 * Winston instance
 */
const winstonInstance = winston.createLogger({
  levels: levels,
  transports: [
    ...rotateTransports,
    esTransport
  ],
  exitOnError: false
});

// Add whitelist fields
expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');

// Handle Elasticsearch errors
esTransport.on('error', (error) => {
  console.error('⚠️  Elasticsearch logging error:', error.message);
});

esTransport.on('warning', (warning) => {
  console.warn('⚠️  Elasticsearch warning:', warning);
});

/**
 * Express winston middleware
 */
const logger = expressWinston.logger({
  winstonInstance: winstonInstance,
  statusLevels: false,
  level: (req, res) => {
    if (res.statusCode === 401 || res.statusCode === 403) { return "critical"; }
    if (res.statusCode >= 500) { return "error"; }
    if (res.statusCode >= 400) { return "warn"; }
    if (res.statusCode >= 100) { return "info"; }
  },
  dynamicMeta: (req, res) => ({
    ip: req.ip,
    url: req.url,
    method: req.method,
    statusCode: res.statusCode,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  }),
  requestField: null,
  responseField: null,
  expressFormat: true,
  colorize: false,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  ignoreRoute: (req, res) => {
    // Ignore health check endpoints
    return req.url === '/health' || req.url === '/api/v1/health';
  }
});

/**
 * Error logger middleware
 */
const errorLogger = expressWinston.errorLogger({
  winstonInstance: winstonInstance,
  level: 'error',
  meta: true,
  dynamicMeta: (req, res) => ({
    ip: req.ip,
    url: req.url,
    method: req.method,
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  })
});

module.exports = {
  logger,
  errorLogger,
  winstonInstance
};
