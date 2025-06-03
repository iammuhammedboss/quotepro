// routes/export-enhanced.js - Enhanced Export Controller
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const ExportUtilsEnhanced = require('../utils/exportUtilsEnhanced');
const path = require('path');

// 🔥 ENHANCED EXPORT INTERFACE
router.get('/quotations/export-enhanced/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;

    // Get quotation with client details
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    res.render('quotation-export-enhanced', { 
      quotation, 
      items, 
      scope, 
      materials, 
      terms,
      user: req.session.user 
    });

  } catch (err) {
    console.error('❌ Enhanced export interface error:', err);
    res.status(500).send('Error loading enhanced export interface');
  }
});

// 🔥 ENHANCED PREVIEW GENERATION
router.post('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = parseExportSettings(req.body);

    console.log('🔍 Generating enhanced preview for quotation:', quotationId);
    console.log('📋 Settings:', exportSettings);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateQRCode(quotationId, baseUrl, {
        size: exportSettings.qrSize || 120,
        quality: 0.9
      });
    }

    // Render enhanced preview template
    res.render('quotation-export-view-enhanced', {
      quotation,
      items,
      scope,
      materials,
      terms,
      exportSettings,
      qrCodeDataURL
    });

  } catch (error) {
    console.error('❌ Enhanced preview generation failed:', error);
    res.status(500).send(`
      <div style="padding: 50px; text-align: center; color: #dc3545;">
        <h3><i class="fas fa-exclamation-triangle"></i> Preview Generation Failed</h3>
        <p>Please check your settings and try again.</p>
        <small>${error.message}</small>
      </div>
    `);
  }
});

// 🔥 ENHANCED PDF EXPORT
router.post('/quotations/export/:id/pdf', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = parseExportSettings(req.body);

    console.log('🚀 Starting enhanced PDF export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateAdvancedQRCode(quotationId, baseUrl, {
        size: exportSettings.qrSize || 120,
        quality: exportSettings.quality === 'high' ? 0.95 : 0.9
      });
    }

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view-enhanced', {
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

    // Generate enhanced PDF
    const pdfBuffer = await ExportUtilsEnhanced.generateMultiPagePDF(htmlContent, {
      paperSize: exportSettings.paperSize,
      orientation: exportSettings.orientation,
      marginTop: exportSettings.marginTop || '20mm',
      marginRight: exportSettings.marginRight || '15mm',
      marginBottom: exportSettings.marginBottom || '20mm',
      marginLeft: exportSettings.marginLeft || '15mm',
      includeHeaderFooter: exportSettings.includeHeaderFooter,
      watermark: exportSettings.includeWatermark ? 'QUOTATION' : null
    });

    // Generate filename
    const fileName = ExportUtilsEnhanced.generateAdvancedFileName(quotation, 'pdf', {
      includeDate: true,
      includeClient: true,
      dateFormat: 'YYYY-MM-DD'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ Enhanced PDF export completed successfully');
    res.end(pdfBuffer);

  } catch (error) {
    console.error('❌ Enhanced PDF export failed:', error);
    res.status(500).json({ success: false, error: 'PDF generation failed', details: error.message });
  }
});

