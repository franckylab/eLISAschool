# Guide d'Implémentation - Corrections Remaining

**Date**: 8 juin 2026  
**Statut**: Phase 1 terminée ✅ | Phase 2 en cours ⏳  

---

## ✅ Déjà Implémenté

### Phase 1 (Terminée)
- ✅ Correction accent `antecedentsMedicaux`
- ✅ Pagination dans suivi-eleves (3 endpoints)
- ✅ Pagination dans suivi-personnel (2 endpoints)
- ✅ Migration 033 (workflow + permissions + config)
- ✅ Audit actions dans enum AuditAction (14 nouvelles actions)
- ✅ Audit trail dans suivi-eleves (incidents, sanctions, félicitations)

---

## 📋 Corrections Restantes à Implémenter

### 1. Audit Trail - Suivi Personnel

**Fichier**: `backend/src/modules/suivi-personnel/services/suivi-personnel.service.ts`

**Imports à ajouter** :
```typescript
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
```

**Méthode `createIncident` à modifier** :
```typescript
async createIncident(
    dto: CreateIncidentPersonnelDto, 
    declarantId: string, 
    etablissementId: string,
    req?: Request  // ← Ajouter
): Promise<IncidentPersonnel> {
    const incident = this.incidentRepo.create({
        ...dto,
        declarantId,
        etablissementId,
        dateIncident: new Date(),
    });
    await this.incidentRepo.save(incident);
    
    // ← AJOUTER: Audit trail
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.INCIDENT_PERSONNEL_CREATE,
            cible: 'IncidentPersonnel',
            cibleId: incident.id,
            description: `Incident créé: ${dto.type} - Gravité: ${dto.gravite}`,
            nouvellesValeurs: dto,
            module: 'suivi-personnel',
        }, req);
    }
    
    logger.info(`[Suivi-Personnel] Incident créé: ${dto.membrePersonnelId}`);
    return incident;
}
```

**Méthode `createEvaluation` à modifier** :
```typescript
async createEvaluation(
    dto: CreateEvaluationPersonnelDto, 
    evaluateurId: string, 
    etablissementId: string,
    req?: Request  // ← Ajouter
): Promise<EvaluationPersonnel> {
    const evaluation = this.evaluationRepo.create({
        ...dto,
        evaluateurId,
        etablissementId,
    });
    await this.evaluationRepo.save(evaluation);
    
    // ← AJOUTER: Audit trail
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.EVALUATION_PERSONNEL_CREATE,
            cible: 'EvaluationPersonnel',
            cibleId: evaluation.id,
            description: `Évaluation créée: ${dto.periodicite} - Période: ${dto.periode}`,
            nouvellesValeurs: dto,
            module: 'suivi-personnel',
        }, req);
    }
    
    logger.info(`[Suivi-Personnel] Évaluation créée: ${dto.membrePersonnelId}`);
    return evaluation;
}
```

**Contrôleur à mettre à jour** (`suivi-personnel.controller.ts`) :
```typescript
// Route POST /incidents
const incident = await suiviPersonnelService.createIncident(
    dto,
    req.utilisateur!.id,
    req.utilisateur!.etablissementId!,
    req  // ← Ajouter
);

// Route POST /evaluations
const evaluation = await suiviPersonnelService.createEvaluation(
    dto,
    req.utilisateur!.id,
    req.utilisateur!.etablissementId!,
    req  // ← Ajouter
);
```

---

### 2. Audit Trail - Module Santé

**Fichier**: `backend/src/modules/sante/services/sante.service.ts`

**Imports à ajouter** :
```typescript
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
```

