// utils/exportUtils.js - Export Helper Functions
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ExportUtils {
  
  // 🔥 Generate QR Code for Quotation
  static async generateQRCode(quotationId, baseUrl = 'http://localhost:3000') {
    try {
      const quotationUrl = `${baseUrl}/quotations/view/${quotationId}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(quotationUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });
      
      console.log('✅ QR Code generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ QR Code generation failed:', error);
      throw error;
    }
  }

  // 🔥 Generate PDF using Puppeteer
  static async generatePDF(htmlContent, exportSettings = {}) {
    let browser = null;
    
    try {
      console.log('🚀 Starting PDF generation...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Configure PDF options based on export settings
      const pdfOptions = {
        format: exportSettings.paperSize || 'A4',
        printBackground: true,
        margin: {
          top: exportSettings.marginTop || '20mm',
          right: exportSettings.marginRight || '15mm',
          bottom: exportSettings.marginBottom || '20mm',
          left: exportSettings.marginLeft || '15mm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      };

      // Add custom CSS for page breaks if multi-page
      if (exportSettings.multiPage) {
        await page.addStyleTag({
          content: `
            @page { size: ${exportSettings.paperSize || 'A4'}; margin: 0; }
            .page-break { page-break-before: always; }
            .page-break-avoid { page-break-inside: avoid; }
          `
        });
      }

      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 🔥 Generate Excel Export
  static async generateExcel(quotation, items, scope, materials, terms, exportSettings = {}) {
    try {
      console.log('🚀 Starting Excel generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'QuotePro - International Pipes Technology Co LLC';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Quotation', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          margins: {
            left: 0.75, right: 0.75,
            top: 1.0, bottom: 1.0,
            header: 0.3, footer: 0.3
          }
        }
      });

      // 🎨 Define Styles
      const headerStyle = {
        font: { bold: true, size: 16, color: { argb: 'FFC91F1F' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
      };

      const subHeaderStyle = {
        font: { bold: true, size: 12, color: { argb: 'FF666666' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };

      const tableHeaderStyle = {
        font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      const tableDataStyle = {
        font: { size: 10 },
        alignment: { vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      const summaryLabelStyle = {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'right', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
      };

      const summaryValueStyle = {
        font: { size: 11 },
        alignment: { horizontal: 'right', vertical: 'middle' },
        numFmt: '0.000'
      };

      // 📄 Header Section
      let currentRow = 1;
      
      // Main Title
      worksheet.getCell(`A${currentRow}`).value = exportSettings.customHeader || 'QUOTATION FOR WATERPROOFING';
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow += 2;

      // VAT Number
      worksheet.getCell(`A${currentRow}`).value = 'VAT NO: OM1100077623';
      worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow += 2;

      // Quotation Info
      worksheet.getCell(`A${currentRow}`).value = 'Quotation No:';
      worksheet.getCell(`B${currentRow}`).value = quotation.quotation_no;
      worksheet.getCell(`D${currentRow}`).value = 'Date:';
      worksheet.getCell(`E${currentRow}`).value = new Date(quotation.tdate).toLocaleDateString('en-GB');
      currentRow += 2;

      // Client Information
      worksheet.getCell(`A${currentRow}`).value = 'CLIENT INFORMATION';
      worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = 'Client Name:';
      worksheet.getCell(`B${currentRow}`).value = quotation.client_name;
      worksheet.getCell(`D${currentRow}`).value = 'Phone:';
      worksheet.getCell(`E${currentRow}`).value = quotation.client_phone;
      currentRow++;

      if (quotation.project_location) {
        worksheet.getCell(`A${currentRow}`).value = 'Project Location:';
        worksheet.getCell(`B${currentRow}`).value = quotation.project_location;
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        currentRow++;
      }

      currentRow++;

      // 📋 Items Table
      if (items && items.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'QUOTATION ITEMS';
        worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Table Headers
        const headers = ['SL', 'Description', 'Qty', 'Unit', 'Rate (OMR)', 'Amount (OMR)'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`);
          cell.value = header;
          cell.style = tableHeaderStyle;
        });
        currentRow++;

        // Table Data
        items.forEach((item, index) => {
          worksheet.getCell(`A${currentRow}`).value = index + 1;
          worksheet.getCell(`A${currentRow}`).style = { ...tableDataStyle, alignment: { horizontal: 'center', vertical: 'top' } };
          
          worksheet.getCell(`B${currentRow}`).value = item.description;
          worksheet.getCell(`B${currentRow}`).style = tableDataStyle;
          
          worksheet.getCell(`C${currentRow}`).value = parseFloat(item.qty);
          worksheet.getCell(`C${currentRow}`).style = { ...tableDataStyle, alignment: { horizontal: 'center', vertical: 'top' }, numFmt: '0.000' };
          
          worksheet.getCell(`D${currentRow}`).value = item.unit;
          worksheet.getCell(`D${currentRow}`).style = { ...tableDataStyle, alignment: { horizontal: 'center', vertical: 'top' } };
          
          worksheet.getCell(`E${currentRow}`).value = parseFloat(item.rate);
          worksheet.getCell(`E${currentRow}`).style = { ...tableDataStyle, alignment: { horizontal: 'right', vertical: 'top' }, numFmt: '0.000' };
          
          worksheet.getCell(`F${currentRow}`).value = parseFloat(item.amount);
          worksheet.getCell(`F${currentRow}`).style = { ...tableDataStyle, alignment: { horizontal: 'right', vertical: 'top' }, numFmt: '0.000' };
          
          currentRow++;
        });

        currentRow++;

        // 💰 Summary Section
        const summaryData = [
          ['Total Amount:', parseFloat(quotation.total_amount)],
          ['Discount:', parseFloat(quotation.discount)],
          [`VAT (${quotation.vat_rate}%):`, parseFloat(quotation.vat_amount)],
          ['Round Off:', parseFloat(quotation.round_off)],
          ['Grand Total:', parseFloat(quotation.grand_total)]
        ];

        summaryData.forEach(([label, value]) => {
          if (label === 'Discount:' && value === 0) return;
          if (label === 'Round Off:' && value === 0) return;
          
          worksheet.getCell(`E${currentRow}`).value = label;
          worksheet.getCell(`E${currentRow}`).style = summaryLabelStyle;
          
          worksheet.getCell(`F${currentRow}`).value = value;
          worksheet.getCell(`F${currentRow}`).style = summaryValueStyle;
          
          if (label === 'Grand Total:') {
            worksheet.getCell(`E${currentRow}`).style = { ...summaryLabelStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } }, font: { bold: true, color: { argb: 'FFFFFFFF' } } };
            worksheet.getCell(`F${currentRow}`).style = { ...summaryValueStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } }, font: { bold: true, color: { argb: 'FFFFFFFF' } } };
          }
          
          currentRow++;
        });

        currentRow++;
      }

      // 📝 Add Scope, Materials, Terms
      const sections = [
        { title: 'SCOPE OF WORK', data: scope, hasData: scope && scope.some(item => item && item.trim()) },
        { title: 'MATERIALS', data: materials, hasData: materials && materials.some(item => item && item.trim()) },
        { title: 'TERMS & CONDITIONS', data: terms, hasData: terms && terms.some(item => item && item.trim()) }
      ];

      sections.forEach(section => {
        if (section.hasData) {
          worksheet.getCell(`A${currentRow}`).value = section.title;
          worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
          worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
          currentRow++;

          section.data.forEach((item, index) => {
            if (item && item.trim()) {
              worksheet.getCell(`A${currentRow}`).value = `${index + 1}.`;
              worksheet.getCell(`B${currentRow}`).value = item;
              worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
              currentRow++;
            }
          });
          currentRow++;
        }
      });

      // 🛡️ Warranty Section
      worksheet.getCell(`A${currentRow}`).value = 'WARRANTY';
      worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = `${quotation.warranty} YEARS WARRANTY`;
      worksheet.getCell(`A${currentRow}`).style = { font: { bold: true, size: 12 } };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      if (quotation.warranty_note) {
        worksheet.getCell(`A${currentRow}`).value = quotation.warranty_note;
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;
      }

      // 📏 Set Column Widths
      worksheet.getColumn('A').width = 8;   // SL
      worksheet.getColumn('B').width = 40;  // Description
      worksheet.getColumn('C').width = 12;  // Qty
      worksheet.getColumn('D').width = 10;  // Unit
      worksheet.getColumn('E').width = 15;  // Rate
      worksheet.getColumn('F').width = 15;  // Amount

      console.log('✅ Excel generated successfully');
      return await workbook.xlsx.writeBuffer();
      
    } catch (error) {
      console.error('❌ Excel generation failed:', error);
      throw error;
    }
  }

  // 🔥 Generate Image (JPG/PNG) from HTML
  static async generateImage(htmlContent, exportSettings = {}) {
    let browser = null;
    
    try {
      console.log('🚀 Starting Image generation...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set viewport for image generation
      await page.setViewport({
        width: exportSettings.imageWidth || 1200,
        height: exportSettings.imageHeight || 1600,
        deviceScaleFactor: 2 // High resolution
      });
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const imageBuffer = await page.screenshot({
        fullPage: true,
        type: exportSettings.imageFormat || 'png',
        quality: exportSettings.imageFormat === 'jpeg' ? (exportSettings.imageQuality || 90) : undefined
      });

      // Optimize image if needed
      if (exportSettings.optimizeImage) {
        const optimizedBuffer = await sharp(imageBuffer)
          .resize(exportSettings.maxWidth || 1200, exportSettings.maxHeight || 1600, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: exportSettings.imageQuality || 85 })
          .toBuffer();
        
        console.log('✅ Optimized image generated successfully');
        return optimizedBuffer;
      }

      console.log('✅ Image generated successfully');
      return imageBuffer;
      
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 🔥 Generate WhatsApp Caption
  static generateWhatsAppCaption(quotation, exportSettings = {}) {
    const caption = `📋 *QUOTATION DETAILS*
    
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

    return caption;
  }

  // 🔥 Validate Export Settings
  static validateExportSettings(settings = {}) {
    const defaultSettings = {
      customHeader: 'QUOTATION FOR WATERPROOFING',
      headerFontSize: '28px',
      subheaderFontSize: '18px',
      bodyFontSize: '14px',
      tableFontSize: '12px',
      smallFontSize: '11px',
      qrSize: '100',
      paperSize: 'A4',
      marginTop: '20mm',
      marginRight: '15mm',
      marginBottom: '20mm',
      marginLeft: '15mm',
      includeSignature: false,
      includeStamp: false,
      letterhead: 'plain',
      watermark: null,
      imageFormat: 'png',
      imageQuality: 90,
      imageWidth: 1200,
      imageHeight: 1600,
      optimizeImage: true
    };

    return { ...defaultSettings, ...settings };
  }

  // 🔥 Save Export Template
  static async saveExportTemplate(templateName, settings, userId) {
    try {
      const templateData = {
        name: templateName,
        settings: settings,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database or file system
      // This would be implemented based on your preference
      console.log('✅ Export template saved:', templateName);
      return templateData;
      
    } catch (error) {
      console.error('❌ Failed to save export template:', error);
      throw error;
    }
  }

  // 🔥 Get MIME Type for file format
  static getMimeType(format) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg'
    };
    
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  // 🔥 Generate File Name
  static generateFileName(quotation, format, customName = null) {
    if (customName) {
      return `${customName}.${format}`;
    }
    
    const sanitizedQuoteNo = quotation.quotation_no.replace(/[^a-zA-Z0-9]/g, '-');
    const sanitizedClientName = quotation.client_name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
    const date = new Date(quotation.tdate).toISOString().slice(0, 10);
    
    return `${sanitizedQuoteNo}-${sanitizedClientName}-${date}.${format}`;
  }
}

module.exports = ExportUtils;