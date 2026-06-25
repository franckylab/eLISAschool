#!/bin/bash
# ==================================
# eLISAschool - Script de génération des 36 fonds SVG catalogue
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Génère automatiquement les 36 fichiers SVG (12 catégories x 3 variations)
# avec des motifs géométriques stylisés inspires de chaque catégorie.
#

OUTPUT_DIR="/mnt/DONNEES/projets/eLISAschool/public/fonds-catalogue"
mkdir -p "$OUTPUT_DIR"

# Couleurs de base (s'adapteront au thème de l'établissement)
COLOR_PRIMARY="currentColor"
COLOR_SECONDARY="currentColor"
OPACITY_BG="0.06"
OPACITY_PATTERN="0.10"

echo "🎨 Génération des 36 fonds SVG catalogue..."

# ========================================
# CATÉGORIE 1: Instruments de mesure
# ========================================

# Fond 1: Règles et équerres
cat > "$OUTPUT_DIR/instrument-mesure-01.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" stroke="currentColor" stroke-width="2" fill="none">
    <!-- Règles horizontales -->
    <line x1="0" y1="200" x2="1920" y2="200" stroke-dasharray="20,10,5,10"/>
    <line x1="0" y1="400" x2="1920" y2="400" stroke-dasharray="20,10,5,10"/>
    <line x1="0" y1="600" x2="1920" y2="600" stroke-dasharray="20,10,5,10"/>
    <line x1="0" y1="800" x2="1920" y2="800" stroke-dasharray="20,10,5,10"/>
    <!-- Graduations -->
    <path d="M100,195 v10 M200,195 v10 M300,195 v10 M400,195 v10" stroke-width="3"/>
    <path d="M100,395 v10 M200,395 v10 M300,395 v10 M400,395 v10" stroke-width="3"/>
    <!-- Équerres -->
    <polygon points="1500,100 1600,100 1500,200" fill="currentColor" opacity="0.05"/>
    <polygon points="1650,150 1750,150 1650,250" fill="currentColor" opacity="0.05"/>
    <polygon points="100,700 200,700 100,800" fill="currentColor" opacity="0.05"/>
  </g>
</svg>
SVG

# Fond 2: Compas et rapporteurs
cat > "$OUTPUT_DIR/instrument-mesure-02.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" stroke="currentColor" stroke-width="2" fill="none">
    <!-- Rapporteurs (demi-cercles) -->
    <path d="M300,500 A150,150 0 0,1 600,500" stroke-width="3"/>
    <path d="M320,500 A130,130 0 0,1 580,500"/>
    <line x1="300" y1="500" x2="600" y2="500"/>
    <path d="M1200,300 A100,100 0 0,1 1400,300" stroke-width="3"/>
    <line x1="1200" y1="300" x2="1400" y2="300"/>
    <!-- Compas stylisés -->
    <path d="M800,200 L750,400 M800,200 L850,400" stroke-width="4" stroke-linecap="round"/>
    <circle cx="800" cy="200" r="8" fill="currentColor"/>
    <path d="M1500,600 L1450,800 M1500,600 L1550,800" stroke-width="4" stroke-linecap="round"/>
    <circle cx="1500" cy="600" r="8" fill="currentColor"/>
  </g>
</svg>
SVG

# Fond 3: Niveaux et mètres
cat > "$OUTPUT_DIR/instrument-mesure-03.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" stroke="currentColor" stroke-width="2" fill="none">
    <!-- Mètres pliants -->
    <rect x="100" y="100" width="30" height="300" rx="2" fill="currentColor" opacity="0.05"/>
    <line x1="100" y1="150" x2="130" y2="150"/>
    <line x1="100" y1="200" x2="130" y2="200"/>
    <line x1="100" y1="250" x2="130" y2="250"/>
    <rect x="1400" y="400" width="30" height="400" rx="2" fill="currentColor" opacity="0.05"/>
    <!-- Niveaux à bulle -->
    <rect x="600" y="300" width="200" height="30" rx="15" fill="currentColor" opacity="0.06"/>
    <circle cx="700" cy="315" r="10" fill="currentColor" opacity="0.10"/>
    <rect x="400" y="700" width="150" height="25" rx="12" fill="currentColor" opacity="0.06"/>
    <circle cx="475" cy="712" r="8" fill="currentColor" opacity="0.10"/>
  </g>
</svg>
SVG

