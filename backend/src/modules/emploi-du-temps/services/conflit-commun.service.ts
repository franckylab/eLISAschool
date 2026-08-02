/**
 * ==================================
 * eLISAschool - Service de Conflits Commun
 * ==================================
 * Version: 1.0.0
 *
 * Logique partagée de vérification d'overlap horaire et de détection
 * de conflits de ressources, utilisée par les modules emploi-du-temps
 * et personnel (HeureCours).
 * ==================================
 */

/**
 * Vérifie si deux plages horaires se chevauchent.
 *
 * Deux plages [A_start, A_end[ et [B_start, B_end[ se chevauchent
 * si et seulement si A_start < B_end ET B_start < A_end.
 *
 * @param debut1 Heure de début de la première plage (format HH:MM)
 * @param fin1 Heure de fin de la première plage (format HH:MM)
 * @param debut2 Heure de début de la deuxième plage (format HH:MM)
 * @param fin2 Heure de fin de la deuxième plage (format HH:MM)
 * @returns true si les plages se chevauchent
 */
export function verifierOverlapHoraire(
    debut1: string,
    fin1: string,
    debut2: string,
    fin2: string,
): boolean {
    const toMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    return toMinutes(debut1) < toMinutes(fin2) && toMinutes(debut2) < toMinutes(fin1);
}

/**
 * Calcule la durée en minutes entre deux heures au format HH:MM.
 */
export function calculerDureeMinutes(heureDebut: string, heureFin: string): number {
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
}

/**
 * Interface générique pour un élément occupant un créneau horaire.
 * Utilisée par detecterConflitsRessource pour détecter les doublons
 * sur une ressource (enseignant, salle, classe…).
 */
export interface ElementHoraire {
    id?: string;
    heureDebut: string;
    heureFin: string;
}

/**
 * Détecte les conflits d'overlap entre un nouvel élément et une liste
 * d'éléments existants sur la même ressource.
 *
 * @param existants Liste d'éléments déjà en place
 * @param nouveau Nouvel élément à vérifier
 * @param excludeId ID d'un élément à exclure du test (ex: lors d'un update)
 * @returns La liste des éléments existants en conflit avec le nouveau
 */
export function detecterConflitsRessource<T extends ElementHoraire>(
    existants: T[],
    nouveau: ElementHoraire,
    excludeId?: string,
): T[] {
    return existants.filter(existing => {
        if (excludeId && existing.id === excludeId) return false;
        return verifierOverlapHoraire(
            existing.heureDebut,
            existing.heureFin,
            nouveau.heureDebut,
            nouveau.heureFin,
        );
    });
}
