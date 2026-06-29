# Implémentation du Module Sondages - eLISAschool

## Vue d'ensemble

Le module **Sondages** a été complètement implémenté en s'inspirant du projet process. Ce module permet de créer, gérer et analyser des sondages au sein de l'établissement scolaire.

## Architecture Implémentée

### Structure du Module

```
backend/src/modules/sondages/
├── entities/
│   ├── sondage.entity.ts          # 4 entités TypeORM
│   └── index.ts
├── dto/
│   ├── sondage.dto.ts             # 9 schémas Zod
│   └── index.ts
├── services/
│   ├── sondage.service.ts         # Logique métier complète (520 lignes)
│   └── index.ts
├── controllers/
│   ├── sondages.controller.ts     # 18 routes API
│   └── index.ts
└── index.ts                       # Barrel export
```

### Entités Créées

1. **TemplateSondage** - Templates réutilisables
   - Visibilité : privé, établissement, système
   - Suivi d'utilisation
   - Templates par défaut inclus

2. **Sondage** - Sondage envoyé
   - Statuts : brouillon, actif, fermé, programmé, expiré
   - Support anonyme et choix multiple
   - Programmation temporelle
   - Analyses avec permissions granulaires

3. **SondageOption** - Options de réponse
   - Ordre configurable
   - Compteur de votes

4. **Vote** - Vote utilisateur
   - Contrainte d'unicité (1 vote par utilisateur/sondage)
   - Support anonyme (utilisateurId nullable)

### API Endpoints

#### Templates (4 routes)
- `GET /api/sondages/templates` - Lister les templates visibles
- `POST /api/sondages/templates` - Créer un template
- `PATCH /api/sondages/templates/:id` - Modifier un template
- `DELETE /api/sondages/templates/:id` - Supprimer un template

#### Sondages (10 routes)
- `POST /api/sondages/bulk` - Créer un sondage en masse
- `POST /api/sondages/programmer` - Programmer un sondage
- `GET /api/sondages/programmes` - Lister les sondages programmés
- `DELETE /api/sondages/programmes/:id` - Annuler un sondage programmé
- `POST /api/sondages/:id/vote` - Voter à un sondage
- `GET /api/sondages/:id` - Détails d'un sondage
- `GET /api/sondages/` - Lister les sondages (paginé)
- `PATCH /api/sondages/:id` - Modifier un sondage
- `POST /api/sondages/:id/fermer` - Fermer un sondage

#### Analyses (3 routes)
- `GET /api/sondages/:id/analyses` - Voir les statistiques
- `PATCH /api/sondages/:id/analyses/permissions` - Configurer les permissions
- `GET /api/sondages/:id/analyses/export` - Exporter en CSV

#### Utilitaires (1 route)
- `GET /api/sondages/utilisateurs/filtres` - Rechercher des utilisateurs

### Permissions RBAC

Nouvelles permissions ajoutées dans `shared/src/enums/roles.enum.ts` :

```typescript
SONDAGES_CREATE = 'sondages:create',
SONDAGES_VOTE = 'sondages:vote',
SONDAGES_ANALYZE = 'sondages:analyze',
SONDAGES_VIEW = 'sondages:view',
SONDAGES_EDIT = 'sondages:edit',
SONDAGES_DELETE = 'sondages:delete',
SONDAGES_TEMPLATES_MANAGE = 'sondages:templates:manage',
```

### Migration SQL

Fichier : `backend/database/migrations/041-module-sondages.sql`

- 4 tables avec index optimisés
- 4 paramètres système
- 3 templates par défaut
- Contraintes d'intégrité référentielle

## Fonctionnalités Clés

### 1. Templates Réutilisables
- Création de templates avec options prédéfinies
- Visibilité configurable (privé/établissement/système)
- Suivi du nombre d'utilisations
- 3 templates système inclus :
  - Satisfaction générale
  - Évaluation des services
  - Suggestions d'amélioration

### 2. Création en Masse
- Jusqu'à 500 destinataires par sondage
- Mode individuel ou conversation de groupe
- Validation Zod complète
- Transactionnel pour l'intégrité des données

### 3. Programmation Temporelle
- Programmation d'envoi différé
- Activation automatique par cron (méthode `activerSondagesProgrammes`)
- Annulation possible avant envoi

### 4. Vote Sécurisé
- Contrainte d'unicité : 1 vote par utilisateur
- Support du choix multiple (configurable)
- Mode anonyme (utilisateurId nullable)
- Compteurs automatiques

### 5. Analyses Statistiques
- Taux de participation
- Répartition par option avec pourcentages
- Permissions granulaires :
  - `auteur_seul` : seul l'auteur voit les résultats
  - `tous_participants` : tous les votants voient
  - `personnalise` : liste d'utilisateurs autorisés
