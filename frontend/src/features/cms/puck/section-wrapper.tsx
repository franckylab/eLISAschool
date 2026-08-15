/**
 * ==================================
 * eLISAschool - SectionWrapper pour composants Puck
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Wrapper universel qui applique le styleConfig (background, spacing,
 * border, shadow, typography, animations) aux composants Puck.
 * Chaque composant Puck wrapp son contenu dans <SectionWrapper>.
 */

import React, { type ReactNode, useMemo } from 'react';
import {
    type SectionStyleConfig,
    mergeSectionStyles,
    typographyToCSS,
} from './shared-styles';

// ==================================
// Types
// ==================================

interface SectionWrapperProps {
    styleConfig?: SectionStyleConfig;
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    as?: 'div' | 'section' | 'article';
}

// ==================================
// Wrapper principal
// ==================================

/**
 * Applique les styles de section (background, spacing, border, shadow)
 * sur le conteneur racine, et la typographie sur les enfants texte.
 *
 * Usage dans un composant Puck :
 * ```tsx
 * render({ styleConfig, ...props }) {
 *     return (
 *         <SectionWrapper styleConfig={styleConfig}>
 *             <h1>...</h1>
 *             <p>...</p>
 *         </SectionWrapper>
 *     );
 * }
 * ```
 */
export function SectionWrapper({ styleConfig, children, className = '', style: baseStyle, as: Tag = 'div' }: SectionWrapperProps) {
    const containerStyle = useMemo(() => {
        // Styles de base du composant (fallback si pas de styleConfig)
        const base = baseStyle || {};
        if (!styleConfig) return base;
        // Fusionner : styles de base < styleConfig (la personnalisation écrase les défauts)
        return { ...base, ...mergeSectionStyles(styleConfig) };
    }, [styleConfig, baseStyle]);

    const typographyStyle = useMemo(() => {
        if (!styleConfig?.typography) return {};
        return typographyToCSS(styleConfig.typography);
    }, [styleConfig?.typography]);

    return (
        <Tag
            className={className || undefined}
            style={{
                ...containerStyle,
                // La typographie s'applique au conteneur — les enfants héritent
                ...(Object.keys(typographyStyle).length > 0 ? typographyStyle : {}),
            }}
        >
            {children}
        </Tag>
    );
}

/**
 * Hook utilitaire pour extraire le styleConfig des props Puck.
 * Gère le cas où styleConfig est absent ou partiel.
 */
export function useSectionStyle(props: Record<string, any>): SectionStyleConfig | undefined {
    const styleConfig = props.styleConfig as SectionStyleConfig | undefined;
    if (!styleConfig || Object.keys(styleConfig).length === 0) return undefined;
    return styleConfig;
}

/**
 * Helper pour fusionner les styles inline d'un composant Puck
 * avec le styleConfig de personnalisation.
 */
export function mergeWithStyleConfig(
    baseStyle: React.CSSProperties,
    styleConfig?: SectionStyleConfig,
): React.CSSProperties {
    if (!styleConfig) return baseStyle;
    const configStyles = mergeSectionStyles(styleConfig);
    return { ...baseStyle, ...configStyles };
}
