/**
 * ==================================
 * eLISAschool - Modèles Jours Fériés par Pays (constantes)
 * ==================================
 * Source unique de vérité pour les templates de jours fériés.
 * Ces données NE SONT PAS insérées en base par le seed.
 * L'utilisateur doit "charger" le modèle pour créer les JF dans son établissement.
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

// ─── Types ─────────────────────────────────────────────────────

export interface JFFixe {
    nom: string;
    mois: number;
    jourMois: number;
    couleur: string;
}

export interface JFVariableDef {
    nom: string;
    couleur: string;
    description: string;
}

export interface ModelePaysDef {
    pays: string;
    label: string;
    fixes: JFFixe[];
    variablesChretiens: JFVariableDef[];
    variablesIslamiques: JFVariableDef[];
}

// ─── Variables chrétiens (Computus) ────────────────────────────

const VARIABLES_CHRETIENS: JFVariableDef[] = [
    { nom: 'Vendredi Saint', couleur: '#6f42c1', description: 'Calendrier chrétien' },
    { nom: 'Lundi de Pâques', couleur: '#6f42c1', description: 'Calendrier chrétien' },
    { nom: 'Ascension', couleur: '#6f42c1', description: 'Calendrier chrétien' },
    { nom: 'Lundi de Pentecôte', couleur: '#6f42c1', description: 'Calendrier chrétien' },
];

// ─── Variables islamiques (dates périssables, calendrier lunaire) ─

const VARIABLES_ISLAMIQUES: JFVariableDef[] = [
    { nom: 'Fin Ramadan', couleur: '#e67e22', description: 'Fête islamique — calendrier lunaire' },
    { nom: 'Tabaski', couleur: '#e67e22', description: 'Fête islamique — calendrier lunaire' },
];

// ─── Dates islamiques approximatives (2025-2027) ──────────────
// À mettre à jour quand de nouvelles dates sont confirmées.

export const DATES_ISLAMIQUES: Record<number, Record<string, string>> = {
    2025: { 'Fin Ramadan': '2025-03-30', 'Tabaski': '2025-06-06' },
    2026: { 'Fin Ramadan': '2026-03-20', 'Tabaski': '2026-05-27' },
    2027: { 'Fin Ramadan': '2027-03-10', 'Tabaski': '2027-05-16' },
};

// ─── Modèles par pays (15 pays Afrique centrale + UEMOA) ──────

export const MODELES_PAYS: ModelePaysDef[] = [
    {
        pays: 'CM', label: 'Cameroun',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête de la Jeunesse', mois: 2, jourMois: 11, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête Nationale', mois: 5, jourMois: 20, couleur: '#dc3545' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'CI', label: "Côte d'Ivoire",
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 8, jourMois: 7, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'SN', label: 'Sénégal',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 4, jourMois: 4, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'CG', label: 'Congo-Brazzaville',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête Nationale', mois: 6, jourMois: 10, couleur: '#28a745' },
            { nom: 'Fête de la Révolution', mois: 8, jourMois: 15, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'CD', label: 'RD Congo',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 6, jourMois: 30, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Journée des Morts', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'GA', label: 'Gabon',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 8, jourMois: 17, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'BF', label: 'Burkina Faso',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 8, jourMois: 5, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'ML', label: 'Mali',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 9, jourMois: 22, couleur: '#28a745' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'BJ', label: 'Bénin',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 8, jourMois: 1, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'TG', label: 'Togo',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 4, jourMois: 27, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'NE', label: 'Niger',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête de la Concorde', mois: 4, jourMois: 24, couleur: '#28a745' },
            { nom: 'Fête Nationale', mois: 8, jourMois: 3, couleur: '#28a745' },
            { nom: 'Fête de la République', mois: 12, jourMois: 18, couleur: '#28a745' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'GN', label: 'Guinée',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 10, jourMois: 2, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'TD', label: 'Tchad',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête de la République', mois: 1, jourMois: 11, couleur: '#28a745' },
            { nom: 'Fête Nationale', mois: 8, jourMois: 11, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'CF', label: 'RCA',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête Nationale', mois: 12, jourMois: 1, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
    {
        pays: 'GQ', label: 'Guinée Équatoriale',
        fixes: [
            { nom: 'Nouvel An', mois: 1, jourMois: 1, couleur: '#dc3545' },
            { nom: 'Fête du Travail', mois: 5, jourMois: 1, couleur: '#dc3545' },
            { nom: "Fête de l'Indépendance", mois: 10, jourMois: 12, couleur: '#28a745' },
            { nom: 'Assomption', mois: 8, jourMois: 15, couleur: '#6f42c1' },
            { nom: 'Toussaint', mois: 11, jourMois: 1, couleur: '#6f42c1' },
            { nom: 'Noël', mois: 12, jourMois: 25, couleur: '#28a745' },
        ],
        variablesChretiens: VARIABLES_CHRETIENS,
        variablesIslamiques: VARIABLES_ISLAMIQUES,
    },
];

// ─── Computus (Meeus/Jones/Butcher) — Calcul de Pâques ─────────

export function calculerPaques(annee: number): Date {
    const a = annee % 19;
    const b = Math.floor(annee / 100);
    const c = annee % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mois = Math.floor((h + l - 7 * m + 114) / 31);
    const jour = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(annee, mois - 1, jour);
}

export function formatDateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─── Générateur de JF pour un pays + années ────────────────────

export interface JFGenere {
    nom: string;
    date?: string; // YYYY-MM-DD (variables)
    estRecurrent: boolean;
    mois?: number;
    jourMois?: number;
    couleur: string;
    description?: string;
    pays: string;
}

/**
 * Génère tous les jours fériés pour un pays et une plage d'années.
 * Retourne les fixes (récurrents) + variables chrétiens + variables islamiques.
 */
