// routes/export.js - Enhanced Export Controller with Advanced Features
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const ExportUtils = require('../utils/exportUtilsEnhanced');
const path = require('path');
const fs = require('fs').promises;

// 🔥 Enhanced Export Configuration Page
router.get('/quotations/export/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    console.log(`🚀 Loading export config for quotation: ${quotationId}`);

    // Get quotation with all related data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).render('error', {
        title: 'Quotation Not Found',
        error: { status: 404, message: 'Quotation not found' },
        user: req.session.user
      });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Load user's saved templates
    const savedTemplates = await ExportUtils.loadExportTemplates(req.session.user.id);

    // Get popular export settings for suggestions
    const popularSettings = await getPopularExportSettings(req.session.user.id);

    res.render('quotation-export-config', { 
      quotation, 
      items, 
      scope, 
      materials, 
      terms,
      savedTemplates,
      popularSettings,
      user: req.session.user,
      title: `Export Quotation ${quotation.quotation_no}`
    });

  } catch (err) {
    console.error('❌ Export config error:', err);
    res.status(500).render('error', {
      title: 'Export Error',
      error: { status: 500, message: 'Failed to load export configuration' },
      user: req.session.user
    });
  }
});

// 🔥 Enhanced PDF Export with Progress Tracking
router.post('/quotations/export/:id/pdf', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🚀 Starting enhanced PDF export for quotation:', quotationId);
    console.log('📋 Export settings:', exportSettings);

    // Validate settings
    if (!exportSettings.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export settings',
        details: exportSettings.errors
      });
    }

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate enhanced QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl, {
      size: exportSettings.settings.qrSize,
      errorLevel: 'M',
      margin: 2
    });

    // Render HTML content with enhanced template
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view', {
        quotation,
        items,
        scope,
        materials,
        terms,
        exportSettings: exportSettings.settings,
        qrCodeDataURL,
        user: req.session.user
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate PDF with enhanced options
    const pdfBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings.settings);

    // Log export activity
    await logExportActivity(quotationId, 'pdf', exportSettings.settings, req.session.user.id);

    // Generate enhanced filename
    const fileName = ExportUtils.generateFileName(quotation, 'pdf', {
      customName: exportSettings.settings.customFileName,
      includeDate: true,
      includeClient: true,
      dateFormat: 'YYYY-MM-DD'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Export-Success', 'true');
    res.setHeader('X-Export-Format', 'pdf');

    console.log('✅ Enhanced PDF export completed successfully');
    res.end(pdfBuffer);

  } catch (error) {
    console.error('❌ Enhanced PDF export failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'PDF generation failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🔥 Enhanced Excel Export
router.post('/quotations/export/:id/excel', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🚀 Starting enhanced Excel export for quotation:', quotationId);

    if (!exportSettings.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export settings',
        details: exportSettings.errors
      });
    }

    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate enhanced Excel with advanced formatting
    const excelBuffer = await ExportUtils.generateExcel(
      quotation, items, scope, materials, terms, exportSettings.settings
    );

    // Log export activity
    await logExportActivity(quotationId, 'excel', exportSettings.settings, req.session.user.id);

    const fileName = ExportUtils.generateFileName(quotation, 'xlsx', {
      customName: exportSettings.settings.customFileName,
      includeDate: true,
      includeClient: true
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log('✅ Enhanced Excel export completed successfully');
    res.end(excelBuffer);

  } catch (error) {
    console.error('❌ Enhanced Excel export failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Excel generation failed', 
      details: error.message 
    });
  }
});

