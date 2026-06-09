# Rapport d'Audit - Cohérence et Intégration des Nouvelles Fonctionnalités

**Date**: 8 juin 2026  
**Version**: eLISAschool v2.0  
**Auditeur**: franck arlos chendjou  

---

## Résumé Exécutif

Toutes les nouvelles fonctionnalités ont été implémentées et sont **globalement cohérentes** avec l'architecture eLISAschool. Cependant, **7 incohérences critiques** et **12 améliorations recommandées** ont été identifiées et doivent être corrigées avant la mise en production.

**Note globale**: 7.5/10  
**Statut**: ✅ Fonctionnel avec corrections mineures requises

---

## 1. Identification Étendue ✅ (8/10)

### Vérifié
- ✅ **Élèves** : `groupeSanguin`, `allergies`, `photo`, `nomContactUrgence`, `telephoneContactUrgence`
- ✅ **Personnel** : `posteExact`, `service`, `responsableHierarchiqueId`, `competences`, `heuresMaxSemaine`
- ✅ **Utilisateur** : `pseudonyme`, `qrCodeId` (multi-mode auth)

### Incohérences Détectées

#### 🔴 CRITIQUE : Champ `antécédentsMedicaux` avec accent (DossierMedical)
**Fichier**: `backend/src/modules/sante/entities/dossier-medical.entity.ts` ligne 59  
**Problème**: La colonne `antécédentsMedicaux` contient un accent, ce qui viole la convention camelCase sans accents d'eLISAschool. PostgreSQL peut mal interpréter les caractères spéciaux dans les noms de colonnes.

**Correction requise**:
```typescript
// ❌ INCORRECT
@Column({ type: 'simple-json', nullable: true })
antécédentsMedicaux?: string[];

// ✅ CORRECT
@Column({ type: 'simple-json', nullable: true })
antecedentsMedicaux?: string[];
```

**Impact**: Migration SQL échouera sur certains encodages PostgreSQL.

---

#### 🟡 MOYEN : Absence de champ `identifiant` dans Utilisateur
**Fichier**: `backend/src/modules/auth/entities/utilisateur.entity.ts`  
**Problème**: Le login multi-mode utilise `(loginDto as any).identifiant` mais le champ `identifiant` n'existe pas dans l'entité Utilisateur. Il utilise en réalité `email`, `matricule`, `pseudonyme`, `qrCodeId`.

**Correction recommandée**:
```typescript
// DTO Auth (shared/src/validators/auth.validators.ts)
export const loginSchema = z.object({
    identifiant: z.string() // ← Ce champ accepte email/matricule/pseudonyme/qrCodeId
        .min(1, 'L\'identifiant est requis'),
    email: z.string().optional(), // ← Fallback déprécié
    motDePasse: z.string(),
});

// AuthService (ligne 95)
const identifiant = (loginDto as any).identifiant || loginDto.email;
```

**Statut**: Fonctionnel mais le cast `as any` viole TypeScript strict. Préférer un typage explicite.

---

#### 🟡 MINEUR : Index manquants sur nouveaux champs
**Fichier**: `backend/src/modules/eleves/entities/eleve.entity.ts`  
**Problème**: Les nouveaux champs (`groupeSanguin`, `allergies`, etc.) ne sont pas indexés, mais ce n'est pas critique car ils ne sont pas utilisés dans des requêtes de filtrage fréquentes.

**Recommandation**: Ajouter `@Index()` sur `groupeSanguin` si des requêtes de filtrage sont prévues (ex: "tous les élèves O+").

---

## 2. Authentification Multi-Mode ✅ (9/10)

### Vérifié
- ✅ **Login multi-critère** : Recherche par email, matricule, pseudonyme, qrCodeId, ID (UUID)
- ✅ **Schéma Zod** : `loginSchema` avec champ `identifiant` (v2.0)
- ✅ **Backward compatibility** : Ancien champ `email` supporté (optionnel)
- ✅ **Performance** : Requête optimisée avec `whereConditions` array (OR logique)

### Points Positifs
- ✅ Détection automatique du type d'identifiant (si contient `@` → email, si UUID → ID)
- ✅ Index sur `pseudonyme` et `qrCodeId`
- ✅ Audit trail intégré (logLogin)
- ✅ Blocage après tentatives échouées (configurable)

### Amélioration Recommandée

#### 🟡 MINEUR : Cast `as any` dans AuthService
**Fichier**: `backend/src/modules/auth/services/auth.service.ts` ligne 95

