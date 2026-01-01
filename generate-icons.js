import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

const publicDir = './public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const svgBuffer = fs.readFileSync('./carpool-favicon.svg');

async function generateIcons() {
  for (const { size, name } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name}`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
