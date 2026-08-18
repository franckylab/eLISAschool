/**
 * ==================================
 * eLISAschool - Service Portal Parent
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Service dédié au portal parent pour consulter
 * les données de ses enfants (notes, bulletins, cantine, transport, finances).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { parentService } from '@modules/parents/services';
import { notesService } from '@modules/notes/services';
import { StatutNote } from '@modules/notes/entities';
import { bulletinsService } from '@modules/bulletins/services';
import { coefficientResolverService } from '@modules/matieres/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Service Portal Parent
 * 
 * Centralise toutes les requêtes des parents vers les données de leurs enfants
 * avec vérification automatique des droits d'accès.
 */
export class PortalParentService {
    private eleveRepo: Repository<any>;
    private cantineRepo: Repository<any>;
    private transportRepo: Repository<any>;
    private paiementRepo: Repository<any>;

    constructor() {
        this.eleveRepo = AppDataSource.getRepository('Eleve');
        this.cantineRepo = AppDataSource.getRepository('InscriptionCantine');
        this.transportRepo = AppDataSource.getRepository('InscriptionTransport');
        this.paiementRepo = AppDataSource.getRepository('RecuPaiement');
    }

    /**
     * Vérifier et récupérer les enfants d'un parent
     */
    async getEnfantsParent(parentId: string): Promise<any[]> {
        const responsabilites = await parentService.getEnfantsParent(parentId);

        const enfants = [];
        for (const resp of responsabilites) {
            const eleve = await this.eleveRepo.findOne({
                where: { utilisateurId: resp.enfantId },
                relations: ['utilisateur', 'classe', 'classe.niveau'],
            });

            if (eleve) {
                enfants.push({
                    id: eleve.id,
                    matricule: eleve.matricule,
                    utilisateurId: eleve.utilisateurId,
                    nom: eleve.utilisateur?.nom,
                    prenom: eleve.utilisateur?.prenom,
                    classe: eleve.classe?.libelle,
                    niveau: eleve.classe?.niveau?.libelle,
                    lienParente: resp.lienParente,
                    peutConsulter: resp.peutConsulter,
                    peutPayer: resp.peutPayer,
                });
            }
        }

        return enfants;
    }

