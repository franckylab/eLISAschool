# Guide d'Utilisation du Système de Permissions eLISAschool

> **Version**: 2.0.0  
> **Date**: 2026-06-11  
> **Statut**: ✅ PRODUCTION READY

---

## 🎯 Résumé des Implémentations

### ✅ Backend (API)

1. **Endpoint `/api/auth/me` étendu**
   - Retourne maintenant les permissions complètes de l'utilisateur
   - Inclut les rôles avec détails (principal/secondaire)
   - Fichier modifié : `backend/src/modules/auth/services/auth.service.ts`

2. **PermissionResolverService** (existant, inchangé)
   - Résolution des permissions avec héritage de rôles
   - Cache triple niveau (Redis + In-memory + Global)
   - Support multi-rôles et permissions personnalisées GRANTED/DENIED

---

### ✅ Frontend (React)

#### 1. Store d'Authentification Mis à Jour

**Fichier** : `frontend/src/stores/auth.store.ts`

```typescript
// Après login, les permissions sont automatiquement chargées
const utilisateur = {
    id, email, role, nom, prenom,
    permissions: ['eleves:view', 'eleves:create', ...], // ✅ NOUVEAU
    roles: [{ code: 'ADMIN', libelle: 'Administrateur', estPrincipal: true }] // ✅ NOUVEAU
};
```

#### 2. Hooks Avancés de Permissions

**Fichier** : `frontend/src/hooks/use-permissions-advanced.ts`

| Hook | Usage | Exemple |
|------|-------|---------|
| `useModulePermissions(module)` | Accès complet à un module | `const { canAccess, canCreate } = useModulePermissions('eleves')` |
| `useCanAccess(module)` | Vérifier accès route | `const canAccess = useCanAccess('finances')` |
| `useCanViewWidget(widget)` | Voir widget dashboard | `const canView = useCanViewWidget('finances-summary')` |
| `useCanViewTab(module, tab)` | Voir onglet | `const canView = useCanViewTab('eleves', 'medical')` |
| `useCanAccessField(module, field, type)` | Voir/modifier champ | `const canEdit = useCanAccessField('finances', 'remise', 'write')` |
| `useCanBulkAction(module, action)` | Action en masse | `const canDelete = useCanBulkAction('eleves', 'delete')` |
| `useCanGenerateReport(report)` | Générer rapport | `const canGen = useCanGenerateReport('bulletins')` |

#### 3. Composants de Contrôle d'Accès

**Répertoire** : `frontend/src/components/permissions/`

| Composant | Usage | Exemple |
|-----------|-------|---------|
| `PermissionGate` | Contrôle conditionnel UI | `<PermissionGate permission="eleves:create"><Button>...</Button></PermissionGate>` |
| `PermissionButton` | Bouton avec permission | `<PermissionButton permission="delete"><IconDelete /></PermissionButton>` |
| `PermissionMessage` | Message si pas accès | `<PermissionMessage permission="rapports:finances">Contactez admin</PermissionMessage>` |
| `RequirePermission` | Protection de route | `<RequirePermission module="eleves"><ElevesPage /></RequirePermission>` |
| `RequireRole` | Protection par rôle | `<RequireRole roles={['ADMIN']}><AdminPanel /></RequireRole>` |

#### 4. Page d'Accès Non Autorisé

**Fichier** : `frontend/src/features/system/components/unauthorized-page.tsx`

- Design moderne avec animations Framer Motion
- Affiche la page demandée et le rôle de l'utilisateur
- Messages personnalisés selon le rôle (admin vs utilisateur)
- Actions : Retour, Dashboard, Contacter admin
- Notes de diagnostic pour les administrateurs

#### 5. Sidebar Filtré par Permissions

**Fichier** : `frontend/src/components/layout/Sidebar.tsx`

- Masque automatiquement les modules non accessibles
- Vérifie les permissions `:view` ou `:manage` pour chaque module
- Sections vides automatiquement masquées
- Dashboard et Configuration toujours visibles

---

## 📖 Guide d'Utilisation Rapide

### 1. Contrôle d'Affichage d'un Bouton

```tsx
import { PermissionGate } from '@/components/permissions';

function ElevesList() {
    return (
        <div>
            {/* Bouton visible uniquement si permission eleves:create */}
            <PermissionGate permission="eleves:create">
                <ElisaButton variant="primary" icon={<Plus />}>
                    Nouvel élève
                </ElisaButton>
            </PermissionGate>
            
            {/* Avec fallback personnalisé */}
            <PermissionGate 
                permission="eleves:export"
                fallback={<span className="text-gray-400">Export non disponible</span>}
            >
                <ElisaButton variant="outline" icon={<Download />}>
                    Exporter CSV
                </ElisaButton>
            </PermissionGate>
        </div>
    );
}
```

### 2. Protection d'une Route

```tsx
import { RequirePermission } from '@/components/permissions';
import { ElevesPage } from '@/features/eleves';

// Dans votre fichier de routes
<Route 
    path="/eleves" 
    element={
        <RequirePermission module="eleves" redirectTo="/unauthorized">
            <ElevesPage />
        </RequirePermission>
    } 
/>
```

