const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');

const loginRoute = require('./routes/login');
const clientRoutes = require('./routes/clients');
const materialRoutes = require('./routes/materials');
const scopeRoutes = require('./routes/scope');
const termsRoutes = require('./routes/terms');
const unitsRoutes = require('./routes/units');
const quotationItemsRoutes = require('./routes/quotation_items');
const quotationRoutes = require('./routes/quotation');
const searchRoutes = require('./routes/search');
const exportRoutes = require('./routes/export'); // Original export routes
const exportEnhancedRoutes = require('./routes/export-enhanced'); // Enhanced export routes

const app = express();
const PORT = 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: 'quotepro-enhanced-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use('/js', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// EJS Helper Functions - Make available globally in all templates
app.locals.getFontSize = function(sizeCategory, type) {
  const sizes = {
    small: { header: 24, body: 12, table: 10 },
    medium: { header: 28, body: 14, table: 12 },
    large: { header: 32, body: 16, table: 14 }
  };
  
  return sizes[sizeCategory] ? sizes[sizeCategory][type] : sizes.medium[type];
};

app.locals.formatCurrency = function(amount, decimals = 3) {
  return parseFloat(amount || 0).toFixed(decimals);
};

app.locals.formatDate = function(date, format = 'en-GB') {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString(format);
};

app.locals.truncateText = function(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Security middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Route mounting
app.use('/', loginRoute);
app.use('/', clientRoutes);
app.use('/', materialRoutes);
app.use('/', scopeRoutes);
app.use('/', termsRoutes);
app.use('/', unitsRoutes);
app.use('/', quotationItemsRoutes);
app.use('/', quotationRoutes);
app.use('/', searchRoutes);
app.use('/', exportRoutes); // Original export functionality
app.use('/', exportEnhancedRoutes); // Enhanced export functionality

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.render('login');
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('dashboard', { user: req.session.user });
});

// Master data routes
app.get('/clients', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('clients', { user: req.session.user });
});

app.get('/materials', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('materials', { user: req.session.user });
});

app.get('/scope', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('scope', { user: req.session.user });
});

app.get('/terms', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('terms', { user: req.session.user });
});

app.get('/units', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('units', { user: req.session.user });
});

app.get('/quotation-items', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('quotation_items', { user: req.session.user });
});

// Quick stats API for dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    // Get basic statistics
    const [quotationCount] = await db.query('SELECT COUNT(*) as count FROM quotations');
    const [clientCount] = await db.query('SELECT COUNT(*) as count FROM clients');
    const [totalValue] = await db.query('SELECT SUM(grand_total) as total FROM quotations');
    const [recentQuotations] = await db.query(`
      SELECT q.*, c.name as client_name 
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id 
      ORDER BY q.id DESC 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      stats: {
        totalQuotations: quotationCount[0].count,
        totalClients: clientCount[0].count,
        totalValue: totalValue[0].total || 0,
        recentQuotations: recentQuotations
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Application Error:', err);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    // API request
    res.json({
      success: false,
      error: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack })
    });
  } else {
    // Web request
    res.render('error', {
      message: isDevelopment ? err.message : 'Something went wrong!',
      error: isDevelopment ? err : {},
      user: req.session?.user
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: false, error: 'API endpoint not found' });
  } else {
    res.render('404', { 
      url: req.url,
      user: req.session?.user
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ===============================================');
  console.log('🎉 QuotePro Enhanced Server Started Successfully!');
  console.log('🚀 ===============================================');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏠 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔍 Search: http://localhost:${PORT}/quotations/search`);
  console.log(`⚡ Enhanced Export: http://localhost:${PORT}/quotations/export-enhanced/[ID]`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
  console.log('🚀 ===============================================');
});

module.exports = app;