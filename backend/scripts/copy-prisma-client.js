const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/generated/client');
const destDir = path.join(__dirname, '../dist/generated/client');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying generated prisma client from src to dist...');
copyDir(srcDir, destDir);
console.log('Copy complete!');