### 3. Utilisation des Hooks Avancés

```tsx
import { useModulePermissions, useCanViewTab } from '@/hooks';

function EleveDetail({ eleveId }: { eleveId: string }) {
    // Permissions complètes du module élèves
    const { canAccess, canCreate, canEdit, canDelete, canExport } = useModulePermissions('eleves');
    
    // Permissions pour onglets spécifiques
    const canViewMedical = useCanViewTab('eleves', 'medical');
    const canViewFinances = useCanViewTab('eleves', 'finances');
    
    if (!canAccess) {
        return <Navigate to="/unauthorized" />;
    }
    
    return (
        <div>
            <h1>Détail Élève</h1>
            
            {/* Boutons conditionnels */}
            {canEdit && <Button>Modifier</Button>}
            {canDelete && <Button variant="danger">Supprimer</Button>}
            {canExport && <Button>Exporter</Button>}
            
            {/* Onglets conditionnels */}
            <Tabs>
                <TabsList>
                    <TabsTrigger value="infos">Informations</TabsTrigger>
                    {canViewMedical && <TabsTrigger value="medical">Médical</TabsTrigger>}
                    {canViewFinances && <TabsTrigger value="finances">Finances</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="infos">...</TabsContent>
                {canViewMedical && <TabsContent value="medical">...</TabsContent>}
                {canViewFinances && <TabsContent value="finances">...</TabsContent>}
            </Tabs>
        </div>
    );
}
```

### 4. Contrôle d'Accès Programmatique

```tsx
import { useRequirePermission } from '@/components/permissions';

function PageSecrete() {
    // Redirige automatiquement vers /unauthorized si pas de permission
    useRequirePermission('rapports:avances');
    
    return (
        <div>
            <h1>Rapports Avancés</h1>
            {/* Contenu sécurisé */}
        </div>
    );
}
```

### 5. PermissionButton avec Tooltip

```tsx
import { PermissionButton } from '@/components/permissions';

function ActionsBar() {
    return (
        <div className="flex gap-2">
            <PermissionButton 
                permission="eleves:delete"
                disabledMessage="Vous n'avez pas la permission de supprimer des élèves"
            >
                <ElisaButton variant="danger" icon={<Trash />}>
                    Supprimer
                </ElisaButton>
            </PermissionButton>
        </div>
    );
}
```

---

## 🔧 Configuration des Routes

### Exemple Complet de Fichier de Routes

```tsx
import { createRouter } from '@tanstack/react-router';
import { RequirePermission } from '@/components/permissions';

// Import des pages
import { DashboardPage } from '@/features/dashboard';
import { ElevesPage } from '@/features/eleves';
import { NotesPage } from '@/features/notes';
import { FinancesPage } from '@/features/finances';
import { UnauthorizedPage } from '@/features/system/components/unauthorized-page';

const routeTree = createRootRoute({
    children: [
        // Route publique
        createRoute({
            path: '/login',
            component: LoginPage,
        }),
        
        // Routes protégées par authentification uniquement
        createRoute({
            path: '/dashboard',
            element: <RequirePermission><DashboardPage /></RequirePermission>,
        }),
        
        // Routes protégées par module
        createRoute({
            path: '/eleves',
            element: <RequirePermission module="eleves"><ElevesPage /></RequirePermission>,
        }),
        
        createRoute({
            path: '/notes',
            element: <RequirePermission module="notes"><NotesPage /></RequirePermission>,
        }),
        
        // Routes protégées par permission spécifique
        createRoute({
            path: '/finances',
            element: (
                <RequirePermission 
                    permissions={['finances:view', 'finances:manage']}
                    mode="any"
                >
                    <FinancesPage />
                </RequirePermission>
            ),
        }),
        
        // Page d'erreur accès refusé
        createRoute({
            path: '/unauthorized',
            component: UnauthorizedPage,
        }),
    ],
});

export const router = createRouter({ routeTree });
```

---

## 📊 Exemples de Permissions par Rôle

### SUPER_ADMIN
```typescript
// Toutes les permissions (automatique)
permissions: Object.values(Permission)
```

### ADMIN
```typescript
permissions: [
    'eleves:view', 'eleves:create', 'eleves:edit', 'eleves:delete',
    'notes:view', 'notes:create', 'notes:edit', 'notes:validate',
    'finances:view', 'finances:manage',
    'utilisateurs:manage',
    'config:edit',
    // ... ~100 permissions
]
```

### ENSEIGNANT
```typescript
permissions: [
    'eleves:view',
    'notes:view', 'notes:create', 'notes:edit',
    'bulletins:view',
    'clubs:view', 'clubs:manage',
    'messagerie:envoyer',
    // ... ~20 permissions
]
```

### PARENT
```typescript
permissions: [
    'notes:view',
    'bulletins:view',
    'cantine:view',
    'transport:view',
    'messagerie:envoyer',
    // ... ~10 permissions
]
```

