# 📘 Guide d'Utilisation - Système de Backup eLISAschool

## 🚀 Démarrage Rapide

### 1. Exécuter les Migrations

```bash
cd backend
npm run db:migrate
```

Cela créera les tables :
- `backup_records` - Métadonnées des backups
- `backup_schedules` - Planifications
- `backup_jobs` - File d'attente
- `parametre_versions` - Historique des paramètres

### 2. Configurer l'Environnement

Ajouter dans `.env` :

```env
# Clé de chiffrement (obligatoire pour encrypt=true)
BACKUP_ENCRYPTION_KEY=votre-cle-secrete-d-au-moins-32-caracteres-!!!
```

Générer une clé :
```bash
openssl rand -hex 32
```

### 3. Tester l'API

```bash
# Vérifier que l'API répond
curl http://localhost:3000/api/health
```

---

## 📡 Exemples d'Utilisation API

### Créer un Backup Configuration

```bash
curl -X POST http://localhost:3000/api/backups/config \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "compress": true,
    "encrypt": true,
    "retentionDays": 30
  }'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-backup",
    "version": "v1.0.0-global-2025-06-06T...",
    "size": "2.45 MB",
    "createdAt": "2025-06-06T14:30:00Z"
  },
  "message": "Backup de configuration créé avec succès"
}
```

### Créer un Backup Database

```bash
curl -X POST http://localhost:3000/api/backups/database/UUID_ETABLISSEMENT \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "compress": true,
    "encrypt": true,
    "retentionDays": 90
  }'
```

### Lister les Backups

```bash
# Tous les backups
curl http://localhost:3000/api/backups \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Filtrer par type
curl "http://localhost:3000/api/backups?backupType=config&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Restaurer un Backup

```bash
curl -X POST http://localhost:3000/api/backups/UUID_BACKUP/restore \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": false
  }'
```

### Vérifier l'Intégrité

```bash
curl -X POST http://localhost:3000/api/backups/UUID_BACKUP/verify \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "error": null
  },
  "message": "Intégrité vérifiée"
}
```

### Cloner une Configuration

```bash
curl -X POST http://localhost:3000/api/configuration/clone \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceEtablissementId": "uuid-source",
    "targetEtablissementIds": ["uuid-target-1", "uuid-target-2"],
    "options": {
      "includeModules": true,
      "includeParametres": true,
      "conflictResolution": "merge",
      "dryRun": false
    }
  }'
```

### Voir les Métriques

```bash
# Globales
curl http://localhost:3000/api/backups/metrics/summary \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Par établissement
curl http://localhost:3000/api/backups/metrics/UUID_ETABLISSEMENT \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Usage stockage
curl http://localhost:3000/api/backups/storage-usage \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 💻 Utilisation en Code (TypeScript)

### Importer les Services

```typescript
import { configBackupService } from '@modules/configuration/services/backup/config-backup.service';
import { databaseBackupService } from '@modules/configuration/services/backup/database-backup.service';
```

### Backup Programmatique

```typescript
// Backup configuration
const backup = await configBackupService.createSnapshot('uuid-etablissement', {
    differential: true,
    compress: true,
    encrypt: true,
    retentionDays: 30,
});

console.log(`Backup créé: ${backup.id} (${backup.getFormattedSize()})`);

// Backup database
const dbBackup = await databaseBackupService.backupEtablissement('uuid-etablissement', {
    compress: true,
    encrypt: true,
    retentionDays: 90,
});

console.log(`DB Backup créé: ${dbBackup.id}`);
```

### Restore Programmatique

```typescript
try {
    await configBackupService.restoreBackup('uuid-backup', false);
    console.log('Configuration restaurée avec succès');
} catch (error) {
    console.error('Échec de la restauration:', error.message);
}
```

### Clonage

```typescript
const results = await configBackupService.cloneConfiguration(
    'source-uuid',
    ['target1-uuid', 'target2-uuid'],
    {
        includeModules: true,
        includeParametres: true,
        conflictResolution: 'merge',
        dryRun: true, // Test sans appliquer
    }
);

console.log('Résultats:', results);
```

---

## 🔧 Utilisation Avancée

### Backups Différentiels

Les backups différentiels ne stockent que les changements, réduisant la taille de 60-80% :

```typescript
const differentialBackup = await configBackupService.createSnapshot('uuid', {
    differential: true, // Active le mode différentiel
    compress: true,
});
```

### Vérification d'Intégrité

```typescript
const integrity = await databaseBackupService.verifyBackupIntegrity('backup-id');

if (!integrity.valid) {
    console.error('Backup corrompu:', integrity.error);
    // Alerte admin, recréer le backup, etc.
}
```

### Nettoyage Automatique

```typescript
// Supprimer les backups expirés
const storageProvider = new DatabaseStorageProvider();
const cleaned = await storageProvider.cleanupExpiredBackups();
console.log(`${cleaned} backups expirés supprimés`);
```

---

## 📊 Monitoring

### Vérifier les Backups Récents

