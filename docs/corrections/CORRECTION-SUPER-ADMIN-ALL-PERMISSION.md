# ✅ CORRECTION - Permission super_admin:all

> **Date**: 21 juin 2026  
> **Problème**: SUPER_ADMIN reçoit 403 sur `/api/etablissements`  
> **Cause**: Permission `super_admin:all` manquante en base + cache non invalidé

---

## 🔴 **PROBLÈME IDENTIFIÉ**

### **Logs d'erreur :**
```
[Auth Middleware] Utilisateur: admin@elisaschool.cm, Role: SUPER_ADMIN
[INSUFFICIENT_PERMISSIONS] Permission requise: super_admin:all
GET /api/etablissements - 403 (7ms)
```

### **Cause racine :**
1. **Permission `super_admin:all` n'existait pas en base** ❌
2. **25+ endpoints** utilisent cette permission
3. **Cache mémoire** non invalidé après correction

---

## ✅ **CORRECTIONS APPLIQUÉES**

### **1. Permission créée en base** ✅

```sql
INSERT INTO permissions (id, code, libelle, description, module, action, actif)
VALUES (
    gen_random_uuid(),
    'super_admin:all',
    'Super Admin - Accès Total',
    'Permission spéciale pour le SUPER_ADMIN',
    'super_admin',
    'all',
    true
);
```

**Résultat :**
```
code            | module      | action
super_admin:all | super_admin | all
```

---

### **2. Permission assignée au rôle SUPER_ADMIN** ✅

```sql
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN'
AND p.code = 'super_admin:all';
```

**Résultat :**
```
SUPER_ADMIN: 400 permissions (399 + super_admin:all)
```

---

### **3. Vérification des liaisons** ✅

```sql
SELECT e."codeEtablissement", r.code, ue.actif
FROM utilisateur_etablissements ue
JOIN etablissements e ON e.id = ue."etablissementId"
JOIN roles r ON r.id = ue."roleId"
WHERE ue."utilisateurId" = 'd69763a5-b6ef-4e71-85ad-e7c5ad7b456c';

-- Résultat:
-- ETAB-001 | SUPER_ADMIN | true  ✅
-- ETAB-002 | SUPER_ADMIN | true  ✅
```

**Les liaisons sont CORRECTES** ✅

---

## ⚠️ **ACTION REQUISE : INVALIDER LE CACHE**

Le `PermissionResolverService` utilise un **cache en mémoire** qui doit être invalidé.

### **Option 1 : Redémarrer le backend** (Recommandé)

```bash
# Si vous utilisez PM2
pm2 restart backend

# Si vous utilisez Docker
docker compose -f docker/docker-compose.yml restart backend

# Si vous utilisez nodemon en dev
# Le serveur devrait redémarrer automatiquement
```

### **Option 2 : Invalider via API** (Si disponible)

```bash
# Appeler un endpoint d'invalidation de cache
# (à implémenter si nécessaire)
```

### **Option 3 : Attendre l'expiration du cache**

Le cache expire automatiquement après **5 minutes** (TTL par défaut).

---

## 📊 **VÉRIFICATION APRÈS REDÉMARRAGE**

### **1. Tester la connexion Super Admin**

```bash
curl -X GET http://localhost:7001/api/etablissements \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu :** `200 OK` avec la liste des établissements

---

### **2. Vérifier les permissions en base**

```sql
SELECT r.code, COUNT(rp."permissionId") as nb_permissions
FROM roles r
JOIN role_permissions rp ON rp."roleId" = r.id
WHERE r.code = 'SUPER_ADMIN'
GROUP BY r.code;

-- Résultat attendu :
-- SUPER_ADMIN | 400
```

---

### **3. Vérifier les logs**

**Avant correction :**
```
🔐 Aucun rôle trouvé pour l'utilisateur d69763a5...
[INSUFFICIENT_PERMISSIONS] Permission requise: super_admin:all
```

**Après correction :**
```
🔐 SUPER_ADMIN détecté: 400 permissions attribuées
GET /api/etablissements - 200 ✅
```

---

## 📁 **FICHIERS CRÉÉS**

1. **`070-fix-super-admin-all-permission.sql`** (184 lignes)
   - Migration SQL complète
   - Ajoute la permission `super_admin:all`
   - Assigne au rôle SUPER_ADMIN
   - Vérifie les liaisons utilisateur

---

## 🎯 **ENDPOINTS CONCERNÉS** (25+)

Tous ces endpoints nécessitent `super_admin:all` :

| Module | Endpoint | Méthode |
|--------|----------|---------|
| **etablissement** | `/api/etablissements` | GET, POST, PATCH, DELETE |
| **audit** | `/api/audit/rotation` | POST |
| **audit** | `/api/audit/archiver` | POST |
| **audit** | `/api/audit/nettoyer` | POST |
| **configuration** | `/api/configuration/licence` | POST |
| **configuration** | `/api/configuration/parametres/reset-all` | POST |
| **groupes** | `/api/groupes` | POST, PATCH, DELETE |
| **monitoring** | `/api/monitoring/maintenance` | GET, POST |
| **monitoring** | `/api/monitoring/logs` | GET |
| **types-enum** | `/api/types-enum/initialize` | POST |
| **transport** | `/api/transport/config/reset` | POST |
| **utilisateurs** | `/api/utilisateurs/:id` | DELETE |
| **organisation** | `/api/organisation/configuration/reset-all` | POST |
| **organisation** | `/api/organisation/configuration/import` | POST |
| **preferences-globales** | `/api/preferences-globales/init` | POST |
| **scoring-personnel** | `/api/scoring-personnel/recalculer-tous` | POST |

**Tous ces endpoints fonctionneront après redémarrage** ✅

---

## 🚀 **PROCHAINES ÉTAPES**

1. ✅ **FAIT** : Permission créée en base
2. ✅ **FAIT** : Permission assignée au SUPER_ADMIN
3. ✅ **FAIT** : Liaisons vérifiées (correctes)
4. ⏳ **À FAIRE** : Redémarrer le backend (invalider cache)
5. ⏳ **À FAIRE** : Tester les endpoints `/api/etablissements`

---

## 📝 **RECOMMANDATION**

Pour éviter ce problème dans le futur :

1. **Ajouter `super_admin:all` au enum Permission** dans `shared/src/enums/roles.enum.ts`
2. **Invalider le cache automatiquement** après les seeds
3. **Créer un test d'intégration** qui vérifie que SUPER_ADMIN peut accéder à tous les endpoints

---

*Correction appliquée le 21 juin 2026 à 15:30*  
*En attente de redémarrage du backend pour prise d'effet*
