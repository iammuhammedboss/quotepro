const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/db'); // uses mysql2/promise

// 🔐 Login Route
router.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body;

  console.log('🚀 POST /login hit');
  console.log('🧾 Username:', username);

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    console.log('📦 DB Query completed');

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // ✅ Save to session
    req.session.user = {
      id: user.id,
      username: user.username
    };

    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// 🔓 Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
