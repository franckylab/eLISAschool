# Plan d'Amélioration : Système de Sauvegarde & Configuration Production-Grade

## Contexte

Le système actuel de sauvegarde d'eLISAschool présente plusieurs lacunes critiques pour un environnement SaaS production :
- **Pas de sauvegarde database-level** (uniquement configuration JSON en mémoire)
- **Pas de stockage externe** (tout dans la table `historique_configuration`)
- **Pas de planification automatique** ni de politique de rétention
- **Pas d'isolation des backups par établissement**
- **Pas de validation d'intégrité** ni de chiffrement
- **Pas de monitoring** des échecs de sauvegarde

**Objectif** : Implémenter un système de sauvegarde complet de niveau production SaaS avec :
1. Sauvegarde/restauration de configuration avec versioning sémantique
2. Backup database PostgreSQL par établissement (approche TypeORM pure)
3. Gestion avancée des paramètres (validation, templates, propagation)
4. Stockage hybride configurable (DB + S3) sélectionnable via paramètres système
5. Planification automatique, monitoring, alertes

---

## Architecture Proposée

### 3 Niveaux de Sauvegarde

```
┌─────────────────────────────────────────────────────┐
│ Niveau 1: Configuration Backup (JSON versionné)    │
│  • Snapshots avec semver                            │
│  • Backups différentiels (RFC 6902 JSON Patch)     │
│  • Clonage inter-établissements                     │
│  • Templates de configuration                       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Niveau 2: Database Backup (TypeORM export)          │
│  • Export données par établissement                  │
│  • Chiffrement AES-256-GCM                          │
│  • Checksums SHA-256                                │
│  • Restore transactionnel atomique                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Niveau 3: Storage Abstraction Layer                 │
│  • Interface IBackupStorage                         │
│  • Providers: Database, S3, FileSystem              │
│  • Configurable via paramètre système               │
│  • Failover automatique                             │
└─────────────────────────────────────────────────────┘
```

---

## Plan d'Implémentation par Phase

### Phase 1 : Couche de Stockage Abstraite (Fondation)

**Durée** : 2-3 jours | **Complexité** : Moyenne | **Risque** : Bas

#### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `src/modules/configuration/services/storage/storage-provider.interface.ts` | Interface `IBackupStorage` |
| `src/modules/configuration/services/storage/database-storage.provider.ts` | Implémentation stockage DB |
| `src/modules/configuration/services/storage/s3-storage.provider.ts` | Implémentation S3 (AWS SDK v3) |
| `src/modules/configuration/services/storage/storage-factory.ts` | Factory pattern |
| `src/modules/configuration/entities/backup-record.entity.ts` | Entité `backup_records` |
| `src/modules/configuration/dto/storage.dto.ts` | DTOs configuration storage |

#### Décisions Techniques

- **Interface Storage** : Méthodes `save()`, `load()`, `delete()`, `list()`, `getStorageUsage()`
- **S3** : Utiliser `@aws-sdk/client-s3` v3 (modulaire), support S3-compatible (MinIO, R2, DigitalOcean)
- **Bucket naming** : `elisaschool-backups-{env}-{region}` avec prefix par établissement `{etablissementId}/backups/`
- **TypeORM** : Index composites sur `(etablissementId, backupType, createdAt DESC)`, soft delete avec `@DeleteDateColumn()`

#### Migration SQL

```sql
-- 008-backup-records-table.sql
CREATE TABLE backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('config', 'database', 'full')),
    version VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'database',
    storage_key VARCHAR(500) NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    compressed BOOLEAN DEFAULT false,
    size_bytes BIGINT,
    metadata JSONB,
    retention_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_backup_records_tenant 
    ON backup_records(etablissement_id, backup_type, created_at DESC);
```

---

### Phase 2 : Sauvegarde Configuration Améliorée

**Durée** : 3-4 jours | **Complexité** : Moyenne-Haute | **Risque** : Moyen

#### Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `services/backup/config-backup.service.ts` | Créer | Service principal backup config |
| `entities/parametre-version.entity.ts` | Créer | Versioning des paramètres |
| `dto/backup.dto.ts` | Créer | DTOs backup |
| `services/configuration-history.service.ts` | Modifier | Intégrer versioning |

#### Fonctionnalités Clés

1. **Versioning sémantique** : `v{major}.{minor}.{patch}-{etablissementId}`
   - Major : changements schema
   - Minor : nouveaux paramètres
   - Patch : modifications valeurs

2. **Backups différentiels** : Utiliser JSON Patch (RFC 6902), réduction 60-80% taille

3. **Clonage inter-établissements** :
   - Endpoint : `POST /api/configuration/clone`
   - Résolution conflits : `skip` | `overwrite` | `merge`

