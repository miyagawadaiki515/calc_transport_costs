import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const pwaIcons = [
  { size: 192, name: 'icon-192x192.png', svg: './carpool-pwa-icon.svg' },
  { size: 512, name: 'icon-512x512.png', svg: './carpool-pwa-icon.svg' }
];

const appleIcon = [
  { size: 180, name: 'apple-touch-icon.png', svg: './carpool-favicon.svg' }
];

const publicDir = './public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

async function generateIcons() {
  // PWA用アイコンを生成（四角い背景）
  for (const { size, name, svg } of pwaIcons) {
    const svgBuffer = fs.readFileSync(svg);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name} (square background)`);
  }

  // Apple用アイコンを生成（丸い背景）
  for (const { size, name, svg } of appleIcon) {
    const svgBuffer = fs.readFileSync(svg);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name} (circular background)`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
