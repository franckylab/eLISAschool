# Correction EtablissementSwitcher - Token Incomplet

## 🚨 Problème Identifié

**Erreur** :
```
[EtablissementSwitcher] Erreur chargement: Error: Token incomplet: veuillez sélectionner votre établissement
    at ApiClient.request (api-client.ts:252:19)
    at ApiClient.getEtablissementsDisponibles (api-client.ts:501:37)
```

**Contexte** : Lorsqu'un utilisateur se connecte mais n'a pas encore sélectionné son établissement (multi-établissements), le token ne contient pas d'`etablissementId`. Le composant `EtablissementSwitcher` essaie quand même de charger la liste des établissements disponibles, ce qui échoue car la route n'est pas exemptée de validation.

## 🔍 Analyse des causes

### Cause 1 : Route non exemptée de validation

Dans `api-client.ts`, la méthode `request()` valide que le token contient un `etablissementId` avant chaque requête, SAUF pour les routes authentification :

```typescript
// ANCIEN - Liste incomplète
const authRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/pre-login',
    '/api/auth/complete-login',
    // ❌ MANQUANT: '/api/auth/etablissements-disponibles'
];
```

**Problème** : `/api/auth/etablissements-disponibles` n'était pas dans la liste, donc la validation échouait.

### Cause 2 : Lecture directe du token au lieu du store

Le composant lisait directement le token depuis localStorage :

```typescript
// ❌ INCORRECT
const token = localStorage.getItem('elisa_access_token'); // Mauvaise clé !
const payload = JSON.parse(atob(token.split('.')[1]));
const current = transformed.find(e => e.id === payload.etablissementId);
```

**Problèmes** :
1. Mauvaise clé (`elisa_access_token` au lieu de `accessToken`)
2. Duplication de logique (le store Zustand a déjà `etablissementId`)
3. Ne gérait pas le cas où `etablissementId` est null/undefined

### Cause 3 : Pas de vérification avant chargement

Le composant chargeait les établissements dès que `utilisateur` existait, sans vérifier si `etablissementId` était présent :

```typescript
// ❌ INCORRECT
if (utilisateur) {
    loadEtablissements(); // Peut échouer si etablissementId null
}
```

## ✅ Corrections appliquées

### 1. **api-client.ts** : Ajouter la route aux exemptions

```typescript
// ✅ CORRECT - Liste complète
const authRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/pre-login',
    '/api/auth/complete-login',
    '/api/auth/etablissements-disponibles', // ← NOUVEAU
];
```

**Pourquoi** : Cette route est nécessaire pour afficher la liste des établissements disponibles avant que l'utilisateur n'en sélectionne un. Elle ne doit PAS nécessiter d'`etablissementId` dans le token.

### 2. **EtablissementSwitcher.tsx** : Utiliser le store Zustand

```typescript
// ✅ CORRECT - Utiliser le store
const { logout, utilisateur, etablissementId } = useAuthStore();

// Vérifier avant de charger
if (!etablissementId) {
    console.warn('[EtablissementSwitcher] Aucun établissement actif, chargement ignoré');
    return;
}

// Trouver l'établissement actuel depuis le store
const current = transformed.find(e => e.id === etablissementId);
```

**Avantages** :
- ✅ Pas de lecture directe du token (single source of truth)
- ✅ Vérification explicite de `etablissementId`
- ✅ Log plus clair en cas de problème
- ✅ Dépendances React complètes (`[utilisateur, etablissementId]`)

## 📁 Fichiers modifiés

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| [api-client.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/lib/api-client.ts) | 246-253 | Ajout `/api/auth/etablissements-disponibles` aux exemptions |
| [EtablissementSwitcher.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/components/auth/EtablissementSwitcher.tsx) | 35-76 | Refactorisation complète du chargement |

## 🧪 Scénarios de test

### Scénario 1 : Utilisateur mono-établissement

1. **Se connecter** avec un utilisateur mono-établissement
2. **Vérifier** que le switcher s'affiche correctement
3. **Résultat attendu** : ✅ Switcher visible avec l'établissement actuel

### Scénario 2 : Utilisateur multi-établissements (avant sélection)

1. **Se connecter** avec un utilisateur multi-établissements
2. **AVANT** de sélectionner un établissement (token sans etablissementId)
3. **Vérifier** la console
4. **Résultat attendu** :
   ```
   [EtablissementSwitcher] Aucun établissement actif, chargement ignoré
   ```
5. ✅ Pas d'erreur, le switcher ne charge pas

### Scénario 3 : Utilisateur multi-établissements (après sélection)

