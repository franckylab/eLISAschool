/**
 * ==================================
 * eLISAschool - Utilitaire d'encodage de logo en base64
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Encode les fichiers image en base64 pour upload au backend.
 */

// ==================================
// Constantes
// ==================================

/** Taille maximale : 1 MB */
export const TAILLE_MAX_LOGO = 1_048_576;

/** Formats MIME acceptés */
export const FORMATS_LOGO_ACCEPTES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
] as const;

export type FormatLogoAccepte = (typeof FORMATS_LOGO_ACCEPTES)[number];

// ==================================
// Types
// ==================================

export interface LogoEncode {
  /** Data URI base64 complet (data:image/png;base64,...) */
  base64: string;
  /** Nom du fichier original */
  nomFichier: string;
  /** Type MIME du fichier */
  type: string;
  /** Taille du fichier en octets */
  taille: number;
}

// ==================================
// Fonctions
// ==================================

/**
 * Encode un fichier image en base64
 * 
 * @param file Fichier image sélectionné
 * @returns Promise<LogoEncode> avec base64 + métadonnées
 * @throws Error si format ou taille invalide
 */
export function encoderLogoEnBase64(file: File): Promise<LogoEncode> {
  return new Promise((resolve, reject) => {
    // 1. Validation du format
    if (!FORMATS_LOGO_ACCEPTES.includes(file.type as FormatLogoAccepte)) {
      reject(new Error(
        `Format non supporté: ${file.type}. Formats acceptés: PNG, JPG, WEBP, SVG`
      ));
      return;
    }

    // 2. Validation de la taille
    if (file.size > TAILLE_MAX_LOGO) {
      reject(new Error(
        `Image trop volumineuse: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum: 1 MB`
      ));
      return;
    }

    // 3. Encodage en base64
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      
      resolve({
        base64,
        nomFichier: file.name,
        type: file.type,
        taille: file.size,
      });
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Affiche une taille en format lisible
 * @param octets Taille en octets
 * @returns String formatée (ex: "245 KB", "1.2 MB")
 */
export function formatertTailleLogo(octets: number): string {
  if (octets < 1024) {
    return `${octets} B`;
  }
  if (octets < 1_048_576) {
    return `${(octets / 1024).toFixed(1)} KB`;
  }
  return `${(octets / 1_048_576).toFixed(2)} MB`;
}

/**
 * Valide un fichier logo avant upload
 * @param file Fichier à valider
 * @returns true si valide, lance une Error sinon
 */
export function validerFichierLogo(file: File): boolean {
  if (!FORMATS_LOGO_ACCEPTES.includes(file.type as FormatLogoAccepte)) {
    throw new Error(
      `Format non supporté: ${file.type}. Formats acceptés: PNG, JPG, WEBP, SVG`
    );
  }

  if (file.size > TAILLE_MAX_LOGO) {
    throw new Error(
      `Image trop volumineuse: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum: 1 MB`
    );
  }

  return true;
}
