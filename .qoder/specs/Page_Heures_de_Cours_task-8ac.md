
# Plan — Page Heures de cours complète

## Décisions actées

| Décision | Choix |
|----------|-------|
| Portée | **GLOBAL** — vue établissement + filtres |
| Navigation | **Sous-entrées EDT** dans la sidebar (Heures de cours + Remplacements) |
| Tab existant | **CONSERVÉ** dans la fiche personnel (réutilisation hooks) |
| Remplacements | **Page dédiée** `/heures-cours/remplacements` |
| Permissions | **Granulaires dédiées** (heures-cours:view, :create, :edit, :delete, :generate, :export, :remplacer:demand, :remplacer:validate, :remplacer:execute) |
| Backend remplacements | **Nouvelle entité** `RemplacementHeureCours` + workflow validation générique |
| Code partagé | **Réutilisation directe** des hooks existants |
| Workflow | **validationWorkflowService** existant (générique) |

---

## T1. Backend — Nouvelle entité RemplacementHeureCours

### Fichier: `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts`

```typescript
export enum StatutRemplacement {
    EN_ATTENTE = 'EN_ATTENTE',        // Demande créée
    VALIDEE = 'VALIDEE',              // Validée par niv1
    REJETEE = 'REJETEE',              // Rejetée
    EXECUTEE = 'EXECUTEE',            // Remplacement effectué
    ANNULEE = 'ANNULEE',              // Annulée par le demandeur
}

@Entity('remplacements_heure_cours')
@Index(['etablissementId'])
@Index(['heureCoursId'])
@Index(['statut'])
@Index(['demandeurId'])
export class RemplacementHeureCours {
    id: uuid;
    heureCoursId: uuid (FK → HeureCours);
    heureCours?: ManyToOne(HeureCours);
    demandeurId: uuid (FK → MembrePersonnel); // Qui demande
    demandeur?: ManyToOne(MembrePersonnel);
    remplacantId?: uuid nullable (FK → MembrePersonnel); // Qui remplace
    remplacant?: ManyToOne(MembrePersonnel);
    motif: text; // Raison du remplacement
    statut: varchar(30) default EN_ATTENTE;
    dateDemande: Date;
    dateValidation?: Date nullable;
    dateExecution?: Date nullable;
    valideParId?: uuid nullable;
    commentaires?: text nullable;
    etablissementId: uuid;
    createdAt, updatedAt, deletedAt (soft delete);
}
```

### Migration: `backend/database/migrations/162-remplacement-heure-cours.sql`
- CREATE TABLE + index
- Seed permissions RBAC
- Seed paramètres validation workflow

---

## T2. Backend — DTOs + Service RemplacementHeureCours

### Fichier: `backend/src/modules/personnel/dto/remplacement-heure-cours.dto.ts`
- `creerRemplacementSchema` (Zod): heureCoursId, motif, remplacantId?
- `validerRemplacementSchema`: remplacantId (obligatoire à la validation), commentaire?
- `queryRemplacementSchema`: pagination + filtres (statut, demandeurId, dateRange)

### Fichier: `backend/src/modules/personnel/services/remplacement-heure-cours.service.ts`
- `create(dto, etablissementId, demandeurId, req?)` → crée demande + workflow si validation requise
- `valider(id, valideParId, dto, req?)` → valide + exécute le remplacement (statut → EXECUTEE, maj HeureCours)
- `rejeter(id, valideParId, motif, req?)` → statut REJETEE
- `annuler(id, demandeurId, req?)` → statut ANNULEE
- `findAll(query, etablissementId)` → liste paginée avec relations
- `getStatistiques(etablissementId)` → agrégats (en attente, validées, exécutées, taux)
- Intégration `validationWorkflowService` + `auditService.log()`

---

## T3. Backend — Controller + Routes Remplacements

### Fichier: `backend/src/modules/personnel/controllers/remplacement-heure-cours.controller.ts`