---

## 🎨 Patterns de Conception Recommandés

### 1. Pattern "Permission Hook + Conditional Render"

```tsx
function MaPage() {
    const perms = useModulePermissions('monModule');
    
    if (!perms.canAccess) {
        return <Navigate to="/unauthorized" />;
    }
    
    return (
        <div>
            {perms.canCreate && <Button>Créer</Button>}
            {perms.canExport && <Button>Exporter</Button>}
            {/* ... */}
        </div>
    );
}
```

### 2. Pattern "PermissionGate avec Fallback Informatif"

```tsx
<PermissionGate 
    permission="finances:remise:grant"
    fallback={
        <Tooltip content="Seuls les administrateurs peuvent accorder des remises">
            <span className="opacity-50">
                <Button disabled>Accorder remise</Button>
            </span>
        </Tooltip>
    }
>
    <Button>Accorder remise</Button>
</PermissionGate>
```

### 3. Pattern "Table avec Actions Conditionnelles"

```tsx
function ElevesTable({ eleves }: { eleves: Eleve[] }) {
    const { canEdit, canDelete, canView } = useModulePermissions('eleves');
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Classe</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {eleves.map(eleve => (
                    <TableRow key={eleve.id}>
                        <TableCell>{eleve.nom}</TableCell>
                        <TableCell>{eleve.classe}</TableCell>
                        {(canEdit || canDelete) && (
                            <TableCell>
                                {canEdit && <Button onClick={() => edit(eleve)}>Modifier</Button>}
                                {canDelete && <Button variant="danger" onClick={() => delete(eleve.id)}>Supprimer</Button>}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

---

## 🔍 Diagnostic et Debugging

### 1. Vérifier les Permissions d'un Utilisateur

```typescript
// Dans la console du navigateur (après connexion)
const store = useAuthStore.getState();
console.log('Permissions:', store.utilisateur?.permissions);
console.log('Rôle:', store.utilisateur?.role);
console.log('Rôles:', store.utilisateur?.roles);
```

### 2. Tester une Permission

```tsx
function DebugPermissions() {
    const { hasPermission, permissions } = usePermissions();
    
    return (
        <div className="p-4 bg-gray-100">
            <h3>Debug Permissions</h3>
            <p>Total permissions: {permissions?.length || 0}</p>
            <p>eleves:create: {hasPermission('eleves:create') ? '✅' : '❌'}</p>
            <p>eleves:delete: {hasPermission('eleves:delete') ? '✅' : '❌'}</p>
            <p>finances:manage: {hasPermission('finances:manage') ? '✅' : '❌'}</p>
        </div>
    );
}
```

### 3. Logs Console

Le système logue automatiquement les accès refusés :

```
[RequirePermission] Accès refusé à /finances - Permission requise: finances:view
[useRequirePermission] Accès refusé à /rapports/avances
```

---

## 📝 Migration depuis l'Ancien Système

### Avant (Ancien Système)

```tsx
// ❌ Ancien approach - Pas de contrôle de route
function ElevesPage() {
    const { hasPermission } = usePermissions();
    
    return (
        <div>
            {hasPermission('eleves:create') && <Button>Créer</Button>}
            {/* Page accessible même sans permission eleves:view */}
        </div>
    );
}
```

### Après (Nouveau Système)

```tsx
// ✅ Nouveau approach - Contrôle complet
function ElevesPage() {
    useRequirePermission('eleves'); // Redirige si pas accès
    
    const { canCreate, canEdit, canDelete } = useModulePermissions('eleves');
    
    return (
        <div>
            {canCreate && <Button>Créer</Button>}
            {canEdit && <Button>Modifier</Button>}
            {canDelete && <Button variant="danger">Supprimer</Button>}
        </div>
    );
}
```

---

## 🚀 Prochaines Étapes Recommandées

1. **Ajouter les guards de routes** dans votre fichier de routing principal
2. **Remplacer les vérifications manuelles** `hasPermission()` par les hooks avancés
3. **Utiliser PermissionGate** pour tous les boutons conditionnels
4. **Tester tous les rôles** pour vérifier que le filtrage fonctionne correctement
5. **Documenter les permissions spécifiques** à votre établissement dans `CONVENTIONS-PERMISSIONS.md`

---

## 📚 Références

- [Conventions de Nommage](./CONVENTIONS-PERMISSIONS.md) - Guide complet du nommage
- [Enum Permission](../shared/src/enums/roles.enum.ts) - Toutes les permissions définies
- [usePermissions Hook](../frontend/src/hooks/use-permissions.ts) - Hook de base
- [Hooks Avancés](../frontend/src/hooks/use-permissions-advanced.ts) - Hooks spécialisés
- [Composants Permissions](../frontend/src/components/permissions/) - Tous les composants
- [Page Unauthorized](../frontend/src/features/system/components/unauthorized-page.tsx) - Page d'erreur

---

**Mainteneur**: franck arlos chendjou  
**Statut**: ✅ PRODUCTION READY  
**Dernière mise à jour**: 2026-06-11
