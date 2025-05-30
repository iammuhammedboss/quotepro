// routes/quotation.js - COMPLETE VERSION WITH EXPORT FIX
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const ExportUtils = require('../utils/exportUtils');

// 🟢 Show create quotation form
router.get('/quotations/create', async (req, res) => {
  if (!req.session.user) return res.redirect('/');
  
  const mode = 'create';
  const year = new Date().getFullYear();
  let nextNo = `#WP-${year}S-980000001`;

  try {
    const [rows] = await db.query('SELECT MAX(quotation_no) AS lastNo FROM quotations');
    const lastRaw = rows[0]?.lastNo || '';
    const match = lastRaw.match(/(\d{9})$/);

    const lastNum = match ? parseInt(match[1]) : 980000000;
    const newNum = lastNum + 1;
    nextNo = `#WP-${year}S-${newNum}`;
  } catch (err) {
    console.error('Error generating quotation number:', err);
  }

  const quotation = { 
    quotation_no: nextNo,
    client_name: '',
    client_phone: '',
    contractor_name: '',
    contractor_phone: '',
    subcontractor_name: '',
    subcontractor_phone: '',
    engineer_name: '',
    engineer_phone: '',
    attention_name: '',
    attention_phone: ''
  };
  const items = [];
  const scope = [];
  const materials = [];
  const terms = [];

  res.render('quotation-form', { mode, quotation, items, scope, materials, terms });
});

