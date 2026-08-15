/**
 * ==================================
 * eLISAschool - Section Preview Thumbnails
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Miniatures visuelles pour chaque section dans le navigateur.
 * Affiche un aperçu simplifié de la structure de la section
 * avec icônes, couleurs et layout preview.
 */

import React, { useMemo } from 'react';
import {
    Type, Image as ImageIcon, Layout, Grid3X3, Users, BarChart3,
    Mail, Video, FileText, Download, Newspaper, Clock, Heart,
    Star, HelpCircle, ArrowRight, Palette, Minus, Code,
    Quote, List, MousePointerClick, MapPin, Phone,
} from 'lucide-react';

// ==================================
// Types
// ==================================

export interface SectionThumbnailProps {
    type: string;
    props: Record<string, any>;
    width?: number;
    height?: number;
    dark?: boolean;
    selected?: boolean;
}

// ==================================
// Section Layout Configs — Visual representations
// ==================================

interface SectionLayout {
    bgGradient: string;
    bgGradientDark: string;
    icon: React.ReactNode;
    accentColor: string;
    label: string;
    layout: 'hero' | 'text' | 'grid' | 'cards' | 'list' | 'media' | 'form' | 'mixed' | 'minimal' | 'team' | 'stats' | 'testimonial' | 'faq' | 'partner' | 'separator';
}

