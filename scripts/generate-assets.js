const fs = require('fs');
const path = require('path');

const sealPath = path.join(__dirname, '..', 'public', 'images', 'hanmingyu-seal.png');
const logoPath = path.join(__dirname, '..', 'public', 'images', 'dear-memory-logo.png');

const sealBase64 = 'data:image/png;base64,' + fs.readFileSync(sealPath).toString('base64');
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

const assetDir = path.join(__dirname, '..', 'src', 'assets');
if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

const content = `// Auto-generated brand assets
export const HANMINGYU_SEAL_BASE64 = "${sealBase64}";
export const DEAR_MEMORY_LOGO_BASE64 = "${logoBase64}";
`;

fs.writeFileSync(path.join(assetDir, 'images.ts'), content, 'utf8');
console.log('src/assets/images.ts 생성 완료! 크기:', content.length);