```typescript
// ❌ Actuel (viole TypeScript strict)
const identifiant = (loginDto as any).identifiant || loginDto.email;

// ✅ Recommandé
interface LoginDtoV2 {
    identifiant?: string;
    email?: string;
    motDePasse: string;
}
const loginDtoV2 = loginDto as LoginDtoV2;
const identifiant = loginDtoV2.identifiant || loginDto.email;
```

---

## 3. Module Cartes Scolaires ✅ (8/10)

### Vérifié
- ✅ **Modèles de cartes** : `ModeleCarte` entity avec personnalisation
- ✅ **Types** : SCOLAIRE, ACCES, CANTINE, TRANSPORT, BIBLIOTHEQUE
- ✅ **QR Code** : Support natif avec `qrCodeId` dans Utilisateur
- ✅ **Catégories** : `categorieTitulaire` (ELEVE, PERSONNEL, ENSEIGNANT, RESPONSABLE)

### Incohérence Détectée

#### 🔴 CRITIQUE : Relation `modeleCarte` non synchronisée avec entité Utilisateur
**Fichier**: `backend/src/modules/cartes/entities/carte.entity.ts` ligne 70-75  
**Problème**: La carte a une relation vers `modeleCarteId`, mais le `qrCodeId` est stocké dans Utilisateur, pas dans Carte. Cela crée une redondance.

**Correction recommandée**:
```typescript
// Option 1: Utiliser qrCodeId de Utilisateur via relation
@ManyToOne(() => Utilisateur)
@JoinColumn({ name: 'utilisateurId' })
utilisateur!: Utilisateur;

// Accéder au QR via: carte.utilisateur.qrCodeId

// Option 2: Stocker qrCode dans Carte (si différent de Utilisateur)
@Column({ type: 'varchar', length: 100, unique: true, nullable: true })
qrCodeCarte?: string; // ← Si le QR de la carte diffère de celui de l'utilisateur
```

**Impact**: Confusion potentielle entre `qrCodeId` (auth) et `qrCode` (carte physique).

---

## 4. Paie et RH ⚠️ (6/10)

### Vérifié
- ✅ **BulletinPaie** : Entité complète avec salaireBase, primes, deductions, salaireNet
- ✅ **CNPS** : Entité `Cotisation` présente
- ✅ **Primes/Retenues** : Entités `TypePrime` et `TypeRetenue`
- ✅ **Contrats** : Entité `ContratPersonnel`

### Incohérences Critiques

#### 🔴 CRITIQUE : Absence de validation workflow pour bulletins de paie
**Fichier**: `backend/src/modules/personnel/entities/bulletin-paie.entity.ts`  
**Problème**: Le bulletin de paie a un champ `statut` (GENERE, VALIDE, PAYE) mais **aucune intégration avec le système de validation workflow multi-niveau** d'eLISAschool.

**Convention eLISAschool**: Tous les modules sensibles (notes, finances, requêtes) doivent supporter `EN_ATTENTE_VALIDATION`.

**Correction requise**:
```typescript
// 1. Ajouter enum StatutBulletinPaie
export enum StatutBulletinPaie {
    GENERE = 'GENERE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION', // ← AJOUTER
    VALIDE = 'VALIDE',
    PAYE = 'PAYE',
}

// 2. Intégrer validationWorkflowService dans le service de création
async generateBulletin(dto: GenerateBulletinDto, createurId: string): Promise<BulletinPaie> {
    const requireValidation = await getParamBoolean('personnel.paie.require_validation', true);
    
    const bulletin = this.repo.create({
        ...dto,
        statut: requireValidation ? StatutBulletinPaie.EN_ATTENTE_VALIDATION : StatutBulletinPaie.GENERE,
    });
    
    await this.repo.save(bulletin);
    
    if (requireValidation && createurId) {
        await validationWorkflowService.createWorkflow({
            module: 'personnel',
            entiteId: bulletin.id,
            entiteType: 'BulletinPaie',
            niveauxRequis: 2, // ← Configurable
            etablissementId: dto.etablissementId,
        }, createurId);
    }
    
    return bulletin;
}
```

**Migration SQL requise**:
```sql
-- Ajouter paramètre de configuration
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, etablissement_id)
VALUES ('personnel.paie.require_validation', 'true', 'boolean', 'personnel', 
        'Exiger validation multi-niveau pour les bulletins de paie', NULL)
ON CONFLICT (cle, etablissement_id) DO NOTHING;
```

---

#### 🟡 MOYEN : Calcul automatique du salaireNet manquant
**Fichier**: `backend/src/modules/personnel/entities/bulletin-paie.entity.ts`  
**Problème**: Le `salaireNet` est un champ brut, mais **aucune logique de calcul automatique** n'est implémentée.