const SECTION_LAYOUTS: Record<string, SectionLayout> = {
    HeroSection: {
        bgGradient: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
        bgGradientDark: 'linear-gradient(135deg, #667eea33 0%, #764ba233 100%)',
        icon: <Layout className="cms-thumb__icon" />,
        accentColor: '#667eea',
        label: 'Hero',
        layout: 'hero',
    },
    TexteSection: {
        bgGradient: 'linear-gradient(135deg, #6366f122 0%, #8b5cf622 100%)',
        bgGradientDark: 'linear-gradient(135deg, #6366f133 0%, #8b5cf633 100%)',
        icon: <Type className="cms-thumb__icon" />,
        accentColor: '#6366f1',
        label: 'Texte',
        layout: 'text',
    },
    GalerieSection: {
        bgGradient: 'linear-gradient(135deg, #8b5cf622 0%, #a78bfa22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #8b5cf633 0%, #a78bfa33 100%)',
        icon: <Grid3X3 className="cms-thumb__icon" />,
        accentColor: '#8b5cf6',
        label: 'Galerie',
        layout: 'grid',
    },
    CarteInfosSection: {
        bgGradient: 'linear-gradient(135deg, #06b6d422 0%, #22d3ee22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #06b6d433 0%, #22d3ee33 100%)',
        icon: <Star className="cms-thumb__icon" />,
        accentColor: '#06b6d4',
        label: 'Carte Infos',
        layout: 'cards',
    },
    TemoignagesSection: {
        bgGradient: 'linear-gradient(135deg, #f59e0b22 0%, #fbbf2422 100%)',
        bgGradientDark: 'linear-gradient(135deg, #f59e0b33 0%, #fbbf2433 100%)',
        icon: <Quote className="cms-thumb__icon" />,
        accentColor: '#f59e0b',
        label: 'Témoignages',
        layout: 'testimonial',
    },
    ChiffresClesSection: {
        bgGradient: 'linear-gradient(135deg, #10b98122 0%, #34d39922 100%)',
        bgGradientDark: 'linear-gradient(135deg, #10b98133 0%, #34d39933 100%)',
        icon: <BarChart3 className="cms-thumb__icon" />,
        accentColor: '#10b981',
        label: 'Chiffres',
        layout: 'stats',
    },
    EquipeSection: {
        bgGradient: 'linear-gradient(135deg, #ec489922 0%, #f472b622 100%)',
        bgGradientDark: 'linear-gradient(135deg, #ec489933 0%, #f472b633 100%)',
        icon: <Users className="cms-thumb__icon" />,
        accentColor: '#ec4899',
        label: 'Équipe',
        layout: 'team',
    },
    FormulaireSection: {
        bgGradient: 'linear-gradient(135deg, #ef444422 0%, #f8717122 100%)',
        bgGradientDark: 'linear-gradient(135deg, #ef444433 0%, #f8717133 100%)',
        icon: <Mail className="cms-thumb__icon" />,
        accentColor: '#ef4444',
        label: 'Formulaire',
        layout: 'form',
    },
    CarteSection: {
        bgGradient: 'linear-gradient(135deg, #14b8a622 0%, #2dd4bf22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #14b8a633 0%, #2dd4bf33 100%)',
        icon: <MapPin className="cms-thumb__icon" />,
        accentColor: '#14b8a6',
        label: 'Carte',
        layout: 'media',
    },
    VideoSection: {
        bgGradient: 'linear-gradient(135deg, #f43f5e22 0%, #fb718522 100%)',
        bgGradientDark: 'linear-gradient(135deg, #f43f5e33 0%, #fb718533 100%)',
        icon: <Video className="cms-thumb__icon" />,
        accentColor: '#f43f5e',
        label: 'Vidéo',
        layout: 'media',
    },
    TelechargementsSection: {
        bgGradient: 'linear-gradient(135deg, #84cc1622 0%, #a3e63522 100%)',
        bgGradientDark: 'linear-gradient(135deg, #84cc1633 0%, #a3e63533 100%)',
        icon: <Download className="cms-thumb__icon" />,
        accentColor: '#84cc16',
        label: 'Fichiers',
        layout: 'list',
    },
    ActualitesSection: {
        bgGradient: 'linear-gradient(135deg, #0ea5e922 0%, #38bdf822 100%)',
        bgGradientDark: 'linear-gradient(135deg, #0ea5e933 0%, #38bdf833 100%)',
        icon: <Newspaper className="cms-thumb__icon" />,
        accentColor: '#0ea5e9',
        label: 'Actualités',
        layout: 'list',
    },
    HorairesSection: {
        bgGradient: 'linear-gradient(135deg, #f97316aa 0%, #fb923c22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #f9731633 0%, #fb923c33 100%)',
        icon: <Clock className="cms-thumb__icon" />,
        accentColor: '#f97316',
        label: 'Horaires',
        layout: 'list',
    },
    PartenairesSection: {
        bgGradient: 'linear-gradient(135deg, #a855f722 0%, #c084fc22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #a855f733 0%, #c084fc33 100%)',
        icon: <Heart className="cms-thumb__icon" />,
        accentColor: '#a855f7',
        label: 'Partenaires',
        layout: 'partner',
    },
    FaqSection: {
        bgGradient: 'linear-gradient(135deg, #3b82f622 0%, #60a5fa22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #3b82f633 0%, #60a5fa33 100%)',
        icon: <HelpCircle className="cms-thumb__icon" />,
        accentColor: '#3b82f6',
        label: 'FAQ',
        layout: 'faq',
    },
    AppelActionSection: {
        bgGradient: 'linear-gradient(135deg, #f43f5e22 0%, #e11d4822 100%)',
        bgGradientDark: 'linear-gradient(135deg, #f43f5e33 0%, #e11d4833 100%)',
        icon: <MousePointerClick className="cms-thumb__icon" />,
        accentColor: '#f43f5e',
        label: 'CTA',
        layout: 'hero',
    },
    SeparateurSection: {
        bgGradient: 'linear-gradient(135deg, #94a3b822 0%, #cbd5e122 100%)',
        bgGradientDark: 'linear-gradient(135deg, #94a3b833 0%, #cbd5e133 100%)',
        icon: <Minus className="cms-thumb__icon" />,
        accentColor: '#94a3b8',
        label: 'Séparateur',
        layout: 'separator',
    },
    HtmlCustomSection: {
        bgGradient: 'linear-gradient(135deg, #64748b22 0%, #94a3b822 100%)',
        bgGradientDark: 'linear-gradient(135deg, #64748b33 0%, #94a3b833 100%)',
        icon: <Code className="cms-thumb__icon" />,
        accentColor: '#64748b',
        label: 'HTML',
        layout: 'minimal',
    },
    NewsletterSection: {
        bgGradient: 'linear-gradient(135deg, #8b5cf622 0%, #a78bfa22 100%)',
        bgGradientDark: 'linear-gradient(135deg, #8b5cf633 0%, #a78bfa33 100%)',
        icon: <Mail className="cms-thumb__icon" />,
        accentColor: '#8b5cf6',
        label: 'Newsletter',
        layout: 'form',
    },
};

