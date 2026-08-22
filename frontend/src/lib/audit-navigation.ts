/**
 * ==================================
 * eLISAschool - Audit Navigation Utility
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface AuditNavLink {
    to: string;
    params?: Record<string, string>;
    permission: string;
    labelKey: string;
}

interface AuditLogLike {
    cible?: string;
    cibleId?: string;
    module?: string;
    metadata?: {
        entiteLabel?: string;
        entiteRef?: string;
        relations?: Record<string, { id: string; label?: string }>;
    };
}

const CIBLE_ROUTE_MAP: Record<string, { basePath: string; permission: string; labelKey: string }> = {
    Note: { basePath: '/notes', permission: 'notes:view', labelKey: 'audit.relations.note' },
    Classe: { basePath: '/classes', permission: 'classes:view', labelKey: 'audit.relations.classe' },
    Matiere: { basePath: '/matieres', permission: 'matieres:view', labelKey: 'audit.relations.matiere' },
    Periode: { basePath: '/periodes', permission: 'periodes:view', labelKey: 'audit.relations.periode' },
    AnneeScolaire: { basePath: '/annees-scolaires', permission: 'annees:view', labelKey: 'audit.relations.anneeScolaire' },
    MembrePersonnel: { basePath: '/personnel', permission: 'personnel:view', labelKey: 'audit.relations.personnel' },
    Bulletin: { basePath: '/bulletins', permission: 'bulletins:view', labelKey: 'audit.relations.bulletin' },
    Eleve: { basePath: '/eleves', permission: 'eleves:view', labelKey: 'audit.relations.eleve' },
    BulletinPaie: { basePath: '/paie', permission: 'paie:view', labelKey: 'audit.relations.bulletinPaie' },
    ContratPersonnel: { basePath: '/contrats', permission: 'contrats:view', labelKey: 'audit.relations.contrat' },
};

export function resolveAuditNavLink(log: AuditLogLike): AuditNavLink | null {
    if (!log.cible || !log.cibleId) return null;

    const config = CIBLE_ROUTE_MAP[log.cible];
    if (!config) return null;

    return {
        to: `${config.basePath}/$id`,
        params: { id: log.cibleId },
        permission: config.permission,
        labelKey: config.labelKey,
    };
}

export function resolveRelationNavLink(
    relationKey: string,
    relation: { id: string; label?: string },
): AuditNavLink | null {
    const keyToCible: Record<string, string> = {
        eleve: 'Eleve',
        matiere: 'Matiere',
        periode: 'Periode',
        classe: 'Classe',
        anneeScolaire: 'AnneeScolaire',
        personnel: 'MembrePersonnel',
        bulletin: 'Bulletin',
        contrat: 'ContratPersonnel',
    };

    const cible = keyToCible[relationKey];
    if (!cible) return null;

    const config = CIBLE_ROUTE_MAP[cible];
    if (!config) return null;

    return {
        to: `${config.basePath}/$id`,
        params: { id: relation.id },
        permission: config.permission,
        labelKey: config.labelKey,
    };
}