**Formule attendue**:
```
salaireNet = salaireBase + heuresSup + primes - deductions - cotisationsCNPS
```

**Recommandation**: Créer une méthode de calcul dans `BulletinPaieService`:
```typescript
async calculerSalaireNet(bulletin: BulletinPaie): Promise<number> {
    const cotisations = await this.getCotisationsCNPS(bulletin);
    return bulletin.salaireBase + bulletin.montantHeuresSup + bulletin.primes 
           - bulletin.deductions - cotisations.total;
}
```

---

#### 🟡 MINEUR : Index manquants sur BulletinPaie
**Problème**: Pas d'index composite sur `(membrePersonnelId, mois, annee)` pour rechercher un bulletin spécifique.

**Correction**:
```typescript
@Index(['membrePersonnelId', 'mois', 'annee'], { unique: true })
```

---

## 5. Suivi Élèves ⚠️ (7/10)

### Vérifié
- ✅ **Incidents** : `IncidentEleve` avec gravité, type, statut, signalement parent
- ✅ **Observations** : `ObservationEleve` avec type (POSITIVE/NEGATIVE), pointsImpact
- ✅ **Sanctions** : `SanctionEleve` avec lien vers incident
- ✅ **Félicitations** : `FelicitationEleve` avec pointsBonus
- ✅ **Dashboard** : Agrégation complète (incidentsGraves, pointsGamification)

### Incohérences

#### 🔴 CRITIQUE : Absence de pagination dans les services
**Fichier**: `backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts`  
**Problème**: Les méthodes `getIncidentsByEleve()`, `getObservationsByEleve()` retournent **tous les résultats sans pagination**. Violation de la convention eLISAschool (section 18.3).

**Convention**: TOUJOURS paginer les listes avec `take`/`skip`.

**Correction requise**:
```typescript
// ❌ Actuel
async getIncidentsByEleve(eleveId: string, etablissementId: string): Promise<IncidentEleve[]> {
    return this.incidentRepo.find({
        where: { eleveId, etablissementId },
        order: { dateIncident: 'DESC' },
    });
}

// ✅ Corrigé
async getIncidentsByEleve(
    eleveId: string, 
    etablissementId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ data: IncidentEleve[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.incidentRepo.findAndCount({
        where: { eleveId, etablissementId },
        order: { dateIncident: 'DESC' },
        take: Math.min(limit, 100),
        skip,
    });
    return { data, total };
}
```

---

#### 🟡 MOYEN : Intégration Gamification absente
**Fichier**: `backend/src/modules/suivi-eleves/services/suivi-eleve.service.ts` ligne 133-134  
**Problème**: Le dashboard calcule `pointsGamification` mais **ne crée pas d'entrée dans le module Gamification**.

**Recommandation**:
```typescript
async createFelicitation(dto: CreateFelicitationEleveDto, attribueParId: string, etablissementId: string): Promise<FelicitationEleve> {
    const felicitation = this.felicitationRepo.create({
        ...dto,
        attribueParId,
        etablissementId,
    });
    await this.felicitationRepo.save(felicitation);
    
    // ← AJOUTER : Intégration Gamification
    try {
        await gamificationService.awardPoints({
            eleveId: dto.eleveId,
            points: dto.pointsBonus,
            raison: 'Félicitation',
            sourceModule: 'suivi-eleves',
        });
    } catch (error) {
        logger.warn(`[Suivi-Élèves] Échec attribution points gamification`, error);
    }
    
    return felicitation;
}
```

---

#### 🟡 MINEUR : Middleware `staffOnly` non standard
**Fichier**: `backend/src/modules/suivi-eleves/controllers/suivi-eleve.controller.ts`  
**Problème**: Utilisation de `staffOnly` au lieu de `requireRoles()` standard.

**Recommandation**: Remplacer par `requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT)` pour cohérence.

---

## 6. Suivi Personnel ⚠️ (7/10)

### Vérifié
- ✅ **Incidents** : `IncidentPersonnel` avec gravité, type, statut
- ✅ **Évaluations** : `EvaluationPersonnel` avec periodicite, noteGlobale, objectifs
- ✅ **Dashboard** : Moyenne évaluations, incidentsGraves

### Incohérences (Similaires à Suivi Élèves)

#### 🔴 CRITIQUE : Absence de pagination
**Même problème que Suivi Élèves** → Correction identique requise.

---

#### 🟡 MOYEN : Visibilité `visibleConcerned` non exploitée
**Fichier**: `backend/src/modules/suivi-personnel/entities/evaluation-personnel.entity.ts`  
**Problème**: Le champ `visibleConcerned` existe mais **aucune logique ne filtre les évaluations visibles par le personnel concerné**.

