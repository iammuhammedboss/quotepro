const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔹 Create Quotation Item with Duplicate Check
router.post('/api/quotation-items', async (req, res) => {
  const { item } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM quotation_items WHERE LOWER(TRIM(item)) = LOWER(?) LIMIT 1',
      [item.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Item already exists' });
    }

    await db.query('INSERT INTO quotation_items (item) VALUES (?)', [item.trim()]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create item error:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

// 🔹 Update Item
router.put('/api/quotation-items/:id', async (req, res) => {
  const { item } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE quotation_items SET item = ? WHERE id = ?', [item, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update item error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// 🔹 Delete Item
router.delete('/api/quotation-items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM quotation_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// 🔹 Search Items (Paginated)
router.get('/api/quotation-items/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(
      `SELECT * FROM quotation_items
       WHERE item LIKE ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Fetch items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// 🔹 Get One Item by ID
router.get('/api/quotation-items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM quotation_items WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get item by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// 🔹 Duplicate Check
router.get('/api/quotation-items/check', async (req, res) => {
  const { name } = req.query;

  try {
    const [results] = await db.query(
      'SELECT * FROM quotation_items WHERE LOWER(TRIM(item)) = LOWER(?) LIMIT 1',
      [name.trim()]
    );

    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error('❌ Duplicate item check error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