// 🟢 Save new quotation - FIXED VERSION
router.post('/save-quotation', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const {
      quotation_no, tdate, client_name, client_phone,
      contractor_name, contractor_phone,
      subcontractor_name, subcontractor_phone,
      engineer_name, engineer_phone,
      attention_name, attention_phone,
      project_location, ref_no, ref_date, description,
      total_amount, discount, vat_rate, vat_amount, round_off, grand_total,
      warranty, warranty_note,
      show_scope_slno, show_material_slno, show_term_slno,
      items, scope, materials, terms
    } = req.body;

    // Parse JSON data
    const itemsData = items ? JSON.parse(items) : [];
    const scopeData = scope ? JSON.parse(scope) : [];
    const materialsData = materials ? JSON.parse(materials) : [];
    const termsData = terms ? JSON.parse(terms) : [];

    // ✅ FIXED: Helper function to find or create client
    async function findOrCreateClient(name, phone) {
      // ✅ If BOTH name and phone are provided, find or create
      if (name && name.trim() && phone && phone.trim()) {
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        
        console.log(`🔍 Looking for client: "${trimmedName}" with phone: "${trimmedPhone}"`);
        
        // First try to find existing client with EXACT match (name + phone)
        const [existing] = await db.query(
          'SELECT id FROM clients WHERE LOWER(TRIM(name)) = LOWER(?) AND TRIM(phone) = ? LIMIT 1',
          [trimmedName, trimmedPhone]
        );
        
        if (existing.length > 0) {
          console.log(`✅ Found existing client with ID: ${existing[0].id}`);
          return existing[0].id;
        }
        
        // ✅ NOT FOUND → Create new client automatically
        console.log(`🆕 Creating new client: "${trimmedName}" with phone: "${trimmedPhone}"`);
        const [result] = await db.query(
          'INSERT INTO clients (name, phone) VALUES (?, ?)',
          [trimmedName, trimmedPhone]
        );
        
        console.log(`✅ Created new client with ID: ${result.insertId}`);
        return result.insertId;
      }
      
      // ✅ If name OR phone is missing, return NULL (for optional fields like contractor, etc.)
      return null;
    }

    // ✅ Get or create client IDs - ALL will auto-create if name+phone provided
    const client_id = await findOrCreateClient(client_name, client_phone);
    const contractor_id = await findOrCreateClient(contractor_name, contractor_phone);
    const subcontractor_id = await findOrCreateClient(subcontractor_name, subcontractor_phone);
    const engineer_id = await findOrCreateClient(engineer_name, engineer_phone);
    const attention_id = await findOrCreateClient(attention_name, attention_phone);

    console.log('📊 Client IDs:', {
      client_id,
      contractor_id, 
      subcontractor_id,
      engineer_id,
      attention_id
    });

    // ✅ Check if main client_id is NULL (only fail if main client info missing)
    if (!client_id) {
      console.log('❌ Main client_id is NULL - name or phone missing');
      return res.status(400).json({ 
        success: false, 
        error: 'Client name and phone are required for the main client.' 
      });
    }

    // Insert quotation using YOUR exact schema
    const [result] = await db.query(`
      INSERT INTO quotations (
        quotation_no, tdate, client_id, contractor_id, engineer_id, subcontractor_id, attention_id,
        ref_no, ref_date, description, project_location, warranty, warranty_note,
        total_amount, discount, vat_rate, vat_amount, round_off, grand_total,
        show_scope_slno, show_material_slno, show_term_slno
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotation_no, tdate, client_id, contractor_id, engineer_id, subcontractor_id, attention_id,
      ref_no || null, ref_date || null, description || null, project_location,
      warranty, warranty_note || null,
      total_amount, discount, vat_rate, vat_amount, round_off, grand_total,
      show_scope_slno ? 1 : 0, show_material_slno ? 1 : 0, show_term_slno ? 1 : 0
    ]);

    const quotationId = result.insertId;
    console.log(`✅ Quotation saved with ID: ${quotationId}`);

    // Insert items using YOUR exact table name and schema
    if (itemsData.length > 0) {
      const itemValues = itemsData.map(item => [
        quotationId, item.description, item.qty, item.unit, item.rate, item.amount
      ]);
      await db.query(`
        INSERT INTO quotation_item_lines (quotation_id, description, qty, unit, rate, amount)
        VALUES ?
      `, [itemValues]);
      console.log(`✅ Inserted ${itemsData.length} items`);
    }

    // Insert scope using YOUR exact table name and schema
    if (scopeData.length > 0) {
      const scopeValues = scopeData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_scope (quotation_id, scope)
        VALUES ?
      `, [scopeValues]);
      console.log(`✅ Inserted ${scopeData.length} scope items`);
    }

    // Insert materials using YOUR exact table name and schema
    if (materialsData.length > 0) {
      const materialValues = materialsData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_materials (quotation_id, material)
        VALUES ?
      `, [materialValues]);
      console.log(`✅ Inserted ${materialsData.length} materials`);
    }

    // Insert terms using YOUR exact table name and schema
    if (termsData.length > 0) {
      const termValues = termsData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_terms (quotation_id, term)
        VALUES ?
      `, [termValues]);
      console.log(`✅ Inserted ${termsData.length} terms`);
    }

    res.json({ 
      success: true, 
      message: 'Quotation saved successfully!', 
      id: quotationId,
      redirectTo: `/quotations/view/${quotationId}` 
    });

  } catch (err) {
    console.error('❌ Save quotation error:', err);
    res.status(500).json({ success: false, error: 'Failed to save quotation', details: err.message });
  }
});

// 🟢 Show quotation search page
router.get('/quotations/search', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('quotation-search', { user: req.session.user });
});

// 🟢 ✅ UPDATED SEARCH WITH PHONE NUMBER SUPPORT
router.get('/quotations/search-data', async (req, res) => {
  const q = req.query.q || '';
  const like = `%${q}%`;
  const limit = parseInt(req.query.limit) || 30;
  const offset = parseInt(req.query.offset) || 0;

  try {
    console.log('🔍 Searching for:', q);
    
    // ✅ ENHANCED SEARCH WITH PHONE NUMBERS
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
    
    res.json({ success: true, results });
  } catch (err) {
    console.error('❌ Search error:', err);
    res.json({ success: false, error: 'Search failed', details: err.message });
  }
});