**Recommandation**:
```typescript
async getEvaluationsVisibleByPersonnel(membrePersonnelId: string, etablissementId: string): Promise<EvaluationPersonnel[]> {
    return this.evaluationRepo.find({
        where: { 
            membrePersonnelId, 
            etablissementId,
            visibleConcerned: true // ← FILTRER
        },
        order: { periode: 'DESC' },
    });
}
```

---

## 7. Module Santé ⚠️ (7.5/10)

### Vérifié
- ✅ **DossierMedical** : Polymorphique (ELEVE/PERSONNEL), allergies, traitements, handicaps
- ✅ **Consultations** : Signes vitaux (température, tension, fréquence cardiaque, poids, taille)
- ✅ **Incidents Santé** : Gravité, hospitalisation, signalement parent
- ✅ **Dashboard** : Statistiques complètes
- ✅ **Validation dossier** : Vérifie appartenance à l'établissement

### Incohérences

#### 🔴 CRITIQUE : Colonne avec accent `antécédentsMedicaux`
**Déjà identifié dans section 1** → Correction prioritaire.

---

#### 🟡 MOYEN : Permissions RBAC manquantes
**Fichier**: `backend/src/modules/sante/controllers/sante.controller.ts`  
**Problème**: Le contrôleur utilise `requirePermission()` mais **les permissions ne sont pas créées dans le seed RBAC**.

**Permissions requises à ajouter dans `rbac.seed.ts`**:
```typescript
// Module Santé
{ code: 'sante:dossier:read', libelle: 'Consulter un dossier médical', module: 'sante' },
{ code: 'sante:dossier:write', libelle: 'Créer/modifier un dossier médical', module: 'sante' },
{ code: 'sante:consultation:read', libelle: 'Consulter une consultation', module: 'sante' },
{ code: 'sante:consultation:write', libelle: 'Créer une consultation', module: 'sante' },
{ code: 'sante:incident:read', libelle: 'Consulter un incident santé', module: 'sante' },
{ code: 'sante:incident:write', libelle: 'Créer un incident santé', module: 'sante' },
```

---

#### 🟡 MINEUR : Absence de notifications pour incidents graves
**Fichier**: `backend/src/modules/sante/services/sante.service.ts`  
**Problème**: Les incidents de gravité `GRAVE` ou `CRITIQUE` ne déclenchent **aucune notification automatique** aux parents/responsables.

**Recommandation**:
```typescript
async createIncidentSante(dto: CreateIncidentSanteSchema, declareParId: string, etablissementId: string): Promise<IncidentSante> {
    const incident = this.incidentRepo.create({
        ...dto,
        declareParId,
        etablissementId,
        dateIncident: new Date(),
    });
    await this.incidentRepo.save(incident);
    
    // ← AJOUTER : Notification si grave
    if (dto.gravite === 'GRAVE' || dto.gravite === 'CRITIQUE') {
        try {
            await notificationTemplates.incidentGraveSante({
                destinataireId: dto.patientId, // ← Résoudre parent via ResponsableEleve
                etablissementId,
                metadata: { incidentId: incident.id },
            }, {
                gravite: dto.gravite,
                description: dto.description,
            });
        } catch (error) {
            logger.warn(`[Santé] Échec notification incident grave`, error);
        }
    }
    
    return incident;
}
```

---

## 8. Validation Workflow Multi-Niveau ❌ (4/10)

### Problème Critique

**AUCUN des nouveaux modules** (suivi-eleves, suivi-personnel, sante, cartes améliorées, paie) **n'est intégré au système de validation workflow**.

**Convention eLISAschool** (section 17) : Les modules sensibles DOIVENT supporter la validation multi-niveau.

### Modules nécessitant intégration urgente

| Module | Opération sensible | Priorité |
|--------|-------------------|----------|
| **Paie** | Génération bulletin | 🔴 CRITIQUE |
| **Suivi Élèves** | Sanction GRAVE/TRES_GRAVE | 🔴 CRITIQUE |
| **Santé** | Incident CRITIQUE | 🔴 CRITIQUE |
| **Suivi Personnel** | Évaluation avec note < 10/20 | 🟡 MOYEN |

### Pattern d'intégration standard

