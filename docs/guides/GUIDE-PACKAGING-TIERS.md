# Guide Packaging & Tiers SaaS

> **Version** : 7.0 (Refonte SaaS)
> **Dernière mise à jour** : 2025

---

## Architecture des plans

### Modèle de tarification

eLISAschool utilise un modèle de tarification **par tranches** avec des plans d'abonnement mensuels/annuels.

| Composant | Description |
|-----------|-------------|
| **Plan de base** | Prix fixe incluant un nombre max d'élèves |
| **Tranches** | Coût supplémentaire par palier d'élèves |
| **Modules optionnels** | Suppléments facturable (PREMIUM/ADDON) |
| **Feature flags** | Fonctionnalités graduels activés par plan |

### Entité PlanAbonnement

| Champ | Type | Description |
|-------|------|-------------|
| `nom` | varchar(100) | Libellé commercial (ex: "Starter", "Standard") |
| `slug` | varchar(100) UNIQUE | Identifiant technique (ex: `starter`) |
| `prixBase` | decimal(12,2) | Prix mensuel de base en XAF |
| `devise` | varchar(10) | Devise (XAF par défaut) |
| `maxEleves` | int | Nombre d'élèves inclus dans le prix de base |
| `maxUtilisateurs` | int | 0 = illimité |
| `maxClasses` | int | 0 = illimité |
| `stockageMaxGo` | decimal(12,2) | Stockage max en Go |
| `smsInclus` | int | SMS inclus par mois |
| `modulesInclus` | simple-json | Slugs des modules inclus |
| `featureFlags` | simple-json | Feature flags activés |
| `badge` | varchar(50) | Label commercial ("Populaire", etc.) |
| `ordre` | int | Ordre d'affichage |

### Entité TrancheEleves

| Champ | Type | Description |
|-------|------|-------------|
| `planId` | UUID | Plan parent |
| `minEleves` | int | Borne inférieure (exclusive) |
| `maxEleves` | int/null | Borne supérieure (inclusive) |
| `montantSupplementaire` | int | Coût du palier en XAF |
| `ordre` | int | Ordre de traitement |

---

## Tiers (Plans) standards

### T1 — Gratuit / Découverte

| Paramètre | Valeur |
|-----------|--------|
| Prix | 0 XAF/mois |
| Élèves max | 50 |
| Modules | CRITIQUE uniquement |
| Stockage | 1 Go |

### T2 — Starter

| Paramètre | Valeur |
|-----------|--------|
| Prix | 15 000 XAF/mois |
| Élèves max | 200 |
| Modules | CRITIQUE + communication |
| Stockage | 5 Go |

### T3 — Standard

| Paramètre | Valeur |
|-----------|--------|
| Prix | 35 000 XAF/mois |
| Élèves max | 500 |
| Modules | CRITIQUE + PREMIUM basiques |
| Stockage | 15 Go |
| Badge | "Populaire" |

### T4 — Premium

| Paramètre | Valeur |
|-----------|--------|
| Prix | 60 000 XAF/mois |
| Élèves max | 1000 |
| Modules | Tous PREMIUM inclus |
| Stockage | 50 Go |

### T5 — Enterprise

| Paramètre | Valeur |
|-----------|--------|
| Prix | 100 000 XAF/mois |
| Élèves max | 2500 |
| Modules | Tous modules + ADDON |
| Stockage | 200 Go |

### T6-T8 — Custom / Sur mesure

Plans configurables via l'interface plateforme pour les grands comptes.

---

## Cascade de résolution des modules

L'état actif d'un module pour un établissement est déterminé par :

```
1. modules_catalogue.actifParDefaut    → base globale
2. PlanAbonnement.modulesInclus        → activation par le plan
3. ModulesGroupe (override groupe)     → activation/désactivation forcée
4. AbonnementModule (suppléments)      → souscription individuelle
5. ParametreSysteme modules.{code}.actif → override établissement
```

### Règles de priorité

- Un module **CRITIQUE** est toujours actif (non désactivable)
- Un module **PREMIUM** est activé par le plan ou par supplément
- Un module **ADDON** est activé uniquement par supplément
- L'override établissement (`ParametreSysteme`) a le dernier mot

---

## Modules optionnels (AbonnementModule)

### Entité