// 🔥 Enhanced Image Export (PNG/JPG) with High Quality
router.post('/quotations/export/:id/image', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);
    const imageFormat = req.body.imageFormat || 'png';

    console.log(`🚀 Starting enhanced ${imageFormat.toUpperCase()} export for quotation:`, quotationId);

    if (!exportSettings.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export settings',
        details: exportSettings.errors
      });
    }

    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate enhanced QR Code
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl, {
      size: exportSettings.settings.qrSize
    });

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view', {
        quotation,
        items,
        scope,
        materials,
        terms,
        exportSettings: { ...exportSettings.settings, imageFormat },
        qrCodeDataURL,
        user: req.session.user
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate high-quality image
    const imageBuffer = await ExportUtils.generateImage(htmlContent, {
      ...exportSettings.settings,
      imageFormat,
      highDPI: true,
      optimizeImage: true
    });

    // Log export activity
    await logExportActivity(quotationId, imageFormat, exportSettings.settings, req.session.user.id);

    const fileName = ExportUtils.generateFileName(quotation, imageFormat, {
      customName: exportSettings.settings.customFileName,
      includeDate: true,
      includeClient: true
    });
    
    const mimeType = ExportUtils.getMimeType(imageFormat);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', imageBuffer.length);

    console.log(`✅ Enhanced ${imageFormat.toUpperCase()} export completed successfully`);
    res.end(imageBuffer);

  } catch (error) {
    console.error(`❌ Enhanced image export failed:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Image generation failed', 
      details: error.message 
    });
  }
});

// 🔥 Enhanced Preview with Real-time Updates
router.post('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('🔍 Generating enhanced export preview for quotation:', quotationId);

    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code for preview
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl, {
      size: exportSettings.settings.qrSize
    });

    // Add preview-specific styling
    const previewSettings = {
      ...exportSettings.settings,
      isPreview: true,
      previewMode: true
    };

    // Render preview HTML
    res.render('quotation-export-view', {
      quotation,
      items,
      scope,
      materials,
      terms,
      exportSettings: previewSettings,
      qrCodeDataURL,
      user: req.session.user
    });

  } catch (error) {
    console.error('❌ Enhanced preview generation failed:', error);
    res.status(500).send(`
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h2 style="color: #dc2626;">Preview Generation Failed</h2>
        <p style="color: #666;">Error: ${error.message}</p>
        <button onclick="window.parent.generatePreview()" 
                style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `);
  }
});

// 🔥 Enhanced WhatsApp Integration
router.get('/quotations/export/:id/whatsapp', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).render('error', {
        title: 'Quotation Not Found',
        error: { status: 404, message: 'Quotation not found' },
        user: req.session.user
      });
    }

    const { quotation } = quotationData;

    // Generate multiple WhatsApp caption templates
    const whatsappTemplates = {
      professional: ExportUtils.generateWhatsAppCaption(quotation, { whatsappTemplate: 'professional' }),
      friendly: ExportUtils.generateWhatsAppCaption(quotation, { whatsappTemplate: 'friendly' }),
      brief: ExportUtils.generateWhatsAppCaption(quotation, { whatsappTemplate: 'brief' })
    };

    // Generate WhatsApp sharing URL
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappTemplates.professional)}`;

    res.render('quotation-whatsapp', { 
      quotation, 
      whatsappTemplates,
      shareUrl,
      quotationId,
      user: req.session.user,
      title: `WhatsApp Share - ${quotation.quotation_no}`
    });

  } catch (error) {
    console.error('❌ WhatsApp page error:', error);
    res.status(500).render('error', {
      title: 'WhatsApp Error',
      error: { status: 500, message: 'Error loading WhatsApp integration' },
      user: req.session.user
    });
  }
});

