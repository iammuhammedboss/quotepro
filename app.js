const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer'); // Add this
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

const app = express();
const PORT = 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
app.use(session({
  secret: 'quotepro-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ✅ FIXED: Middleware - Add multer for FormData handling
const upload = multer(); // Configure multer for memory storage

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(upload.any()); // ✅ Add this to handle FormData
app.use('/js', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

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

// Page routes
app.get('/', (req, res) => res.render('login'));

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('dashboard', { user: req.session.user });
});

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

app.get('/quotations/view/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  // This will be handled by the quotation routes
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server started: http://localhost:${PORT}`);
});