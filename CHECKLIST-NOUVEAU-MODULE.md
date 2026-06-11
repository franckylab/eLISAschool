# ✅ Checklist - Déploiement d'un Nouveau Module

Utiliser cette checklist pour chaque nouveau module développé sur eLISAschool.

---

## 📋 Phase 1 : Planification

- [ ] Définir le nom du module (kebab-case)
- [ ] Identifier les entités nécessaires
- [ ] Lister les endpoints API requis
- [ ] Définir les rôles et permissions
- [ ] Identifier les dépendances avec d'autres modules
- [ ] Créer la documentation avec le template
- [ ] Estimer la complexité et le temps

---

## 🔧 Phase 2 : Backend

### Structure
- [ ] Créer le dossier `backend/src/modules/[module-name]/`
- [ ] Créer les sous-dossiers : `controllers/`, `services/`, `entities/`, `dto/`
- [ ] Créer les fichiers `index.ts` (barrel exports)

### Entités
- [ ] Créer les entités TypeORM avec `@Entity()`
- [ ] Définir les colonnes avec types appropriés
- [ ] Ajouter les relations (ManyToOne, OneToMany, etc.)
- [ ] Ajouter les index stratégiques
- [ ] Inclure `createdAt` et `updatedAt`
- [ ] Utiliser UUID pour les clés primaires

### DTOs
- [ ] Créer les schémas Zod (`createXxxSchema`, `updateXxxSchema`)
- [ ] Définir les validations (min, max, optional, etc.)
- [ ] Inférer les types TypeScript avec `z.infer`
- [ ] Messages d'erreur en français

### Services
- [ ] Implémenter les méthodes CRUD
- [ ] Vérifier l'unicité avant création
- [ ] Gérer les erreurs avec `AppError`
- [ ] Logger les opérations critiques
- [ ] Exporter un singleton
- [ ] Filtrer par `etablissementId` (multi-tenant)

### Controllers
- [ ] Définir les routes avec méthodes HTTP appropriées
- [ ] Appliquer `authMiddleware` sur chaque route
- [ ] Appliquer `requireRoles()` avec rôles appropriés
- [ ] Valider les body avec `validate(schema, req.body)`
- [ ] Wrappers dans `try/catch` avec `next(error)`
- [ ] Retourner les bons codes HTTP (200, 201, etc.)

### Enregistrement
- [ ] Ajouter export dans `backend/src/modules/index.ts`
- [ ] Monter le controller dans `backend/src/app.ts`
- [ ] Ajouter le module dans `shared/src/enums/modules.enum.ts`

---

## 🎨 Phase 3 : Frontend

### Structure
- [ ] Créer le dossier `frontend/src/features/[module-name]/`
- [ ] Créer les sous-dossiers : `components/`, `hooks/`, `types/`, `utils/`
- [ ] Créer le dossier de traductions `frontend/src/locales/fr/`

### Types & Validation
- [ ] Définir les interfaces TypeScript
- [ ] Créer les schémas de validation Zod
- [ ] Aligner les types avec le backend

### Hooks
- [ ] Créer le hook de liste (`use[Entities]`)
- [ ] Créer le hook de détail (`use[Entity]`)
- [ ] Créer les hooks CRUD (`useCreate[Entity]`, `useUpdate[Entity]`, etc.)
- [ ] Configurer TanStack Query (queryKey, queryFn)
- [ ] Gérer l'invalidation du cache

### Composants
- [ ] Créer la page principale (`[module]-page.tsx`)
- [ ] Implémenter le tableau avec DataTable
- [ ] Ajouter la pagination
- [ ] Ajouter les filtres
- [ ] Créer le formulaire (`[entity]-form.tsx`)
- [ ] Créer la page détail (`[entity]-detail-page.tsx`)
- [ ] Ajouter les messages d'erreur en français

### Routes
- [ ] Créer la route TanStack Router
- [ ] Tester la navigation
- [ ] Ajouter au menu latéral

### Traductions
- [ ] Créer le fichier `frontend/src/locales/fr/[module].json`
- [ ] Traduire toutes les chaînes
- [ ] Utiliser les clés dans les composants

---

## 🔐 Phase 4 : Sécurité

### Permissions
- [ ] Définir les permissions dans `roles.enum.ts`
- [ ] Attribuer les permissions aux rôles
- [ ] Tester chaque rôle (ADMIN, PERSONNEL, etc.)

