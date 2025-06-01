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
const exportRoutes = require('./routes/export'); // 🔥 ADD THIS LINE

const app = express();
const PORT = 3000;

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
app.use(session({
  secret: 'quotepro-enhanced-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/js', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 Authentication middleware function
function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.path.startsWith('/api/') || req.path.includes('/export/')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    return res.redirect('/');
  }
  next();
}

// Route mounting (login first, then protected routes)
app.use('/', loginRoute);

// Protected routes with authentication
app.use('/', requireAuth, clientRoutes);
app.use('/', requireAuth, materialRoutes);
app.use('/', requireAuth, scopeRoutes);
app.use('/', requireAuth, termsRoutes);
app.use('/', requireAuth, unitsRoutes);
app.use('/', requireAuth, quotationItemsRoutes);
app.use('/', requireAuth, quotationRoutes);
app.use('/', requireAuth, searchRoutes);
app.use('/', requireAuth, exportRoutes); // 🔥 ADD THIS LINE

// 🔥 Enhanced page routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Login - QuotePro' });
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
      stats: quotationStats[0] || {
        total_quotations: 0,
        today_quotations: 0,
        total_value: 0,
        avg_value: 0
      },
      recentQuotations: recentQuotations || [],
      title: 'Dashboard - QuotePro'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', { 
      user: req.session.user,
      stats: {
        total_quotations: 0,
        today_quotations: 0,
        total_value: 0,
        avg_value: 0
      },
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

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Enhanced error handling
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, error);

  if (req.path.startsWith('/api/') || req.path.includes('/export/')) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: timestamp
    });
  }

  res.status(500).send(`
    <h1>500 - Internal Server Error</h1>
    <p>Something went wrong. Please try again later.</p>
    <a href="/dashboard">Go to Dashboard</a>
  `);
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

  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>The page ${req.path} could not be found</p>
    <a href="/dashboard">Go to Dashboard</a>
  `);
});

// Start server with enhanced logging
app.listen(PORT, async () => {
  console.log('🚀 ===================================');
  console.log(`✅ QuotePro Enhanced Server Started`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📤 Export functionality: ENABLED`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  // Test database connection
  try {
    await db.query('SELECT 1');
    console.log(`✅ Database connection: SUCCESS`);
  } catch (error) {
    console.log(`❌ Database connection: FAILED - ${error.message}`);
  }
  
  console.log('🚀 ===================================');
});