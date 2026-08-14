/**
 * ==================================
 * eLISAschool - Panneau SEO CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Panneau SEO pour l'éditeur de pages CMS.
 * Analyse en temps réel : titre, meta description, OG, score.
 */

import { useState, useEffect } from 'react';

interface SeoData {
    metaTitle: string;
    metaDescription: string;
    slug: string;
    ogImage?: string;
    canonicalUrl?: string;
    noindex: boolean;
    structuredData?: string;
}

interface SeoPanelProps {
    data: SeoData;
    onChange: (data: Partial<SeoData>) => void;
    codeEtablissement: string;
}

// Limites SEO recommandées
const LIMITS = {
    metaTitle: { min: 30, max: 60, ideal: 55 },
    metaDescription: { min: 120, max: 160, ideal: 155 },
    slug: { max: 75 },
};

export function SeoPanel({ data, onChange, codeEtablissement }: SeoPanelProps) {
    const [score, setScore] = useState(0);

    useEffect(() => {
        calculateScore();
    }, [data]);

    function calculateScore() {
        let s = 0;
        const total = 100;

        // Titre (30 pts)
        if (data.metaTitle.length >= LIMITS.metaTitle.min && data.metaTitle.length <= LIMITS.metaTitle.max) s += 30;
        else if (data.metaTitle.length > 0) s += 15;

        // Description (25 pts)
        if (data.metaDescription.length >= LIMITS.metaDescription.min && data.metaDescription.length <= LIMITS.metaDescription.max) s += 25;
        else if (data.metaDescription.length > 0) s += 12;

        // Slug (15 pts)
        if (data.slug && data.slug.length > 0 && data.slug.length <= LIMITS.slug.max) s += 15;
        else if (data.slug) s += 8;

        // OG Image (15 pts)
        if (data.ogImage) s += 15;

        // Pas noindex (15 pts)
        if (!data.noindex) s += 15;

        setScore(Math.min(s, total));
    }

    function getScoreColor() {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    }

    function getScoreLabel() {
        if (score >= 80) return 'Excellent';
        if (score >= 50) return 'Acceptable';
        return 'À améliorer';
    }

    function getCharCountColor(current: number, min: number, max: number) {
        if (current >= min && current <= max) return 'text-green-600';
        if (current > max) return 'text-red-600';
        return 'text-yellow-600';
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Score SEO */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <div className={`text-3xl font-bold ${getScoreColor()}`}>{score}</div>
                <div>
                    <div className={`text-sm font-semibold ${getScoreColor()}`}>{getScoreLabel()}</div>
                    <div className="text-xs text-gray-500">Score SEO</div>
                </div>
                <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                    <div
                        className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* Preview Google */}
            <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 text-xs font-semibold text-gray-500 uppercase">Aperçu Google</div>
                <div className="text-blue-800 text-base font-medium truncate">
                    {data.metaTitle || 'Titre de la page'}
                </div>
                <div className="text-green-700 text-xs truncate">
                    {codeEtablissement ? `/${codeEtablissement}/${data.slug || 'slug'}` : '/page'}
                </div>
                <div className="text-gray-600 text-xs line-clamp-2 mt-0.5">
                    {data.metaDescription || 'Description de la page pour les résultats de recherche...'}
                </div>
            </div>

            {/* Titre SEO */}
            <div>
                <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>Titre SEO</span>
                    <span className={getCharCountColor(data.metaTitle.length, LIMITS.metaTitle.min, LIMITS.metaTitle.max)}>
                        {data.metaTitle.length}/{LIMITS.metaTitle.ideal}
                    </span>
                </label>
                <input
                    type="text"
                    value={data.metaTitle}
                    onChange={(e) => onChange({ metaTitle: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Titre optimisé pour le SEO"
                />
            </div>

            {/* Meta Description */}
            <div>
                <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>Meta description</span>
                    <span className={getCharCountColor(data.metaDescription.length, LIMITS.metaDescription.min, LIMITS.metaDescription.max)}>
                        {data.metaDescription.length}/{LIMITS.metaDescription.ideal}
                    </span>
                </label>
                <textarea
                    value={data.metaDescription}
                    onChange={(e) => onChange({ metaDescription: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Description concise et attrayante (120-160 caractères)"
                />
            </div>

            {/* Slug */}
            <div>
                <label className="mb-1 text-xs font-medium text-gray-700">Slug URL</label>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">/{codeEtablissement}/</span>
                    <input
                        type="text"
                        value={data.slug}
                        onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="ma-page"
                    />
                </div>
            </div>

            {/* Options avancées */}
            <details className="rounded-lg border border-gray-200">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-gray-600">
                    Options avancées
                </summary>
                <div className="space-y-3 p-3 pt-0">
                    {/* OG Image */}
                    <div>
                        <label className="mb-1 text-xs font-medium text-gray-700">Image OG (réseaux sociaux)</label>
                        <input
                            type="text"
                            value={data.ogImage || ''}
                            onChange={(e) => onChange({ ogImage: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="https://... ou /medias/image.jpg"
                        />
                    </div>

                    {/* Canonical URL */}
                    <div>
                        <label className="mb-1 text-xs font-medium text-gray-700">URL canonique</label>
                        <input
                            type="text"
                            value={data.canonicalUrl || ''}
                            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="https://monsite.com/page (optionnel)"
                        />
                    </div>

                    {/* Noindex */}
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={data.noindex}
                            onChange={(e) => onChange({ noindex: e.target.checked })}
                            className="rounded border-gray-300"
                        />
                        Noindex (ne pas référencer)
                    </label>
                </div>
            </details>
        </div>
    );
}