| Champ | Type | Description |
|-------|------|-------------|
| `etablissementId` | UUID | Établissement concerné |
| `moduleOptionnelId` | UUID | Module optionnel souscrit |
| `actif` | boolean | État de la souscription |
| `dateDebut` | date | Début de validité |
| `dateFin` | date/null | Fin de validité (null = illimité) |
| `prixMensuel` | decimal | Prix négocié pour cet établissement |

### Cycle de vie

1. **Souscription** : L'établissement souscrit à un module ADDON/PREMIUM
2. **Activation** : `moduleResolutionService` détecte le supplément
3. **Facturation** : Le prix est ajouté à la facture mensuelle
4. **Expiration** : `dateFin` atteinte → module désactivé automatiquement

---

## Facturation

### Calcul du montant mensuel

```
montantTotal = prixBase + montantTranches + montantModules

montantTranches = Σ (tranches applicables × montantSupplementaire)
montantModules = Σ (AbonnementModule.actif × prixMensuel)
```

### Cycle de facturation

| Cycle | Description | Réduction |
|-------|-------------|-----------|
| **MENSUEL** | Facturation chaque mois | 0% |
| **ANNUEL** | Facturation annuelle | -15% |

### Tranches

Exemple pour le plan Standard (500 élèves inclus, prix base 35 000 XAF) :

| Tranche | Élèves | Supplément |
|---------|--------|------------|
| T1 | 501-800 | +10 000 XAF/mois |
| T2 | 801-1200 | +15 000 XAF/mois |
| T3 | 1201+ | +20 000 XAF/mois |

---

## API REST — Tarification

### Endpoints plateforme (SUPER_ADMIN)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/platform/facturation/plans` | Liste tous les plans |
| POST | `/api/platform/facturation/plans` | Créer un plan |
| PUT | `/api/platform/facturation/plans/:id` | Modifier un plan |
| DELETE | `/api/platform/facturation/plans/:id` | Désactiver un plan |
| GET | `/api/platform/facturation/tranches` | Liste des tranches |
| POST | `/api/platform/facturation/tranches` | Créer une tranche |

### Endpoints client (ADMIN établissement)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/billing/plans` | Plans disponibles (public) |
| POST | `/api/billing/simuler` | Simuler un plan |
| PATCH | `/api/billing/abonnement/upgrade` | Changer de plan |
| GET | `/api/billing/mon-abonnement` | Abonnement actuel |
| GET | `/api/billing/mes-quotas` | Quotas actuels |

### Exemple : Simulation

```http
POST /api/billing/simuler
Content-Type: application/json

{
  "planId": "uuid-standard",
  "nombreEleves": 750,
  "cycleFacturation": "MENSUEL"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "plan": { "id": "...", "nom": "Standard", "slug": "standard" },
    "nombreEleves": 750,
    "prixBase": 35000,
    "montantSupplementaire": 10000,
    "montantTotal": 45000,
    "devise": "XAF",
    "cycleFacturation": "MENSUEL",
    "modulesInclus": ["auth", "notes", "cahier-texte", ...]
  }
}
```

---

## Groupes d'établissements

### Modes de facturation

| Mode | Description |
|------|-------------|
| **consolidee** | Une seule facture pour le groupe |
| **individuelle** | Facture par établissement |
| **hybride** | Base consolidée + suppléments individuels |

### Répartition

| Mode | Description |
|------|-------------|
| **egale** | Montant divisé également |
| **proportionnelle** | Selon le nombre d'élèves |
| **personnalisee** | Pourcentages définis manuellement |

### Dégressivité

Les groupes bénéficient d'une dégressivité automatique :
- 5-10 établissements : -5%
- 11-20 établissements : -10%
- 21+ établissements : -15%

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `backend/src/modules/billing/entities/plan-abonnement.entity.ts` | Entité plan |
| `backend/src/modules/billing/entities/tranche-eleves.entity.ts` | Entité tranches |
| `backend/src/modules/billing/entities/abonnement-module.entity.ts` | Suppléments |
| `backend/src/modules/billing/services/facturation.service.ts` | Calcul montant |
| `backend/src/modules/billing/services/module-resolution.service.ts` | Résolution modules |
| `backend/src/modules/billing/controllers/billing.controller.ts` | API REST |
| `frontend/src/features/billing/components/plan-simulator.tsx` | Simulateur UI |
| `frontend/src/routes/platform.facturation.tsx` | Gestion plateforme |
| `frontend/src/routes/_auth.facturation.tsx` | Page client |
