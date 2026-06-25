/**
 * ==================================
 * eLISAschool - Utilitaire de traitement d'image pour logos
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Redimensionnement et optimisation des logos d'établissement avec sharp.
 */

import sharp from 'sharp';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

// ==================================
// Constantes de configuration
// ==================================

/** Taille maximale du fichier original (1 MB) */
const TAILLE_MAX_OCTETS = 1_048_576;

/** Dimensions maximales après redimensionnement */
const DIMENSION_MAX = 500;

/** Formats MIME acceptés */
const FORMATS_ACCEPTES = ['png', 'jpeg', 'jpg', 'svg+xml', 'webp'];

/** Qualité de compression JPEG/WEBP (0-100) */
const QUALITE_COMPRESSION = 85;

// ==================================
// Types
// ==================================

export interface ImageTraitee {
  /** Data URI base64 de l'image redimensionnée */
  base64: string;
  /** Type MIME : 'png', 'jpg', 'webp', 'svg' */
  type: string;
  /** Taille du fichier original en octets */
  taille: number;
  /** Dimensions finales */
  dimensions: {
    largeur: number;
    hauteur: number;
  };
}

// ==================================
// Fonctions utilitaires
// ==================================

/**
 * Extrait les données d'un data URI base64
 * @param dataUri Format: data:image/png;base64,iVBOR...
 * @returns { mime, buffer }
 */
function extraireDonneesBase64(dataUri: string): { mime: string; buffer: Buffer } {
  const match = dataUri.match(/^data:image\/([a-z+\-]+);base64,(.+)$/);
  
  if (!match) {
    throw new AppError(
      'Format de fichier invalide. Attendu : data:image/xxx;base64,...',
      400,
      'FORMAT_BASE64_INVALIDE'
    );
  }

  const [, mime, base64Data] = match;
  
  if (!FORMATS_ACCEPTES.includes(mime)) {
    throw new AppError(
      `Format non supporté: ${mime}. Formats acceptés: PNG, JPG, SVG, WEBP`,
      400,
      'FORMAT_IMAGE_NON_SUPPORTE'
    );
  }

  return {
    mime,
    buffer: Buffer.from(base64Data, 'base64'),
  };
}

/**
 * Valide la taille du fichier original
 * @param taille Taille en octets
 */
function validerTaille(taille: number): void {
  if (taille > TAILLE_MAX_OCTETS) {
    throw new AppError(
      `Image trop volumineuse: ${(taille / 1024 / 1024).toFixed(2)} MB. Maximum: 1 MB`,
      400,
      'IMAGE_TROP_LOURDE'
    );
  }
}

/**
 * Normalise le type MIME pour le stockage en DB
 * jpeg → jpg, svg+xml → svg
 */
function normaliserTypeMime(mime: string): string {
  if (mime === 'jpeg') return 'jpg';
  if (mime === 'svg+xml') return 'svg';
  return mime;
}

// ==================================
// Fonction principale
// ==================================

/**
 * Redimensionne et optimise un logo d'établissement
 * 
 * @param base64Input Data URI base64 de l'image originale
 * @returns ImageTraitee avec base64 redimensionné + métadonnées
 * 
 * Processus:
 * 1. Validation format et taille
 * 2. Redimensionnement max 500x500px (sans déformation)
 * 3. Compression optimale (qualité 85%)
 * 4. Retourne le base64 final + métadonnées
 */
export async function redimensionnerLogo(base64Input: string): Promise<ImageTraitee> {
  try {
    // 1. Extraction et validation
    const { mime, buffer } = extraireDonneesBase64(base64Input);
    validerTaille(buffer.length);

    // 2. Traitement SVG (pas de redimensionnement, juste optimisation)
    if (mime === 'svg+xml') {
      return {
        base64: base64Input,
        type: 'svg',
        taille: buffer.length,
        dimensions: { largeur: 0, hauteur: 0 }, // SVG n'a pas de dimensions fixes
      };
    }

    // 3. Redimensionnement avec sharp
    const imageSharp = sharp(buffer);
    const metadata = await imageSharp.metadata();

    const largeurOriginale = metadata.width || 0;
    const hauteurOriginale = metadata.height || 0;

    // Redimensionner si nécessaire (fit: contain préserve les proportions)
    const imageRedimensionnee = imageSharp.resize({
      width: DIMENSION_MAX,
      height: DIMENSION_MAX,
      fit: 'contain',
      withoutEnlargement: true, // Ne pas agrandir si plus petit
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent pour PNG
    });

    // 4. Compression selon le format
    let outputBuffer: Buffer;
    let typeFinal: string;

    if (mime === 'png') {
      // PNG: optimisation sans perte
      outputBuffer = await imageRedimensionnee.png({ compressionLevel: 9 }).toBuffer();
      typeFinal = 'png';
    } else if (mime === 'webp') {
      // WEBP: compression avec perte
      outputBuffer = await imageRedimensionnee.webp({ quality: QUALITE_COMPRESSION }).toBuffer();
      typeFinal = 'webp';
    } else {
      // JPEG: conversion si nécessaire + compression
      outputBuffer = await imageRedimensionnee
        .jpeg({ quality: QUALITE_COMPRESSION, mozjpeg: true })
        .toBuffer();
      typeFinal = 'jpg';
    }

    // 5. Vérification des dimensions finales
    const metadataFinal = await sharp(outputBuffer).metadata();

    // 6. Encodage en base64
    const base64Output = `data:image/${typeFinal === 'jpg' ? 'jpeg' : typeFinal};base64,${outputBuffer.toString('base64')}`;

    logger.info(
      `Logo redimensionné: ${largeurOriginale}x${hauteurOriginale} → ${metadataFinal.width}x${metadataFinal.height} (${(outputBuffer.length / 1024).toFixed(1)} KB)`
    );

    return {
      base64: base64Output,
      type: typeFinal,
      taille: outputBuffer.length,
      dimensions: {
        largeur: metadataFinal.width || 0,
        hauteur: metadataFinal.height || 0,
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error(`Erreur traitement image: ${error.message || error}`);
    throw new AppError(
      'Erreur lors du traitement de l\'image. Vérifiez le format et la taille.',
      400,
      'TRAITEMENT_IMAGE_ERREUR'
    );
  }
}

/**
 * Valide un data URI base64 sans le traiter
 * @param base64Input Data URI à valider
 * @returns true si valide, lance une AppError sinon
 */
export function validerLogoBase64(base64Input: string): boolean {
  const { buffer } = extraireDonneesBase64(base64Input);
  validerTaille(buffer.length);
  return true;
}
