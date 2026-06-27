# Correction Chargement des Fonds d'Écran - Analyse et Résolution

## 📋 Problème Identifié

**Symptômes** :
- Les fonds d'écran ne se chargent pas dans le `FondRotator`
- Les logs montrent `Fonds extraits: 0` pour tous les hooks
- Le catalogue retourne 36 fonds mais l'extraction échoue

**Logs critiques** :
```javascript
[useCatalogueFonds] response.data: {fonds: Array(36), total: 36}
[useCatalogueFonds] Fonds extraits: 0

[useFondsRotation] Réponse API complète: {success: true, data: Array(0)}
[useFondsRotation] Fonds extraits: 0

[useConfigRotation] Config extraite: undefined
```

## 🔍 Analyse en Profondeur

### **Problème 1 : URLs API incorrectes**

Les hooks appelaient :
- ❌ `/api/apparence/catalogue`
- ❌ `/api/apparence/etablissement`
- ❌ `/api/apparence/config`
- ❌ `/api/apparence/rotation`

Mais le backend attend :
- ✅ `/api/apparence/fonds/catalogue`
- ✅ `/api/apparence/fonds/etablissement`
- ✅ `/api/apparence/fonds/config`
- ✅ `/api/apparence/fonds/rotation`

**Cause racine** : Le controller `apparence.controller.ts` est monté dans `app.ts` sur `/api/apparence/fonds` (ligne 352), pas sur `/api/apparence`.

### **Problème 2 : Structure de réponse du catalogue**

Le service backend `getCatalogue()` retourne :
```typescript
{ fonds: Fond[]; total: number }
```

Le controller encapsule dans :
```typescript
res.json({ success: true, data: { fonds: [...], total: N } });
```

Donc la réponse complète est :
```javascript
{
  success: true,
  data: {                    // ← response.data
    data: {                  // ← response.data.data
      fonds: [...],
      total: 36
    }
  }
}
```

Le frontend extrayait incorrectement :
```typescript
// ❌ INCORRECT - Retourne { fonds: [...], total: 36 } au lieu du tableau
const fonds = response.data?.data ?? [];
```

**Correct** :
```typescript
// ✅ CORRECT - Retourne { fonds: [...], total: N }
const result = response.data?.data ?? { fonds: [], total: 0 };
return result;
```

### **Problème 3 : Mutations retournent l'objet complet au lieu de la donnée**

