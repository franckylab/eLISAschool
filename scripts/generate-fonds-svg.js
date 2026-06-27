/**
 * ==================================
 * eLISAschool - Générateur de fonds SVG
 * ==================================
 * Génère les 30 fichiers SVG restants pour le catalogue de fonds d'écran
 * avec 35-40 motifs par fichier, opacité 30-40%, variantes thématiques
 */

const fs = require('fs');
const path = require('path');

const CATALOGUE_DIR = path.join(__dirname, '../public/fonds-catalogue');

// Fonctions utilitaires
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function randomPosition() {
  return { x: randInt(100, 1820), y: randInt(100, 980) };
}

function randomRotation() {
  return randInt(-60, 60);
}

function randomOpacity(min = 0.30, max = 0.40) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Générateurs de motifs par catégorie
const generateurs = {
  'instrument-calcul-03': () => {
    const motifs = [];
    
    // 6 calculatrices
    for (let i = 0; i < 6; i++) {
      const pos = randomPosition();
      const rot = randomRotation();
      const op = randomOpacity();
      const w = randInt(40, 60);
      const h = randInt(70, 90);
      motifs.push(`
    <g transform="translate(${pos.x}, ${pos.y}) rotate(${rot})" opacity="${op}">
      <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="3" stroke-width="2"/>
      <rect x="${-w/2+6}" y="${-h/2+6}" width="${w-12}" height="${h*0.2}" rx="2" fill="currentColor" opacity="0.10"/>
      ${[-1, 0, 1].flatMap(r => [0, 1, 2, 3].map(c => {
        const cx = (r * w * 0.25).toFixed(1);
        const cy = (-h*0.15 + c * h * 0.22).toFixed(1);
        return `<circle cx="${cx}" cy="${cy}" r="${(w*0.08).toFixed(1)}" fill="currentColor" opacity="${op}"/>`;
      })).join('\n      ')}
    </g>`);
    }
    
    // 5 bouliers
    for (let i = 0; i < 5; i++) {
      const pos = randomPosition();
      const rot = randomRotation();
      const op = randomOpacity();
      const w = randInt(60, 80);
      const h = randInt(80, 100);
      motifs.push(`
    <g transform="translate(${pos.x}, ${pos.y}) rotate(${rot})" opacity="${op}">
      <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="3" stroke-width="2"/>
      ${[1, 2, 3, 4].map(r => `<line x1="${-w/2}" y1="${-h/2 + r*h/5}" x2="${w/2}" y2="${-h/2 + r*h/5}" stroke-width="1.5"/>`).join('\n      ')}
      ${[1, 2, 3].flatMap(r => [-1, 0, 1].map(c => {
        const cx = (c * w * 0.28).toFixed(1);
        const cy = (-h*0.3 + r * h * 0.2).toFixed(1);
        return `<circle cx="${cx}" cy="${cy}" r="${(w*0.07).toFixed(1)}" fill="currentColor" opacity="${op}"/>`;
      })).join('\n      ')}
    </g>`);
    }
    
    // 5 règles à calcul
    for (let i = 0; i < 5; i++) {
      const pos = randomPosition();
      const rot = randomRotation();
      const op = randomOpacity();
      const w = randInt(100, 130);
      const h = randInt(22, 32);
      motifs.push(`
    <g transform="translate(${pos.x}, ${pos.y}) rotate(${rot})" opacity="${op}">
      <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="2" stroke-width="2"/>
      ${[-3, -2, -1, 0, 1, 2, 3].map(m => `<line x1="${m*w/8}" y1="${-h/2}" x2="${m*w/8}" y2="${h/2}" stroke-width="${m%2===0?1.5:1}"/>`).join('\n      ')}
      <rect x="${-w/2+8}" y="${-h/2+4}" width="${w-16}" height="${h-8}" rx="1" fill="currentColor" opacity="0.08"/>
    </g>`);
    }
    
    // 8 signes mathématiques
    const signes = [
      '<line x1="-14" y1="0" x2="14" y2="0" stroke-width="3"/><line x1="0" y1="-14" x2="0" y2="14" stroke-width="3"/>',
      '<line x1="-11" y1="-11" x2="11" y2="11" stroke-width="2.5"/><line x1="11" y1="-11" x2="-11" y2="11" stroke-width="2.5"/>',
      '<path d="M-11,-7 L11,0 L-11,7 Z" stroke-width="2.5"/>',
      '<line x1="-13" y1="0" x2="13" y2="0" stroke-width="3"/>',
      '<line x1="-9" y1="-9" x2="9" y2="9" stroke-width="3"/><line x1="9" y1="-9" x2="-9" y2="9" stroke-width="3"/><line x1="-13" y1="0" x2="13" y2="0" stroke-width="3"/>',
      '<path d="M-14,-4 L14,-4 M-14,4 L14,4" stroke-width="2.5"/>',
      '<circle cx="0" cy="0" r="12" stroke-width="2"/><line x1="-8" y1="-8" x2="8" y2="8" stroke-width="2"/>',
      '<path d="M0,-12 L10,5 L-10,5 Z" stroke-width="2.5"/>'
    ];
    for (let i = 0; i < 8; i++) {
      const pos = randomPosition();
      const op = randomOpacity();
      motifs.push(`
    <g transform="translate(${pos.x}, ${pos.y})" opacity="${op}">
      ${signes[i]}
    </g>`);
    }
    
    // 6 nombres flottants
    const nombres = ['∮', '∝', '≠', '≈', '≤', '≥'];
    for (let i = 0; i < 6; i++) {
      const pos = randomPosition();
      const size = randInt(44, 58);
      const op = randomOpacity();
      motifs.push(`
    <text x="${pos.x}" y="${pos.y}" font-family="monospace" font-size="${size}" font-weight="bold" opacity="${op}" fill="currentColor" stroke="none">${nombres[i]}</text>`);
    }
    
    // 5 engrenages
    for (let i = 0; i < 5; i++) {
      const pos = randomPosition();
      const rot = randomRotation();
      const op = randomOpacity();
      const r = randInt(14, 22);
      motifs.push(`
    <g transform="translate(${pos.x}, ${pos.y}) rotate(${rot})" opacity="${op}">
      <circle cx="0" cy="0" r="${r}" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="${(r*0.35).toFixed(1)}" fill="currentColor" opacity="0.15"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        const x1 = (Math.cos(rad) * r).toFixed(1);
        const y1 = (Math.sin(rad) * r).toFixed(1);
        const x2 = (Math.cos(rad) * (r + 7)).toFixed(1);
        const y2 = (Math.sin(rad) * (r + 7)).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="3"/>`;
      }).join('\n      ')}
    </g>`);
    }
    
    return motifs.join('\n');
  }
};

// Template SVG
function createSVG(contenu) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g stroke="currentColor" fill="none">
    ${contenu}
  </g>
</svg>
`;
}

// Génération
console.log('🎨 Génération des fichiers SVG restants...');

const fichiersRestants = [
  'instrument-calcul-03.svg',
  // Les autres catégories suivront...
];

// Générer instrument-calcul-03.svg
const nomFichier = 'instrument-calcul-03.svg';
const contenu = generateurs['instrument-calcul-03']();
const svg = createSVG(contenu);
const chemin = path.join(CATALOGUE_DIR, nomFichier);

fs.writeFileSync(chemin, svg);
console.log(`✅ ${nomFichier} généré`);

console.log('\n🎉 Génération terminée!');
