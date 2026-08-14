/**
 * ==================================
 * eLISAschool - Bibliothèque de thèmes prédéfinis CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * 10 thèmes visuels complets (one-click) pour pages publiques.
 * Chaque thème inclut : couleurs, typographie, styles de boutons,
 * fonds de sections, animations recommandées.
 */

import type { CmsTheme } from '../types/cms.types';
import type { AnimationType, AnimationEasing, HoverEffect } from '../types/cms.types';
import type { ButtonStyle, TypographyStyle, BackgroundStyle } from '../puck/shared-styles';

// ==================================
// Type thème complet
// ==================================

export interface ThemePreset {
    id: string;
    nom: string;
    description: string;
    categorie: 'scolaire' | 'moderne' | 'classique' | 'nature' | 'tech';
    thumbnail: string;
    theme: CmsTheme;
    buttonPrimary: ButtonStyle;
    buttonSecondary: ButtonStyle;
    titreStyle: TypographyStyle;
    sousTitreStyle: TypographyStyle;
    corpsStyle: TypographyStyle;
    heroBackground: BackgroundStyle;
    sectionAlternee: BackgroundStyle;
    animations: {
        entree: AnimationType;
        easing: AnimationEasing;
        hover: HoverEffect;
        duree: number;
    };
}

// ==================================
// 10 thèmes prédéfinis
// ==================================

