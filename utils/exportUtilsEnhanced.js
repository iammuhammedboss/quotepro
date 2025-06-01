// utils/exportUtilsEnhanced.js - Professional Export Utilities with Advanced Features
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ExportUtilsEnhanced {
  
  // 🔥 Enhanced QR Code Generation with Multiple Options
  static async generateQRCode(quotationId, baseUrl, options = {}) {
    try {
      const quotationUrl = `${baseUrl}/quotations/view/${quotationId}`;
      
      const qrOptions = {
        errorCorrectionLevel: options.errorLevel || 'M',
        type: 'image/png',
        quality: options.quality || 0.95,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        width: parseInt(options.size) || 120,
        scale: options.scale || 8
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(quotationUrl, qrOptions);
      
      console.log('✅ Enhanced QR Code generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ Enhanced QR Code generation failed:', error);
      throw error;
    }
  }

  // 🔥 Professional PDF Generation with Advanced Features
  static async generatePDF(htmlContent, exportSettings = {}) {
    let browser = null;
    
    try {
      console.log('🚀 Starting professional PDF generation...');
      
      // Enhanced browser configuration
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--font-render-hinting=none',
          '--disable-features=TranslateUI'
        ],
        defaultViewport: {
          width: 1200,
          height: 1600,
          deviceScaleFactor: 2
        }
      });
      
      const page = await browser.newPage();
      
      // Enhanced page setup
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });

      // Set content with optimized loading
      await page.setContent(htmlContent, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 45000 
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Enhanced PDF options
      const pdfOptions = {
        format: exportSettings.paperSize || 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: exportSettings.includeHeaderFooter || false,
        headerTemplate: exportSettings.headerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px; color: #666;">
            <span>International Pipes Technology Co LLC</span>
          </div>
        `,
        footerTemplate: exportSettings.footerTemplate || `
          <div style="font-size: 9px; text-align: center; width: 100%; padding: 5px; color: #666;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on <span class="date"></span></span>
          </div>
        `,
        margin: {
          top: exportSettings.marginTop || '20mm',
          right: exportSettings.marginRight || '15mm',
          bottom: exportSettings.marginBottom || '25mm',
          left: exportSettings.marginLeft || '15mm'
        }
      };

      // Add watermark styling if specified
      if (exportSettings.watermark) {
        await page.addStyleTag({
          content: `
            body::before {
              content: "${exportSettings.watermark}";
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 84px;
              color: rgba(200, 200, 200, 0.15);
              z-index: -1;
              pointer-events: none;
              font-weight: bold;
              font-family: 'Arial', sans-serif;
            }
          `
        });
      }

      // Enhanced CSS for better page breaks and print quality
      await page.addStyleTag({
        content: `
          @page { 
            size: ${exportSettings.paperSize || 'A4'}; 
            margin: ${pdfOptions.margin.top} ${pdfOptions.margin.right} ${pdfOptions.margin.bottom} ${pdfOptions.margin.left};
          }
          
          .page-break { 
            page-break-before: always !important; 
          }
          
          .page-break-avoid { 
            page-break-inside: avoid !important; 
          }
          
          .items-table { 
            page-break-inside: auto; 
          }
          
          .items-table tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          
          .items-table thead {
            display: table-header-group;
          }
          
          .section { 
            page-break-inside: avoid; 
          }
          
          .signature-section {
            page-break-before: auto;
            page-break-inside: avoid !important;
            margin-top: 40px;
          }
          
          .warranty-section {
            page-break-inside: avoid !important;
          }
          
          /* Enhanced print quality */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .summary-table {
            page-break-inside: avoid !important;
          }
          
          .list-section {
            page-break-inside: avoid;
          }
          
          @media print {
            .no-print { display: none !important; }
            body { margin: 0 !important; }
          }
        `
      });

      // Generate PDF with enhanced options
      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ Professional PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Professional PDF generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 🔥 Advanced Excel Generation with Professional Styling
  static async generateExcel(quotation, items, scope, materials, terms, exportSettings = {}) {
    try {
      console.log('🚀 Starting advanced Excel generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'QuotePro - International Pipes Technology Co LLC';
      workbook.created = new Date();
      workbook.company = 'International Pipes Technology Co LLC';
      workbook.subject = `Quotation ${quotation.quotation_no}`;
      workbook.keywords = 'quotation, waterproofing, construction';
      
      const worksheet = workbook.addWorksheet('Quotation', {
        pageSetup: {
          paperSize: exportSettings.paperSize === 'A3' ? 11 : 9,
          orientation: exportSettings.orientation || 'portrait',
          margins: {
            left: 0.7, right: 0.7,
            top: 1.0, bottom: 1.0,
            header: 0.3, footer: 0.3
          },
          printArea: 'A1:G150',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: true
        }
      });

      // 🎨 Professional Color Scheme
      const colors = {
        primary: 'FFC91F1F',      // Company Red
        secondary: 'FF2563EB',    // Blue
        success: 'FF16A34A',      // Green
        warning: 'FFEA580C',      // Orange
        light: 'FFF8F9FA',        // Light Gray
        lighter: 'FFFAFAFA',      // Very Light Gray
        border: 'FFE5E7EB',       // Border Gray
        text: 'FF374151',         // Dark Gray
        white: 'FFFFFFFF'
      };

      // 🎨 Enhanced Professional Styles
      const styles = {
        companyHeader: {
          font: { bold: true, size: 20, color: { argb: colors.primary }, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
          border: {
            top: { style: 'thick', color: { argb: colors.primary } },
            left: { style: 'thick', color: { argb: colors.primary } },
            bottom: { style: 'thick', color: { argb: colors.primary } },
            right: { style: 'thick', color: { argb: colors.primary } }
          }
        },

        mainTitle: {
          font: { bold: true, size: 16, color: { argb: colors.primary }, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lighter } },
          border: { 
            top: { style: 'medium', color: { argb: colors.primary } },
            bottom: { style: 'medium', color: { argb: colors.primary } }
          }
        },

        sectionHeader: {
          font: { bold: true, size: 14, color: { argb: colors.white }, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          }
        },

        tableHeader: {
          font: { bold: true, size: 11, color: { argb: colors.white }, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
          border: {
            top: { style: 'medium' }, left: { style: 'thin' },
            bottom: { style: 'medium' }, right: { style: 'thin' }
          }
        },

        tableData: {
          font: { size: 10, name: 'Calibri' },
          alignment: { vertical: 'top', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: colors.border } },
            left: { style: 'thin', color: { argb: colors.border } },
            bottom: { style: 'thin', color: { argb: colors.border } },
            right: { style: 'thin', color: { argb: colors.border } }
          }
        },

        summaryLabel: {
          font: { bold: true, size: 11, name: 'Calibri' },
          alignment: { horizontal: 'right', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          }
        },

        summaryValue: {
          font: { size: 11, name: 'Calibri' },
          alignment: { horizontal: 'right', vertical: 'middle' },
          numFmt: '#,##0.000',
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          }
        },

        grandTotal: {
          font: { bold: true, size: 12, color: { argb: colors.white }, name: 'Calibri' },
          alignment: { horizontal: 'right', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
          numFmt: '#,##0.000',
          border: {
            top: { style: 'thick' }, left: { style: 'thin' },
            bottom: { style: 'thick' }, right: { style: 'thin' }
          }
        }
      };

      let currentRow = 1;
      
      // 🏢 Company Header
      worksheet.getCell(`A${currentRow}`).value = 'INTERNATIONAL PIPES TECHNOLOGY CO LLC';
      worksheet.getCell(`A${currentRow}`).style = styles.companyHeader;
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = 'Your Waterproofing Specialist | CR No: 2231867 | VAT No: OM1100077623';
      worksheet.getCell(`A${currentRow}`).style = {
        font: { size: 10, italic: true, color: { argb: colors.text } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      currentRow += 2;

      // 📋 Main Title
      const mainTitle = exportSettings.customHeader || 'QUOTATION FOR WATERPROOFING';
      worksheet.getCell(`A${currentRow}`).value = mainTitle;
      worksheet.getCell(`A${currentRow}`).style = styles.mainTitle;
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getRow(currentRow).height = 20;
      currentRow += 2;

      // 📊 Quotation Information Header
      worksheet.getCell(`A${currentRow}`).value = 'QUOTATION INFORMATION';
      worksheet.getCell(`A${currentRow}`).style = styles.sectionHeader;
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      currentRow++;

      // 📝 Quotation Details
      const quotationInfo = [
        ['Quotation No:', quotation.quotation_no, 'Date:', new Date(quotation.tdate).toLocaleDateString('en-GB')],
        ['Client:', quotation.client_name, 'Phone:', quotation.client_phone || 'N/A'],
        ['Location:', quotation.project_location || 'N/A', 'Reference:', quotation.ref_no || 'N/A']
      ];

      quotationInfo.forEach(([label1, value1, label2, value2]) => {
        // Left side
        worksheet.getCell(`A${currentRow}`).value = label1;
        worksheet.getCell(`A${currentRow}`).style = { 
          font: { bold: true, size: 10 }, 
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lighter } },
          border: styles.tableData.border
        };
        
        worksheet.getCell(`B${currentRow}`).value = value1;
        worksheet.getCell(`B${currentRow}`).style = { 
          ...styles.tableData, 
          font: { size: 10, bold: false }
        };
        worksheet.mergeCells(`B${currentRow}:C${currentRow}`);

        // Right side
        worksheet.getCell(`D${currentRow}`).value = label2;
        worksheet.getCell(`D${currentRow}`).style = { 
          font: { bold: true, size: 10 }, 
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lighter } },
          border: styles.tableData.border
        };
        
        worksheet.getCell(`E${currentRow}`).value = value2;
        worksheet.getCell(`E${currentRow}`).style = { 
          ...styles.tableData, 
          font: { size: 10, bold: false }
        };
        worksheet.mergeCells(`E${currentRow}:G${currentRow}`);
        
        currentRow++;
      });

      currentRow += 2;

      // 📋 Items Section
      if (items && items.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'QUOTATION ITEMS';
        worksheet.getCell(`A${currentRow}`).style = styles.sectionHeader;
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        currentRow++;

        // Enhanced Table Headers
        const headers = ['SL', 'DESCRIPTION', 'QTY', 'UNIT', 'RATE (OMR)', 'AMOUNT (OMR)'];
        headers.forEach((header, index) => {
          const col = String.fromCharCode(65 + index);
          const cell = worksheet.getCell(`${col}${currentRow}`);
          cell.value = header;
          cell.style = styles.tableHeader;
        });
        worksheet.getRow(currentRow).height = 18;
        currentRow++;

        // Enhanced Table Data with Alternating Colors
        items.forEach((item, index) => {
          const isEvenRow = index % 2 === 0;
          const rowStyle = {
            ...styles.tableData,
            fill: { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: isEvenRow ? colors.white : colors.lighter } 
            }
          };

          // Serial Number
          worksheet.getCell(`A${currentRow}`).value = index + 1;
          worksheet.getCell(`A${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { bold: true, size: 10 }
          };
          
          // Description
          worksheet.getCell(`B${currentRow}`).value = item.description;
          worksheet.getCell(`B${currentRow}`).style = rowStyle;
          
          // Quantity
          worksheet.getCell(`C${currentRow}`).value = parseFloat(item.qty);
          worksheet.getCell(`C${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'middle' }, 
            numFmt: '#,##0.000' 
          };
          
          // Unit
          worksheet.getCell(`D${currentRow}`).value = item.unit;
          worksheet.getCell(`D${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'middle' } 
          };
          
          // Rate
          worksheet.getCell(`E${currentRow}`).value = parseFloat(item.rate);
          worksheet.getCell(`E${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'right', vertical: 'middle' }, 
            numFmt: '#,##0.000' 
          };
          
          // Amount
          worksheet.getCell(`F${currentRow}`).value = parseFloat(item.amount);
          worksheet.getCell(`F${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'right', vertical: 'middle' }, 
            numFmt: '#,##0.000' 
          };
          
          // Add conditional formatting for high-value items
          if (parseFloat(item.amount) > 1000) {
            worksheet.getCell(`F${currentRow}`).style.font = { 
              ...rowStyle.font, 
              bold: true, 
              color: { argb: colors.secondary } 
            };
          }
          
          // Auto-adjust row height based on description length
          const estimatedHeight = Math.max(15, Math.ceil(item.description.length / 60) * 12);
          worksheet.getRow(currentRow).height = estimatedHeight;
          
          currentRow++;
        });

        currentRow++;

        // 💰 Enhanced Summary Section
        const summaryData = [
          ['Sub Total:', parseFloat(quotation.total_amount)],
          ['Discount:', parseFloat(quotation.discount || 0)],
          [`VAT (${quotation.vat_rate || 5}%):`, parseFloat(quotation.vat_amount)],
          ['Round Off:', parseFloat(quotation.round_off || 0)],
          ['GRAND TOTAL:', parseFloat(quotation.grand_total)]
        ];

        summaryData.forEach(([label, value]) => {
          // Skip zero values for discount and round off
          if ((label.includes('Discount') || label.includes('Round Off')) && value === 0) return;
          
          worksheet.getCell(`E${currentRow}`).value = label;
          worksheet.getCell(`F${currentRow}`).value = value;
          
          if (label === 'GRAND TOTAL:') {
            worksheet.getCell(`E${currentRow}`).style = { 
              ...styles.summaryLabel, 
              ...styles.grandTotal,
              alignment: { horizontal: 'right', vertical: 'middle' }
            };
            worksheet.getCell(`F${currentRow}`).style = styles.grandTotal;
            worksheet.getRow(currentRow).height = 18;
          } else {
            worksheet.getCell(`E${currentRow}`).style = styles.summaryLabel;
            worksheet.getCell(`F${currentRow}`).style = styles.summaryValue;
          }
          
          currentRow++;
        });

        currentRow += 2;
      }

      // 📝 Enhanced Sections (Scope, Materials, Terms)
      const sections = [
        { title: 'SCOPE OF WORK', data: scope, color: colors.success },
        { title: 'MATERIALS', data: materials, color: colors.warning },
        { title: 'TERMS & CONDITIONS', data: terms, color: colors.secondary }
      ];

      sections.forEach(section => {
        const hasData = section.data && section.data.some(item => item && item.trim());
        
        if (hasData) {
          // Section Header
          worksheet.getCell(`A${currentRow}`).value = section.title;
          worksheet.getCell(`A${currentRow}`).style = {
            ...styles.sectionHeader,
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: section.color } }
          };
          worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
          worksheet.getRow(currentRow).height = 18;
          currentRow++;

          // Section Items
          section.data.forEach((item, index) => {
            if (item && item.trim()) {
              worksheet.getCell(`A${currentRow}`).value = `${index + 1}.`;
              worksheet.getCell(`A${currentRow}`).style = {
                font: { bold: true, size: 10 },
                alignment: { horizontal: 'center', vertical: 'top' },
                border: styles.tableData.border
              };
              
              worksheet.getCell(`B${currentRow}`).value = item;
              worksheet.getCell(`B${currentRow}`).style = {
                font: { size: 10 },
                alignment: { wrapText: true, vertical: 'top' },
                border: styles.tableData.border
              };
              worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
              
              // Auto-adjust row height based on content
              const estimatedHeight = Math.max(15, Math.ceil(item.length / 100) * 12);
              worksheet.getRow(currentRow).height = estimatedHeight;
              
              currentRow++;
            }
          });
          currentRow++;
        }
      });

      // 🛡️ Enhanced Warranty Section
      worksheet.getCell(`A${currentRow}`).value = 'WARRANTY INFORMATION';
      worksheet.getCell(`A${currentRow}`).style = {
        ...styles.sectionHeader,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
      };
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = `${quotation.warranty || 17} YEARS COMPREHENSIVE WARRANTY`;
      worksheet.getCell(`A${currentRow}`).style = { 
        font: { bold: true, size: 14, color: { argb: 'FF7C3AED' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      };
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      if (quotation.warranty_note) {
        worksheet.getCell(`A${currentRow}`).value = quotation.warranty_note;
        worksheet.getCell(`A${currentRow}`).style = {
          font: { size: 10, italic: true },
          alignment: { wrapText: true, horizontal: 'center' }
        };
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        currentRow++;
      }

      currentRow += 2;

      // 📞 Enhanced Footer
      const footerInfo = [
        'Thank you for choosing International Pipes Technology Co LLC',
        'Contact: +968 96030210 | Email: eurotechoman.iptc@gmail.com',
        'Website: www.eurotechoman.com | Salalah, Sultanate of Oman'
      ];

      footerInfo.forEach((info, index) => {
        worksheet.getCell(`A${currentRow}`).value = info;
        worksheet.getCell(`A${currentRow}`).style = {
          font: { 
            size: index === 0 ? 11 : 9, 
            bold: index === 0,
            italic: index > 0,
            color: { argb: colors.text }
          },
          alignment: { horizontal: 'center', vertical: 'middle' }
        };
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        currentRow++;
      });

      // 📏 Enhanced Column Widths
      const columnWidths = [
        { column: 'A', width: 6 },   // SL
        { column: 'B', width: 45 },  // Description
        { column: 'C', width: 10 },  // Qty
        { column: 'D', width: 8 },   // Unit
        { column: 'E', width: 15 },  // Rate
        { column: 'F', width: 15 },  // Amount
        { column: 'G', width: 5 }    // Extra space
      ];

      columnWidths.forEach(({ column, width }) => {
        worksheet.getColumn(column).width = width;
      });

      // 🎨 Add Professional Borders and Formatting
      const usedRange = worksheet.getCell('A1').address + ':' + worksheet.getCell(`G${currentRow - 1}`).address;
      
      // Add print settings
      worksheet.pageSetup.printTitlesRow = '1:5';
      worksheet.pageSetup.printArea = usedRange;
      worksheet.pageSetup.blackAndWhite = false;
      worksheet.pageSetup.showGridLines = false;

      // Add header and footer for print
      worksheet.headerFooter.oddHeader = '&C&16&B&K000080International Pipes Technology Co LLC';
      worksheet.headerFooter.oddFooter = '&L&9Generated: &D &T&C&9Page &P of &N&R&9QuotePro System';

      console.log('✅ Advanced Excel generated successfully');
      return await workbook.xlsx.writeBuffer();
      
    } catch (error) {
      console.error('❌ Advanced Excel generation failed:', error);
      throw error;
    }
  }

  // 🔥 High-Quality Image Generation with Enhanced Options
  static async generateImage(htmlContent, exportSettings = {}) {
    let browser = null;
    
    try {
      console.log('🚀 Starting high-quality image generation...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--force-color-profile=srgb',
          '--disable-features=TranslateUI'
        ]
      });
      
      const page = await browser.newPage();
      
      // High resolution viewport with enhanced scaling
      const scaleFactor = exportSettings.highDPI ? 3 : 2;
      const baseWidth = exportSettings.imageWidth || 1200;
      const baseHeight = exportSettings.imageHeight || 1600;
      
      await page.setViewport({
        width: baseWidth,
        height: baseHeight,
        deviceScaleFactor: scaleFactor
      });
      
      // Enhanced content loading
      await page.setContent(htmlContent, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 45000 
      });

      // Wait for all resources to load
      await page.evaluateHandle('document.fonts.ready');
      await page.waitForTimeout(2000); // Additional wait for complete rendering

      // Enhanced screenshot options
      const screenshotOptions = {
        fullPage: true,
        type: exportSettings.imageFormat || 'png',
        omitBackground: exportSettings.transparentBackground || false,
        captureBeyondViewport: true,
        clip: null
      };

      if (exportSettings.imageFormat === 'jpeg' || exportSettings.imageFormat === 'jpg') {
        screenshotOptions.quality = exportSettings.imageQuality || 95;
      }

      let imageBuffer = await page.screenshot(screenshotOptions);

      // 🎨 Post-process with Sharp for Professional Quality
      if (exportSettings.optimizeImage !== false) {
        let sharpProcessor = sharp(imageBuffer);

        // Enhanced image processing options
        const sharpOptions = {
          fit: 'inside',
          withoutEnlargement: true,
          background: exportSettings.transparentBackground ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 }
        };

        // Resize if dimensions specified
        if (exportSettings.maxWidth || exportSettings.maxHeight) {
          sharpProcessor = sharpProcessor.resize(
            exportSettings.maxWidth, 
            exportSettings.maxHeight, 
            sharpOptions
          );
        }

        // Format-specific optimizations
        if (exportSettings.imageFormat === 'jpeg' || exportSettings.imageFormat === 'jpg') {
          sharpProcessor = sharpProcessor.jpeg({ 
            quality: exportSettings.imageQuality || 95,
            progressive: true,
            mozjpeg: true,
            chromaSubsampling: '4:4:4'
          });
        } else if (exportSettings.imageFormat === 'png') {
          sharpProcessor = sharpProcessor.png({ 
            quality: exportSettings.imageQuality || 95,
            compressionLevel: 6,
            adaptiveFiltering: true,
            force: true
          });
        } else if (exportSettings.imageFormat === 'webp') {
          sharpProcessor = sharpProcessor.webp({ 
            quality: exportSettings.imageQuality || 95,
            lossless: false,
            effort: 6
          });
        }

        // Apply enhancement filters
        if (exportSettings.enhanceImage) {
          sharpProcessor = sharpProcessor
            .sharpen({ sigma: 0.5, flat: 1, jagged: 2 })
            .normalise();
        }

        imageBuffer = await sharpProcessor.toBuffer();
      }

      console.log('✅ High-quality image generated successfully');
      return imageBuffer;
      
    } catch (error) {
      console.error('❌ High-quality image generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 🔥 Enhanced WhatsApp Caption Generation with Multiple Templates
  static generateWhatsAppCaption(quotation, exportSettings = {}) {
    const template = exportSettings.whatsappTemplate || 'professional';
    
    const templates = {
      professional: `📋 *QUOTATION DETAILS*
      
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
🌐 www.eurotechoman.com

*Validity: 30 days from issue date*`,

      friendly: `Hello ${quotation.client_name}! 👋

Your quotation is ready! 📋✨

💰 *Total:* OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📅 *Valid until:* ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB')}
🔢 *Quote #${quotation.quotation_no}*

Questions? Just reply to this message! 😊

Best regards,
*International Pipes Technology Co LLC* 💧
📞 +968 96030210`,

      brief: `📄 *Quotation ${quotation.quotation_no}*
💰 OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📞 ${quotation.client_phone || 'Contact us'}

*International Pipes Technology Co LLC*`,

      detailed: `🏗️ *WATERPROOFING QUOTATION*

*CLIENT INFORMATION:*
👤 Name: ${quotation.client_name}
📞 Phone: ${quotation.client_phone || 'N/A'}
📍 Project: ${quotation.project_location || 'N/A'}

*QUOTATION DETAILS:*
🔢 Reference: ${quotation.quotation_no}
📅 Date: ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
💰 Amount: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
🛡️ Warranty: ${quotation.warranty || 17} Years

*ABOUT US:*
🏢 International Pipes Technology Co LLC
🎯 Specialized in Professional Waterproofing
⭐ ${quotation.warranty || 17} Years Comprehensive Warranty
🌟 Quality Assured Services

📞 *Contact:* +968 96030210
📧 *Email:* eurotechoman.iptc@gmail.com
🌐 *Website:* www.eurotechoman.com

*Thank you for choosing us!* 🙏`
    };

    return templates[template] || templates.professional;
  }

  // 🔥 Enhanced Email Template Generation
  static generateEmailTemplate(quotation, exportSettings = {}) {
    const template = exportSettings.emailTemplate || 'professional';
    
    const templates = {
      professional: {
        subject: `Quotation ${quotation.quotation_no} - ${quotation.client_name} - International Pipes Technology`,
        body: `Dear ${quotation.client_name},

I hope this email finds you well.

Please find attached your comprehensive quotation for professional waterproofing services as discussed. Our quotation includes detailed breakdown of materials, labor, and all associated costs for your project.

**QUOTATION SUMMARY:**
• Quotation Number: ${quotation.quotation_no}
• Issue Date: ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
• Project Location: ${quotation.project_location || 'As discussed'}
• Total Amount: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
• Warranty Period: ${quotation.warranty || 17} Years
• Validity: 30 days from issue date

**WHY CHOOSE US:**
✓ ${quotation.warranty || 17} Years Comprehensive Warranty
✓ Professional Installation Team
✓ High-Quality Materials
✓ Proven Track Record
✓ Competitive Pricing

Should you have any questions or require clarification on any aspect of this quotation, please do not hesitate to contact me directly.

We look forward to the opportunity to serve you and provide our quality waterproofing services for your project.

Best regards,

**International Pipes Technology Co LLC**
Your Waterproofing Specialist

📞 Phone: +968 96030210
📧 Email: eurotechoman.iptc@gmail.com
🌐 Website: www.eurotechoman.com
📍 Location: Salalah, Sultanate of Oman
🏢 VAT NO: OM1100077623 | CR NO: 2231867`
      },

      friendly: {
        subject: `Your Quotation is Ready! 🎉 - ${quotation.quotation_no}`,
        body: `Hi ${quotation.client_name}! 😊

Great news! Your waterproofing quotation is ready and attached to this email.

**Quick Summary:**
💰 Total: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📅 Valid until: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB')}
🔢 Reference: ${quotation.quotation_no}
🛡️ Warranty: ${quotation.warranty || 17} years!

We've included everything you need - detailed breakdown, materials list, and our comprehensive warranty terms.

Any questions? Just hit reply - I'm here to help! 😊

Thanks for considering us for your waterproofing needs!

Cheers,
**International Pipes Technology Co LLC** 💧
📞 +968 96030210`
      },

      formal: {
        subject: `Official Quotation Reference: ${quotation.quotation_no} - International Pipes Technology Co LLC`,
        body: `Dear ${quotation.client_name},

**Re: Quotation for Professional Waterproofing Services**

Further to our recent discussions regarding waterproofing requirements for your project, we are pleased to submit our official quotation for the above-mentioned services.

The attached quotation provides comprehensive details of our proposed waterproofing solution, including technical specifications, material specifications, pricing structure, and terms of engagement.

**KEY DETAILS:**
- Quotation Reference: ${quotation.quotation_no}
- Issue Date: ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
- Project Location: ${quotation.project_location || 'As specified'}
- Total Contract Value: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
- Warranty Period: ${quotation.warranty || 17} Years Comprehensive
- Validity Period: 30 days from issue date

**OUR COMMITMENT:**
Our quotation reflects our commitment to providing high-quality waterproofing solutions using premium materials and skilled workmanship. All work will be executed in accordance with international standards and best practices.

We trust that our proposal meets your requirements and technical specifications. We look forward to your favorable consideration and the opportunity to execute this project to your complete satisfaction.

Should you require any additional information, clarification, or wish to discuss any aspect of our proposal, please do not hesitate to contact the undersigned.

Yours faithfully,

**INTERNATIONAL PIPES TECHNOLOGY CO LLC**
Authorized Representative

Corporate Information:
- Company Registration: CR NO: 2231867
- VAT Registration: OM1100077623
- Business Phone: +968 96030210
- Corporate Email: eurotechoman.iptc@gmail.com
- Website: www.eurotechoman.com
- Registered Address: Salalah, Sultanate of Oman`
      }
    };

    return templates[template] || templates.professional;
  }

  // 🔥 Advanced Validation with Comprehensive Feedback
  static validateExportSettings(settings = {}) {
    const errors = [];
    const warnings = [];
    
    // Validate required fields
    if (settings.customHeader && settings.customHeader.length > 100) {
      errors.push('Custom header must be less than 100 characters');
    }

    // Validate font sizes
    const fontSizes = {
      headerFontSize: { min: 16, max: 48, default: 28 },
      subheaderFontSize: { min: 12, max: 32, default: 18 },
      bodyFontSize: { min: 10, max: 24, default: 14 },
      tableFontSize: { min: 8, max: 20, default: 12 },
      smallFontSize: { min: 8, max: 16, default: 11 }
    };

    Object.entries(fontSizes).forEach(([font, config]) => {
      const size = parseInt(settings[font]);
      if (size && (size < config.min || size > config.max)) {
        warnings.push(`${font} (${size}px) should be between ${config.min}px and ${config.max}px`);
      }
    });

    // Validate QR code size
    const qrSize = parseInt(settings.qrSize);
    if (qrSize && (qrSize < 50 || qrSize > 300)) {
      warnings.push(`QR code size (${qrSize}px) may affect scannability (recommended: 80-200px)`);
    }

    // Validate image settings
    if (settings.imageQuality) {
      const quality = parseInt(settings.imageQuality);
      if (quality < 50 || quality > 100) {
        errors.push('Image quality must be between 50 and 100');
      }
      if (quality < 70) {
        warnings.push('Image quality below 70% may result in poor print quality');
      }
    }

    // Validate image dimensions
    if (settings.imageWidth) {
      const width = parseInt(settings.imageWidth);
      if (width < 800 || width > 4000) {
        warnings.push('Image width should be between 800px and 4000px for optimal quality');
      }
    }

    // Validate paper size compatibility
    if (settings.paperSize === 'A3' && settings.exportFormat === 'whatsapp') {
      warnings.push('A3 paper size may be too large for WhatsApp sharing');
    }

    // Validate margins
    const margins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    margins.forEach(margin => {
      if (settings[margin]) {
        const value = parseInt(settings[margin]);
        if (value < 5 || value > 50) {
          warnings.push(`${margin} should be between 5mm and 50mm`);
        }
      }
    });

    // Enhanced default settings
    const defaultSettings = {
      customHeader: settings.customHeader || 'QUOTATION FOR WATERPROOFING',
      headerFontSize: this.validateRange(settings.headerFontSize, 16, 48, 28) + 'px',
      subheaderFontSize: this.validateRange(settings.subheaderFontSize, 12, 32, 18) + 'px',
      bodyFontSize: this.validateRange(settings.bodyFontSize, 10, 24, 14) + 'px',
      tableFontSize: this.validateRange(settings.tableFontSize, 8, 20, 12) + 'px',
      smallFontSize: this.validateRange(settings.smallFontSize, 8, 16, 11) + 'px',
      qrSize: this.validateRange(settings.qrSize, 50, 300, 120) + 'px',
      paperSize: settings.paperSize || 'A4',
      orientation: settings.orientation || 'portrait',
      marginTop: settings.marginTop || '20mm',
      marginRight: settings.marginRight || '15mm',
      marginBottom: settings.marginBottom || '25mm',
      marginLeft: settings.marginLeft || '15mm',
      includeSignature: !!settings.includeSignature,
      includeStamp: !!settings.includeStamp,
      includeHeaderFooter: !!settings.includeHeaderFooter,
      stampPosition: settings.stampPosition || 'auto',
      stampSize: settings.stampSize || '120px',
      letterhead: settings.letterhead || 'plain',
      watermark: settings.watermark || null,
      imageFormat: settings.imageFormat || 'png',
      imageQuality: this.validateRange(settings.imageQuality, 50, 100, 90),
      imageWidth: this.validateRange(settings.imageWidth, 800, 4000, 1200),
      imageHeight: this.validateRange(settings.imageHeight, 1000, 5000, 1600),
      optimizeImage: settings.optimizeImage !== false,
      enhanceImage: !!settings.enhanceImage,
      highDPI: !!settings.highDPI,
      transparentBackground: !!settings.transparentBackground,
      enableEditing: !!settings.enableEditing,
      includeLogo: !!settings.includeLogo,
      whatsappTemplate: settings.whatsappTemplate || 'professional',
      emailTemplate: settings.emailTemplate || 'professional',
      exportFormat: settings.exportFormat || 'pdf',
      exportMethod: settings.exportMethod || 'download',
      customFileName: settings.customFileName || null,
      multiPage: !!settings.multiPage,
      pageBreaks: !!settings.pageBreaks
    };

    return { 
      settings: defaultSettings, 
      errors, 
      warnings,
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0
    };
  }

  // 🔥 Helper function to validate ranges
  static validateRange(value, min, max, defaultValue) {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return defaultValue;
    }
    return numValue;
  }

  // 🔥 Enhanced Template Management System
  static async saveAdvancedExportTemplate(templateData, userId) {
    try {
      const template = {
        id: crypto.randomUUID(),
        name: templateData.name,
        description: templateData.description || '',
        settings: templateData.settings,
        userId: userId,
        isPublic: !!templateData.isPublic,
        tags: templateData.tags || [],
        category: templateData.category || 'custom',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0,
        version: '2.0'
      };

      // Ensure templates directory exists
      const templatesDir = path.join(__dirname, '../data/export-templates');
      await fs.mkdir(templatesDir, { recursive: true });
      
      const templateFile = path.join(templatesDir, `${template.id}.json`);
      await fs.writeFile(templateFile, JSON.stringify(template, null, 2));

      console.log('✅ Advanced export template saved:', template.name);
      return template;
      
    } catch (error) {
      console.error('❌ Failed to save advanced export template:', error);
      throw error;
    }
  }

  // 🔥 Load Templates with Enhanced Features
  static async loadExportTemplates(userId) {
    try {
      const templatesDir = path.join(__dirname, '../data/export-templates');
      
      try {
        const files = await fs.readdir(templatesDir);
        const templates = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
              const template = JSON.parse(content);
              
              // Include user's own templates and public templates
              if (template.userId === userId || template.isPublic) {
                templates.push(template);
              }
            } catch (parseError) {
              console.error(`Failed to parse template file ${file}:`, parseError);
              // Continue with other templates
            }
          }
        }
        
        // Sort by usage count and last updated
        return templates.sort((a, b) => {
          if (a.usageCount !== b.usageCount) {
            return b.usageCount - a.usageCount;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
      } catch (err) {
        // Directory doesn't exist yet, return default templates
        return this.getDefaultTemplates();
      }
      
    } catch (error) {
      console.error('❌ Failed to load export templates:', error);
      return this.getDefaultTemplates();
    }
  }

  // 🔥 Default Professional Templates
  static getDefaultTemplates() {
    return [
      {
        id: 'default-professional',
        name: 'Professional Standard',
        description: 'Standard professional quotation format',
        settings: {
          headerFontSize: '28px',
          bodyFontSize: '14px',
          tableFontSize: '12px',
          paperSize: 'A4',
          includeHeaderFooter: true,
          whatsappTemplate: 'professional',
          emailTemplate: 'professional'
        },
        category: 'default',
        isPublic: true,
        usageCount: 0
      },
      {
        id: 'default-modern',
        name: 'Modern Minimal',
        description: 'Clean, modern design with minimal styling',
        settings: {
          headerFontSize: '32px',
          bodyFontSize: '16px',
          tableFontSize: '14px',
          paperSize: 'A4',
          letterhead: 'plain',
          whatsappTemplate: 'friendly',
          emailTemplate: 'friendly'
        },
        category: 'default',
        isPublic: true,
        usageCount: 0
      },
      {
        id: 'default-detailed',
        name: 'Detailed Corporate',
        description: 'Comprehensive format with all details',
        settings: {
          headerFontSize: '24px',
          bodyFontSize: '12px',
          tableFontSize: '10px',
          paperSize: 'A4',
          includeSignature: true,
          includeHeaderFooter: true,
          whatsappTemplate: 'detailed',
          emailTemplate: 'formal'
        },
        category: 'default',
        isPublic: true,
        usageCount: 0
      }
    ];
  }

  // 🔥 Enhanced File Naming with Multiple Options
  static generateFileName(quotation, format, options = {}) {
    const {
      customName,
      includeDate = true,
      includeClient = true,
      includeTotal = false,
      includeProject = false,
      dateFormat = 'YYYY-MM-DD',
      separator = '-',
      maxLength = 100
    } = options;

    if (customName) {
      return `${customName}.${format}`;
    }
    
    const parts = [];
    
    // Company prefix
    parts.push('IPT');
    
    // Quotation number (always included)
    const sanitizedQuoteNo = quotation.quotation_no.replace(/[^a-zA-Z0-9]/g, separator);
    parts.push(sanitizedQuoteNo);
    
    // Client name
    if (includeClient) {
      const sanitizedClientName = quotation.client_name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, separator)
        .substring(0, 25);
      parts.push(sanitizedClientName);
    }
    
    // Project location
    if (includeProject && quotation.project_location) {
      const sanitizedProject = quotation.project_location
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, separator)
        .substring(0, 20);
      parts.push(sanitizedProject);
    }
    
    // Date
    if (includeDate) {
      const date = new Date(quotation.tdate);
      let dateStr;
      
      switch (dateFormat) {
        case 'DD-MM-YYYY':
          dateStr = date.toLocaleDateString('en-GB').replace(/\//g, separator);
          break;
        case 'MM-DD-YYYY':
          dateStr = date.toLocaleDateString('en-US').replace(/\//g, separator);
          break;
        case 'YYYYMMDD':
          dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
          break;
        case 'YYYY-MM':
          dateStr = date.toISOString().slice(0, 7);
          break;
        default: // 'YYYY-MM-DD'
          dateStr = date.toISOString().slice(0, 10);
      }
      parts.push(dateStr);
    }
    
    // Total amount
    if (includeTotal) {
      const total = `OMR${parseFloat(quotation.grand_total).toFixed(0)}`;
      parts.push(total);
    }
    
    // Join parts and ensure max length
    let fileName = parts.join(separator);
    if (fileName.length > maxLength) {
      fileName = fileName.substring(0, maxLength - format.length - 1);
    }
    
    return `${fileName}.${format}`;
  }

  // 🔥 Get MIME Type with Enhanced Support
  static getMimeType(format) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'zip': 'application/zip',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'html': 'text/html'
    };
    
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  // 🔥 Progress Tracking System
  static createProgressTracker(socketId = null) {
    return {
      total: 100,
      current: 0,
      stage: 'Initializing...',
      startTime: Date.now(),
      socketId: socketId,
      
      update(progress, stage) {
        this.current = Math.min(100, Math.max(0, progress));
        this.stage = stage || this.stage;
        
        const elapsed = Date.now() - this.startTime;
        const eta = this.current > 0 ? (elapsed / this.current) * (100 - this.current) : 0;
        
        console.log(`📊 Progress: ${this.current}% - ${this.stage} (ETA: ${Math.round(eta/1000)}s)`);
        
        // Emit progress to websocket if available
        if (this.socketId && global.io) {
          global.io.to(this.socketId).emit('exportProgress', {
            progress: this.current,
            stage: this.stage,
            eta: Math.round(eta/1000)
          });
        }
      },
      
      complete() {
        this.current = 100;
        this.stage = 'Export completed successfully!';
        const totalTime = Date.now() - this.startTime;
        console.log(`✅ Export operation completed in ${Math.round(totalTime/1000)} seconds`);
        
        if (this.socketId && global.io) {
          global.io.to(this.socketId).emit('exportComplete', {
            progress: 100,
            stage: this.stage,
            totalTime: Math.round(totalTime/1000)
          });
        }
      },
      
      error(message) {
        this.stage = `Error: ${message}`;
        const totalTime = Date.now() - this.startTime;
        console.error(`❌ Export operation failed after ${Math.round(totalTime/1000)} seconds: ${message}`);
        
        if (this.socketId && global.io) {
          global.io.to(this.socketId).emit('exportError', {
            stage: this.stage,
            error: message,
            totalTime: Math.round(totalTime/1000)
          });
        }
      }
    };
  }

  // 🔥 Enhanced Error Handling
  static handleError(error, context = 'Export operation') {
    const errorTypes = {
      'Navigation timeout': {
        message: 'Export generation timeout - please try reducing content or check your internet connection',
        suggestion: 'Try exporting with fewer items or simpler formatting'
      },
      'Protocol error': {
        message: 'Browser process error - please retry the export operation',
        suggestion: 'Try refreshing the page and attempting the export again'
      },
      'Target closed': {
        message: 'Export process was interrupted - please retry',
        suggestion: 'Ensure stable internet connection and try again'
      },
      'ENOENT': {
        message: 'Required file or resource not found',
        suggestion: 'Please contact support if this issue persists'
      },
      'EMFILE': {
        message: 'Too many files open - server is busy',
        suggestion: 'Please wait a moment and try again'
      }
    };

    const errorKey = Object.keys(errorTypes).find(key => error.message.includes(key));
    const errorInfo = errorTypes[errorKey] || {
      message: 'An unexpected error occurred during export',
      suggestion: 'Please try again or contact support if the issue persists'
    };

    return {
      context: context,
      originalError: error.message,
      userMessage: errorInfo.message,
      suggestion: errorInfo.suggestion,
      timestamp: new Date().toISOString(),
      severity: this.getErrorSeverity(error)
    };
  }

  // 🔥 Determine Error Severity
  static getErrorSeverity(error) {
    const highSeverityKeywords = ['ENOENT', 'EMFILE', 'Protocol error'];
    const mediumSeverityKeywords = ['timeout', 'Target closed'];
    
    const message = error.message.toLowerCase();
    
    if (highSeverityKeywords.some(keyword => message.includes(keyword.toLowerCase()))) {
      return 'high';
    } else if (mediumSeverityKeywords.some(keyword => message.includes(keyword.toLowerCase()))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // 🔥 Export Analytics Helper
  static generateExportAnalytics(exports = []) {
    const analytics = {
      totalExports: exports.length,
      formatBreakdown: {},
      successRate: 0,
      averageFileSize: 0,
      popularSettings: {},
      timeAnalysis: {
        daily: {},
        weekly: {},
        monthly: {}
      }
    };

    if (exports.length === 0) return analytics;

    // Format breakdown
    exports.forEach(exp => {
      analytics.formatBreakdown[exp.format] = (analytics.formatBreakdown[exp.format] || 0) + 1;
    });

    // Success rate
    const successfulExports = exports.filter(exp => exp.success).length;
    analytics.successRate = (successfulExports / exports.length) * 100;

    // Average file size
    const totalSize = exports.reduce((sum, exp) => sum + (exp.fileSize || 0), 0);
    analytics.averageFileSize = totalSize / exports.length;

    // Time analysis
    exports.forEach(exp => {
      const date = new Date(exp.timestamp);
      const day = date.toISOString().split('T')[0];
      const week = this.getWeekNumber(date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      analytics.timeAnalysis.daily[day] = (analytics.timeAnalysis.daily[day] || 0) + 1;
      analytics.timeAnalysis.weekly[week] = (analytics.timeAnalysis.weekly[week] || 0) + 1;
      analytics.timeAnalysis.monthly[month] = (analytics.timeAnalysis.monthly[month] || 0) + 1;
    });

    return analytics;
  }

  // 🔥 Get Week Number Helper
  static getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // 🔥 Memory Management Helper
  static async cleanupTempFiles(directory = './temp') {
    try {
      const tempDir = path.join(__dirname, '../temp');
      const files = await fs.readdir(tempDir);
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️ Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  // 🔥 Performance Monitoring
  static createPerformanceMonitor() {
    return {
      startTime: process.hrtime.bigint(),
      memoryStart: process.memoryUsage(),
      
      checkpoint(label) {
        const currentTime = process.hrtime.bigint();
        const currentMemory = process.memoryUsage();
        const elapsed = Number(currentTime - this.startTime) / 1000000; // Convert to milliseconds
        
        console.log(`⏱️ ${label}: ${elapsed.toFixed(2)}ms, Memory: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);
        
        return {
          elapsed: elapsed,
          memoryUsed: currentMemory.heapUsed,
          memoryDelta: currentMemory.heapUsed - this.memoryStart.heapUsed
        };
      },
      
      finish() {
        const finalTime = process.hrtime.bigint();
        const finalMemory = process.memoryUsage();
        const totalElapsed = Number(finalTime - this.startTime) / 1000000;
        
        console.log(`🏁 Total export time: ${totalElapsed.toFixed(2)}ms`);
        console.log(`📊 Memory usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
        
        return {
          totalTime: totalElapsed,
          peakMemory: finalMemory.heapUsed,
          memoryEfficiency: this.memoryStart.heapUsed / finalMemory.heapUsed
        };
      }
    };
  }

  // 🔥 Utility method to initialize export system
  static async initializeExportSystem() {
    try {
      // Create necessary directories
      const directories = [
        path.join(__dirname, '../data'),
        path.join(__dirname, '../data/export-templates'),
        path.join(__dirname, '../temp'),
        path.join(__dirname, '../public/exports')
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      // Cleanup old temp files
      await this.cleanupTempFiles();

      console.log('✅ Export system initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize export system:', error);
      return false;
    }
  }
}

// Initialize export system on module load
ExportUtilsEnhanced.initializeExportSystem().catch(console.error);

module.exports = ExportUtilsEnhanced;