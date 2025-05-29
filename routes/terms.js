const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔹 Create Term with Duplicate Check
router.post('/api/terms', async (req, res) => {
  const { term } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM terms WHERE LOWER(TRIM(term)) = LOWER(?) LIMIT 1',
      [term.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Term already exists' });
    }

    await db.query('INSERT INTO terms (term) VALUES (?)', [term.trim()]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create term error:', err);
    res.status(500).json({ error: 'Failed to save term' });
  }
});

// 🔹 Update Term
router.put('/api/terms/:id', async (req, res) => {
  const { term } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE terms SET term = ? WHERE id = ?', [term, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update term error:', err);
    res.status(500).json({ error: 'Failed to update term' });
  }
});

// 🔹 Delete Term
router.delete('/api/terms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM terms WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete term error:', err);
    res.status(500).json({ error: 'Failed to delete term' });
  }
});

// 🔹 Search Terms (Paginated)
router.get('/api/terms/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(
      `SELECT * FROM terms WHERE term LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Fetch terms error:', err);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// 🔹 Get One Term by ID
router.get('/api/terms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM terms WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get term error:', err);
    res.status(500).json({ error: 'Failed to fetch term' });
  }
});

// 🔹 Duplicate Check
router.get('/api/terms/check', async (req, res) => {
  const { name } = req.query;

  try {
    const [results] = await db.query(
      'SELECT * FROM terms WHERE LOWER(TRIM(term)) = LOWER(?) LIMIT 1',
      [name.trim()]
    );

    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error('❌ Duplicate check error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
