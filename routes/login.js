const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/db'); // uses mysql2/promise

// 🔥 GET route for login page (THIS WAS MISSING!)
router.get('/', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('login', { 
    title: 'Login - QuotePro Enhanced'
  });
});

// 🔐 Login POST Route
router.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body;

  console.log('🚀 POST /login hit');
  console.log('🧾 Username:', username);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    console.log('📦 DB Query completed');

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // ✅ Save to session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email || null
    };

    console.log('✅ User logged in successfully:', username);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Database connection error. Please try again.' });
  }
});

// 🔓 Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    console.log('✅ User logged out successfully');
    res.redirect('/');
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    console.log('✅ User logged out successfully');
    res.json({ success: true });
  });
});

// 🔧 Test route to create a test user (REMOVE IN PRODUCTION)
router.get('/create-test-user', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if user already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (existingUser.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Test user already exists! Username: admin, Password: admin123' 
      });
    }
    
    await db.query(`
      INSERT INTO users (username, password, email, created_at) 
      VALUES (?, ?, ?, NOW())
    `, ['admin', hashedPassword, 'admin@quotepro.com']);
    
    res.json({ 
      success: true, 
      message: 'Test user created! Username: admin, Password: admin123' 
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🔧 Database test route
router.get('/test-db', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    res.json({ 
      success: true, 
      message: 'Database connection working!',
      result: result[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;