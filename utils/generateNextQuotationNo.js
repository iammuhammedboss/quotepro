// utils/generateNextQuotationNo.js
const db = require('../models/db');

async function generateNextQuotationNo() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT quotation_no FROM quotations 
      WHERE quotation_no LIKE '#WP-2025S-%' 
      ORDER BY id DESC LIMIT 1
    `;
    db.query(sql, (err, results) => {
      if (err) return reject(err);

      let nextNumber = 980012012; // Default starting number
      if (results.length > 0) {
        const lastQuotationNo = results[0].quotation_no;
        const lastNumber = parseInt(lastQuotationNo.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      const newQuotationNo = `#WP-2025S-${nextNumber}`;
      resolve(newQuotationNo);
    });
  });
}

module.exports = generateNextQuotationNo;