echo "✅ Catégorie 1: Instruments de mesure (3/36)"

# ========================================
# CATÉGORIE 2: Instruments de calcul
# ========================================

# Fond 4: Calculatrices vintage
cat > "$OUTPUT_DIR/instrument-calcul-01.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" fill="currentColor">
    <!-- Calculatrices en grille -->
    <rect x="100" y="100" width="120" height="200" rx="10" opacity="0.06"/>
    <rect x="110" y="110" width="100" height="50" rx="3" opacity="0.10"/>
    <rect x="110" y="170" width="22" height="22" rx="2" opacity="0.08"/>
    <rect x="138" y="170" width="22" height="22" rx="2" opacity="0.08"/>
    <rect x="166" y="170" width="22" height="22" rx="2" opacity="0.08"/>
    <rect x="110" y="198" width="22" height="22" rx="2" opacity="0.08"/>
    <rect x="138" y="198" width="22" height="22" rx="2" opacity="0.08"/>
    <rect x="166" y="198" width="22" height="22" rx="2" opacity="0.08"/>
    
    <rect x="300" y="300" width="120" height="200" rx="10" opacity="0.06"/>
    <rect x="310" y="310" width="100" height="50" rx="3" opacity="0.10"/>
    
    <rect x="1400" y="500" width="120" height="200" rx="10" opacity="0.06"/>
    <rect x="1410" y="510" width="100" height="50" rx="3" opacity="0.10"/>
  </g>
</svg>
SVG

# Fond 5: Bouliers et abaques
cat > "$OUTPUT_DIR/instrument-calcul-02.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" stroke="currentColor" stroke-width="2">
    <!-- Boulier avec tiges et perles -->
    <rect x="200" y="150" width="400" height="300" rx="10" fill="currentColor" opacity="0.04"/>
    <line x1="250" y1="150" x2="250" y2="450"/>
    <line x1="300" y1="150" x2="300" y2="450"/>
    <line x1="350" y1="150" x2="350" y2="450"/>
    <line x1="400" y1="150" x2="400" y2="450"/>
    <line x1="450" y1="150" x2="450" y2="450"/>
    <line x1="500" y1="150" x2="500" y2="450"/>
    <!-- Perles -->
    <circle cx="250" cy="200" r="12" fill="currentColor" opacity="0.12"/>
    <circle cx="300" cy="220" r="12" fill="currentColor" opacity="0.12"/>
    <circle cx="350" cy="190" r="12" fill="currentColor" opacity="0.12"/>
    <circle cx="400" cy="210" r="12" fill="currentColor" opacity="0.12"/>
    
    <rect x="1200" y="400" width="400" height="300" rx="10" fill="currentColor" opacity="0.04"/>
    <line x1="1250" y1="400" x2="1250" y2="700"/>
    <line x1="1300" y1="400" x2="1300" y2="700"/>
    <line x1="1350" y1="400" x2="1350" y2="700"/>
    <circle cx="1250" cy="450" r="12" fill="currentColor" opacity="0.12"/>
    <circle cx="1300" cy="470" r="12" fill="currentColor" opacity="0.12"/>
  </g>
</svg>
SVG

# Fond 6: Formules mathématiques
cat > "$OUTPUT_DIR/instrument-calcul-03.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.07" fill="currentColor" font-family="serif" font-size="48" font-style="italic">
    <!-- Formules dispersées -->
    <text x="100" y="200">E = mc²</text>
    <text x="500" y="350">a² + b² = c²</text>
    <text x="1200" y="150">∫f(x)dx</text>
    <text x="300" y="600">∑(i=1→n)</text>
    <text x="900" y="450">πr²</text>
    <text x="1400" y="550">√(x+y)</text>
    <text x="200" y="850">Δ = b²-4ac</text>
    <text x="800" y="750">∂f/∂x</text>
    <text x="1300" y="800">lim(x→∞)</text>
  </g>
</svg>
SVG

echo "✅ Catégorie 2: Instruments de calcul (6/36)"

# ========================================
# Je vais continuer avec un script plus compact pour les 30 restants
# ========================================

# Pour économiser de l'espace, je génère les fichiers avec des motifs géométriques simples
# Chaque fichier aura un pattern unique basé sur la catégorie

generate_svg() {
    local file="$1"
    local pattern="$2"
    local shapes="$3"
    
    cat > "$file" << SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="100%" height="100%" fill="transparent"/>
  <g opacity="0.08" stroke="currentColor" stroke-width="2" fill="none">
    ${shapes}
  </g>
</svg>
SVG
}

