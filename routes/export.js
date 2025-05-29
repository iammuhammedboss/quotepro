// routes/export.js - Complete Export Controller
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const ExportUtils = require('../utils/exportUtils');
const path = require('path');

// 🔥 MAIN EXPORT CONFIGURATION PAGE
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

    res.render('quotation-export-config', { 
      quotation, 
      items, 
      scope, 
      materials, 
      terms,
      user: req.session.user 
    });

  } catch (err) {
    console.error('❌ Export config error:', err);
    res.status(500).send('Error loading export configuration');
  }
});

// 🔥 GENERATE PDF EXPORT
router.post('/quotations/export/:id/pdf', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🚀 Starting PDF export for quotation:', quotationId);
    console.log('📋 Export settings:', exportSettings);

    // Get quotation data (same query as above)
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

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

    // Generate PDF
    const pdfBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings);

    // Set response headers
    const fileName = ExportUtils.generateFileName(quotation, 'pdf', exportSettings.customFileName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ PDF export completed successfully');
    res.end(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF export failed:', error);
    res.status(500).json({ success: false, error: 'PDF generation failed', details: error.message });
  }
});

// 🔥 GENERATE EXCEL EXPORT
router.post('/quotations/export/:id/excel', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🚀 Starting Excel export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate Excel
    const excelBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings);

    // Set response headers
    const fileName = ExportUtils.generateFileName(quotation, 'xlsx', exportSettings.customFileName);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log('✅ Excel export completed successfully');
    res.end(excelBuffer);

  } catch (error) {
    console.error('❌ Excel export failed:', error);
    res.status(500).json({ success: false, error: 'Excel generation failed', details: error.message });
  }
});

// 🔥 GENERATE IMAGE EXPORT (JPG/PNG)
router.post('/quotations/export/:id/image', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);
    const imageFormat = req.body.imageFormat || 'png';

    console.log(`🚀 Starting ${imageFormat.toUpperCase()} export for quotation:`, quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view', {
        quotation,
        items,
        scope,
        materials,
        terms,
        exportSettings: { ...exportSettings, imageFormat },
        qrCodeDataURL
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate Image
    const imageBuffer = await ExportUtils.generateImage(htmlContent, { ...exportSettings, imageFormat });

    // Set response headers
    const fileName = ExportUtils.generateFileName(quotation, imageFormat, exportSettings.customFileName);
    const mimeType = ExportUtils.getMimeType(imageFormat);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', imageBuffer.length);

    console.log(`✅ ${imageFormat.toUpperCase()} export completed successfully`);
    res.end(imageBuffer);

  } catch (error) {
    console.error(`❌ Image export failed:`, error);
    res.status(500).json({ success: false, error: 'Image generation failed', details: error.message });
  }
});

// 🔥 PREVIEW EXPORT (Returns HTML for preview)
router.post('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🔍 Generating export preview for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

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
    console.error('❌ Preview generation failed:', error);
    res.status(500).send('Preview generation failed');
  }
});

// 🔥 WHATSAPP INTEGRATION PAGE
router.get('/quotations/export/:id/whatsapp', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Get quotation data for caption generation
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const { quotation } = quotationData;

    // Generate WhatsApp caption
    const whatsappCaption = ExportUtils.generateWhatsAppCaption(quotation);

    res.render('quotation-whatsapp', { 
      quotation, 
      whatsappCaption,
      quotationId,
      user: req.session.user 
    });

  } catch (error) {
    console.error('❌ WhatsApp page error:', error);
    res.status(500).send('Error loading WhatsApp integration');
  }
});

