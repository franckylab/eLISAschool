# Module Annonces - eLISAschool

## Vue d'ensemble

Le module **Annonces** permet la gestion complète des annonces avec bande défilante, ciblage multi-critères et workflow de validation.

## Fonctionnalités

### 1. Gestion CRUD
- ✅ Création d'annonces avec validation Zod
- ✅ Modification avec audit complet
- ✅ Suppression douce (soft delete)
- ✅ Liste paginée avec filtres (statut, recherche)

### 2. Workflow de Validation
- ✅ Soumission pour validation
- ✅ Validation par ADMIN/CHEF_ETABLISSEMENT
- ✅ Rejet avec motif
- ✅ Activation automatique après validation (14 jours par défaut)

### 3. Ciblage Multi-Critères
- ✅ **Ciblage global** : visible par tous
- ✅ **Par rôle** : ADMIN, ENSEIGNANT, PARENT, ELEVE, etc.
- ✅ **Par utilisateur** : ciblage individuel
- ✅ **Par classe** : classe spécifique
- ✅ **Par niveau** : niveau scolaire
- ✅ **Par fonction** : fonction du personnel
- ✅ **Par établissement** : établissement spécifique

### 4. Programmation Temporelle
- ✅ Date de début et de fin
- ✅ Statuts automatiques : `brouillon` → `programmé` → `actif` → `expiré` → `archive`
- ✅ Mise à jour automatique des statuts via cron

### 5. Configuration
- ✅ Vitesse de défilement
- ✅ Hauteur de la bande
- ✅ Intervalle d'actualisation
- ✅ Types de contenu autorisés (texte, html, enrichi)
- ✅ Pause au survol
- ✅ Délai d'apparition et réapparition

### 6. Notifications
- ✅ Notification des utilisateurs ciblés lors de la création
- ✅ Notification des validateurs lors de la soumission
- ✅ Notification de modification (avec cooldown)

## Architecture

### Entités
- **Annonce** : Entité principale avec toutes les propriétés
- **AnnonceCiblage** : Table de jointure pour le ciblage multi-critères

### Routes API

#### Publiques (authentifié)
```
GET    /api/annonces/actives              # Annonces visibles par l'utilisateur
```

#### Configuration (ADMIN/SUPER_ADMIN)
```
GET    /api/annonces/configuration        # Récupérer la config
PUT    /api/annonces/configuration        # Mettre à jour la config
GET    /api/annonces/criteres-ciblage     # Critères disponibles
POST   /api/annonces/mettre-a-jour-statuts # MAJ auto des statuts
```

#### CRUD (ADMIN/SUPER_ADMIN/CHEF_ETABLISSEMENT)
```
GET    /api/annonces                      # Liste paginée
GET    /api/annonces/:id                  # Détail
POST   /api/annonces                      # Créer
PATCH  /api/annonces/:id                  # Modifier
DELETE /api/annonces/:id                  # Supprimer
```

#### Workflow
```
POST   /api/annonces/:id/soumettre-validation  # Soumettre
POST   /api/annonces/:id/valider               # Valider
POST   /api/annonces/:id/rejeter               # Rejeter
```

#### Actions de gestion
```
POST   /api/annonces/:id/activer        # Activer
POST   /api/annonces/:id/desactiver     # Désactiver
POST   /api/annonces/:id/archiver       # Archiver
```

## Permissions RBAC

### Permissions de base
- `annonce:view` - Voir les annonces
- `annonce:create` - Créer des annonces
- `annonce:edit` - Modifier des annonces
- `annonce:delete` - Supprimer des annonces

### Permissions de gestion
- `annonce:manage` - Gestion complète
- `annonce:configurer` - Configurer la bande

### Permissions de workflow
- `annonce:valider` - Valider/refuser
- `annonce:publier` - Publier/activer
- `annonce:programmer` - Programmer
- `annonce:archiver` - Archiver
- `annonce:desactiver` - Désactiver
- `annonce:activer` - Activer

## Attribution des Rôles

| Rôle | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Toutes les permissions |
| **ADMIN** | Toutes sauf configuration |
| **CHEF_ETABLISSEMENT** | Toutes sauf configuration |
| **ENSEIGNANT** | `annonce:view` |
| **PERSONNEL** | `annonce:view` |
| **PARENT** | `annonce:view` |
| **ELEVE** | `annonce:view` |

## Configuration Système

Les paramètres sont stockés dans `parametres_systeme` :

```sql
-- Activation du module
'annonces.actif' = true

-- Validation requise
'annonces.require_validation' = false

-- Configuration de l'interface
'annonces.vitesse_defilement' = 50
'annonces.hauteur_bande' = 40
'annonces.intervalle_actualisation' = 30
'annonces.pause_sur_vol' = true
'annonces.delai_apparition' = 600
'annonces.delai_reapparition' = 600
```

## Multi-Tenant

Toutes les annonces sont isolées par `etablissement_id`. Les utilisateurs ne voient que les annonces de leur établissement.

## Exemples d'Utilisation

### Créer une annonce
```typescript
POST /api/annonces
{
  "titre": "Réunion parents-professeurs",
  "contenu": "La réunion aura lieu le 15 mars à 18h",
  "typeContenu": "texte",
  "dateDebut": "2026-03-01T00:00:00.000Z",
  "dateFin": "2026-03-20T23:59:59.000Z",
  "cibleGlobale": false,
  "ciblages": [
    { "typeCible": "role", "cibleId": "PARENT" },
    { "typeCible": "role", "cibleId": "ENSEIGNANT" }
  ]
}
```

### Soumettre pour validation
```typescript
POST /api/annonces/:id/soumettre-validation
```

### Valider une annonce
```typescript
POST /api/annonces/:id/valider
// Active automatiquement l'annonce pour 14 jours
```

## Migration

Pour exécuter la migration :

```bash
# Via TypeORM
npm run typeorm migration:run

# Ou directement en SQL
psql -d elisaschool -f backend/database/migrations/041-module-annonces.sql
```

## Notes Techniques

- **Cache** : TTL de 5 minutes pour la configuration
- **Index** : Index sur `etablissementId`, `statut`, `dateDebut`, `dateFin`
- **Soft Delete** : Utilisation de `@DeleteDateColumn()` pour récupération possible
- **Sanitization** : Protection XSS sur le contenu HTML
- **Validation** : Schémas Zod avec messages en français

## Dépendances

- Module `configuration` pour les paramètres système
- Module `notifications` pour les notifications
- Module `auth` pour l'authentification et RBAC
- Module `etablissements` pour le multi-tenant

## Prochaines Étapes

- [ ] WebSocket pour temps réel
- [ ] Attachements de fichiers
- [ ] Planification avancée (récurrente)
- [ ] Statistiques de lecture
- [ ] Export PDF des annonces