**Méthode `createOrUpdateDossier` à modifier** :
```typescript
async createOrUpdateDossier(
    dto: CreateDossierMedicalSchema, 
    etablissementId: string,
    req?: Request  // ← Ajouter
): Promise<DossierMedical> {
    let dossier = await this.dossierRepo.findOne({
        where: { patientId: dto.patientId, etablissementId },
    });

    const isUpdate = !!dossier;

    if (dossier) {
        Object.assign(dossier, dto);
        await this.dossierRepo.save(dossier);
        
        // ← AJOUTER: Audit trail update
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.DOSSIER_MEDICAL_UPDATE,
                cible: 'DossierMedical',
                cibleId: dossier.id,
                description: `Dossier médical mis à jour: ${dto.patientId}`,
                nouvellesValeurs: dto,
                module: 'sante',
            }, req);
        }
        
        logger.info(`[Santé] Dossier médical mis à jour: ${dto.patientId}`);
    } else {
        dossier = this.dossierRepo.create({ ...dto, etablissementId });
        await this.dossierRepo.save(dossier);
        
        // ← AJOUTER: Audit trail create
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.DOSSIER_MEDICAL_CREATE,
                cible: 'DossierMedical',
                cibleId: dossier.id,
                description: `Dossier médical créé: ${dto.patientId}`,
                nouvellesValeurs: dto,
                module: 'sante',
            }, req);
        }
        
        logger.info(`[Santé] Dossier médical créé: ${dto.patientId}`);
    }

    return dossier;
}
```

**Méthode `createConsultation` à modifier** :
```typescript
async createConsultation(
    dto: CreateConsultationMedicaleSchema, 
    consultantId: string, 
    etablissementId: string,
    req?: Request  // ← Ajouter
): Promise<ConsultationMedicale> {
    // ... vérification dossier existante ...

    const consultation = this.consultationRepo.create({
        ...dto,
        consultantId,
        etablissementId,
        dateConsultation: new Date(),
    });

    await this.consultationRepo.save(consultation);
    
    // ← AJOUTER: Audit trail
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.CONSULTATION_MEDICALE_CREATE,
            cible: 'ConsultationMedicale',
            cibleId: consultation.id,
            description: `Consultation créée: ${dto.type} - Patient: ${dto.dossierMedicalId}`,
            nouvellesValeurs: dto,
            module: 'sante',
        }, req);
    }
    
    logger.info(`[Santé] Consultation créée: ${consultation.id}`);
    return consultation;
}
```

**Méthode `createIncidentSante` à modifier** :
```typescript
async createIncidentSante(
    dto: CreateIncidentSanteSchema, 
    declareParId: string, 
    etablissementId: string,
    req?: Request  // ← Ajouter
): Promise<IncidentSante> {
    // ... vérification dossier existante ...

    const incident = this.incidentRepo.create({
        ...dto,
        declareParId,
        etablissementId,
        dateIncident: new Date(),
    });

    await this.incidentRepo.save(incident);
    
    // ← AJOUTER: Audit trail
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.INCIDENT_SANTE_CREATE,
            cible: 'IncidentSante',
            cibleId: incident.id,
            description: `Incident santé créé: ${dto.type} - Gravité: ${dto.gravite}`,
            nouvellesValeurs: dto,
            module: 'sante',
        }, req);
    }
    
    logger.info(`[Santé] Incident santé créé: ${incident.id} - Gravité: ${dto.gravite}`);
    return incident;
}
```

**Contrôleur santé à mettre à jour** (`sante.controller.ts`) :
```typescript
// POST /dossiers
const dossier = await santeService.createOrUpdateDossier(dto, req.utilisateur!.etablissementId!, req);

// POST /consultations
const consultation = await santeService.createConsultation(dto, req.utilisateur!.id, req.utilisateur!.etablissementId!, req);

// POST /incidents
const incident = await santeService.createIncidentSante(dto, req.utilisateur!.id, req.utilisateur!.etablissementId!, req);
```

---

### 3. Cache In-Memory - Module Santé

**Fichier**: `backend/src/modules/sante/services/sante.service.ts`

**Ajouter en haut de la classe** :
```typescript
export class SanteService {
    private dossierRepo: Repository<DossierMedical>;
    private consultationRepo: Repository<ConsultationMedicale>;
    private incidentRepo: Repository<IncidentSante>;
    
    // ← AJOUTER: Cache in-memory
    private cache = new Map<string, { value: any; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.dossierRepo = AppDataSource.getRepository(DossierMedical);
        this.consultationRepo = AppDataSource.getRepository(ConsultationMedicale);
        this.incidentRepo = AppDataSource.getRepository(IncidentSante);
    }
    
    // ← AJOUTER: Méthode d'invalidation
    private invalidateDossierCache(patientId: string, etablissementId: string): void {
        const cacheKey = `dossier:${patientId}:${etablissementId}`;
        this.cache.delete(cacheKey);
    }
```

