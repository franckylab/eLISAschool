/**
 * ==================================
 * eLISAschool - Configuration Module Transport
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration centralisée du module transport
 */

export interface TransportConfig {
    // LIGNES
    lignes: {
        gpsActif: boolean;
        suiviTempsReel: boolean;
        notificationDepart: boolean;
        notificationArrivee: boolean;
        delaiAlerteRetardMinutes: number;
    };

    // INSCRIPTIONS
    inscriptions: {
        validationRequise: boolean;
        niveauxValidation: number;
        rolesValidation: Record<string, string>;
        quotaMaxParLigne: number;
        listeAttenteActive: boolean;
        delaiAnnulationJours: number;
    };

    // PRESENCES
    presences: {
        qrCodeActif: boolean;
        scanAutoActif: boolean;
        notificationAbsence: boolean;
        delaiGraceMinutes: number;
        justificatifRequis: boolean;
    };

    // NOTIFICATIONS
    notifications: {
        retardBusActif: boolean;
        seuilRetardMinutes: number;
        changementItineraire: boolean;
        alerteSecurite: boolean;
        rapportQuotidien: boolean;
    };

    // TARIFS
    tarifs: {
        deviseDefaut: string;
        paiementMensuel: boolean;
        paiementTrimestriel: boolean;
        reductionFratriePct: number;
        escomptePct: number;
        penaliteRetardPct: number;
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
 * Configuration par défaut du module transport
 */
export const TRANSPORT_DEFAULT_CONFIG: TransportConfig = {
    lignes: {
        gpsActif: false,
        suiviTempsReel: false,
        notificationDepart: true,
        notificationArrivee: true,
        delaiAlerteRetardMinutes: 10,
    },
    inscriptions: {
        validationRequise: false,
        niveauxValidation: 2,
        rolesValidation: {
            '1': 'RESPONSABLE_TRANSPORT',
            '2': 'ADMIN',
        },
        quotaMaxParLigne: 50,
        listeAttenteActive: true,
        delaiAnnulationJours: 3,
    },
    presences: {
        qrCodeActif: true,
        scanAutoActif: true,
        notificationAbsence: true,
        delaiGraceMinutes: 5,
        justificatifRequis: false,
    },
    notifications: {
        retardBusActif: true,
        seuilRetardMinutes: 5,
        changementItineraire: true,
        alerteSecurite: true,
        rapportQuotidien: true,
    },
    tarifs: {
        deviseDefaut: 'FCFA',
        paiementMensuel: true,
        paiementTrimestriel: true,
        reductionFratriePct: 10,
        escomptePct: 0,
        penaliteRetardPct: 5,
    },
    rapports: {
        generationAutoActive: true,
        frequenceDefaut: 'HEBDOMADAIRE',
        formatExportDefaut: 'PDF',
        destinatairesDefaut: ['RESPONSABLE_TRANSPORT', 'ADMIN'],
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
