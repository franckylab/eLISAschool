import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModeRemunerationEntity } from '../entities';
import { CreateModeRemunerationDto, UpdateModeRemunerationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';
import { auditService, AuditAction } from '@modules/auth';

class ModeRemunerationService {
    private repo: Repository<ModeRemunerationEntity>;

    constructor() {
        this.repo = AppDataSource.getRepository(ModeRemunerationEntity);
    }

    async create(dto: CreateModeRemunerationDto, utilisateurId?: string): Promise<ModeRemunerationEntity> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de mode de rémunération existe déjà', 409, 'MODE_REMUNERATION_CODE_EXISTS');
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.MODE_REMUNERATION_CREATE,
            cible: 'ModeRemuneration',
            cibleId: saved.id,
            description: `Création du mode de rémunération ${saved.label} (${saved.code})`,
            nouvellesValeurs: { label: dto.label, code: dto.code },
            module: 'organisation',
            metadata: { entiteLabel: saved.label, entiteRef: saved.code },
        });
        return saved;
    }

    async findAll(etablissementId?: string): Promise<ModeRemunerationEntity[]> {
        const qb = this.repo.createQueryBuilder('m');
        if (etablissementId) {
            qb.where('(m.etablissementId = :eid OR m.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(m.etablissementId IS NULL OR m.estSysteme = TRUE)');
        }
        return qb.orderBy('m.label', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('m');
        if (etablissementId) {
            qb.where('(m.etablissementId = :eid OR m.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(m.etablissementId IS NULL OR m.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(m.label ILIKE :search OR m.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('m.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string, etablissementId?: string): Promise<ModeRemunerationEntity> {
        const qb = this.repo.createQueryBuilder('m').where('m.id = :id', { id });
        if (etablissementId) {
            // Visible si tenant OU global/système (nomenclatures partagées)
            qb.andWhere('(m.etablissementId = :eid OR m.etablissementId IS NULL OR m.estSysteme = TRUE)', { eid: etablissementId });
        }
        const entity = await qb.getOne();
        if (!entity) throw new AppError('Mode de rémunération non trouvé', 404, 'MODE_REMUNERATION_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateModeRemunerationDto, etablissementId?: string, utilisateurId?: string): Promise<ModeRemunerationEntity> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'modifier');
        const anciennesValeurs: Record<string, unknown> = {};
        const nouvellesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (entity as unknown as Record<string, unknown>)[key];
            nouvellesValeurs[key] = (dto as Record<string, unknown>)[key];
        }
        Object.assign(entity, dto);
        const saved = await this.repo.save(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.MODE_REMUNERATION_UPDATE,
            cible: 'ModeRemuneration',
            cibleId: saved.id,
            description: `Modification du mode de rémunération ${saved.label} (${saved.code})`,
            anciennesValeurs,
            nouvellesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: saved.label, entiteRef: saved.code },
        });
        return saved;
    }

    async delete(id: string, etablissementId?: string, utilisateurId?: string): Promise<void> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'supprimer');
        const anciennesValeurs = { label: entity.label, code: entity.code };
        await this.repo.remove(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.MODE_REMUNERATION_DELETE,
            cible: 'ModeRemuneration',
            cibleId: id,
            description: `Suppression du mode de rémunération ${anciennesValeurs.label} (${anciennesValeurs.code})`,
            anciennesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: anciennesValeurs.label, entiteRef: anciennesValeurs.code },
        });
    }
}

export const modeRemunerationService = new ModeRemunerationService();