1. **Se connecter** avec un utilisateur multi-établissements
2. **Sélectionner** un établissement via la modal
3. **Vérifier** que le switcher s'affiche avec la liste
4. **Résultat attendu** : ✅ Switcher visible avec tous les établissements

### Scénario 4 : Changement d'établissement

1. **Ouvrir** le switcher
2. **Cliquer** sur un autre établissement
3. **Vérifier** que le changement est effectif
4. **Résultat attendu** : ✅ Établissement changé, page rechargée

## 🔍 Explication technique

### Flux normal (mono-établissement)

```
Login → Token avec etablissementId → EtablissementSwitcher charge → ✅ Affiche
```

### Flux multi-établissements (avant sélection)

```
Login → Token SANS etablissementId → EtablissementSwitcher vérifie → ⚠️ Ignore (log warning)
```

### Flux multi-établissements (après sélection)

```
Login → Token SANS etablissementId
    ↓
Modal sélection → completeLogin() → Token AVEC etablissementId
    ↓
EtablissementSwitcher vérifie → ✅ Charge et affiche
```

## 🎯 Bonnes pratiques appliquées

### ✅ 1. **Single Source of Truth**

Le store Zustand est l'unique source de vérité pour `etablissementId` :

```typescript
// ✅ CORRECT
const { etablissementId } = useAuthStore();

// ❌ INCORRECT
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
const etablissementId = payload.etablissementId;
```

### ✅ 2. **Validation explicite**

Vérifier les préconditions avant d'exécuter :

```typescript
if (!etablissementId) {
    console.warn('[EtablissementSwitcher] Aucun établissement actif');
    return;
}
```

### ✅ 3. **Dépendances React complètes**

Toujours inclure toutes les dépendances dans `useEffect` :

```typescript
// ✅ CORRECT
useEffect(() => {
    // ...
}, [utilisateur, etablissementId]);

// ❌ INCORRECT
useEffect(() => {
    // ...
}, [utilisateur]); // Manque etablissementId
```

### ✅ 4. **Routes exemptées documentées**

Commenter pourquoi une route est exemptée :

```typescript
'/api/auth/etablissements-disponibles', // ← NOUVEAU: requis pour EtablissementSwitcher
```

## 📊 Impact

| Aspect | Avant | Après |
|--------|-------|-------|
| **Erreur au chargement** | ❌ Oui (Token incomplet) | ✅ Non (route exemptée) |
| **Lecture du token** | ❌ Directe (mauvaise clé) | ✅ Via Zustand store |
| **Vérification etablissementId** | ❌ Aucune | ✅ Explicite |
| **Logs d'erreur** | ❌ Console.error | ✅ Console.warn (clair) |
| **Dépendances useEffect** | ❌ Incomplètes | ✅ Complètes |

## ⚠️ Points d'attention

### 1. **Ne PAS supprimer l'exemption**

La route `/api/auth/etablissements-disponibles` DOIT rester dans la liste des exemptions, car elle est appelée avant la sélection d'établissement.

### 2. **Toujours utiliser le store**

Ne jamais lire directement les tokens depuis localStorage dans les composants React. Toujours passer par le store Zustand.

### 3. **Gestion du cas null**

Le composant gère maintenant explicitement le cas où `etablissementId` est null/undefined, ce qui évite les erreurs silencieuses.

## 🚀 Prochaines améliorations

1. **Afficher un placeholder** : Quand `etablissementId` est null, afficher "Sélectionnez un établissement" au lieu de cacher le composant
2. **Auto-refresh** : Recharger la liste quand `etablissementId` change
3. **Cache local** : Mettre en cache la liste des établissements pour éviter les requêtes répétées
4. **Skeleton loader** : Afficher un loader pendant le chargement

## 📝 Logs de débogage

### Avant correction
```
[EtablissementSwitcher] Erreur chargement: Error: Token incomplet: veuillez sélectionner votre établissement
```

### Après correction (multi-établissements avant sélection)
```
[EtablissementSwitcher] Aucun établissement actif, chargement ignoré
```

### Après correction (normal)
```
(Aucun log - chargement réussi)
```

## ✅ Vérification finale

- [x] Route `/api/auth/etablissements-disponibles` exemptée de validation
- [x] Composant utilise `etablissementId` du store Zustand
- [x] Vérification explicite avant chargement
- [x] Dépendances `useEffect` complètes
- [x] Logs clairs et informatifs
- [x] Pas de lecture directe du token
- [x] Gestion du cas `etablissementId` null/undefined

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Faible (uniquement EtablissementSwitcher)  
**Risque** : Aucun (ajout d'exemption, pas de suppression)  
**Test requis** : Login multi-établissements + switcher