// 🔥 Enhanced Email Integration with Templates
router.post('/quotations/export/:id/email', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const { emailTo, emailSubject, emailBody, exportFormat = 'pdf', emailTemplate = 'professional' } = req.body;
    const exportSettings = ExportUtils.validateExportSettings(req.body);

    console.log('📧 Preparing enhanced email export for quotation:', quotationId);

    if (!emailTo) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate email template if not provided
    let finalEmailSubject = emailSubject;
    let finalEmailBody = emailBody;

    if (!emailSubject || !emailBody) {
      const emailTemplate = ExportUtils.generateEmailTemplate(quotation, { emailTemplate });
      finalEmailSubject = finalEmailSubject || emailTemplate.subject;
      finalEmailBody = finalEmailBody || emailTemplate.body;
    }

    let attachmentBuffer;
    let fileName;
    let mimeType;

    // Generate attachment based on format
    if (exportFormat === 'pdf') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

      const htmlContent = await new Promise((resolve, reject) => {
        res.app.render('quotation-export-view', {
          quotation, items, scope, materials, terms, 
          exportSettings: exportSettings.settings, 
          qrCodeDataURL,
          user: req.session.user
        }, (err, html) => {
          if (err) reject(err);
          else resolve(html);
        });
      });

      attachmentBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings.settings);
      fileName = ExportUtils.generateFileName(quotation, 'pdf', { includeDate: true });
      mimeType = 'application/pdf';

    } else if (exportFormat === 'excel') {
      attachmentBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings.settings);
      fileName = ExportUtils.generateFileName(quotation, 'xlsx', { includeDate: true });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Log email preparation
    await logExportActivity(quotationId, `email-${exportFormat}`, exportSettings.settings, req.session.user.id);

    // Create enhanced mailto link
    const mailtoSubject = encodeURIComponent(finalEmailSubject);
    const mailtoBody = encodeURIComponent(finalEmailBody);
    const mailtoLink = `mailto:${emailTo}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Prepare download URL for the attachment
    const downloadUrl = `/quotations/export/${quotationId}/${exportFormat}`;

    res.json({
      success: true,
      mailtoLink: mailtoLink,
      downloadUrl: downloadUrl,
      fileName: fileName,
      message: 'Email client will open. Please download the attachment separately.',
      attachmentSize: attachmentBuffer.length,
      exportFormat: exportFormat
    });

  } catch (error) {
    console.error('❌ Enhanced email preparation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email preparation failed', 
      details: error.message 
    });
  }
});

// 🔥 Enhanced Template Management
router.post('/quotations/export/save-template', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const { templateName, templateDescription, templateSettings, isPublic = false } = req.body;
    const userId = req.session.user.id;

    if (!templateName || !templateSettings) {
      return res.status(400).json({ 
        success: false, 
        error: 'Template name and settings are required' 
      });
    }

    console.log('💾 Saving enhanced export template:', templateName);

    const templateData = {
      name: templateName,
      description: templateDescription || '',
      settings: templateSettings,
      isPublic: isPublic,
      category: 'user'
    };

    const template = await ExportUtils.saveAdvancedExportTemplate(templateData, userId);

    res.json({
      success: true,
      message: 'Export template saved successfully',
      template: template
    });

  } catch (error) {
    console.error('❌ Enhanced template save failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save template', 
      details: error.message 
    });
  }
});

// 🔥 Load User Templates
router.get('/quotations/export/templates', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const userId = req.session.user.id;
    const templates = await ExportUtils.loadExportTemplates(userId);

    res.json({
      success: true,
      templates: templates
    });

  } catch (error) {
    console.error('❌ Failed to load templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load templates', 
      details: error.message 
    });
  }
});

// 🔥 Enhanced Batch Export
router.post('/quotations/export/batch', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const { quotationIds, exportFormat = 'pdf', exportSettings: rawSettings } = req.body;
    const exportSettings = ExportUtils.validateExportSettings(rawSettings);

    console.log('📦 Starting enhanced batch export for quotations:', quotationIds);

    if (!quotationIds || !Array.isArray(quotationIds) || quotationIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No quotations selected for export' });
    }

    if (quotationIds.length > 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 quotations allowed per batch' });
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFileName = `quotations-batch-${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    archive.pipe(res);

    let successCount = 0;
    let errorCount = 0;

    // Process each quotation with progress tracking
    for (let i = 0; i < quotationIds.length; i++) {
      const quotationId = quotationIds[i];
      
      try {
        console.log(`📄 Processing quotation ${i + 1}/${quotationIds.length}: ${quotationId}`);
        
        const quotationData = await getQuotationData(quotationId);
        if (!quotationData) {
          errorCount++;
          continue;
        }

        const { quotation, items, scope, materials, terms } = quotationData;

        let fileBuffer;
        let fileName;

        if (exportFormat === 'pdf') {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const qrCodeDataURL = await ExportUtils.generateQRCode(quotationId, baseUrl);

          const htmlContent = await new Promise((resolve, reject) => {
            res.app.render('quotation-export-view', {
              quotation, items, scope, materials, terms, 
              exportSettings: exportSettings.settings, 
              qrCodeDataURL,
              user: req.session.user
            }, (err, html) => {
              if (err) reject(err);
              else resolve(html);
            });
          });

          fileBuffer = await ExportUtils.generatePDF(htmlContent, exportSettings.settings);
          fileName = ExportUtils.generateFileName(quotation, 'pdf', { includeDate: true });

        } else if (exportFormat === 'excel') {
          fileBuffer = await ExportUtils.generateExcel(quotation, items, scope, materials, terms, exportSettings.settings);
          fileName = ExportUtils.generateFileName(quotation, 'xlsx', { includeDate: true });
        }

        archive.append(fileBuffer, { name: fileName });
        successCount++;

        // Log individual export
        await logExportActivity(quotationId, `batch-${exportFormat}`, exportSettings.settings, req.session.user.id);

      } catch (error) {
        console.error(`❌ Failed to export quotation ${quotationId}:`, error);
        errorCount++;
        
        // Add error file to archive
        const errorInfo = `Export failed for quotation ${quotationId}\nError: ${error.message}\nTime: ${new Date().toISOString()}`;
        archive.append(errorInfo, { name: `ERROR-${quotationId}.txt` });
      }
    }

    // Add summary file
    const summaryInfo = `Batch Export Summary
===================
Total Quotations: ${quotationIds.length}
Successfully Exported: ${successCount}
Failed: ${errorCount}
Export Format: ${exportFormat.toUpperCase()}
Exported By: ${req.session.user.username}
Export Time: ${new Date().toISOString()}
`;
    archive.append(summaryInfo, { name: 'EXPORT-SUMMARY.txt' });

    archive.finalize();
    console.log(`✅ Enhanced batch export completed: ${successCount} success, ${errorCount} errors`);

  } catch (error) {
    console.error('❌ Enhanced batch export failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Batch export failed', 
      details: error.message 
    });
  }
});