    /**
     * Récupérer les notes d'un enfant pour un parent
     */
    async getNotesEnfant(parentId: string, enfantId: string, filters?: {
        periodeId?: string;
        matiereId?: string;
        limit?: number;
    }): Promise<any> {
        // Vérifier l'accès
        const peutAcceder = await parentService.peutAccederEleve(parentId, enfantId);
        if (!peutAcceder) {
            throw new AppError('Accès non autorisé à cet élève', 403, 'PARENT_ACCESS_DENIED');
        }

        // Récupérer l'élève
        const eleve = await this.eleveRepo.findOne({
            where: { utilisateurId: enfantId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'ELEVE_NOT_FOUND');
        }

        // R3 : les parents ne voient que les notes publiées (option config pour inclure les validées)
        const inclureValidees = await getParamBoolean('notes.parent_voir_validees', {
            etablissementId: eleve.etablissementId,
            defaultValue: false,
        });

        // Récupérer les notes
        const notes = await notesService.findAll({
            page: 1,
            limit: filters?.limit || 50,
            eleveId: eleve.id,
            periodeId: filters?.periodeId,
            matiereId: filters?.matiereId,
            statuts: inclureValidees ? [StatutNote.VALIDEE, StatutNote.PUBLIEE] : [StatutNote.PUBLIEE],
        }, eleve.etablissementId);

        // Moyennes par matière pondérées par le coefficient de chaque note
        const cumuls = new Map<string, { somme: number; poids: number }>();
        for (const note of notes.items) {
            const cumul = cumuls.get(note.matiereId) ?? { somme: 0, poids: 0 };
            const coefficient = Number(note.coefficient) || 1;
            cumul.somme += (note.noteSur20 ?? 0) * coefficient;
            cumul.poids += coefficient;
            cumuls.set(note.matiereId, cumul);
        }

        const moyennesParMatiere: Record<string, number> = {};
        for (const [matiereId, cumul] of cumuls) {
            if (cumul.poids > 0) {
                moyennesParMatiere[matiereId] = Math.round((cumul.somme / cumul.poids) * 100) / 100;
            }
        }

        // Moyenne générale pondérée par le coefficient de chaque matière
        let moyenneGenerale: number | null = null;
        const matiereIds = Object.keys(moyennesParMatiere);
        const classeAnneeId = notes.items[0]?.classeAnneeId;
        if (matiereIds.length > 0 && classeAnneeId) {
            const coefficients = await coefficientResolverService.resoudreCoefficients(
                classeAnneeId,
                matiereIds,
                eleve.etablissementId,
            );
            let somme = 0;
            let poids = 0;
            for (const matiereId of matiereIds) {
                const coef = coefficients.get(matiereId)?.coefficient ?? 1;
                somme += moyennesParMatiere[matiereId] * coef;
                poids += coef;
            }
            if (poids > 0) {
                moyenneGenerale = Math.round((somme / poids) * 100) / 100;
            }
        }

        return {
            eleve: {
                id: eleve.id,
                matricule: eleve.matricule,
            },
            notes: notes.items,
            total: notes.meta.totalItems,
            moyennesParMatiere,
            moyenneGenerale,
        };
    }

    /**
     * Récupérer les bulletins d'un enfant
     */
    async getBulletinsEnfant(parentId: string, enfantId: string): Promise<any> {
        const peutAcceder = await parentService.peutAccederEleve(parentId, enfantId);
        if (!peutAcceder) {
            throw new AppError('Accès non autorisé à cet élève', 403, 'PARENT_ACCESS_DENIED');
        }

        const eleve = await this.eleveRepo.findOne({
            where: { utilisateurId: enfantId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'ELEVE_NOT_FOUND');
        }

        // Récupérer les bulletins (R3 : uniquement les bulletins publiés)
        const bulletins = await bulletinsService.findByEleve(eleve.id, eleve.etablissementId, { publie: true });

        return {
            eleve: {
                id: eleve.id,
                matricule: eleve.matricule,
            },
            bulletins,
        };
    }

    /**
     * Récupérer la situation cantine d'un enfant
     */
    async getCantineEnfant(parentId: string, enfantId: string): Promise<any> {
        const peutAcceder = await parentService.peutAccederEleve(parentId, enfantId);
        if (!peutAcceder) {
            throw new AppError('Accès non autorisé à cet élève', 403, 'PARENT_ACCESS_DENIED');
        }

        const eleve = await this.eleveRepo.findOne({
            where: { utilisateurId: enfantId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'ELEVE_NOT_FOUND');
        }

        // Récupérer l'inscription cantine
        const inscription = await this.cantineRepo.findOne({
            where: { eleveId: eleve.id, statut: 'ACTIVE' },
        });

        return {
            eleve: {
                id: eleve.id,
                matricule: eleve.matricule,
            },
            cantine: inscription ? {
                solde: inscription.solde,
                statut: inscription.statut,
                dateInscription: inscription.dateInscription,
            } : null,
        };
    }

    /**
     * Récupérer la situation transport d'un enfant
     */
    async getTransportEnfant(parentId: string, enfantId: string): Promise<any> {
        const peutAcceder = await parentService.peutAccederEleve(parentId, enfantId);
        if (!peutAcceder) {
            throw new AppError('Accès non autorisé à cet élève', 403, 'PARENT_ACCESS_DENIED');
        }

        const eleve = await this.eleveRepo.findOne({
            where: { utilisateurId: enfantId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'ELEVE_NOT_FOUND');
        }

        // Récupérer l'inscription transport
        const inscription = await this.transportRepo.findOne({
            where: { eleveId: eleve.id, actif: true },
            relations: ['ligne'],
        });

        return {
            eleve: {
                id: eleve.id,
                matricule: eleve.matricule,
            },
            transport: inscription ? {
                ligne: inscription.ligne?.nom,
                arretMontee: inscription.arretMontee,
                arretDescente: inscription.arretDescente,
                soldePaye: inscription.soldePaye,
            } : null,
        };
    }

    /**
     * Récupérer l'historique des paiements d'un enfant
     */
    async getPaiementsEnfant(parentId: string, enfantId: string): Promise<any> {
        const peutPayer = await parentService.peutPayerPourEleve(parentId, enfantId);
        if (!peutPayer) {
            throw new AppError('Accès non autorisé aux paiements de cet élève', 403, 'PARENT_PAYMENT_DENIED');
        }

        const eleve = await this.eleveRepo.findOne({
            where: { utilisateurId: enfantId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'ELEVE_NOT_FOUND');
        }

        // Récupérer les paiements
        const paiements = await this.paiementRepo.find({
            where: { eleveId: eleve.id },
            order: { datePaiement: 'DESC' },
            take: 50,
        });

        return {
            eleve: {
                id: eleve.id,
                matricule: eleve.matricule,
            },
            paiements,
            totalPaye: paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0),
        };
    }

    /**
     * Dashboard parent - Vue d'ensemble de tous les enfants
     */
    async getDashboardParent(parentId: string): Promise<any> {
        const enfants = await this.getEnfantsParent(parentId);

        const dashboard = {
            nbEnfants: enfants.length,
            enfants: [] as any[],
            resumGlobal: {
                moyenneGenerale: 0,
                nbBulletinsPublies: 0,
                alertesCantine: 0,
                alertesTransport: 0,
            },
        };

        for (const enfant of enfants) {
            try {
                // Notes récentes
                const notes = await this.getNotesEnfant(parentId, enfant.utilisateurId, { limit: 10 });
                
                // Bulletin dernier
                const bulletins = await this.getBulletinsEnfant(parentId, enfant.utilisateurId);
                const dernierBulletin = bulletins.bulletins?.[0];

                // Cantine
                const cantine = await this.getCantineEnfant(parentId, enfant.utilisateurId);
                
                // Transport
                const transport = await this.getTransportEnfant(parentId, enfant.utilisateurId);

                dashboard.enfants.push({
                    id: enfant.id,
                    matricule: enfant.matricule,
                    nom: `${enfant.nom} ${enfant.prenom}`,
                    classe: enfant.classe,
                    derniereMoyenne: dernierBulletin?.moyenneGenerale || null,
                    nbNotes: notes.total,
                    cantineSolde: cantine.cantine?.solde || null,
                    transportLigne: transport.transport?.ligne || null,
                    alertes: {
                        cantine: cantine.cantine?.solde < 0,
                        transport: transport.transport?.soldePaye < 0,
                    },
                });

                // Agréger statistiques
                if (dernierBulletin?.moyenneGenerale) {
                    dashboard.resumGlobal.moyenneGenerale += dernierBulletin.moyenneGenerale;
                }
                if (bulletins.bulletins?.length > 0) {
                    dashboard.resumGlobal.nbBulletinsPublies += 1;
                }
                if (cantine.cantine?.solde < 0) {
                    dashboard.resumGlobal.alertesCantine += 1;
                }
                if (transport.transport?.soldePaye < 0) {
                    dashboard.resumGlobal.alertesTransport += 1;
                }
            } catch (error) {
                logger.warn(`Erreur dashboard enfant ${enfant.id}:`, error);
            }
        }

        // Calculer moyenne globale
        if (dashboard.enfants.length > 0) {
            dashboard.resumGlobal.moyenneGenerale = 
                Math.round((dashboard.resumGlobal.moyenneGenerale / dashboard.enfants.length) * 100) / 100;
        }

        return dashboard;
    }
}

export const portalParentService = new PortalParentService();
export default PortalParentService;
