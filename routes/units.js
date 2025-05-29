const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔹 Create Unit with Duplicate Check
router.post('/api/units', async (req, res) => {
  const { unit } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM units WHERE LOWER(TRIM(unit)) = LOWER(?) LIMIT 1',
      [unit.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Unit already exists' });
    }

    await db.query('INSERT INTO units (unit) VALUES (?)', [unit.trim()]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create unit error:', err);
    res.status(500).json({ error: 'Failed to save unit' });
  }
});

// 🔹 Update Unit
router.put('/api/units/:id', async (req, res) => {
  const { unit } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE units SET unit = ? WHERE id = ?', [unit, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update unit error:', err);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// 🔹 Delete Unit
router.delete('/api/units/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM units WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete unit error:', err);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// 🔹 Search Units (Paginated)
router.get('/api/units/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(`
      SELECT * FROM units
      WHERE unit LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, limit, offset]);

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Fetch units error:', err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// 🔹 Get One Unit by ID
router.get('/api/units/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM units WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get unit error:', err);
    res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

// 🔹 Duplicate Check
router.get('/api/units/check', async (req, res) => {
  const { name } = req.query;

  try {
    const [results] = await db.query(
      'SELECT * FROM units WHERE LOWER(TRIM(unit)) = LOWER(?) LIMIT 1',
      [name.trim()]
    );

    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error('❌ Check unit error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 🔹 Quick Search for Autocomplete (10 results)
router.get('/api/units/search-autocomplete', async (req, res) => {
  const search = req.query.q || '';

  try {
    const [rows] = await db.query(
      'SELECT unit FROM units WHERE unit LIKE ? ORDER BY unit ASC LIMIT 10',
      [`%${search}%`]
    );

    res.json({ results: rows });
  } catch (err) {
    console.error('❌ Autocomplete search error:', err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

module.exports = router;
