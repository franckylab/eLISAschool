/**
 * ==================================
 * eLISAschool - Conditions d'affichage dynamique CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Système de conditions d'affichage pour sections CMS :
 * - Responsive (breakpoints)
 * - Rôle utilisateur
 * - Plage de dates
 * - Conditions personnalisées
 */

import { useState, useCallback } from 'react';
import { Eye, EyeOff, Calendar, Monitor, Users, Filter, Plus, X } from 'lucide-react';

// ==================================
// Types
// ==================================

export interface VisibilityCondition {
    /** Breakpoints où la section est visible */
    breakpoints?: {
        mobile: boolean;   // < 640px
        tablet: boolean;   // 640-1024px
        desktop: boolean;  // 1024-1536px
        wide: boolean;     // > 1536px
    };
    /** Rôles autorisés à voir la section (vide = tous) */
    rolesAutorises?: string[];
    /** Rôles exclus */
    rolesExclus?: string[];
    /** Date de début de visibilité */
    dateDebut?: string;
    /** Date de fin de visibilité */
    dateFin?: string;
    /** Expression conditionnelle personnalisée */
    expressionCustom?: string;
    /** Masquer complètement si condition non remplie (vs opacity) */
    masquerComplet?: boolean;
}

interface VisibilityEditorProps {
    condition: VisibilityCondition;
    onChange: (condition: VisibilityCondition) => void;
}

// ==================================
// Rôles disponibles
// ==================================

const ROLES_DISPONIBLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'DIRECTEUR', label: 'Directeur' },
    { value: 'CHEF_ETABLISSEMENT', label: 'Chef Établissement' },
    { value: 'ENSEIGNANT', label: 'Enseignant' },
    { value: 'PERSONNEL', label: 'Personnel' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'ELEVE', label: 'Élève' },
    { value: 'PUBLIC', label: 'Public (non connecté)' },
];

// ==================================
// Helper d'évaluation de visibilité
// ==================================

/**
 * Évalue si une section doit être visible selon ses conditions.
 * Utilisé côté rendu public (CmsPageRenderer).
 */
export function evaluerVisibilite(
    condition: VisibilityCondition | undefined,
    contexte: {
        width?: number;
        role?: string;
        dateActuelle?: Date;
    }
): boolean {
    if (!condition) return true;

    const { width, role, dateActuelle } = contexte;
    const now = dateActuelle || new Date();

    // 1. Check breakpoints
    if (condition.breakpoints && width !== undefined) {
        const bp = condition.breakpoints;
        if (width < 640 && !bp.mobile) return false;
        if (width >= 640 && width < 1024 && !bp.tablet) return false;
        if (width >= 1024 && width < 1536 && !bp.desktop) return false;
        if (width >= 1536 && !bp.wide) return false;
    }

    // 2. Check rôles
    if (condition.rolesAutorises?.length && role) {
        if (!condition.rolesAutorises.includes(role) && !condition.rolesAutorises.includes('PUBLIC')) {
            return false;
        }
    }
    if (condition.rolesExclus?.length && role) {
        if (condition.rolesExclus.includes(role)) return false;
    }

    // 3. Check dates
    if (condition.dateDebut) {
        const debut = new Date(condition.dateDebut);
        if (now < debut) return false;
    }
    if (condition.dateFin) {
        const fin = new Date(condition.dateFin);
        if (now > fin) return false;
    }

    return true;
}

/**
 * Génère le CSS responsive pour les breakpoints.
 * Utilise des media queries CSS.
 */
export function genererCSSVisibilite(condition: VisibilityCondition): string {
    const rules: string[] = [];
    const bp = condition.breakpoints;

    if (bp) {
        if (!bp.mobile) {
            rules.push(`@media (max-width: 639px) { .cms-section-visible { display: none !important; } }`);
        }
        if (!bp.tablet) {
            rules.push(`@media (min-width: 640px) and (max-width: 1023px) { .cms-section-visible { display: none !important; } }`);
        }
        if (!bp.desktop) {
            rules.push(`@media (min-width: 1024px) and (max-width: 1535px) { .cms-section-visible { display: none !important; } }`);
        }
        if (!bp.wide) {
            rules.push(`@media (min-width: 1536px) { .cms-section-visible { display: none !important; } }`);
        }
    }

    return rules.join('\n');
}

// ==================================
// Composant éditeur
// ==================================