// 🟢 Get quotation by ID for editing
router.get('/quotations/edit/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Get quotation with client details using YOUR exact schema
    const [quotationRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      WHERE q.id = ?
    `, [quotationId]);

    if (quotationRows.length === 0) {
      return res.status(404).send('Quotation not found');
    }

    const quotation = quotationRows[0];

    // Get items using YOUR exact table name
    const [itemRows] = await db.query(
      'SELECT description, qty, unit, rate, amount FROM quotation_item_lines WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get scope using YOUR exact table name and column
    const [scopeRows] = await db.query(
      'SELECT scope FROM quotation_scope WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get materials using YOUR exact table name and column
    const [materialRows] = await db.query(
      'SELECT material FROM quotation_materials WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get terms using YOUR exact table name and column
    const [termRows] = await db.query(
      'SELECT term FROM quotation_terms WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const mode = 'edit';
    const items = itemRows || [];
    const scope = scopeRows.map(row => row.scope) || [];
    const materials = materialRows.map(row => row.material) || [];
    const terms = termRows.map(row => row.term) || [];

    res.render('quotation-form', { mode, quotation, items, scope, materials, terms });

  } catch (err) {
    console.error('❌ Get quotation error:', err);
    res.status(500).send('Error loading quotation');
  }
});

// 🟢 Update existing quotation - FIXED VERSION
router.post('/quotations/update/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const {
      quotation_no, tdate, client_name, client_phone,
      contractor_name, contractor_phone,
      subcontractor_name, subcontractor_phone,
      engineer_name, engineer_phone,
      attention_name, attention_phone,
      project_location, ref_no, ref_date, description,
      total_amount, discount, vat_rate, vat_amount, round_off, grand_total,
      warranty, warranty_note,
      show_scope_slno, show_material_slno, show_term_slno,
      items, scope, materials, terms
    } = req.body;

    // Parse JSON data
    const itemsData = items ? JSON.parse(items) : [];
    const scopeData = scope ? JSON.parse(scope) : [];
    const materialsData = materials ? JSON.parse(materials) : [];
    const termsData = terms ? JSON.parse(terms) : [];

    // ✅ Same fixed helper function
    async function findOrCreateClient(name, phone) {
      if (name && name.trim() && phone && phone.trim()) {
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        
        console.log(`🔍 Looking for client: "${trimmedName}" with phone: "${trimmedPhone}"`);
        
        const [existing] = await db.query(
          'SELECT id FROM clients WHERE LOWER(TRIM(name)) = LOWER(?) AND TRIM(phone) = ? LIMIT 1',
          [trimmedName, trimmedPhone]
        );
        
        if (existing.length > 0) {
          console.log(`✅ Found existing client with ID: ${existing[0].id}`);
          return existing[0].id;
        }
        
        console.log(`🆕 Creating new client: "${trimmedName}" with phone: "${trimmedPhone}"`);
        const [result] = await db.query(
          'INSERT INTO clients (name, phone) VALUES (?, ?)',
          [trimmedName, trimmedPhone]
        );
        
        console.log(`✅ Created new client with ID: ${result.insertId}`);
        return result.insertId;
      }
      
      return null;
    }

    // Get or create client IDs
    const client_id = await findOrCreateClient(client_name, client_phone);
    const contractor_id = await findOrCreateClient(contractor_name, contractor_phone);
    const subcontractor_id = await findOrCreateClient(subcontractor_name, subcontractor_phone);
    const engineer_id = await findOrCreateClient(engineer_name, engineer_phone);
    const attention_id = await findOrCreateClient(attention_name, attention_phone);

    console.log('📊 Client IDs for update:', {
      client_id,
      contractor_id, 
      subcontractor_id,
      engineer_id,
      attention_id
    });

    // ✅ Check if main client_id is NULL
    if (!client_id) {
      console.log('❌ Main client_id is NULL - name or phone missing');
      return res.status(400).json({ 
        success: false, 
        error: 'Client name and phone are required for the main client.' 
      });
    }

    // Update quotation using YOUR exact schema
    await db.query(`
      UPDATE quotations SET
        quotation_no = ?, tdate = ?, client_id = ?, contractor_id = ?, engineer_id = ?, subcontractor_id = ?, attention_id = ?,
        ref_no = ?, ref_date = ?, description = ?, project_location = ?, warranty = ?, warranty_note = ?,
        total_amount = ?, discount = ?, vat_rate = ?, vat_amount = ?, round_off = ?, grand_total = ?,
        show_scope_slno = ?, show_material_slno = ?, show_term_slno = ?
      WHERE id = ?
    `, [
      quotation_no, tdate, client_id, contractor_id, engineer_id, subcontractor_id, attention_id,
      ref_no || null, ref_date || null, description || null, project_location, warranty, warranty_note || null,
      total_amount, discount, vat_rate, vat_amount, round_off, grand_total,
      show_scope_slno ? 1 : 0, show_material_slno ? 1 : 0, show_term_slno ? 1 : 0,
      quotationId
    ]);

    console.log(`✅ Quotation ${quotationId} updated`);

    // Delete existing related records using YOUR exact table names
    await db.query('DELETE FROM quotation_item_lines WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_scope WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_materials WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_terms WHERE quotation_id = ?', [quotationId]);

    // Insert updated items
    if (itemsData.length > 0) {
      const itemValues = itemsData.map(item => [
        quotationId, item.description, item.qty, item.unit, item.rate, item.amount
      ]);
      await db.query(`
        INSERT INTO quotation_item_lines (quotation_id, description, qty, unit, rate, amount)
        VALUES ?
      `, [itemValues]);
      console.log(`✅ Updated ${itemsData.length} items`);
    }

    // Insert updated scope
    if (scopeData.length > 0) {
      const scopeValues = scopeData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_scope (quotation_id, scope)
        VALUES ?
      `, [scopeValues]);
      console.log(`✅ Updated ${scopeData.length} scope items`);
    }

    // Insert updated materials
    if (materialsData.length > 0) {
      const materialValues = materialsData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_materials (quotation_id, material)
        VALUES ?
      `, [materialValues]);
      console.log(`✅ Updated ${materialsData.length} materials`);
    }

    // Insert updated terms
    if (termsData.length > 0) {
      const termValues = termsData.map((text) => [quotationId, text]);
      await db.query(`
        INSERT INTO quotation_terms (quotation_id, term)
        VALUES ?
      `, [termValues]);
      console.log(`✅ Updated ${termsData.length} terms`);
    }

    res.json({ 
      success: true, 
      message: 'Quotation updated successfully!',
      redirectTo: `/quotations/view/${quotationId}` 
    });

  } catch (err) {
    console.error('❌ Update quotation error:', err);
    res.status(500).json({ success: false, error: 'Failed to update quotation', details: err.message });
  }
});

// 🟢 Show freeze view (read-only quotation display)
router.get('/quotations/view/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Get quotation with client details using YOUR exact schema
    const [quotationRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      WHERE q.id = ?
    `, [quotationId]);

    if (quotationRows.length === 0) {
      return res.status(404).send('Quotation not found');
    }

    const quotation = quotationRows[0];

    // Get items using YOUR exact table name
    const [itemRows] = await db.query(
      'SELECT description, qty, unit, rate, amount FROM quotation_item_lines WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get scope using YOUR exact table name and column
    const [scopeRows] = await db.query(
      'SELECT scope FROM quotation_scope WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get materials using YOUR exact table name and column
    const [materialRows] = await db.query(
      'SELECT material FROM quotation_materials WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    // Get terms using YOUR exact table name and column
    const [termRows] = await db.query(
      'SELECT term FROM quotation_terms WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const items = itemRows || [];
    const scope = scopeRows.map(row => row.scope) || [];
    const materials = materialRows.map(row => row.material) || [];
    const terms = termRows.map(row => row.term) || [];

    res.render('quotation-freeze-view', { quotation, items, scope, materials, terms });

  } catch (err) {
    console.error('❌ Get freeze view error:', err);
    res.status(500).send('Error loading quotation');
  }
});

// 🟢 Duplicate quotation - REDIRECT TO CREATE MODE
router.post('/quotations/duplicate/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const sourceId = req.params.id;

    // Get source quotation with all related data
    const [sourceRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      WHERE q.id = ?
    `, [sourceId]);

    if (sourceRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Source quotation not found' });
    }

    const source = sourceRows[0];

    // Generate new quotation number
    const year = new Date().getFullYear();
    const [lastRows] = await db.query('SELECT MAX(quotation_no) AS lastNo FROM quotations');
    const lastRaw = lastRows[0]?.lastNo || '';
    const match = lastRaw.match(/(\d{9})$/);
    const lastNum = match ? parseInt(match[1]) : 980000000;
    const newNum = lastNum + 1;
    const newQuotationNo = `#WP-${year}S-${newNum}`;

    // Get all related data
    const [sourceItems] = await db.query(
      'SELECT description, qty, unit, rate, amount FROM quotation_item_lines WHERE quotation_id = ? ORDER BY id',
      [sourceId]
    );
    const [sourceScope] = await db.query(
      'SELECT scope FROM quotation_scope WHERE quotation_id = ? ORDER BY id',
      [sourceId]
    );
    const [sourceMaterials] = await db.query(
      'SELECT material FROM quotation_materials WHERE quotation_id = ? ORDER BY id',
      [sourceId]
    );
    const [sourceTerms] = await db.query(
      'SELECT term FROM quotation_terms WHERE quotation_id = ? ORDER BY id',
      [sourceId]
    );

    // Prepare data for CREATE mode (not saving to DB yet)
    const mode = 'create';
    const quotation = {
      quotation_no: newQuotationNo,
      tdate: new Date().toISOString().split('T')[0], // Today's date
      client_name: source.client_name || '',
      client_phone: source.client_phone || '',
      contractor_name: source.contractor_name || '',
      contractor_phone: source.contractor_phone || '',
      subcontractor_name: source.subcontractor_name || '',
      subcontractor_phone: source.subcontractor_phone || '',
      engineer_name: source.engineer_name || '',
      engineer_phone: source.engineer_phone || '',
      attention_name: source.attention_name || '',
      attention_phone: source.attention_phone || '',
      project_location: source.project_location || '',
      ref_no: '', // Clear reference fields
      ref_date: '',
      description: '', // Clear description
      total_amount: source.total_amount || 0,
      discount: source.discount || 0,
      vat_rate: source.vat_rate || 5,
      vat_amount: source.vat_amount || 0,
      round_off: source.round_off || 0,
      grand_total: source.grand_total || 0,
      warranty: source.warranty || 10,
      warranty_note: source.warranty_note || ''
    };

    const items = sourceItems || [];
    const scope = sourceScope.map(row => row.scope) || [];
    const materials = sourceMaterials.map(row => row.material) || [];
    const terms = sourceTerms.map(row => row.term) || [];

    // ✅ RENDER CREATE FORM WITH DUPLICATED DATA
    res.render('quotation-form', { mode, quotation, items, scope, materials, terms });

  } catch (err) {
    console.error('❌ Duplicate quotation error:', err);
    res.status(500).json({ success: false, error: 'Failed to duplicate quotation' });
  }
});

