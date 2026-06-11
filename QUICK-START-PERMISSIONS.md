# 🎯 QUICK START - Système de Permissions v2.0

> Guide ultra-rapide pour utiliser le nouveau système de permissions

---

## 🚀 En 3 Minutes

### 1. Protéger une Route

```tsx
import { RequirePermission } from '@/components/permissions';

<RequirePermission module="eleves">
    <ElevesPage />
</RequirePermission>
```

### 2. Contrôler un Bouton

```tsx
import { PermissionGate } from '@/components/permissions';

<PermissionGate permission="eleves:create">
    <Button>Nouvel élève</Button>
</PermissionGate>
```

### 3. Utiliser un Hook

```tsx
import { useModulePermissions } from '@/hooks';

const { canCreate, canEdit, canDelete } = useModulePermissions('eleves');

return (
    <>
        {canCreate && <Button>Créer</Button>}
        {canEdit && <Button>Modifier</Button>}
    </>
);
```

---

## 📚 Documentation Complète

- **[Guide d'utilisation](./docs/GUIDE-PERMISSIONS-FRONTEND.md)** (510 lignes)
- **[Conventions de nommage](./docs/CONVENTIONS-PERMISSIONS.md)** (589 lignes)
- **[Exemples d'intégration](./docs/EXEMPLE-INTEGRATION-PERMISSIONS.md)** (586 lignes)
- **[Résumé complet](./RESUME-IMPLÉMENTATION-PERMISSIONS-FRONTEND.md)** (477 lignes)

---

## 🛠️ Outils Disponibles

### Hooks (7)
- `useModulePermissions('eleves')` - Accès complet
- `useCanAccess('notes')` - Vérification route
- `useCanViewTab('eleves', 'medical')` - Onglets
- `useCanAccessField('finances', 'remise', 'write')` - Champs
- `useCanBulkAction('notes', 'import')` - Actions en masse
- `useCanViewWidget('dashboard-notes')` - Widgets
- `useCanGenerateReport('bulletins')` - Rapports

### Composants (6)
- `<RequirePermission>` - Protection route
- `<RequireRole>` - Protection par rôle
- `<PermissionGate>` - Contrôle conditionnel
- `<PermissionButton>` - Bouton avec tooltip
- `<PermissionMessage>` - Message informatif
- `<DebugPermissions>` - Panel debug (dev only)

### Scripts
```bash
# Vérifier les permissions
node scripts/check-permissions.js
```

---

## ⚡ Pattern Recommandé

```tsx
// ❌ AVANT - Verbose et répétitif
import { usePermissions } from '@/hooks';
const { hasPermission } = usePermissions();

if (!hasPermission('eleves:create')) return null;
if (!hasPermission('eleves:edit')) return null;

// ✅ APRÈS - Concis et maintenable
import { useModulePermissions, PermissionGate } from '@/hooks';
const { canCreate, canEdit } = useModulePermissions('eleves');

<PermissionGate permission="eleves:create">
    <Button>Créer</Button>
</PermissionGate>
```

---

## 📞 Besoin d'Aide ?

- Lire la [documentation complète](./docs/GUIDE-PERMISSIONS-FRONTEND.md)
- Voir les [exemples concrets](./docs/EXEMPLE-INTEGRATION-PERMISSIONS.md)
- Utiliser `<DebugPermissions />` en développement
- Exécuter `node scripts/check-permissions.js`

---

**Version** : 2.0.0 | **Date** : 2026-06-11 | **Auteur** : franck arlos chendjou