Les mutations retournaient `response.data` (l'objet `{ success: true, data: ... }`) au lieu de `response.data.data` (la donnée utile).

## ✅ Corrections Appliquées

### 1. **Backend - Montage du Controller**

**Fichier** : [app.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/app.ts#L352)

```diff
- app.use('/api/apparence', authMiddleware, filterByEtablissement(), apparenceController);
+ app.use('/api/apparence/fonds', authMiddleware, filterByEtablissement(), apparenceController);
```

**Résultat** : Les routes sont maintenant cohérentes avec les commentaires du controller.

### 2. **Frontend - Hooks de Requêtes (GET)**

**Fichier** : [hooks.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/features/apparence/hooks.ts)

#### **useCatalogueFonds** - Correction structure de réponse

```diff
- const response = await apiClient.get<{ data: Fond[] }>('/api/apparence/catalogue');
- const fonds = response.data?.data ?? [];
- return fonds;

+ const response = await apiClient.get<{ fonds: Fond[]; total: number }>(
+     '/api/apparence/fonds/catalogue'
+ );
+ const result = response.data?.data ?? { fonds: [], total: 0 };
+ return result;
```

**Type de retour** : `{ fonds: Fond[]; total: number }` au lieu de `Fond[]`

#### **useFondsEtablissement** - Correction URL

```diff
- const response = await apiClient.get<{ data: FondEtablissement[] }>('/api/apparence/etablissement');
+ const response = await apiClient.get<{ data: FondEtablissement[] }>(
+     '/api/apparence/fonds/etablissement'
+ );
```

#### **useConfigRotation** - Correction URL

```diff
- const response = await apiClient.get<{ data: ConfigRotation }>('/api/apparence/config');
+ const response = await apiClient.get<{ data: ConfigRotation }>(
+     '/api/apparence/fonds/config'
+ );
```

#### **useFondsRotation** - Correction URL

```diff
- const response = await apiClient.get<{ data: Fond[] }>('/api/apparence/rotation');
+ const response = await apiClient.get<{ data: Fond[] }>(
+     '/api/apparence/fonds/rotation'
+ );
```

### 3. **Frontend - Hooks de Mutations (POST/PATCH)**

#### **useAjouterFondEtablissement**

```diff
- const response = await apiClient.post<{ data: FondEtablissement }>(
-     '/api/apparence/etablissement', dto
- );
- return response.data;

+ const response = await apiClient.post<{ data: FondEtablissement }>(
+     '/api/apparence/fonds/etablissement', dto
+ );
+ return response.data.data;
```

#### **useModifierFondEtablissement**

```diff
- const response = await apiClient.patch<{ data: FondEtablissement }>(
-     `/api/apparence/etablissement/${id}`, dto
- );
- return response.data;

+ const response = await apiClient.patch<{ data: FondEtablissement }>(
+     `/api/apparence/fonds/etablissement/${id}`, dto
+ );
+ return response.data.data;
```

#### **useUploadFond**

```diff
- const response = await apiClient.post<{ data: Fond }>(
-     '/api/apparence/upload', dto
- );
- return response.data;

+ const response = await apiClient.post<{ data: Fond }>(
+     '/api/apparence/fonds/upload', dto
+ );
+ return response.data.data;
```

#### **useUpdateConfigRotation**

```diff
- const response = await apiClient.patch<{ data: ConfigRotation }>(
-     '/api/apparence/config', dto
- );
- return response.data;

+ const response = await apiClient.patch<{ data: ConfigRotation }>(
+     '/api/apparence/fonds/config', dto
+ );
+ return response.data.data;
```

### 4. **Frontend - Page Apparence**

**Fichier** : [ApparencePage.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/features/apparence/ApparencePage.tsx#L45-L59)

```diff
- const { data: catalogue, isLoading: loadingCatalogue } = useCatalogueFonds();
+ const { data: catalogueData, isLoading: loadingCatalogue } = useCatalogueFonds();

+ // Le catalogue retourne maintenant { fonds: Fond[], total: number }
+ const catalogue = catalogueData?.fonds ?? [];

- const catalogueSafe = catalogue ?? [];
- const catalogueFiltre = filtreCategorie === 'toutes'
-     ? catalogueSafe
-     : catalogueSafe.filter((f) => f.categorie === filtreCategorie);

+ const catalogueFiltre = filtreCategorie === 'toutes'
+     ? catalogue
+     : catalogue.filter((f) => f.categorie === filtreCategorie);
```

## 🎯 Résultat Attendu

Après ces corrections, les logs devraient montrer :

```javascript
[useCatalogueFonds] Appel API: GET /api/apparence/fonds/catalogue
[useCatalogueFonds] Réponse API complète: {success: true, data: {fonds: Array(36), total: 36}}
[useCatalogueFonds] response.data: {fonds: Array(36), total: 36}
[useCatalogueFonds] Fonds extraits: 36  // ✅ CORRECT !

[useFondsRotation] Appel API: GET /api/apparence/fonds/rotation
[useFondsRotation] Réponse API complète: {success: true, data: [...]}
[useFondsRotation] Fonds extraits: N  // ✅ Les fonds de l'établissement

[useConfigRotation] Appel API: GET /api/apparence/fonds/config
[useConfigRotation] Config extraite: {actif: true/false, delaiRotation: 86400}  // ✅ Config valide

[FondRotator] État des hooks: {fonds: N, isLoadingFonds: false, ...}  // ✅ Fonds chargés
[FondRotator] Configuration rotation: {rotationActive: true/false, delaiRotation: 86400000}
[FondRotator] Affichage du fond: {nom: "...", categorie: "...", ...}  // ✅ Fond affiché
```

## 📁 Fichiers Modifiés

| Fichier | Type | Lignes Modifiées | Description |
|---------|------|------------------|-------------|
| `backend/src/app.ts` | Backend | 352 | Montage controller sur `/api/apparence/fonds` |
| `frontend/src/features/apparence/hooks.ts` | Frontend | 24-174 | URLs + extraction données pour 8 hooks |
| `frontend/src/features/apparence/ApparencePage.tsx` | Frontend | 45-59 | Adaptation au nouveau type de catalogue |

## 🧪 Tests de Vérification

### 1. **Vérifier les Logs Console**

Ouvrir la console du navigateur et chercher :
```
[useCatalogueFonds] Fonds extraits: 36
[useFondsRotation] Fonds extraits: N
[useConfigRotation] Config extraite: {...}
```

### 2. **Vérifier le FondRotator**

Le composant devrait afficher :
- Un fond d'écran en arrière-plan (opacité 8%)
- L'indicateur de débogage en bas à droite (en développement)
- Les informations : nom du fond, catégorie, index, rotation ON/OFF

### 3. **Vérifier la Page Apparence**

URL : `http://localhost:7001/apparence`

Devrait montrer :
- ✅ Le catalogue avec 36 fonds
- ✅ Les filtres par catégorie fonctionnels
- ✅ Les fonds de l'établissement
- ✅ La configuration de rotation

### 4. **Tester les Mutations**

1. **Ajouter un fond** : Cliquer sur un fond du catalogue → devrait s'ajouter à l'établissement
2. **Supprimer un fond** : Cliquer sur la corbeille → devrait retirer le fond
3. **Toggle rotation** : Cliquer sur le bouton Play/Pause → devrait activer/désactiver
4. **Changer délai** : Modifier le délai → devrait persister

## ⚠️ Notes Importantes

1. **Nécessite un redémarrage du backend** pour que le changement de montage dans `app.ts` prenne effet
2. **Nécessite un refresh du frontend** (Ctrl+Shift+R) pour clearer le cache des hooks
3. **Le cache TanStack Query** peut contenir d'anciennes réponses 404 → invalider avec `queryClient.clear()` si nécessaire
4. **Les permissions RBAC** : L'utilisateur doit avoir `apparence:fonds:view` et `apparence:fonds:manage`

## 🚀 Prochaines Étapes

1. ✅ Redémarrer le backend : `cd backend && pnpm dev`
2. ✅ Refresh le frontend : `Ctrl+Shift+R` dans le navigateur
3. ✅ Vérifier les logs console
4. ✅ Tester la rotation des fonds
5. ✅ Tester l'ajout/suppression de fonds

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 1.0.0  
**Statut** : ✅ Code corrigé, prêt pour test
