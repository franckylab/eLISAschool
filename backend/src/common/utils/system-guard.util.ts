import { AppError } from '@common/filters/error.filter';

export function assertNotSystem(entity: { estSysteme?: boolean } | null | undefined, action: string): void {
    if (!entity) {
        throw new AppError('Entité non trouvée', 404, 'NOT_FOUND');
    }
    if (entity.estSysteme) {
        throw new AppError(
            `Impossible de ${action} une entité système. Dupliquez-la d'abord.`,
            403,
            'SYSTEM_ENTITY_PROTECTED',
        );
    }
}
