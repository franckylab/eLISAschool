/**
 * ==================================
 * eLISAschool - Tests unitaires ActionCritiqueService
 * ==================================
 *
 * Teste le workflow d'approbation 2 facteurs (MFA) :
 * - Demande → EN_ATTENTE + expiration 24h + doublon cible
 * - Approbation → MFA TOTP + auto-approbation interdite + max tentatives
 * - Exécution → seulement si APPROUVEE
 * - Rejet → motif obligatoire
 * - Annulation → demandeur uniquement
 * - Expiration → bulk update
 * - Statistiques → agrégats par statut/type
 * - Entité → getters (estEnAttente, estExpiree, peutApprouver, typeActionLabel)
 *
 * Refonte SaaS v7 — Lot F.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockRepo = {
    query: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data: unknown) => data),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        getRawMany: jest.fn(),
        getRawOne: jest.fn(),
        getOne: jest.fn(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
    })),
    count: jest.fn(),
};

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Mock MFAService
const mockMFAService = {
    verifierMFA: jest.fn(),
    isMFAEnabled: jest.fn(),
};

jest.mock('@modules/auth/services/mfa.service', () => ({
    MFAService: jest.fn().mockImplementation(() => mockMFAService),
}));

// Mock AuditService
const mockAuditService = {
    log: jest.fn(),
};

jest.mock('@modules/auth/services/audit.service', () => ({
    AuditService: jest.fn().mockImplementation(() => mockAuditService),
}));

import { ActionCritiqueService } from '../../src/modules/billing/services/action-critique.service';
import {
    TypeActionCritique,
    StatutActionCritique,
    ACTION_CRITIQUE_EXPIRATION_HEURES,
    ACTION_CRITIQUE_MAX_TENTATIVES,
    ActionCritique,
} from '../../src/modules/billing/entities/action-critique.entity';

// ─── Helpers ───

function creerAction(overrides: Partial<ActionCritique> = {}): ActionCritique {
    const action = new ActionCritique();
    action.id = 'action-uuid-001';
    action.typeAction = TypeActionCritique.SUSPENDRE;
    action.statut = StatutActionCritique.EN_ATTENTE;
    action.payload = { abonnementId: 'abo-123' };
    action.demandeurId = 'demandeur-uuid';
    action.dateExpiration = new Date(Date.now() + 3600000); // +1h
    action.tentativesApprobation = 0;
    action.createdAt = new Date();
    action.updatedAt = new Date();
    Object.assign(action, overrides);
    return action;
}

const DEMANDEUR_ID = 'demandeur-uuid';
const APPROUVEUR_ID = 'approbateur-uuid';

// ─── Tests ───

describe('ActionCritiqueService', () => {
    let service: ActionCritiqueService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Réinitialiser les mocks MFA/Audit
        mockMFAService.verifierMFA.mockReset();
        mockMFAService.isMFAEnabled.mockReset();
        mockAuditService.log.mockReset();
        mockRepo.findOne.mockReset();
        mockRepo.save.mockReset();
        mockRepo.create.mockImplementation((data: unknown) => data);

        service = new ActionCritiqueService();
    });

    // =============================================
    // ENTITY GETTERS
    // =============================================

    describe('ActionCritique — Getters utilitaires', () => {
        it('estEnAttente → true si statut EN_ATTENTE', () => {
            const action = creerAction({ statut: StatutActionCritique.EN_ATTENTE });
            expect(action.estEnAttente).toBe(true);
        });

        it('estEnAttente → false si statut APPROUVEE', () => {
            const action = creerAction({ statut: StatutActionCritique.APPROUVEE });
            expect(action.estEnAttente).toBe(false);
        });

        it('estExpiree → true si EN_ATTENTE et dateExpiration passée', () => {
            const action = creerAction({
                statut: StatutActionCritique.EN_ATTENTE,
                dateExpiration: new Date(Date.now() - 1000),
            });
            expect(action.estExpiree).toBe(true);
        });

        it('estExpiree → false si EN_ATTENTE et dateExpiration future', () => {
            const action = creerAction({
                statut: StatutActionCritique.EN_ATTENTE,
                dateExpiration: new Date(Date.now() + 3600000),
            });
            expect(action.estExpiree).toBe(false);
        });

        it('estExpiree → false si statut non EN_ATTENTE (même si date passée)', () => {
            const action = creerAction({
                statut: StatutActionCritique.APPROUVEE,
                dateExpiration: new Date(Date.now() - 1000),
            });
            expect(action.estExpiree).toBe(false);
        });

        it('peutApprouver → true si en attente + non expirée + tentatives < max', () => {
            const action = creerAction({
                statut: StatutActionCritique.EN_ATTENTE,
                dateExpiration: new Date(Date.now() + 3600000),
                tentativesApprobation: 2,
            });
            expect(action.peutApprouver).toBe(true);
        });

        it('peutApprouver → false si tentatives >= max', () => {
            const action = creerAction({
                statut: StatutActionCritique.EN_ATTENTE,
                dateExpiration: new Date(Date.now() + 3600000),
                tentativesApprobation: ACTION_CRITIQUE_MAX_TENTATIVES,
            });
            expect(action.peutApprouver).toBe(false);
        });

        it('peutApprouver → false si expirée', () => {
            const action = creerAction({
                statut: StatutActionCritique.EN_ATTENTE,
                dateExpiration: new Date(Date.now() - 1000),
                tentativesApprobation: 0,
            });
            expect(action.peutApprouver).toBe(false);
        });

        it('typeActionLabel → label français correct pour chaque type', () => {
            const types: [TypeActionCritique, string][] = [
                [TypeActionCritique.RESILIER, 'Résilier'],
                [TypeActionCritique.SUSPENDRE, 'Suspendre'],
                [TypeActionCritique.UPGRADE, 'Changer de plan'],
                [TypeActionCritique.SUPPRIMER_ETABLISSEMENT, "Supprimer l'établissement"],
                [TypeActionCritique.ACCORDER_AVOIR, 'Accorder un avoir'],
                [TypeActionCritique.RESTAURER_BACKUP, 'Restaurer un backup'],
                [TypeActionCritique.REINITIALISER_GLOBAL, 'Réinitialiser'],
                [TypeActionCritique.MODIFIER_TARIFS, 'Modifier les tarifs'],
            ];

            for (const [type, expectedFragment] of types) {
                const action = creerAction({ typeAction: type });
                expect(action.typeActionLabel).toContain(expectedFragment);
            }
        });
    });

    // =============================================
    // DEMANDER ACTION
    // =============================================

    describe('demanderAction — Création demande EN_ATTENTE', () => {
        it('devrait créer une action EN_ATTENTE avec expiration 24h', async () => {
            mockRepo.findOne.mockResolvedValue(null); // pas de doublon
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            const result = await service.demanderAction({
                typeAction: TypeActionCritique.SUSPENDRE,
                payload: { abonnementId: 'abo-123' },
                raison: 'Non-paiement prolongé',
                cibleType: 'abonnement',
                cibleId: 'abo-123',
            }, DEMANDEUR_ID);

            expect(result.typeAction).toBe(TypeActionCritique.SUSPENDRE);
            expect(result.statut).toBe(StatutActionCritique.EN_ATTENTE);
            expect(result.demandeurId).toBe(DEMANDEUR_ID);

            // Expiration ~24h
            const diff = (result.dateExpiration as Date).getTime() - Date.now();
            expect(diff).toBeGreaterThan((ACTION_CRITIQUE_EXPIRATION_HEURES - 1) * 3600000);

            // Audit appelé
            expect(mockAuditService.log).toHaveBeenCalledTimes(1);
        });

        it('devrait rejeter si une action identique est déjà en attente (doublon cible)', async () => {
            mockRepo.findOne.mockResolvedValue(creerAction());

            await expect(
                service.demanderAction({
                    typeAction: TypeActionCritique.SUSPENDRE,
                    payload: {},
                    cibleType: 'abonnement',
                    cibleId: 'abo-123',
                }, DEMANDEUR_ID),
            ).rejects.toThrow('ACTION_CRITIQUE_EXISTANTE');
        });

        it('ne devrait PAS vérifier le doublon si cibleType/cibleId absents', async () => {
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            await service.demanderAction({
                typeAction: TypeActionCritique.MODIFIER_TARIFS,
                payload: { nouveauxTarifs: [] },
            }, DEMANDEUR_ID);

            // findOne ne doit pas être appelé (pas de cible)
            expect(mockRepo.findOne).not.toHaveBeenCalled();
        });
    });

    // =============================================
    // APPROUVER ACTION (2F MFA)
    // =============================================

    describe('approuverAction — Workflow MFA 2 facteurs', () => {
        it('devrait approuver si MFA valide + approbateur ≠ demandeur', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));
            mockMFAService.isMFAEnabled.mockResolvedValue(true);
            mockMFAService.verifierMFA.mockResolvedValue({ success: true });

            const result = await service.approuverAction(
                'action-uuid-001',
                APPROUVEUR_ID,
                { codeMFA: '123456' },
            );

            expect(result.statut).toBe(StatutActionCritique.APPROUVEE);
            expect(result.approuveurId).toBe(APPROUVEUR_ID);
            expect(result.dateApprobation).toBeDefined();
            expect(result.mfaVerificationHash).toBeTruthy();
            expect(mockAuditService.log).toHaveBeenCalledTimes(1);
        });

        it('devrait interdire l\'auto-approbation (demandeur = approbateur)', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.approuverAction('action-uuid-001', DEMANDEUR_ID, { codeMFA: '123456' }),
            ).rejects.toThrow('AUTO_APPROBATION_INTERDITE');
        });

        it('devrait rejeter si le statut n\'est pas EN_ATTENTE', async () => {
            const action = creerAction({ statut: StatutActionCritique.APPROUVEE });
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.approuverAction('action-uuid-001', APPROUVEUR_ID, { codeMFA: '123456' }),
            ).rejects.toThrow('ACTION_CRITIQUE_INVALIDE');
        });

        it('devrait marquer EXPIREE si la date d\'expiration est dépassée', async () => {
            const action = creerAction({
                dateExpiration: new Date(Date.now() - 1000),
            });
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            await expect(
                service.approuverAction('action-uuid-001', APPROUVEUR_ID, { codeMFA: '123456' }),
            ).rejects.toThrow('ACTION_CRITIQUE_EXPIREE');

            expect(action.statut).toBe(StatutActionCritique.EXPIREE);
        });

        it('devrait bloquer si max tentatives atteint', async () => {
            const action = creerAction({ tentativesApprobation: ACTION_CRITIQUE_MAX_TENTATIVES });
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.approuverAction('action-uuid-001', APPROUVEUR_ID, { codeMFA: '123456' }),
            ).rejects.toThrow('ACTION_CRITIQUE_BLOQUEE');
        });

        it('devrait exiger MFA activé chez l\'approbateur', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);
            mockMFAService.isMFAEnabled.mockResolvedValue(false);

            await expect(
                service.approuverAction('action-uuid-001', APPROUVEUR_ID, { codeMFA: '123456' }),
            ).rejects.toThrow('MFA_REQUIS_POUR_APPROBATION');
        });

        it('devrait incrémenter les tentatives si code MFA invalide', async () => {
            const action = creerAction({ tentativesApprobation: 2 });
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));
            mockMFAService.isMFAEnabled.mockResolvedValue(true);
            mockMFAService.verifierMFA.mockResolvedValue({ success: false });

            await expect(
                service.approuverAction('action-uuid-001', APPROUVEUR_ID, { codeMFA: '000000' }),
            ).rejects.toThrow('MFA_CODE_INVALIDE');

            expect(action.tentativesApprobation).toBe(3);
            // Audit échec MFA
            expect(mockAuditService.log).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================
    // EXÉCUTER ACTION
    // =============================================

    describe('executerAction — Marquer EXECUTEE après opération', () => {
        it('devrait marquer EXECUTEE si statut APPROUVEE', async () => {
            const action = creerAction({
                statut: StatutActionCritique.APPROUVEE,
                approuveurId: APPROUVEUR_ID,
            });
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            const result = await service.executerAction('action-uuid-001', { succes: true });

            expect(result.statut).toBe(StatutActionCritique.EXECUTEE);
            expect(result.dateExecution).toBeDefined();
            expect(result.resultatExecution).toEqual({ succes: true });
        });

        it('devrait rejeter si statut ≠ APPROUVEE', async () => {
            const action = creerAction({ statut: StatutActionCritique.EN_ATTENTE });
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.executerAction('action-uuid-001'),
            ).rejects.toThrow('ACTION_CRITIQUE_NON_APPROUVEE');
        });
    });

    // =============================================
    // REJETER ACTION
    // =============================================

    describe('rejeterAction — Rejet avec motif', () => {
        it('devrait rejeter une action EN_ATTENTE avec motif', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            const result = await service.rejeterAction(
                'action-uuid-001',
                APPROUVEUR_ID,
                { motif: 'Procédure non conforme' },
            );

            expect(result.statut).toBe(StatutActionCritique.REJETEE);
            expect(result.approuveurId).toBe(APPROUVEUR_ID);
            expect(result.motifRejet).toBe('Procédure non conforme');
        });

        it('devrait rejeter le rejet si statut ≠ EN_ATTENTE', async () => {
            const action = creerAction({ statut: StatutActionCritique.EXECUTEE });
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.rejeterAction('action-uuid-001', APPROUVEUR_ID, { motif: 'trop tard' }),
            ).rejects.toThrow('ACTION_CRITIQUE_INVALIDE');
        });
    });

    // =============================================
    // ANNULER ACTION
    // =============================================

    describe('annulerAction — Annulation par le demandeur', () => {
        it('devrait annuler si demandeur initial + EN_ATTENTE', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);
            mockRepo.save.mockImplementation((a: unknown) => Promise.resolve(a));

            const result = await service.annulerAction('action-uuid-001', DEMANDEUR_ID);

            expect(result.statut).toBe(StatutActionCritique.ANNULEE);
        });

        it('devrait interdire l\'annulation par un tiers', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.annulerAction('action-uuid-001', 'tiers-uuid'),
            ).rejects.toThrow('ANNULATION_NON_AUTORISEE');
        });

        it('devrait interdire l\'annulation si statut ≠ EN_ATTENTE', async () => {
            const action = creerAction({ statut: StatutActionCritique.APPROUVEE });
            mockRepo.findOne.mockResolvedValue(action);

            await expect(
                service.annulerAction('action-uuid-001', DEMANDEUR_ID),
            ).rejects.toThrow('ACTION_CRITIQUE_INVALIDE');
        });
    });

    // =============================================
    // EXPIRATION
    // =============================================

    describe('expirerActionsObsoletes — Bulk update cron', () => {
        it('devrait retourner le nombre d\'actions expirées', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.execute.mockResolvedValue({ affected: 3 });

            const nb = await service.expirerActionsObsoletes();

            expect(nb).toBe(3);
            expect(qb.update).toHaveBeenCalled();
            expect(qb.set).toHaveBeenCalledWith({ statut: StatutActionCritique.EXPIREE });
        });

        it('devrait retourner 0 si aucune action à expirer', async () => {
            const qb = mockRepo.createQueryBuilder();
            qb.execute.mockResolvedValue({ affected: 0 });

            const nb = await service.expirerActionsObsoletes();

            expect(nb).toBe(0);
        });
    });

    // =============================================
    // GET ACTION (détail)
    // =============================================

    describe('getAction — Détail', () => {
        it('devrait retourner l\'action si elle existe', async () => {
            const action = creerAction();
            mockRepo.findOne.mockResolvedValue(action);

            const result = await service.getAction('action-uuid-001');

            expect(result.id).toBe('action-uuid-001');
            expect(mockRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'action-uuid-001' } }),
            );
        });

        it('devrait throw 404 si action introuvable', async () => {
            mockRepo.findOne.mockResolvedValue(null);

            await expect(service.getAction('inexistant')).rejects.toThrow('ACTION_CRITIQUE_NOT_FOUND');
        });
    });

    // =============================================
    // CONSTANTES
    // =============================================

    describe('Constantes métier', () => {
        it('ACTION_CRITIQUE_EXPIRATION_HEURES = 24', () => {
            expect(ACTION_CRITIQUE_EXPIRATION_HEURES).toBe(24);
        });

        it('ACTION_CRITIQUE_MAX_TENTATIVES = 5', () => {
            expect(ACTION_CRITIQUE_MAX_TENTATIVES).toBe(5);
        });

        it('8 types d\'actions critiques définis', () => {
            expect(Object.keys(TypeActionCritique)).toHaveLength(8);
        });

        it('6 statuts workflow définis', () => {
            expect(Object.keys(StatutActionCritique)).toHaveLength(6);
        });
    });
});
