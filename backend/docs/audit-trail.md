# Système d'Audit Trail - eLISAschool

## 📋 Vue d'ensemble

Le système d'audit trail d'eLISAschool permet de tracer **toutes les actions sensibles** effectuées dans l'application pour assurer la **sécurité**, la **conformité** et la **traçabilité** complète des opérations.

## 🎯 Fonctionnalités

### ✅ Implémentées

1. **Journalisation complète**
   - Authentification (connexions, échecs, mots de passe)
   - CRUD sur les entités critiques (élèves, utilisateurs, etc.)
   - Modifications de configuration
   - Contrôles d'accès (accès refusés)
   - Opérations sur les notes

2. **API de consultation**
   - `GET /api/audit/logs` - Liste paginée avec filtres
   - `GET /api/audit/logs/:id` - Détail d'un log
   - `GET /api/audit/logs/me` - Mes logs (tous utilisateurs)
   - `GET /api/audit/logs/export` - Export CSV/JSON
   - `GET /api/audit/logs/statistics` - Statistiques

3. **Filtres avancés**
   - Par utilisateur, action, module, cible
   - Par sévérité (INFO, WARNING, CRITICAL)
   - Par date (range)
   - Par succès/échec
   - Recherche textuelle

4. **Export**
   - Format CSV (compatible Excel)
   - Format JSON (intégration SIEM)
   - Filtrage par période

5. **Archivage automatique**
   - Logs < 30 jours : table principale (accès rapide)
   - Logs 30-365 jours : table archive
   - Logs > 365 jours : purge configurable

6. **Statistiques**
   - Nombre total de logs
   - Logs par action, module, sévérité
   - Taux d'échec
   - Activité dernières 24h
   - Top 10 des utilisateurs les plus actifs

7. **Interceptor automatique**
   - Capture automatique des opérations CRUD
   - Réduction de la duplication de code
   - Configuration flexible par module

## 🏗️ Architecture

### Composants

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── entities/
│   │   │   └── audit-log.entity.ts      # Entité AuditLog
│   │   └── services/
│   │       └── audit.service.ts          # Service principal
│   └── audit/
│       ├── controllers/
│       │   └── audit.controller.ts       # API REST
│       ├── dto/
│       │   └── audit-filters.dto.ts      # Validation
│       ├── services/
│       │   └── archivage.service.ts      # Archivage & stats
│       └── index.ts
├── common/
│   └── interceptors/
│       └── audit.interceptor.ts          # Interceptor auto
└── database/
    └── migrations/
        └── 003-audit-logs-archive.sql    # Migration archive
```

### Base de données

**Table : `audit_logs`**
- `id` (UUID)
- `utilisateur_id` (UUID, nullable)
- `action` (ENUM: LOGIN, USER_CREATE, etc.)
- `severity` (ENUM: INFO, WARNING, CRITICAL)
- `cible` (VARCHAR: type d'entité)
- `cible_id` (UUID)
- `description` (TEXT)
- `anciennes_valeurs` (JSON)
- `nouvelles_valeurs` (JSON)
- `ip_address` (VARCHAR)
- `user_agent` (TEXT)
- `module` (VARCHAR)
- `est_echec` (BOOLEAN)
- `erreur` (TEXT)
- `created_at` (TIMESTAMP)

**Table : `audit_logs_archive`**
- Structure identique + `archived_at`

## 🚀 Utilisation

### 1. Instrumenter un module

#### Méthode manuelle (recommandée pour contrôle fin)

```typescript
import { auditService, AuditAction } from '@modules/auth';

async create(dto: CreateDto, req?: Request): Promise<Entity> {
    const entity = await this.repo.save(dto);
    
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ELEVE_CREATE,
            cible: 'Eleve',
            cibleId: entity.id,
            description: `Création élève: ${entity.matricule}`,
            nouvellesValeurs: dto,
            module: 'eleves',
        }, req);
    }
    
    return entity;
}
```

#### Méthode avec interceptor (automatique)

```typescript
import { createAuditInterceptor } from '@common/interceptors/audit.interceptor';

const auditInterceptor = createAuditInterceptor({
    module: 'eleves',
    entityType: 'Eleve',
});

router.post('/', authMiddleware, auditInterceptor, async (req, res) => {
    // Audit automatique
});
```

### 2. Consulter les logs

```bash
# Tous les logs (ADMIN uniquement)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/audit/logs

# Avec filtres
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/audit/logs?module=eleves&action=ELEVE_CREATE&limit=100"

# Export CSV
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/audit/logs/export?format=csv"

# Statistiques
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/audit/logs/statistics
```

### 3. Archivage

```typescript
import { auditArchivageService } from '@modules/audit/services/archivage.service';

// Archiver les logs de plus de 30 jours
const result = await auditArchivageService.archiveOldLogs(30);
console.log(`${result.archived} logs archivés`);

