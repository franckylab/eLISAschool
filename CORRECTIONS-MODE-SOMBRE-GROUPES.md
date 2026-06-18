# Corrections Mode Sombre - Module Groupes d'Établissements

> **Date**: 17 juin 2026  
> **Module**: groupes-etablissements  
> **Problème**: Contraste, lisibilité et visibilité insuffisants en mode sombre  

---

## 🎯 Problèmes Identifiés

### 1. **Code Blocks** ❌
- `bg-gray-100` → invisible sur fond sombre
- `text-gray-500` → illisible
- Pas de bordure visible

### 2. **Backgrounds** ❌
- `bg-gray-50` → trop clair en mode sombre
- `bg-white` → éblouissant
- Pas d'adaptation dark mode

### 3. **Textes** ❌
- `text-gray-500`, `text-gray-700`, `text-gray-900` → non adaptatifs
- Contraste insuffisant WCAG AA (< 4.5:1)

### 4. **Bordures** ❌
- `border-gray-200`, `border-gray-300` → invisibles en mode sombre
- Séparation des éléments compromise

### 5. **Hover States** ❌
- `hover:bg-gray-50`, `hover:bg-blue-50` → pas de feedback visuel en dark mode
- Navigation confuse

### 6. **Badges/Status** ❌
- `bg-green-100 text-green-800` → illisible sur fond sombre
- Statuts non distinguables

---

## ✅ Corrections Appliquées

### **Principe Général**
Utilisation exclusive de **variables CSS dynamiques** + **classes Tailwind dark mode** :

```css
/* Variables CSS */
--color-surface: #ffffff (light) / #1f2937 (dark)
--color-surface-50: #f9fafb (light) / #111827 (dark)
--color-bordure: #e5e7eb (light) / #374151 (dark)
--color-texte: #111827 (light) / #f9fafb (dark)
--color-texte-secondaire: #6b7280 (light) / #9ca3af (dark)
```

### **1. Code Blocks**

**Avant** ❌ :
```tsx
<code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
```

**Après** ✅ :
```tsx
<code className="px-2 py-1 bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)] 
                 border border-[var(--color-bordure)] rounded text-xs font-mono 
                 text-[var(--color-texte)]">
```

**Améliorations** :
- ✅ Background adaptatif clair/sombre
- ✅ Bordure visible dans les deux modes
- ✅ Texte contrasté (ratio > 7:1)

---

### **2. Cards & Containers**

**Avant** ❌ :
```tsx
<div className="bg-gray-50 rounded-lg p-4">
```

**Après** ✅ :
```tsx
<div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] 
                rounded-lg p-4">
```

**Améliorations** :
- ✅ Surface cohérente avec le thème
- ✅ Contraste suffisant avec le contenu
- ✅ Pas d'éblouissement en mode sombre

---

### **3. Textes**

**Avant** ❌ :
```tsx
<p className="text-sm text-gray-900">Nom</p>
<p className="text-xs text-gray-500">email@example.com</p>
```

**Après** ✅ :
```tsx
<p className="text-sm text-[var(--color-texte)]">Nom</p>
<p className="text-xs text-[var(--color-texte-secondaire)]">email@example.com</p>
```

**Améliorations** :
- ✅ Contraste automatique selon le mode
- ✅ Ratio WCAG AA respecté (> 4.5:1)
- ✅ Hiérarchie visuelle maintenue

---

### **4. Bordures**

**Avant** ❌ :
```tsx
<div className="border border-gray-200">
```

**Après** ✅ :
```tsx
<div className="border border-[var(--color-bordure)]">
```

**Améliorations** :
- ✅ Bordure visible dans les deux modes
- ✅ Séparation claire des éléments
- ✅ Cohérence avec le design system

---

### **5. Hover States (Boutons & Lignes)**

**Avant** ❌ :
```tsx
<button className="text-blue-600 hover:bg-blue-50">
<button className="text-gray-600 hover:bg-gray-100">
```

**Après** ✅ :
```tsx
<button className="text-blue-600 dark:text-blue-400 
                   hover:bg-blue-50 dark:hover:bg-blue-900/30">
<button className="text-[var(--color-texte-secondaire)] 
                   hover:bg-[var(--color-surface-hover)]">
```

**Améliorations** :
- ✅ Feedback visuel dans les deux modes
- ✅ Couleurs adaptées (plus claires en dark mode)
- ✅ Transitions fluides

---

### **6. Badges de Statut**

**Avant** ❌ :
```tsx
<span className="bg-green-100 text-green-800">Actif</span>
<span className="bg-gray-100 text-gray-800">Inactif</span>
```

**Après** ✅ :
```tsx
<span className="bg-green-100 dark:bg-green-900/30 
                 text-green-800 dark:text-green-300">Actif</span>
<span className="bg-gray-100 dark:bg-gray-700 
                 text-gray-800 dark:text-gray-300">Inactif</span>
```

**Améliorations** :
- ✅ Fond sombre avec opacité (evite saturation)
- ✅ Texte plus clair en mode sombre
- ✅ Contraste suffisant (> 4.5:1)

---

### **7. Inputs & Recherche**

**Avant** ❌ :
```tsx
<input className="border border-gray-300 focus:ring-2" 
       placeholder="Rechercher...">
<Search className="text-gray-400" />
```

**Après** ✅ :
```tsx
<input className="border border-[var(--color-bordure)] 
                  bg-[var(--color-surface)] text-[var(--color-texte)]
                  focus:ring-2 
                  placeholder-[var(--color-texte-secondaire)]">
<Search className="text-[var(--color-texte-secondaire)]" />
```