| Méthode | Route | Permission | Rôle |
|---------|-------|-----------|------|
| GET | `/api/personnel/heures-cours/remplacements` | `heures-cours:remplacer:view` | Lister les demandes |
| POST | `/api/personnel/heures-cours/remplacements` | `heures-cours:remplacer:demand` | Créer une demande |
| GET | `/api/personnel/heures-cours/remplacements/statistiques` | `heures-cours:remplacer:view` | Stats remplacements |
| PATCH | `/api/personnel/heures-cours/remplacements/:id/valider` | `heures-cours:remplacer:validate` | Valider + exécuter |
| PATCH | `/api/personnel/heures-cours/remplacements/:id/rejeter` | `heures-cours:remplacer:validate` | Rejeter |
| PATCH | `/api/personnel/heures-cours/remplacements/:id/annuler` | `heures-cours:remplacer:demand` | Annuler (demandeur) |

### Enregistrement: `backend/src/app.ts`
- Monter le controller AVANT le routeur heures-cours (pour éviter conflit `:id`)

---

## T4. Backend — Extensions Heures de cours (stats globales + export)

### Ajouts au controller `heure-cours.controller.ts`

| Méthode | Route | Permission | Rôle |
|---------|-------|-----------|------|
| GET | `/api/personnel/heures-cours/statistiques-globales` | `heures-cours:view` | Stats agrégées établissement |
| GET | `/api/personnel/heures-cours/export/csv` | `heures-cours:export` | Export CSV filtré |
| GET | `/api/personnel/heures-cours/export/html` | `heures-cours:export` | Export HTML (printable) |

### Service — nouvelles méthodes
- `getStatistiquesGlobales(etablissementId, filtres)` → total heures, taux effectuation/annulation/remplacement, volume par semaine/mois, tendance
- `exportCSV(query, etablissementId)` → CSV avec toutes les colonnes
- `exportHTML(query, etablissementId)` → HTML formaté pour impression

---

## T5. Backend — Permissions RBAC + Config validation

### Fichier: `shared/src/enums/roles.enum.ts` — Ajouter:
```typescript
HEURES_COURS_EXPORT = 'heures-cours:export',
HEURES_COURS_REMPLACER_VIEW = 'heures-cours:remplacer:view',
HEURES_COURS_REMPLACER_DEMAND = 'heures-cours:remplacer:demand',
HEURES_COURS_REMPLACER_VALIDATE = 'heures-cours:remplacer:validate',
```

### Seed: paramètres validation workflow
```
heures_cours_remplacement.require_validation = true
heures_cours_remplacement.validation_levels = 1
heures_cours_remplacement.validation_roles = {"1": "ADMIN"}
```

### Attribution rôles:
- ADMIN/SUPER_ADMIN: toutes permissions
- CHEF_ETABLISSEMENT: view, export, remplacer:demand, remplacer:view

---

## T6. Frontend — Hooks TanStack Query

### Fichier: `frontend/src/features/personnel/hooks/use-remplacement-heure-cours.ts`
- `useRemplacements(query)` → liste paginée
- `useCreerRemplacement()` → mutation create
- `useValiderRemplacement()` → mutation valider
- `useRejeterRemplacement()` → mutation rejeter
- `useAnnulerRemplacement()` → mutation annuler
- `useStatistiquesRemplacements()` → stats

### Fichier: `frontend/src/features/personnel/hooks/use-heure-cours.ts` — Ajouter:
- `useStatistiquesGlobales(query)` → stats établissement
- `useExportHeuresCours(query)` → export CSV/PDF

---

## T7. Frontend — Page globale Heures de cours

### Route: `/heures-cours`
### Fichier: `frontend/src/features/emploi-du-temps/components/heures-cours-page.tsx`

**Structure** :
1. `PageHeader` (variant="gradient", icon=Clock, breadcrumbs auto)
2. **Dashboard stats** — 6 StatCards: Total heures, Taux effectuation, Taux annulation, Taux remplacement, Volume semaine, Volume mois (avec trend)
3. **DataTable** avec FilterPanel collapsible:
   - Colonnes: Date, Heure, Matière, Classe, Enseignant, Salle, Type, Statut (badge), Actions
   - Filtres: enseignant (select), classe (select), matière (select), salle (select), période (select), statut (multi-select), date range
   - Tri + pagination serveur
   - Actions ligne: pointer (effectué/annulé), éditer, remplacer (→ lien vers remplacements)
4. **Toolbar**: Bouton générer depuis EDT, Export CSV, Export PDF, Ajouter cours

### Fichier: `frontend/src/features/emploi-du-temps/components/heures-cours-export-modal.tsx`
- Modal export: choix format (CSV/PDF), filtres appliqués, aperçu

