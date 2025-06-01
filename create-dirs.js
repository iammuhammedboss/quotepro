// create-dirs.js - Windows compatible directory creation
const fs = require('fs');
const path = require('path');

const directories = [
  'data',
  'data/export-templates',
  'temp',
  'public/exports',
  'logs'
];

console.log('🚀 Creating QuotePro Enhanced directories...');

directories.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } else {
      console.log(`📁 Already exists: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create ${dir}:`, error.message);
  }
});

console.log('🎉 Directory creation complete!');
console.log('📂 Your QuotePro Enhanced export system is ready!');