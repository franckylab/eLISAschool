# ADR-001 — Restructuration Sidebar Plateforme

**Statut** : Accepté
**Date** : 2025-07-10
**Décideurs** : Équipe eLISAschool

---

## Contexte

La sidebar du panel d'administration plateforme (`platform-sidebar.tsx`) était organisée en 3 groupes non structurés par workflow :

```
Principal (Dashboard, Établissements, Facturation)
Gestion (Monitoring, Modules, Audit)
Système (Configuration, Notifications, Providers, Approbations)
```

**Problèmes identifiés :**

1. **Approvisionnement cognitif** — Les items étaient groupés par type technique plutôt que par intention métier
2. **Non-scalable** — L'ajout de nouvelles routes (revenus, utilisateurs, permissions) n'avait pas de place logique
3. **Incohérence benchmark** — Les références SaaS (Stripe Dashboard, Notion Admin, Vercel) utilisent des regroupements par workflow

## Décision

**Restructurer en 4 groupes workflow** suivant le pattern Stripe/Notion :

```
PILOTAGE (3 items)
├── Dashboard          → /platform/dashboard
├── Monitoring         → /platform/monitoring
└── Revenus            → /platform/revenus

TENANTS (4 items)
├── Établissements     → /platform/etablissements
├── Groupes            → /platform/groupes
├── Facturation        → /platform/facturation
└── Abonnements        → /platform/abonnements

TECHNIQUE (4 items)
├── Modules            → /platform/modules
├── Configuration      → /platform/configuration
├── Notifications      → /platform/notifications-config
└── Providers          → /platform/providers

SÉCURITÉ (3 items)
├── Utilisateurs       → /platform/utilisateurs
├── Permissions        → /platform/permissions
└── Audit              → /platform/audit
```

### Critères de regroupement

| Groupe | Question guidant l'affectation |
|--------|-------------------------------|
| **Pilotage** | « J'ai besoin de voir l'état global » |
| **Tenants** | « Je gère les clients/établissements » |
| **Technique** | « Je configure le système » |
| **Sécurité** | « Je contrôle les accès et l'audit » |

### Type mis à jour

```typescript
type PlatformNavItem = {
    id: string;
    label: string;
    path: string;
    icon: LucideIcon;
    group: 'pilotage' | 'tenants' | 'technique' | 'securite';
    description?: string;
};
```

## Conséquences

### Positives
- **Navigation intuitive** — Chaque groupe correspond à un mindset/opération distinct
- **Extensible** — Nouveaux items trouvent naturellement leur groupe
- **Cohérent** — Aligné sur les standards SaaS (Stripe, Vercel, Linear)
- **i18n propre** — Clés `sidebar.groupePilotage/Tenants/Technique/Securite`

### Négatives (mineures)
- **Migration visuelle** — Les utilisateurs existants doivent s'habituer à la nouvelle organisation
- **Routes ajoutées** — 3 nouvelles pages stub créées (revenus, abonnements, utilisateurs)
- **CommandPalette** — 7 nouvelles entrées ajoutées pour la recherche rapide

### Fichiers modifiés
- `frontend/src/components/layout/platform-sidebar.tsx` — Refactoré (4 groupes, 14 items)
- `frontend/src/routes/platform.revenus.tsx` — Nouveau stub
- `frontend/src/routes/platform.abonnements.tsx` — Nouveau stub
- `frontend/src/routes/platform.utilisateurs.tsx` — Nouveau stub
- `frontend/src/components/CommandPalette.tsx` — 7 routes ajoutées
- `frontend/src/locales/fr/admin.json` — Clés navigation + sidebar
- `frontend/src/locales/en/admin.json` — Clés navigation + sidebar

## Alternatives rejetées

### Proposition B — Par entité technique
Groupes : « CRUD », « Configuration », « Observabilité ». Rejetée car trop technique, ne reflète pas le workflow admin.

### Proposition C — Flat sans groupes
Liste unique triée alphabétiquement. Rejetée car non-scalable au-delà de 10 items.
