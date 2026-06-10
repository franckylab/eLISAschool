# Module Organisation - eLISAschool

> **Version**: 1.0.0  
> **Auteur**: franck arlos chendjou  
> **Date**: Juin 2026

## Présentation

Le module **Organisation** permet de structurer un établissement scolaire en unités organisationnelles hiérarchiques (départements, services, pôles, etc.), de définir des postes/fonctions, et de gérer les relations hiérarchiques entre membres du personnel.

Inspiré du projet "process" (système de gestion commerciale), ce module est **entièrement adapté** au contexte scolaire africain/camerounais d'eLISAschool.

---

## Architecture

### Entités TypeORM (4)

| Entité | Table | Rôle |
|--------|-------|------|
| **Organisation** | `organisations` | Structure de haut niveau (établissement, groupe scolaire) |
| **UniteOrganisationnelle** | `unites_organisationnelles` | Unités structurelles (départements, services, pôles) |
| **Poste** | `postes` | Fonctions/positions dans l'organigramme |
| **HierarchiePersonnel** | `hierarchie_personnel` | Relations de subordination/supervision |

### Enums

#### TypeOrganisation
- `ETABLISSEMENT_SCOLAIRE`
- `GROUPE_SCOLAIRE`
- `ENTREPRISE`
- `ASSOCIATION`

#### TypeUniteOrganisationnelle
- `DIRECTION`, `DEPARTEMENT`, `SERVICE`, `POLE`
- `FILIERE`, `CYCLE`, `SECTION`
- `COMMISSION`, `EQUIPE`, `AUTRE`

#### TypePoste
- `DIRECTION`, `ENSEIGNANT`, `ADMINISTRATIF`
- `TECHNIQUE`, `SERVICE`, `STAGE`, `TEMPORAIRE`, `AUTRE`

#### NiveauResponsabilite
- `DIRECTION_GENERALE`, `DIRECTION_ADJOINTE`
- `RESPONSABLE`, `COORDINATEUR`, `SUPERVISEUR`
- `EXECUTANT`, `STAGIAIRE`

#### TypeRelationHierarchique
- `SUPERVISE_DIRECT`, `SUPERVISE_INDIRECT`
- `RATTACHEMENT_FONCTIONNEL`, `COLLABORATION`
- `REPLACEMENT`, `INTERIM`

---

## Fonctionnalités

### 1. Gestion des Organisations
- CRUD complet avec unicité du code
- Multi-tenancy via `etablissementId`
- Métadonnées JSON flexibles

### 2. Gestion des Unités Organisationnelles
- **Arborescence hiérarchique** (parent/enfant)
- Codes uniques par organisation
- Ordonnancement personnalisé
- Assignation de responsables

### 3. Construction d'Arborescence
- Algorithme récursif pour construire l'arbre complet
- Chemin hiérarchique (de la racine à une unité)
- Support des niveaux imbriqués illimités

### 4. Gestion des Postes
- CRUD avec validation du code unique
- **Assignation/libération d'occupants**
- Suivi des postes vacants vs occupés
- Compétences requises et missions (JSON)
- Superviseur hiérarchique

### 5. Hiérarchie Personnel
- **Détection de cycles** (empêche les boucles hiérarchiques)
- Relations de supervision directe/indirecte
- Rattachement fonctionnel
- Gestion d'intérim et remplacement
- Dates de validité (historique)

### 6. Statistiques et Analyses
- Taux d'occupation des postes
- Répartition par type d'unité
- Organigramme complet (arborescence + postes)

---

## API REST (24 routes)

### Organisations

```bash
# Lister toutes les organisations
GET    /api/organisation/organisations

# Créer une organisation (ADMIN/SUPER_ADMIN)
POST   /api/organisation/organisations

# Obtenir une organisation
GET    /api/organisation/organisations/:id

# Modifier une organisation
PATCH  /api/organisation/organisations/:id

# Supprimer une organisation
DELETE /api/organisation/organisations/:id
```

### Unités Organisationnelles

```bash
# Lister les unités avec filtres
GET    /api/organisation/unites?type=DEPARTEMENT&actif=true

# Créer une unité
POST   /api/organisation/unites

# Obtenir une unité (avec enfants et postes)
GET    /api/organisation/unites/:id

# Modifier une unité
PATCH  /api/organisation/unites/:id

# Supprimer une unité (vérifie enfants/postes)
DELETE /api/organisation/unites/:id
```

### Arborescence

```bash
# Construire l'arborescence complète
GET    /api/organisation/arborescence/:organisationId

# Obtenir le chemin hiérarchique d'une unité
GET    /api/organisation/chemin/:uniteId
```

### Postes

```bash
# Lister les postes avec filtres
GET    /api/organisation/postes?statut=VACANT&uniteOrganisationnelleId=xxx

# Créer un poste
POST   /api/organisation/postes

# Obtenir un poste
GET    /api/organisation/postes/:id

# Modifier un poste
PATCH  /api/organisation/postes/:id

# Supprimer un poste
DELETE /api/organisation/postes/:id

# Assigner un occupant
POST   /api/organisation/postes/:id/assigner
# Body: { "occupantId": "uuid", "occupantNom": "Jean Dupont" }

# Libérer un poste
POST   /api/organisation/postes/:id/liberer
```

