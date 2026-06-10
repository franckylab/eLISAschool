/**
 * ==================================
 * eLISAschool - Configuration Module Cantine
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration centralisée du module cantine
 */

export interface CantineConfig {
    // MENUS
    menus: {
        planificationJours: number;
        precommandeActive: boolean;
        notificationMenuQuotidien: boolean;
        heureNotificationMenu: string; // HH:MM
    };

    // INSCRIPTIONS
    inscriptions: {
        validationRequise: boolean;
        niveauxValidation: number;
        rolesValidation: Record<string, string>;
        inscriptionAutoRenouvellement: boolean;
        delaiAnnulationJours: number;
    };

    // PAIEMENTS & SOLDE
    paiements: {
        deviseDefaut: string;
        detteMaximale: number;
        seuilAlerteSolde: number;
        paiementMobileActif: boolean;
        relanceAutoActive: boolean;
        relanceFrequenceJours: number;
        escomptePct: number;
    };

    // CONSOMMATIONS
    consommations: {
        qrCodeActif: boolean;
        scanAutoActif: boolean;
        delaiGraceMinutes: number;
        notificationConsommation: boolean;
        statistiquesMensuelles: boolean;
    };

    // NOTIFICATIONS
    notifications: {
        rappelPaiementActif: boolean;
        delaiRappelJours: number;
        confirmationRechargement: boolean;
        alerteDetteCritique: boolean;
        rapportHebdomadaire: boolean;
    };

    // RAPPORTS
    rapports: {
        generationAutoActive: boolean;
        frequenceDefaut: 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL';
        formatExportDefaut: 'PDF' | 'EXCEL' | 'CSV';
        destinatairesDefaut: string[];
    };

    // GÉNÉRAL
    general: {
        auditOperationsActif: boolean;
        cacheTtlSecondes: number;
        paginationDefaut: number;
        paginationMax: number;
    };
}

/**
 * Configuration par défaut du module cantine
 */
export const CANTINE_DEFAULT_CONFIG: CantineConfig = {
    menus: {
        planificationJours: 7,
        precommandeActive: true,
        notificationMenuQuotidien: true,
        heureNotificationMenu: '07:00',
    },
    inscriptions: {
        validationRequise: false,
        niveauxValidation: 2,
        rolesValidation: {
            '1': 'RESPONSABLE_CANTINE',
            '2': 'ADMIN',
        },
        inscriptionAutoRenouvellement: false,
        delaiAnnulationJours: 2,
    },
    paiements: {
        deviseDefaut: 'FCFA',
        detteMaximale: 10000,
        seuilAlerteSolde: 2000,
        paiementMobileActif: false,
        relanceAutoActive: true,
        relanceFrequenceJours: 7,
        escomptePct: 0,
    },
    consommations: {
        qrCodeActif: false,
        scanAutoActif: true,
        delaiGraceMinutes: 5,
        notificationConsommation: false,
        statistiquesMensuelles: true,
    },
    notifications: {
        rappelPaiementActif: true,
        delaiRappelJours: 3,
        confirmationRechargement: true,
        alerteDetteCritique: true,
        rapportHebdomadaire: true,
    },
    rapports: {
        generationAutoActive: true,
        frequenceDefaut: 'HEBDOMADAIRE',
        formatExportDefaut: 'PDF',
        destinatairesDefaut: ['RESPONSABLE_CANTINE', 'ADMIN'],
    },
    general: {
        auditOperationsActif: true,
        cacheTtlSecondes: 300,
        paginationDefaut: 20,
        paginationMax: 100,
    },
};

/**
 * Helper pour convertir les valeurs string en types appropriés
 */
export function parseConfigValue(value: string, type: string): any {
    switch (type) {
        case 'NUMBER':
            return parseFloat(value);
        case 'BOOLEAN':
            return value.toLowerCase() === 'true';
        case 'JSON':
            return JSON.parse(value);
        default:
            return value;
    }
}
