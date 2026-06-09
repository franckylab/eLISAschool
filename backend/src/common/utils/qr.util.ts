/**
 * ==================================
 * eLISAschool - Utilitaire de génération QR Code
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import QRCode from 'qrcode';

/**
 * Options de génération de QR Code
 */
export interface QRCodeOptions {
    /** Largeur du QR code en pixels */
    width?: number;
    /** Marge autour du QR code */
    margin?: number;
    /** Niveau de correction d'erreur (L, M, Q, H) */
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    /** Couleur sombre (premier plan) */
    darkColor?: string;
    /** Couleur claire (arrière-plan) */
    lightColor?: string;
}

/**
 * Génère un QR Code en base64 (format Data URL)
 * @param data - Données à encoder dans le QR code
 * @param options - Options de génération
 * @returns Data URL du QR code (image/png en base64)
 */
export async function generateQRCodeDataURL(
    data: string,
    options: QRCodeOptions = {}
): Promise<string> {
    const {
        width = 256,
        margin = 2,
        errorCorrectionLevel = 'M',
        darkColor = '#000000',
        lightColor = '#ffffff',
    } = options;

    return await QRCode.toDataURL(data, {
        width,
        margin,
        errorCorrectionLevel,
        color: {
            dark: darkColor,
            light: lightColor,
        },
    });
}

/**
 * Génère un QR Code sous forme de Buffer (PNG)
 * @param data - Données à encoder dans le QR code
 * @param options - Options de génération
 * @returns Buffer contenant l'image PNG
 */
export async function generateQRCodeBuffer(
    data: string,
    options: QRCodeOptions = {}
): Promise<Buffer> {
    const {
        width = 256,
        margin = 2,
        errorCorrectionLevel = 'M',
        darkColor = '#000000',
        lightColor = '#ffffff',
    } = options;

    return await QRCode.toBuffer(data, {
        width,
        margin,
        errorCorrectionLevel,
        color: {
            dark: darkColor,
            light: lightColor,
        },
    });
}

/**
 * Génère un QR Code sous forme de chaîne SVG
 * @param data - Données à encoder dans le QR code
 * @param options - Options de génération
 * @returns Chaîne SVG du QR code
 */
export async function generateQRCodeSVG(
    data: string,
    options: QRCodeOptions = {}
): Promise<string> {
    const {
        width = 256,
        margin = 2,
        errorCorrectionLevel = 'M',
        darkColor = '#000000',
        lightColor = '#ffffff',
    } = options;

    return await QRCode.toString(data, {
        type: 'svg',
        width,
        margin,
        errorCorrectionLevel,
        color: {
            dark: darkColor,
            light: lightColor,
        },
    });
}

/**
 * Génère un QR Code pour un utilisateur eLISAschool
 * @param userId - ID de l'utilisateur
 * @param type - Type de QR code (card, access, cantine, transport)
 * @returns Data URL du QR code
 */
export async function generateUserQRCode(
    userId: string,
    type: 'card' | 'access' | 'cantine' | 'transport' = 'card'
): Promise<string> {
    // Format: ELISA:{type}:{userId}:{timestamp}
    const timestamp = Date.now();
    const data = `ELISA:${type}:${userId}:${timestamp}`;

    return await generateQRCodeDataURL(data, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H', // Haute correction pour cartes physiques
    });
}

export default {
    generateQRCodeDataURL,
    generateQRCodeBuffer,
    generateQRCodeSVG,
    generateUserQRCode,
};