# CATÉGORIE 3: Matériel de laboratoire
generate_svg "$OUTPUT_DIR/materiel-laboratoire-01.svg" "tube" "
    <!-- Tubes à essai -->
    <rect x=\"200\" y=\"100\" width=\"30\" height=\"200\" rx=\"15\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"250\" y=\"150\" width=\"30\" height=\"180\" rx=\"15\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"300\" y=\"120\" width=\"30\" height=\"190\" rx=\"15\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"1400\" y=\"400\" width=\"30\" height=\"200\" rx=\"15\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"1450\" y=\"450\" width=\"30\" height=\"180\" rx=\"15\" fill=\"currentColor\" opacity=\"0.05\"/>
"

generate_svg "$OUTPUT_DIR/materiel-laboratoire-02.svg" "microscope" "
    <!-- Microscopes stylisés -->
    <ellipse cx=\"400\" cy=\"300\" rx=\"40\" ry=\"20\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"390\" y=\"200\" width=\"20\" height=\"100\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"400\" cy=\"180\" r=\"30\" stroke-width=\"3\"/>
    <ellipse cx=\"1200\" cy=\"600\" rx=\"40\" ry=\"20\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1190\" y=\"500\" width=\"20\" height=\"100\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"1200\" cy=\"480\" r=\"30\" stroke-width=\"3\"/>
"

generate_svg "$OUTPUT_DIR/materiel-laboratoire-03.svg" "balance" "
    <!-- Balances de précision -->
    <rect x=\"300\" y=\"400\" width=\"200\" height=\"20\" rx=\"10\" fill=\"currentColor\" opacity=\"0.06\"/>
    <polygon points=\"350,400 370,350 330,350\" fill=\"currentColor\" opacity=\"0.08\"/>
    <polygon points=\"450,400 470,350 430,350\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"1100\" y=\"300\" width=\"200\" height=\"20\" rx=\"10\" fill=\"currentColor\" opacity=\"0.06\"/>
    <polygon points=\"1150,300 1170,250 1130,250\" fill=\"currentColor\" opacity=\"0.08\"/>
"

echo "✅ Catégorie 3: Matériel de laboratoire (9/36)"

# CATÉGORIE 4: Matériel informatique
generate_svg "$OUTPUT_DIR/materiel-informatique-01.svg" "circuits" "
    <!-- Circuits imprimés -->
    <rect x=\"100\" y=\"100\" width=\"300\" height=\"200\" fill=\"currentColor\" opacity=\"0.04\"/>
    <line x1=\"150\" y1=\"100\" x2=\"150\" y2=\"300\" stroke-dasharray=\"10,5\"/>
    <line x1=\"200\" y1=\"100\" x2=\"200\" y2=\"300\" stroke-dasharray=\"10,5\"/>
    <line x1=\"250\" y1=\"100\" x2=\"250\" y2=\"300\" stroke-dasharray=\"10,5\"/>
    <circle cx=\"150\" cy=\"150\" r=\"8\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"200\" cy=\"200\" r=\"8\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"250\" cy=\"250\" r=\"8\" fill=\"currentColor\" opacity=\"0.12\"/>
    <rect x=\"1200\" y=\"400\" width=\"300\" height=\"200\" fill=\"currentColor\" opacity=\"0.04\"/>
    <circle cx=\"1250\" cy=\"450\" r=\"8\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"1350\" cy=\"500\" r=\"8\" fill=\"currentColor\" opacity=\"0.12\"/>
"

generate_svg "$OUTPUT_DIR/materiel-informatique-02.svg" "claviers" "
    <!-- Claviers -->
    <rect x=\"200\" y=\"300\" width=\"500\" height=\"200\" rx=\"10\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"220\" y=\"320\" width=\"40\" height=\"35\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"270\" y=\"320\" width=\"40\" height=\"35\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"320\" y=\"320\" width=\"40\" height=\"35\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"220\" y=\"365\" width=\"40\" height=\"35\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"270\" y=\"365\" width=\"40\" height=\"35\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"1200\" y=\"500\" width=\"400\" height=\"150\" rx=\"10\" fill=\"currentColor\" opacity=\"0.05\"/>
"