const DEFAULT_LAYOUT: SectionLayout = {
    bgGradient: 'linear-gradient(135deg, #94a3b822 0%, #cbd5e122 100%)',
    bgGradientDark: 'linear-gradient(135deg, #94a3b833 0%, #cbd5e133 100%)',
    icon: <Palette className="cms-thumb__icon" />,
    accentColor: '#94a3b8',
    label: 'Section',
    layout: 'minimal',
};

// ==================================
// Mini Layout Renderers — SVG-like visual previews
// ==================================

function HeroLayout({ color, dark }: { color: string; dark: boolean }) {
    const textBg = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const subtextBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
    return (
        <div className="cms-thumb__layout">
            <div className="cms-thumb__layout-row" style={{ justifyContent: 'center', gap: '2px', marginBottom: '2px' }}>
                <div className="cms-thumb__block" style={{ width: '60%', height: '4px', background: textBg, borderRadius: '2px' }} />
            </div>
            <div className="cms-thumb__layout-row" style={{ justifyContent: 'center', gap: '1px', marginBottom: '3px' }}>
                <div className="cms-thumb__block" style={{ width: '40%', height: '2px', background: subtextBg, borderRadius: '1px' }} />
            </div>
            <div className="cms-thumb__layout-row" style={{ justifyContent: 'center' }}>
                <div className="cms-thumb__block" style={{ width: '24%', height: '5px', background: color, borderRadius: '2px', opacity: 0.7 }} />
            </div>
        </div>
    );
}

function TextLayout({ dark }: { dark: boolean }) {
    const lineBg = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    return (
        <div className="cms-thumb__layout" style={{ gap: '2px' }}>
            <div className="cms-thumb__block" style={{ width: '45%', height: '3px', background: lineBg, borderRadius: '1px' }} />
            <div className="cms-thumb__block" style={{ width: '90%', height: '2px', background: lineBg, borderRadius: '1px', opacity: 0.6 }} />
            <div className="cms-thumb__block" style={{ width: '80%', height: '2px', background: lineBg, borderRadius: '1px', opacity: 0.5 }} />
            <div className="cms-thumb__block" style={{ width: '70%', height: '2px', background: lineBg, borderRadius: '1px', opacity: 0.4 }} />
        </div>
    );
}

function GridLayout({ color, dark }: { color: string; dark: boolean }) {
    const cellBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
    return (
        <div className="cms-thumb__layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="cms-thumb__block" style={{ height: '8px', background: i === 0 ? color + '30' : cellBg, borderRadius: '1px', border: i === 0 ? `1px solid ${color}40` : 'none' }} />
            ))}
        </div>
    );
}

function CardsLayout({ color, dark }: { color: string; dark: boolean }) {
    const cardBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    return (
        <div className="cms-thumb__layout" style={{ display: 'flex', gap: '2px' }}>
            {[0, 1, 2].map(i => (
                <div key={i} className="cms-thumb__block" style={{ flex: 1, height: '16px', background: cardBg, borderRadius: '2px', borderLeft: `2px solid ${i === 0 ? color : color + '40'}`, padding: '2px' }}>
                    <div style={{ width: '60%', height: '2px', background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderRadius: '1px', marginBottom: '1px' }} />
                    <div style={{ width: '80%', height: '1.5px', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: '1px' }} />
                </div>
            ))}
        </div>
    );
}

