/**
 * ==================================
 * eLISAschool - Colonnes partagées EDT / Heures de cours / Remplacements
 * ==================================
 * Renderers génériques réutilisables dans les DataTable des modules emploi du temps.
 * Style canonical : Heures de cours (avatars, icônes, responsive).
 * Version: 1.0.0
 */

import { GraduationCap, MapPin } from 'lucide-react';

// ─── Types d'extraction ─────────────────────────────────────

interface EnseignantData {
    prenom: string;
    nom: string;
}

interface MatiereData {
    nom: string;
    couleur?: string | null;
    code?: string | null;
}

interface ClasseData {
    nom: string;
    code?: string | null;
}

interface SalleData {
    nom: string;
    code?: string | null;
}

// ─── ColonneEnseignant ──────────────────────────────────────

interface ColonneEnseignantProps {
    enseignant: EnseignantData | null | undefined;
}

/**
 * Avatar rond avec initiales + nom complet tronqué.
 * Style canonical = heures-cours-page.tsx (dominant-100/dark-900).
 */
function ColonneEnseignant({ enseignant }: ColonneEnseignantProps) {
    const profil = enseignant;
    if (!profil) return <span className="text-[var(--color-text-muted)]">—</span>;

    const nomComplet = `${profil.prenom} ${profil.nom}`;
    const initiales = `${profil.prenom[0] ?? ''}${profil.nom[0] ?? ''}`.toUpperCase();

    return (
        <div className="flex items-center gap-[var(--gap-xs)]">
            {initiales && (
                <span
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-300)] font-medium shrink-0"
                    style={{
                        fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)',
                        width: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.75rem)',
                        height: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.75rem)',
                    }}
                >
                    {initiales}
                </span>
            )}
            <span
                className="text-[var(--color-text-primary)] truncate"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                title={nomComplet}
            >
                {nomComplet}
            </span>
        </div>
    );
}

// ─── ColonneMatiere ─────────────────────────────────────────

interface ColonneMatiereProps {
    matiere: MatiereData | null | undefined;
}

/**
 * Dot couleur + nom + code (hidden lg:inline).
 */
function ColonneMatiere({ matiere }: ColonneMatiereProps) {
    if (!matiere?.nom) return <span className="text-[var(--color-text-muted)]">—</span>;

    const showDot = matiere.couleur && matiere.couleur !== '#000000';

    return (
        <div className="flex items-center gap-[var(--gap-xs)]">
            {showDot && (
                <span
                    className="rounded-full shrink-0"
                    style={{
                        width: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.625rem)',
                        height: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.625rem)',
                        backgroundColor: matiere.couleur!,
                    }}
                />
            )}
            <span
                className="font-medium text-[var(--color-text-primary)] truncate"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                title={matiere.nom}
            >
                {matiere.nom}
            </span>
            {matiere.code && (
                <span
                    className="hidden lg:inline text-[var(--color-text-muted)]"
                    style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}
                >
                    ({matiere.code})
                </span>
            )}
        </div>
    );
}

// ─── ColonneClasse ──────────────────────────────────────────

interface ColonneClasseProps {
    classe: ClasseData | null | undefined;
}

/**
 * Icône GraduationCap + nom + code (hidden xl:inline).
 */
function ColonneClasse({ classe }: ColonneClasseProps) {
    const nom = classe?.nom;
    if (!nom) return <span className="text-[var(--color-text-muted)]">—</span>;

    return (
        <div className="flex items-center gap-[var(--gap-xs)]">
            <GraduationCap className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
            <span
                className="text-[var(--color-text-secondary)] truncate"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                title={nom}
            >
                {nom}
            </span>
            {classe?.code && (
                <span
                    className="hidden xl:inline text-[var(--color-text-muted)]"
                    style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}
                >
                    {classe.code}
                </span>
            )}
        </div>
    );
}

// ─── ColonneSalle ───────────────────────────────────────────

interface ColonneSalleProps {
    salle: SalleData | null | undefined;
}

/**
 * Icône MapPin + nom/code.
 */
function ColonneSalle({ salle }: ColonneSalleProps) {
    if (!salle) return <span className="text-[var(--color-text-muted)]">—</span>;

    const display = salle.code || salle.nom;

    return (
        <div className="flex items-center gap-[var(--gap-xs)]">
            <MapPin className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
            <span
                className="text-[var(--color-text-secondary)] truncate"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                title={salle.nom}
            >
                {display}
            </span>
        </div>
    );
}

export {
    ColonneEnseignant, ColonneMatiere, ColonneClasse, ColonneSalle,
    type EnseignantData, type MatiereData, type ClasseData, type SalleData,
};