generate_svg "$OUTPUT_DIR/materiel-informatique-03.svg" "reseaux" "
    <!-- Serveurs et routeurs -->
    <rect x=\"300\" y=\"200\" width=\"150\" height=\"300\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"310\" y=\"220\" width=\"130\" height=\"40\" rx=\"3\" fill=\"currentColor\" opacity=\"0.10\"/>
    <rect x=\"310\" y=\"270\" width=\"130\" height=\"40\" rx=\"3\" fill=\"currentColor\" opacity=\"0.10\"/>
    <rect x=\"310\" y=\"320\" width=\"130\" height=\"40\" rx=\"3\" fill=\"currentColor\" opacity=\"0.10\"/>
    <circle cx=\"375\" cy=\"240\" r=\"5\" fill=\"currentColor\" opacity=\"0.15\"/>
    <circle cx=\"375\" cy=\"290\" r=\"5\" fill=\"currentColor\" opacity=\"0.15\"/>
    <rect x=\"1200\" y=\"400\" width=\"150\" height=\"300\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
"

echo "✅ Catégorie 4: Matériel informatique (12/36)"

# CATÉGORIE 5: Matériel électrique
generate_svg "$OUTPUT_DIR/materiel-electrique-01.svg" "schemas" "
    <!-- Symboles électriques -->
    <circle cx=\"300\" cy=\"200\" r=\"30\" stroke-width=\"3\" fill=\"currentColor\" opacity=\"0.06\"/>
    <path d=\"M270,200 L330,200\" stroke-width=\"4\"/>
    <rect x=\"500\" y=\"300\" width=\"80\" height=\"40\" fill=\"currentColor\" opacity=\"0.08\"/>
    <path d=\"M600,320 L700,320 L680,360 L600,360 Z\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"1200\" cy=\"400\" r=\"30\" stroke-width=\"3\" fill=\"currentColor\" opacity=\"0.06\"/>
"

generate_svg "$OUTPUT_DIR/materiel-electrique-02.svg" "oscilloscopes" "
    <!-- Oscilloscopes -->
    <rect x=\"200\" y=\"150\" width=\"350\" height=\"250\" rx=\"10\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"220\" y=\"170\" width=\"200\" height=\"150\" rx=\"5\" fill=\"currentColor\" opacity=\"0.08\"/>
    <path d=\"M220,245 Q270,200 320,245 T420,245\" stroke-width=\"3\" fill=\"none\"/>
    <rect x=\"1100\" y=\"300\" width=\"350\" height=\"250\" rx=\"10\" fill=\"currentColor\" opacity=\"0.05\"/>
    <path d=\"M1120,425 Q1170,380 1220,425 T1320,425\" stroke-width=\"3\" fill=\"none\"/>
"

generate_svg "$OUTPUT_DIR/materiel-electrique-03.svg" "fils" "
    <!-- Câbles et connecteurs -->
    <path d=\"M100,200 Q300,150 500,250 T900,200\" stroke-width=\"4\" fill=\"none\"/>
    <path d=\"M200,400 Q400,350 600,450 T1000,400\" stroke-width=\"4\" fill=\"none\"/>
    <circle cx=\"500\" cy=\"250\" r=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <circle cx=\"600\" cy=\"450\" r=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <rect x=\"1200\" y=\"300\" width=\"60\" height=\"40\" rx=\"5\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"1300\" y=\"500\" width=\"60\" height=\"40\" rx=\"5\" fill=\"currentColor\" opacity=\"0.08\"/>
"

echo "✅ Catégorie 5: Matériel électrique (15/36)"

# CATÉGORIE 6: Matériel de bureau
generate_svg "$OUTPUT_DIR/materiel-bureau-01.svg" "stylos" "
    <!-- Stylos en diagonale -->
    <line x1=\"200\" y1=\"100\" x2=\"350\" y2=\"400\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\"0.08\"/>
    <line x1=\"300\" y1=\"150\" x2=\"450\" y2=\"450\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\"0.08\"/>
    <line x1=\"400\" y1=\"200\" x2=\"550\" y2=\"500\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\"0.08\"/>
    <line x1=\"1200\" y1=\"300\" x2=\"1350\" y2=\"600\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\"0.08\"/>
    <line x1=\"1300\" y1=\"350\" x2=\"1450\" y2=\"650\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\"0.08\"/>
"

