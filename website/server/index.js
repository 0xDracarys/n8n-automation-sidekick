const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const workflowRoutes = require('./routes/workflow');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces

// Enhanced logging for server startup and connections
console.log('🚀 Starting n8n Automation Sidekick Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🏠 Host: ${HOST}`);

// Supabase connection validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('✅ Supabase configuration found');
  console.log(`📡 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
} else {
  console.warn('⚠️  Missing Supabase configuration');
  console.warn('   SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.warn('   SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined')); // More detailed logging
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173', // Vite frontend
    'chrome-extension://*', // Chrome extension
    /^chrome-extension:\/\/[a-z]{32}$/, // Specific extension ID pattern
    'http://localhost:3001', // Self-reference
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/auth', authRoutes);

// Enhanced health check with server info
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    supabaseConfigured: !!(supabaseUrl && supabaseKey),
    corsOrigins: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'chrome-extension://*'
    ]
  };
  res.json(healthData);
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// Enhanced server startup with explicit binding and error handling
const server = app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

  const address = server.address();
  console.log('✅ Server successfully started!');
  console.log(`🌐 Listening on: ${HOST}:${address.port}`);
  console.log(`🔗 Local access: http://localhost:${address.port}`);
  console.log(`🌍 Network access: http://${require('os').hostname()}:${address.port}`);
  console.log(`📊 Address info:`, address);
  console.log('');
  console.log('🚀 Available endpoints:');
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/profile`);
  console.log(`   POST /api/workflow/generate`);
  console.log(`   POST /api/workflow/save`);
  console.log(`   GET  /api/workflow/templates`);
  console.log('');

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