```typescript
// 1. Entity : Ajouter enum Statut
export enum StatutSanctionEleve {
    PROPOSEE = 'PROPOSEE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDEE = 'VALIDEE',
    APPLIQUEE = 'APPLIQUEE',
    ANNULEE = 'ANNULEE',
}

// 2. Service : Validation conditionnelle
async createSanction(dto: CreateSanctionEleveDto, decideParId: string, etablissementId: string): Promise<SanctionEleve> {
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
    
    if (requireValidation && sanctionGrave && decideParId) {
        await validationWorkflowService.createWorkflow({
            module: 'suivi-eleves',
            entiteId: sanction.id,
            entiteType: 'SanctionEleve',
            niveauxRequis: await getParamNumber('suivi-eleves.sanction.validation_levels', 2),
            etablissementId,
        }, decideParId);
    }
    
    return sanction;
}

// 3. Config seed
{ cle: 'suivi-eleves.sanction.require_validation', valeur: false, ... },
{ cle: 'suivi-eleves.sanction.validation_levels', valeur: 2, ... },
{ cle: 'suivi-eleves.sanction.validation_roles', valeur: JSON.stringify({ '1': 'CENSEUR', '2': 'PROVISEUR' }), ... },

// 4. Migration SQL : Colonne statut + index
ALTER TABLE sanctions_eleves ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'PROPOSEE';
CREATE INDEX idx_sanctions_eleves_statut ON sanctions_eleves(statut);
```

---

## 9. Permissions RBAC ⚠️ (6/10)

### Vérifié
- ✅ **Middleware** : `requirePermission()` implémenté et fonctionnel
- ✅ **Résolution** : `permissionResolverService` avec cache TTL 5min
- ✅ **Multi-tenant** : Permissions filtrées par établissement

### Incohérences

#### 🔴 CRITIQUE : Permissions non créées dans le seed
**Modules concernés**: `suivi-eleves`, `suivi-personnel`, `sante`  
**Fichier**: `backend/src/database/seeds/rbac.seed.ts`  
**Problème**: Les permissions pour les nouveaux modules **n'existent pas dans la seed**.

**Permissions à ajouter**:
```typescript
// Module Suivi Élèves
{ code: 'suivi-eleves:incident:read', libelle: 'Consulter incidents élèves', module: 'suivi-eleves' },
{ code: 'suivi-eleves:incident:write', libelle: 'Créer incidents élèves', module: 'suivi-eleves' },
{ code: 'suivi-eleves:sanction:read', libelle: 'Consulter sanctions', module: 'suivi-eleves' },
{ code: 'suivi-eleves:sanction:write', libelle: 'Créer sanctions', module: 'suivi-eleves' },
{ code: 'suivi-eleves:felicitations:write', libelle: 'Créer félicitations', module: 'suivi-eleves' },

// Module Suivi Personnel
{ code: 'suivi-personnel:incident:read', libelle: 'Consulter incidents personnel', module: 'suivi-personnel' },
{ code: 'suivi-personnel:incident:write', libelle: 'Créer incidents personnel', module: 'suivi-personnel' },
{ code: 'suivi-personnel:evaluation:read', libelle: 'Consulter évaluations', module: 'suivi-personnel' },
{ code: 'suivi-personnel:evaluation:write', libelle: 'Créer évaluations', module: 'suivi-personnel' },

// Module Santé (déjà listé dans section 7)
```

---

#### 🟡 MOYEN : Attribution des permissions aux rôles manquante
**Problème**: Même après création des permissions, elles **ne sont pas attribuées aux rôles** (ADMIN, CHEF_ETABLISSEMENT, etc.).

