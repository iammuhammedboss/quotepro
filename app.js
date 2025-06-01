const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');

// Import all routes
const loginRoute = require('./routes/login');
const clientRoutes = require('./routes/clients');
const materialRoutes = require('./routes/materials');
const scopeRoutes = require('./routes/scope');
const termsRoutes = require('./routes/terms');
const unitsRoutes = require('./routes/units');
const quotationItemsRoutes = require('./routes/quotation_items');
const quotationRoutes = require('./routes/quotation');
const searchRoutes = require('./routes/search');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'quotepro-enhanced-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'quotepro.sid'
}));

// Enhanced middleware stack
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Cache control for static assets
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  maxAge: '1d',
  etag: true
}));

app.use('/js', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  maxAge: '7d',
  etag: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.path.startsWith('/api/') || req.path.includes('/export/')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    return res.redirect('/');
  }
  next();
}

// Route mounting with authentication
app.use('/', loginRoute);
app.use('/', requireAuth, clientRoutes);
app.use('/', requireAuth, materialRoutes);
app.use('/', requireAuth, scopeRoutes);
app.use('/', requireAuth, termsRoutes);
app.use('/', requireAuth, unitsRoutes);
app.use('/', requireAuth, quotationItemsRoutes);
app.use('/', requireAuth, quotationRoutes);
app.use('/', requireAuth, searchRoutes);
app.use('/', requireAuth, exportRoutes);

// Enhanced page routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { 
    title: 'Login - QuotePro',
    error: null 
  });
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get dashboard statistics
    const [quotationStats] = await db.query(`
      SELECT 
        COUNT(*) as total_quotations,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_quotations,
        SUM(grand_total) as total_value,
        AVG(grand_total) as avg_value
      FROM quotations 
      WHERE created_by = ?
    `, [req.session.user.id]);

    const [recentQuotations] = await db.query(`
      SELECT q.*, c.name as client_name 
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id 
      WHERE q.created_by = ? 
      ORDER BY q.created_at DESC 
      LIMIT 5
    `, [req.session.user.id]);

    res.render('dashboard', { 
      user: req.session.user,
      stats: quotationStats[0] || {},
      recentQuotations: recentQuotations || [],
      title: 'Dashboard - QuotePro'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', { 
      user: req.session.user,
      stats: {},
      recentQuotations: [],
      title: 'Dashboard - QuotePro',
      error: 'Failed to load dashboard data'
    });
  }
});

app.get('/clients', requireAuth, (req, res) => {
  res.render('clients', { 
    user: req.session.user,
    title: 'Clients - QuotePro'
  });
});

app.get('/materials', requireAuth, (req, res) => {
  res.render('materials', { 
    user: req.session.user,
    title: 'Materials - QuotePro'
  });
});

app.get('/scope', requireAuth, (req, res) => {
  res.render('scope', { 
    user: req.session.user,
    title: 'Scope of Work - QuotePro'
  });
});

app.get('/terms', requireAuth, (req, res) => {
  res.render('terms', { 
    user: req.session.user,
    title: 'Terms & Conditions - QuotePro'
  });
});

app.get('/units', requireAuth, (req, res) => {
  res.render('units', { 
    user: req.session.user,
    title: 'Units - QuotePro'
  });
});

app.get('/quotation-items', requireAuth, (req, res) => {
  res.render('quotation_items', { 
    user: req.session.user,
    title: 'Quotation Items - QuotePro'
  });
});

// API endpoints for real-time features
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/api/user/settings', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.session.user.id,
      username: req.session.user.username,
      preferences: req.session.user.preferences || {}
    }
  });
});

// Export progress tracking endpoint
app.get('/api/export/progress/:jobId', requireAuth, (req, res) => {
  const jobId = req.params.jobId;
  // This would integrate with a job queue system
  res.json({
    success: true,
    progress: {
      percentage: 75,
      stage: 'Generating PDF...',
      eta: '5 seconds'
    }
  });
});

// Enhanced error handling
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, error);

  // Different error handling for different request types
  if (req.path.startsWith('/api/') || req.path.includes('/export/')) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: timestamp
    });
  }

  // Render error page for regular requests
  res.status(500).render('error', {
    title: 'Error - QuotePro',
    error: {
      status: 500,
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    },
    user: req.session.user || null
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: `API endpoint ${req.path} not found`
    });
  }

  res.status(404).render('error', {
    title: '404 - Page Not Found',
    error: {
      status: 404,
      message: 'Page Not Found',
      details: `The page ${req.path} could not be found`
    },
    user: req.session.user || null
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server with enhanced logging
app.listen(PORT, () => {
  console.log('🚀 ===================================');
  console.log(`✅ QuotePro Server Started Successfully`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📤 Export functionality: ENABLED`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('🚀 ===================================');
});