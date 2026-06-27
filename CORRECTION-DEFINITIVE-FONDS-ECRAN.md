# Correction Définitive - Chargement des Fonds d'Écran

## 🎯 Problème Persistant Identifié

Même après la correction des URLs, les fonds ne se chargeaient toujours pas. Les logs montraient :

```javascript
[useCatalogueFonds] response.data: {fonds: Array(36), total: 36}
[useCatalogueFonds] Fonds extraits: 0  // ← Toujours 0 !

[useConfigRotation] Config extraite: undefined  // ← Toujours undefined !
```

## 🔍 Analyse Approfondie

### **Compréhension Erronée de la Structure API**

Le code supposait que `apiClient.get<T>()` retournait une **double imbrication** :
```typescript
// ❌ HYPOTHÈSE INCORRECTE
apiClient.get<{ data: Fond[] }>() → ApiResponse<{ data: Fond[] }>
                                    ↓
                              response.data = { data: Fond[] }
                                    ↓
                              response.data.data = Fond[]  // ← Extraction fausse !
```

### **Véritable Structure de `apiClient`**

En inspectant [api-client.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/lib/api-client.ts#L426-L441) :

```typescript
// Ligne 426-441
async get<T>(endpoint: string, params?: ...): Promise<ApiResponse<T>> {
    // ...
    return this.request<ApiResponse<T>>(url);
}
```

**Donc** :
```typescript
apiClient.get<Fond[]>('/api/fonds') → ApiResponse<Fond[]>
                                      ↓
                                response.data = Fond[]  // ← Directement !
```

Le backend retourne :
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2026-06-25T...",
  "path": "/api/apparence/fonds/rotation"
}
```

Et `apiClient.get<T>()` retourne exactement cet objet typé `ApiResponse<T>` où `T` est le contenu de `data`.

### **Exemple Concret**

**Backend** (controller) :
```typescript
res.json({ success: true, data: { fonds: [...], total: 36 } });
```

**Frontend** (hook) :
```typescript
const response = await apiClient.get<{ fonds: Fond[]; total: number }>(...);
// response = { success: true, data: { fonds: [...], total: 36 }, timestamp: ..., path: ... }
// response.data = { fonds: [...], total: 36 }  ← Directement !
```

## ✅ Correction Appliquée

### **Règle d'Extraction**

**Avant** (incorrect) :
```typescript
const response = await apiClient.get<{ data: Fond[] }>('/api/fonds');
const fonds = response.data?.data ?? [];  // ❌ response.data.data = undefined
```

**Après** (correct) :
```typescript
const response = await apiClient.get<Fond[]>('/api/fonds');
const fonds = response.data ?? [];  // ✅ response.data = Fond[]
```

### **Hooks Corrigés**

**Fichier** : [hooks.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/features/apparence/hooks.ts)

#### 1. **useCatalogueFonds**

```diff
- const response = await apiClient.get<{ fonds: Fond[]; total: number }>(...);
- const result = response.data?.data ?? { fonds: [], total: 0 };

+ const response = await apiClient.get<{ fonds: Fond[]; total: number }>(...);
+ const result = response.data ?? { fonds: [], total: 0 };
```

#### 2. **useFondsEtablissement**

```diff
- const response = await apiClient.get<{ data: FondEtablissement[] }>(...);
- const fonds = response.data?.data ?? [];

+ const response = await apiClient.get<FondEtablissement[]>(...);
+ const fonds = response.data ?? [];
```

#### 3. **useConfigRotation**

```diff
- const response = await apiClient.get<{ data: ConfigRotation }>(...);
- const config = response.data?.data;

+ const response = await apiClient.get<ConfigRotation>(...);
+ const config = response.data;
```

#### 4. **useFondsRotation**

```diff
- const response = await apiClient.get<{ data: Fond[] }>(...);
- const fonds = response.data?.data ?? [];

+ const response = await apiClient.get<Fond[]>(...);
+ const fonds = response.data ?? [];
```

#### 5. **Mutations (POST/PATCH/DELETE)**

```diff
// useAjouterFondEtablissement
- const response = await apiClient.post<{ data: FondEtablissement }>(...);
- return response.data.data;
+ const response = await apiClient.post<FondEtablissement>(...);
+ return response.data;

