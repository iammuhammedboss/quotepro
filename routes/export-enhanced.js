// routes/export-enhanced.js - Enhanced Export Controller
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const ExportUtilsEnhanced = require('../utils/exportUtilsEnhanced');
const path = require('path');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const sharp = require('sharp');

// 🔥 ENHANCED EXPORT INTERFACE
router.get('/quotations/export-enhanced/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationData = await getQuotationData(req.params.id);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    res.render('quotation-export-enhanced', {
      ...quotationData,
      user: req.session.user
    });
  } catch (error) {
    console.error('Export interface error:', error);
    res.status(500).send('Error loading export interface');
  }
});

// 🔥 ENHANCED PREVIEW GENERATION
router.post('/quotations/export/:id/preview', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationData = await getQuotationData(req.params.id);
    if (!quotationData) {
      return res.status(404).send('Quotation not found');
    }

    const exportSettings = parseExportSettings(req.body);

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateQRCode(req.params.id, baseUrl, {
        size: exportSettings.qrSize,
        quality: 0.92
      });
    }

    res.render('quotation-export-view-enhanced', {
      ...quotationData,
      exportSettings,
      qrCodeDataURL,
      formatCurrency: (value) => parseFloat(value || 0).toFixed(3),
      getFontSize: (sizeCategory, type) => {
        const sizes = {
          small: { header: 24, body: 12, table: 10 },
          medium: { header: 28, body: 14, table: 12 },
          large: { header: 32, body: 16, table: 14 }
        };
        return sizes[sizeCategory] ? sizes[sizeCategory][type] : sizes.medium[type];
      }
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).send('Preview generation failed');
  }
});

