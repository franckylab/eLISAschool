# Guide Configuration Tranches Billing

> Phase 3.1 — Refonte SaaS v5

## Architecture des Tranches

Les tranches de pricing permettent de facturer un supplément selon le nombre d'élèves d'un établissement.

### Cascade de Résolution

```
Priorité 1 : TrancheSupplement (établissement) — override custom
Priorité 2 : TrancheEleves (plan) — défaut du plan
Fallback   : Tranches système — défaut global
```

### Entités

#### TrancheEleves (plan)
```typescript
@Entity('tranches_eleves')
export class TrancheEleves {
    id: string;
    planId: string;          // FK vers PlanAbonnement
    ordre: number;           // Ordre de la tranche
    minEleves: number;       // Borne inférieure
    maxEleves: number | null; // Borne supérieure (null = illimité)
    montantSupplementaire: number; // En XAF/mois
    label?: string;
    actif: boolean;
}
```

#### TrancheSupplement (établissement)
```typescript
@Entity('tranches_supplement')
@Index(['etablissementId', 'ordre'], { unique: true })
export class TrancheSupplement {
    id: string;
    etablissementId: string; // FK vers Etablissement
    ordre: number;
    minEleves: number;
    maxEleves: number | null;
    montantSupplementaire: number;
    label?: string;
    actif: boolean;
    trancheOriginaleId?: string; // FK optionnelle vers TrancheEleves (override)
}
```

### Exemple de Configuration

**Plan Standard** — Tranches par défaut :

| Tranche | Min | Max | Supplément |
|---------|-----|-----|-----------|
| Base | 0 | 100 | 0 XAF |
| Moyen | 101 | 500 | 5 000 XAF |
| Grand | 501 | ∞ | 10 000 XAF |

**Établissement "Lycée de Yaoundé"** — Override custom :

| Tranche | Min | Max | Supplément | Source |
|---------|-----|-----|-----------|--------|
| Base | 0 | 100 | 0 XAF | Plan |
| Moyen | 101 | 500 | 3 000 XAF | Établissement (négociation) |
| Grand | 501 | ∞ | 10 000 XAF | Plan |

### API Endpoints

```
GET    /api/billing/tranches/resolved      — Tranches résolues pour le tenant
GET    /api/billing/tranches/simulate      — Simulation coût (query: nbEleves)
POST   /api/billing/tranches               — Créer/modifier un override
DELETE /api/billing/tranches/:id           — Supprimer un override
```

### Service TrancheConfigService

```typescript
const service = new TrancheConfigService();

// Résoudre les tranches applicables
const tranches = await service.getResolvedTranches(etablissementId);

// Calculer le supplément pour N élèves
const { totalSupplement, detail } = await service.calculateSupplement(etablissementId, 200);
// → totalSupplement = 5000 (tranche 101-500)
```

### Migration SQL

La migration `156-billing-configurable-avance.sql` ajoute :
- `estCustomisable` sur `tranches_eleves`
- `tranchesConfigurables` sur `plans_abonnement`
- Table `tranches_supplement`
