const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // update if needed
  database: 'quotepro_db'
});

module.exports = db;
