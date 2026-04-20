const fs = require('fs');
const path = require('path');

const srcPath = 'c:/Users/Evilonga/AUDMBT/backend/src';

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('prisma.cliente')) {
        console.log(`Updating ${fullPath}`);
        const updated = content.replace(/prisma\.cliente/g, 'prisma.postoTransformacao');
        fs.writeFileSync(fullPath, updated);
      }
    }
  });
}

walk(srcPath);
console.log('Update complete.');