### Hiérarchie Personnel

```bash
# Lister les relations hiérarchiques
GET    /api/organisation/hierarchie?personnelId=xxx

# Créer une relation hiérarchique
POST   /api/organisation/hierarchie

# Modifier une relation
PATCH  /api/organisation/hierarchie/:id

# Supprimer une relation (soft delete)
DELETE /api/organisation/hierarchie/:id

# Obtenir les supérieurs d'une personne
GET    /api/organisation/hierarchie/superieurs/:personnelId

# Obtenir les subordonnés d'un supérieur
GET    /api/organisation/hierarchie/subordonnes/:superieurId
```

### Statistiques et Organigramme

```bash
# Statistiques d'une organisation
GET    /api/organisation/statistiques/:organisationId

# Organigramme complet (arborescence + postes)
GET    /api/organisation/organigramme/:organisationId
```

---

## Permissions RBAC (16)

| Permission | Code | Description |
|-----------|------|-------------|
| ORGANISATION_VIEW | `organisation:view` | Voir les organisations |
| ORGANISATION_CREATE | `organisation:create` | Créer une organisation |
| ORGANISATION_EDIT | `organisation:edit` | Modifier une organisation |
| ORGANISATION_DELETE | `organisation:delete` | Supprimer une organisation |
| UNITES_VIEW | `unites:view` | Voir les unités |
| UNITES_CREATE | `unites:create` | Créer une unité |
| UNITES_EDIT | `unites:edit` | Modifier une unité |
| UNITES_DELETE | `unites:delete` | Supprimer une unité |
| UNITES_ARBRESCENCE_VIEW | `unites:arborescence:view` | Voir l'arborescence |
| POSTES_VIEW | `postes:view` | Voir les postes |
| POSTES_CREATE | `postes:create` | Créer un poste |
| POSTES_EDIT | `postes:edit` | Modifier un poste |
| POSTES_DELETE | `postes:delete` | Supprimer un poste |
| POSTES_ASSIGNER | `postes:assigner` | Assigner un occupant |
| HIERARCHIE_VIEW | `hierarchie:view` | Voir la hiérarchie |
| HIERARCHIE_CREATE | `hierarchie:create` | Créer une relation hiérarchique |
| HIERARCHIE_EDIT | `hierarchie:edit` | Modifier une relation |
| HIERARCHIE_DELETE | `hierarchie:delete` | Supprimer une relation |
| ORGANIGRAMME_VIEW | `organigramme:view` | Voir l'organigramme |

