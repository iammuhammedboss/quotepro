const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔹 Create Scope with Duplicate Check
router.post('/api/scope', async (req, res) => {
  const { scope } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM scope WHERE LOWER(TRIM(scope)) = LOWER(?) LIMIT 1',
      [scope.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Scope already exists' });
    }

    await db.query('INSERT INTO scope (scope) VALUES (?)', [scope.trim()]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create scope error:', err);
    res.status(500).json({ error: 'Failed to save scope' });
  }
});

// 🔹 Update Scope
router.put('/api/scope/:id', async (req, res) => {
  const { scope } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE scope SET scope = ? WHERE id = ?', [scope, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update scope error:', err);
    res.status(500).json({ error: 'Failed to update scope' });
  }
});

// 🔹 Delete Scope
router.delete('/api/scope/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM scope WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete scope error:', err);
    res.status(500).json({ error: 'Failed to delete scope' });
  }
});

// 🔹 Search Scope (Paginated)
router.get('/api/scope/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(`
      SELECT * FROM scope
      WHERE scope LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, limit, offset]);

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Search scope error:', err);
    res.status(500).json({ error: 'Failed to fetch scope' });
  }
});

// 🔹 Get One Scope by ID
router.get('/api/scope/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM scope WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get scope by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch scope' });
  }
});

// 🔹 Duplicate Check
router.get('/api/scope/check', async (req, res) => {
  const { name } = req.query;

  try {
    const [results] = await db.query(
      'SELECT * FROM scope WHERE LOWER(TRIM(scope)) = LOWER(?) LIMIT 1',
      [name.trim()]
    );

    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error('❌ Duplicate scope check error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