generate_svg "$OUTPUT_DIR/materiel-bureau-02.svg" "agrafeuses" "
    <!-- Agrafeuses et trombones -->
    <rect x=\"300\" y=\"200\" width=\"120\" height=\"60\" rx=\"10\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"320\" y=\"180\" width=\"80\" height=\"20\" rx=\"5\" fill=\"currentColor\" opacity=\"0.10\"/>
    <path d=\"M600,300 L650,300 L650,350 L600,350 L600,320 L640,320\" stroke-width=\"4\" fill=\"none\"/>
    <rect x=\"1100\" y=\"400\" width=\"120\" height=\"60\" rx=\"10\" fill=\"currentColor\" opacity=\"0.08\"/>
    <path d=\"M1400,500 L1450,500 L1450,550 L1400,550 L1400,520 L1440,520\" stroke-width=\"4\" fill=\"none\"/>
"

generate_svg "$OUTPUT_DIR/materiel-bureau-03.svg" "postit" "
    <!-- Post-it colorés -->
    <rect x=\"200\" y=\"150\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"320\" y=\"180\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.05\"/>
    <rect x=\"250\" y=\"280\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.04\"/>
    <rect x=\"1200\" y=\"300\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1350\" y=\"350\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.05\"/>
"

echo "✅ Catégorie 6: Matériel de bureau (18/36)"

# CATÉGORIE 7: Matériel de bâtiment
generate_svg "$OUTPUT_DIR/materiel-batiment-01.svg" "plans" "
    <!-- Plans d'architecte -->
    <rect x=\"100\" y=\"100\" width=\"500\" height=\"400\" fill=\"currentColor\" opacity=\"0.03\"/>
    <line x1=\"100\" y1=\"200\" x2=\"600\" y2=\"200\" stroke-dasharray=\"10,5\"/>
    <line x1=\"100\" y1=\"300\" x2=\"600\" y2=\"300\" stroke-dasharray=\"10,5\"/>
    <line x1=\"200\" y1=\"100\" x2=\"200\" y2=\"500\" stroke-dasharray=\"10,5\"/>
    <line x1=\"300\" y1=\"100\" x2=\"300\" y2=\"500\" stroke-dasharray=\"10,5\"/>
    <rect x=\"150\" y=\"150\" width=\"100\" height=\"80\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1100\" y=\"200\" width=\"400\" height=\"300\" fill=\"currentColor\" opacity=\"0.03\"/>
"

generate_svg "$OUTPUT_DIR/materiel-batiment-02.svg" "outils" "
    <!-- Outils de construction -->
    <rect x=\"300\" y=\"200\" width=\"20\" height=\"200\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"280\" y=\"180\" width=\"60\" height=\"30\" rx=\"5\" fill=\"currentColor\" opacity=\"0.10\"/>
    <polygon points=\"600,300 650,250 700,300 650,350\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"1200\" y=\"400\" width=\"20\" height=\"200\" fill=\"currentColor\" opacity=\"0.08\"/>
    <polygon points=\"1400,500 1450,450 1500,500 1450,550\" fill=\"currentColor\" opacity=\"0.08\"/>
"

generate_svg "$OUTPUT_DIR/materiel-batiment-03.svg" "echelles" "
    <!-- Échelles géométriques -->
    <line x1=\"300\" y1=\"100\" x2=\"300\" y2=\"500\" stroke-width=\"6\"/>
    <line x1=\"400\" y1=\"100\" x2=\"400\" y2=\"500\" stroke-width=\"6\"/>
    <line x1=\"300\" y1=\"150\" x2=\"400\" y2=\"150\" stroke-width=\"4\"/>
    <line x1=\"300\" y1=\"200\" x2=\"400\" y2=\"200\" stroke-width=\"4\"/>
    <line x1=\"300\" y1=\"250\" x2=\"400\" y2=\"250\" stroke-width=\"4\"/>
    <line x1=\"300\" y1=\"300\" x2=\"400\" y2=\"300\" stroke-width=\"4\"/>
    <line x1=\"1200\" y1=\"200\" x2=\"1200\" y2=\"600\" stroke-width=\"6\"/>
    <line x1=\"1300\" y1=\"200\" x2=\"1300\" y2=\"600\" stroke-width=\"6\"/>
"

echo "✅ Catégorie 7: Matériel de bâtiment (21/36)"