// 🟢 Delete quotation
router.delete('/quotations/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Delete related records first using YOUR exact table names
    await db.query('DELETE FROM quotation_item_lines WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_scope WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_materials WHERE quotation_id = ?', [quotationId]);
    await db.query('DELETE FROM quotation_terms WHERE quotation_id = ?', [quotationId]);

    // Delete quotation
    await db.query('DELETE FROM quotations WHERE id = ?', [quotationId]);

    res.json({ success: true, message: 'Quotation deleted successfully!' });

  } catch (err) {
    console.error('❌ Delete quotation error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete quotation' });
  }
});

// 🔥 EXPORT INTERFACE PAGE
router.get('/quotations/export/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Get quotation with client details
    const [quotationRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      WHERE q.id = ?
    `, [quotationId]);

    if (quotationRows.length === 0) {
      return res.status(404).send('Quotation not found');
    }

    const quotation = quotationRows[0];

    // Get related data
    const [itemRows] = await db.query(
      'SELECT description, qty, unit, rate, amount FROM quotation_item_lines WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [scopeRows] = await db.query(
      'SELECT scope FROM quotation_scope WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [materialRows] = await db.query(
      'SELECT material FROM quotation_materials WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [termRows] = await db.query(
      'SELECT term FROM quotation_terms WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const items = itemRows || [];
    const scope = scopeRows.map(row => row.scope) || [];
    const materials = materialRows.map(row => row.material) || [];
    const terms = termRows.map(row => row.term) || [];

    res.render('quotation-export-interface', { 
      quotation, 
      items, 
      scope, 
      materials, 
      terms,
      user: req.session.user 
    });

  } catch (err) {
    console.error('❌ Export interface error:', err);
    res.status(500).send('Error loading export interface');
  }
});

// 🔥 EXPORT PREVIEW ROUTE (GET for initial load, POST for updates)
router.get('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    
    // Default settings for initial preview load
    const exportSettings = {
      customHeader: 'QUOTATION FOR WATERPROOFING',
      headerFontSize: '28px',
      bodyFontSize: '14px',
      tableFontSize: '12px',
      smallFontSize: '11px',
      qrSize: '100',
      paperType: 'plain',
      paperSize: 'A4',
      includeSignature: false,
      includeStamp: false,
      stampPosition: 'auto'
    };

    console.log('🔍 Generating initial export preview for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await generateQRCode(quotationId, baseUrl);

    // Render preview HTML
    res.render('quotation-export-view', {
      quotation,
      items,
      scope,
      materials,
      terms,
      exportSettings,
      qrCodeDataURL
    });

  } catch (error) {
    console.error('❌ Initial preview generation failed:', error);
    res.status(500).send('Preview generation failed: ' + error.message);
  }
});

// 🔥 EXPORT PREVIEW ROUTE (POST for settings updates)
router.post('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    
    // Create exportSettings from form data with fallbacks
    const exportSettings = {
      customHeader: req.body.customHeader || 'QUOTATION FOR WATERPROOFING',
      headerFontSize: req.body.headerFontSize || '28px',
      bodyFontSize: req.body.bodyFontSize || '14px',
      tableFontSize: req.body.tableFontSize || '12px',
      smallFontSize: req.body.smallFontSize || '11px',
      qrSize: req.body.qrSize || '100',
      paperType: req.body.paperType || 'plain',
      paperSize: req.body.paperSize || 'A4',
      includeSignature: req.body.includeSignature === 'true',
      includeStamp: req.body.includeStamp === 'true',
      stampPosition: req.body.stampPosition || 'auto'
    };

    console.log('🔍 Updating export preview for quotation:', quotationId, 'with settings:', exportSettings);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await generateQRCode(quotationId, baseUrl);

    // Render preview HTML
    res.render('quotation-export-view', {
      quotation,
      items,
      scope,
      materials,
      terms,
      exportSettings,
      qrCodeDataURL
    });

  } catch (error) {
    console.error('❌ Preview update failed:', error);
    res.status(500).send('Preview generation failed: ' + error.message);
  }
});

// 🔥 UNIFIED EXPORT GENERATION ROUTE (handles all export types)
router.post('/quotations/export/:id/generate', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    
    // ✅ PARSE FORM DATA PROPERLY
    console.log('📨 Received form data:', req.body);
    
    // Extract settings from form data (handle both FormData and JSON)
    const fileType = req.body.fileType || 'pdf';
    const exportMethod = req.body.exportMethod || 'download';
    
    // Create exportSettings object
    const exportSettings = {
      fileType: fileType,
      exportMethod: exportMethod,
      customHeader: req.body.customHeader || 'QUOTATION FOR WATERPROOFING',
      headerFontSize: req.body.headerFontSize || '28px',
      bodyFontSize: req.body.bodyFontSize || '14px',
      tableFontSize: req.body.tableFontSize || '12px',
      smallFontSize: req.body.smallFontSize || '11px',
      qrSize: req.body.qrSize || '100',
      paperType: req.body.paperType || 'plain',
      paperSize: req.body.paperSize || 'A4',
      imageQuality: req.body.imageQuality || 90,
      includeSignature: req.body.includeSignature === 'true' || req.body.includeSignature === true,
      includeStamp: req.body.includeStamp === 'true' || req.body.includeStamp === true,
      stampPosition: req.body.stampPosition || 'auto'
    };

    console.log('⚙️ Processed export settings:', exportSettings);

    // ✅ ROUTE TO APPROPRIATE EXPORT HANDLER BASED ON FILE TYPE
    if (fileType === 'pdf') {
      console.log('📄 Routing to PDF export...');
      return await handlePDFExport(req, res, quotationId, exportSettings);
      
    } else if (fileType === 'excel') {
      console.log('📊 Routing to Excel export...');
      return await handleExcelExport(req, res, quotationId, exportSettings);
      
    } else if (fileType === 'png' || fileType === 'jpg') {
      console.log(`🖼️ Routing to ${fileType.toUpperCase()} export...`);
      return await handleImageExport(req, res, quotationId, exportSettings);
      
    } else {
      console.log('❌ Unknown file type:', fileType);
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported file type: ' + fileType 
      });
    }

  } catch (error) {
    console.error('❌ Export generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Export generation failed', 
      details: error.message 
    });
  }
});

// 🔥 PDF EXPORT HANDLER
async function handlePDFExport(req, res, quotationId, exportSettings) {
  try {
    console.log('🚀 Starting PDF export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await generateQRCode(quotationId, baseUrl);

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view', {
        quotation,
        items,
        scope,
        materials,
        terms,
        exportSettings,
        qrCodeDataURL
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate PDF using ExportUtils
    const pdfBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings);

    // Handle different export methods
    if (exportSettings.exportMethod === 'download') {
      const fileName = generateFileName(quotation, 'pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      console.log('✅ PDF export completed successfully');
      return res.end(pdfBuffer);
      
    } else if (exportSettings.exportMethod === 'email') {
      // Return email data for client-side handling
      return res.json({
        success: true,
        action: 'email',
        emailData: {
          to: '', // No email field in clients table
          subject: `Quotation ${quotation.quotation_no} - ${quotation.client_name}`,
          body: `Dear ${quotation.client_name},\n\nPlease find attached your quotation for the requested services.\n\nBest regards,\nInternational Pipes Technology Co LLC`
        }
      });
      
    } else if (exportSettings.exportMethod === 'whatsapp') {
      // Return WhatsApp data for client-side handling
      const whatsappCaption = generateWhatsAppCaption(quotation);
      return res.json({
        success: true,
        action: 'whatsapp',
        whatsappData: {
          phone: quotation.client_phone,
          caption: whatsappCaption,
          document: {
            content: pdfBuffer.toString('base64'),
            filename: generateFileName(quotation, 'pdf'),
            contentType: 'application/pdf'
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ PDF export failed:', error);
    throw error;
  }
}

// 🔥 EXCEL EXPORT HANDLER
async function handleExcelExport(req, res, quotationId, exportSettings) {
  try {
    console.log('🚀 Starting Excel export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate Excel using ExportUtils
    const excelBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings);

    // Handle different export methods
    if (exportSettings.exportMethod === 'download') {
      const fileName = generateFileName(quotation, 'xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      console.log('✅ Excel export completed successfully');
      return res.end(excelBuffer);
      
    } else if (exportSettings.exportMethod === 'email') {
      return res.json({
        success: true,
        action: 'email',
        emailData: {
          to: '', // No email field in clients table
          subject: `Quotation ${quotation.quotation_no} - ${quotation.client_name} (Excel)`,
          body: `Dear ${quotation.client_name},\n\nPlease find attached your quotation in Excel format.\n\nBest regards,\nInternational Pipes Technology Co LLC`
        }
      });
      
    } else if (exportSettings.exportMethod === 'whatsapp') {
      const whatsappCaption = generateWhatsAppCaption(quotation);
      return res.json({
        success: true,
        action: 'whatsapp',
        whatsappData: {
          phone: quotation.client_phone,
          caption: whatsappCaption + '\n\n📊 Excel format attached',
          document: {
            content: excelBuffer.toString('base64'),
            filename: generateFileName(quotation, 'xlsx'),
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Excel export failed:', error);
    throw error;
  }
}

// 🔥 IMAGE EXPORT HANDLER
async function handleImageExport(req, res, quotationId, exportSettings) {
  try {
    console.log(`🚀 Starting ${exportSettings.fileType.toUpperCase()} export for quotation:`, quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await generateQRCode(quotationId, baseUrl);

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view', {
        quotation,
        items,
        scope,
        materials,
        terms,
        exportSettings,
        qrCodeDataURL
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate Image using ExportUtils
    const imageBuffer = await ExportUtils.generateImage(htmlContent, exportSettings);

    // Handle different export methods
    if (exportSettings.exportMethod === 'download') {
      const fileName = generateFileName(quotation, exportSettings.fileType);
      const mimeType = exportSettings.fileType === 'png' ? 'image/png' : 'image/jpeg';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', imageBuffer.length);
      console.log(`✅ ${exportSettings.fileType.toUpperCase()} export completed successfully`);
      return res.end(imageBuffer);
      
    } else if (exportSettings.exportMethod === 'email') {
      return res.json({
        success: true,
        action: 'email',
        emailData: {
          to: '', // No email field in clients table
          subject: `Quotation ${quotation.quotation_no} - ${quotation.client_name} (Image)`,
          body: `Dear ${quotation.client_name},\n\nPlease find attached your quotation as an image.\n\nBest regards,\nInternational Pipes Technology Co LLC`
        }
      });
      
    } else if (exportSettings.exportMethod === 'whatsapp') {
      const whatsappCaption = generateWhatsAppCaption(quotation);
      const mimeType = exportSettings.fileType === 'png' ? 'image/png' : 'image/jpeg';
      return res.json({
        success: true,
        action: 'whatsapp',
        whatsappData: {
          phone: quotation.client_phone,
          caption: whatsappCaption,
          document: {
            content: imageBuffer.toString('base64'),
            filename: generateFileName(quotation, exportSettings.fileType),
            contentType: mimeType
          }
        }
      });
    }

  } catch (error) {
    console.error(`❌ Image export failed:`, error);
    throw error;
  }
}

// 🔥 HELPER FUNCTIONS

// Helper function to get quotation data
async function getQuotationData(quotationId) {
  try {
    // Get quotation with client details
    const [quotationRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      WHERE q.id = ?
    `, [quotationId]);

    if (quotationRows.length === 0) {
      return null;
    }

    const quotation = quotationRows[0];

    // Get related data
    const [itemRows] = await db.query(
      'SELECT description, qty, unit, rate, amount FROM quotation_item_lines WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [scopeRows] = await db.query(
      'SELECT scope FROM quotation_scope WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [materialRows] = await db.query(
      'SELECT material FROM quotation_materials WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    const [termRows] = await db.query(
      'SELECT term FROM quotation_terms WHERE quotation_id = ? ORDER BY id',
      [quotationId]
    );

    return {
      quotation,
      items: itemRows || [],
      scope: scopeRows.map(row => row.scope) || [],
      materials: materialRows.map(row => row.material) || [],
      terms: termRows.map(row => row.term) || []
    };

  } catch (error) {
    console.error('❌ Error fetching quotation data:', error);
    throw error;
  }
}

