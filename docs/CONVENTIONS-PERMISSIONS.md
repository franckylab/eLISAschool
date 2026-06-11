# Conventions de Nommage des Permissions eLISAschool

> **Version**: 2.0.0  
> **Auteur**: franck arlos chendjou  
> **Date**: 2026-06-11  
> **Statut**: ✅ EN VIGUEUR

---

## 📋 Table des Matières

1. [Principes Fondamentaux](#principes-fondamentaux)
2. [Structure des Permissions](#structure-des-permissions)
3. [Actions Standardisées](#actions-standardisées)
4. [Patterns par Module](#patterns-par-module)
5. [Permissions UI Avancées](#permissions-ui-avancées)
6. [Exemples Concrets](#exemples-concrets)
7. [Anti-Patterns à Éviter](#anti-patterns-à-éviter)
8. [Migration et Compatibilité](#migration-et-compatibilité)

---

## 🎯 Principes Fondamentaux

### 1. Format Standard

Toutes les permissions suivent le format :

```
module:entité:action
```

**Exemples** :
- ✅ `eleves:create`
- ✅ `notes:bulk:import`
- ✅ `finances:paiements:validate`

### 2. Règles de Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| **Module** | lowercase singulier | `eleves`, `notes`, `finances` |
| **Entité** | lowercase pluriel | `paiements`, `bulletins`, `classes` |
| **Action** | lowercase infinitif | `create`, `view`, `edit`, `delete` |
| **Sous-module** | lowercase | `bulk`, `tab`, `field`, `widget` |

### 3. Séparateur

Utiliser **exclusivement** le deux-points `:` comme séparateur.

❌ `eleves.create`, `eleves_create`, `eleves/create`  
✅ `eleves:create`

---

## 🏗️ Structure des Permissions

### Niveau 1 : Module de Base

```
{module}:view          # Voir la liste/le module
{module}:manage        # Gestion complète (admin)
{module}:create        # Créer un élément
{module}:edit          # Modifier un élément
{module}:delete        # Supprimer un élément
{module}:export        # Exporter des données
{module}:import        # Importer des données
```

**Exemple** :
```typescript
eleves:view            // Voir la liste des élèves
eleves:manage          // Gestion complète des élèves
eleves:create          // Créer un élève
eleves:edit            // Modifier un élève
eleves:delete          // Supprimer un élève
eleves:export          // Exporter la liste des élèves
eleves:import          // Importer des élèves (CSV)
```

### Niveau 2 : Entité Spécifique

```
{module}:{entité}:view
{module}:{entité}:create
{module}:{entité}:edit
{module}:{entité}:delete
{module}:{entité}:manage
```

**Exemple** :
```typescript
finances:paiements:view        # Voir les paiements
finances:paiements:create      # Créer un paiement
finances:paiements:validate    # Valider un paiement
finances:paiements:refund      # Rembourser un paiement
```

### Niveau 3 : Actions Spécialisées

```
{module}:{entité}:{action_spécifique}
```

**Exemple** :
```typescript
notes:bulk:create              # Création en masse de notes
eleves:radiation               # Radier un élève
bulletins:generer              # Générer les bulletins
cantine:solde:recharger        # Recharger le solde cantine
```

---

## ✅ Actions Standardisées

### CRUD de Base

| Action | Usage | Exemple |
|--------|-------|---------|
| `view` | Lecture seule, affichage | `eleves:view` |
| `create` | Création d'un nouvel élément | `eleves:create` |
| `edit` | Modification d'un élément existant | `eleves:edit` |
| `delete` | Suppression (soft ou hard) | `eleves:delete` |
| `manage` | Gestion complète (CRUD + actions spéciales) | `eleves:manage` |

### Import/Export

| Action | Usage | Exemple |
|--------|-------|---------|
| `export` | Exporter des données (CSV, PDF, Excel) | `eleves:export` |
| `import` | Importer des données depuis un fichier | `eleves:import` |
| `download` | Télécharger un fichier généré | `finances:recu:download` |
| `generate` | Générer un document | `bulletins:generate` |
| `print` | Imprimer un document | `bulletins:print` |

### Validation & Workflow

| Action | Usage | Exemple |
|--------|-------|---------|
| `validate` | Valider un élément | `notes:validate` |
| `approve` | Approuver une demande | `requetes:approve` |
| `reject` | Rejeter une demande | `finances:demande:reject` |
| `refuser` | Refuser (synonyme d'approve) | `requetes:refuser` |
| `annuler` | Annuler une action | `orientation:rdv:annuler` |
| `cloturer` | Clôturer une période | `annees:cloturer` |
| `activer` | Activer un élément | `annees:activer` |

### Actions en Masse

| Action | Usage | Exemple |
|--------|-------|---------|
| `bulk:create` | Création en masse | `notes:bulk:create` |
| `bulk:delete` | Suppression en masse | `eleves:bulk:delete` |
| `bulk:import` | Import en masse | `notes:bulk:import` |
| `bulk:export` | Export en masse | `notes:bulk:export` |

### Configuration & Administration

| Action | Usage | Exemple |
|--------|-------|---------|
| `config` | Configuration du module | `finances:scolarite:config` |
| `settings` | Paramètres | `notifications:configurer` |
| `toggle` | Activer/désactiver | `monitoring:maintenance:toggle` |

---

## 📦 Patterns par Module

### 1. Module Élèves

```typescript
// CRUD de base
eleves:view
eleves:create
eleves:edit
eleves:delete

// Actions spécialisées
eleves:import
eleves:export
eleves:radiation              // Radier un élève
eleves:reinscription          // Réinscrire un élève
eleves:documents:generate     // Générer des documents
eleves:historique:view        // Voir l'historique

// Actions en masse
eleves:bulk:delete            // Suppression en masse
eleves:bulk:export            // Export en masse

// Onglets spécifiques
eleves:tab:medical:view       // Voir l'onglet médical
eleves:tab:finances:view      // Voir l'onglet finances
eleves:tab:documents:view     // Voir l'onglet documents
```

### 2. Module Notes

```typescript
// CRUD
notes:view
notes:create
notes:edit
notes:delete

// Actions avancées
notes:validate                // Valider des notes
notes:bulk:create             // Saisie en masse
notes:import
notes:export
notes:statistiques:view       // Voir les statistiques

// Workflow
validation:notes:level1       // Validation niveau 1
validation:notes:level2       // Validation niveau 2
validation:notes:level3       // Validation niveau 3
```

### 3. Module Finances

```typescript
// Scolarité
finances:scolarite:view
finances:scolarite:config
finances:paiement:create
finances:paiement:validate
finances:paiement:refund
finances:recu:generate
finances:recu:download
finances:relance:send
finances:remise:grant
finances:echeancier:generate

// Dépenses
finances:depenses:view
finances:depenses:create
finances:depenses:validate
finances:depenses:payer

// Comptabilité
finances:comptabilite:view
finances:comptabilite:ecrire
finances:comptabilite:valider
finances:comptabilite:export

// Trésorerie
finances:tresorerie:view
finances:caisse:entrer
finances:caisse:sortir
finances:banque:virer

// Budget
finances:budget:view
finances:budget:create
finances:budget:validate
finances:budget:engager
finances:budget:consommer

// Dashboard & Rapports
finances:dashboard:view
finances:dashboard:export
finances:rapports:generer
```

---

## 🎨 Permissions UI Avancées

### 1. Widgets Dashboard

```
dashboard:widget:{nom}:view
```

**Exemples** :
```typescript
dashboard:widget:finances-summary:view    # Widget résumé finances
dashboard:widget:eleves-stats:view        # Widget statistiques élèves
dashboard:widget:absences:view            # Widget absences récentes
dashboard:widgets:view                    # Voir tous les widgets
```

### 2. Onglets (Tabs)

```
{module}:tab:{nom}:view
```

**Exemples** :
```typescript
eleves:tab:medical:view         # Onglet médical d'un élève
eleves:tab:finances:view        # Onglet financier
eleves:tab:documents:view       # Onglet documents
eleves:tab:notes:view           # Onglet notes
```

### 3. Champs de Formulaire

```
{module}:field:{nom}:{action}
```

**Exemples** :
```typescript
finances:field:remise:read      # Voir le champ remise
finances:field:remise:write     # Modifier le champ remise
finances:field:validation:read  # Voir le champ validation
eleves:field:medical:write      # Modifier infos médicales
```

### 4. Boutons et Actions UI

```
{module}:button:{action}:view
{module}:button:{action}:execute
```

**Exemples** :
```typescript
eleves:button:create:view       # Voir le bouton "Nouvel élève"
eleves:button:create:execute    # Exécuter l'action de création
eleves:button:export:view       # Voir le bouton "Exporter"
eleves:button:delete:execute    # Exécuter la suppression
```

### 5. Rapports

```
rapports:{nom}:generate
rapports:{nom}:export
rapports:{nom}:view
```

**Exemples** :
```typescript
rapports:bulletins:generate     # Générer rapport bulletins
rapports:finances:export        # Exporter rapport finances
rapports:absences:view          # Voir rapport absences
rapports:generer                # Permission générique rapports
```

---

## 📝 Exemples Concrets

### Exemple 1 : Contrôle d'un Bouton

```tsx
import { PermissionGate } from '@/components/permissions';

// ✅ CORRECT - Permission standard
<PermissionGate permission="eleves:create">
    <ElisaButton icon={<Plus />}>Nouvel élève</ElisaButton>
</PermissionGate>

// ✅ CORRECT - Avec fallback
<PermissionGate 
    permission="finances:remise:grant"
    fallback={<Tooltip>Permission requise pour accorder une remise</Tooltip>}
>
    <ElisaButton variant="outline">Accorder remise</ElisaButton>
</PermissionGate>
```

### Exemple 2 : Protection de Route

```tsx
import { RequirePermission } from '@/components/permissions';

// ✅ CORRECT - Protection par module
<RequirePermission module="eleves">
    <ElevesListPage />
</RequirePermission>

// ✅ CORRECT - Protection par permission spécifique
<RequirePermission permission="rapports:finances:generate">
    <RapportsFinanciersPage />
</RequirePermission>
```

### Exemple 3 : Hook dans un Composant

```tsx
import { useModulePermissions } from '@/hooks';

function ElevesPage() {
    const { canAccess, canCreate, canEdit, canDelete, canExport } = useModulePermissions('eleves');
    
    if (!canAccess) {
        return <Navigate to="/unauthorized" />;
    }
    
    return (
        <div>
            {canCreate && <Button>Nouvel élève</Button>}
            {canExport && <Button>Exporter</Button>}
            {/* ... */}
        </div>
    );
}
```

### Exemple 4 : Contrôle d'Onglet

```tsx
import { useCanViewTab } from '@/hooks';

function EleveDetail({ eleveId }: { eleveId: string }) {
    const canViewMedical = useCanViewTab('eleves', 'medical');
    const canViewFinances = useCanViewTab('eleves', 'finances');
    
    return (
        <Tabs>
            <TabsList>
                <TabsTrigger value="infos">Informations</TabsTrigger>
                {canViewMedical && <TabsTrigger value="medical">Médical</TabsTrigger>}
                {canViewFinances && <TabsTrigger value="finances">Finances</TabsTrigger>}
            </TabsList>
            {/* ... */}
        </Tabs>
    );
}
```

---

## 🚫 Anti-Patterns à Éviter

### ❌ 1. Mélanger les Conventions

```typescript
// ❌ INCORRECT - Incohérent
eleves:delete              // verbe
eleves:radiation           // nom
eleves:reinscription       // nom

// ✅ CORRECT - Tout en verbes
eleves:delete
eleves:radier
eleves:reinscrire
```

### ❌ 2. Utiliser des Majuscules

```typescript
// ❌ INCORRECT
eleves:Create
ELEVES:VIEW
Notes:bulk:import

// ✅ CORRECT
eleves:create
eleves:view
notes:bulk:import
```

### ❌ 3. Séparateurs Incohérents

```typescript
// ❌ INCORRECT
eleves.create
eleves_create
eleves/create

// ✅ CORRECT
eleves:create
```

### ❌ 4. Permissions Trop Vagues

```typescript
// ❌ INCORRECT - Trop vague
eleves:all
eleves:everything
finances:full

// ✅ CORRECT - Explicite
eleves:manage
finances:manage
// OU lister toutes les permissions spécifiques
```

### ❌ 5. Noms d'Entités au Singulier

```typescript
// ❌ INCORRECT
finance:paiement:view
note:bulk:create

// ✅ CORRECT
finances:paiements:view
notes:bulk:create
```

---

## 🔄 Migration et Compatibilité

### Permissions Existantes à Corriger

| Ancien | Nouveau | Statut |
|--------|---------|--------|
| `eleves:radiation` | `eleves:radier` | ⚠️ À migrer |
| `eleves:reinscription` | `eleves:reinscrire` | ⚠️ À migrer |
| `finances:paiement:create` | `finances:paiements:create` | ⚠️ À migrer |
| `bulletins:generer` | `bulletins:generate` | ⚠️ À migrer |

### Stratégie de Migration

1. **Créer les nouvelles permissions** en parallèle des anciennes
2. **Mettre à jour le code** pour utiliser les nouvelles permissions
3. **Tester** thoroughly
4. **Supprimer les anciennes permissions** après validation
5. **Documenter** le changement dans le changelog

### Script de Migration (exemple)

```sql
-- Ajouter la nouvelle permission
INSERT INTO permissions (code, libelle, module, action)
SELECT 'eleves:radier', libelle, module, 'radier'
FROM permissions
WHERE code = 'eleves:radiation'
ON CONFLICT (code) DO NOTHING;

-- Mettre à jour les rôles
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT rp."roleId", p2.id
FROM role_permissions rp
JOIN permissions p1 ON rp."permissionId" = p1.id
JOIN permissions p2 ON p2.code = 'eleves:radier'
WHERE p1.code = 'eleves:radiation'
ON CONFLICT DO NOTHING;
```

---

## 📊 Matrice de Décision

| Besoin | Permission à Utiliser |
|--------|----------------------|
| Voir une page/liste | `{module}:view` |
| Créer un élément | `{module}:create` |
| Modifier un élément | `{module}:edit` |
| Supprimer un élément | `{module}:delete` |
| Gestion complète | `{module}:manage` |
| Exporter des données | `{module}:export` |
| Importer des données | `{module}:import` |
| Voir un onglet | `{module}:tab:{nom}:view` |
| Voir un champ | `{module}:field:{nom}:read` |
| Modifier un champ | `{module}:field:{nom}:write` |
| Voir un widget | `dashboard:widget:{nom}:view` |
| Générer un rapport | `rapports:{nom}:generate` |
| Action en masse | `{module}:bulk:{action}` |
| Validation workflow | `validation:{module}:level{N}` |

---

## ✅ Checklist de Validation

Avant de créer une nouvelle permission, vérifier :

- [ ] Format `module:entite:action` respecté
- [ ] Tous en lowercase
- [ ] Entité au pluriel
- [ ] Action à l'infinitif
- [ ] Pas de doublon avec une permission existante
- [ ] Permission ajoutée dans `roles.enum.ts`
- [ ] Permission ajoutée dans les seeds
- [ ] Documentation mise à jour
- [ ] Tests unitaires écrits

---

## 📚 Références

- [Enum Permission](../../../shared/src/enums/roles.enum.ts) - Définition de toutes les permissions
- [PermissionResolverService](../../../backend/src/modules/auth/services/permission-resolver.service.ts) - Résolution des permissions
- [usePermissions Hook](../../../frontend/src/hooks/use-permissions.ts) - Hook frontend de base
- [useModulePermissions Hook](../../../frontend/src/hooks/use-permissions-advanced.ts) - Hook avancé par module
- [PermissionGate Component](../../../frontend/src/components/permissions/PermissionGate.tsx) - Composant UI de contrôle
- [RequirePermission Component](../../../frontend/src/components/permissions/RequirePermission.tsx) - Protection de routes

---

**Mainteneur**: franck arlos chendjou  
**Dernière mise à jour**: 2026-06-11  
**Prochaine revue**: 2026-09-11
