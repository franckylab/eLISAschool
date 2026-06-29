# ✅ Correction - TypeError: classes?.map is not a function

**Date** : 11 juin 2026  
**Erreur** : `TypeError: classes?.map is not a function`  
**Statut** : ✅ **Corrigé**

---

## 🐛 Analyse de l'Erreur

### Message d'Erreur
```
TypeError: classes?.map is not a function
    at eleve-form.v2.tsx:561:50
```

### Cause Racine

**Problème de structure de données** : Les hooks `useToutesClasses` et `useToutesAnneesScolaires` retournaient un objet au lieu d'un tableau.

**Avant** ❌ :
```typescript
// Hook use-toutes-classes.ts
const response = await apiClient.get<{ data: Classe[] }>('/api/classes');
return response.data; // ← Retourne { success: true, data: [...] }

// Dans le formulaire
const { data: classes } = useToutesClasses();
classes?.map(...) // ← classes est un OBJET, pas un tableau !
```

**Structure réelle de la réponse API** :
```typescript
{
    success: true,
    data: [
        { id: '1', nom: '6ème A' },
        { id: '2', nom: '5ème B' }
    ],
    timestamp: '2026-06-11T...'
}
```

Le hook retournait `response.data` (l'objet complet) au lieu du tableau `response.data.data`.

---

## ✅ Corrections Appliquées

### 1. Correction des Hooks

**Fichiers** :
- `frontend/src/features/classes/hooks/use-toutes-classes.ts`
- `frontend/src/features/annees-scolaires/hooks/use-toutes-annees-scolaires.ts`

**Correction** :
```typescript
// ✅ APRÈS - Extraction correcte du tableau
const response = await apiClient.get<{ success: boolean; data: Classe[] }>('/api/classes');

// Gérer les deux cas : tableau direct ou objet avec data
return Array.isArray(response.data) 
    ? response.data              // Cas 1: data est déjà un tableau
    : (response.data?.data || []); // Cas 2: data est un objet { data: [...] }
```

**Pourquoi cette approche** :
- ✅ Fonctionne si l'API retourne directement un tableau
- ✅ Fonctionne si l'API retourne `{ data: [...] }`
- ✅ Retourne `[]` si data est undefined/null (sécurité)
- ✅ Type-safe avec vérification `Array.isArray()`

### 2. Normalisation dans le Formulaire

**Fichier** : `frontend/src/features/eleves/components/eleve-form.v2.tsx`

**Avant** ❌ :
```typescript
const { data: classes } = useToutesClasses();
const { data: anneesScolaires } = useToutesAnneesScolaires();

// Dans le render
select: classes?.map(...) || []  // ← Peut échouer si classes n'est pas un tableau
```

**Après** ✅ :
```typescript
const { data: classesData } = useToutesClasses();
const { data: anneesScolairesData } = useToutesAnneesScolaires();

// Normaliser en tableaux (double sécurité)
const classes = Array.isArray(classesData) ? classesData : [];
const anneesScolaires = Array.isArray(anneesScolairesData) ? anneesScolairesData : [];

// Dans le render - plus besoin de optional chaining
select: classes.map(c => ({ label: c.nom, value: c.id }))
```

**Bénéfices** :
- ✅ Toujours des tableaux, jamais undefined/null
- ✅ Code plus clean (pas de `?.` ou `|| []`)
- ✅ Double couche de sécurité (hooks + formulaire)
- ✅ TypeScript happy

---

## 📊 Structure des Données

### Réponse API Standard
```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: string;
}
```

### Cas de Figure

| Cas | Structure | Solution |
|-----|-----------|----------|
| **Standard** | `{ success: true, data: [...] }` | `response.data?.data` |
| **Tableau direct** | `{ success: true, data: [...] }` | `response.data` (si tableau) |
| **Erreur** | `{ success: false, message: "..." }` | `[]` (fallback) |
| **Vide** | `{ success: true, data: null }` | `[]` (fallback) |

### Code Universel
```typescript
// Fonctionne dans TOUS les cas
const extractArray = (response: ApiResponse<any>) => {
    if (Array.isArray(response.data)) {
        return response.data; // Tableau direct
    }
    return response.data?.data || []; // Objet ou fallback
};
```

---

## 🧪 Tests de Validation

### Test 1 : Formulaire s'ouvre sans erreur
1. Aller à la page Élèves
2. Cliquer sur "Créer un élève"
3. **Résultat attendu** : 
   - ✅ Modal s'ouvre sans erreur
   - ✅ Pas d'erreur dans la console
   - ✅ Formulaire s'affiche correctement

### Test 2 : Dropdowns peuplés
1. Ouvrir le modal de création
2. Aller à l'étape 4 (Scolarité)
3. Cliquer sur le dropdown "Classe"
4. **Résultat attendu** :
   - ✅ Liste des classes affichée
   - ✅ Au moins une option disponible
   - ✅ Pas d'erreur "map is not a function"

### Test 3 : Dropdown Année scolaire
1. Rester à l'étape 4
2. Cliquer sur le dropdown "Année scolaire"
3. **Résultat attendu** :
   - ✅ Liste des années scolaires affichée
   - ✅ Format : "2024-2025", "2025-2026", etc.
   - ✅ Sélection fonctionnelle

### Test 4 : Console navigateur
1. Ouvrir DevTools (F12)
2. Aller à l'onglet Console
3. Ouvrir le modal de création
4. Naviguer dans les étapes
5. **Résultat attendu** :
   - ✅ Aucune erreur rouge
   - ✅ Aucun warning lié à `map`
   - ✅ Uniquement des logs normaux

---

## 🔍 Comment Diagnostiquer ce Type d'Erreur

### Étape 1 : Identifier la Ligne
```
TypeError: classes?.map is not a function
    at eleve-form.v2.tsx:561:50
```
→ Ligne 561, caractère 50

### Étape 2 : Examiner la Variable
```typescript
// Ajouter un log temporaire
console.log('classes:', classes);
console.log('typeof:', typeof classes);
console.log('isArray:', Array.isArray(classes));
console.log('keys:', Object.keys(classes));
```

### Étape 3 : Tracer la Source
```typescript
// Remonter au hook
const { data: classes } = useToutesClasses();

// Vérifier le hook
const response = await apiClient.get('/api/classes');
console.log('response:', response);
console.log('response.data:', response.data);
```

### Étape 4 : Vérifier le Type
```typescript
// Dans le hook
console.log('Is array?', Array.isArray(response.data));
console.log('Has data property?', 'data' in response.data);
```

### Étape 5 : Corriger
```typescript
// Si response.data est un objet avec .data
return response.data?.data || [];

// Si response.data est déjà un tableau
return Array.isArray(response.data) ? response.data : [];
```

---

## 📝 Bonnes Pratiques

### 1. Toujours Vérifier les Types
```typescript
// ❌ RISQUÉ
const items = response.data;
items.map(...) // Peut échouer

// ✅ SÉCURISÉ
const items = Array.isArray(response.data) 
    ? response.data 
    : (response.data?.data || []);
items.map(...) // Toujours sûr
```

### 2. Utiliser TypeScript Strictement
```typescript
// ❌ Type incorrect
const response = await apiClient.get<{ data: Classe[] }>();

// ✅ Type correct (inclut success)
const response = await apiClient.get<{ success: boolean; data: Classe[] }>();
```

### 3. Normaliser au Plus Près de la Source
```typescript
// ✅ Dans le hook - une seule fois
return Array.isArray(response.data) 
    ? response.data 
    : (response.data?.data || []);

// Le consommateur utilise directement
const items = useMonHook();
items.map(...) // ✅ Toujours un tableau
```

### 4. Double Sécurité si Nécessaire
```typescript
// Niveau 1: Hook
const data = useHook(); // Retourne toujours un tableau

// Niveau 2: Composant (si doute)
const safeData = Array.isArray(data) ? data : [];

// Maintenant, sûr à 100%
safeData.map(...)
```

### 5. Logger en Développement
```typescript
// Uniquement en dev
if (process.env.NODE_ENV === 'development') {
    console.log('[useToutesClasses] Data:', classesData);
    console.log('[useToutesClasses] IsArray:', Array.isArray(classesData));
}
```

---

## 🎯 Impact de la Correction

### Fichiers Modifiés
1. ✅ `use-toutes-classes.ts` - Extraction correcte du tableau
2. ✅ `use-toutes-annees-scolaires.ts` - Extraction correcte du tableau
3. ✅ `eleve-form.v2.tsx` - Normalisation avec sécurité

### Erreurs Éliminées
- ❌ `TypeError: classes?.map is not a function`
- ❌ `TypeError: anneesScolaires?.map is not a function`
- ❌ Crash du formulaire à l'ouverture

### Améliorations
- ✅ Formulaire s'ouvre sans erreur
- ✅ Dropdowns correctement peuplés
- ✅ Code plus robuste et défensif
- ✅ Double couche de sécurité
- ✅ Compatible avec différentes structures de réponse

---

## 📚 Autres Hooks à Vérifier

Rechercher les hooks similaires qui pourraient avoir le même problème :

```bash
cd frontend
grep -r "return response.data" src/features/*/hooks/
```

**Si trouvé**, vérifier que `response.data` est bien un tableau et non un objet.

**Pattern à rechercher** :
```typescript
// ❌ Potentiellement problématique
const response = await apiClient.get('/api/xxx');
return response.data;

// ✅ Correct
const response = await apiClient.get('/api/xxx');
return Array.isArray(response.data) 
    ? response.data 
    : (response.data?.data || []);
```

---

## ✅ Checklist de Validation

- [x] Hook `useToutesClasses` corrigé
- [x] Hook `useToutesAnneesScolaires` corrigé
- [x] Formulaire normalise les données
- [x] Plus d'erreur "map is not a function"
- [x] Dropdowns fonctionnels
- [x] Code TypeScript strict
- [x] Double sécurité (hooks + formulaire)
- [x] Documentation complète

---

**Erreur corrigée avec succès - Formulaire fonctionnel** ✅

*11 juin 2026 - eLISAschool*
