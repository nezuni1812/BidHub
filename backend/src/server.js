const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes');
const swaggerSpecs = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const db = require('./config/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

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

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, async () => {
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
╚════════════════════════════════════════════╝
  `);
  
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message, '\n');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

module.exports = app;