```sql
SELECT 
    id,
    backup_type,
    version,
    size_bytes,
    compressed,
    encrypted,
    created_at,
    retention_until
FROM backup_records
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Usage par Établissement

```sql
SELECT 
    etablissement_id,
    COUNT(*) as backup_count,
    SUM(size_bytes) as total_bytes,
    MIN(created_at) as first_backup,
    MAX(created_at) as last_backup
FROM backup_records
WHERE deleted_at IS NULL
GROUP BY etablissement_id
ORDER BY total_bytes DESC;
```

### Backups Expirés

```sql
SELECT id, backup_type, retention_until
FROM backup_records
WHERE retention_until < NOW()
  AND deleted_at IS NULL;
```

---

## ⚠️ Bonnes Pratiques

### 1. Fréquence des Backups

| Type | Fréquence Recommandée | Rétention |
|------|----------------------|-----------|
| Config | Quotidien | 30 jours |
| Database | Quotidien | 90 jours |
| Full | Hebdomadaire | 180 jours |

### 2. Chiffrement

**Toujours activer le chiffrement en production :**

```typescript
{
    encrypt: true,
    // BACKUP_ENCRYPTION_KEY doit être dans .env
}
```

### 3. Testing

**Tester régulièrement les restaurations :**

```bash
# 1. Créer un backup
POST /api/backups/database/:id

# 2. Vérifier l'intégrité
POST /api/backups/:id/verify

# 3. Restaurer sur environnement de test
POST /api/backups/:id/restore
```

### 4. Monitoring

**Vérifier quotidiennement :**

```bash
# Métriques
GET /api/backups/metrics/summary

# Alertes si :
# - Aucun backup dans les dernières 24h
# - Taux de succès < 95%
# - Usage stockage > 80%
```

---

## 🐛 Dépannage

### Erreur : Clé de chiffrement invalide

**Problème :**
```
BACKUP_ENCRYPTION_KEY manquante ou < 32 caractères
```

**Solution :**
```bash
# Vérifier
echo -n "$BACKUP_ENCRYPTION_KEY" | wc -c

# Régénérer
openssl rand -hex 32
```

### Erreur : Backup non trouvé

**Vérifier :**
```sql
SELECT id, deleted_at FROM backup_records WHERE id = 'UUID';
```

Si `deleted_at` est présent, le backup a été supprimé (soft delete).

### Erreur : Échec restauration

**Causes possibles :**
- Backup corrompu (vérifier checksum)
- Conflits de données (utiliser `force: true`)
- Permissions insuffisantes

**Solution :**
```bash
# Vérifier intégrité d'abord
POST /api/backups/:id/verify

# Si OK, forcer la restauration
POST /api/backups/:id/restore
{
    "force": true
}
```

---

## 📈 Performance

### Optimisations Implémentées

✅ **Index composites** pour requêtes multi-tenant  
✅ **Compression gzip** (60-80% réduction)  
✅ **Backups différentiels** (réduction supplémentaire)  
✅ **Soft delete** pour récupération rapide  
✅ **QueryRunner** pour transactions atomiques  

### Recommandations

- **Backup config** : < 5 secondes
- **Backup database** : < 30 secondes (dépend de la taille)
- **Restore** : < 60 secondes
- **Vérifier** : < 2 secondes

---

## 🔐 Sécurité

### RBAC

| Endpoint | Rôle Requis |
|----------|-------------|
| `POST /api/backups/*` | ADMIN, SUPER_ADMIN |
| `GET /api/backups/*` | Authentifié (scoped) |
| `DELETE /api/backups/*` | ADMIN, SUPER_ADMIN |
| `POST /api/configuration/clone` | ADMIN, SUPER_ADMIN |

### Chiffrement

- **Algorithme** : AES-256-GCM
- **IV** : Unique par backup (16 bytes random)
- **Authentification** : GCM tag (16 bytes)
- **Clé** : Stockée dans `.env` (jamais en dur)

### Intégrité

- **Checksum** : SHA-256 calculé sur données compressées/chiffrées
- **Validation** : Automatique avant restauration
- **Détection** : Tampering détecté par GCM

---

## 📚 Ressources

### Documentation Technique
- [Plan d'implémentation](file:///home/franckylab/.config/Qoder/SharedClientCache/cache/plans/Amélioration_Système_Backup_task-eb6.md)
- [Progression complète](file:///home/franckylab/projets/eLISAschool/BACKUP-SYSTEM-IMPLEMENTATION-COMPLETE.md)
- [Architecture détaillée](file:///home/franckylab/projets/eLISAschool/BACKUP-SYSTEM-PROGRESS.md)

### Code Source
- [ConfigBackupService](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/backup/config-backup.service.ts)
- [DatabaseBackupService](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/backup/database-backup.service.ts)
- [BackupController](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/controllers/backup.controller.ts)
- [Storage Interface](file:///home/franckylab/projets/eLISAschool/backend/src/modules/configuration/services/storage/storage-provider.interface.ts)

---

*Dernière mise à jour : 2025-06-06*  
*Version : 1.0.0*
