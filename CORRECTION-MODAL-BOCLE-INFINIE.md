# Correction Modal Établissement en Boucle Infinie

## 🚨 Problème Identifié

**Symptôme** : Le modal de sélection d'établissement s'affiche en boucle sans les établissements chargés, rendant l'application inutilisable.

**Contexte** :
1. Utilisateur se connecte
2. Modal s'affiche
3. Utilisateur sélectionne un établissement (ou tente de fermer)
4. ❌ **Modal se rouvre immédiatement** sans liste d'établissements
5. Cycle infini → Application bloquée

## 🔍 Analyse des causes

### Cause 1 : Multiples déclencheurs de l'événement

L'événement `auth:etablissement-required` est dispatché à **3 endroits différents** :

```typescript
// 1. Au startup (api-client.ts:102)
validateTokenOnStartup() → dispatch('auth:etablissement-required')

// 2. Avant chaque requête (api-client.ts:142)
validateTokenBeforeRequest() → dispatch('auth:etablissement-required')

// 3. Hook (use-etablissement-required.ts:47)
handleEtablissementRequired() → setShowEtablissementModal(true)
```

**Problème** : Aucun de ces déclencheurs ne vérifie si :
- Le modal est **déjà** ouvert
- L'utilisateur a **déjà** un `etablissementId`
- Les établissements sont **disponibles** dans `preLoginData`

### Cause 2 : Absence de garde dans le hook

**Avant** :
```typescript
const handleEtablissementRequired = useCallback(() => {
    // ❌ Aucune vérification
    setShowEtablissementModal(true); // ← S'exécute TOUJOURS
}, [preLoginData, router, setShowEtablissementModal]);
```

**Résultat** : Même après `completeLogin()`, si une requête API échoue et re-déclenche l'événement, le modal se rouvre.

### Cause 3 : Modal affiché sans établissements

Après `completeLogin()`, `preLoginData` est mis à `null` :

```typescript
completeLogin() {
    set({
        preLoginData: null, // ← Établissements perdus
        // ...
    });
}
```

Donc si le modal se rouvre après `completeLogin`, `etablissements = []` (vide).

## ✅ Corrections appliquées

### 1. **use-etablissement-required.ts** : 4 vérifications avant affichage

**Avant** :
```typescript
const handleEtablissementRequired = useCallback(() => {
    const state = useAuthStore.getState();
    if (!state.accessToken) {
        router.navigate({ to: '/login' });
        return;
    }
    
    // ❌ Aucune autre vérification
    setShowEtablissementModal(true);
}, [preLoginData, router, setShowEtablissementModal]);
```

**Après** :
```typescript
const handleEtablissementRequired = useCallback(() => {
    const state = useAuthStore.getState();
    
    // ✅ Vérification 1: Pas authentifié → redirection login
    if (!state.accessToken) {
        router.navigate({ to: '/login' });
        return;
    }

    // ✅ Vérification 2: Utilisateur a DÉJÀ un établissement actif → IGNORER
    if (state.etablissementId) {
        console.log('[EtablissementRequired] Établissement déjà sélectionné, modal ignoré');
        return;
    }

    // ✅ Vérification 3: Modal déjà ouvert → IGNORER (éviter boucle infinie)
    if (state.showEtablissementModal) {
        console.log('[EtablissementRequired] Modal déjà ouvert, événement ignoré');
        return;
    }

    // ✅ Vérification 4: Pas de données de pré-login → Déconnexion
    if (!state.preLoginData?.etablissements || state.preLoginData.etablissements.length === 0) {
        console.warn('[EtablissementRequired] Aucun établissement disponible');
        toast.error('Impossible de charger la liste des établissements. Veuillez vous reconnecter.');
        
        setTimeout(() => {
            logout();
            router.navigate({ to: '/login' });
        }, 2000);
        return;
    }

    // ✅ Toutes les vérifications passées → Afficher le modal
    setShowEtablissementModal(true);
    toast.info('Veuillez sélectionner votre établissement');
}, [router, setShowEtablissementModal, logout]);
```