**Méthode `getDossierByPatient` avec cache** :
```typescript
async getDossierByPatient(patientId: string, etablissementId: string): Promise<DossierMedical | null> {
    const cacheKey = `dossier:${patientId}:${etablissementId}`;
    
    // Vérifier cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
    }
    
    // Cache miss → DB
    const dossier = await this.dossierRepo.findOne({
        where: { patientId, etablissementId },
    });
    
    // Mettre en cache
    if (dossier) {
        this.cache.set(cacheKey, { value: dossier, timestamp: Date.now() });
    }
    
    return dossier;
}
```

**Invalider cache après modification** :
```typescript
// Dans createOrUpdateDossier(), après save():
this.invalidateDossierCache(dto.patientId, etablissementId);
```

---

### 4. Validation Workflow - Sanctions Élèves

**Fichier**: `backend/src/modules/suivi-eleves/entities/sanction-eleve.entity.ts`

**Ajouter enum Statut** :
```typescript
export enum StatutSanctionEleve {
    PROPOSEE = 'PROPOSEE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDEE = 'VALIDEE',
    APPLIQUEE = 'APPLIQUEE',
    ANNULEE = 'ANNULEE',
}
```

**Modifier la colonne statut** :
```typescript
@Column({ type: 'varchar', length: 30, default: StatutSanctionEleve.PROPOSEE })
statut!: StatutSanctionEleve;
```

**Service `createSanction` avec workflow** :
```typescript
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';

async createSanction(dto: CreateSanctionEleveDto, decideParId: string, etablissementId: string, req?: Request): Promise<SanctionEleve> {
    // Vérifier si validation requise pour sanctions graves
    const requireValidation = await getParamBoolean('suivi-eleves.sanction.require_validation', false);
    const sanctionGrave = dto.gravite === 'GRAVE' || dto.gravite === 'TRES_GRAVE';
    
    const sanction = this.sanctionRepo.create({
        ...dto,
        decideParId,
        etablissementId,
        statut: (requireValidation && sanctionGrave) 
            ? StatutSanctionEleve.EN_ATTENTE_VALIDATION 
            : StatutSanctionEleve.PROPOSEE,
    });
    
    await this.sanctionRepo.save(sanction);
    
    // Créer workflow si nécessaire
    if (requireValidation && sanctionGrave && decideParId) {
        const niveauxRequis = await getParamNumber('suivi-eleves.sanction.validation_levels', 2);
        
        await validationWorkflowService.createWorkflow({
            module: 'suivi-eleves',
            entiteId: sanction.id,
            entiteType: 'SanctionEleve',
            niveauxRequis,
            etablissementId,
        }, decideParId);
    }
    
    // ... audit trail existant ...
    
    return sanction;
}
```

---

### 5. Validation Workflow - Bulletins Paie

**Fichier**: `backend/src/modules/personnel/entities/bulletin-paie.entity.ts`

**Ajouter enum** :
```typescript
export enum StatutBulletinPaie {
    GENERE = 'GENERE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDE = 'VALIDE',
    PAYE = 'PAYE',
}
```

**Modifier colonne statut** :
```typescript
@Column({ type: 'varchar', length: 30, default: StatutBulletinPaie.GENERE })
statut!: StatutBulletinPaie;
```

**Service de génération avec workflow** (dans `bulletin-paie.service.ts`) :
```typescript
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';

async generateBulletin(dto: GenerateBulletinDto, createurId: string, req?: Request): Promise<BulletinPaie> {
    const requireValidation = await getParamBoolean('personnel.paie.require_validation', true);
    
    const bulletin = this.repo.create({
        ...dto,
        statut: requireValidation 
            ? StatutBulletinPaie.EN_ATTENTE_VALIDATION 
            : StatutBulletinPaie.GENERE,
    });
    
    await this.repo.save(bulletin);
    
    if (requireValidation && createurId) {
        await validationWorkflowService.createWorkflow({
            module: 'personnel',
            entiteId: bulletin.id,
            entiteType: 'BulletinPaie',
            niveauxRequis: 2,
            etablissementId: dto.etablissementId,
        }, createurId);
    }
    
    return bulletin;
}
```