// 🔥 Export Analytics Endpoint
router.get('/quotations/export/analytics', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const userId = req.session.user.id;
    const timeframe = req.query.timeframe || '30'; // days

    const [exportStats] = await db.query(`
      SELECT 
        export_format,
        COUNT(*) as count,
        DATE(exported_at) as export_date
      FROM export_logs 
      WHERE user_id = ? 
        AND exported_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY export_format, DATE(exported_at)
      ORDER BY exported_at DESC
    `, [userId, timeframe]);

    const [popularSettings] = await db.query(`
      SELECT 
        JSON_EXTRACT(settings, '$.paperSize') as paper_size,
        JSON_EXTRACT(settings, '$.imageFormat') as image_format,
        COUNT(*) as usage_count
      FROM export_logs 
      WHERE user_id = ? 
        AND exported_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY paper_size, image_format
      ORDER BY usage_count DESC
      LIMIT 5
    `, [userId, timeframe]);

    res.json({
      success: true,
      analytics: {
        exportStats: exportStats || [],
        popularSettings: popularSettings || [],
        timeframe: timeframe
      }
    });

  } catch (error) {
    console.error('❌ Export analytics failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load analytics', 
      details: error.message 
    });
  }
});

// 🔥 HELPER FUNCTIONS

// Enhanced quotation data retrieval
async function getQuotationData(quotationId) {
  try {
    // Get quotation with comprehensive client details
    const [quotationRows] = await db.query(`
      SELECT 
        q.*,
        c.name as client_name, c.phone as client_phone, c.email as client_email,
        c.address as client_address, c.city as client_city,
        cont.name as contractor_name, cont.phone as contractor_phone,
        sub.name as subcontractor_name, sub.phone as subcontractor_phone,
        eng.name as engineer_name, eng.phone as engineer_phone,
        att.name as attention_name, att.phone as attention_phone,
        u.username as created_by_name
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN clients cont ON q.contractor_id = cont.id
      LEFT JOIN clients sub ON q.subcontractor_id = sub.id
      LEFT JOIN clients eng ON q.engineer_id = eng.id
      LEFT JOIN clients att ON q.attention_id = att.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = ?
    `, [quotationId]);

    if (quotationRows.length === 0) {
      return null;
    }

    const quotation = quotationRows[0];

    // Get related data with enhanced queries
    const [itemRows] = await db.query(`
      SELECT 
        description, qty, unit, rate, amount,
        created_at, updated_at
      FROM quotation_item_lines 
      WHERE quotation_id = ? 
      ORDER BY id
    `, [quotationId]);

    const [scopeRows] = await db.query(`
      SELECT scope, created_at 
      FROM quotation_scope 
      WHERE quotation_id = ? 
      ORDER BY id
    `, [quotationId]);

    const [materialRows] = await db.query(`
      SELECT material, created_at 
      FROM quotation_materials 
      WHERE quotation_id = ? 
      ORDER BY id
    `, [quotationId]);

    const [termRows] = await db.query(`
      SELECT term, created_at 
      FROM quotation_terms 
      WHERE quotation_id = ? 
      ORDER BY id
    `, [quotationId]);

    return {
      quotation,
      items: itemRows || [],
      scope: scopeRows.map(row => row.scope) || [],
      materials: materialRows.map(row => row.material) || [],
      terms: termRows.map(row => row.term) || []
    };

  } catch (error) {
    console.error('❌ Error fetching enhanced quotation data:', error);
    throw error;
  }
}