export function VisibilityEditor({ condition, onChange }: VisibilityEditorProps) {
    const [activeTab, setActiveTab] = useState<'responsive' | 'roles' | 'dates'>('responsive');

    const bp = condition.breakpoints || { mobile: true, tablet: true, desktop: true, wide: true };
    const roles = condition.rolesAutorises || [];
    const rolesExclus = condition.rolesExclus || [];

    const updateBreakpoint = useCallback((key: keyof VisibilityCondition['breakpoints'], value: boolean) => {
        onChange({
            ...condition,
            breakpoints: { ...bp, [key]: value },
        });
    }, [condition, bp, onChange]);

    const toggleRole = useCallback((role: string, type: 'autorise' | 'exclu') => {
        if (type === 'autorise') {
            const newRoles = roles.includes(role)
                ? roles.filter(r => r !== role)
                : [...roles, role];
            onChange({ ...condition, rolesAutorises: newRoles });
        } else {
            const newExclus = rolesExclus.includes(role)
                ? rolesExclus.filter(r => r !== role)
                : [...rolesExclus, role];
            onChange({ ...condition, rolesExclus: newExclus });
        }
    }, [condition, roles, rolesExclus, onChange]);

    const tabs = [
        { id: 'responsive' as const, icon: <Monitor className="h-3 w-3" />, label: 'Écrans' },
        { id: 'roles' as const, icon: <Users className="h-3 w-3" />, label: 'Rôles' },
        { id: 'dates' as const, icon: <Calendar className="h-3 w-3" />, label: 'Dates' },
    ];

    return (
        <div className="space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                            activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Responsive */}
            {activeTab === 'responsive' && (
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500">Sélectionnez les écrans où cette section est visible.</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {([
                            { key: 'mobile' as const, label: 'Mobile', desc: '< 640px' },
                            { key: 'tablet' as const, label: 'Tablette', desc: '640-1024px' },
                            { key: 'desktop' as const, label: 'Desktop', desc: '1024-1536px' },
                            { key: 'wide' as const, label: 'Grand écran', desc: '> 1536px' },
                        ]).map(({ key, label, desc }) => (
                            <button
                                key={key}
                                onClick={() => updateBreakpoint(key, !bp[key])}
                                className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                                    bp[key]
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-gray-200 bg-gray-50 text-gray-400 line-through'
                                }`}
                            >
                                {bp[key] ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <div>
                                    <p className="text-[10px] font-medium">{label}</p>
                                    <p className="text-[9px] opacity-70">{desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Rôles */}
            {activeTab === 'roles' && (
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500">
                        Rôles autorisés (vide = tous visibles). Cliquez pour ajouter/retirer.
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {ROLES_DISPONIBLES.map(role => {
                            const isAutorise = roles.includes(role.value);
                            const isExclu = rolesExclus.includes(role.value);
                            return (
                                <button
                                    key={role.value}
                                    onClick={() => toggleRole(role.value, isAutorise ? 'autorise' : 'exclu')}
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors ${
                                        isAutorise
                                            ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                            : isExclu
                                            ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {role.label}
                                    {isExclu && ' ✕'}
                                </button>
                            );
                        })}
                    </div>
                    {(roles.length > 0 || rolesExclus.length > 0) && (
                        <button
                            onClick={() => onChange({ ...condition, rolesAutorises: [], rolesExclus: [] })}
                            className="text-[9px] text-blue-600 hover:underline"
                        >
                            Réinitialiser les rôles
                        </button>
                    )}
                </div>
            )}

            {/* Dates */}
            {activeTab === 'dates' && (
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500">
                        La section ne sera visible qu'entre ces dates.
                    </p>
                    <div className="space-y-1.5">
                        <div>
                            <label className="text-[10px] font-medium text-gray-500">Date de début</label>
                            <input
                                type="datetime-local"
                                value={condition.dateDebut || ''}
                                onChange={(e) => onChange({ ...condition, dateDebut: e.target.value || undefined })}
                                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-medium text-gray-500">Date de fin</label>
                            <input
                                type="datetime-local"
                                value={condition.dateFin || ''}
                                onChange={(e) => onChange({ ...condition, dateFin: e.target.value || undefined })}
                                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                            />
                        </div>
                    </div>
                    {(condition.dateDebut || condition.dateFin) && (
                        <button
                            onClick={() => onChange({ ...condition, dateDebut: undefined, dateFin: undefined })}
                            className="text-[9px] text-blue-600 hover:underline"
                        >
                            Supprimer les dates
                        </button>
                    )}
                </div>
            )}

            {/* Option masquer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-[10px] text-gray-500">Masquer complètement (vs opacity)</span>
                <button
                    onClick={() => onChange({ ...condition, masquerComplet: !condition.masquerComplet })}
                    className={`relative h-4 w-7 rounded-full transition-colors ${condition.masquerComplet !== false ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${condition.masquerComplet !== false ? 'left-[14px]' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    );
}
