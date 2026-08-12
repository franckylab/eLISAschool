# Guide du Catalogue de Modules

> **Version** : 7.0 (Refonte SaaS)
> **Dernière mise à jour** : 2025

---

## Architecture

### Source de vérité unique

La table `modules_catalogue` (PostgreSQL) est la **source de vérité unique** pour tous les modules plateforme.

- **Plus de `MODULE_REGISTRY`** : Le registre code (`shared/src/config/config.registry.ts`) est déprécié (hard cut).
- **Cascade de résolution** : Catalogue → Plan → Groupe → Supplément → Override ParametreSysteme.

### Entité ModuleCatalogue

| Champ | Type | Description |
|-------|------|-------------|
| `code` | varchar(100) UNIQUE | Code métier (ex: `finances`, `cantine`) |
| `nom` | varchar(150) | Libellé français |
| `categorie` | CRITIQUE / PREMIUM / ADDON | Catégorie commerciale |
| `actifParDefaut` | boolean | Actif par défaut pour tout établissement |
| `estFacturable` | boolean | Le module est-il facturé ? |
| `dependencies` | simple-array | Codes des modules requis |
| `planMinimal` | varchar(60) | Slug du plan minimum requis |
| `config` | jsonb | Configuration par défaut |
| `ordre` | int | Ordre d'affichage |

### Catégories

| Catégorie | Description | Facturable | Actif par défaut |
|-----------|-------------|------------|------------------|
| **CRITIQUE** | Fonctions de base (auth, notes, etc.) | Non | Oui |
| **PREMIUM** | Inclus dans les plans payants | Oui | Non |
| **ADDON** | Souscriptible séparément | Oui | Non |

---

## Cascade de résolution

L'état actif d'un module pour un établissement est déterminé par :

```
1. modules_catalogue.actifParDefaut    → base (true pour CRITIQUE)
2. PlanAbonnement.modulesInclus        → activation par le plan
3. ModulesGroupe (override groupe)     → activation/désactivation forcée
4. AbonnementModule (suppléments)      → activation souscrite
5. ParametreSysteme modules.{code}.actif → override établissement (dernier mot)
```

---

## API REST

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/configuration/modules/registry` | Liste tous les modules du catalogue |
| GET | `/api/configuration/modules/:moduleNom/dependencies` | Dépendances d'un module |
| POST | `/api/configuration/modules/toggle` | Activer/désactiver un module |
| GET | `/api/configuration/modules/registry/impact` | Impact d'un toggle |
| GET | `/api/billing/modules/resolved` | Modules résolus pour le tenant |

### Exemple : Toggle

```http
POST /api/configuration/modules/toggle
Content-Type: application/json

{
  "moduleNom": "gamification",
  "actif": true
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Module gamification activé",
    "modulesAutoActive": ["notes"]
  }
}
```

---

## Validation des dépendances

### Activation
- Vérifie que toutes les dépendances sont actives
- **Auto-activation** des dépendances manquantes si possible
- Erreur si l'auto-activation échoue

### Désactivation
- Vérifie les **reverse dependencies** (modules qui dépendent de ce module)
- **Bloquée** si des modules dépendants sont actifs
- **Modules CRITIQUE** : non désactivables (protection système)

### Détection de cycles
- Détection automatique des dépendances circulaires
- Erreur immédiate si un cycle est détecté

---

## Cache

### Architecture
- **Redis** (TTL 60s) avec fallback in-memory
- **Pub/Sub** pour invalidation cross-instance (`modules:invalidate`)
- Clé : `modules:resolved:{etablissementId}`

### Invalidation
Le cache est invalidé lors de :
- Toggle d'un module
- Modification du catalogue (CRUD billing)
- Synchronisation du catalogue

---

## Audit

Chaque toggle est tracé dans `audit_logs` :
- Action : `MODULE_ACTIVATE` / `MODULE_DEACTIVATE`
- Métadonnées : module, ancien état, nouvel état, utilisateur

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/billing/entities/module-catalogue.entity.ts` | Entité catalogue |
| `backend/src/modules/billing/services/module-resolution.service.ts` | Résolution + cache |
| `backend/src/modules/configuration/services/configuration.service.ts` | Toggle + dépendances |
| `backend/src/common/middlewares/module-access.middleware.ts` | Gate d'accès |
| `frontend/src/features/modules/components/` | Composants UI réutilisables |
| `shared/src/types/module-lifecycle.types.ts` | Interface lifecycle |
