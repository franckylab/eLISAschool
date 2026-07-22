/**
 * ==================================
 * eLISAschool - Helpers de protection des entités système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Guards pour protéger les seeds système contre la suppression.
 * Les entités système (estSysteme = true) peuvent être modifiées (label, description)
 * mais ne peuvent PAS être supprimées.
 */

/**
 * Vérifie qu'une entité n'est pas une entité système avant suppression.
 * Lance une erreur si l'entité est système.
 *
 * @param entity - Entité avec le champ estSysteme
 * @param label - Nom de l'entité pour le message d'erreur (ex: "Niveau d'organisation")
 * @throws Error si l'entité est système
 *
 * @example
 * ```typescript
 * const niveau = await service.findById(id);
 * assertNotSystem(niveau, 'Niveau d\'organisation');
 * await service.delete(id);
 * ```
 */
export function assertNotSystem(
    entity: { estSysteme?: boolean } | null | undefined,
    label: string = 'Cette entité'
): void {
    if (!entity) {
        return; // L'entité n'existe pas, rien à protéger
    }

    if (entity.estSysteme) {
        const error = new Error(
            `${label} est une entité système et ne peut pas être supprimée. ` +
            `Vous pouvez modifier son libellé ou sa description si nécessaire.`
        );
        (error as any).statusCode = 403;
        (error as any).code = 'SYSTEM_ENTITY_PROTECTED';
        throw error;
    }
}

/**
 * Vérifie qu'une entité n'est pas une entité système immuable.
 * Les entités immuables ne peuvent être ni modifiées ni supprimées.
 *
 * @param entity - Entité avec le champ estSysteme
 * @param label - Nom de l'entité pour le message d'erreur
 * @throws Error si l'entité est système immuable
 */
export function assertNotImmutable(
    entity: { estSysteme?: boolean } | null | undefined,
    label: string = 'Cette entité'
): void {
    if (!entity) {
        return;
    }

    if (entity.estSysteme) {
        const error = new Error(
            `${label} est une entité système immuable et ne peut être ni modifiée ni supprimée.`
        );
        (error as any).statusCode = 403;
        (error as any).code = 'SYSTEM_ENTITY_IMMUTABLE';
        throw error;
    }
}
