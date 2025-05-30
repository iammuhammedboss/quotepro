// utils/exportUtilsEnhanced.js - Advanced Export Features
const ExportUtils = require('./exportUtils'); // Import your existing class
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ExportUtilsEnhanced extends ExportUtils {
  
  // 🔥 Enhanced QR Code with custom options
  static async generateAdvancedQRCode(quotationId, baseUrl, options = {}) {
    try {
      const quotationUrl = `${baseUrl}/quotations/view/${quotationId}`;
      
      const qrOptions = {
        errorCorrectionLevel: options.errorLevel || 'M',
        type: 'image/png',
        quality: options.quality || 0.92,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        width: parseInt(options.size) || 200,
        scale: options.scale || 8
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(quotationUrl, qrOptions);
      
      console.log('✅ Advanced QR Code generated successfully');
      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ Advanced QR Code generation failed:', error);
      throw error;
    }
  }

  // 🔥 Multi-page PDF generation with page breaks
  static async generateMultiPagePDF(htmlContent, exportSettings = {}) {
    let browser = null;
    
    try {
      console.log('🚀 Starting multi-page PDF generation...');
      
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
          '--disable-web-security'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set content with advanced options
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Enhanced PDF options
      const pdfOptions = {
        format: exportSettings.paperSize || 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: exportSettings.includeHeaderFooter || false,
        headerTemplate: exportSettings.headerTemplate || '',
        footerTemplate: exportSettings.footerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
        margin: {
          top: exportSettings.marginTop || '20mm',
          right: exportSettings.marginRight || '15mm',
          bottom: exportSettings.marginBottom || '20mm',
          left: exportSettings.marginLeft || '15mm'
        }
      };

      // Add watermark if specified
      if (exportSettings.watermark) {
        await page.addStyleTag({
          content: `
            body::before {
              content: "${exportSettings.watermark}";
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 72px;
              color: rgba(200, 200, 200, 0.3);
              z-index: -1;
              pointer-events: none;
              font-weight: bold;
            }
          `
        });
      }

      // Add custom CSS for better page breaks
      await page.addStyleTag({
        content: `
          @page { 
            size: ${exportSettings.paperSize || 'A4'}; 
            margin: ${pdfOptions.margin.top} ${pdfOptions.margin.right} ${pdfOptions.margin.bottom} ${pdfOptions.margin.left};
          }
          .page-break { 
            page-break-before: always; 
          }
          .page-break-avoid { 
            page-break-inside: avoid; 
          }
          .items-table { 
            page-break-inside: auto; 
          }
          .items-table tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          .section { 
            page-break-inside: avoid; 
          }
          .signature-section {
            page-break-before: auto;
            page-break-inside: avoid;
          }
        `
      });

      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ Multi-page PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Multi-page PDF generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 🔥 Enhanced Excel with advanced formatting
  static async generateAdvancedExcel(quotation, items, scope, materials, terms, exportSettings = {}) {
    try {
      console.log('🚀 Starting advanced Excel generation...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'QuotePro - International Pipes Technology Co LLC';
      workbook.created = new Date();
      workbook.company = 'International Pipes Technology Co LLC';
      
      const worksheet = workbook.addWorksheet('Quotation', {
        pageSetup: {
          paperSize: exportSettings.paperSize === 'A3' ? 11 : 9, // A3 or A4
          orientation: exportSettings.orientation || 'portrait',
          margins: {
            left: 0.75, right: 0.75,
            top: 1.0, bottom: 1.0,
            header: 0.3, footer: 0.3
          },
          printArea: 'A1:F100',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      // 🎨 Enhanced Styles
      const headerStyle = {
        font: { 
          bold: true, 
          size: parseInt(exportSettings.headerFontSize) || 16, 
          color: { argb: 'FFC91F1F' },
          name: 'Arial'
        },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
        border: {
          top: { style: 'thin', color: { argb: 'FFC91F1F' } },
          left: { style: 'thin', color: { argb: 'FFC91F1F' } },
          bottom: { style: 'thin', color: { argb: 'FFC91F1F' } },
          right: { style: 'thin', color: { argb: 'FFC91F1F' } }
        }
      };

      const subHeaderStyle = {
        font: { 
          bold: true, 
          size: parseInt(exportSettings.subheaderFontSize) || 12, 
          color: { argb: 'FF666666' },
          name: 'Arial'
        },
        alignment: { horizontal: 'left', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
      };

      const tableHeaderStyle = {
        font: { 
          bold: true, 
          size: parseInt(exportSettings.tableFontSize) || 11, 
          color: { argb: 'FFFFFFFF' },
          name: 'Arial'
        },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      const tableDataStyle = {
        font: { 
          size: parseInt(exportSettings.bodyFontSize) || 10,
          name: 'Arial'
        },
        alignment: { vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      let currentRow = 1;
      
      // Enhanced header with custom text
      const headerText = exportSettings.customHeader || 'QUOTATION FOR WATERPROOFING';
      worksheet.getCell(`A${currentRow}`).value = headerText;
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow += 2;

      // Company details with enhanced formatting
      worksheet.getCell(`A${currentRow}`).value = 'International Pipes Technology Co LLC';
      worksheet.getCell(`A${currentRow}`).style = { 
        font: { bold: true, size: 14, color: { argb: 'FF333333' } },
        alignment: { horizontal: 'center' }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = 'VAT NO: OM1100077623 | CR NO: 2231867';
      worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow += 2;

      // Quotation info with better layout
      const quotationInfoStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      worksheet.getCell(`A${currentRow}`).value = 'Quotation No:';
      worksheet.getCell(`A${currentRow}`).style = quotationInfoStyle;
      worksheet.getCell(`B${currentRow}`).value = quotation.quotation_no;
      worksheet.getCell(`B${currentRow}`).style = { ...quotationInfoStyle, font: { bold: false, size: 12 } };
      
      worksheet.getCell(`D${currentRow}`).value = 'Date:';
      worksheet.getCell(`D${currentRow}`).style = quotationInfoStyle;
      worksheet.getCell(`E${currentRow}`).value = new Date(quotation.tdate).toLocaleDateString('en-GB');
      worksheet.getCell(`E${currentRow}`).style = { ...quotationInfoStyle, font: { bold: false, size: 12 } };
      currentRow += 2;

      // Enhanced client information section
      worksheet.getCell(`A${currentRow}`).value = 'CLIENT INFORMATION';
      worksheet.getCell(`A${currentRow}`).style = {
        ...subHeaderStyle,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      const clientInfoStyle = {
        font: { size: 11 },
        border: {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      // Client details in a structured format
      worksheet.getCell(`A${currentRow}`).value = 'Client Name:';
      worksheet.getCell(`A${currentRow}`).style = { ...clientInfoStyle, font: { bold: true, size: 11 } };
      worksheet.getCell(`B${currentRow}`).value = quotation.client_name;
      worksheet.getCell(`B${currentRow}`).style = clientInfoStyle;
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      
      worksheet.getCell(`D${currentRow}`).value = 'Phone:';
      worksheet.getCell(`D${currentRow}`).style = { ...clientInfoStyle, font: { bold: true, size: 11 } };
      worksheet.getCell(`E${currentRow}`).value = quotation.client_phone;
      worksheet.getCell(`E${currentRow}`).style = clientInfoStyle;
      worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
      currentRow++;

      if (quotation.project_location) {
        worksheet.getCell(`A${currentRow}`).value = 'Project Location:';
        worksheet.getCell(`A${currentRow}`).style = { ...clientInfoStyle, font: { bold: true, size: 11 } };
        worksheet.getCell(`B${currentRow}`).value = quotation.project_location;
        worksheet.getCell(`B${currentRow}`).style = clientInfoStyle;
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        currentRow++;
      }

      currentRow += 2;

      // Enhanced items table with conditional formatting
      if (items && items.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'QUOTATION ITEMS';
        worksheet.getCell(`A${currentRow}`).style = {
          ...subHeaderStyle,
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } }
        };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Enhanced table headers
        const headers = ['SL', 'Description', 'Qty', 'Unit', 'Rate (OMR)', 'Amount (OMR)'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`);
          cell.value = header;
          cell.style = tableHeaderStyle;
        });
        currentRow++;

        // Enhanced table data with alternating row colors
        items.forEach((item, index) => {
          const isEvenRow = index % 2 === 0;
          const rowStyle = {
            ...tableDataStyle,
            fill: { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: isEvenRow ? 'FFFAFAFA' : 'FFFFFFFF' } 
            }
          };

          worksheet.getCell(`A${currentRow}`).value = index + 1;
          worksheet.getCell(`A${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'top' } 
          };
          
          worksheet.getCell(`B${currentRow}`).value = item.description;
          worksheet.getCell(`B${currentRow}`).style = rowStyle;
          
          worksheet.getCell(`C${currentRow}`).value = parseFloat(item.qty);
          worksheet.getCell(`C${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'top' }, 
            numFmt: '0.000' 
          };
          
          worksheet.getCell(`D${currentRow}`).value = item.unit;
          worksheet.getCell(`D${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'center', vertical: 'top' } 
          };
          
          worksheet.getCell(`E${currentRow}`).value = parseFloat(item.rate);
          worksheet.getCell(`E${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'right', vertical: 'top' }, 
            numFmt: '0.000' 
          };
          
          worksheet.getCell(`F${currentRow}`).value = parseFloat(item.amount);
          worksheet.getCell(`F${currentRow}`).style = { 
            ...rowStyle, 
            alignment: { horizontal: 'right', vertical: 'top' }, 
            numFmt: '0.000' 
          };
          
          // Add conditional formatting for high-value items
          if (parseFloat(item.amount) > 1000) {
            worksheet.getCell(`F${currentRow}`).style.font = { 
              ...rowStyle.font, 
              bold: true, 
              color: { argb: 'FF1565C0' } 
            };
          }
          
          currentRow++;
        });

        currentRow++;

        // Enhanced summary section
        const summaryLabelStyle = {
          font: { bold: true, size: 12 },
          alignment: { horizontal: 'right', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          }
        };

        const summaryValueStyle = {
          font: { size: 12, bold: true },
          alignment: { horizontal: 'right', vertical: 'middle' },
          numFmt: '0.000',
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          }
        };

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
          
          if (label === 'Grand Total:') {
            worksheet.getCell(`E${currentRow}`).style = { 
              ...summaryLabelStyle, 
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } }, 
              font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 } 
            };
            worksheet.getCell(`F${currentRow}`).style = { 
              ...summaryValueStyle, 
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC91F1F' } }, 
              font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 } 
            };
          } else {
            worksheet.getCell(`F${currentRow}`).style = summaryValueStyle;
          }
          
          currentRow++;
        });

        currentRow += 2;
      }

      // Enhanced sections with better formatting
      const sections = [
        { title: 'SCOPE OF WORK', data: scope, color: 'FF4CAF50' },
        { title: 'MATERIALS', data: materials, color: 'FFFF9800' },
        { title: 'TERMS & CONDITIONS', data: terms, color: 'FF2196F3' }
      ];

      sections.forEach(section => {
        const hasData = section.data && section.data.some(item => item && item.trim());
        
        if (hasData) {
          worksheet.getCell(`A${currentRow}`).value = section.title;
          worksheet.getCell(`A${currentRow}`).style = {
            ...subHeaderStyle,
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: section.color } },
            font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
          };
          worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
          currentRow++;

          section.data.forEach((item, index) => {
            if (item && item.trim()) {
              worksheet.getCell(`A${currentRow}`).value = `${index + 1}.`;
              worksheet.getCell(`A${currentRow}`).style = {
                font: { bold: true, size: 10 },
                alignment: { horizontal: 'center', vertical: 'top' }
              };
              
              worksheet.getCell(`B${currentRow}`).value = item;
              worksheet.getCell(`B${currentRow}`).style = {
                font: { size: 10 },
                alignment: { wrapText: true, vertical: 'top' }
              };
              worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
              
              // Auto-adjust row height based on content
              const estimatedHeight = Math.max(15, Math.ceil(item.length / 80) * 15);
              worksheet.getRow(currentRow).height = estimatedHeight;
              
              currentRow++;
            }
          });
          currentRow++;
        }
      });

      // Enhanced warranty section
      worksheet.getCell(`A${currentRow}`).value = 'WARRANTY';
      worksheet.getCell(`A${currentRow}`).style = {
        ...subHeaderStyle,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF673AB7' } },
        font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      worksheet.getCell(`A${currentRow}`).value = `${quotation.warranty} YEARS WARRANTY`;
      worksheet.getCell(`A${currentRow}`).style = { 
        font: { bold: true, size: 16, color: { argb: 'FF673AB7' } },
        alignment: { horizontal: 'center' }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow++;

      if (quotation.warranty_note) {
        worksheet.getCell(`A${currentRow}`).value = quotation.warranty_note;
        worksheet.getCell(`A${currentRow}`).style = {
          font: { size: 11, italic: true },
          alignment: { wrapText: true }
        };
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;
      }

      // Enhanced column widths
      worksheet.getColumn('A').width = 8;   // SL
      worksheet.getColumn('B').width = 45;  // Description
      worksheet.getColumn('C').width = 12;  // Qty
      worksheet.getColumn('D').width = 12;  // Unit
      worksheet.getColumn('E').width = 18;  // Rate
      worksheet.getColumn('F').width = 18;  // Amount

      // Add print settings
      worksheet.pageSetup.printTitlesRow = '1:3';
      worksheet.pageSetup.printArea = `A1:F${currentRow}`;

      console.log('✅ Advanced Excel generated successfully');
      return await workbook.xlsx.writeBuffer();
      
    } catch (error) {
      console.error('❌ Advanced Excel generation failed:', error);
      throw error;
    }
  }

  // 🔥 High-quality image generation
  static async generateHighQualityImage(htmlContent, exportSettings = {}) {
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
          '--force-color-profile=srgb'
        ]
      });
      
      const page = await browser.newPage();
      
      // High resolution viewport
      const scaleFactor = exportSettings.highDPI ? 3 : 2;
      const baseWidth = exportSettings.imageWidth || 1200;
      const baseHeight = exportSettings.imageHeight || 1600;
      
      await page.setViewport({
        width: baseWidth,
        height: baseHeight,
        deviceScaleFactor: scaleFactor
      });
      
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      const screenshotOptions = {
        fullPage: true,
        type: exportSettings.imageFormat || 'png',
        omitBackground: exportSettings.transparentBackground || false
      };

      if (exportSettings.imageFormat === 'jpeg' || exportSettings.imageFormat === 'jpg') {
        screenshotOptions.quality = exportSettings.imageQuality || 95;
      }

      let imageBuffer = await page.screenshot(screenshotOptions);

      // Post-process with Sharp for optimization
      if (exportSettings.optimizeImage) {
        const sharpOptions = {
          fit: 'inside',
          withoutEnlargement: true
        };

        if (exportSettings.maxWidth || exportSettings.maxHeight) {
          sharpOptions.width = exportSettings.maxWidth;
          sharpOptions.height = exportSettings.maxHeight;
        }

        let sharpProcessor = sharp(imageBuffer);

        if (exportSettings.imageFormat === 'jpeg' || exportSettings.imageFormat === 'jpg') {
          sharpProcessor = sharpProcessor.jpeg({ 
            quality: exportSettings.imageQuality || 90,
            progressive: true,
            mozjpeg: true
          });
        } else if (exportSettings.imageFormat === 'png') {
          sharpProcessor = sharpProcessor.png({ 
            quality: exportSettings.imageQuality || 90,
            compressionLevel: 6,
            adaptiveFiltering: true
          });
        }

        if (exportSettings.maxWidth || exportSettings.maxHeight) {
          sharpProcessor = sharpProcessor.resize(sharpOptions);
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

  // 🔥 Enhanced WhatsApp caption templates
  static generateAdvancedWhatsAppCaption(quotation, exportSettings = {}) {
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
🌐 www.eurotechoman.com`,

      friendly: `Hello ${quotation.client_name}! 👋

Your quotation is ready! 📋✨

💰 Total: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📅 Valid until: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB')}
🔢 Quote #${quotation.quotation_no}

Questions? Just reply to this message! 😊

Best regards,
International Pipes Technology Co LLC 💧`,

      brief: `📄 Quotation ${quotation.quotation_no}
💰 OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📞 ${quotation.client_phone || 'Contact us'}`
    };

    return templates[template] || templates.professional;
  }

  // 🔥 Enhanced email templates
  static generateEmailTemplate(quotation, exportSettings = {}) {
    const template = exportSettings.emailTemplate || 'professional';
    
    const templates = {
      professional: {
        subject: `Quotation ${quotation.quotation_no} - ${quotation.client_name}`,
        body: `Dear ${quotation.client_name},

I hope this email finds you well.

Please find attached your quotation for the waterproofing services as discussed. The quotation includes detailed breakdown of materials, labor, and all associated costs.

QUOTATION SUMMARY:
• Quotation Number: ${quotation.quotation_no}
• Date: ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
• Project Location: ${quotation.project_location || 'As discussed'}
• Total Amount: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
• Validity: 30 days from issue date

Should you have any questions or require clarification on any aspect of this quotation, please do not hesitate to contact me.

We look forward to the opportunity to serve you and provide our quality services.

Best regards,

International Pipes Technology Co LLC
Email: eurotechoman.iptc@gmail.com
Phone: +968 96030210
Website: www.eurotechoman.com
VAT NO: OM1100077623`
      },

      friendly: {
        subject: `Your Quotation is Ready! - ${quotation.quotation_no}`,
        body: `Hi ${quotation.client_name},

Great news! Your quotation is ready and attached to this email.

Here's a quick summary:
💰 Total: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
📅 Valid until: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB')}
🔢 Reference: ${quotation.quotation_no}

Any questions? Just hit reply - I'm here to help! 😊

Thanks for choosing us!

International Pipes Technology Co LLC 💧`
      },

      formal: {
        subject: `Quotation Reference: ${quotation.quotation_no}`,
        body: `Dear ${quotation.client_name},

Re: Quotation for Waterproofing Services

Further to our recent discussions, we are pleased to submit our quotation for the above-mentioned project.

The attached quotation provides comprehensive details of our proposed solution, including specifications, pricing, and terms of engagement.

Key Details:
- Quotation Reference: ${quotation.quotation_no}
- Issue Date: ${new Date(quotation.tdate).toLocaleDateString('en-GB')}
- Total Value: OMR ${parseFloat(quotation.grand_total).toFixed(3)}
- Validity Period: 30 days

We trust that our proposal meets your requirements and look forward to your favorable consideration.

Should you require any additional information or clarification, please do not hesitate to contact the undersigned.

Yours faithfully,

International Pipes Technology Co LLC
Authorized Representative`
      }
    };

    return templates[template] || templates.professional;
  }

  // 🔥 Advanced validation with detailed feedback
  static validateAdvancedExportSettings(settings = {}) {
    const errors = [];
    const warnings = [];
    
    // Validate font sizes
    const fontSizes = ['headerFontSize', 'subheaderFontSize', 'bodyFontSize', 'tableFontSize', 'smallFontSize'];
    fontSizes.forEach(font => {
      const size = parseInt(settings[font]);
      if (size && (size < 8 || size > 48)) {
        warnings.push(`${font} (${size}px) may not be optimal for readability`);
      }
    });

    // Validate QR code size
    const qrSize = parseInt(settings.qrSize);
    if (qrSize && (qrSize < 50 || qrSize > 300)) {
      warnings.push(`QR code size (${qrSize}px) may affect scannability`);
    }

    // Validate image settings
    if (settings.imageQuality && (settings.imageQuality < 50 || settings.imageQuality > 100)) {
      errors.push('Image quality must be between 50 and 100');
    }

    // Validate paper size for content
    if (settings.paperSize === 'A3' && settings.fileType === 'excel') {
      warnings.push('A3 paper size may not be necessary for Excel format');
    }

    // Validate export method compatibility
    if (settings.exportMethod === 'whatsapp' && !settings.fileType.match(/pdf|png|jpg/)) {
      errors.push('WhatsApp export works best with PDF, PNG, or JPG formats');
    }

    if (settings.exportMethod === 'email' && settings.fileType === 'excel' && settings.imageQuality > 90) {
      warnings.push('High quality Excel files may be too large for email');
    }

    const defaultSettings = {
      customHeader: settings.customHeader || 'QUOTATION FOR WATERPROOFING',
      headerFontSize: Math.max(24, Math.min(36, parseInt(settings.headerFontSize) || 28)) + 'px',
      subheaderFontSize: Math.max(16, Math.min(24, parseInt(settings.subheaderFontSize) || 18)) + 'px',
      bodyFontSize: Math.max(12, Math.min(18, parseInt(settings.bodyFontSize) || 14)) + 'px',
      tableFontSize: Math.max(10, Math.min(16, parseInt(settings.tableFontSize) || 12)) + 'px',
      smallFontSize: Math.max(9, Math.min(14, parseInt(settings.smallFontSize) || 11)) + 'px',
      qrSize: Math.max(80, Math.min(200, parseInt(settings.qrSize) || 100)) + 'px',
      paperSize: settings.paperSize || 'A4',
      marginTop: settings.marginTop || '20mm',
      marginRight: settings.marginRight || '15mm',
      marginBottom: settings.marginBottom || '20mm',
      marginLeft: settings.marginLeft || '15mm',
      includeSignature: !!settings.includeSignature,
      includeStamp: !!settings.includeStamp,
      stampPosition: settings.stampPosition || 'auto',
      letterhead: settings.letterhead || 'plain',
      watermark: settings.watermark || null,
      imageFormat: settings.imageFormat || 'png',
      imageQuality: Math.max(60, Math.min(100, parseInt(settings.imageQuality) || 90)),
      imageWidth: parseInt(settings.imageWidth) || 1200,
      imageHeight: parseInt(settings.imageHeight) || 1600,
      optimizeImage: settings.optimizeImage !== false,
      highDPI: !!settings.highDPI,
      transparentBackground: !!settings.transparentBackground,
      enableEditing: !!settings.enableEditing,
      includeLogo: !!settings.includeLogo,
      includeHeaderFooter: !!settings.includeHeaderFooter,
      whatsappTemplate: settings.whatsappTemplate || 'professional',
      emailTemplate: settings.emailTemplate || 'professional',
      fileType: settings.fileType || 'pdf',
      exportMethod: settings.exportMethod || 'download'
    };

    return { 
      settings: defaultSettings, 
      errors, 
      warnings,
      isValid: errors.length === 0
    };
  }

  // 🔥 Template management system
  static async saveAdvancedExportTemplate(templateData, userId) {
    try {
      const template = {
        id: Date.now().toString(),
        name: templateData.name,
        description: templateData.description || '',
        settings: templateData.settings,
        userId: userId,
        isPublic: !!templateData.isPublic,
        tags: templateData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0,
        category: templateData.category || 'custom'
      };

      // In a real implementation, save to database
      // For now, we'll use a file-based approach
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

  // 🔥 Load saved templates
  static async loadExportTemplates(userId) {
    try {
      const templatesDir = path.join(__dirname, '../data/export-templates');
      
      try {
        const files = await fs.readdir(templatesDir);
        const templates = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
            const template = JSON.parse(content);
            
            // Include user's own templates and public templates
            if (template.userId === userId || template.isPublic) {
              templates.push(template);
            }
          }
        }
        
        return templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      } catch (err) {
        // Directory doesn't exist yet
        return [];
      }
      
    } catch (error) {
      console.error('❌ Failed to load export templates:', error);
      return [];
    }
  }

  // 🔥 Enhanced file naming with more options
  static generateAdvancedFileName(quotation, format, options = {}) {
    const {
      customName,
      includeDate = true,
      includeClient = true,
      includeTotal = false,
      dateFormat = 'YYYY-MM-DD',
      separator = '-'
    } = options;

    if (customName) {
      return `${customName}.${format}`;
    }
    
    const parts = [];
    
    // Quotation number (always included)
    const sanitizedQuoteNo = quotation.quotation_no.replace(/[^a-zA-Z0-9]/g, separator);
    parts.push(sanitizedQuoteNo);
    
    // Client name
    if (includeClient) {
      const sanitizedClientName = quotation.client_name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, separator)
        .substring(0, 20);
      parts.push(sanitizedClientName);
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
    
    return `${parts.join(separator)}.${format}`;
  }

  // 🔥 Progress tracking for long operations
  static createProgressTracker() {
    return {
      total: 100,
      current: 0,
      stage: 'Initializing...',
      
      update(progress, stage) {
        this.current = Math.min(100, Math.max(0, progress));
        this.stage = stage || this.stage;
        
        console.log(`📊 Progress: ${this.current}% - ${this.stage}`);
        
        // In a real implementation, you might emit events or update a database
        // For now, we'll just log the progress
      },
      
      complete() {
        this.current = 100;
        this.stage = 'Complete!';
        console.log('✅ Export operation completed successfully');
      },
      
      error(message) {
        this.stage = `Error: ${message}`;
        console.error(`❌ Export operation failed: ${message}`);
      }
    };
  }

  // 🔥 Override parent methods to use enhanced versions when available
  static async generateQRCode(quotationId, baseUrl, options = {}) {
    // Use enhanced version if options are provided, otherwise use parent
    if (Object.keys(options).length > 0) {
      return this.generateAdvancedQRCode(quotationId, baseUrl, options);
    }
    return super.generateQRCode(quotationId, baseUrl);
  }

  static async generatePDF(htmlContent, exportSettings = {}) {
    // Use enhanced version if advanced settings are provided
    if (exportSettings.multiPage || exportSettings.watermark || exportSettings.includeHeaderFooter) {
      return this.generateMultiPagePDF(htmlContent, exportSettings);
    }
    return super.generatePDF(htmlContent, exportSettings);
  }

  static async generateExcel(quotation, items, scope, materials, terms, exportSettings = {}) {
    // Use enhanced version if advanced settings are provided
    if (exportSettings.includeLogo || exportSettings.enableEditing || exportSettings.orientation) {
      return this.generateAdvancedExcel(quotation, items, scope, materials, terms, exportSettings);
    }
    return super.generateExcel(quotation, items, scope, materials, terms, exportSettings);
  }

  static async generateImage(htmlContent, exportSettings = {}) {
    // Use enhanced version if high quality settings are provided
    if (exportSettings.highDPI || exportSettings.transparentBackground || exportSettings.optimizeImage) {
      return this.generateHighQualityImage(htmlContent, exportSettings);
    }
    return super.generateImage(htmlContent, exportSettings);
  }

  static generateWhatsAppCaption(quotation, exportSettings = {}) {
    // Use enhanced version if template is specified
    if (exportSettings.whatsappTemplate) {
      return this.generateAdvancedWhatsAppCaption(quotation, exportSettings);
    }
    return super.generateWhatsAppCaption(quotation, exportSettings);
  }

  static validateExportSettings(settings = {}) {
    // Use enhanced validation for better feedback
    return this.validateAdvancedExportSettings(settings);
  }

  static generateFileName(quotation, format, options = {}) {
    // Use enhanced version if advanced options are provided
    if (options.customName || options.dateFormat || options.includeTotal !== undefined) {
      return this.generateAdvancedFileName(quotation, format, options);
    }
    return super.generateFileName(quotation, format);
  }

  static async saveExportTemplate(templateName, settings, userId) {
    // Use enhanced template saving
    const templateData = {
      name: templateName,
      settings: settings,
      category: 'user'
    };
    return this.saveAdvancedExportTemplate(templateData, userId);
  }
}

module.exports = ExportUtilsEnhanced;