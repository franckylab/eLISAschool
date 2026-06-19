/**
 * ==================================
 * eLISAschool - Génération des favicons multi-format
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Script de génération des favicons PNG/ICO à partir du SVG source.
 * Utilise sharp pour la conversion et le redimensionnement.
 *
 * Usage: npx tsx scripts/generate-favicons.ts [couleur]
 * Ex: npx tsx scripts/generate-favicons.ts 28a745
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SVG_SOURCE = path.join(PUBLIC_DIR, 'favicon.svg');
const COULEUR_DEFAUT = '#1a3a5c';

// Couleurs personnalisables via argument CLI
const couleurArg = process.argv[2];
const couleur = couleurArg ? `#${couleurArg.replace('#', '')}` : COULEUR_DEFAUT;

// Tailles à générer
const TAILLES = [
  { fichier: 'favicon-16x16.png', size: 16 },
  { fichier: 'favicon-32x32.png', size: 32 },
  { fichier: 'favicon-48x48.png', size: 48 },
  { fichier: 'apple-touch-icon.png', size: 180 },
  { fichier: 'android-chrome-192x192.png', size: 192 },
  { fichier: 'android-chrome-512x512.png', size: 512 },
] as const;

/**
 * Calcule la couleur de texte (blanc ou noir) selon la luminosité du fond
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Génère un SVG avec la couleur spécifiée
 */
function genererSVG(couleurFond: string): string {
  const couleurTexte = getContrastColor(couleurFond);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="${couleurFond}"/>
  <g fill="${couleurTexte}" opacity="0.95">
    <path d="M18 20 C18 20, 24 18, 32 20 L32 44 C24 42, 18 44, 18 44 Z"/>
    <path d="M46 20 C46 20, 40 18, 32 20 L32 44 C40 42, 46 44, 46 44 Z"/>
  </g>
  <line x1="32" y1="20" x2="32" y2="44" stroke="${couleurFond}" stroke-width="1.5" opacity="0.3"/>
</svg>`;
}

/**
 * Génère un fichier ICO multi-size (16x16 + 32x32)
 */
async function genererICO(couleurFond: string): Promise<void> {
  const svgBuffer = Buffer.from(genererSVG(couleurFond));

  // Générer les deux tailles
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

  // ICO format : header + entries + data
  // Structure simple ICO avec 2 images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // Reserved
  header.writeUInt16LE(1, 2);  // Type: 1 = ICO
  header.writeUInt16LE(2, 4);  // Nombre d'images

  // Entry pour 16x16
  const entry16 = Buffer.alloc(16);
  entry16.writeUInt8(16, 0);   // Width
  entry16.writeUInt8(16, 1);   // Height
  entry16.writeUInt8(0, 2);    // Color palette
  entry16.writeUInt8(0, 3);    // Reserved
  entry16.writeUInt16LE(1, 4); // Color planes
  entry16.writeUInt16LE(32, 6); // Bits per pixel
  entry16.writeUInt32LE(png16.length, 8);  // Size of image data
  entry16.writeUInt32LE(6 + 32 + png16.length, 12); // Offset

  // Entry pour 32x32
  const entry32 = Buffer.alloc(16);
  entry32.writeUInt8(32, 0);
  entry32.writeUInt8(32, 1);
  entry32.writeUInt8(0, 2);
  entry32.writeUInt8(0, 3);
  entry32.writeUInt16LE(1, 4);
  entry32.writeUInt16LE(32, 6);
  entry32.writeUInt32LE(png32.length, 8);
  entry32.writeUInt32LE(6 + 32 + png16.length + png32.length, 12);

  // Assembler
  const icoBuffer = Buffer.concat([
    header,
    entry16,
    entry32,
    png16,
    png32,
  ]);

  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`✓ favicon.ico généré (16x16 + 32x32)`);
}

/**
 * Génère tous les favicons
 */
async function genererFavicons(couleurFond: string): Promise<void> {
  console.log(`🎨 Génération des favicons avec couleur: ${couleurFond}`);

  const svgBuffer = Buffer.from(genererSVG(couleurFond));

  // Générer les PNG
  for (const { fichier, size } of TAILLES) {
    const outputPath = path.join(PUBLIC_DIR, fichier);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ ${fichier} généré (${size}x${size})`);
  }

  // Générer ICO
  await genererICO(couleurFond);

  console.log(`\n✅ Tous les favicons ont été générés dans ${PUBLIC_DIR}`);
}

// Exécution
genererFavicons(couleur).catch((err) => {
  console.error('❌ Erreur lors de la génération:', err);
  process.exit(1);
});