export const THEME_PRESETS: ThemePreset[] = [
    // ─── 1. Éducation Classique ───────────────────────────────
    {
        id: 'education-classique',
        nom: 'Éducation Classique',
        description: 'Vert académique et tons chaleureux. Idéal pour écoles primaires et collèges.',
        categorie: 'scolaire',
        thumbnail: '🏫',
        theme: {
            id: '',
            nom: 'Éducation Classique',
            couleurs: {
                primaire: '#28a745',
                secondaire: '#20c997',
                accent: '#ffc107',
                fond: '#ffffff',
                texte: '#1a1a2e',
                texteClair: '#6c757d',
            },
            typographie: {
                titre: "'Poppins', sans-serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'S\'inscrire',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'lg',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'En savoir plus',
            variant: 'outline',
            size: 'md',
            borderRadius: 'lg',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'bold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'tight',
            textAlign: 'center',
            textTransform: 'none',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#28a745',
            gradientTo: '#20c997',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#f0fdf4',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'slide-up', easing: 'easeOut', hover: 'lift', duree: 0.6 },
    },

    // ─── 2. Moderne Bleu ──────────────────────────────────────
    {
        id: 'moderne-bleu',
        nom: 'Moderne Bleu',
        description: 'Bleu profond et accents orange. Look contemporain pour lycées et universités.',
        categorie: 'moderne',
        thumbnail: '🎓',
        theme: {
            id: '',
            nom: 'Moderne Bleu',
            couleurs: {
                primaire: '#1e40af',
                secondaire: '#3b82f6',
                accent: '#f97316',
                fond: '#ffffff',
                texte: '#0f172a',
                texteClair: '#64748b',
            },
            typographie: {
                titre: "'Montserrat', sans-serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Découvrir',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'full',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Contact',
            variant: 'ghost',
            size: 'md',
            borderRadius: 'full',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'extrabold',
            fontSize: '5xl',
            lineHeight: 'tight',
            letterSpacing: 'tight',
            textAlign: 'center',
            textTransform: 'uppercase',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'medium',
            fontSize: 'xl',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#1e40af',
            gradientTo: '#7c3aed',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#eff6ff',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'zoom', easing: 'easeOut', hover: 'scale', duree: 0.5 },
    },

    // ─── 3. Élégance Sombre ───────────────────────────────────
    {
        id: 'elegance-sombre',
        nom: 'Élégance Sombre',
        description: 'Palette sombre et dorée. Pour établissements prestigieux et écoles privées.',
        categorie: 'classique',
        thumbnail: '✨',
        theme: {
            id: '',
            nom: 'Élégance Sombre',
            couleurs: {
                primaire: '#b8860b',
                secondaire: '#daa520',
                accent: '#c0c0c0',
                fond: '#0a0a0a',
                texte: '#f5f5f5',
                texteClair: '#a0a0a0',
            },
            typographie: {
                titre: "'Playfair Display', serif",
                corps: "'Lato', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Postuler',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'sm',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Visiter',
            variant: 'outline',
            size: 'md',
            borderRadius: 'sm',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'serif',
            fontWeight: 'bold',
            fontSize: '5xl',
            lineHeight: 'tight',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#daa520',
        },
        sousTitreStyle: {
            fontFamily: 'serif',
            fontWeight: 'normal',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'wide',
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#c0c0c0',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
            color: '#e0e0e0',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#1a1a1a',
            gradientTo: '#0a0a0a',
            gradientDirection: 'to-b',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#141414',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'fade-in', easing: 'easeInOut', hover: 'glow', duree: 0.8 },
    },

    // ─── 4. Nature & Vert ─────────────────────────────────────
    {
        id: 'nature-vert',
        nom: 'Nature & Vert',
        description: 'Tons naturels et terreux. Pour écoles Montessori, bio, ou éco-responsables.',
        categorie: 'nature',
        thumbnail: '🌿',
        theme: {
            id: '',
            nom: 'Nature & Vert',
            couleurs: {
                primaire: '#059669',
                secondaire: '#0d9488',
                accent: '#d97706',
                fond: '#fefdf8',
                texte: '#1c1917',
                texteClair: '#78716c',
            },
            typographie: {
                titre: "'Poppins', sans-serif",
                corps: "'Source Sans Pro', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Rejoindre',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'full',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Explorer',
            variant: 'secondary',
            size: 'md',
            borderRadius: 'lg',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'semibold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#059669',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#78716c',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#059669',
            gradientTo: '#0d9488',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#f0fdf4',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'slide-up', easing: 'easeOut', hover: 'lift', duree: 0.6 },
    },

    // ─── 5. Tech Innovant ─────────────────────────────────────
    {
        id: 'tech-innovant',
        nom: 'Tech Innovant',
        description: 'Violet et cyan. Pour écoles de coding, STEM, et formations tech.',
        categorie: 'tech',
        thumbnail: '💻',
        theme: {
            id: '',
            nom: 'Tech Innovant',
            couleurs: {
                primaire: '#7c3aed',
                secondaire: '#06b6d4',
                accent: '#f43f5e',
                fond: '#0f0f23',
                texte: '#e2e8f0',
                texteClair: '#94a3b8',
            },
            typographie: {
                titre: "'Montserrat', sans-serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Commencer',
            variant: 'primary',
            size: 'xl',
            borderRadius: 'lg',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Démo',
            variant: 'outline',
            size: 'md',
            borderRadius: 'lg',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'extrabold',
            fontSize: '5xl',
            lineHeight: 'tight',
            letterSpacing: 'tight',
            textAlign: 'center',
            textTransform: 'none',
            color: '#c4b5fd',
        },
        sousTitreStyle: {
            fontFamily: 'mono',
            fontWeight: 'normal',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#67e8f9',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
            color: '#cbd5e1',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#7c3aed',
            gradientTo: '#06b6d4',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#1a1a2e',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'scale-up', easing: 'elastic', hover: 'glow', duree: 0.5 },
    },

    // ─── 6. Rose Pétillant ────────────────────────────────────
    {
        id: 'rose-petillant',
        nom: 'Rose Pétillant',
        description: 'Rose et violet. Pour écoles maternelles, crèches, et jardins d\'enfants.',
        categorie: 'scolaire',
        thumbnail: '🌸',
        theme: {
            id: '',
            nom: 'Rose Pétillant',
            couleurs: {
                primaire: '#ec4899',
                secondaire: '#a855f7',
                accent: '#fbbf24',
                fond: '#fffbf7',
                texte: '#1e1b4b',
                texteClair: '#6b7280',
            },
            typographie: {
                titre: "'Poppins', sans-serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Inscrire mon enfant',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'full',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Visiter l\'école',
            variant: 'secondary',
            size: 'md',
            borderRadius: 'full',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'bold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#ec4899',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'medium',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#ec4899',
            gradientTo: '#a855f7',
            gradientDirection: 'to-r',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#fdf2f8',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'bounce', easing: 'bounce', hover: 'scale', duree: 0.6 },
    },

    // ─── 7. Orange Dynamique ──────────────────────────────────
    {
        id: 'orange-dynamique',
        nom: 'Orange Dynamique',
        description: 'Orange énergique et bleu. Pour écoles de sport, arts, et formations professionnelles.',
        categorie: 'moderne',
        thumbnail: '🔥',
        theme: {
            id: '',
            nom: 'Orange Dynamique',
            couleurs: {
                primaire: '#ea580c',
                secondaire: '#0284c7',
                accent: '#fbbf24',
                fond: '#ffffff',
                texte: '#1c1917',
                texteClair: '#78716c',
            },
            typographie: {
                titre: "'Montserrat', sans-serif",
                corps: "'Open Sans', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'S\'inscrire',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'md',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Programmes',
            variant: 'outline',
            size: 'md',
            borderRadius: 'md',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'extrabold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'tight',
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#ea580c',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'medium',
            fontSize: 'xl',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#ea580c',
            gradientTo: '#dc2626',
            gradientDirection: 'to-r',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#fff7ed',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'slide-up', easing: 'easeOut', hover: 'lift', duree: 0.5 },
    },

    // ─── 8. Minimaliste Gris ──────────────────────────────────
    {
        id: 'minimaliste-gris',
        nom: 'Minimaliste Gris',
        description: 'Noir, blanc et gris. Design épuré pour établissements haut de gamme.',
        categorie: 'classique',
        thumbnail: '⬜',
        theme: {
            id: '',
            nom: 'Minimaliste Gris',
            couleurs: {
                primaire: '#18181b',
                secondaire: '#52525b',
                accent: '#2563eb',
                fond: '#ffffff',
                texte: '#18181b',
                texteClair: '#a1a1aa',
            },
            typographie: {
                titre: "'Inter', sans-serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Contact',
            variant: 'primary',
            size: 'md',
            borderRadius: 'md',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'À propos',
            variant: 'ghost',
            size: 'md',
            borderRadius: 'md',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'extrabold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'tighter',
            textAlign: 'left',
            textTransform: 'none',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
            color: '#71717a',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'color',
            color: '#fafafa',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#f4f4f5',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'fade-in', easing: 'easeInOut', hover: 'shadow', duree: 0.4 },
    },

    // ─── 9. Tropical Coloré ───────────────────────────────────
    {
        id: 'tropical-colore',
        nom: 'Tropical Coloré',
        description: 'Couleurs vives et chaleureuses. Pour écoles dans les Caraïbes ou Afrique tropicale.',
        categorie: 'nature',
        thumbnail: '🌴',
        theme: {
            id: '',
            nom: 'Tropical Coloré',
            couleurs: {
                primaire: '#0891b2',
                secondaire: '#059669',
                accent: '#e11d48',
                fond: '#fffbeb',
                texte: '#1e293b',
                texteClair: '#64748b',
            },
            typographie: {
                titre: "'Poppins', sans-serif",
                corps: "'Roboto', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Bienvenue',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'lg',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Découvrir',
            variant: 'secondary',
            size: 'md',
            borderRadius: 'lg',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'sans',
            fontWeight: 'bold',
            fontSize: '4xl',
            lineHeight: 'tight',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#0891b2',
        },
        sousTitreStyle: {
            fontFamily: 'sans',
            fontWeight: 'medium',
            fontSize: 'lg',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#0891b2',
            gradientTo: '#059669',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#ecfeff',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'slide-up', easing: 'spring', hover: 'lift', duree: 0.6 },
    },

    // ─── 10. Royal Violet ─────────────────────────────────────
    {
        id: 'royal-violet',
        nom: 'Royal Violet',
        description: 'Violet royal et or. Pour grandes écoles, universités prestigieuses.',
        categorie: 'classique',
        thumbnail: '👑',
        theme: {
            id: '',
            nom: 'Royal Violet',
            couleurs: {
                primaire: '#6d28d9',
                secondaire: '#4f46e5',
                accent: '#eab308',
                fond: '#fefce8',
                texte: '#1e1b4b',
                texteClair: '#6b7280',
            },
            typographie: {
                titre: "'Playfair Display', serif",
                corps: "'Inter', sans-serif",
            },
            actif: true,
            etablissementId: '',
        },
        buttonPrimary: {
            texte: 'Admission',
            variant: 'primary',
            size: 'lg',
            borderRadius: 'md',
            fullWidth: false,
        },
        buttonSecondary: {
            texte: 'Programmes',
            variant: 'outline',
            size: 'md',
            borderRadius: 'md',
            fullWidth: false,
        },
        titreStyle: {
            fontFamily: 'serif',
            fontWeight: 'bold',
            fontSize: '5xl',
            lineHeight: 'tight',
            letterSpacing: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            color: '#6d28d9',
        },
        sousTitreStyle: {
            fontFamily: 'serif',
            fontWeight: 'normal',
            fontSize: 'xl',
            lineHeight: 'relaxed',
            letterSpacing: 'wide',
            textAlign: 'center',
            textTransform: 'none',
            color: '#4f46e5',
        },
        corpsStyle: {
            fontFamily: 'sans',
            fontWeight: 'normal',
            fontSize: 'base',
            lineHeight: 'relaxed',
            letterSpacing: 'normal',
            textAlign: 'left',
            textTransform: 'none',
        },
        heroBackground: {
            type: 'gradient',
            gradientFrom: '#6d28d9',
            gradientTo: '#4f46e5',
            gradientDirection: 'to-br',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        sectionAlternee: {
            type: 'color',
            color: '#f5f3ff',
            overlay: false,
            overlayColor: '#000000',
            overlayOpacity: 0,
            imagePosition: 'cover',
        },
        animations: { entree: 'fade-in', easing: 'easeOut', hover: 'border-glow', duree: 0.7 },
    },
];

// ==================================
// Helpers
// ==================================

/**
 * Retourne un thème par son ID.
 */
export function getThemePreset(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find(t => t.id === id);
}

/**
 * Retourne les thèmes par catégorie.
 */
export function getThemesByCategorie(categorie: ThemePreset['categorie']): ThemePreset[] {
    return THEME_PRESETS.filter(t => t.categorie === categorie);
}

/**
 * Applique un thème preset à un objet CmsTheme partiel.
 */
export function appliquerThemePreset(preset: ThemePreset): Partial<CmsTheme> {
    return {
        couleurs: { ...preset.theme.couleurs },
        typographie: { ...preset.theme.typographie },
    };
}

/**
 * Labels des catégories pour l'UI.
 */
export const CATEGORIE_LABELS: Record<ThemePreset['categorie'], string> = {
    scolaire: 'Scolaire',
    moderne: 'Moderne',
    classique: 'Classique',
    nature: 'Nature',
    tech: 'Tech',
};

/**
 * Couleurs de catégorie pour l'UI.
 */
export const CATEGORIE_COLORS: Record<ThemePreset['categorie'], string> = {
    scolaire: '#28a745',
    moderne: '#3b82f6',
    classique: '#b8860b',
    nature: '#059669',
    tech: '#7c3aed',
};