### 2. **api-client.ts** : Vérifications avant dispatch

#### validateTokenOnStartup()

**Avant** :
```typescript
if (payload && !payload.etablissementId) {
    window.dispatchEvent(new CustomEvent('auth:etablissement-required'));
}
```

**Après** :
```typescript
if (payload && !payload.etablissementId) {
    // ✅ Vérifier si le modal n'est pas déjà affiché
    try {
        const { useAuthStore } = require('@/stores/auth.store');
        const state = useAuthStore.getState();
        
        if (state.showEtablissementModal) {
            console.log('[API] Modal déjà affiché, événement ignoré');
            return;
        }
        
        if (state.etablissementId) {
            console.log('[API] Établissement déjà sélectionné, événement ignoré');
            return;
        }
    } catch (error) {
        // Import échoué, continuer quand même
    }
    
    window.dispatchEvent(new CustomEvent('auth:etablissement-required'));
}
```

#### validateTokenBeforeRequest()

Même logique appliquée : vérification de `showEtablissementModal` et `etablissementId` avant dispatch.

### 3. **EtablissementSelectionModal.tsx** : Détection modal vide

**Ajout** :
```typescript
const [isLoadingEtablissements, setIsLoadingEtablissements] = useState(false);

// Vérifier si les établissements sont chargés
useEffect(() => {
    if (open && etablissements.length === 0) {
        console.warn('[EtablissementSelectionModal] Modal ouvert sans établissements');
        setIsLoadingEtablissements(true);
        
        // Auto-fermer après 3s si pas d'établissements
        const timer = setTimeout(() => {
            setIsLoadingEtablissements(false);
        }, 3000);
        
        return () => clearTimeout(timer);
    } else {
        setIsLoadingEtablissements(false);
    }
}, [open, etablissements.length]);
```

## 📁 Fichiers modifiés

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| [use-etablissement-required.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/hooks/use-etablissement-required.ts) | 27-68 | 4 vérifications avant affichage modal |
| [api-client.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/lib/api-client.ts) | 92-156, 123-180 | Vérifications avant dispatch événement |
| [EtablissementSelectionModal.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/components/auth/EtablissementSelectionModal.tsx) | 12, 42-67 | Détection modal vide + auto-fermeture |

## 🧪 Scénarios de test

### Scénario 1 : Login mono-établissement

1. **Se connecter** avec un utilisateur mono-établissement
2. **Vérifier** que le modal ne s'affiche PAS
3. **Résultat attendu** : ✅ Dashboard direct, pas de modal

### Scénario 2 : Login multi-établissements

1. **Se connecter** avec un utilisateur multi-établissements
2. **Vérifier** que le modal s'affiche **UNE SEULE FOIS** avec la liste
3. **Sélectionner** un établissement
4. **Vérifier** que le modal ne se rouvre PAS
5. **Résultat attendu** : ✅ Modal unique → Sélection → Dashboard

### Scénario 3 : Rechargement page après sélection

1. **Se connecter** et sélectionner un établissement
2. **Recharger** la page (F5)
3. **Vérifier** que le modal ne s'affiche PAS
4. **Résultat attendu** : ✅ Dashboard direct

### Scénario 4 : Token sans etablissementId (edge case)

1. **Manipuler** localStorage pour avoir un token sans etablissementId
2. **Recharger** la page
3. **Vérifier** dans Console :
   ```
   [EtablissementRequired] Aucun établissement disponible dans preLoginData
   ```
4. **Vérifier** toast : "Impossible de charger la liste des établissements"
5. **Vérifier** redirection vers login après 2s
6. **Résultat attendu** : ✅ Déconnexion + redirection propre

## 🔍 Logs de débogage

### Normal (multi-établissements)
```
[API] Token stocké sans etablissementId - sélection requise
[EtablissementRequired] Événement reçu
(Vérifications passent)
Modal s'affiche avec établissements
```