// 🔥 ENHANCED PDF EXPORT
router.post('/quotations/export/:id/pdf', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationData = await getQuotationData(req.params.id);
    if (!quotationData) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const exportSettings = parseExportSettings(req.body);

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateQRCode(req.params.id, baseUrl, {
        size: exportSettings.qrSize,
        quality: 0.92
      });
    }

    // Generate HTML content
    const html = await new Promise((resolve, reject) => {
      res.render('quotation-export-view-enhanced', {
        ...quotationData,
        exportSettings,
        qrCodeDataURL,
        formatCurrency: (value) => parseFloat(value || 0).toFixed(3),
        getFontSize: (sizeCategory, type) => {
          const sizes = {
            small: { header: 24, body: 12, table: 10 },
            medium: { header: 28, body: 14, table: 12 },
            large: { header: 32, body: 16, table: 14 }
          };
          return sizes[sizeCategory] ? sizes[sizeCategory][type] : sizes.medium[type];
        }
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: exportSettings.paperSize,
      landscape: exportSettings.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: exportSettings.marginTop,
        right: exportSettings.marginRight,
        bottom: exportSettings.marginBottom,
        left: exportSettings.marginLeft
      }
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotationData.quotation.quotation_no}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

// 🔥 ENHANCED IMAGE EXPORT (PNG/JPG)
router.post('/quotations/export/:id/:format(png|jpg)', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationData = await getQuotationData(req.params.id);
    if (!quotationData) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const exportSettings = parseExportSettings(req.body);
    const format = req.params.format;

    // Generate QR Code if enabled
    let qrCodeDataURL = null;
    if (exportSettings.includeQR) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      qrCodeDataURL = await ExportUtilsEnhanced.generateQRCode(req.params.id, baseUrl, {
        size: exportSettings.qrSize,
        quality: 0.92
      });
    }

    // Generate HTML content
    const html = await new Promise((resolve, reject) => {
      res.render('quotation-export-view-enhanced', {
        ...quotationData,
        exportSettings,
        qrCodeDataURL,
        formatCurrency: (value) => parseFloat(value || 0).toFixed(3),
        getFontSize: (sizeCategory, type) => {
          const sizes = {
            small: { header: 24, body: 12, table: 10 },
            medium: { header: 28, body: 14, table: 12 },
            large: { header: 32, body: 16, table: 14 }
          };
          return sizes[sizeCategory] ? sizes[sizeCategory][type] : sizes.medium[type];
        }
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Generate image
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set viewport size based on paper size
    const paperSizes = {
      'A4': { width: 2480, height: 3508 },
      'A3': { width: 3508, height: 4961 },
      'Letter': { width: 2550, height: 3300 }
    };
    const viewport = paperSizes[exportSettings.paperSize] || paperSizes['A4'];
    if (exportSettings.orientation === 'landscape') {
      [viewport.width, viewport.height] = [viewport.height, viewport.width];
    }
    await page.setViewport(viewport);

    // Capture screenshot
    const screenshot = await page.screenshot({
      type: format,
      fullPage: true,
      quality: format === 'jpg' ? 90 : undefined
    });

    await browser.close();

    // Optimize image if needed
    const optimizedBuffer = await sharp(screenshot)
      .resize(viewport.width, null, { fit: 'contain' })
      [format === 'png' ? 'png' : 'jpeg']({
        quality: 90,
        progressive: true
      })
      .toBuffer();

    // Send image
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotationData.quotation.quotation_no}.${format}"`);
    res.send(optimizedBuffer);

  } catch (error) {
    console.error('Image export error:', error);
    res.status(500).json({ error: 'Image generation failed' });
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

// 🔥 ENHANCED WHATSAPP EXPORT
router.post('/quotations/export/:id/whatsapp', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  try {
    const quotationData = await getQuotationData(req.params.id);
    if (!quotationData) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const { quotation } = quotationData;
    const message = `*Quotation #${quotation.quotation_no}*\n\n` +
      `Dear ${quotation.client_name},\n\n` +
      `Please find your quotation details below:\n\n` +
      `Project: ${quotation.project_name}\n` +
      `Amount: OMR ${parseFloat(quotation.grand_total).toFixed(3)}\n` +
      `Validity: ${quotation.validity_period} days\n\n` +
      `Thank you for your business!\n` +
      `International Pipes Technology Co LLC`;

    const whatsappUrl = `https://wa.me/${quotation.client_contact}?text=${encodeURIComponent(message)}`;
    res.json({ success: true, whatsappUrl });

  } catch (error) {
    console.error('WhatsApp export error:', error);
    res.status(500).json({ error: 'WhatsApp export failed' });
  }
});

// �� HELPER FUNCTIONS

async function getQuotationData(quotationId) {
  try {
    // Get quotation with client details
    const [quotation] = await db.query(`
      SELECT q.*, c.name as client_name, c.email as client_email, 
             c.phone as client_contact, c.address as client_address
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = ?
    `, [quotationId]);

    if (!quotation || quotation.length === 0) {
      return null;
    }

    // Get quotation items
    const [items] = await db.query(`
      SELECT qi.*, u.name as unit
      FROM quotation_items qi
      LEFT JOIN units u ON qi.unit_id = u.id
      WHERE qi.quotation_id = ?
      ORDER BY qi.item_order
    `, [quotationId]);

    // Get scope of work
    const [scope] = await db.query(`
      SELECT description
      FROM quotation_scope
      WHERE quotation_id = ?
      ORDER BY item_order
    `, [quotationId]);

    // Get materials
    const [materials] = await db.query(`
      SELECT description
      FROM quotation_materials
      WHERE quotation_id = ?
      ORDER BY item_order
    `, [quotationId]);

    // Get terms
    const [terms] = await db.query(`
      SELECT description
      FROM quotation_terms
      WHERE quotation_id = ?
      ORDER BY item_order
    `, [quotationId]);

    return {
      quotation: quotation[0],
      items,
      scope,
      materials,
      terms
    };
  } catch (error) {
    console.error('Error fetching quotation data:', error);
    throw error;
  }
}

function parseExportSettings(body) {
  return {
    paperSize: body.paperSize || 'A4',
    orientation: body.orientation || 'portrait',
    fontSize: body.fontSize || 'medium',
    quality: body.quality || 'standard',
    letterhead: body.letterhead || 'professional',
    includeQR: body.includeQR === 'on',
    includeWatermark: body.includeWatermark === 'on',
    marginTop: body.marginTop || '20mm',
    marginRight: body.marginRight || '15mm',
    marginBottom: body.marginBottom || '20mm',
    marginLeft: body.marginLeft || '15mm',
    includeHeaderFooter: body.includeHeaderFooter === 'on',
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

module.exports = router;