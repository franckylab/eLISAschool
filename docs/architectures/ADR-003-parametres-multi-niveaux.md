# ADR-003 — Paramètres Multi-Niveaux Cascade UI

**Statut** : Accepté
**Date** : 2025-07-10
**Décideurs** : Équipe eLISAschool

---

## Contexte

Le backend eLISAschool supporte déjà un système de paramètres multi-niveaux (cascade) :

```
Système (défaut code) → Global (tous établissements) → Groupe → Établissement (override)
```

Cependant, l'interface d'administration ne reflétait pas cette architecture :

1. **UI mono-niveau** — Seule la valeur globale était visible/modifiable
2. **Pas de visualisation cascade** — Impossible de voir la valeur effective pour un établissement
3. **Pas de propagation** — Impossible d'appliquer un changement global à tous (sauf overrides)
4. **Pas de détection d'incohérences** — Des overrides contradictoires pouvaient exister sans alerte
5. **Pas d'historique** — Impossible de tracer qui a modifié quoi et quand

## Décision

### Vue cascade 4 colonnes

Interface en 4 colonnes montrant la résolution complète :

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   SYSTÈME   │   GLOBAL    │   GROUPE    │ ÉTABLISSEMENT│
│  (défaut)   │  (tous)     │  (optionnel)│  (override) │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ notes: 20   │ notes: 15   │ notes: 18   │ notes: 12   │
│ bulletin: A │ bulletin: B │ bulletin: B │ bulletin: A │
│ cantine: ✓  │ cantine: ✗  │ cantine: ✓  │ cantine: ✓  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Endpoints API

```
GET    /api/platform/parametres/cascade/:cle          — Cascade complète (4 niveaux)
PUT    /api/platform/parametres/cascade/:cle/global   — Modifier valeur globale
PUT    /api/platform/parametres/cascade/:cle/etablissement/:etabId — Override établissement
DELETE /api/platform/parametres/cascade/:cle/etablissement/:etabId — Reset override
POST   /api/platform/parametres/cascade/:cle/propager — Appliquer global à tous (sauf overrides)
GET    /api/platform/parametres/cascade/:cle/historique — Timeline modifications
POST   /api/platform/parametres/cascade/:cle/rollback/:versionId — Rollback
GET    /api/platform/parametres/incoherences          — Détection overrides contradictoires
```

### Règles de résolution

1. **Priorité** : Établissement > Groupe > Global > Système
2. **Override explicite** : Si un établissement a un override, la propagation globale ne l'affecte pas
3. **Badge "Override"** : Affiché visuellement quand la valeur diffère du niveau parent
4. **Valeur effective** : Section montrant la valeur finale pour chaque établissement

### Propagation avec alertes

- Bouton "Propager à tous" sur le niveau global
- Avant propagation : liste des établissements avec overrides qui ne seront PAS affectés
- Confirmation explicite avec nombre d'établissements impactés

### Détection d'incohérences

- Alerte amber quand des overrides contradictoires sont détectés
- Exemple : Groupe A force `notes=20` mais établissement du groupe A a `notes=5`
- Bannière d'alerte avec liste des incohérences et actions de résolution

### Historique et rollback

- Timeline par paramètre (qui, quand, ancienne valeur, nouvelle valeur)
- Rollback vers n'importe quelle version précédente
- Export audit trail pour conformité

## Conséquences

### Positives
- **Transparence** — Visualisation claire de la résolution effective
- **Contrôle** — Propagation sélective avec préservation des overrides
- **Sécurité** — Détection précoce des incohérences
- **Traçabilité** — Historique complet avec rollback

### Négatives (à maîtriser)
- **Complexité UI** — 4 colonnes peuvent être denses sur mobile → scroll horizontal + vue simplifiée
- **Performance** — Cascade complète peut être coûteuse → cache serveur + lazy loading
- **Formation** — Les admins doivent comprendre le modèle de cascade → tooltips + documentation intégrée

### Fichiers impactés
- `backend/src/modules/configuration/controllers/parametres-cascade.controller.ts` — Nouveaux endpoints
- `frontend/src/features/platform-config/parametres-cascade-page.tsx` — Nouvelle page cascade UI
- `frontend/src/locales/fr/admin.json` — Namespace `parametresCascade.*` (~50 clés)
- `frontend/src/locales/en/admin.json` — Namespace `parametresCascade.*` (~50 clés)

## Alternatives rejetées

### UI formulaire plat (un paramètre = une page)
Chaque paramètre a sa propre page avec juste la valeur globale. Rejetée car pas de visibilité sur les overrides.

### Édition en masse type spreadsheet
Grille éditable avec toutes les combinaisons paramètre × établissement. Rejetée car trop dense, risque d'erreurs.

### Configuration par fichier YAML/JSON
Fichier de configuration par établissement. Rejetée car pas d'interface visuelle, nécessite un déploiement.