4. **Import/Export avec validation** :
   - Mode dry-run : `POST /api/configuration/import?dryRun=true`
   - Rollback transactionnel en cas d'erreur

---

### Phase 3 : Sauvegarde Database par Établissement

**Durée** : 4-5 jours | **Complexité** : Haute | **Risque** : Moyen-Haut

#### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `services/backup/database-backup.service.ts` | Service export TypeORM |
| `controllers/backup.controller.ts` | Controller backup |

#### Approche Technique (Sans pg_dump externe)

**Pourquoi pas pg_dump ?**
- Nécessite accès shell, incompatible Docker sans sidecar
- Complexe à isoler par établissement (schema partagé)
- Dépendance système externe

**Approche TypeORM pure (recommandée) :**
```typescript
// Exporter données scopées par etablissement_id
async exportEtablissementData(etablissementId: string): Promise<DatabaseExport> {
    const tables = this.getTenantTables(); // Tables avec etablissement_id
    const exportData: Record<string, any[]> = {};
    
    for (const table of tables) {
        const rows = await this.dataSource.query(
            `SELECT * FROM ${table} WHERE etablissement_id = $1`,
            [etablissementId]
        );
        exportData[table] = rows;
    }
    return exportData;
}
```

**Avantages :**
- ✅ Portable, fonctionne dans Docker
- ✅ Pas de dépendance système
- ✅ Isolation garantie par établissement
- ✅ Transactionnel avec QueryRunner

**Chiffrement** : `crypto.createCipheriv('aes-256-gcm', key, iv)`, clé dans `.env` (`BACKUP_ENCRYPTION_KEY`)

---

### Phase 4 : Planification & File d'Attente

**Durée** : 4-5 jours | **Complexité** : Haute | **Risque** : Moyen

#### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `services/backup/backup-scheduler.service.ts` | Planification cron |
| `services/queue/backup-queue.service.ts` | File d'attente DB |
| `entities/backup-schedule.entity.ts` | Entité `backup_schedules` |
| `entities/backup-job.entity.ts` | Entité `backup_jobs` (queue) |

#### Décisions Techniques

**File d'attente en base (recommandé pour démarrage) :**
- Table `backup_jobs` avec statuts : `pending | running | completed | failed`
- Worker poll toutes les 10 secondes
- Pattern "Database Queue" avec locking

**Évolution future vers BullMQ + Redis :**
- Si `REDIS_HOST` configuré dans `.env`, migrer vers BullMQ
- Jobs répétables : `queue.add('backup', data, { repeat: { cron } })`

**Planification avec `node-cron` :**

```typescript
@Entity('backup_schedules')
export class BackupSchedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId: string; // NULL = tous les établissements

    @Column({ type: 'varchar', length: 50 })
    backupType: 'config' | 'database' | 'full';

    @Column({ type: 'varchar', length: 50 })
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

    @Column({ type: 'varchar', length: 100, nullable: true })
    cronExpression: string;

    @Column({ type: 'int', default: 30 })
    retentionDays: number;

    @Column({ type: 'boolean', default: true })
    actif: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastRunAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    nextRunAt: Date;
}
```

**Nouvelles dépendances :**
```json
{
    "@aws-sdk/client-s3": "^3.x",
    "node-cron": "^3.x"
}
```

---

### Phase 5 : Gestion Avancée des Paramètres

**Durée** : 3-4 jours | **Complexité** : Moyenne | **Risque** : Bas  
*(Peut être implémentée en parallèle des Phases 2-4)*

#### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `services/parametre/parametre-validator.service.ts` | Validation avancée |
| `services/parametre/parametre-template.service.ts` | Templates par type |
| `services/parametre/parametre-propagation.service.ts` | Propagation multi-school |
| `entities/parametre-template.entity.ts` | Entité templates |
| `entities/parametre-version.entity.ts` | Entité versions |

#### Fonctionnalités

1. **Validation avancée :**
   - Cross-parameter validation (ex: `max_eleves` > `current_eleves`)
   - Validation contextuelle par type d'établissement
   - Règles stockées en JSON dans `parametre.validation`