// 🔥 ENHANCED EXCEL EXPORT
router.post('/quotations/export/:id/excel', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const exportSettings = parseExportSettings(req.body);

    console.log('🚀 Starting enhanced Excel export for quotation:', quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate enhanced Excel
    const excelBuffer = await ExportUtilsEnhanced.generateAdvancedExcel(
      quotation, 
      items, 
      scope, 
      materials, 
      terms, 
      {
        paperSize: exportSettings.paperSize,
        orientation: exportSettings.orientation,
        headerFontSize: getFontSize(exportSettings.fontSize, 'header'),
        bodyFontSize: getFontSize(exportSettings.fontSize, 'body'),
        tableFontSize: getFontSize(exportSettings.fontSize, 'table'),
        customHeader: getCustomHeader(exportSettings),
        includeLogo: exportSettings.letterhead !== 'plain',
        enableEditing: exportSettings.quality === 'high'
      }
    );

    // Generate filename
    const fileName = ExportUtilsEnhanced.generateAdvancedFileName(quotation, 'xlsx', {
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
    res.status(500).json({ success: false, error: 'Excel generation failed', details: error.message });
  }
});

// 🔥 ENHANCED IMAGE EXPORT (PNG/JPG)
router.post('/quotations/export/:id/:format(png|jpg|jpeg)', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationId = req.params.id;
    const imageFormat = req.params.format;
    const exportSettings = parseExportSettings(req.body);

    console.log(`🚀 Starting enhanced ${imageFormat.toUpperCase()} export for quotation:`, quotationId);

    // Get quotation data
    const quotationData = await getQuotationData(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { quotation, items, scope, materials, terms } = quotationData;

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateAdvancedQRCode(quotationId, baseUrl, {
        size: exportSettings.qrSize || 120
      });
    }

    // Render HTML content
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('quotation-export-view-enhanced', {
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

    // Generate high-quality image
    const imageBuffer = await ExportUtilsEnhanced.generateHighQualityImage(htmlContent, {
      imageFormat: imageFormat,
      imageWidth: getImageDimensions(exportSettings.paperSize).width,
      imageHeight: getImageDimensions(exportSettings.paperSize).height,
      imageQuality: exportSettings.quality === 'high' ? 95 : 85,
      highDPI: exportSettings.quality === 'high',
      optimizeImage: true
    });

    // Generate filename
    const fileName = ExportUtilsEnhanced.generateAdvancedFileName(quotation, imageFormat, {
      includeDate: true,
      includeClient: true
    });
    
    const mimeType = ExportUtilsEnhanced.getMimeType ? ExportUtilsEnhanced.getMimeType(imageFormat) : `image/${imageFormat}`;
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', imageBuffer.length);

    console.log(`✅ Enhanced ${imageFormat.toUpperCase()} export completed successfully`);
    res.end(imageBuffer);

  } catch (error) {
    console.error(`❌ Enhanced image export failed:`, error);
    res.status(500).json({ success: false, error: 'Image generation failed', details: error.message });
  }
});

// 🔥 HELPER FUNCTIONS

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

function parseExportSettings(body) {
  return {
    method: body.method || 'digital',
    paperType: body.paperType || 'plain',
    letterhead: body.letterhead || 'plain',
    format: body.format || 'pdf',
    paperSize: body.paperSize || 'A4',
    orientation: body.orientation || 'portrait',
    quality: body.quality || 'medium',
    fontSize: body.fontSize || 'medium',
    includeSignature: body.includeSignature === 'true',
    includeQR: body.includeQR === 'true',
    includeWatermark: body.includeWatermark === 'true',
    delivery: body.delivery || 'download',
    
    // Advanced settings
    marginTop: body.marginTop || '20mm',
    marginRight: body.marginRight || '15mm',
    marginBottom: body.marginBottom || '20mm',
    marginLeft: body.marginLeft || '15mm',
    includeHeaderFooter: body.includeHeaderFooter === 'true',
    qrSize: parseInt(body.qrSize) || 120
  };
}

function getFontSize(sizeCategory, type) {
  const sizes = {
    small: { header: 24, body: 12, table: 10 },
    medium: { header: 28, body: 14, table: 12 },
    large: { header: 32, body: 16, table: 14 }
  };
  
  return sizes[sizeCategory] ? sizes[sizeCategory][type] : sizes.medium[type];
}

function getCustomHeader(exportSettings) {
  if (exportSettings.letterhead === 'eurotech') {
    return 'QUOTATION FOR WATERPROOFING SERVICES';
  }
  return 'QUOTATION FOR WATERPROOFING';
}

function getImageDimensions(paperSize) {
  const dimensions = {
    'A4': { width: 1240, height: 1754 },
    'A3': { width: 1754, height: 2480 },
    'Letter': { width: 1275, height: 1650 },
    'Legal': { width: 1275, height: 2100 }
  };
  
  return dimensions[paperSize] || dimensions.A4;
}

module.exports = router;