// Purger les archives de plus de 365 jours
const purgeResult = await auditArchivageService.purgeArchivedLogs(365);
```

## 📊 Actions d'audit disponibles

### Authentification
- `LOGIN`, `LOGOUT`, `LOGIN_FAILED`
- `PASSWORD_CHANGE`, `PASSWORD_RESET`

### Utilisateurs
- `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`
- `USER_SUSPEND`, `USER_ACTIVATE`, `ROLE_CHANGE`

### Élèves
- `ELEVE_CREATE`, `ELEVE_UPDATE`, `ELEVE_DELETE`, `ELEVE_INSCRIPTION`

### Académique
- `CYCLE_CREATE/UPDATE/DELETE`
- `NIVEAU_CREATE/UPDATE/DELETE`
- `CLASSE_CREATE/UPDATE/DELETE`
- `MATIERE_CREATE/UPDATE/DELETE`
- `PERIODE_CREATE/UPDATE/DELETE`
- `ANNEE_SCOLAIRE_CREATE/UPDATE/DELETE/ACTIVATE`
- `BULLETIN_GENERATE`, `BULLETIN_UPDATE`

### Services
- Cantine: `MENU_CREATE`, `INSCRIPTION_CANTINE_CREATE`, `SOLDE_RECHARGE`, etc.
- Transport: `LIGNE_CREATE`, `INSCRIPTION_TRANSPORT_CREATE`, etc.
- Cartes: `CARTE_CREATE`, `CARTE_DESACTIVER`, `CARTE_PERTE`, etc.
- Matériel: `MATERIEL_CREATE`, `MATERIEL_ASSIGN`, etc.

### Communication
- `MESSAGE_SEND`, `MESSAGE_DELETE`
- `CLUB_CREATE`, `CLUB_JOIN`, etc.
- `BADGE_AWARD`, `SCORE_UPDATE`

### Administration
- RBAC: `ROLE_CREATE/UPDATE/DELETE`, `ROLE_ASSIGN`, `PERMISSION_CREATE/UPDATE/DELETE`
- Configuration: `CONFIG_UPDATE`, `MODULE_ACTIVATE/DEACTIVATE`
- Requêtes: `REQUETE_CREATE`, `REQUETE_EXECUTE`
- Impressions: `DOCUMENT_GENERATE`, `DOCUMENT_PRINT`

### Sécurité
- `ACCESS_DENIED`, `PERMISSION_CHANGE`
- `DATA_EXPORT`, `DATA_IMPORT`, `DATA_DELETE_BULK`

## 🔐 Sécurité

### Accès à l'API d'audit

- `/api/audit/logs` - Réservé aux rôles `ADMIN` et `SUPER_ADMIN`
- `/api/audit/logs/me` - Accessible à tous les utilisateurs authentifiés
- `/api/audit/logs/export` - Réservé aux rôles `ADMIN` et `SUPER_ADMIN`
- `/api/audit/logs/statistics` - Réservé aux rôles `ADMIN` et `SUPER_ADMIN`

### Protection des données

- Les données sensibles (mots de passe, tokens) sont automatiquement masquées
- L'IP et le User-Agent sont capturés pour chaque action
- Les échecs sont marqués avec `estEchec: true`

## 📈 Monitoring

### Métriques disponibles

Via `/api/audit/logs/statistics` :
- `totalLogs` : Nombre total de logs
- `last24h` : Activité dernières 24 heures
- `failureRate` : Taux d'échec en pourcentage
- `logsByAction` : Répartition par type d'action
- `logsByModule` : Répartition par module
- `logsBySeverity` : Répartition par sévérité
- `topUsers` : Top 10 des utilisateurs les plus actifs

### Alertes recommandées

Configurer des alertes sur :
- Taux d'échec > 10%
- Plus de 50 `ACCESS_DENIED` en 1 heure
- Tentatives de login échouées > 10 pour un même utilisateur
- Actions `CRITICAL` détectées

## 🔄 Migration

### Exécuter la migration

```bash
# Appliquer la migration d'archivage
psql -U <user> -d <database> -f backend/src/database/migrations/003-audit-logs-archive.sql
```

### Vérifier l'installation

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'audit_logs%';

-- Vérifier les logs
SELECT COUNT(*) FROM audit_logs;

-- Vérifier les statistiques
SELECT action, COUNT(*) FROM audit_logs 
GROUP BY action ORDER BY COUNT(*) DESC;
```

## 📝 Guide d'instrumentation

Voir le fichier complet : [AUDIT-INSTRUMENTATION-GUIDE.md](./AUDIT-INSTRUMENTATION-GUIDE.md)

## ✅ Checklist d'implémentation

- [x] Entité `AuditLog` créée
- [x] Service `AuditService` implémenté
- [x] Enum `AuditAction` étendu (80+ actions)
- [x] Module audit avec API REST
- [x] Filtres et pagination
- [x] Export CSV/JSON
- [x] Statistiques
- [x] Migration archivage
- [x] Service d'archivage
- [x] Interceptor automatique
- [x] Modules instrumentés (partiel)
- [ ] Instrumenter tous les modules restants
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation frontend

## 🐛 Troubleshooting

### Les logs ne se créent pas

1. Vérifier que `req.utilisateur` est défini
2. Vérifier les logs console pour erreurs
3. Vérifier la connexion base de données

### L'export CSV est vide

1. Vérifier les filtres appliqués
2. Vérifier qu'il y a des logs dans la période
3. Vérifier les permissions (ADMIN requis)

### Performance dégradée

1. Vérifier le nombre de logs (archiver si > 100k)
2. Vérifier les index sur `audit_logs`
3. Utiliser la vue `audit_logs_complete` pour les recherches

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation
- Vérifier les logs applicatifs
- Contacter l'équipe de développement

---

**Version**: 1.0.0  
**Dernière mise à jour**: Juin 2026  
**Auteur**: franck arlos chendjou