function FormLayout({ color, dark }: { color: string; dark: boolean }) {
    const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    const borderCol = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    return (
        <div className="cms-thumb__layout" style={{ gap: '2px', alignItems: 'center' }}>
            <div className="cms-thumb__block" style={{ width: '70%', height: '4px', background: inputBg, borderRadius: '2px', border: `0.5px solid ${borderCol}` }} />
            <div className="cms-thumb__block" style={{ width: '70%', height: '8px', background: inputBg, borderRadius: '2px', border: `0.5px solid ${borderCol}` }} />
            <div className="cms-thumb__block" style={{ width: '30%', height: '5px', background: color, borderRadius: '2px', opacity: 0.7 }} />
        </div>
    );
}

function ListLayout({ dark }: { dark: boolean }) {
    const lineBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const dotBg = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    return (
        <div className="cms-thumb__layout" style={{ gap: '2px' }}>
            {[0, 1, 2].map(i => (
                <div key={i} className="cms-thumb__layout-row" style={{ gap: '2px', alignItems: 'center' }}>
                    <div className="cms-thumb__block" style={{ width: '3px', height: '3px', borderRadius: '50%', background: dotBg, flexShrink: 0 }} />
                    <div className="cms-thumb__block" style={{ width: `${75 - i * 10}%`, height: '2px', background: lineBg, borderRadius: '1px' }} />
                </div>
            ))}
        </div>
    );
}

function MediaLayout({ color, dark }: { color: string; dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    return (
        <div className="cms-thumb__layout">
            <div className="cms-thumb__block" style={{ width: '100%', height: '16px', background: bg, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, opacity: 0.5 }} />
            </div>
        </div>
    );
}

function TeamLayout({ color, dark }: { color: string; dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
    return (
        <div className="cms-thumb__layout" style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
            {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <div className="cms-thumb__block" style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? color + '40' : bg }} />
                    <div className="cms-thumb__block" style={{ width: '8px', height: '1.5px', background: bg, borderRadius: '1px' }} />
                </div>
            ))}
        </div>
    );
}

function StatsLayout({ color, dark }: { color: string; dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    return (
        <div className="cms-thumb__layout" style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <div className="cms-thumb__block" style={{ width: '14px', height: '4px', background: color, borderRadius: '1px', opacity: 0.3 + i * 0.2 }} />
                    <div className="cms-thumb__block" style={{ width: '10px', height: '1.5px', background: bg, borderRadius: '1px' }} />
                </div>
            ))}
        </div>
    );
}

function TestimonialLayout({ color, dark }: { color: string; dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    const quoteBg = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="cms-thumb__layout" style={{ gap: '2px', alignItems: 'center' }}>
            <div className="cms-thumb__block" style={{ width: '4px', height: '4px', borderRadius: '50%', background: color + '40' }} />
            <div className="cms-thumb__block" style={{ width: '80%', height: '6px', background: quoteBg, borderRadius: '2px', borderLeft: `1.5px solid ${color}40` }} />
            <div className="cms-thumb__block" style={{ width: '30%', height: '2px', background: bg, borderRadius: '1px' }} />
        </div>
    );
}

