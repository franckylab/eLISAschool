# 🧪 GUIDE DE TEST MULTI-RÔLES - Système de Permissions v2.0

> **Date**: 2026-06-11  
> **Objectif**: Valider le bon fonctionnement des permissions pour chaque rôle  
> **Auteur**: franck arlos chendjou

---

## 📋 PRÉREQUIS

### 1. Activer le Debug Panel

Dans `App.tsx` ou votre layout principal :

```tsx
import { DebugPermissions } from '@/components/debug/DebugPermissions';

function App() {
    return (
        <>
            <Router />
            {import.meta.env.DEV && <DebugPermissions />}
        </>
    );
}
```

### 2. Vérifier les Permissions en Base

Exécuter le script de vérification :

```bash
node scripts/check-permissions.js
```

### 3. Créer des Utilisateurs de Test

```sql
-- SUPER_ADMIN
INSERT INTO utilisateurs (email, role, ...) VALUES ('superadmin@test.com', 'SUPER_ADMIN', ...);

-- ADMIN
INSERT INTO utilisateurs (email, role, ...) VALUES ('admin@test.com', 'ADMIN', ...);

-- ENSEIGNANT
INSERT INTO utilisateurs (email, role, ...) VALUES ('enseignant@test.com', 'ENSEIGNANT', ...);

-- PARENT
INSERT INTO utilisateurs (email, role, ...) VALUES ('parent@test.com', 'PARENT', ...);

-- ELEVE
INSERT INTO utilisateurs (email, role, ...) VALUES ('eleve@test.com', 'ELEVE', ...);
```

---

## 🎯 SCÉNARIOS DE TEST PAR RÔLE

### TEST 1 : SUPER_ADMIN

**Connexion** : `superadmin@test.com`

#### ✅ Attendu

| Test | Résultat Attendu |
|------|------------------|
| Sidebar | TOUS les modules visibles |
| Route /eleves | ✅ Accès autorisé |
| Route /classes | ✅ Accès autorisé |
| Route /notes | ✅ Accès autorisé |
| Route /finances | ✅ Accès autorisé (si existe) |
| Route /configuration | ✅ Accès autorisé |
| Route /admin/roles | ✅ Accès autorisé |
| Onglet Médical (élève) | ✅ Visible |
| Onglet Financier (élève) | ✅ Visible |
| Bouton Créer | ✅ Visible partout |
| Bouton Éditer | ✅ Visible partout |
| Bouton Supprimer | ✅ Visible partout |
| Page /unauthorized | ❌ JAMAIS affichée |

#### 🔍 Vérifications Debug Panel

Le panel DebugPermissions doit montrer :
- **Rôle** : SUPER_ADMIN
- **Admin** : ✅
- **Super Admin** : ✅
- **Total permissions** : ~230 (TOUTES)

---

### TEST 2 : ADMIN

**Connexion** : `admin@test.com`

#### ✅ Attendu

| Test | Résultat Attendu |
|------|------------------|
| Sidebar | TOUS les modules visibles |
| Route /eleves | ✅ Accès autorisé |
| Route /classes | ✅ Accès autorisé |
| Route /notes | ✅ Accès autorisé |
| Route /finances | ✅ Accès autorisé |
| Route /configuration | ✅ Accès autorisé |
| Route /admin/roles | ⚠️ Selon permissions |
| Onglet Médical (élève) | ✅ Visible |
| Onglet Financier (élève) | ✅ Visible |
| Bouton Créer | ✅ Visible |
| Bouton Éditer | ✅ Visible |
| Bouton Supprimer | ✅ Visible |
| Page /unauthorized | ❌ Rarement affichée |

#### 🔍 Vérifications Debug Panel

- **Rôle** : ADMIN
- **Admin** : ✅
- **Super Admin** : ❌
- **Total permissions** : ~200 (presque toutes)

---

### TEST 3 : ENSEIGNANT

**Connexion** : `enseignant@test.com`

#### ✅ Attendu