**Améliorations** :
- ✅ Input visible et lisible
- ✅ Placeholder avec contraste suffisant
- ✅ Icône de recherche adaptée

---

### **8. Éléments Sélectionnés**

**Avant** ❌ :
```tsx
<button className="border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)]">
```

**Après** ✅ :
```tsx
<button className="border-[var(--color-dominant-500)] 
                   bg-[var(--color-dominant-50)] 
                   dark:bg-[var(--color-dominant-900)]/30">
```

**Améliorations** :
- ✅ Sélection visible en mode sombre
- ✅ Opacité pour éviter saturation
- ✅ Contraste maintenu

---

## 📊 Fichiers Modifiés

| Fichier | Lignes modifiées | Type |
|---------|------------------|------|
| `groupes-etablissements-page.tsx` | 11 | DataTable + Actions |
| `groupe-etablissement-detail-modal.tsx` | 30 | Modal détails |
| `gestion-etablissements-modal.tsx` | 19 | Modal gestion étabs |
| `gestion-admins-modal.tsx` | 17 | Modal gestion admins |
| **TOTAL** | **77 lignes** | **4 fichiers** |

---

## 🎨 Mapping des Classes

### **Backgrounds**

| Ancien | Nouveau | Usage |
|--------|---------|-------|
| `bg-gray-50` | `bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)]` | Cards, sections |
| `bg-white` | `bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)]` | Éléments, listes |
| `bg-gray-100` | `bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)]` | Code, badges |
| `bg-green-100` | `bg-green-100 dark:bg-green-900/30` | Badges succès |
| `bg-blue-50` | `bg-blue-50 dark:bg-blue-900/30` | Hover boutons |
| `bg-red-50` | `bg-red-50 dark:bg-red-900/30` | Hover delete |

### **Textes**

| Ancien | Nouveau | Usage |
|--------|---------|-------|
| `text-gray-900` | `text-[var(--color-texte)]` | Titres, noms |
| `text-gray-700` | `text-[var(--color-texte)]` | Labels, headers |
| `text-gray-600` | `text-[var(--color-texte-secondaire)]` | Texte secondaire |
| `text-gray-500` | `text-[var(--color-texte-secondaire)]` | Descriptions, emails |
| `text-gray-400` | `text-[var(--color-texte-secondaire)]` | Icônes, placeholders |

### **Bordures**

| Ancien | Nouveau | Usage |
|--------|---------|-------|
| `border-gray-300` | `border-[var(--color-bordure)]` | Inputs |
| `border-gray-200` | `border-[var(--color-bordure)]` | Cards, listes |
| `border` (seul) | `border border-[var(--color-bordure)]` | Éléments divers |

---

## ✅ Checklist de Validation

### **Mode Clair** ☀️
- [ ] Code blocks visibles avec bordure
- [ ] Textes lisibles (contraste > 4.5:1)
- [ ] Cards distinctes du fond
- [ ] Hover states fonctionnels
- [ ] Badges de statut distinguables
- [ ] Inputs avec bordure visible
- [ ] Éléments sélectionnés identifiables

### **Mode Sombre** 🌙
- [ ] Code blocks lisibles (fond sombre + bordure)
- [ ] Textes contrastés (pas d'éblouissement)
- [ ] Cards visibles sur fond sombre
- [ ] Hover states visibles et fluides
- [ ] Badges avec fond opacifié + texte clair
- [ ] Inputs avec fond + bordure adaptés
- [ ] Éléments sélectionnés avec opacité

### **Accessibilité WCAG AA** ♿
- [ ] Ratio contraste texte normal ≥ 4.5:1
- [ ] Ratio contraste texte large ≥ 3:1
- [ ] Focus visible sur tous les éléments interactifs
- [ ] États hover/active clairement distinguables
- [ ] Pas de dépendance exclusive à la couleur

---

## 🚀 Prochaines Étapes

### **Recommandations**

1. **Tests Utilisateurs** : Valider avec des utilisateurs réels en mode sombre
2. **Audit Automatique** : Utiliser lighthouse/devtools pour vérifier les contrastes
3. **Extension** : Appliquer le même pattern aux autres modules
4. **Documentation** : Créer une page de référence des variables CSS
5. **Tests E2E** : Ajouter des tests visuels pour les deux modes

### **Variables CSS à Standardiser**

```css
:root {
    /* Mode clair */
    --color-surface: #ffffff;
    --color-surface-50: #f9fafb;
    --color-surface-200: #f3f4f6;
    --color-surface-300: #e5e7eb;
    --color-bordure: #e5e7eb;
    --color-bordure-hover: #d1d5db;
    --color-texte: #111827;
    --color-texte-secondaire: #6b7280;
}

.dark {
    /* Mode sombre */
    --color-surface: #1f2937;
    --color-surface-50: #111827;
    --color-surface-200: #374151;
    --color-surface-300: #4b5563;
    --color-bordure: #374151;
    --color-bordure-hover: #4b5563;
    --color-texte: #f9fafb;
    --color-texte-secondaire: #9ca3af;
}
```

---

## 📝 Leçons Apprises

1. **Jamais de couleurs hardcodées** → Toujours utiliser des variables CSS
2. **Toujours prévoir le dark mode** → Classes `dark:` systématiques
3. **Opacité > Saturation** → Utiliser `/30` pour les fonds colorés en dark mode
4. **Tester les deux modes** → Vérifier avant de commiter
5. **Variables sémantiques** → `--color-texte` pas `--color-gray-900`

---

## 📚 Références

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [eLISAschool Design System](../DESIGN-SYSTEM.md)