---

## T8. Frontend — Page dédiée Remplacements

### Route: `/heures-cours/remplacements`
### Fichier: `frontend/src/features/emploi-du-temps/components/remplacements-page.tsx`

**Structure** :
1. `PageHeader` (icon=UserCheck, breadcrumbs: Emploi du temps > Heures de cours > Remplacements)
2. **Stats rapides** — 4 cards: En attente, Validées, Rejetées, Exécutées
3. **DataTable** avec FilterPanel:
   - Colonnes: Date cours, Matière, Classe, Enseignant absent, Remplaçant proposé, Motif, Statut (badge workflow), Actions
   - Filtres: statut, demandeur, dateRange
   - Actions: Valider (si permission), Rejeter, Annuler, Voir détail
4. **Bouton "Nouvelle demande"** → StepperModal 3 étapes:
   - Étape 1: Sélectionner le cours à remplacer (liste filtrée des cours PLANIFIE)
   - Étape 2: Choisir le remplaçant (select enseignant) + motif
   - Étape 3: Récapitulatif + confirmation

### Fichier: `frontend/src/features/emploi-du-temps/components/remplacement-stepper-modal.tsx`
- Basé sur `StepperModal` partagé
- 3 étapes avec validation à chaque étape
- Vérification conflits remplaçant (étape 2)

---

## T9. Frontend — Sidebar + Routing

### Sidebar (`frontend/src/components/layout/Sidebar.tsx`)
Ajouter sous "Emploi du temps":
```typescript
{
    label: 'Emploi du temps', path: '/emploi-du-temps', icon: Calendar, module: 'emploi-du-temps',
    children: [
        { label: 'Planning', path: '/emploi-du-temps', icon: Calendar },
        { label: 'Heures de cours', path: '/heures-cours', icon: Clock, permission: 'heures-cours:view' },
        { label: 'Remplacements', path: '/heures-cours/remplacements', icon: UserCheck, permission: 'heures-cours:remplacer:view' },
    ]
}
```

### Routing (`frontend/src/app/router.tsx` ou routes/)
- `/heures-cours` → `HeuresCoursPage`
- `/heures-cours/remplacements` → `RemplacementsPage`

---

## T10. Frontend — i18n

### Fichier: `frontend/src/locales/fr/emplois.json` — Ajouter ~80 clés:
- `heuresCoursPage.*` (titre, subtitle, stats, filtres, colonnes, actions)
- `remplacements.*` (titre, subtitle, stats, étapes modal, statuts, actions)
- `export.*` (titre, format, options)

### Fichier: `frontend/src/locales/en/emplois.json` — Parité EN

---

## T11. Qualité — Responsive + Dark mode + Performance

- **Ultra-responsivité**: clamp() partout, DataTable → cartes < 480px
- **Dark mode**: CSS vars uniquement, pas de couleurs hardcodées
- **Performance**: pagination serveur, lazy loading des options (select filtres), staleTime 5min
- **Accessibilité**: aria-label sur tous les boutons interactifs
- **Composants réutilisables**: StatCard, DataTable, FilterPanel, StepperModal, CustomModal, ElisaButton

---

## Ordre d'implémentation

1. **T1** → Entité + migration
2. **T5** → Permissions RBAC + config seed
3. **T2** → DTOs + Service remplacements
4. **T3** → Controller + routes remplacements
5. **T4** → Extensions stats globales + export
6. **T6** → Hooks frontend
7. **T7** → Page globale Heures de cours
8. **T8** → Page dédiée Remplacements
9. **T9** → Sidebar + routing
10. **T10** → i18n FR + EN
11. **T11** → Audit responsive + dark mode + performance

## Fichiers à créer (estimé)
- Backend: 5 fichiers (entity, dto, service, controller, migration)
- Frontend: 5 fichiers (2 pages, 1 modal export, 1 stepper modal, 1 hooks)
- Modification: 6 fichiers (app.ts, sidebar, router, 2 JSON i18n, roles.enum)

## Mise à jour skills/règles
- `AGENTS.md`: ajouter section Heures de cours
- `elisaschool-dev`: documenter le pattern RemplacementHeureCours
- `elisaschool-business-logic`: documenter le flux de remplacement
