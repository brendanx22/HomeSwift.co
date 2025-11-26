const fs = require('fs');
const path = require('path');

// Path to cache manager
const cacheManagerPath = path.join(__dirname, '../src/utils/cacheManager.js');

// Read current content
let content = fs.readFileSync(cacheManagerPath, 'utf8');

// Extract current version
const versionMatch = content.match(/const APP_VERSION = '([^']+)'/);
if (!versionMatch) {
    console.error('❌ Could not find APP_VERSION in cacheManager.js');
    process.exit(1);
}

const currentVersion = versionMatch[1];
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Determine new version based on argument
const updateType = process.argv[2] || 'patch';
let newVersion;

switch (updateType) {
    case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
    case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
    case 'patch':
    default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
}

// Update version in file
content = content.replace(
    /const APP_VERSION = '[^']+'/,
    `const APP_VERSION = '${newVersion}'`
);

// Write back to file
fs.writeFileSync(cacheManagerPath, content);

console.log('');
console.log('🎉 Version Updated Successfully!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Old Version: ${currentVersion}`);
console.log(`✨ New Version: ${newVersion}`);
console.log(`🔄 Update Type: ${updateType}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('✅ Cache will be automatically cleared for all users on next visit!');
console.log('');
console.log('Next steps:');
console.log('  1. npm run build');
console.log('  2. Deploy to production');
console.log('  3. Users will automatically get the new version!');
console.log('');