**Correction**:
```typescript
// Dans rbac.seed.ts, après création des permissions
await queryRunner.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT')
    AND p.module IN ('suivi-eleves', 'suivi-personnel', 'sante')
    ON CONFLICT DO NOTHING;
`);
```

---

## 10. Multi-Établissements ✅ (9/10)

### Vérifié
- ✅ **Toutes les entités** ont `etablissementId` avec FK vers `Etablissement`
- ✅ **Services** : Toutes les requêtes filtrent par `etablissementId`
- ✅ **Contrôleurs** : Utilisent `req.utilisateur!.etablissementId!`
- ✅ **Middleware** : `requireModuleActive()` appliqué sur tous les nouveaux modules

### Points Positifs
- ✅ Index sur `etablissementId` dans toutes les entités
- ✅ Cascade `ON DELETE CASCADE` pour nettoyage automatique
- ✅ Validation dans les services (ex: `where: { id: dto.dossierMedicalId, etablissementId }`)

### Amélioration Mineure

#### 🟡 MINEUR : Absence de validation croisée établissement
**Problème**: Aucune vérification que l'élève/personnel appartient bien à l'établissement de l'utilisateur connecté.

**Recommandation**:
```typescript
async createIncident(dto: CreateIncidentEleveDto, declarantId: string, etablissementId: string): Promise<IncidentEleve> {
    // ← AJOUTER : Vérifier que l'élève appartient à l'établissement
    const eleve = await this.eleveRepo.findOne({
        where: { id: dto.eleveId, etablissementId },
    });
    if (!eleve) {
        throw new AppError('Élève non trouvé dans cet établissement', 404, 'NOT_FOUND');
    }
    
    const incident = this.incidentRepo.create({
        ...dto,
        declarantId,
        etablissementId,
    });
    // ...
}
```

---

## 11. Système de Configuration ❌ (5/10)

### Problème Critique

**AUCUN paramètre de configuration** n'a été créé pour les nouveaux modules.

**Convention eLISAschool** (section 3) : Chaque module doit avoir des paramètres configurables via `ParametreSysteme`.

### Paramètres manquants

#### Module Suivi Élèves
```sql
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description) VALUES
('suivi-eleves.incident.require_validation', 'false', 'boolean', 'suivi-eleves', 'Validation requise pour incidents graves'),
('suivi-eleves.sanction.require_validation', 'false', 'boolean', 'suivi-eleves', 'Validation requise pour sanctions'),
('suivi-eleves.gamification.points_incident_mineur', '-5', 'number', 'suivi-eleves', 'Points gamification pour incident mineur'),
('suivi-eleves.gamification.points_incident_grave', '-20', 'number', 'suivi-eleves', 'Points gamification pour incident grave'),
('suivi-eleves.gamification.points_felicitations', '10', 'number', 'suivi-eleves', 'Points gamification pour félicitation'),
('suivi-eleves.notification.signaler_parent_auto', 'true', 'boolean', 'suivi-eleves', 'Signaler automatiquement les parents pour incidents graves');
```

#### Module Suivi Personnel
```sql
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description) VALUES
('suivi-personnel.evaluation.periodicite_defaut', 'TRIMESTRIELLE', 'string', 'suivi-personnel', 'Périodicité par défaut des évaluations'),
('suivi-personnel.evaluation.note_minimale', '10', 'number', 'suivi-personnel', 'Note minimale pour validation'),
('suivi-personnel.incident.sanction_auto_apres', '3', 'number', 'suivi-personnel', 'Nombre d''incidents avant sanction auto');
```

#### Module Santé
```sql
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description) VALUES
('sante.dossier.exiger_groupe_sanguin', 'true', 'boolean', 'sante', 'Rendre le groupe sanguin obligatoire'),
('sante.incident.notification_parent_gravite', 'GRAVE', 'string', 'sante', 'Niveau de gravité déclenchant notification parent'),
('sante.consultation.signaler_parent_systematique', 'false', 'boolean', 'sante', 'Signaler systématiquement les parents après consultation'),
('sante.dashboard.alertes_seuil_allergies', '3', 'number', 'sante', 'Nombre d''allergies pour afficher alerte dashboard');
```

---

## 12. Audit Trail ⚠️ (6/10)

### Vérifié
- ✅ **Logger** : Utilisation de `logger.info()` pour créations
- ✅ **AuditService** : Disponible via `@modules/auth`

### Incohérences

#### 🔴 CRITIQUE : Audit trail non implémenté dans les nouveaux modules
**Problème**: Les nouveaux modules utilisent `logger.info()` mais **n'appellent pas `auditService.log()`**.

**Convention eLISAschool** (section 2, Audit Trail) : Toutes les opérations CRUD critiques DOIVENT être auditée.

**Correction requise** (exemple pour Suivi Élèves):
```typescript
import { auditService, AuditAction } from '@modules/auth';

async createIncident(dto: CreateIncidentEleveDto, declarantId: string, etablissementId: string, req?: Request): Promise<IncidentEleve> {
    const incident = this.incidentRepo.create({
        ...dto,
        declarantId,
        etablissementId,
        dateIncident: new Date(),
    });
    await this.incidentRepo.save(incident);
    
    // ← AJOUTER : Audit trail
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.INCIDENT_CREATE, // ← À ajouter dans enum AuditAction
            cible: 'IncidentEleve',
            cibleId: incident.id,
            description: `Incident créé: ${dto.type} - Gravité: ${dto.gravite}`,
            nouvellesValeurs: dto,
            module: 'suivi-eleves',
        }, req);
    }
    
    return incident;
}
```

**Enum AuditAction à enrichir**:
```typescript
// backend/src/modules/auth/entities/audit-log.entity.ts
export enum AuditAction {
    // ... existants ...
    