2. **Templates par type :**
   - Templates : "primaire", "collège", "lycée", "complet"
   - Application = merge avec existant (pas d'écrasement)

3. **Propagation multi-school :**
   - Options : `skipIfExists` | `overwrite` | `onlyIfNull`
   - Mode dry-run

4. **Versioning des paramètres :**

```typescript
@Entity('parametre_versions')
export class ParametreVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    parametreId: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId: string;

    @Column({ type: 'text' })
    ancienneValeur: string;

    @Column({ type: 'text' })
    nouvelleValeur: string;

    @Column({ type: 'int' })
    version: number; // Auto-incrément par paramètre

    @Column({ type: 'uuid', nullable: true })
    modifiedBy: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

---

### Phase 6 : Monitoring & Observabilité

**Durée** : 2-3 jours | **Complexité** : Moyenne | **Risque** : Bas

#### Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `services/monitoring/backup-metrics.service.ts` | Métriques |
| `services/monitoring/backup-alert.service.ts` | Alertes |

#### Métriques Suivies

- Taux de succès backups (24h, 7j, 30j)
- Taille moyenne par établissement
- Temps d'exécution moyen
- Nombre de retries
- Espace stockage utilisé / quota

#### Endpoints Monitoring

```
GET /api/backups/metrics/summary           # Vue d'ensemble
GET /api/backups/metrics/:etablissementId  # Par établissement
GET /api/backups/status                    # Statut temps réel
GET /api/backups/storage-usage             # Usage stockage
```

---

### Phase 7 : API Endpoints Complets

**Durée** : 2 jours | **Complexité** : Basse | **Risque** : Bas

#### Nouveaux Endpoints

```
# Backup Management
POST   /api/backups/config                          # Créer backup config
POST   /api/backups/database/:etablissementId       # Créer backup DB
POST   /api/backups/full/:etablissementId           # Backup complet
GET    /api/backups                                 # Liste backups (filtrable)
GET    /api/backups/:id                             # Détails backup
GET    /api/backups/:id/download                    # Télécharger backup
DELETE /api/backups/:id                             # Supprimer backup
POST   /api/backups/:id/restore                     # Restaurer backup
POST   /api/backups/:id/verify                      # Vérifier intégrité

# Scheduling
GET    /api/backups/schedules                       # Liste planifications
POST   /api/backups/schedules                       # Créer planification
PUT    /api/backups/schedules/:id                   # Modifier planification
DELETE /api/backups/schedules/:id                   # Supprimer planification
POST   /api/backups/schedules/:id/run               # Exécuter maintenant

# Storage Configuration
GET    /api/backups/storage/config                  # Config stockage actuelle
PUT    /api/backups/storage/config                  # Configurer stockage
POST   /api/backups/storage/test                    # Tester connexion storage

# Configuration Cloning
POST   /api/configuration/clone                     # Cloner config entre établissements
POST   /api/configuration/import                    # Importer config (avec dry-run)
POST   /api/configuration/export                    # Exporter config

# Parameter Templates
GET    /api/parametres/templates                     # Liste templates
POST   /api/parametres/templates                     # Créer template
POST   /api/parametres/templates/:id/apply           # Appliquer template
POST   /api/parametres/propagate                     # Propager paramètre

# Monitoring
GET    /api/backups/metrics/summary                  # Métriques globales
GET    /api/backups/metrics/:etablissementId         # Métriques par établissement
```

---

### Phase 8 : Stratégie de Migration (Zero Downtime)

**Durée** : 1-2 jours | **Complexité** : Moyenne | **Risque** : Moyen

#### Plan en 4 Étapes

**Étape 1 - Migration de schema (zero downtime) :**
- Créer nouvelles tables en parallèle des anciennes
- Ne pas supprimer `historique_configuration`
- Les deux systèmes coexistent pendant la transition

**Étape 2 - Migration des données existantes :**
```typescript
async migrateExistingBackups(): Promise<void> {
    const oldBackups = await this.historiqueRepo.find({
        where: { action: ActionConfiguration.EXPORT },
        order: { createdAt: 'ASC' }
    });
    
    for (const old of oldBackups) {
        const newRecord = this.backupRepo.create({
            etablissementId: null, // Anciens backups = globaux
            backupType: 'config',
            version: `1.0.0-migrated-${old.id}`,
            checksum: this.calculateChecksum(old.nouvelleValeur),
            storageProvider: 'database',
            storageKey: old.id, // Reference vers l'ancien record
            metadata: { migratedFrom: old.id },
            createdAt: old.createdAt,
        });
        await this.backupRepo.save(newRecord);
    }
}
```

**Étape 3 - Feature flag :**
- Paramètre système `backup.system_version` = `v1` (ancien) ou `v2` (nouveau)
- Le controller route vers le bon service selon le flag
- Permet le rollback si problème

**Étape 4 - Dépréciation progressive :**
- Après validation du nouveau système sur 2-4 semaines
- Marquer les anciens endpoints comme `deprecated`
- Supprimer le code ancien après 1 version

---

## Dépendances Entre Phases

```
Phase 1 (Storage Layer)
    │
    ├──→ Phase 2 (Config Backup) ──→ Phase 7 (API)
    │
    ├──→ Phase 3 (Database Backup) ──→ Phase 7 (API)
    │
    ├──→ Phase 4 (Scheduler & Queue) ──→ Phase 6 (Monitoring)
    │
    ├──→ Phase 5 (Paramètre Management) ── (parallèle, pas de dépendance)
    │
    └──→ Phase 8 (Migration) ── (dernière, après tout)
```

---

## Estimation Totale

| Phase | Complexité | Durée | Risque |
|-------|-----------|-------|--------|
| 1. Storage Layer | Moyenne | 2-3 jours | Bas |
| 2. Config Backup | Moyenne-Haute | 3-4 jours | Moyen |
| 3. Database Backup | Haute | 4-5 jours | Moyen-Haut |
| 4. Scheduler & Queue | Haute | 4-5 jours | Moyen |
| 5. Paramètre Management | Moyenne | 3-4 jours | Bas |
| 6. Monitoring | Moyenne | 2-3 jours | Bas |
| 7. API Endpoints | Basse | 2 jours | Bas |
| 8. Migration | Moyenne | 1-2 jours | Moyen |
| **Total** | | **21-28 jours** | |

---

## Bonnes Pratiques Implémentées

### Stratégie de Backup (Règle 3-2-1)
- **3 copies** des données
- **2 supports différents** (DB + S3)
- **1 copie hors-site** (S3 cloud)

### Objectifs de Récupération
- **RPO (Recovery Point Objective)** : < 24h pour config, < 1h pour database
- **RTO (Recovery Time Objective)** : < 15min pour config, < 1h pour database

### Patterns Multi-Tenant
- Isolation stricte par `etablissement_id` dans toutes les tables
- Jamais de cross-tenant access sans vérification explicite
- Backups toujours scopés par établissement

### Sécurité
- Chiffrement AES-256-GCM pour les backups au repos
- Validation checksum SHA-256 avant toute restauration
- RBAC sur tous les endpoints backup (guards existants étendus)
- IAM roles pour S3 (pas de credentials en dur)

### PostgreSQL Optimizations
- JSONB pour les metadata de backup
- Index partiels pour les requêtes fréquentes
- Index composites pour les requêtes multi-critères

### TypeORM Patterns
- `QueryRunner` pour les transactions explicites
- `@DeleteDateColumn()` pour soft delete
- `@Index()` composites pour les requêtes multi-critères
- Transactions atomiques pour les restore

---

## Fichiers Critiques à Modifier

| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/configuration/services/configuration-history.service.ts` | Intégrer nouveau storage layer |
| `backend/src/modules/configuration/services/configuration.service.ts` | Ajouter hooks backup automatique |
| `backend/src/modules/configuration/controllers/configuration.controller.ts` | Nouveaux endpoints backup |
| `backend/src/modules/configuration/entities/historique-configuration.entity.ts` | Étendre avec métadonnées backup |
| `backend/package.json` | Ajouter dépendances (`@aws-sdk/client-s3`, `node-cron`) |

---

## Vérification & Tests

### Tests Manuels

1. **Créer un backup configuration** :
   ```bash
   POST /api/backups/config
   Body: { "etablissementId": "uuid", "type": "differential" }
   ```

2. **Vérifier le stockage** :
   ```bash
   GET /api/backups/storage-usage
   ```

3. **Restaurer un backup** :
   ```bash
   POST /api/backups/:id/restore
   ```

4. **Configurer S3** :
   ```bash
   PUT /api/backups/storage/config
   Body: { "provider": "s3", "bucket": "...", "region": "..." }
   ```

5. **Planifier un backup quotidien** :
   ```bash
   POST /api/backups/schedules
   Body: { "backupType": "full", "frequency": "daily", "retentionDays": 30 }
   ```

### Tests Automatisés (à implémenter)

- [ ] Test création backup config avec vérification checksum
- [ ] Test restore backup avec validation intégrité
- [ ] Test clonage inter-établissements avec conflits
- [ ] Test planification et exécution automatique
- [ ] Test failover storage provider (DB → S3)
- [ ] Test chiffrement/déchiffrement backup
- [ ] Test politique de rétention (suppression automatique anciens backups)

### Monitoring Post-Déploiement

1. Vérifier les métriques après 24h :
   ```bash
   GET /api/backups/metrics/summary
   ```

2. Configurer alertes si taux de succès < 95%

3. Tester restauration complète sur environnement staging

---

## Prochaines Étapes

1. **Valider ce plan** avec votre approbation
2. **Commencer par Phase 1** (Storage Layer) - fondation critique
3. **Créer un POC S3** avec MinIO local pour valider l'intégration
4. **Définir les politiques de rétention** précises (jours/mois selon type de backup)
5. **Planifier les tests de restauration** réguliers
