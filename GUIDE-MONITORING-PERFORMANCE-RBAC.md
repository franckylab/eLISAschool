# Guide de Monitoring — Performance RBAC v3.0

> **Date** : 21 juin 2026  
> **Version** : 1.0.0  
> **Objectif** : Monitorer et optimiser les performances du système RBAC

---

## 📊 Métriques Clés à Surveiller

### 1. Temps de Résolution des Permissions

**Seuil d'alerte** : > 50ms  
**Cible** : < 20ms (cache hit), < 100ms (cache miss)

```sql
-- Requête la plus critique (résolution des permissions)
SELECT ue.role_id 
FROM utilisateur_etablissements ue
WHERE ue.utilisateur_id = ? 
  AND ue.etablissement_id = ? 
  AND ue.actif = true
LIMIT 1;
```

**Optimisation** :
- ✅ Index composite : `(utilisateur_id, etablissement_id, actif)`
- ✅ Cache Redis (TTL 5 min)
- ✅ Cache in-memory (TTL 5 min)

### 2. Hit Ratio du Cache

**Seuil d'alerte** : < 80%  
**Cible** : > 90%

```typescript
// Dans permission-resolver.service.ts
getCacheStats(): { userCacheSize: number; globalCacheSize: number; ttl: number } {
    return {
        userCacheSize: this.userPermissionCache.size,
        globalCacheSize: this.globalPermissionCache.size,
        ttl: this.CACHE_TTL,
    };
}
```

**Amélioration** :
- Augmenter TTL si données stables (10 min au lieu de 5 min)
- Précharger les permissions des utilisateurs fréquents
- Utiliser Redis Cluster pour distribution

### 3. Nombre de Requêtes DB par Résolution

**Cible** : 1 requête (multi-tenant strict)

**Avant v3.0** : 2-3 requêtes (fallback sur utilisateur_roles)  
**Après v3.0** : 1 requête (utilisateur_etablissements uniquement)

### 4. Taille du Cache Redis

**Seuil d'alerte** : > 100 MB  
**Cible** : < 50 MB

```bash
# Vérifier la taille
redis-cli INFO memory | grep used_memory_human

# Voir les clés RBAC
redis-cli KEYS "permissions:*" | wc -l
```

---

## 🔍 Requêtes SQL de Monitoring

### 1. Performance des Index

```sql
-- Vérifier l'utilisation des index
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'utilisateur_etablissements'
ORDER BY idx_scan DESC;
```

**Interprétation** :
- `idx_scan` élevé = index utilisé fréquemment ✅
- `idx_scan = 0` = index inutile ❌ (à supprimer)

### 2. Plans d'Exécution

```sql
-- Analyser la requête de résolution des permissions
EXPLAIN ANALYZE
SELECT ue.role_id, r.code, r.libelle
FROM utilisateur_etablissements ue
JOIN roles r ON ue.role_id = r.id
WHERE ue.utilisateur_id = 'uuid-user'
  AND ue.etablissement_id = 'uuid-etablissement'
  AND ue.actif = true
LIMIT 1;
```

**Résultat attendu** :
```
Index Scan using idx_ue_user_etablissement_actif on utilisateur_etablissements
  Index Cond: ((utilisateur_id = 'uuid-user'::uuid) AND (etablissement_id = 'uuid-etablissement'::uuid) AND (actif = true))
  Rows Removed by Filter: 0
  Execution Time: 0.050 ms
```

### 3. Statistiques des Rôles

```sql
-- Répartition des utilisateurs par rôle
SELECT 
    r.code,
    r.libelle,
    COUNT(ue.id) as nombre_utilisateurs,
    COUNT(DISTINCT ue.etablissement_id) as nombre_etablissements
FROM utilisateur_etablissements ue
JOIN roles r ON ue.role_id = r.id
WHERE ue.actif = true
GROUP BY r.code, r.libelle
ORDER BY nombre_utilisateurs DESC;
```

### 4. Utilisateurs sans Rôle Actif

```sql
-- Détecter les incohérences
SELECT 
    u.id,
    u.email,
    u.role as role_principal
FROM utilisateurs u
WHERE u.actif = true
  AND NOT EXISTS (
      SELECT 1 
      FROM utilisateur_etablissements ue 
      WHERE ue.utilisateur_id = u.id 
        AND ue.actif = true
  );
```

---

## ⚡ Optimisations Recommandées

### 1. Préchargement des Permissions (Warm Cache)

```typescript
// Dans permission-resolver.service.ts
async warmCacheForActiveUsers(): Promise<void> {
    // Charger les permissions des 100 utilisateurs les plus actifs
    const activeUsers = await AppDataSource
        .getRepository(Utilisateur)
        .createQueryBuilder('u')
        .orderBy('u.derniereConnexion', 'DESC')
        .limit(100)
        .getMany();
    
    for (const user of activeUsers) {
        // Précharger pour chaque établissement
        const etablissements = await AppDataSource
            .getRepository(UtilisateurEtablissement)
            .find({
                where: { utilisateurId: user.id, actif: true },
                select: ['etablissementId'],
            });
        
        for (const ue of etablissements) {
            await this.resolvePermissions(user.id, ue.etablissementId);
        }
    }
    
    logger.info(`🔐 Cache préchargé pour ${activeUsers.length} utilisateurs actifs`);
}
```

**Exécution** : Cron job toutes les heures

### 2. Invalidation Sélective du Cache

