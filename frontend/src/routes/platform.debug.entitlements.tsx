/**
 * ==================================
 * eLISAschool - Debug Entitlements Resolver
 * ==================================
 * Simulateur de résolution entitlements — cascade 4 questions.
 * Appelle GET /api/billing/entitlement/resolve?codes=a,b,c
 * Refonte v3 — migration 213.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bug, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export const Route = createFileRoute('/platform/debug/entitlements')({
    component: DebugEntitlementsPage,
});

interface EntitlementResult {
    code: string;
    nom: string;
    icone: string;
    categorie: string;
    entitlement: {
        accessible: boolean;
        visible: boolean;
        raison: string;
        message?: string;
        source: string;
        planMinimalRequis?: string;
        planActuel?: string;
        lectureSeule?: boolean;
    };
}

interface ResolveResponse {
    success: boolean;
    data: {
        modules: EntitlementResult[];
        abonnement: {
            statut: string;
            plan?: { slug: string; nom: string };
            dateFin: string;
            periodeEssaiFin?: string;
        } | null;
    };
}

function DebugEntitlementsPage() {
    const [etablissementId, setEtablissementId] = useState('');
    const [codes, setCodes] = useState('');
    const [searched, setSearched] = useState(false);

    const { data, isLoading, error } = useQuery<ResolveResponse>({
        queryKey: ['debug-entitlements', etablissementId, codes],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (codes.trim()) params.codes = codes.trim();
            if (etablissementId.trim()) params.etablissementId = etablissementId.trim();
            const res = await apiClient.get<any>(
                '/api/billing/entitlement/resolve',
                params
            );
            return res as unknown as ResolveResponse;
        },
        enabled: searched && !!etablissementId,
        retry: false,
    });

    const handleSearch = () => {
        if (etablissementId.trim()) setSearched(true);
    };

    const getRaisonIcon = (raison: string) => {
        switch (raison) {
            case 'CRITIQUE': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'ESSAI_ACTIF': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'PLAN_ACTIF': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'OVERRIDE_ACTIVE': return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
            case 'AUCUN_PLAN': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'MODULE_NON_INCLUS': return <XCircle className="w-4 h-4 text-orange-500" />;
            case 'DEGRADATION_LECTURE_SEULE': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'DEGRADATION_VERROUILLE': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRaisonColor = (raison: string) => {
        if (raison.includes('CRITIQUE') || raison.includes('ACTIF') || raison.includes('OVERRIDE')) return 'text-green-700 bg-green-50 border-green-200';
        if (raison.includes('AUCUN') || raison.includes('VERROUILLE') || raison.includes('ARCHIVE')) return 'text-red-700 bg-red-50 border-red-200';
        if (raison.includes('DEGRADATION') || raison.includes('LECTURE')) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        return 'text-gray-700 bg-gray-50 border-gray-200';
    };

    return (
        <div className="space-y-[var(--space-md)]">
            {/* Search form */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-5 h-5 text-[var(--color-danger-500)]" />
                    <h2 className="font-semibold" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        Simulateur de résolution
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                            Établissement ID
                        </label>
                        <input
                            type="text"
                            value={etablissementId}
                            onChange={(e) => { setEtablissementId(e.target.value); setSearched(false); }}
                            placeholder="UUID de l'établissement"
                            className="w-full px-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">
                            Codes modules (optionnel, séparés par virgule)
                        </label>
                        <input
                            type="text"
                            value={codes}
                            onChange={(e) => { setCodes(e.target.value); setSearched(false); }}
                            placeholder="eleves,classes,notes ou vide = tous"
                            className="w-full px-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={!etablissementId.trim() || isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-danger-600)] rounded-md hover:bg-[var(--color-danger-700)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Résoudre
                </button>
            </div>

            {/* Results */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Erreur : {(error as any)?.message ?? 'Impossible de résoudre les entitlements'}
                </div>
            )}

            {data?.data && (
                <div className="space-y-3">
                    {/* Abonnement status */}
                    <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg">
                        <h3 className="text-sm font-semibold mb-2">Statut abonnement</h3>
                        {data.data.abonnement ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div><span className="text-[var(--color-texte-muted)]">Statut :</span> <span className="font-medium">{data.data.abonnement.statut}</span></div>
                                <div><span className="text-[var(--color-texte-muted)]">Plan :</span> <span className="font-medium">{data.data.abonnement.plan?.nom ?? '—'}</span></div>
                                <div><span className="text-[var(--color-texte-muted)]">Slug :</span> <span className="font-mono">{data.data.abonnement.plan?.slug ?? '—'}</span></div>
                                <div><span className="text-[var(--color-texte-muted)]">Fin :</span> <span className="font-medium">{new Date(data.data.abonnement.dateFin).toLocaleDateString('fr-FR')}</span></div>
                            </div>
                        ) : (
                            <p className="text-sm text-red-600">Aucun abonnement trouvé</p>
                        )}
                    </div>

                    {/* Modules resolution */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                        <div className="px-4 py-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                            <h3 className="text-sm font-semibold">
                                Résolution modules ({data.data.modules.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-[var(--color-bordure)]">
                            {data.data.modules.map((mod) => (
                                <div key={mod.code} className="px-4 py-3 flex items-start gap-3">
                                    <div className="mt-0.5">{getRaisonIcon(mod.entitlement.raison)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{mod.nom}</span>
                                            <span className="text-xs font-mono text-[var(--color-texte-muted)]">({mod.code})</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRaisonColor(mod.entitlement.raison)}`}>
                                                {mod.entitlement.raison}
                                            </span>
                                            <span className="text-xs text-[var(--color-texte-muted)]">
                                                source: {mod.entitlement.source}
                                            </span>
                                            {mod.entitlement.planActuel && (
                                                <span className="text-xs text-[var(--color-texte-muted)]">
                                                    plan: {mod.entitlement.planActuel}
                                                </span>
                                            )}
                                        </div>
                                        {mod.entitlement.message && (
                                            <p className="text-xs text-[var(--color-texte-muted)] mt-1">{mod.entitlement.message}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block w-2 h-2 rounded-full ${mod.entitlement.accessible ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!searched && !isLoading && (
                <div className="text-center py-12 text-[var(--color-texte-muted)]">
                    <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Saisissez un établissement ID pour lancer la résolution</p>
                </div>
            )}
        </div>
    );
}