// useModifierFondEtablissement
- const response = await apiClient.patch<{ data: FondEtablissement }>(...);
- return response.data.data;
+ const response = await apiClient.patch<FondEtablissement>(...);
+ return response.data;

// useUploadFond
- const response = await apiClient.post<{ data: Fond }>(...);
- return response.data.data;
+ const response = await apiClient.post<Fond>(...);
+ return response.data;

// useUpdateConfigRotation
- const response = await apiClient.patch<{ data: ConfigRotation }>(...);
- return response.data.data;
+ const response = await apiClient.patch<ConfigRotation>(...);
+ return response.data;
```

#### 6. **useSupprimerFondEtablissement** - URL corrigée

```diff
- const response = await apiClient.delete(`/api/apparence/etablissement/${id}`);
+ const response = await apiClient.delete(`/api/apparence/fonds/etablissement/${id}`);
```

## 📊 Résumé des Modifications

| Hook | Type | Correction |
|------|------|-----------|
| `useCatalogueFonds` | GET | `response.data?.data` → `response.data` |
| `useFondsEtablissement` | GET | `response.data?.data` → `response.data` |
| `useConfigRotation` | GET | `response.data?.data` → `response.data` |
| `useFondsRotation` | GET | `response.data?.data` → `response.data` |
| `useAjouterFondEtablissement` | POST | `response.data.data` → `response.data` |
| `useModifierFondEtablissement` | PATCH | `response.data.data` → `response.data` |
| `useUploadFond` | POST | `response.data.data` → `response.data` |
| `useUpdateConfigRotation` | PATCH | `response.data.data` → `response.data` |
| `useSupprimerFondEtablissement` | DELETE | URL `/etablissement/` → `/fonds/etablissement/` |

## 🎯 Logs Attendus Après Correction

```javascript
[useCatalogueFonds] Appel API: GET /api/apparence/fonds/catalogue
[useCatalogueFonds] Réponse API complète: {success: true, data: {fonds: Array(36), total: 36}, ...}
[useCatalogueFonds] response.data: {fonds: Array(36), total: 36}
[useCatalogueFonds] Fonds extraits: 36  // ✅ MAINTENANT 36 !

[useFondsRotation] Appel API: GET /api/apparence/fonds/rotation
[useFondsRotation] Réponse API complète: {success: true, data: [...], ...}
[useFondsRotation] Fonds extraits: N  // ✅ Les fonds de l'établissement !

[useConfigRotation] Appel API: GET /api/apparence/fonds/config
[useConfigRotation] Réponse API complète: {success: true, data: {...}, ...}
[useConfigRotation] Config extraite: {actif: false, delaiRotation: 86400}  // ✅ Config valide !

[FondRotator] État des hooks: {fonds: N, isLoadingFonds: false, isErrorFonds: false, ...}
[FondRotator] Configuration rotation: {rotationActive: false, delaiRotation: 86400000}
[FondRotator] Affichage du fond: {nom: "...", categorie: "...", url: "..."}  // ✅ Fond affiché !
```

## 📁 Fichiers Modifiés

| Fichier | Lignes Modifiées | Description |
|---------|------------------|-------------|
| `frontend/src/features/apparence/hooks.ts` | 33-187 | Extraction `response.data` au lieu de `response.data.data` pour 9 hooks |

## 🧪 Vérification

1. **Refresh le navigateur** (Ctrl+Shift+R) pour clearer le cache
2. **Ouvrir la console** et vérifier les logs
3. **Vérifier le FondRotator** : un fond devrait apparaître en arrière-plan
4. **Vérifier la page Apparence** : le catalogue devrait montrer 36 fonds

## 📝 Règle Mémorisée

La règle a été mise à jour dans les mémoires :

> **Règle de déstructuration des réponses API backend** :
> 
> `apiClient.get<T>()` retourne `ApiResponse<T>` où `response.data` est de type `T` directement.
> 
> **Extraction** : `response.data` (PAS `response.data.data`)

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 2.0.0 (correction définitive)  
**Statut** : ✅ Prêt pour test final