```typescript
// Au lieu de invalidateAllCache(), invalider uniquement les clés concernées
async invalidateCacheForRole(roleId: string): Promise<void> {
    // Trouver tous les utilisateurs ayant ce rôle
    const utilisateurEtablissements = await AppDataSource
        .getRepository(UtilisateurEtablissement)
        .find({
            where: { roleId, actif: true },
            select: ['utilisateurId', 'etablissementId'],
        });
    
    // Invalider uniquement ces clés
    for (const ue of utilisateurEtablissements) {
        const key = `permissions:${ue.utilisateurId}:${ue.etablissementId}`;
        await redisService.delete(key);
        this.userPermissionCache.delete(`${ue.utilisateurId}:${ue.etablissementId}`);
    }
    
    logger.info(`🔐 Cache invalidé pour ${utilisateurEtablissements.length} utilisateurs (rôle ${roleId})`);
}
```

### 3. Batch Loading des Permissions

```typescript
// Charger les permissions de plusieurs rôles en une seule requête
async loadPermissionsForRoles(roleIds: string[]): Promise<Map<string, Set<string>>> {
    const rolePermissions = await AppDataSource
        .getRepository(Role)
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.permissions', 'p')
        .where('r.id IN (:...roleIds)', { roleIds })
        .andWhere('p.actif = true')
        .getMany();
    
    const permissionsMap = new Map<string, Set<string>>();
    
    for (const role of rolePermissions) {
        const perms = new Set<string>();
        for (const perm of role.permissions || []) {
            perms.add(perm.code);
        }
        permissionsMap.set(role.id, perms);
    }
    
    return permissionsMap;
}
```

---

## 🚨 Alertes à Configurer

### 1. Temps de Réponse > 500ms

```typescript
// Middleware de monitoring
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        if (duration > 500 && req.path.includes('/api/rbac')) {
            logger.warn(`⚠️ Requête RBAC lente: ${req.path} (${duration}ms)`);
        }
    });
    
    next();
});
```

### 2. Cache Hit Ratio < 80%

```typescript
// Vérification toutes les 10 minutes
setInterval(() => {
    const stats = permissionResolverService.getCacheStats();
    
    if (stats.userCacheSize === 0) {
        logger.warn('⚠️ Cache in-memory vide, vérifier le préchargement');
    }
    
    if (stats.globalCacheSize === 0) {
        logger.error('❌ Cache global des permissions vide, recharger immédiatement');
        permissionResolverService.refreshGlobalPermissions();
    }
}, 10 * 60 * 1000);
```

### 3. Utilisateurs sans Rôle Actif

```sql
-- Cron job quotidien
SELECT COUNT(*) as utilisateurs_sans_role
FROM utilisateurs u
WHERE u.actif = true
  AND NOT EXISTS (
      SELECT 1 
      FROM utilisateur_etablissements ue 
      WHERE ue.utilisateur_id = u.id 
        AND ue.actif = true
  );
```

**Alerte si > 0** : Envoyer email à l'admin

---

## 📈 Dashboard de Monitoring

### Métriques à Afficher

1. **Temps de résolution moyen** (graphique temps réel)
2. **Cache hit ratio** (gauge 0-100%)
3. **Nombre de résolutions/seconde** (compteur)
4. **Erreurs de résolution** (compteur d'erreurs)
5. **Taille du cache Redis** (gauge MB)
6. **Utilisateurs sans rôle** (compteur d'alerte)

### Endpoints de Monitoring

```typescript
// GET /api/rbac/monitoring/stats
router.get('/monitoring/stats', requirePermission('admin:manage'), async (req, res) => {
    const cacheStats = permissionResolverService.getCacheStats();
    
    res.json({
        success: true,
        data: {
            cache: cacheStats,
            redis: await redisService.getInfo(),
            database: {
                totalRoles: await Role.count(),
                totalPermissions: await Permission.count(),
                totalMappings: await AppDataSource
                    .getRepository('RolePermissions')
                    .count(),
                totalUtilisateurEtablissements: await UtilisateurEtablissement.count({
                    where: { actif: true },
                }),
            },
        },
    });
});
```

---

## 🔧 Dépannage

### Problème : Temps de résolution > 100ms

**Diagnostic** :
```sql
EXPLAIN ANALYZE
SELECT * FROM utilisateur_etablissements
WHERE utilisateur_id = ? AND etablissement_id = ? AND actif = true;
```

**Solutions** :
1. Vérifier que l'index composite existe
2. Exécuter `ANALYZE utilisateur_etablissements`
3. Vérifier la fragmentation : `SELECT pg_relation_size('utilisateur_etablissements');`

### Problème : Cache hit ratio < 50%

**Diagnostic** :
```bash
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
```

**Solutions** :
1. Augmenter le TTL (5 min → 10 min)
2. Précharger les utilisateurs actifs
3. Vérifier que l'invalidation n'est pas trop agressive

### Problème : Erreurs 403 inattendues

**Diagnostic** :
```sql
-- Vérifier le rôle de l'utilisateur
SELECT ue.*, r.code, r.libelle
FROM utilisateur_etablissements ue
JOIN roles r ON ue.role_id = r.id
WHERE ue.utilisateur_id = ?
  AND ue.etablissement_id = ?
  AND ue.actif = true;
```

**Solutions** :
1. Vérifier que l'utilisateur a bien un rôle actif
2. Invalider le cache manuellement
3. Vérifier les permissions du rôle

---

## 📚 Ressources

- **Documentation RBAC** : `MIGRATION-RBAC-v3-MULTI-TENANT-STRICT.md`
- **Script de migration** : `database/migrations/migrate-rbac-v3.sql`
- **Service principal** : `backend/src/modules/rbac/services/permission-resolver.service.ts`
- **Entité** : `backend/src/modules/auth/entities/utilisateur-etablissement.entity.ts`

---

**Guide créé le** : 21 juin 2026  
**Par** : franck arlos chendjou  
**Version** : 1.0.0
