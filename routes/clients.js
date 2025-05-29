const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 🔒 Create Client with Duplicate Check
router.post('/api/clients', async (req, res) => {
  const { name, phone } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM clients WHERE LOWER(TRIM(name)) = LOWER(?) AND TRIM(phone) = ? LIMIT 1',
      [name.trim(), phone.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Client already exists' });
    }

    await db.query(
      'INSERT INTO clients (name, phone) VALUES (?, ?)',
      [name.trim(), phone.trim()]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Create client error:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// 🔹 Update Client
router.put('/api/clients/:id', async (req, res) => {
  const { name, phone } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE clients SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update client error:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// 🔹 Delete Client
router.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM clients WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete client error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// 🔹 Paginated Client Search
router.get('/api/clients/search', async (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [results] = await db.query(`
      SELECT * FROM clients
      WHERE name LIKE ? OR phone LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, `%${search}%`, limit, offset]);

    const hasMore = results.length === limit;
    res.json({ results, hasMore });
  } catch (err) {
    console.error('❌ Fetch clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// 🔹 Get Single Client by ID
router.get('/api/clients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('❌ Get client error:', err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

module.exports = router;
