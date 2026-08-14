/**
 * ==================================
 * eLISAschool - Métriques de contenu CMS + Guide qualité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Compteur de mots/caractères par section et global.
 * Score de qualité de contenu (lisibilité, SEO, accessibilité).
 * Recommandations contextuelles.
 */

import { useMemo, useState } from 'react';
import { BarChart3, Type, FileText, AlertCircle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import type { Data } from '@puckeditor/core';

// ==================================
// Types
// ==================================

interface SectionMetrics {
    index: number;
    type: string;
    titre: string;
    mots: number;
    caracteres: number;
    phrases: number;
    tempsLecture: number; // secondes
}

interface ContentQualityScore {
    global: number; // 0-100
    lisibilite: number;
    seo: number;
    richesse: number;
    structure: number;
    recommandations: Recommandation[];
}

interface Recommandation {
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    categorie: 'contenu' | 'seo' | 'structure' | 'accessibilite';
}

interface ContentMetricsProps {
    puckData: Data;
}

// ==================================
// Extraction de texte depuis les props Puck
// ==================================

const TEXT_FIELDS = ['titre', 'sousTitre', 'texte', 'description', 'contenu', 'resume', 'accroche', 'ctaTexte', 'nom', 'poste', 'citation'];

function extraireTexteProps(props: Record<string, any>): string[] {
    const textes: string[] = [];
    for (const field of TEXT_FIELDS) {
        if (typeof props[field] === 'string' && props[field].trim()) {
            textes.push(props[field].trim());
        }
    }
    // Champs riches (HTML)
    if (typeof props.contenuHtml === 'string' && props.contenuHtml.trim()) {
        textes.push(props.contenuHtml.replace(/<[^>]*>/g, ' ').trim());
    }
    // Items (FAQ, équipe, etc.)
    if (Array.isArray(props.items)) {
        for (const item of props.items) {
            if (typeof item === 'object' && item) {
                for (const v of Object.values(item)) {
                    if (typeof v === 'string' && v.trim().length > 2) {
                        textes.push(v.trim());
                    }
                }
            }
        }
    }
    return textes;
}

function compterMots(texte: string): number {
    return texte.split(/\s+/).filter(w => w.length > 0).length;
}

function compterPhrases(texte: string): number {
    return texte.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

// ==================================
// Hook useContentMetrics
// ==================================

export function useContentMetrics(puckData: Data) {
    return useMemo(() => {
        const sections: SectionMetrics[] = [];
        let totalMots = 0;
        let totalCaracteres = 0;
        let totalPhrases = 0;
        let typesUtilises = new Set<string>();

        for (let i = 0; i < puckData.content.length; i++) {
            const item = puckData.content[i];
            const textes = extraireTexteProps(item.props as Record<string, any>);
            const texteComplet = textes.join(' ');
            const mots = compterMots(texteComplet);
            const caracteres = texteComplet.length;
            const phrases = compterPhrases(texteComplet);

            sections.push({
                index: i,
                type: item.type,
                titre: (item.props as any)?.titre || item.type,
                mots,
                caracteres,
                phrases,
                tempsLecture: Math.max(1, Math.round(mots / 3.5)), // ~200 mots/min en français
            });

            totalMots += mots;
            totalCaracteres += caracteres;
            totalPhrases += phrases;
            typesUtilises.add(item.type);
        }

        const tempsLectureTotal = Math.max(1, Math.round(totalMots / 3.5));

        return {
            sections,
            totalMots,
            totalCaracteres,
            totalPhrases,
            totalSections: puckData.content.length,
            typesUtilises: Array.from(typesUtilises),
            tempsLectureTotal,
        };
    }, [puckData]);
}

// ==================================
// Calcul du score de qualité
// ==================================

export function calculerScoreQualite(
    metrics: ReturnType<typeof useContentMetrics>,
    seoData?: { metaTitle?: string; metaDescription?: string }
): ContentQualityScore {
    const recommandations: Recommandation[] = [];
    let lisibilite = 50;
    let seo = 50;
    let richesse = 50;
    let structure = 50;

    // === LISIBILITÉ ===
    if (metrics.totalMots === 0) {
        recommandations.push({ type: 'error', message: 'Aucun contenu textuel détecté. Ajoutez du texte à vos sections.', categorie: 'contenu' });
    } else if (metrics.totalMots < 100) {
        recommandations.push({ type: 'warning', message: `Contenu très court (${metrics.totalMots} mots). Visez au moins 300 mots pour une page complète.`, categorie: 'contenu' });
        lisibilite = 30;
    } else if (metrics.totalMots < 300) {
        recommandations.push({ type: 'info', message: `Contenu acceptable (${metrics.totalMots} mots). 300-800 mots recommandé.`, categorie: 'contenu' });
        lisibilite = 60;
    } else if (metrics.totalMots <= 800) {
        lisibilite = 90;
        recommandations.push({ type: 'success', message: `Longueur de contenu idéale (${metrics.totalMots} mots).`, categorie: 'contenu' });
    } else if (metrics.totalMots <= 1500) {
        lisibilite = 80;
    } else {
        lisibilite = 65;
        recommandations.push({ type: 'info', message: `Contenu très long (${metrics.totalMots} mots). Vérifiez la pertinence.`, categorie: 'contenu' });
    }

    // === SEO ===
    if (seoData?.metaTitle) {
        const titleLen = seoData.metaTitle.length;
        if (titleLen >= 30 && titleLen <= 60) {
            seo += 20;
            recommandations.push({ type: 'success', message: `Titre SEO optimal (${titleLen} caractères).`, categorie: 'seo' });
        } else if (titleLen > 0) {
            recommandations.push({ type: 'warning', message: `Titre SEO ${titleLen < 30 ? 'trop court' : 'trop long'} (${titleLen} car.). Visez 30-60.`, categorie: 'seo' });
            seo += 5;
        }
    } else {
        recommandations.push({ type: 'warning', message: 'Titre SEO non défini. Ajoutez un meta titre.', categorie: 'seo' });
    }

    if (seoData?.metaDescription) {
        const descLen = seoData.metaDescription.length;
        if (descLen >= 120 && descLen <= 160) {
            seo += 20;
            recommandations.push({ type: 'success', message: `Meta description optimale (${descLen} caractères).`, categorie: 'seo' });
        } else if (descLen > 0) {
            recommandations.push({ type: 'warning', message: `Meta description ${descLen < 120 ? 'courte' : 'longue'} (${descLen} car.). Visez 120-160.`, categorie: 'seo' });
            seo += 5;
        }
    } else {
        recommandations.push({ type: 'warning', message: 'Meta description non définie.', categorie: 'seo' });
    }

    // === RICHESSE ===
    const nbTypes = metrics.typesUtilises.length;
    if (nbTypes === 0) {
        richesse = 20;
    } else if (nbTypes <= 2) {
        richesse = 50;
        recommandations.push({ type: 'info', message: 'Variez les types de sections (texte, image, vidéo, FAQ...).', categorie: 'structure' });
    } else if (nbTypes <= 5) {
        richesse = 75;
    } else {
        richesse = 90;
        recommandations.push({ type: 'success', message: `Bonne diversité de sections (${nbTypes} types).`, categorie: 'structure' });
    }

    // Vérifier images/médias
    const hasMedia = metrics.typesUtilises.some(t =>
        ['Galerie', 'Video', 'HeroSection', 'HeroVideo', 'GalerieMasonry', 'Equipe'].includes(t)
    );
    if (!hasMedia) {
        recommandations.push({ type: 'warning', message: 'Ajoutez des éléments visuels (images, vidéos) pour enrichir la page.', categorie: 'accessibilite' });
        richesse = Math.max(richesse - 15, 20);
    }

    // === STRUCTURE ===
    if (metrics.totalSections === 0) {
        structure = 20;
    } else if (metrics.totalSections === 1) {
        structure = 40;
        recommandations.push({ type: 'info', message: 'Ajoutez plus de sections pour structurer la page.', categorie: 'structure' });
    } else if (metrics.totalSections >= 3 && metrics.totalSections <= 10) {
        structure = 85;
    } else if (metrics.totalSections > 10) {
        structure = 70;
        recommandations.push({ type: 'info', message: `${metrics.totalSections} sections — envisagez de regrouper le contenu.`, categorie: 'structure' });
    }

    // Vérifier la présence d'un Hero
    const hasHero = metrics.typesUtilises.some(t => ['HeroSection', 'HeroVideo'].includes(t));
    if (!hasHero && metrics.totalSections > 0) {
        recommandations.push({ type: 'info', message: 'Commencez par un Hero pour capter l\'attention.', categorie: 'structure' });
        structure = Math.max(structure - 10, 20);
    }

    // Score global (moyenne pondérée)
    const global = Math.round(lisibilite * 0.3 + seo * 0.25 + richesse * 0.25 + structure * 0.2);

    return { global, lisibilite, seo, richesse, structure, recommandations };
}

// ==================================
// Composant principal
// ==================================

export function ContentMetricsPanel({ puckData }: ContentMetricsProps) {
    const metrics = useContentMetrics(puckData);
    const [showDetail, setShowDetail] = useState(false);
    const quality = useMemo(() => calculerScoreQualite(metrics), [metrics]);

    const scoreColor = quality.global >= 80 ? 'text-green-600' : quality.global >= 60 ? 'text-yellow-600' : 'text-red-600';
    const scoreBg = quality.global >= 80 ? 'bg-green-50 border-green-200' : quality.global >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

    const iconReco = {
        error: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
        warning: <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />,
        info: <Info className="h-3.5 w-3.5 text-blue-500" />,
        success: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    };

    return (
        <div className="p-3 space-y-3">
            {/* Score global */}
            <div className={`rounded-xl border p-3 ${scoreBg}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className={`h-5 w-5 ${scoreColor}`} />
                        <div>
                            <p className="text-[10px] font-medium text-gray-500 uppercase">Score qualité</p>
                            <p className={`text-2xl font-bold ${scoreColor}`}>{quality.global}<span className="text-sm font-normal">/100</span></p>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] text-gray-500">~{metrics.tempsLectureTotal} min lecture</p>
                    </div>
                </div>

                {/* Barres de sous-scores */}
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {[
                        { label: 'Lisibilité', value: quality.lisibilite, color: 'bg-blue-500' },
                        { label: 'SEO', value: quality.seo, color: 'bg-green-500' },
                        { label: 'Richesse', value: quality.richesse, color: 'bg-purple-500' },
                        { label: 'Structure', value: quality.structure, color: 'bg-orange-500' },
                    ].map(sub => (
                        <div key={sub.label}>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500">{sub.label}</span>
                                <span className="text-[9px] font-semibold">{sub.value}</span>
                            </div>
                            <div className="mt-0.5 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className={`h-full rounded-full ${sub.color} transition-all duration-500`} style={{ width: `${sub.value}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Métriques rapides */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: <Type className="h-3.5 w-3.5" />, value: metrics.totalMots, label: 'Mots' },
                    { icon: <FileText className="h-3.5 w-3.5" />, value: metrics.totalCaracteres, label: 'Caractères' },
                    { icon: <BarChart3 className="h-3.5 w-3.5" />, value: metrics.totalSections, label: 'Sections' },
                ].map(m => (
                    <div key={m.label} className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5">
                        <span className="text-gray-400">{m.icon}</span>
                        <div>
                            <p className="text-xs font-bold">{m.value.toLocaleString('fr-FR')}</p>
                            <p className="text-[9px] text-gray-500">{m.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommandations */}
            <div>
                <h4 className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Recommandations ({quality.recommandations.length})
                </h4>
                <div className="space-y-1">
                    {quality.recommandations.slice(0, showDetail ? undefined : 4).map((reco, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-100 px-2 py-1.5">
                            {iconReco[reco.type]}
                            <p className="text-[10px] text-gray-600 leading-tight">{reco.message}</p>
                        </div>
                    ))}
                </div>
                {quality.recommandations.length > 4 && (
                    <button
                        onClick={() => setShowDetail(!showDetail)}
                        className="mt-1 text-[10px] text-blue-600 hover:underline"
                    >
                        {showDetail ? 'Voir moins' : `Voir toutes (${quality.recommandations.length})`}
                    </button>
                )}
            </div>

            {/* Détail par section */}
            {metrics.sections.length > 0 && (
                <div>
                    <h4 className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Détail par section
                    </h4>
                    <div className="max-h-40 space-y-0.5 overflow-y-auto">
                        {metrics.sections.map((s, i) => (
                            <div key={i} className="flex items-center justify-between rounded px-2 py-1 text-[10px] hover:bg-gray-50">
                                <span className="truncate text-gray-600 max-w-[140px]">{s.titre}</span>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span>{s.mots} mots</span>
                                    <span>~{s.tempsLecture}s</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