**Rôles autorisés** : `ADMIN`, `SUPER_ADMIN` (pour les opérations d'écriture)  
**Lecture** : Tous les rôles authentifiés

---

## Exemples d'Utilisation

### Créer une structure organisationnelle complète

```typescript
// 1. Créer l'organisation (faite automatiquement par migration)
const org = await organisationService.createOrganisation({
    nom: 'Lycée Bilingue de Yaoundé',
    type: 'ETABLISSEMENT_SCOLAIRE',
    etablissementId: 'uuid-etablissement',
});

// 2. Créer des départements
const direction = await organisationService.createUnite({
    nom: 'Direction Générale',
    type: 'DIRECTION',
    code: 'DIR-GEN',
    organisationId: org.id,
    ordre: 0,
});

const depPedagogique = await organisationService.createUnite({
    nom: 'Département Pédagogique',
    type: 'DEPARTEMENT',
    code: 'DEP-PED',
    organisationId: org.id,
    ordre: 1,
});

// 3. Créer des sous-unités
const sciences = await organisationService.createUnite({
    nom: 'Service Sciences',
    type: 'SERVICE',
    code: 'SRV-SCI',
    organisationId: org.id,
    parentId: depPedagogique.id, // Sous le département pédagogique
    ordre: 0,
});

// 4. Créer des postes
const posteProviseur = await organisationService.createPoste({
    intitulé: 'Proviseur',
    code: 'POSTE-PROV',
    type: 'DIRECTION',
    niveauResponsabilite: 'DIRECTION_GENERALE',
    uniteOrganisationnelleId: direction.id,
});

const posteProfMaths = await organisationService.createPoste({
    intitulé: 'Professeur de Mathématiques',
    code: 'POSTE-MATH',
    type: 'ENSEIGNANT',
    niveauResponsabilite: 'EXECUTANT',
    uniteOrganisationnelleId: sciences.id,
});

// 5. Assigner des occupants
await organisationService.assignerOccupant(
    posteProviseur.id,
    'uuid-personnel-1',
    'M. Jean Dupont'
);

// 6. Créer des relations hiérarchiques
await organisationService.createHierarchie({
    personnelId: 'uuid-personnel-2', // Professeur
    personnelNom: 'Mme Marie Martin',
    superieurId: 'uuid-personnel-1', // Proviseur
    superieurNom: 'M. Jean Dupont',
    typeRelation: 'SUPERVISE_DIRECT',
    posteId: posteProfMaths.id,
    etablissementId: 'uuid-etablissement',
});

// 7. Obtenir l'organigramme complet
const organigramme = await organisationService.getOrganigramme(org.id);
```

### Construire l'arborescence

```typescript
const arbre = await organisationService.buildArborescence(organisationId);

// Résultat :
// [
//   {
//     id: "...",
//     nom: "Direction Générale",
//     code: "DIR-GEN",
//     enfants: []
//   },
//   {
//     id: "...",
//     nom: "Département Pédagogique",
//     code: "DEP-PED",
//     enfants: [
//       {
//         id: "...",
//         nom: "Service Sciences",
//         code: "SRV-SCI",
//         enfants: []
//       }
//     ]
//   }
// ]
```

### Obtenir les statistiques

```typescript
const stats = await organisationService.getStatistiquesOrganisation(organisationId);

// Résultat :
// {
//   totalUnites: 5,
//   totalPostes: 20,
//   postesActifs: 15,
//   postesVacants: 5,
//   tauxOccupation: "75.00",
//   parType: {
//     DIRECTION: 1,
//     DEPARTEMENT: 2,
//     SERVICE: 2
//   }
// }
```

---

## Déploiement

### 1. Exécuter la migration

```bash
chmod +x scripts/deploy-organisation.sh
./scripts/deploy-organisation.sh
```

### 2. Redémarrer le backend

```bash
docker-compose restart backend
```

### 3. Vérifier les tables

```bash
docker exec -it elisaschool-postgres psql -U elisaschool_user -d elisaschool_db

\dt organisations
\dt unites_organisationnelles
\dt postes
\dt hierarchie_personnel

SELECT COUNT(*) FROM organisations;
SELECT COUNT(*) FROM unites_organisationnelles;
```

---

## Optimisations et Bonnes Pratiques

### 1. Index Stratégiques
- Index sur toutes les FK (`etablissementId`, `organisationId`, `uniteOrganisationnelleId`)
- Index sur les codes uniques
- Index sur les types et statuts pour les filtres

### 2. Détection de Cycles Hiérarchiques
- Vérification avant création/modification
- Empêche les boucles (A → B → A)
- Erreur explicite `HIERARCHIE_CYCLE`

### 3. Soft Delete pour Hiérarchie
- `actif = false` au lieu de suppression physique
- Permet de conserver l'historique
- Dates `dateDebut` / `dateFin`

### 4. Validation des Contraintes
- Codes uniques par organisation/unité
- Vérification existence des parents
- Vérification enfants avant suppression
- Vérification postes avant suppression d'unité

### 5. Métadonnées JSON Flexibles
- Champ `metadata` JSONB sur toutes les entités
- Permet d'ajouter des informations sans modifier le schéma
- Idéal pour les champs spécifiques au contexte africain

---

## Sécurité

### Multi-Tenancy
- Toutes les requêtes filtrées par `etablissementId`
- Isolation stricte entre établissements

### RBAC
- Middleware `authMiddleware` sur toutes les routes
- `requireRoles(Role.ADMIN, Role.SUPER_ADMIN)` pour écriture
- Permissions granulaires (16 permissions)

### Audit
- Logging de toutes les opérations critiques (create/update/delete)
- Traçabilité complète avec `createdAt` / `updatedAt`

---

## Évolutions Futures

### 1. Organigramme Visuel
- Export PDF/PNG de l'organigramme
- Représentation graphique interactive

### 2. Workflow de Validation
- Validation des créations/modifications d'unités
- Niveaux d'approbation multiples

### 3. Notifications
- Alerte poste vacant
- Notification changement hiérarchique

### 4. Intégration RH
- Lien avec le module personnel
- Historique des mouvements
- Gestion des carrières

### 5. Adaptation Contexte Africain
- Types d'unités spécifiques (inspection, délégation)
- Rôles administratifs régionaux
- Conformité MINEDUC

---

## Fichiers de Référence

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/organisation/entities/*.entity.ts` | Entités TypeORM (4) |
| `backend/src/modules/organisation/dto/organisation.dto.ts` | Schémas Zod (9) |
| `backend/src/modules/organisation/services/organisation.service.ts` | Service métier (547 lignes) |
| `backend/src/modules/organisation/controllers/organisation.controller.ts` | Controller (445 lignes, 24 routes) |
| `backend/database/migrations/044-module-organisation.sql` | Migration SQL + seeds |
| `scripts/deploy-organisation.sh` | Script de déploiement |
| `shared/src/enums/modules.enum.ts` | Enum module ajouté |
| `shared/src/enums/roles.enum.ts` | 16 permissions ajoutées |

---

## Conclusion

Le module **Organisation** apporte à eLISAschool une capacité complète de structuration hiérarchique des établissements, inspirée des meilleures pratiques de gestion commerciale mais **entièrement adaptée** au contexte scolaire africain.

**Points forts** :
- ✅ Arborescence hiérarchique flexible et récursive
- ✅ Détection intelligente de cycles
- ✅ Statistiques et analyses en temps réel
- ✅ Multi-tenancy strict
- ✅ Permissions granulaires (16)
- ✅ Documentation complète
- ✅ Déploiement automatisé

**Prêt pour la production** 🚀