# CATÉGORIE 8: Objets de salle de classe
generate_svg "$OUTPUT_DIR/objet-salle-classe-01.svg" "tableau" "
    <!-- Tableau noir avec formules -->
    <rect x=\"200\" y=\"150\" width=\"600\" height=\"350\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"210\" y=\"160\" width=\"580\" height=\"330\" fill=\"currentColor\" opacity=\"0.04\"/>
    <text x=\"250\" y=\"250\" font-size=\"32\" fill=\"currentColor\" opacity=\"0.10\" font-family=\"serif\">2 + 2 = 4</text>
    <text x=\"250\" y=\"320\" font-size=\"32\" fill=\"currentColor\" opacity=\"0.10\" font-family=\"serif\">E = mc²</text>
    <text x=\"250\" y=\"390\" font-size=\"32\" fill=\"currentColor\" opacity=\"0.10\" font-family=\"serif\">a² + b² = c²</text>
    <rect x=\"1100\" y=\"200\" width=\"500\" height=\"300\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
"

generate_svg "$OUTPUT_DIR/objet-salle-classe-02.svg" "bureaux" "
    <!-- Bureaux en perspective -->
    <rect x=\"200\" y=\"300\" width=\"200\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"180\" y=\"400\" width=\"15\" height=\"80\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"385\" y=\"400\" width=\"15\" height=\"80\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"600\" y=\"350\" width=\"200\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1200\" y=\"400\" width=\"200\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1180\" y=\"500\" width=\"15\" height=\"80\" fill=\"currentColor\" opacity=\"0.08\"/>
"

generate_svg "$OUTPUT_DIR/objet-salle-classe-03.svg" "horloges" "
    <!-- Horloges murales -->
    <circle cx=\"300\" cy=\"250\" r=\"80\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <line x1=\"300\" y1=\"250\" x2=\"300\" y2=\"190\" stroke-width=\"4\" stroke-linecap=\"round\"/>
    <line x1=\"300\" y1=\"250\" x2=\"350\" y2=\"250\" stroke-width=\"4\" stroke-linecap=\"round\"/>
    <circle cx=\"1200\" cy=\"400\" r=\"80\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <line x1=\"1200\" y1=\"400\" x2=\"1200\" y2=\"340\" stroke-width=\"4\" stroke-linecap=\"round\"/>
"

echo "✅ Catégorie 8: Objets de salle de classe (24/36)"

# CATÉGORIE 9: Livres et documentation
generate_svg "$OUTPUT_DIR/livres-documentation-01.svg" "livres" "
    <!-- Livres empilés -->
    <rect x=\"200\" y=\"300\" width=\"120\" height=\"180\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"210\" y=\"310\" width=\"100\" height=\"160\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"340\" y=\"320\" width=\"120\" height=\"160\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"350\" y=\"330\" width=\"100\" height=\"140\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1200\" y=\"400\" width=\"120\" height=\"180\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"1350\" y=\"420\" width=\"120\" height=\"160\" rx=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
"

generate_svg "$OUTPUT_DIR/livres-documentation-02.svg" "dictionnaires" "
    <!-- Dictionnaires et atlas -->
    <rect x=\"300\" y=\"200\" width=\"150\" height=\"250\" rx=\"5\" fill=\"currentColor\" opacity=\"0.07\"/>
    <line x1=\"320\" y1=\"220\" x2=\"430\" y2=\"220\" stroke-width=\"3\" opacity=\"0.10\"/>
    <line x1=\"320\" y1=\"240\" x2=\"430\" y2=\"240\" stroke-width=\"3\" opacity=\"0.10\"/>
    <line x1=\"320\" y1=\"260\" x2=\"430\" y2=\"260\" stroke-width=\"3\" opacity=\"0.10\"/>
    <rect x=\"1100\" y=\"300\" width=\"150\" height=\"250\" rx=\"5\" fill=\"currentColor\" opacity=\"0.07\"/>
"

generate_svg "$OUTPUT_DIR/livres-documentation-03.svg" "manuels" "
    <!-- Manuels avec marque-pages -->
    <rect x=\"250\" y=\"250\" width=\"180\" height=\"220\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"410\" y=\"230\" width=\"30\" height=\"80\" fill=\"currentColor\" opacity=\"0.10\"/>
    <rect x=\"700\" y=\"300\" width=\"180\" height=\"220\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"860\" y=\"280\" width=\"30\" height=\"80\" fill=\"currentColor\" opacity=\"0.10\"/>
    <rect x=\"1200\" y=\"350\" width=\"180\" height=\"220\" rx=\"5\" fill=\"currentColor\" opacity=\"0.06\"/>
