const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔹 Create Material with Duplicate Check
router.post('/api/materials', async (req, res) => {
  const { material_name } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM materials WHERE LOWER(TRIM(material_name)) = LOWER(?) LIMIT 1',
      [material_name.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Material already exists' });
    }

    await db.query(
      'INSERT INTO materials (material_name) VALUES (?)',
      [material_name.trim()]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create material error:', err);
    res.status(500).json({ error: 'Failed to save material' });
  }
});

// 🔹 Update Material
router.put('/api/materials/:id', async (req, res) => {
  const { material_name } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE materials SET material_name = ? WHERE id = ?', [material_name, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update material error:', err);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// 🔹 Delete Material
router.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete material error:', err);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// 🔹 Search Materials (Paginated)
router.get('/api/materials/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(`
      SELECT * FROM materials
      WHERE material_name LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, limit, offset]);

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Fetch materials error:', err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// 🔹 Get One Material by ID
router.get('/api/materials/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM materials WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get material error:', err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// 🔹 Duplicate Check
router.get('/api/materials/check', async (req, res) => {
  const { name } = req.query;

  try {
    const [results] = await db.query(
      'SELECT * FROM materials WHERE LOWER(TRIM(material_name)) = LOWER(?) LIMIT 1',
      [name.trim()]
    );

    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error('❌ Check material error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
