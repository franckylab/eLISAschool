import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours } from '@modules/personnel/entities';
import {
    CreerCreneauDto,
    ModifierCreneauDto,
    QueryCreneauxDto,
    GenererEmploiDuTempsDto,
    PreferenceEmploiDuTempsDto,
    CreateRepartitionHoraireDto,
    UpdateRepartitionHoraireDto,
} from '../dto';
import { ClasseAnnee } from '@modules/classes/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, calculatePaginationMeta } from '@common/utils/pagination.util';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { salleAvailabilityService } from '@modules/salles/services/salle-availability.service';
import { EmploiDuTemps, PreferenceEmploiDuTemps, RepartitionHoraire, JourSemaine, TypeCreneau } from '../entities';

export class EmploiDuTempsService {
    private repo: Repository<EmploiDuTemps>;
    private preferenceRepo: Repository<PreferenceEmploiDuTemps>;
    private repartitionRepo: Repository<RepartitionHoraire>;

    constructor() {
        this.repo = AppDataSource.getRepository(EmploiDuTemps);
        this.preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
        this.repartitionRepo = AppDataSource.getRepository(RepartitionHoraire);
    }

    async findAll(query: QueryCreneauxDto, etablissementId: string) {
        // Filtrer les EDT creneaux
        const edtQb = this.repo.createQueryBuilder('edt')
            .leftJoinAndSelect('edt.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('classeAnnee.anneeScolaire', 'anneeScolaire')
            .leftJoinAndSelect('edt.matiere', 'matiere')
            .leftJoinAndSelect('edt.enseignant', 'enseignant')
            .leftJoinAndSelect('edt.salle', 'salle')
            .where('edt.etablissementId = :etablissementId', { etablissementId });

        if (query.classeAnneeId) edtQb.andWhere('edt.classeAnneeId = :classeAnneeId', { classeAnneeId: query.classeAnneeId });
        if (query.enseignantId) edtQb.andWhere('edt.enseignantId = :enseignantId', { enseignantId: query.enseignantId });
        if (query.salleId) edtQb.andWhere('edt.salleId = :salleId', { salleId: query.salleId });
        if (query.matiereId) edtQb.andWhere('edt.matiereId = :matiereId', { matiereId: query.matiereId });
        if (query.jour) edtQb.andWhere('edt.jour = :jour', { jour: query.jour });
        if (query.typeCreneau) edtQb.andWhere('edt.typeCreneau = :typeCreneau', { typeCreneau: query.typeCreneau });
        if (query.anneeScolaireId) edtQb.andWhere('edt.anneeScolaireId = :anneeScolaireId', { anneeScolaireId: query.anneeScolaireId });
        if (query.actif !== undefined) edtQb.andWhere('edt.actif = :actif', { actif: query.actif });
        if (query.genereAutomatiquement !== undefined) edtQb.andWhere('edt.genereAutomatiquement = :genereAutomatiquement', { genereAutomatiquement: query.genereAutomatiquement });
        if (query.dateDebut) edtQb.andWhere('edt.createdAt >= :dateDebut', { dateDebut: new Date(query.dateDebut) });
        if (query.dateFin) edtQb.andWhere('edt.createdAt <= :dateFin', { dateFin: new Date(query.dateFin) });

        const JOUR_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

        if (query.inclureHeuresCours) {
            // Pas de pagination DB — on fusionne en mémoire
            edtQb.orderBy('edt.jour', 'ASC').addOrderBy('edt.heureDebut', 'ASC');
            const edtItems = (await edtQb.getMany()).map((item: any) => ({ ...item, typeSource: 'edt' }));

            const heuresRepo = AppDataSource.getRepository(HeureCours);
            const hcQb = heuresRepo.createQueryBuilder('hc')
                .leftJoinAndSelect('hc.enseignant', 'enseignant')
                .leftJoinAndSelect('hc.classe', 'classe')
                .leftJoinAndSelect('hc.matiere', 'matiere')
                .leftJoinAndSelect('hc.salle', 'salle')
                .leftJoinAndSelect('hc.creneau', 'creneau')
                .where('hc.etablissementId = :etablissementId', { etablissementId });

            if (query.enseignantId) hcQb.andWhere('hc.enseignantId = :enseignantId', { enseignantId: query.enseignantId });
            if (query.salleId) hcQb.andWhere('hc.salleId = :salleId', { salleId: query.salleId });
            if (query.matiereId) hcQb.andWhere('hc.matiereId = :matiereId', { matiereId: query.matiereId });
            if (query.dateDebut) hcQb.andWhere('hc.date >= :dateDebut', { dateDebut: new Date(query.dateDebut) });
            if (query.dateFin) hcQb.andWhere('hc.date <= :dateFin', { dateFin: new Date(query.dateFin) });

            hcQb.orderBy('hc.date', 'ASC').addOrderBy('hc.heureDebut', 'ASC');
            const hcItems = (await hcQb.getMany()).map((hc: any) => {
                const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
                return {
                    ...hc,
                    jour: dayNames[new Date(hc.date).getDay()],
                    classeAnnee: null,
                    typeSource: 'heure_cours',
                };
            });

            let merged = [...edtItems, ...hcItems];
            if (query.typeSource) {
                merged = merged.filter(item => item.typeSource === query.typeSource);
            }
            merged.sort((a, b) => {
                const aIdx = JOUR_ORDER.indexOf(a.jour);
                const bIdx = JOUR_ORDER.indexOf(b.jour);
                if (aIdx !== bIdx) return aIdx - bIdx;
                return (a.heureDebut || '').localeCompare(b.heureDebut || '');
            });

            const total = merged.length;
            const page = query.page || 1;
            const limit = query.limit || 50;
            const start = (page - 1) * limit;
            const items = merged.slice(start, start + limit);

            return { items, meta: calculatePaginationMeta(total, page, limit, items.length) };
        }

        if (query.typeSource === 'heure_cours') {
            return { items: [], meta: calculatePaginationMeta(0, query.page, query.limit, 0) };
        }

        edtQb.orderBy(`edt.${query.orderBy}`, query.orderDir);
        const result = await paginateWithQueryBuilder(edtQb, query.page, query.limit);

        result.items = result.items.map((item: any) => ({
            ...item,
            typeSource: 'edt',
        }));

        return result;
    }

    async findOne(id: string, etablissementId: string): Promise<EmploiDuTemps> {
        const creneau = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'matiere', 'enseignant', 'salle'],
        });
        if (!creneau) throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');
        return creneau;
    }

    async creerCreneau(dto: CreerCreneauDto, etablissementId: string, anneeScolaireId: string): Promise<EmploiDuTemps> {
        const creneau = this.repo.create({
            classeAnneeId: dto.classeAnneeId,
            matiereId: dto.matiereId,
            enseignantId: dto.enseignantId,
            salleId: dto.salleId || undefined,
            jour: dto.jour as JourSemaine,
            heureDebut: dto.heureDebut,
            heureFin: dto.heureFin,
            typeCreneau: (dto.typeCreneau || 'COURS') as TypeCreneau,
            couleur: dto.couleur || undefined,
            notes: dto.notes,
            anneeScolaireId,
            etablissementId,
            genereAutomatiquement: false,
            actif: true,
        });

        await this.repo.save(creneau);
        logger.info(`[EmploiDuTemps] Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`);
        return this.findOne(creneau.id, etablissementId);
    }

    async updateCreneau(id: string, dto: ModifierCreneauDto, etablissementId: string): Promise<EmploiDuTemps> {
        const creneau = await this.findOne(id, etablissementId);
        Object.assign(creneau, dto);
        await this.repo.save(creneau);
        logger.info(`[EmploiDuTemps] Créneau modifié: ${id}`);
        return this.findOne(id, etablissementId);
    }

    async supprimerCreneau(id: string, etablissementId: string): Promise<void> {
        const creneau = await this.findOne(id, etablissementId);
        await this.repo.remove(creneau);
        logger.info(`[EmploiDuTemps] Créneau supprimé: ${id}`);
    }

    async findByClasseAnnee(classeAnneeId: string, etablissementId: string): Promise<EmploiDuTemps[]> {
        return this.repo.find({
            where: { classeAnneeId, etablissementId, actif: true },
            relations: ['matiere', 'enseignant', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'salle'],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        });
    }

    async findByEnseignant(enseignantId: string, anneeScolaireId: string, etablissementId: string): Promise<EmploiDuTemps[]> {
        return this.repo.find({
            where: { enseignantId, anneeScolaireId, etablissementId, actif: true },
            relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'matiere', 'salle'],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        });
    }

    async findBySalle(salleId: string, anneeScolaireId: string, etablissementId: string): Promise<EmploiDuTemps[]> {
        return this.repo.find({
            where: { salleId, anneeScolaireId, etablissementId, actif: true },
            relations: ['matiere', 'enseignant', 'classeAnnee', 'classeAnnee.classe'],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        });
    }

    async genererEmploiDuTemps(dto: GenererEmploiDuTempsDto, etablissementId: string): Promise<{
        success: boolean;
        message: string;
        nombreCreneaux: number;
        conflits: string[];
    }> {
        const { classeAnneeId, options } = dto;

        const preferences = await this.getPreferences(etablissementId);

        if (options?.regenerer) {
            await this.repo.delete({ classeAnneeId, etablissementId });
        }

        const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: classeAnneeId, etablissementId },
        });
        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }
        const anneeScolaireId = classeAnnee.anneeScolaireId;

        const affectationsRepo = AppDataSource.getRepository(AffectationMatiere);
        const affectations = await affectationsRepo.find({
            where: {
                classeAnneeId,
                etablissementId,
                statut: StatutAffectationMatiere.ACTIVE,
            },
            relations: ['matiere', 'enseignant'],
        });

        if (affectations.length === 0) {
            return { success: true, message: 'Aucune affectation trouvée pour cette classe. Emploi du temps vide généré.', nombreCreneaux: 0, conflits: [] };
        }

        const plan = this.creerPlanVide(preferences);
        const creneauxGenerees: EmploiDuTemps[] = [];
        const conflits: string[] = [];

        for (const affectation of affectations) {
            const volumeHebdo = affectation.configuration?.volumeHoraireHebdo || 2;
            const dureeCreneau = preferences.dureeCreneauDefaut || 60;

            for (let i = 0; i < volumeHebdo; i++) {
                const placement = await this.trouverCreneauDisponible(
                    plan,
                    preferences,
                    affectation,
                    creneauxGenerees,
                    options?.respecterContraintes ?? true
                );

                if (placement) {
                    const creneau = this.repo.create({
                        classeAnneeId,
                        matiereId: affectation.matiereId,
                        enseignantId: affectation.enseignantId,
                        salleId: placement.salleId,
                        jour: placement.jour as JourSemaine,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                        typeCreneau: TypeCreneau.COURS,
                        anneeScolaireId,
                        etablissementId,
                        genereAutomatiquement: true,
                        actif: true,
                    });
                    creneauxGenerees.push(creneau);
                    this.marquerCreneauOccupe(plan, placement, affectation);
                } else {
                    conflits.push(
                        `Impossible de placer ${affectation.matiere?.nom || 'Matière'} (séance ${i + 1}/${volumeHebdo})`
                    );
                }
            }
        }

        if (creneauxGenerees.length > 0) {
            await this.repo.save(creneauxGenerees);
        }

        const success = conflits.length === 0;
        return {
            success,
            message: success
                ? `Emploi du temps généré avec succès : ${creneauxGenerees.length} créneaux`
                : `Génération partielle : ${creneauxGenerees.length} créneaux placés, ${conflits.length} conflits`,
            nombreCreneaux: creneauxGenerees.length,
            conflits,
        };
    }

    async getPreferences(etablissementId: string): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({ where: { etablissementId } });
        if (!preferences) {
            preferences = this.preferenceRepo.create({ etablissementId });
            await this.preferenceRepo.save(preferences);
        }
        return preferences;
    }

    async updatePreferences(etablissementId: string, dto: PreferenceEmploiDuTempsDto): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({ where: { etablissementId } });
        if (!preferences) preferences = this.preferenceRepo.create({ etablissementId });
        Object.assign(preferences, dto);
        await this.preferenceRepo.save(preferences);
        return preferences;
    }

    async findRepartitions(filters: { etablissementId?: string; affectationId?: string; jourSemaine?: string }) {
        const where: FindOptionsWhere<RepartitionHoraire> = {};
        if (filters.etablissementId) where.etablissementId = filters.etablissementId;
        if (filters.affectationId) where.affectationId = filters.affectationId;
        if (filters.jourSemaine) where.jourSemaine = filters.jourSemaine as any;
        return this.repartitionRepo.find({
            where,
            relations: ['affectation', 'affectation.matiere', 'affectation.enseignant', 'affectation.classe'],
            order: { jourSemaine: 'ASC', heureDebut: 'ASC' },
        });
    }

    async createRepartition(dto: CreateRepartitionHoraireDto, etablissementId?: string): Promise<RepartitionHoraire> {
        const repartition = this.repartitionRepo.create({ ...dto, etablissementId, jourSemaine: dto.jourSemaine as any });
        await this.repartitionRepo.save(repartition);
        return repartition;
    }

    async createRepartitionsBatch(dtos: CreateRepartitionHoraireDto[], etablissementId?: string): Promise<RepartitionHoraire[]> {
        const repartitions = dtos.map(dto =>
            this.repartitionRepo.create({ ...dto, etablissementId, jourSemaine: dto.jourSemaine as any })
        );
        await this.repartitionRepo.save(repartitions);
        return repartitions;
    }

    async getRepartition(id: string): Promise<RepartitionHoraire> {
        const repartition = await this.repartitionRepo.findOne({
            where: { id },
            relations: ['affectation', 'affectation.matiere', 'affectation.enseignant', 'affectation.classe'],
        });
        if (!repartition) throw new AppError('Répartition horaire non trouvée', 404, 'NOT_FOUND');
        return repartition;
    }

    async updateRepartition(id: string, dto: UpdateRepartitionHoraireDto): Promise<RepartitionHoraire> {
        const repartition = await this.getRepartition(id);
        Object.assign(repartition, dto);
        await this.repartitionRepo.save(repartition);
        return repartition;
    }

    async deleteRepartition(id: string): Promise<void> {
        const repartition = await this.getRepartition(id);
        await this.repartitionRepo.remove(repartition);
    }

    private creerPlanVide(preferences: PreferenceEmploiDuTemps): any {
        const plan: any = {};
        const jours = preferences.joursTravailles || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const heureDebut = preferences.heureDebutCours || '07:00';
        const heureFin = preferences.heureFinCours || '17:00';

        for (const jour of jours) {
            plan[jour] = {};
            let heure = heureDebut;
            while (heure < heureFin) {
                plan[jour][heure] = { occupe: false, enseignantId: null, matiereId: null };
                const [h, m] = heure.split(':').map(Number);
                const nouvelleHeure = new Date();
                nouvelleHeure.setHours(h, m + (preferences.dureeCreneauDefaut || 60), 0, 0);
                heure = `${String(nouvelleHeure.getHours()).padStart(2, '0')}:${String(nouvelleHeure.getMinutes()).padStart(2, '0')}`;
            }
        }
        return plan;
    }

    private async trouverCreneauDisponible(
        plan: any, preferences: PreferenceEmploiDuTemps, affectation: any,
        creneauxExistants: EmploiDuTemps[], respecterContraintes: boolean
    ): Promise<{ jour: string; heureDebut: string; heureFin: string; salleId?: string } | null> {
        const jours = preferences.joursTravailles || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const dureeCreneau = preferences.dureeCreneauDefaut || 60;
        const enseignantId = affectation.enseignantId;

        for (const jour of jours) {
            if (!plan[jour]) continue;
            const creneaux = Object.keys(plan[jour]).sort();

            for (let i = 0; i < creneaux.length; i++) {
                const heureDebut = creneaux[i];
                if (plan[jour][heureDebut].occupe) continue;
                if (respecterContraintes && !this.enseignantDisponible(enseignantId, jour, heureDebut, creneauxExistants)) continue;

                const [h, m] = heureDebut.split(':').map(Number);
                const heureFinDate = new Date();
                heureFinDate.setHours(h, m + dureeCreneau, 0, 0);
                const heureFin = `${String(heureFinDate.getHours()).padStart(2, '0')}:${String(heureFinDate.getMinutes()).padStart(2, '0')}`;

                let tousLibres = true;
                for (let j = i; j < creneaux.length && creneaux[j] < heureFin; j++) {
                    if (plan[jour][creneaux[j]].occupe) { tousLibres = false; break; }
                }

                if (tousLibres) {
                    const salleId = await this.trouverSalleDisponible(
                        affectation.etablissementId, jour, heureDebut, heureFin
                    );
                    return { jour, heureDebut, heureFin, salleId };
                }
            }
        }
        return null;
    }

    private async trouverSalleDisponible(etablissementId: string, jour: string, heureDebut: string, heureFin: string): Promise<string | undefined> {
        try {
            const salles = await salleAvailabilityService.trouverSallesDisponibles(etablissementId, { jour, heureDebut, heureFin });
            return salles[0]?.id;
        } catch { return undefined; }
    }

    private enseignantDisponible(enseignantId: string, jour: string, heureDebut: string, creneauxExistants: EmploiDuTemps[]): boolean {
        for (const creneau of creneauxExistants) {
            if (creneau.enseignantId === enseignantId && creneau.jour === jour) {
                if (this.yaOverlap(heureDebut, this.calculerHeureFin(heureDebut, 60), creneau.heureDebut, creneau.heureFin)) return false;
            }
        }
        return true;
    }

    private yaOverlap(debut1: string, fin1: string, debut2: string, fin2: string): boolean {
        return debut1 < fin2 && debut2 < fin1;
    }

    private calculerHeureFin(heureDebut: string, dureeMinutes: number): string {
        const [h, m] = heureDebut.split(':').map(Number);
        const finDate = new Date();
        finDate.setHours(h, m + dureeMinutes, 0, 0);
        return `${String(finDate.getHours()).padStart(2, '0')}:${String(finDate.getMinutes()).padStart(2, '0')}`;
    }

    private marquerCreneauOccupe(plan: any, placement: any, affectation: any): void {
        let heure = placement.heureDebut;
        while (heure < placement.heureFin) {
            if (plan[placement.jour]?.[heure]) {
                plan[placement.jour][heure] = { occupe: true, enseignantId: affectation.enseignantId, matiereId: affectation.matiereId };
            }
            const [h, m] = heure.split(':').map(Number);
            const nouvelleHeure = new Date();
            nouvelleHeure.setHours(h, m + 60, 0, 0);
            heure = `${String(nouvelleHeure.getHours()).padStart(2, '0')}:${String(nouvelleHeure.getMinutes()).padStart(2, '0')}`;
        }
    }
}

export const emploiDuTempsService = new EmploiDuTempsService();
