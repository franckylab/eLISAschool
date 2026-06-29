# Guide de Déploiement - Refonte Configuration Multi-Tenant

## 📋 Prérequis

- ✅ Accès SSH au serveur de staging
- ✅ Backup complet de la base de données
- ✅ Node.js 20+ installé
- ✅ Droits admin sur la base PostgreSQL

---

## 🚀 Procédure de Déploiement

### Étape 1: Backup Base de Données

```bash
# Sur le serveur de production
pg_dump -U postgres elisaschool > /tmp/elisaschool-backup-$(date +%Y%m%d-%H%M%S).sql

# Vérifier le backup
ls -lh /tmp/elisaschool-backup-*.sql
```

### Étape 2: Déployer le Code

```bash
# Sur le serveur de staging
cd /var/www/elisaschool
git pull origin staging

# Installer les dépendances
npm install
```

### Étape 3: Compiler TypeScript

```bash
# Backend
cd backend
npm run build

# Vérifier la compilation
echo $?  # Doit retourner 0
```

### Étape 4: Exécuter les Migrations

```bash
# Migration 1: ConfigurationApp → ParametreSysteme
npm run ts-node scripts/migrate-config-app-to-parametres.ts

# Migration 2: EtablissementConfig → ParametreSysteme
npm run ts-node scripts/migrate-etablissement-config-to-parametres.ts
```

**Vérifier la sortie** :
```
📊 Statistiques:
   - Paramètres migrés: XX
   - Paramètres ignorés: XX
   - Conflits évités: XX
```

### Étape 5: Vérifier l'Intégrité

```bash
# Vérifier que ConfigurationApp n'est plus utilisé
npm run ts-node scripts/verify-configuration-integrity.ts
```

**Résultat attendu** :
```
✅ Intégrité vérifiée
✅ Aucun conflit détecté
```

### Étape 6: Exécuter les Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Vérifier le coverage
npm run test:coverage
```

**Résultat attendu** :
```
✅ 15 tests passés
✅ Coverage: 85%
```

### Étape 7: Redémarrer le Serveur

```bash
# Sur staging
pm2 restart elisaschool-backend

# Vérifier le statut
pm2 status
pm2 logs elisaschool-backend --lines 50
```

### Étape 8: Tests Manuels

```bash
# 1. Tester le login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecole.fr","motDePasse":"password123"}'

# Vérifier que la réponse contient:
# - utilisateur.etablissementActif
# - utilisateur.etablissements[]

# 2. Tester la configuration publique
curl http://localhost:3000/api/configuration

# 3. Tester les paramètres établissement
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/configuration/parametres/etablissement
```

### Étape 9: Déploiement Production

```bash
# Si tout est OK sur staging
git push origin staging:main

# Sur production
cd /var/www/elisaschool
git pull origin main
npm install
npm run build

# Exécuter les migrations
npm run ts-node scripts/migrate-config-app-to-parametres.ts
npm run ts-node scripts/migrate-etablissement-config-to-parametres.ts

# Redémarrer
pm2 restart elisaschool-backend
```

---

## 🔍 Vérifications Post-Déploiement

### 1. Logs Backend

```bash
pm2 logs elisaschool-backend --lines 100 | grep -E "(ERROR|WARN|INFO)"
```

**Vérifier** :
- ✅ Pas d'erreurs de compilation
- ✅ Pas d'erreurs de migration
- ✅ Logs normaux de démarrage

### 2. Tests API

```bash
# Test login multi-établissement
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@elisa.fr","motDePasse":"password123"}'

# Test switch établissement
curl -X POST http://localhost:3000/api/auth/switch-etablissement \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId":"uuid-etablissement"}'
```

### 3. Frontend

- [ ] Page de login fonctionne
- [ ] Sélecteur d'établissement visible (superadmin)
- [ ] Navigation fonctionne
- [ ] Configuration affichée correctement
- [ ] Modules activés/désactivés correctement

---

## ⚠️ Rollback (Si Problème)

### Rollback Code

```bash
# Sur production
cd /var/www/elisaschool
git checkout HEAD~1  # Retour au commit précédent
npm install
npm run build
pm2 restart elisaschool-backend
```

### Rollback Base de Données

```bash
# Restaurer le backup
psql -U postgres elisaschool < /tmp/elisaschool-backup-YYYYMMDD-HHMMSS.sql

# Redémarrer
pm2 restart elisaschool-backend
```

---

## 📊 Métriques à Surveiller

### Performance

- **Temps de réponse /api/configuration** : < 100ms
- **Temps de réponse isModuleActive()** : < 50ms
- **Cache hit ratio** : > 80%

### Fonctionnel

- **Login succès rate** : > 99%
- **Switch établissement succès** : > 99%
- **Erreurs 500** : < 0.1%

### Base de Données

- **parametres count** : Vérifier augmentation normale
- **etablissement_config taille** : Vérifier réduction
- **configuration_app** : Doit être vide/non utilisé

---

## ✅ Checklist Finale

- [ ] Backup effectué
- [ ] Code déployé sur staging
- [ ] Migrations exécutées avec succès
- [ ] Tests passés (> 85% coverage)
- [ ] Tests manuels OK
- [ ] Monitoring configuré
- [ ] Rollback testé
- [ ] Déploiement production
- [ ] Documentation mise à jour

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** : `pm2 logs elisaschool-backend`
2. **Vérifier la DB** : `psql -U postgres -d elisaschool`
3. **Contacter l'équipe** : Voir `REFACTORISATION-CONFIGURATION-SYNTHESE.md`

---

## 📝 Notes

- La migration est **idempotente** (peut être exécutée plusieurs fois)
- Les données ne sont **jamais supprimées**, seulement migrées
- Le système de fallback garantit la **rétrocompatibilité**
- Le cache se **reconstruit automatiquement** après invalidation