    // Suivi Élèves
    INCIDENT_ELEVE_CREATE = 'INCIDENT_ELEVE_CREATE',
    INCIDENT_ELEVE_UPDATE = 'INCIDENT_ELEVE_UPDATE',
    SANCTION_ELEVE_CREATE = 'SANCTION_ELEVE_CREATE',
    FELICITATION_ELEVE_CREATE = 'FELICITATION_ELEVE_CREATE',
    
    // Suivi Personnel
    INCIDENT_PERSONNEL_CREATE = 'INCIDENT_PERSONNEL_CREATE',
    EVALUATION_PERSONNEL_CREATE = 'EVALUATION_PERSONNEL_CREATE',
    
    // Santé
    DOSSIER_MEDICAL_CREATE = 'DOSSIER_MEDICAL_CREATE',
    DOSSIER_MEDICAL_UPDATE = 'DOSSIER_MEDICAL_UPDATE',
    CONSULTATION_MEDICALE_CREATE = 'CONSULTATION_MEDICALE_CREATE',
    INCIDENT_SANTE_CREATE = 'INCIDENT_SANTE_CREATE',
}
```

---

## 13. Migrations SQL ✅ (7/10)

### Vérifié
- ✅ **031-suivi-personnel.sql** : Tables `incidents_personnel`, `evaluations_personnel`
- ✅ **032-sante.sql** : Tables `dossiers_medicaux`, `consultations_medicales`, `incidents_sante`
- ✅ **023-030** : Migrations identification étendue, auth multi-mode, cartes

### Incohérences

#### 🔴 CRITIQUE : Migration `antécédentsMedicaux` avec accent
**Fichier**: `backend/database/migrations/032-sante.sql` ligne ~20  
**Problème**: La colonne `antécédents_medicaux` contient un accent.

**Correction**:
```sql
-- ❌ INCORRECT
antécédents_medicaux JSONB,

-- ✅ CORRECT
antecedents_medicaux JSONB,
```

---

#### 🟡 MOYEN : Migrations manquantes pour statuts workflow
**Modules concernés**: `sanctions_eleves`, `bulletins_paie`  
**Problème**: Aucune migration pour ajouter les colonnes `statut` avec support `EN_ATTENTE_VALIDATION`.

**Migration à créer (033-workflow-nouveaux-modules.sql)**:
```sql
-- Sanctions Élèves
ALTER TABLE sanctions_eleves 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'PROPOSEE';
CREATE INDEX idx_sanctions_eleves_statut ON sanctions_eleves(statut);

-- Bulletins Paie
ALTER TABLE bulletins_paie 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'GENERE';
CREATE INDEX idx_bulletins_paie_statut ON bulletins_paie(statut);

