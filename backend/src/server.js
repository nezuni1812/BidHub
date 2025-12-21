const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const passport = require('./config/passport');
const { logger, errorLogger, winstonInstance } = require('./config/logger');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes');
const swaggerSpecs = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const db = require('./config/database');
const initSocket = require('./socket');
const { initScheduler, stopScheduler } = require('./jobs/auctionScheduler');
const { getRedisClient, closeRedis } = require('./services/redisClient');

const app = express();
const server = http.createServer(app);

// Swagger documentation - MUST be before other middleware
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Winston logger middleware (logs all HTTP requests)
app.use(logger);

// Initialize Passport
app.use(passport.initialize());

// Set default charset for API responses only
app.use((req, res, next) => {
  if (!req.path.startsWith('/api-docs')) {
    res.charset = 'utf-8';
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BidHub API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

app.use(config.apiPrefix, routes);

// Make Socket.IO available to controllers
const io = initSocket(server);
app.set('io', io);

// Error handlers
app.use(errorLogger); // Winston error logger
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
server.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║           🎯 BidHub API Server            ║
║                                            ║
╠════════════════════════════════════════════╣
║                                            ║
║  Status:        Running ✓                  ║
║  Environment:   ${config.env.padEnd(28)}║
║  Port:          ${PORT.toString().padEnd(28)}║
║  API Prefix:    ${config.apiPrefix.padEnd(28)}║
║                                            ║
║  📚 Documentation:                         ║
║  http://localhost:${PORT}/api-docs           ║
║                                            ║
║  🚀 Base URL:                              ║
║  http://localhost:${PORT}${config.apiPrefix}      ║
║                                            ║
║  🔌 WebSocket:                             ║
║                                            ║
║  📊 Logging:                               ║
║  Files:         ./logs/*.json              ║
║  Elasticsearch: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9200'.padEnd(23)}║
║  Kibana:        http://localhost:5601      ║
║  ws://localhost:${PORT}                      ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
  
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    console.log('✓ Database connection successful');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  }

  // Test Redis connection
  try {
    const redis = getRedisClient();
    await redis.ping();
    console.log('✓ Redis connection successful');
  } catch (error) {
    console.error('✗ Redis connection failed:', error.message);
  }

  // Start background jobs
  initScheduler(io);
  
  console.log('');
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Stop scheduled jobs
    stopScheduler();
    
    // Close Redis connection
    await closeRedis();
    
    // Close database pool
    await db.pool.end();
    console.log('Database pool closed');
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = { app, server, io };
