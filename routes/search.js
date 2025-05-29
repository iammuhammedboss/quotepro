// routes/search.js - COMPLETE UPDATED VERSION WITH PHONE SEARCH
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ✅ ENHANCED QUOTATION SEARCH WITH PHONE NUMBER SUPPORT
router.get('/quotations/search-data', async (req, res) => {
  const q = req.query.q || '';
  const like = `%${q}%`;
  const limit = parseInt(req.query.limit) || 30;
  const offset = parseInt(req.query.offset) || 0;

  try {
    console.log('🔍 Global search for:', q);
    
    // ✅ COMPREHENSIVE SEARCH INCLUDING ALL PHONE NUMBERS
    const [results] = await db.query(`
      SELECT 
        q.id, 
        q.quotation_no, 
        q.tdate, 
        q.project_location, 
        q.grand_total,
        COALESCE(c.name, '') AS client_name, 
        COALESCE(c.phone, '') AS client_phone,
        COALESCE(cont.name, '') AS contractor_name,
        COALESCE(cont.phone, '') AS contractor_phone,
        COALESCE(eng.name, '') AS engineer_name,
        COALESCE(eng.phone, '') AS engineer_phone,
        COALESCE(sub.name, '') AS subcontractor_name,
        COALESCE(sub.phone, '') AS subcontractor_phone,
        COALESCE(att.name, '') AS attention_name,
        COALESCE(att.phone, '') AS attention_phone
FROM quotations q
     LEFT JOIN clients c ON q.client_id = c.id
     LEFT JOIN clients cont ON q.contractor_id = cont.id
     LEFT JOIN clients eng ON q.engineer_id = eng.id
     LEFT JOIN clients sub ON q.subcontractor_id = sub.id
     LEFT JOIN clients att ON q.attention_id = att.id
     WHERE (
       q.quotation_no LIKE ? OR
       COALESCE(q.project_location, '') LIKE ? OR
       CAST(q.grand_total AS CHAR) LIKE ? OR
       COALESCE(c.name, '') LIKE ? OR
       COALESCE(c.phone, '') LIKE ? OR
       COALESCE(cont.name, '') LIKE ? OR
       COALESCE(cont.phone, '') LIKE ? OR
       COALESCE(eng.name, '') LIKE ? OR
       COALESCE(eng.phone, '') LIKE ? OR
       COALESCE(sub.name, '') LIKE ? OR
       COALESCE(sub.phone, '') LIKE ? OR
       COALESCE(att.name, '') LIKE ? OR
       COALESCE(att.phone, '') LIKE ?
     )
     ORDER BY q.id DESC
     LIMIT ? OFFSET ?
   `, [like, like, like, like, like, like, like, like, like, like, like, like, like, limit, offset]);

   console.log('📊 Search results found:', results.length);
   console.log('🔍 Sample result:', results[0] || 'No results');
   
   res.json({ success: true, results });
 } catch (err) {
   console.error('❌ Search error:', err);
   res.json({ success: false, error: 'Search failed', details: err.message });
 }
});

// ✅ BACKUP/ALTERNATIVE SEARCH ROUTE (if needed)
router.get('/search/quotations', async (req, res) => {
 const q = req.query.q || '';
 const like = `%${q}%`;

 try {
   console.log('🔍 Alternative search for:', q);
   
   const [results] = await db.query(`
     SELECT 
       q.id, 
       q.quotation_no, 
       q.tdate, 
       q.project_location, 
       q.grand_total,
       c.name AS client_name, 
       c.phone AS client_phone
     FROM quotations q
     LEFT JOIN clients c ON q.client_id = c.id
     WHERE (
       q.quotation_no LIKE ? OR
       COALESCE(q.project_location, '') LIKE ? OR
       CAST(q.grand_total AS CHAR) LIKE ? OR
       COALESCE(c.name, '') LIKE ? OR
       COALESCE(c.phone, '') LIKE ?
     )
     ORDER BY q.id DESC
     LIMIT 50
   `, [like, like, like, like, like]);

   res.json({ success: true, results });
 } catch (err) {
   console.error('❌ Alternative search error:', err);
   res.json({ success: false, error: 'Search failed' });
 }
});

// ✅ DEBUG ROUTE (remove in production)
router.get('/debug/search/:phone', async (req, res) => {
 const phone = req.params.phone;
 
 try {
   console.log('🐛 Debug search for phone:', phone);
   
   // Test direct phone search
   const [clients] = await db.query('SELECT * FROM clients WHERE phone LIKE ?', [`%${phone}%`]);
   const [quotations] = await db.query(`
     SELECT q.*, c.name, c.phone 
     FROM quotations q 
     LEFT JOIN clients c ON q.client_id = c.id 
     WHERE c.phone LIKE ?
   `, [`%${phone}%`]);
   
   res.json({ 
     success: true, 
     phone: phone,
     clients: clients,
     quotations: quotations,
     clientsFound: clients.length,
     quotationsFound: quotations.length
   });
 } catch (err) {
   console.error('❌ Debug search error:', err);
   res.json({ success: false, error: err.message });
 }
});

module.exports = router;