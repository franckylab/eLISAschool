# Mise à jour des Règles eLISAschool — Ultra-Responsivité v2.0

**Date** : 18 juin 2026  
**Version** : 2.0.0  
**Auteur** : franck arlos chendjou

---

## 📋 Résumé des Modifications

Les règles eLISAschool ont été mises à jour pour intégrer **l'ultra-responsivité** comme standard obligatoire pour tous les composants frontend.

---

## 🔄 Fichiers Modifiés

### 1. **elisaschool-frontend.md** (Règle Frontend)

#### Section 6 — Système d'Ultra-Responsivité ( COMPLÈTEMENT REFACTORISÉE )

**Avant** :
- 9 breakpoints (200px → 2560px)
- Variables CSS limitées
- Pas de hooks documentés
- Pas de patterns d'implémentation

**Après** :
- **11 breakpoints** (100px → 2560px) avec ajout de `xxs` (100px)
- **38+ variables CSS clamp()** pour tous les éléments dimensionnels
- **2 hooks documentés** : `useMediaQuery`, `useBreakpoint`
- **Patterns d'implémentation** complets avec exemples de code
- **Checklist ultra-responsivité** obligatoire

##### Nouvelles Variables CSS :
```css
/* Espacements */
--space-xxs, --space-xs, --space-sm, --space-md, --space-lg, --space-xl

/* Padding composants */
--padding-modal-header, --padding-modal-body, --padding-table-cell, --padding-toolbar

/* Icônes */
--icon-xxs, --icon-xs, --icon-sm, --icon-md, --icon-lg

/* Border-radius */
--radius-sm, --radius-md, --radius-lg, --radius-xl

/* Gaps */
--gap-xs, --gap-sm, --gap-md, --gap-lg
```

##### Hooks Documentés :
- **`useMediaQuery(query)`** : Détection de media queries temps réel
- **`useBreakpoint()`** : Logique conditionnelle avancée avec 10+ breakpoints
  - `bp.isMobile`, `bp.isTablet`, `bp.isDesktop`, `bp.is4K`
  - `bp.isAtLeast('lg')`, `bp.isAtMost('md')`
  - `bp.current`, `bp.width`

#### Section 21.3 — Composants Ultra-Responsifs de Référence ( NOUVELLE )

**4 composants de référence documentés** :

1. **CustomModal** : Modal avec clamp() sur width, maxHeight, paddings, fonts
2. **DataTable** : Transformation tableau → carte sur < 480px
3. **ElisaButton** : Heights, paddings, icons responsifs par taille
4. **ConfirmationModal** : Icônes, textes, gaps adaptatifs

Chaque composant inclut :
- Extrait de code pattern de référence
- Points clés d'implémentation
- Fichier source de référence

#### Section 31 — Checklist Nouveau Composant ( ENRICHIE )

**Avant** : 1 item responsive  
**Après** : **10 items ultra-responsivité** obligatoires

- Testé sur 3 breakpoints (320px, 768px, 1920px)
- Paddings avec clamp() ou var(--padding-*)
- Gaps avec var(--gap-*)
- Icônes avec var(--icon-*) ou clamp()
- Font-size avec clamp() ou variables
- Border-radius avec var(--radius-*)
- Pas de débordement horizontal mobile
- Texte lisible sans zoom sur 320px
- Boutons tactiles min 44x44px
- Transformation structurelle si nécessaire

---

### 2. **elisaschool-conventions.md** (Règle Backend)

#### Section 14 — Anti-patterns ( AUGMENTÉE )

**Ajout** :
> **NE PAS** oublier que le frontend est ultra-responsif (100px-2560px) — structurer les API responses en conséquence (pagination, select partiel, etc.)

#### Section 21 — Maintenance ( COMPLÉTÉE )

**Ajout des skills frontend** :
- `elisaschool-frontend-dev` — Guide de développement frontend (**ultra-responsivité**, composants, hooks, intégration API)
- `elisaschool-frontend-refactor` — Guide de refactorisation frontend (optimisation, modernisation, **ultra-responsivité**)

---

