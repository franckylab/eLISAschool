# ADR-002 — Rôles Plateforme Multi-Niveaux

**Statut** : Accepté
**Date** : 2025-07-10
**Décideurs** : Équipe eLISAschool

---

## Contexte

Le panel d'administration plateforme reposait uniquement sur le rôle `SUPER_ADMIN`, créant plusieurs problèmes :

1. **Pas de séparation des responsabilités** — Un SUPER_ADMIN peut tout faire (gestion quotidienne, sécurité, commercial, support, monitoring)
2. **Pas de principe du moindre privilège** — Impossible de donner un accès restreint à un membre de l'équipe support
3. **Pas de scope par groupe** — Impossible de limiter un admin à un sous-ensemble d'établissements
4. **Pas d'extensibilité** — Impossible de créer des rôles personnalisés pour des besoins spécifiques

## Décision

### 6 rôles plateforme par défaut + Role Builder

```typescript
// Rôles plateforme (Control Plane)
enum RolePlateforme {
    SUPER_ADMIN = 'SUPER_ADMIN',                          // Accès total, non supprimable
    ADMINISTRATION_PLATEFORME = 'ADMINISTRATION_PLATEFORME', // Gestion quotidienne
    SECURITE_PLATEFORME = 'SECURITE_PLATEFORME',          // Sécurité, RBAC, audit
    SUPPORT_PLATEFORME = 'SUPPORT_PLATEFORME',            // Support technique
    COMMERCIAL_PLATEFORME = 'COMMERCIAL_PLATEFORME',      // Commercial, plans, revenus
    MONITORING_PLATEFORME = 'MONITORING_PLATEFORME',      // Monitoring, alertes, metrics
}
```

### Matrice de permissions par rôle

| Permission | SUPER_ADMIN | ADMIN | SECURITE | SUPPORT | COMMERCIAL | MONITORING |
|-----------|:-----------:|:-----:|:--------:|:-------:|:----------:|:----------:|
| `platform:administration:*` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `platform:securite:*` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `platform:support:*` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `platform:commercial:*` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `platform:monitoring:*` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `platform:roles:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `platform:audit:read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Scope par groupe d'établissements

- Colonne `groupeEtablissementIds` (uuid[]) sur table `utilisateurs` pour les rôles plateforme
- Un admin avec scope `groupeA` ne voit que les établissements du groupe A
- `SUPER_ADMIN` a toujours un scope global (null = tous les groupes)

### Role Builder (rôles personnalisés)

- Création de rôles custom avec sélection granulaire de permissions
- Entité `RolePlateforme` : `nom`, `description`, `estSysteme`, `permissions` (text[]), `scopeType` ('global' | 'groupe')
- Les rôles système (`estSysteme = true`) ne sont pas supprimables

### Sécurité renforcée

| Mesure | Description |
|--------|-------------|
| MFA obligatoire | Grace period 24h, puis accès bloqué |
| Protection dernier SUPER_ADMIN | Impossible de supprimer/rétrograder le dernier SUPER_ADMIN |
| Politique mot de passe | Min 12 chars, 1 maj, 1 min, 1 chiffre, 1 spécial |
| Limite sessions | Maximum 3 sessions simultanées par compte |
| Audit trail | Toutes les actions sur les utilisateurs sont tracées |

## Conséquences

### Positives
- **Séparation des responsabilités** — Chaque rôle a un périmètre clair
- **Principe du moindre privilège** — Accès minimum nécessaire par défaut
- **Granularité** — Scope par groupe pour limiter la portée
- **Extensibilité** — Role Builder pour besoins futurs

### Négatives (à maîtriser)
- **Complexité RBAC** — Plus de rôles = plus de configuration initiale
- **Migration** — Les utilisateurs existants doivent être migrés vers les nouveaux rôles
- **Middleware scope** — Vérification du scope groupe à chaque requête

### Fichiers impactés
- `shared/src/enums/roles.enum.ts` — 6 nouveaux rôles
- `backend/src/modules/platform-users/` — Nouveau module CRUD
- `backend/src/modules/platform-roles/` — Nouveau module Role Builder
- `frontend/src/features/platform-users/` — Nouveau feature UI
- `frontend/src/features/platform-roles/` — Nouveau feature Role Builder UI

## Alternatives rejetées

### Rôles simples (3 rôles)
SUPER_ADMIN + ADMIN + READ_ONLY. Rejetée car trop coarse, pas de séparation sécurité/support/commercial.

### Permissions unitaires sans rôles
Chaque utilisateur reçoit des permissions individuelles. Rejetée car ingérable à grande échelle, pas de vue d'ensemble.

### Scope par établissement individuel
Scope défini établissement par établissement. Rejetée car trop granulaire pour le management — le groupe est le bon niveau d'abstraction.