"

echo "✅ Catégorie 9: Livres et documentation (27/36)"

# CATÉGORIE 10: Sport et éducation physique
generate_svg "$OUTPUT_DIR/sport-education-physique-01.svg" "ballons" "
    <!-- Ballons -->
    <circle cx=\"300\" cy=\"250\" r=\"70\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <path d=\"M300,180 Q350,250 300,320 Q250,250 300,180\" stroke-width=\"3\" fill=\"none\"/>
    <circle cx=\"800\" cy=\"400\" r=\"60\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"1300\" cy=\"300\" r=\"70\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <path d=\"M1300,230 Q1350,300 1300,370 Q1250,300 1300,230\" stroke-width=\"3\" fill=\"none\"/>
"

generate_svg "$OUTPUT_DIR/sport-education-physique-02.svg" "chronos" "
    <!-- Chronomètres et sifflets -->
    <circle cx=\"300\" cy=\"250\" r=\"60\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"300\" cy=\"250\" r=\"45\" fill=\"currentColor\" opacity=\"0.04\"/>
    <line x1=\"300\" y1=\"250\" x2=\"300\" y2=\"220\" stroke-width=\"4\"/>
    <rect x=\"290\" y=\"180\" width=\"20\" height=\"15\" rx=\"3\" fill=\"currentColor\" opacity=\"0.10\"/>
    <ellipse cx=\"1200\" cy=\"400\" rx=\"40\" ry=\"15\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"1200\" cy=\"380\" r=\"8\" fill=\"currentColor\" opacity=\"0.10\"/>
"

generate_svg "$OUTPUT_DIR/sport-education-physique-03.svg" "agrees" "
    <!-- Barres et anneaux -->
    <rect x=\"200\" y=\"200\" width=\"400\" height=\"15\" rx=\"7\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"300\" cy=\"260\" r=\"30\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"500\" cy=\"260\" r=\"30\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <rect x=\"1100\" y=\"350\" width=\"400\" height=\"15\" rx=\"7\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"1200\" cy=\"410\" r=\"30\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
"

echo "✅ Catégorie 10: Sport et éducation physique (30/36)"

# CATÉGORIE 11: Arts et créativité
generate_svg "$OUTPUT_DIR/arts-creativite-01.svg" "palettes" "
    <!-- Palettes de couleurs -->
    <ellipse cx=\"300\" cy=\"300\" rx=\"100\" ry=\"80\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"260\" cy=\"280\" r=\"15\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"300\" cy=\"260\" r=\"15\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"340\" cy=\"280\" r=\"15\" fill=\"currentColor\" opacity=\"0.12\"/>
    <circle cx=\"320\" cy=\"320\" r=\"15\" fill=\"currentColor\" opacity=\"0.12\"/>
    <ellipse cx=\"1200\" cy=\"400\" rx=\"100\" ry=\"80\" fill=\"currentColor\" opacity=\"0.06\"/>
"

generate_svg "$OUTPUT_DIR/arts-creativite-02.svg" "ciseaux" "
    <!-- Ciseaux artistiques -->
    <line x1=\"250\" y1=\"200\" x2=\"400\" y2=\"350\" stroke-width=\"8\" stroke-linecap=\"round\" opacity=\"0.10\"/>
    <line x1=\"400\" y1=\"200\" x2=\"250\" y2=\"350\" stroke-width=\"8\" stroke-linecap=\"round\" opacity=\"0.10\"/>
    <circle cx=\"250\" cy=\"200\" r=\"20\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"400\" cy=\"200\" r=\"20\" stroke-width=\"4\" fill=\"currentColor\" opacity=\"0.06\"/>
    <line x1=\"1100\" y1=\"400\" x2=\"1250\" y2=\"550\" stroke-width=\"8\" stroke-linecap=\"round\" opacity=\"0.10\"/>
    <line x1=\"1250\" y1=\"400\" x2=\"1100\" y2=\"550\" stroke-width=\"8\" stroke-linecap=\"round\" opacity=\"0.10\"/>
"