function FaqLayout({ dark }: { dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    const borderCol = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    return (
        <div className="cms-thumb__layout" style={{ gap: '1px' }}>
            {[0, 1, 2].map(i => (
                <div key={i} className="cms-thumb__block" style={{ width: '90%', height: '5px', background: bg, borderRadius: '1px', borderBottom: `0.5px solid ${borderCol}`, display: 'flex', alignItems: 'center', padding: '0 2px', justifyContent: 'space-between' }}>
                    <div style={{ width: '50%', height: '1.5px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: '1px' }} />
                    <div style={{ width: '2px', height: '2px', background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', borderRadius: '50%' }} />
                </div>
            ))}
        </div>
    );
}

function PartnerLayout({ color, dark }: { color: string; dark: boolean }) {
    const bg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    return (
        <div className="cms-thumb__layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2px' }}>
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="cms-thumb__block" style={{ height: '7px', background: bg, borderRadius: '1px', border: `0.5px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` }} />
            ))}
        </div>
    );
}

function SeparatorLayout({ dark }: { dark: boolean }) {
    const lineBg = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    return (
        <div className="cms-thumb__layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="cms-thumb__block" style={{ width: '60%', height: '1px', background: lineBg }} />
        </div>
    );
}

// ==================================
// Layout Router
// ==================================

function LayoutRenderer({ layout, color, dark }: { layout: string; color: string; dark: boolean }) {
    switch (layout) {
        case 'hero': return <HeroLayout color={color} dark={dark} />;
        case 'text': return <TextLayout dark={dark} />;
        case 'grid': return <GridLayout color={color} dark={dark} />;
        case 'cards': return <CardsLayout color={color} dark={dark} />;
        case 'form': return <FormLayout color={color} dark={dark} />;
        case 'list': return <ListLayout dark={dark} />;
        case 'media': return <MediaLayout color={color} dark={dark} />;
        case 'team': return <TeamLayout color={color} dark={dark} />;
        case 'stats': return <StatsLayout color={color} dark={dark} />;
        case 'testimonial': return <TestimonialLayout color={color} dark={dark} />;
        case 'faq': return <FaqLayout dark={dark} />;
        case 'partner': return <PartnerLayout color={color} dark={dark} />;
        case 'separator': return <SeparatorLayout dark={dark} />;
        default: return <TextLayout dark={dark} />;
    }
}

// ==================================
// Composant principal — SectionPreviewThumbnail
// ==================================

export function SectionPreviewThumbnail({
    type,
    props,
    width = 80,
    height = 36,
    dark = false,
    selected = false,
}: SectionThumbnailProps) {
    const config = useMemo(() => {
        const layout = SECTION_LAYOUTS[type] || DEFAULT_LAYOUT;
        // Detect content hints from props
        const hasImage = !!(props?.imageUrl || props?.image);
        const hasButton = !!(props?.boutonTexte || props?.boutonLabel);
        const hasTitle = !!(props?.titre || props?.surtitre);
        return { ...layout, hasImage, hasButton, hasTitle };
    }, [type, props]);

    const bg = dark ? config.bgGradientDark : config.bgGradient;

    return (
        <div
            className={`cms-section-thumb ${selected ? 'cms-section-thumb--selected' : ''}`}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                background: bg,
                borderRadius: '4px',
                border: selected ? `1.5px solid ${config.accentColor}` : `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                padding: '3px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                position: 'relative',
            }}
            aria-label={`Aperçu ${config.label}`}
        >
            <LayoutRenderer layout={config.layout} color={config.accentColor} dark={dark} />
        </div>
    );
}

// ==================================
// SectionPreviewCard — Version plus grande pour hover tooltip
// ==================================

export function SectionPreviewCard({
    type,
    props,
    dark = false,
}: {
    type: string;
    props: Record<string, any>;
    dark?: boolean;
}) {
    const config = SECTION_LAYOUTS[type] || DEFAULT_LAYOUT;
    const bg = dark ? config.bgGradientDark : config.bgGradient;

    return (
        <div
            className="cms-section-preview-card"
            style={{
                width: '180px',
                background: dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
                borderRadius: '8px',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: dark
                    ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
                    : '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Preview area */}
            <div style={{
                padding: '8px',
                background: bg,
                borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            }}>
                <SectionPreviewThumbnail
                    type={type}
                    props={props}
                    width={164}
                    height={60}
                    dark={dark}
                />
            </div>
            {/* Info bar */}
            <div style={{
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <span style={{ color: config.accentColor, display: 'flex' }}>
                    {config.icon}
                </span>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                    letterSpacing: '0.02em',
                }}>
                    {config.label}
                </span>
                <span style={{
                    fontSize: '9px',
                    color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    marginLeft: 'auto',
                }}>
                    {type.replace(/Section$/, '')}
                </span>
            </div>
        </div>
    );
}

export default SectionPreviewThumbnail;