// 🔥 EMAIL INTEGRATION
router.post('/quotations/export/:id/email', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const { emailTo, emailSubject, emailBody, exportFormat = 'pdf' } = req.body;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('📧 Preparing email export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    let attachmentBuffer;
    let fileName;
    let mimeType;

    // Generate attachment based on format
    if (exportFormat === 'pdf') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

      const htmlContent = await new Promise((resolve, reject) => {
        res.app.render('quotation-export-view', {
          quotation, items, scope, materials, terms, exportSettings, qrCodeDataURL
        }, (err, html) => {
          if (err) reject(err);
          else resolve(html);
        });
      });

      attachmentBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings);
      fileName = ExportUtils.generateFileName(quotation, 'pdf', exportSettings.customFileName);
      mimeType = 'application/pdf';

    } else if (exportFormat === 'excel') {
      attachmentBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings);
      fileName = ExportUtils.generateFileName(quotation, 'xlsx', exportSettings.customFileName);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Create mailto link with attachment (browser limitation - we'll provide download instead)
    const mailtoSubject = encodeURIComponent(emailSubject || `Quotation ${quotation.quotation_no} - ${quotation.client_name}`);
    const mailtoBody = encodeURIComponent(emailBody || `Please find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards,\nInternational Pipes Technology Co LLC`);
    const mailtoLink = `mailto:${emailTo}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Since we can't attach files to mailto, we'll return both the mailto link and the file
    res.json({
      success: true,
      mailtoLink: mailtoLink,
      message: 'Email client will open. Please download the attachment separately.',
      downloadUrl: `/quotations/export/${quotationId}/${exportFormat}`,
      fileName: fileName
    });

  } catch (error) {
    console.error('❌ Email preparation failed:', error);
    res.status(500).json({ success: false, error: 'Email preparation failed', details: error.message });
  }
});

// 🔥 SAVE EXPORT TEMPLATE
router.post('/quotations/export/save-template', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const { templateName, templateSettings } = req.body;
    const userId = req.session.user.id;

    console.log('💾 Saving export template:', templateName);

    const template = await ExportUtils.saveExportTemplate(templateName, templateSettings, userId);

    res.json({
      success: true,
      message: 'Export template saved successfully',
      template: template
    });

  } catch (error) {
    console.error('❌ Template save failed:', error);
    res.status(500).json({ success: false, error: 'Failed to save template', details: error.message });
  }
});

// 🔥 BATCH EXPORT (Multiple Quotations)
router.post('/quotations/export/batch', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const { quotationIds, exportFormat = 'pdf', exportSettings: rawSettings } = req.body;
    const exportSettings = ExportUtils.validateExportSettings(rawSettings);

    console.log('📦 Starting batch export for quotations:', quotationIds);

    if (!quotationIds || !Array.isArray(quotationIds) || quotationIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No quotations selected for export' });
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="quotations-batch-export.zip"');

    archive.pipe(res);

    // Process each quotation
    for (const quotationId of quotationIds) {
      try {
        const quotationData = await getQuotationData(quotationId);
        if (!quotationData) continue;

        const { quotation, items, scope, materials, terms } = quotationData;

        let fileBuffer;
        let fileName;

        if (exportFormat === 'pdf') {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

          const htmlContent = await new Promise((resolve, reject) => {
            res.app.render('quotation-export-view', {
              quotation, items, scope, materials, terms, exportSettings, qrCodeDataURL
            }, (err, html) => {
              if (err) reject(err);
              else resolve(html);
            });
          });

          fileBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings);
          fileName = ExportUtils.generateFileName(quotation, 'pdf');

        } else if (exportFormat === 'excel') {
          fileBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings);
          fileName = ExportUtils.generateFileName(quotation, 'xlsx');
        }

        archive.append(fileBuffer, { name: fileName });

      } catch (error) {
        console.error(`❌ Failed to export quotation ${quotationId}:`, error);
        // Continue with other quotations
      }
    }

    archive.finalize();
    console.log('✅ Batch export completed successfully');

  } catch (error) {
    console.error('❌ Batch export failed:', error);
    res.status(500).json({ success: false, error: 'Batch export failed', details: error.message });
  }
});

// 🔥 HELPER FUNCTION: Get Quotation Data
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

module.exports = router;