// Helper function to generate QR code
async function generateQRCode(quotationId, baseUrl) {
  try {
    if (ExportUtils && ExportUtils.generateQRCode) {
      return await ExportUtils.generateQRCode(quotationId, baseUrl);
    }
    
    // Fallback QR code generation using qrcode library
    const QRCode = require('qrcode');
    const qrData = `${baseUrl}/quotations/view/${quotationId}`;
    return await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('❌ QR Code generation failed:', error);
    return null;
  }
}

// Helper function to generate filename
function generateFileName(quotation, extension) {
  const quotationNo = quotation.quotation_no.replace(/[^a-zA-Z0-9]/g, '-');
  const clientName = quotation.client_name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
  const date = new Date().toISOString().slice(0, 10);
  
  return `${quotationNo}-${clientName}-${date}.${extension}`;
}

// Helper function to generate WhatsApp caption
function generateWhatsAppCaption(quotation) {
  return `📋 *QUOTATION DETAILS*

🏢 *Client:* ${quotation.client_name}
📱 *Phone:* ${quotation.client_phone || 'N/A'}
📍 *Location:* ${quotation.project_location || 'N/A'}
💰 *Total Amount:* OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📅 *Date:* ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
🔢 *Quote No:* ${quotation.quotation_no}

💧 *International Pipes Technology Co LLC*
🌐 Your Waterproofing Specialist

📞 Contact: +968 96030210
✉️ Email: eurotechoman.iptc@gmail.com
🌐 www.eurotechoman.com`;
}

module.exports = router;