| Test | Résultat Attendu |
|------|------------------|
| Sidebar | Modules limités visibles |
| - eleves | ✅ Visible (ses classes) |
| - notes | ✅ Visible |
| - bulletins | ✅ Visible |
| - classes | ✅ Visible (ses classes) |
| - finances | ❌ Masqué |
| - configuration | ❌ Masqué |
| - admin/* | ❌ Masqué |
| Route /eleves | ✅ Accès autorisé |
| Route /notes | ✅ Accès autorisé |
| Route /finances | ❌ → /unauthorized |
| Route /configuration | ❌ → /unauthorized |
| Onglet Médical (élève) | ❌ Masqué |
| Onglet Financier (élève) | ❌ Masqué |
| Bouton Créer Notes | ✅ Visible |
| Bouton Supprimer Élève | ❌ Masqué |
| Page /unauthorized | ✅ Affichée si accès direct |

#### 🔍 Vérifications Debug Panel

- **Rôle** : ENSEIGNANT
- **Admin** : ❌
- **Super Admin** : ❌
- **Total permissions** : ~50-80

#### 🎯 Tests Spécifiques

1. **Saisie de notes** : ✅ Autorisée
2. **Voir ses classes** : ✅ Autorisé
3. **Modifier un élève** : ❌ Interdit
4. **Accéder aux finances** : ❌ Interdit
5. **Exporter les bulletins** : ✅ Autorisé (ses classes)

---

### TEST 4 : PARENT

**Connexion** : `parent@test.com`

#### ✅ Attendu

| Test | Résultat Attendu |
|------|------------------|
| Sidebar | Modules limités |
| - eleves | ✅ Visible (ses enfants) |
| - bulletins | ✅ Visible |
| - notes | ✅ Visible (ses enfants) |
| - finances | ✅ Visible (ses paiements) |
| - notes (saisie) | ❌ Masqué |
| - configuration | ❌ Masqué |
| Route /eleves | ✅ Accès (lecture seule) |
| Route /bulletins | ✅ Accès |
| Route /finances | ✅ Accès (ses paiements) |
| Route /notes (saisie) | ❌ → /unauthorized |
| Onglet Médical (enfant) | ✅ Visible (ses enfants) |
| Onglet Financier | ✅ Visible (ses paiements) |
| Bouton Créer | ❌ Masqué |
| Bouton Éditer | ❌ Masqué |
| Bouton Supprimer | ❌ Masqué |

#### 🔍 Vérifications Debug Panel

- **Rôle** : PARENT
- **Admin** : ❌
- **Super Admin** : ❌
- **Total permissions** : ~30-50

#### 🎯 Tests Spécifiques

1. **Voir profil enfant** : ✅ Autorisé
2. **Voir notes enfant** : ✅ Autorisé
3. **Voir paiements** : ✅ Autorisé
4. **Modifier notes** : ❌ Interdit
5. **Supprimer quoi que ce soit** : ❌ Interdit

---

### TEST 5 : ELEVE

**Connexion** : `eleve@test.com`

#### ✅ Attendu

| Test | Résultat Attendu |
|------|------------------|
| Sidebar | Modules très limités |
| - bulletins | ✅ Visible |
| - notes | ✅ Visible (les siennes) |
| - eleves | ❌ Masqué |
| - finances | ✅ Visible (ses paiements) |
| - configuration | ❌ Masqué |
| Route /bulletins | ✅ Accès |
| Route /notes | ✅ Accès (lecture) |
| Route /eleves | ❌ → /unauthorized |
| Route /finances | ✅ Accès (ses paiements) |
| Onglet Médical | ⚠️ Selon config |
| Bouton Créer | ❌ Masqué |
| Bouton Éditer | ❌ Masqué |
| Bouton Supprimer | ❌ Masqué |

#### 🔍 Vérifications Debug Panel

- **Rôle** : ELEVE
- **Admin** : ❌
- **Super Admin** : ❌
- **Total permissions** : ~20-30

#### 🎯 Tests Spécifiques

1. **Voir ses notes** : ✅ Autorisé
2. **Voir ses bulletins** : ✅ Autorisé
3. **Voir ses paiements** : ✅ Autorisé
4. **Modifier quoi que ce soit** : ❌ Interdit
5. **Voir autres élèves** : ❌ Interdit

---

## 📝 CHECKLIST DE TEST COMPLÈTE

### Routes Protégées

- [ ] /eleves → accessible selon rôle
- [ ] /eleves/:id → accessible selon rôle
- [ ] /classes → accessible selon rôle
- [ ] /notes → accessible selon rôle
- [ ] /bulletins → accessible selon rôle
- [ ] /matieres → accessible selon rôle
- [ ] /personnel → accessible selon rôle
- [ ] /finances → accessible selon rôle
- [ ] /configuration → accessible selon rôle
- [ ] /admin/settings → ADMIN/SUPER_ADMIN uniquement
- [ ] /admin/roles → SUPER_ADMIN uniquement

### Onglets Sensibles

- [ ] Onglet Médical Élève
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ❌ Masqué
  - [ ] PARENT : ✅ Visible (ses enfants)
  - [ ] ELEVE : ⚠️ Selon config

- [ ] Onglet Financier Élève
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ❌ Masqué
  - [ ] PARENT : ✅ Visible (ses enfants)
  - [ ] ELEVE : ❌ Masqué

- [ ] Onglet Disciplinaire
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ⚠️ Selon permissions
  - [ ] PARENT : ✅ Visible (ses enfants)
  - [ ] ELEVE : ❌ Masqué

### Boutons Conditionnels

- [ ] Bouton "Nouvel Élève"
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ❌ Masqué
  - [ ] PARENT : ❌ Masqué
  - [ ] ELEVE : ❌ Masqué

- [ ] Bouton "Modifier"
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ⚠️ Selon entité
  - [ ] PARENT : ❌ Masqué
  - [ ] ELEVE : ❌ Masqué

- [ ] Bouton "Supprimer"
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ❌ Masqué
  - [ ] PARENT : ❌ Masqué
  - [ ] ELEVE : ❌ Masqué

- [ ] Bouton "Exporter"
  - [ ] SUPER_ADMIN : ✅ Visible
  - [ ] ADMIN : ✅ Visible
  - [ ] ENSEIGNANT : ✅ Visible (ses données)
  - [ ] PARENT : ⚠️ Selon config
  - [ ] ELEVE : ⚠️ Selon config

### Page Unauthorized

- [ ] S'affiche quand accès refusé
- [ ] Montre la page demandée
- [ ] Montre le rôle actuel
- [ ] Bouton "Retour" fonctionne
- [ ] Bouton "Dashboard" fonctionne
- [ ] Notes admin visibles pour ADMIN/SUPER_ADMIN

### Debug Panel (DEV uniquement)

- [ ] Visible en développement
- [ ] Masqué en production
- [ ] Affiche le rôle correctement
- [ ] Affiche le nombre de permissions
- [ ] Tests rapides fonctionnent
- [ ] Recherche de permissions fonctionne
- [ ] Filtrage par module fonctionne
- [ ] Cliquer copie la permission

---

## 🐛 DÉPANNAGE

### Problème : Sidebar affiche tous les modules pour ENSEIGNANT

**Cause** : Les hooks ne sont pas appelés correctement dans Sidebar.tsx

**Solution** :
```tsx
// Vérifier que les hooks sont au niveau composant
const elevesPerms = useModulePermissions('eleves');
const notesPerms = useModulePermissions('notes');
// PAS dans un callback .map() !
```

### Problème : Page /unauthorized ne s'affiche pas

**Cause** : Le guard de route n'est pas configuré

**Solution** :
```tsx
// Dans la route
export const Route = createFileRoute('/_auth/eleves')({
    beforeLoad: () => requireModulePermission('eleves'),
    component: ElevesPage,
});
```

### Problème : Boutons toujours visibles

**Cause** : PermissionGate mal utilisé ou permission incorrecte

**Solution** :
```tsx
// Vérifier la permission dans Debug Panel
<PermissionGate permission="eleves:create">
    <Button>Créer</Button>
</PermissionGate>
```

### Problème : Permissions vides après login

**Cause** : Endpoint /me ne retourne pas les permissions

**Solution** :
```typescript
// Vérifier auth.service.ts
async getCurrentUser(utilisateurId: string) {
    const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateurId);
    return {
        ...,
        permissions: Array.from(resolvedPermissions), // ✅
    };
}
```

---

## 📊 RAPPORT DE TEST

### Template de Rapport

```markdown
## Test Role: [ROLE]
Date: YYYY-MM-DD
Testé par: [Nom]

### Routes
- [ ] /eleves: ✅/❌
- [ ] /notes: ✅/❌
- [ ] /finances: ✅/❌

### Onglets Sensibles
- [ ] Médical: ✅/❌
- [ ] Financier: ✅/❌

### Boutons
- [ ] Créer: ✅/❌
- [ ] Éditer: ✅/❌
- [ ] Supprimer: ✅/❌

### Bugs Trouvés
1. [Description]
2. [Description]

### Commentaires
[Notes]
```

---

## ✅ VALIDATION FINALE

Avant de pousser en production :

- [ ] TOUS les rôles testés individuellement
- [ ] Sidebar vérifié pour chaque rôle
- [ ] Routes protégées testées (accès direct par URL)
- [ ] Onglets sensibles vérifiés
- [ ] Boutons conditionnels vérifiés
- [ ] Page /unauthorized testée
- [ ] Debug Panel vérifié (visible en DEV, masqué en PROD)
- [ ] Script check-permissions.js exécuté sans erreurs
- [ ] Aucune régression sur les fonctionnalités existantes

---

## 🚀 DÉPLOIEMENT

### 1. Merge vers staging

```bash
git checkout staging
git merge feature/permissions-v2
git push origin staging
```

### 2. Tests sur staging

- [ ] Exécuter TOUS les tests ci-dessus
- [ ] Corriger les bugs trouvés
- [ ] Re-tester après corrections

### 3. Merge vers production

```bash
git checkout main
git merge staging
git push origin main
```

### 4. Vérification post-déploiement

- [ ] Debug Panel masqué en production
- [ ] Tous les rôles fonctionnent
- [ ] Aucune erreur dans les logs
- [ ] Performance impact négligeable

---

**Document créé le**: 2026-06-11  
**Version**: 1.0.0  
**Mainteneur**: franck arlos chendjou
