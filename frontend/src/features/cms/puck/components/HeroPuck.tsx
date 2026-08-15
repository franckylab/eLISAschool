/**
 * ==================================
 * eLISAschool - Puck Component: HeroSection
 * ==================================
 */
import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type HeroProps = {
    titre: string;
    surtitre: string;
    description: string;
    imageFond: string;
    boutons: { _id: string; label: string; url: string; principal: boolean; nouvelOnglet: boolean }[];
    styleConfig?: any;
};

export const HeroPuck: ComponentConfig<HeroProps> = {
    fields: {
        titre: { type: 'text', contentEditable: true },
        surtitre: { type: 'text', contentEditable: true },
        description: { type: 'textarea', contentEditable: true },
        imageFond: { type: 'text' },
        boutons: {
            type: 'array',
            arrayFields: {
                label: { type: 'text' },
                url: { type: 'text' },
                principal: { type: 'boolean' },
                nouvelOnglet: { type: 'boolean' },
            },
        },
    },
    defaultProps: {
        titre: 'Bienvenue',
        surtitre: '',
        description: '',
        imageFond: '',
        boutons: [],
    },
    render({ titre, surtitre, description, imageFond, boutons, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig} className="relative flex items-center justify-center overflow-hidden rounded-2xl text-center text-white"
                style={!styleConfig ? {
                    minHeight: 'clamp(200px, 30vh, 400px)',
                    background: imageFond
                        ? `url(${imageFond}) center/cover no-repeat`
                        : 'linear-gradient(135deg, var(--cms-primary, #22c55e), var(--cms-secondary, #3b82f6))',
                } : undefined}
            >
                {imageFond && !styleConfig?.background && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative z-10 mx-auto max-w-3xl px-6 space-y-3">
                    {surtitre && <p className="text-xs font-medium uppercase tracking-wider opacity-80">{surtitre}</p>}
                    <h1 className="text-3xl font-bold leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                        {titre || 'Titre du hero'}
                    </h1>
                    {description && <p className="mx-auto max-w-xl opacity-90">{description}</p>}
                    {boutons.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 pt-3">
                            {boutons.map((btn, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold"
                                    style={{
                                        backgroundColor: btn.principal ? 'var(--cms-accent, #3b82f6)' : 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                    }}
                                >
                                    {btn.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </SectionWrapper>
        );
    },
};