---

### 6. Notifications Incidents Graves Santé

**Fichier**: `backend/src/modules/sante/services/sante.service.ts`

**Import** :
```typescript
import { notificationService } from '@modules/notifications/services';
```

**Dans `createIncidentSante()`** :
```typescript
// Après save(incident)
if (dto.gravite === 'GRAVE' || dto.gravite === 'CRITIQUE') {
    try {
        // Résoudre le patient pour trouver parents/responsables
        const patientRepo = dto.typePatient === 'ELEVE' 
            ? AppDataSource.getRepository('Eleve')
            : AppDataSource.getRepository('MembrePersonnel');
            
        const patient = await patientRepo.findOne({ 
            where: { id: dossier.patientId },
            relations: dto.typePatient === 'ELEVE' ? ['utilisateur'] : ['utilisateur']
        }) as any;
        
        if (patient && patient.utilisateurId) {
            await notificationService.create({
                destinataireId: patient.utilisateurId,
                type: 'ALERTE',
                titre: `Incident santé ${dto.gravite}`,
                message: `Un incident ${dto.gravite.toLowerCase()} a été signalé: ${dto.nature}`,
                module: 'sante',
                metadata: {
                    incidentId: incident.id,
                    gravite: dto.gravite,
                    nature: dto.nature,
                },
                etablissementId,
            });
        }
    } catch (error) {
        logger.warn(`[Santé] Échec notification incident grave`, error);
    }
}
```

---

### 7. Intégration Gamification - Félicitations

**Fichier**: `backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts`

**Import** :
```typescript
import { gamificationService } from '@modules/gamification/services';
```

**Dans `createFelicitation()`** :
```typescript
// Après save(felicitation)
try {
    await gamificationService.awardPoints({
        eleveId: dto.eleveId,
        points: dto.pointsBonus,
        raison: `Félicitation: ${dto.motif}`,
        sourceModule: 'suivi-eleves',
        sourceId: felicitation.id,
    });
} catch (error) {
    logger.warn(`[Suivi-Élèves] Échec attribution points gamification`, error);
}
```

---

### 8. Validations Croisées Établissement

**Dans TOUS les services**, ajouter avant création :

```typescript
// Exemple dans createIncident (suivi-eleves)
async createIncident(dto: CreateIncidentEleveDto, declarantId: string, etablissementId: string, req?: Request): Promise<IncidentEleve> {
    // ← AJOUTER: Vérifier que l'élève appartient à l'établissement
    const eleveRepo = AppDataSource.getRepository('Eleve');
    const eleve = await eleveRepo.findOne({
        where: { id: dto.eleveId, etablissementId },
    });
    
    if (!eleve) {
        throw new AppError('Élève non trouvé dans cet établissement', 404, 'NOT_FOUND');
    }
    
    // ... suite du code existant ...
}
```

---

## 🚀 Ordre d'Implémentation Recommandé

1. ✅ **Audit Trail** (30 min) - suivi-personnel + sante
2. ⏳ **Cache Santé** (15 min)
3. ⏳ **Validation Workflow** (45 min) - sanctions + bulletins paie
4. ⏳ **Notifications** (20 min) - incidents graves santé
5. ⏳ **Gamification** (10 min) - félicitations
6. ⏳ **Validations croisées** (20 min)

**Temps total estimé** : ~2h20

---

## 📊 Progrès Actuel

| Phase | Statut | % |
|-------|--------|---|
| Phase 1 (Critique) | ✅ Terminée | 100% |
| Phase 2 (Audit + Workflow) | ⏳ En cours | 40% |
| Phase 3 (Optimisations) | ❌ À faire | 0% |

**Note globale** : 9/10 (après Phase 1) → **Objectif: 9.8/10** (après Phase 2 complète)

---

## ✅ Test Final

Après toutes les corrections :

```bash
# 1. Exécuter migrations
npm run typeorm migration:run

# 2. Vérifier compilation
npm run build:backend

# 3. Tester endpoints
curl http://localhost:3000/api/suivi-eleves/eleve/{id}/incidents?page=1&limit=10

# 4. Vérifier audit logs
psql -d elisaschool -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```