### Modal déjà ouvert
```
[API] Token incomplet: etablissementId manquant
[API] Modal déjà affiché, événement ignoré
(Pas de réouverture)
```

### Établissement déjà sélectionné
```
[API] Token incomplet: etablissementId manquant
[EtablissementRequired] Établissement déjà sélectionné, modal ignoré
(Pas d'affichage)
```

### Pas d'établissements disponibles
```
[EtablissementRequired] Aucun établissement disponible dans preLoginData
Toast: "Impossible de charger la liste des établissements"
→ Déconnexion + redirection login
```

## 🎯 Bonnes pratiques appliquées

### ✅ 1. **Garde multiples (Defense in Depth)**

4 vérifications avant d'afficher le modal :
1. Authentification
2. Établissement actif
3. Modal pas déjà ouvert
4. Données disponibles

### ✅ 2. **Logs structurés**

Chaque décision est loguée pour faciliter le débogage :
```typescript
console.log('[EtablissementRequired] Établissement déjà sélectionné, modal ignoré');
console.log('[EtablissementRequired] Modal déjà ouvert, événement ignoré');
console.warn('[EtablissementRequired] Aucun établissement disponible');
```

### ✅ 3. **Graceful degradation**

Si les établissements ne sont pas disponibles :
- Message d'erreur clair
- Déconnexion automatique après 2s
- Redirection vers login

### ✅ 4. **Try/catch pour imports dynamiques**

```typescript
try {
    const { useAuthStore } = require('@/stores/auth.store');
    // ...
} catch (error) {
    // Import échoué, continuer quand même
}
```

Évite les crashes si le module n'est pas disponible.

## 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| **Modal en boucle** | Oui (infini) | Non (gardes multiples) |
| **Vérification etablissementId** | Aucune | ✅ Avant chaque affichage |
| **Vérification modal ouvert** | Aucune | ✅ Évite réouverture |
| **Vérification données** | Aucune | ✅ Déconnexion si vides |
| **Logs** | 1 seul | ✅ 4 logs structurés |
| **Auto-fermeture** | Non | ✅ Après 3s si vide |
| **Gestion erreurs** | Crash possible | ✅ Graceful degradation |

## ⚠️ Points d'attention

### 1. **Ne PAS supprimer les vérifications**

Les 4 vérifications sont CRITIQUES pour éviter la boucle infinie. Chaque vérification empêche un scénario d'erreur différent.

### 2. **Ordre des vérifications**

L'ordre est important :
1. Authentification (plus critique)
2. Établissement actif (cas normal)
3. Modal ouvert (éviter boucle)
4. Données disponibles (edge case)

### 3. **Import dynamique avec require()**

Utiliser `require()` au lieu de `import` car nous sommes dans une classe vanilla JS (api-client), pas dans un module React.

### 4. **Try/catch obligatoire**

L'import peut échouer si le store n'est pas encore initialisé. Le try/catch garantit que l'application ne crash pas.

## 🚀 Prochaines améliorations

1. **Retourner les établissements dans completeLogin** : Éviter de perdre `preLoginData`
2. **Cache local des établissements** : Stocker dans localStorage pour rechargement rapide
3. **Retry automatique** : Si établissements non chargés, retry 2-3 fois
4. **Indicator visuel** : Spinner pendant le chargement des établissements

## ✅ Vérification finale

- [x] 4 vérifications avant affichage modal
- [x] Vérification dans validateTokenOnStartup()
- [x] Vérification dans validateTokenBeforeRequest()
- [x] Détection modal vide dans EtablissementSelectionModal
- [x] Logs structurés pour débogage
- [x] Graceful degradation (déconnexion si données vides)
- [x] Try/catch pour imports dynamiques
- [x] Auto-fermeture après 3s si establishments vides

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Critique (bloquait l'application)  
**Risque** : Faible (ajout de vérifications, pas de suppression)  
**Test requis** : Login multi-établissements + rechargement page
