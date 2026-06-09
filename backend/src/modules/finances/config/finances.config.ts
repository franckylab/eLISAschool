/**
 * ==================================
 * eLISAschool - Configuration Module Finances
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration centralisée du module finances
 */

export interface FinancesConfig {
    // SCOLARITÉ
    scolarite: {
        fraisInscriptionDefaut: number;
        nombreTranchesDefaut: number;
        frequenceEcheanceDefaut: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';
        joursGraceDefaut: number;
        penaliteRetardPct: number;
        penalitePlafondPct: number;
        relanceAutoActive: boolean;
        relanceFrequenceJours: number;
        relanceSeuilMin: number;
        modePaiementMobileActif: boolean;
    };

    // DÉPENSES
    depenses: {
        doubleValidationSeuil: number;
        approbationAutoActive: boolean;
        tvaDefautPct: number;
        categorieRequise: boolean;
        factureRequise: boolean;
        budgetVerificationActive: boolean;
        budgetBloquant: boolean;
        delaiPaiementJours: number;
        escomptePct: number;
        archivageDureeMois: number;
        exportFormatDefaut: 'PDF' | 'EXCEL' | 'CSV';
        notificationDemandeActive: boolean;
    };

    // COMPTABILITÉ
    comptabilite: {
        planComptable: 'OHADA' | 'SYSCOHADA' | 'SIMPLIFIE';
        ecritureAutoActive: boolean;
        numeroSequencePrefix: string;
        exerciceComptableDebut: string; // MM-DD
        exerciceComptableFin: string; // MM-DD
        clotureAutoActive: boolean;
        validationObligatoire: boolean;
        archivageLegalDuree: number; // mois
    };

    // TRÉSORERIE
    tresorerie: {
        seuilAlerteCaisse: number;
        seuilCritiqueCaisse: number;
        plafondCaisseEspeces: number;
        verificationCaisseQuotidienne: boolean;
        doubleSignatureSeuil: number;
        clotureCaisseHeure: string; // HH:MM
        ecartTolerance: number;
        virementApprovalRequise: boolean;
        releveBancaireImportActif: boolean;
        modeGestionCaisse: 'UNIQUE_CAISSE' | 'MULTI_CAISSE';
    };

    // BUDGET
    budget: {
        exerciceAnnuel: boolean;
        validationWorkflowActif: boolean;
        seuilAlertePct: number;
        seuilCritiquePct: number;
        blocageDepassement: boolean;
        reportExcedentActif: boolean;
        virementLigneActif: boolean;
        virementLigneSeuilPct: number;
        budgetAdditionnelActif: boolean;
        notificationAlerteActive: boolean;
    };

    // DASHBOARD
    dashboard: {
        kpiTauxRecouvrementCible: number;
        kpiDepensesBudgetMaxPct: number;
        cacheTtlSecondes: number;
        graphiquePeriodeDefaut: number; // jours
    };

    // RAPPORTS
    rapports: {
        generationAutoActive: boolean;
        frequenceDefaut: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
        formatExportDefaut: 'PDF' | 'EXCEL' | 'CSV';
        destinatairesDefaut: string[];
    };

    // WORKFLOW
    workflow: {
        validationPaiement: {
            requireValidation: boolean;
            levels: number[];
        };
        validationDepense: {
            requireValidation: boolean;
            levels: number[];
        };
        validationBudget: {
            requireValidation: boolean;
            levels: number[];
        };
    };

    // GÉNÉRAL
    general: {
        deviseDefaut: string;
        monnaieSymbole: string;
        arrondiMontant: 'SUPERIEUR' | 'INFERIEUR' | 'STANDARD';
        decimalesMontant: number;
        seuilImportanceMontant: number;
        auditOperationsActif: boolean;
        auditDureeRetentionMois: number;
        chiffrementDonneesActif: boolean;
        backupAutoActif: boolean;
        backupFrequence: 'QUOTIDIEN' | 'HEBDOMADAIRE';
    };
}

/**
 * Configuration par défaut du module finances
 */
export const FINANCES_DEFAULT_CONFIG: FinancesConfig = {
    scolarite: {
        fraisInscriptionDefaut: 50000,
        nombreTranchesDefaut: 3,
        frequenceEcheanceDefaut: 'TRIMESTRIEL',
        joursGraceDefaut: 8,
        penaliteRetardPct: 5,
        penalitePlafondPct: 25,
        relanceAutoActive: true,
        relanceFrequenceJours: 7,
        relanceSeuilMin: 10000,
        modePaiementMobileActif: false,
    },
    depenses: {
        doubleValidationSeuil: 500000,
        approbationAutoActive: false,
        tvaDefautPct: 19.25,
        categorieRequise: true,
        factureRequise: true,
        budgetVerificationActive: true,
        budgetBloquant: true,
        delaiPaiementJours: 30,
        escomptePct: 2,
        archivageDureeMois: 60,
        exportFormatDefaut: 'PDF',
        notificationDemandeActive: true,
    },
    comptabilite: {
        planComptable: 'OHADA',
        ecritureAutoActive: true,
        numeroSequencePrefix: 'EC',
        exerciceComptableDebut: '09-01',
        exerciceComptableFin: '08-31',
        clotureAutoActive: false,
        validationObligatoire: true,
        archivageLegalDuree: 120,
    },
    tresorerie: {
        seuilAlerteCaisse: 100000,
        seuilCritiqueCaisse: 50000,
        plafondCaisseEspeces: 5000000,
        verificationCaisseQuotidienne: true,
        doubleSignatureSeuil: 1000000,
        clotureCaisseHeure: '17:00',
        ecartTolerance: 5000,
        virementApprovalRequise: true,
        releveBancaireImportActif: false,
        modeGestionCaisse: 'MULTI_CAISSE',
    },
    budget: {
        exerciceAnnuel: true,
        validationWorkflowActif: true,
        seuilAlertePct: 80,
        seuilCritiquePct: 95,
        blocageDepassement: true,
        reportExcedentActif: false,
        virementLigneActif: true,
        virementLigneSeuilPct: 20,
        budgetAdditionnelActif: true,
        notificationAlerteActive: true,
    },
    dashboard: {
        kpiTauxRecouvrementCible: 85,
        kpiDepensesBudgetMaxPct: 90,
        cacheTtlSecondes: 300,
        graphiquePeriodeDefaut: 30,
    },
    rapports: {
        generationAutoActive: true,
        frequenceDefaut: 'MENSUEL',
        formatExportDefaut: 'PDF',
        destinatairesDefaut: ['CHEF_ETABLISSEMENT', 'ADMIN'],
    },
    workflow: {
        validationPaiement: {
            requireValidation: false,
            levels: [1],
        },
        validationDepense: {
            requireValidation: true,
            levels: [1, 2],
        },
        validationBudget: {
            requireValidation: true,
            levels: [1, 2, 3],
        },
    },
    general: {
        deviseDefaut: 'FCFA',
        monnaieSymbole: 'FCFA',
        arrondiMontant: 'SUPERIEUR',
        decimalesMontant: 0,
        seuilImportanceMontant: 10000000,
        auditOperationsActif: true,
        auditDureeRetentionMois: 60,
        chiffrementDonneesActif: true,
        backupAutoActif: true,
        backupFrequence: 'QUOTIDIEN',
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