### Multi-Tenancy
- [ ] Vérifier le filtrage par `etablissementId` sur toutes les requêtes
- [ ] Tester l'isolation des données
- [ ] Vérifier les jointures

### Validation
- [ ] Validation frontend avec Zod
- [ ] Validation backend avec Zod
- [ ] Tester les cas limites

---

## 🧪 Phase 5 : Tests

### Tests Backend
- [ ] Tester la création
- [ ] Tester la lecture (liste et détail)
- [ ] Tester la modification
- [ ] Tester la suppression
- [ ] Tester les permissions
- [ ] Tester le multi-tenant
- [ ] Tester les erreurs

### Tests Frontend
- [ ] Tester la page liste
- [ ] Tester les filtres
- [ ] Tester le formulaire (création)
- [ ] Tester le formulaire (édition)
- [ ] Tester la page détail
- [ ] Tester la navigation
- [ ] Tester le responsive
- [ ] Tester les permissions

### Tests d'Intégration
- [ ] Flux complet (créer → lire → modifier → supprimer)
- [ ] Export CSV
- [ ] Import CSV (si applicable)
- [ ] Performance avec données volumineuses

---

## 📚 Phase 6 : Documentation

- [ ] Remplir le template de documentation du module
- [ ] Créer le guide de test
- [ ] Mettre à jour l'INDEX.md
- [ ] Documenter les endpoints API (Swagger)
- [ ] Ajouter des exemples de requêtes/réponses
- [ ] Documenter les cas d'erreur

---

## 🚀 Phase 7 : Déploiement

### Préparation
- [ ] Exécuter `npm run lint` (frontend + backend)
- [ ] Exécuter `npm run type-check` (frontend + backend)
- [ ] Vérifier qu'il n'y a aucune erreur
- [ ] Tester la compilation (`npm run build`)

### Migration
- [ ] Générer la migration TypeORM si nécessaire
- [ ] Tester la migration en local
- [ ] Créer le script de déploiement
- [ ] Documenter les commandes de déploiement

### Vérification
- [ ] Déployer en environnement de test
- [ ] Exécuter tous les tests
- [ ] Vérifier les logs
- [ ] Tester les performances
- [ ] Vérifier le responsive

### Mise en Production
- [ ] Backup de la base de données
- [ ] Appliquer les migrations
- [ ] Déployer le backend
- [ ] Déployer le frontend
- [ ] Vérifier en production
- [ ] Monitorer les erreurs

---

## ✅ Phase 8 : Post-Déploiement

- [ ] Créer un rapport de déploiement
- [ ] Mettre à jour la documentation
- [ ] Former les utilisateurs (si nécessaire)
- [ ] Collecter les retours
- [ ] Planifier les améliorations
- [ ] Créer des tickets pour les bugs identifiés

---

## 📝 Notes

### Anti-patterns à Éviter

- ❌ Ne pas bypasser le `errorHandler` global
- ❌ Ne pas dupliquer la logique métier dans le controller
- ❌ Ne pas utiliser `any` (sauf pour le helper validate)
- ❌ Ne pas oublier le multi-tenant
- ❌ Ne pas négliger les permissions RBAC
- ❌ Ne pas mélanger majuscules/minuscules dans les imports
- ❌ Ne pas oublier de nettoyer le cache Vite

### Bonnes Pratiques

- ✅ Toujours utiliser les barrel exports
- ✅ Toujours logger les opérations critiques
- ✅ Toujours invalider le cache après modification
- ✅ Toujours tester avec différents rôles
- ✅ Toujours documenter au fur et à mesure
- ✅ Toujours utiliser les template literals
- ✅ Toujours préférer `const` à `let`

---

## 🆘 En Cas de Problème

1. **Vérifier les logs** : `tail -f backend/logs/app.log`
2. **Console navigateur** : F12
3. **Script de vérification** : `./scripts/verify-setup.sh`
4. **Documentation** : [`INDEX.md`](INDEX.md)
5. **Aide-mémoire** : [`CHEATSHEET.md`](CHEATSHEET.md)

---

**Utiliser cette checklist pour chaque nouveau module !** ✅

---

*Template v1.0 - 11 juin 2026*  
*eLISAschool - Système de Gestion Scolaire*