// Enhanced export activity logging
async function logExportActivity(quotationId, format, settings, userId) {
  try {
    await db.query(`
      INSERT INTO export_logs (
        quotation_id, export_format, settings, user_id, 
        exported_at, file_size, success
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
    `, [
      quotationId, 
      format, 
      JSON.stringify(settings), 
      userId,
      settings.estimatedFileSize || 0,
      true
    ]);

    console.log(`📊 Export activity logged: ${format} for quotation ${quotationId}`);
  } catch (error) {
    console.error('❌ Failed to log export activity:', error);
    // Don't throw error to avoid breaking the export process
  }
}

// Get popular export settings for suggestions
async function getPopularExportSettings(userId) {
  try {
    const [rows] = await db.query(`
      SELECT 
        settings,
        COUNT(*) as usage_count,
        MAX(exported_at) as last_used
      FROM export_logs 
      WHERE user_id = ? 
        AND exported_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY settings
      HAVING usage_count >= 2
      ORDER BY usage_count DESC, last_used DESC
      LIMIT 3
    `, [userId]);

    return rows.map(row => ({
      settings: JSON.parse(row.settings),
      usageCount: row.usage_count,
      lastUsed: row.last_used
    }));
  } catch (error) {
    console.error('❌ Failed to get popular settings:', error);
    return [];
  }
}

// Enhanced error handling middleware for export routes
router.use((error, req, res, next) => {
  console.error('❌ Export route error:', error);

  if (req.path.includes('/export/')) {
    return res.status(500).json({
      success: false,
      error: 'Export operation failed',
      message: 'Please try again or contact support if the issue persists',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  next(error);
});

module.exports = router;