generate_svg "$OUTPUT_DIR/arts-creativite-03.svg" "formes" "
    <!-- Formes géométriques créatives -->
    <circle cx=\"300\" cy=\"250\" r=\"60\" fill=\"currentColor\" opacity=\"0.06\"/>
    <polygon points=\"500,200 550,300 450,300\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"700\" y=\"200\" width=\"100\" height=\"100\" fill=\"currentColor\" opacity=\"0.06\"/>
    <polygon points=\"1200,400 1250,350 1300,400 1250,450\" fill=\"currentColor\" opacity=\"0.08\"/>
    <circle cx=\"1400\" cy=\"450\" r=\"50\" fill=\"currentColor\" opacity=\"0.06\"/>
"

echo "✅ Catégorie 11: Arts et créativité (33/36)"

# CATÉGORIE 12: Musique
generate_svg "$OUTPUT_DIR/musique-01.svg" "notes" "
    <!-- Notes de musique -->
    <ellipse cx=\"250\" cy=\"300\" rx=\"20\" ry=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <line x1=\"270\" y1=\"300\" x2=\"270\" y2=\"200\" stroke-width=\"4\"/>
    <ellipse cx=\"350\" cy=\"280\" rx=\"20\" ry=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <line x1=\"370\" y1=\"280\" x2=\"370\" y2=\"180\" stroke-width=\"4\"/>
    <ellipse cx=\"800\" cy=\"400\" rx=\"20\" ry=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <line x1=\"820\" y1=\"400\" x2=\"820\" y2=\"300\" stroke-width=\"4\"/>
    <ellipse cx=\"1200\" cy=\"350\" rx=\"20\" ry=\"15\" fill=\"currentColor\" opacity=\"0.10\"/>
    <line x1=\"1220\" y1=\"350\" x2=\"1220\" y2=\"250\" stroke-width=\"4\"/>
"

generate_svg "$OUTPUT_DIR/musique-02.svg" "cordes" "
    <!-- Guitares et violons stylisés -->
    <ellipse cx=\"300\" cy=\"300\" rx=\"50\" ry=\"70\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"300\" cy=\"300\" r=\"20\" stroke-width=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"290\" y=\"200\" width=\"20\" height=\"60\" fill=\"currentColor\" opacity=\"0.08\"/>
    <ellipse cx=\"1200\" cy=\"450\" rx=\"50\" ry=\"70\" fill=\"currentColor\" opacity=\"0.06\"/>
    <circle cx=\"1200\" cy=\"450\" r=\"20\" stroke-width=\"3\" fill=\"currentColor\" opacity=\"0.08\"/>
"

generate_svg "$OUTPUT_DIR/musique-03.svg" "piano" "
    <!-- Touches de piano -->
    <rect x=\"200\" y=\"300\" width=\"400\" height=\"120\" fill=\"currentColor\" opacity=\"0.04\"/>
    <rect x=\"205\" y=\"305\" width=\"35\" height=\"75\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"245\" y=\"305\" width=\"35\" height=\"75\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"285\" y=\"305\" width=\"35\" height=\"75\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"325\" y=\"305\" width=\"35\" height=\"75\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"365\" y=\"305\" width=\"35\" height=\"75\" fill=\"currentColor\" opacity=\"0.08\"/>
    <rect x=\"225\" y=\"305\" width=\"25\" height=\"50\" fill=\"currentColor\" opacity=\"0.12\"/>
    <rect x=\"265\" y=\"305\" width=\"25\" height=\"50\" fill=\"currentColor\" opacity=\"0.12\"/>
    <rect x=\"1100\" y=\"400\" width=\"400\" height=\"120\" fill=\"currentColor\" opacity=\"0.04\"/>
"

echo "✅ Catégorie 12: Musique (36/36)"

echo ""
echo "🎉 Génération terminée ! 36 fichiers SVG créés dans $OUTPUT_DIR"
echo ""
echo "📊 Répartition :"
echo "  - Instruments de mesure: 3 fichiers"
echo "  - Instruments de calcul: 3 fichiers"
echo "  - Matériel de laboratoire: 3 fichiers"
echo "  - Matériel informatique: 3 fichiers"
echo "  - Matériel électrique: 3 fichiers"
echo "  - Matériel de bureau: 3 fichiers"
echo "  - Matériel de bâtiment: 3 fichiers"
echo "  - Objets de salle de classe: 3 fichiers"
echo "  - Livres et documentation: 3 fichiers"
echo "  - Sport et éducation physique: 3 fichiers"
echo "  - Arts et créativité: 3 fichiers"
echo "  - Musique: 3 fichiers"