-- Évaluations Personnel (si pas déjà fait)
ALTER TABLE evaluations_personnel 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'PLANIFIEE';
CREATE INDEX idx_evaluations_personnel_statut ON evaluations_personnel(statut);
```

---

## 14. Performance ⚠️ (7/10)

### Vérifié
- ✅ **Index** : FK indexées dans toutes les entités
- ✅ **Relations** : Chargement sélectif avec `relations` array
- ✅ **Promise.all** : Dashboard utilise requêtes parallèles

### Problèmes

#### 🔴 CRITIQUE : Absence de pagination (déjà mentionné)
**Impact** : Requêtes retournant des milliers d'enregistrements (ex: tous les incidents d'un élève sur 3 ans).

---

#### 🟡 MOYEN : Cache absent dans les services
**Problème**: Aucun cache in-memory pour les données fréquemment accédées (ex: dossier médical).

**Recommandation**:
```typescript
export class SanteService {
    private cache = new Map<string, { value: any; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    
    // Invalidation après modification
    invalidateDossierCache(patientId: string, etablissementId: string): void {
        const cacheKey = `dossier:${patientId}:${etablissementId}`;
        this.cache.delete(cacheKey);
    }
}
```

---

## 15. Tests ❌ (3/10)

### Problème Critique

**AUCUN test unitaire ou d'intégration** n'a été créé pour les nouveaux modules.

**Recommandation minimale**:
```typescript
// backend/test/unit/suivi-eleve.service.test.ts
import { suiviEleveService } from '@modules/suivi-eleves/services';

describe('SuiviEleveService', () => {
    it('devrait créer un incident avec etablissementId', async () => {
        const incident = await suiviEleveService.createIncident(
            {
                eleveId: 'uuid-eleve',
                gravite: 'MINEUR',
                type: 'RETARD',
                description: 'Test incident',
            },
            'uuid-declarant',
            'uuid-etablissement'
        );
        
        expect(incident.eleveId).toBe('uuid-eleve');
        expect(incident.etablissementId).toBe('uuid-etablissement');
    });
});
```

---

## Synthèse des Corrections Requises

### 🔴 CRITIQUE (7 corrections - Bloquant pour production)

| # | Module | Problème | Fichier | Priorité |
|---|--------|----------|---------|----------|
| 1 | Santé | Colonne avec accent `antécédentsMedicaux` | `dossier-medical.entity.ts` + migration 032 | **P0** |
| 2 | Paie | Absence validation workflow | `bulletin-paie.entity.ts` + service | **P0** |
| 3 | Suivi Élèves | Absence pagination | `suivi-eleve.service.ts` | **P0** |
| 4 | Suivi Personnel | Absence pagination | `suivi-personnel.service.ts` | **P0** |
| 5 | RBAC | Permissions non créées dans seed | `rbac.seed.ts` | **P0** |
| 6 | Workflow | Aucun nouveau module intégré | Tous les services | **P0** |
| 7 | Audit | Audit trail non implémenté | Tous les services | **P0** |

### 🟡 MOYEN (12 corrections - Recommandé avant v2.0)

| # | Module | Problème | Impact |
|---|--------|----------|--------|
| 1 | Auth | Cast `as any` dans login | TypeScript strict |
| 2 | Cartes | Redondance QR code | Confusion métier |
| 3 | Paie | Calcul salaireNet automatique | Productivité |
| 4 | Suivi Élèves | Intégration Gamification | Cohérence |
| 5 | Suivi Personnel | Visibilité `visibleConcerned` | Confidentialité |
| 6 | Santé | Notifications incidents graves | Sécurité |
| 7 | Configuration | Paramètres manquants | Flexibilité |
| 8 | Multi-tenant | Validation croisée établissement | Sécurité |
| 9 | Performance | Cache absent | Rapidité |
| 10 | Index | Index composites manquants | Performance |
| 11 | RBAC | Attribution permissions aux rôles | Fonctionnel |
| 12 | Migration | Colonnes statut workflow | Workflow |

### 🟢 MINEUR (5 améliorations - Optionnel)

| # | Amélioration | Bénéfice |
|---|--------------|----------|
| 1 | Index `groupeSanguin` | Requêtes médicales |
| 2 | Middleware `staffOnly` → `requireRoles()` | Cohérence |
| 3 | Tests unitaires | Qualité |
| 4 | Documentation API Swagger | DX |
| 5 | Logs structurés JSON | Monitoring |

---

## Plan d'Action Recommandé

### Phase 1 : Corrections Critiques (2-3 heures)
1. ✅ Renommer `antécédentsMedicaux` → `antecedentsMedicaux`
2. ✅ Créer migration 033 pour statuts workflow
3. ✅ Ajouter pagination dans `suivi-eleve.service.ts` et `suivi-personnel.service.ts`
4. ✅ Créer permissions RBAC dans `rbac.seed.ts`
5. ✅ Intégrer `auditService.log()` dans tous les services
6. ✅ Intégrer validation workflow pour Paie, Sanctions, Incidents graves

### Phase 2 : Améliorations Moyennes (4-6 heures)
7. ✅ Créer paramètres de configuration pour nouveaux modules
8. ✅ Ajouter cache in-memory dans `sante.service.ts`
9. ✅ Implémenter notifications incidents graves
10. ✅ Intégrer Gamification pour félicitations
11. ✅ Ajouter validations croisées établissement
12. ✅ Attribuer permissions aux rôles dans seed

### Phase 3 : Optimisations (2-3 heures)
13. ✅ Index composites pour performances
14. ✅ Correction cast `as any` dans auth
15. ✅ Tests unitaires minimaux
16. ✅ Documentation Swagger endpoints

---

## Conclusion

L'implémentation est **solide et bien structurée**, respectant la plupart des conventions eLISAschool. Les **7 corrections critiques** sont nécessaires pour garantir :
- ✅ La sécurité des données médicales (accent colonne)
- ✅ La conformité workflow (validations multi-niveau)
- ✅ La performance (pagination)
- ✅ La traçabilité (audit trail)
- ✅ Le contrôle d'accès (permissions RBAC)

**Après corrections**, le système sera **prêt pour la production** avec une note de 9.5/10.

---

**Prochaines étapes** :
1. Appliquer les corrections P0 (Phase 1)
2. Exécuter `npm run typeorm migration:run`
3. Tester les endpoints avec Postman/curl
4. Vérifier les logs d'audit
5. Valider les permissions RBAC

**Date de validation estimée** : 1 jour de travail