## 📊 Statistiques

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| Breakpoints | 9 | 11 | +2 |
| Variables CSS | ~15 | 38+ | +23 |
| Hooks documentés | 0 | 2 | +2 |
| Composants référence | 0 | 4 | +4 |
| Checklist items responsive | 1 | 10 | +9 |
| Lignes ajoutées | - | ~170 | +170 |
| Lignes modifiées | - | ~60 | +60 |

---

## 🎯 Impacts sur le Développement

### Pour les Développeurs Frontend

1. **Obligation** : Tous les nouveaux composants DOIVENT respecter les 10 critères ultra-responsivité
2. **Référence** : 4 composants modèles à consulter (CustomModal, DataTable, ElisaButton, ConfirmationModal)
3. **Outils** : 2 hooks prêts à l'emploi (useMediaQuery, useBreakpoint)
4. **Variables** : 38+ variables CSS pour cohérence parfaite

### Pour les Développeurs Backend

1. **Conscience** : Le frontend gère 11 breakpoints de 100px à 2560px
2. **API Design** : Structurer les responses pour supporter :
   - Pagination (nécessaire sur tous écrans)
   - Select partiel (optimisation mobile)
   - Données conditionnelles (transformation carte)

### Pour l'IA (Skills)

1. **Invocation obligatoire** : `/elisaschool-frontend-dev` ou `/elisaschool-frontend-refactor` avant tout code frontend
2. **Validation** : Vérifier les 10 items checklist avant de considérer un composant complet
3. **Référence** : Utiliser les 4 composants modèles comme templates

---

## 🧪 Testing Recommandé

### Pour chaque nouveau composant :

```bash
# 1. Test visuel sur 3 tailles minimum
- 320px (petit téléphone)
- 768px (tablette)
- 1920px (desktop)

# 2. Test de débordement
- Vérifier aucun scroll horizontal sur mobile
- Tester avec contenu long

# 3. Test tactile
- Boutons >= 44x44px
- Espacement suffisant entre éléments cliquables

# 4. Test lisibilité
- Texte lisible sans zoom sur 320px
- Contraste suffisant sur tous écrans
```

---

## 📚 Fichiers de Référence

### Règles mises à jour :
- `/mnt/DONNEES/projets/eLISAschool/.qoder/rules/elisaschool-frontend.md`
- `/mnt/DONNEES/projets/eLISAschool/.qoder/rules/elisaschool-conventions.md`

### Composants de référence :
- `frontend/src/components/modals/CustomModal.tsx`
- `frontend/src/components/ui/DataTable.tsx`
- `frontend/src/components/ui/ElisaButton.tsx`
- `frontend/src/components/ui/ConfirmationModal.tsx`

### Hooks :
- `frontend/src/hooks/use-media-query.ts`
- `frontend/src/hooks/use-breakpoint.ts`

### Variables CSS :
- `frontend/src/styles/globals.css` (section @theme et :root)

---

## 🚀 Prochaines Étapes Recommandées

1. **Appliquer l'ultra-responsivité aux composants restants** :
   - MenuVisibiliteColonnes (DataTable dropdown)
   - EtablissementSelectionModal
   - Formulaires (inputs, selects, labels)
   - Cards et conteneurs de pages
   - Sidebar/Navigation
   - Header

2. **Tests sur appareils réels** :
   - Téléphone Android (< 360px)
   - iPhone SE (375px)
   - iPad (768px)
   - Laptop (1366px)
   - Écran 4K (2560px)

3. **Documentation complémentaire** :
   - Guide de migration pour composants existants
   - Templates de composants ultra-responsifs
   - Exemples de transformation structurelle

---

## ✅ Validation

- [x] Section 6 frontend.md refactorisée (11 breakpoints, 38+ variables, hooks)
- [x] Section 21.3 ajoutée (4 composants référence)
- [x] Checklist section 31 enrichie (10 items)
- [x] Anti-patterns backend.md augmenté
- [x] Section maintenance backend.md complétée
- [x] Pas d'erreurs de syntaxe détectées
- [x] Cohérence entre les deux règles

---

**État** : ✅ **COMPLÉTÉ**  
**Version des règles** : 2.0.0 (Ultra-Responsivité)