- Export CSV

### 6. Durée Limitée
- Format flexible : `3j`, `5h`, `30m`
- Expiration automatique
- Fermeture manuelle

## Intégration Système

### Module Registry

Ajouté dans `shared/src/config/config.registry.ts` :

```typescript
[ModuleName.SONDAGES]: {
    name: ModuleName.SONDAGES,
    label: 'Sondages',
    icon: 'CircleHelp',
    basePath: '/sondages',
    defaultActive: true,
    premium: false,
    dependencies: [ModuleName.AUTH, ModuleName.NOTIFICATIONS],
    // ...
}
```

### Middleware de Protection

Activé dans `backend/src/app.ts` :

```typescript
app.use('/api/sondages', requireModuleActive('sondages'), sondagesController);
```

### Multi-Tenancy

Toutes les requêtes sont isolées par `etablissementId` :
- Templates : filtrés par établissement + visibilité
- Sondages : création et consultation liées à l'établissement
- Votes : traçabilité multi-établissement

## Sécurité

- **Authentification** : Toutes les routes protégées par `authMiddleware`
- **Autorisation** : Validation RBAC via permissions
- **Validation** : Schémas Zod pour toutes les entrées
- **Transactions** : Opérations critiques atomiques
- **Isolation** : Multi-tenant strict par établissement

## Performance

- **Index optimisés** : 12 index sur les 4 tables
- **Pagination** : Toutes les listes sont paginées (max 100)
- **Lazy loading** : Relations chargées sur demande
- **Compteurs dénormalisés** : `nombreVotes` sur Sondage et SondageOption

## Templates par Défaut

3 templates système sont insérés automatiquement :

1. **Satisfaction générale**
   - 5 options (Très satisfait → Très insatisfait)
   - Non anonyme, choix unique

2. **Évaluation des services**
   - 4 options (Excellent → À améliorer)
   - Anonyme, choix unique

3. **Suggestions d'amélioration**
   - 4 catégories (Infrastructure, Communication, Services, Autre)
   - Anonyme, choix multiple

## Prochaines Étapes (Optionnel)

1. ~~**Cron Job**~~ : ✅ Ajouté un cron pour activer automatiquement les sondages programmés
2. ~~**Notifications**~~ : ✅ Intégrer l'envoi de notifications lors de la création d'un sondage
3. ~~**WebSocket**~~ : ✅ Temps réel pour les votes et résultats
4. ~~**Export PDF**~~ : ✅ Analyses visuelles avec graphiques HTML
5. ~~**Sondages récurrents**~~ : ✅ Planification périodique automatique

## Déploiement

### Option 1: Script automatisé (Recommandé)

```bash
# Exécuter le script de déploiement complet
chmod +x scripts/deploy-sondages.sh
./scripts/deploy-sondages.sh
```

### Option 2: Déploiement manuel

```bash
# 1. Exécuter les migrations
docker exec -i elisaschool-db psql -U franckylab -d elisaschool < backend/database/migrations/041-module-sondages.sql
docker exec -i elisaschool-db psql -U franckylab -d elisaschool < backend/database/migrations/042-sondages-recurrents.sql

# 2. Redémarrer le backend
docker compose restart backend

# 3. Vérifier l'API
curl http://localhost:3000/api/sondages/templates
```

### Activation des Cron Jobs

Pour activer les tâches planifiées (recommandé en production) :

```bash
# Dans .env ou docker-compose.yml
ENABLE_CRON_JOBS=true
# ou
NODE_ENV=production
```

**Cron jobs actifs** :
- **Toutes les 5 min** : Activation des sondages programmés
- **Toutes les heures** : Fermeture automatique des sondages expirés
- **Tous les jours à 1h** : Création des occurrences récurrentes
- **Tous les jours à 3h** : Nettoyage des anciens votes

## Validation

✅ Compilation TypeScript sans erreur
✅ Entités TypeORM complètes (4 entités + récurrence)
✅ DTOs Zod avec validation (9 schémas)
✅ Service métier complet (520+ lignes)
✅ Controller Express avec 18 routes
✅ Migrations SQL avec seeds (2 fichiers)
✅ Registre shared mis à jour
✅ Permissions RBAC ajoutées (7 permissions)
✅ Module enregistré dans app.ts
✅ Multi-tenancy implémenté
✅ Cron jobs configurés (4 tâches)
✅ Notifications intégrées (non bloquantes)
✅ WebSocket pour temps réel
✅ Export PDF avec graphiques HTML
✅ Sondages récurrents supportés
✅ Script de déploiement automatisé

---

**Version**: 1.0.0  
**Date**: Juin 2026  
**Auteur**: franck arlos chendjou  
**Inspiré de**: Projet process - Module messagerie/sondages