export function genererJFPourPays(pays: string, annees: number[]): JFGenere[] {
    const modele = MODELES_PAYS.find(m => m.pays === pays);
    if (!modele) return [];

    const result: JFGenere[] = [];

    // 1. Fixes (récurrents)
    for (const fixe of modele.fixes) {
        result.push({
            nom: fixe.nom,
            estRecurrent: true,
            mois: fixe.mois,
            jourMois: fixe.jourMois,
            couleur: fixe.couleur,
            pays,
        });
    }

    // 2. Variables chrétiens (Computus)
    if (modele.variablesChretiens.length > 0) {
        for (const annee of annees) {
            const paques = calculerPaques(annee);
            const datesChretiens: Record<string, Date> = {
                'Vendredi Saint': new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() - 2),
                'Lundi de Pâques': new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() + 1),
                'Ascension': new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() + 39),
                'Lundi de Pentecôte': new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() + 50),
            };
            for (const def of modele.variablesChretiens) {
                const date = datesChretiens[def.nom];
                if (date) {
                    result.push({
                        nom: def.nom,
                        date: formatDateLocal(date),
                        estRecurrent: false,
                        couleur: def.couleur,
                        description: def.description,
                        pays,
                    });
                }
            }
        }
    }

    // 3. Variables islamiques (dates manuelles)
    if (modele.variablesIslamiques.length > 0) {
        for (const annee of annees) {
            const datesAnnee = DATES_ISLAMIQUES[annee];
            if (!datesAnnee) continue;
            for (const def of modele.variablesIslamiques) {
                const date = datesAnnee[def.nom];
                if (date) {
                    result.push({
                        nom: def.nom,
                        date,
                        estRecurrent: false,
                        couleur: def.couleur,
                        description: def.description,
                        pays,
                    });
                }
            }
        }
    }

    return result;
}

// ─── Seed (ne crée AUCUN JF en base — exporte les constantes) ──

export async function seedJoursFeries(): Promise<number> {
    // Les modèles sont des constantes TypeScript.
    // Les JF ne sont créés en base QUE lorsque l'utilisateur charge un modèle pays.
    // Ce seed ne fait rien — il documente que les modèles sont disponibles.
    const totalPays = MODELES_PAYS.length;
    const totalFixes = MODELES_PAYS.reduce((sum, m) => sum + m.fixes.length, 0);
    return 0; // 0 insert DB
}
