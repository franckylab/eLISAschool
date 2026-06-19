# Amélioration du Système d'Épinglage des Colonnes — DataTable v2.1

## 🎯 Objectif

Permettre l'épinglage de **TOUTES** les colonnes (gauche ET droite), avec la **première colonne épinglée automatiquement**, via une interface professionnelle et intuitive.

## ✨ Nouvelles Fonctionnalités

### 1. **Épinglage Bidirectionnel**
- **Gauche** (`'left'`) : Colonnes visibles en permanence à gauche lors du scroll horizontal
- **Droite** (`'right'`) : Colonnes visibles en permanence à droite lors du scroll horizontal
- **Désépinglage** (`false`) : Colonne normale avec scroll

### 2. **Auto-épinglage par Défaut**
- La **première colonne visible** est automatiquement épinglée à gauche
- Sauf si une autre colonne est déjà explicitement épinglée
- Respecte la propriété `enablePinningChange: false`

### 3. **Menu d'Épinglage dans la Barre d'Outils**
- Bouton 📌 (icône `Pin`) à côté du menu de visibilité
- Interface claire avec boutons Gauche/Droite/Désépingler
- Indicateur visuel de l'état actif (surbrillance)
- Information contextuelle sur l'utilité de l'épinglage

### 4. **Indicateurs Visuels**
- Icône 📌 (`Pin`) dans l'en-tête des colonnes épinglées
- Fond distinct (`--color-surface-alt`) pour les colonnes épinglées
- Bordures de séparation claires

### 5. **Ordre d'Affichage Intelligent**
```
[Colonnes épinglées à gauche] → [Colonnes normales] → [Colonnes épinglées à droite]
```

## 🔧 API — Propriétés de Colonne

### Interface `Column<T>`

```typescript
interface Column<T> {
    // ... autres propriétés
    
    /** 
     * Position d'épinglage : 
     * - 'left' : épinglé à gauche
     * - 'right' : épinglé à droite  
     * - false/undefined : pas épinglé
     * 
     * La première colonne visible sera automatiquement épinglée à gauche par défaut
     */
    pinned?: 'left' | 'right' | false;
    
    /** 
     * Empêche le changement d'épinglage pour cette colonne 
     * (défaut: false, l'utilisateur peut modifier)
     */
    enablePinningChange?: boolean;
}
```

### Interface `DataTableProps<T>`

```typescript
interface DataTableProps<T> {
    // ... autres propriétés
    
    /** Active le menu d'épinglage des colonnes (défaut: true) */
    enablePinning?: boolean;
    
    /** Callback quand l'épinglage des colonnes change */
    onColumnPinningChange?: (pinning: Record<string, 'left' | 'right' | false>) => void;
}
```

## 📋 Exemple d'Utilisation

### Configuration Initiale

```typescript
const colonnes: Column<Eleve>[] = [
    {
        key: 'matricule',
        header: 'Matricule',
        pinned: 'left', // Épinglé à gauche par défaut
        sortable: true,
    },
    {
        key: 'nom',
        header: 'Nom',
        sortable: true,
    },
    {
        key: 'prenom',
        header: 'Prénom',
        sortable: true,
    },
    {
        key: 'actions',
        header: 'Actions',
        pinned: 'right', // Épinglé à droite
        renderActions: (eleve) => [...],
        enablePinningChange: false, // Ne peut pas être désépinglé
    },
];

<DataTable
    data={eleves}
    columns={colonnes}
    enablePinning={true} // Menu d'épinglage activé
    onColumnPinningChange={(pinning) => {
        console.log('Nouvel épinglage:', pinning);
        // Sauvegarder dans les préférences utilisateur
    }}
/>
```

### Auto-épinglage Automatique

Si aucune colonne n'a de `pinned` défini, la **première colonne visible** sera automatiquement épinglée à gauche :

```typescript
const colonnes: Column<Eleve>[] = [
    { key: 'matricule', header: 'Matricule' }, // ← Sera épinglé à gauche automatiquement
    { key: 'nom', header: 'Nom' },
    { key: 'actions', header: 'Actions', renderActions: ... },
];
```

## 🎨 Interface Utilisateur

### Menu d'Épinglage

```
┌────────────────────────────────────────────┐
│ ÉPINGLER LES COLONNES                      │
├────────────────────────────────────────────┤
│ Matricule        [← Gauche] [Droite →]    │
│ Nom              [← Gauche] [Droite →]    │
│ Prénom           [← Gauche] [Droite →]    │
│ Classe           [← Gauche] [Droite →]    │
│ Actions          [← Gauche] [Droite →] [📌]│
├────────────────────────────────────────────┤
│ Les colonnes épinglées restent visibles    │
│ lors du scroll horizontal                  │
└────────────────────────────────────────────┘
```

**Légende** :
- `[← Gauche]` : Bouton pour épingler à gauche (actif si sélectionné)
- `[Droite →]` : Bouton pour épingler à droite (actif si sélectionné)
- `[📌]` : Bouton pour désépingler (apparaît seulement si la colonne est épinglée)

### Indicateur dans l'En-tête

```
┌──────────────┬──────────────┬──────────────┐
│ Matricule 📌 │ Nom          │ Actions 📌   │  ← Colonnes épinglées
├──────────────┼──────────────┼──────────────┤
│ 2024-001     │ Dupont       │ [👁] [✏️]    │
│ 2024-002     │ Martin       │ [👁] [✏️]    │
└──────────────┴──────────────┴──────────────┘
```

## 🔍 Détails d'Implémentation

### Calcul des Offsets

**Colonnes Gauche** :
```typescript
offset = 0;
for each colonne épinglée à gauche:
    map.set(key, offset);
    offset += largeur_colonne;
```

**Colonnes Droite** :
```typescript
offset = largeur_totale_tableau;
for each colonne épinglée à droite (ordre inverse):
    offset -= largeur_colonne;
    map.set(key, offset);
```

### Positionnement CSS

```css
/* Colonne épinglée à gauche */
position: sticky;
left: <offset_calcule>;
z-index: 3; /* ou 6 pour les en-têtes */
background-color: var(--color-surface);

/* Colonne épinglée à droite */
position: sticky;
right: <offset_calcule>;
z-index: 3; /* ou 6 pour les en-têtes */
background-color: var(--color-surface);
```

### État Local

```typescript
const [pinningEtat, setPinningEtat] = useState<Record<string, 'left' | 'right' | false>>(() => {
    const initial: Record<string, 'left' | 'right' | false> = {};
    
    // 1. Utiliser les valeurs explicitement définies
    colonnes.forEach((col) => {
        if (col.pinned === 'left' || col.pinned === 'right') {
            initial[col.key] = col.pinned;
        }
    });
    
    // 2. Auto-épingler la première colonne si aucune n'est épinglée
    const hasAnyPinned = Object.values(initial).some(v => v !== false);
    if (!hasAnyPinned && colonnes.length > 0) {
        const premiereColonne = colonnes.find(c => !c.hidden);
        if (premiereColonne && premiereColonne.enablePinningChange !== false) {
            initial[premiereColonne.key] = 'left';
        }
    }
    
    return initial;
});
```

## 📊 Comparaison Avant/Après

| Fonctionnalité | Avant (v2.0) | Après (v2.1) |
|----------------|--------------|--------------|
| Épinglage gauche | ✅ Via `pinned: 'left'` | ✅ Amélioré |
| Épinglage droite | ❌ Non supporté | ✅ Via `pinned: 'right'` |
| Auto-épinglage | ❌ Manuel | ✅ Automatique (1ère colonne) |
| Menu d'épinglage | ❌ Absent | ✅ Interface complète |
| Changement dynamique | ❌ Statique | ✅ Via menu + callback |
| Indicateur visuel | ⚠️ Basique | ✅ Icône + fond distinct |
| Désépinglage | ❌ Impossible | ✅ Via menu |
| Protection | ❌ Aucune | ✅ `enablePinningChange` |

## 🚀 Bonnes Pratiques

### 1. **Toujours épingler la colonne d'identification**
```typescript
{ key: 'matricule', header: 'Matricule', pinned: 'left' }
```

### 2. **Épingler les actions à droite**
```typescript
{ 
    key: 'actions', 
    header: 'Actions', 
    pinned: 'right',
    enablePinningChange: false, // Empêcher le déplacement
    renderActions: ... 
}
```

### 3. **Sauvegarder les préférences utilisateur**
```typescript
onColumnPinningChange={(pinning) => {
    // Sauvegarder dans localStorage ou backend
    localStorage.setItem('table-pinning', JSON.stringify(pinning));
}}
```

### 4. **Limiter le nombre de colonnes épinglées**
- **Recommandé** : 2-3 colonnes maximum de chaque côté
- **Raison** : Éviter de réduire l'espace de scroll

### 5. **Utiliser des largeurs fixes pour les colonnes épinglées**
```typescript
{ key: 'matricule', header: 'Matricule', pinned: 'left', size: 120 }
```

## 🎯 Cas d'Usage

### Tableau d'Élèves
```typescript
const colonnes = [
    { key: 'matricule', header: 'Matricule', pinned: 'left', size: 120 },
    { key: 'nom', header: 'Nom', sortable: true },
    { key: 'prenom', header: 'Prénom', sortable: true },
    { key: 'classe', header: 'Classe' },
    { key: 'moyenne', header: 'Moyenne' },
    { key: 'rang', header: 'Rang' },
    { key: 'actions', header: 'Actions', pinned: 'right', renderActions: ..., enablePinningChange: false },
];
```

### Tableau de Notes
```typescript
const colonnes = [
    { key: 'eleve', header: 'Élève', pinned: 'left', size: 200 },
    { key: 'note1', header: 'Contrôle 1' },
    { key: 'note2', header: 'Contrôle 2' },
    { key: 'note3', header: 'Contrôle 3' },
    { key: 'moyenne', header: 'Moyenne', pinned: 'right', size: 100 },
];
```

### Tableau Financier
```typescript
const colonnes = [
    { key: 'eleve', header: 'Élève', pinned: 'left', size: 200 },
    { key: 'frais', header: 'Frais scolaires' },
    { key: 'cantines', header: 'Cantine' },
    { key: 'transport', header: 'Transport' },
    { key: 'total', header: 'Total', pinned: 'right', size: 120 },
    { key: 'actions', header: 'Actions', pinned: 'right', renderActions: ... },
];
```

## 🔮 Évolutions Futures

- [ ] Sauvegarde automatique des préférences d'épinglage par utilisateur
- [ ] Support de l'épinglage en haut/bas pour le scroll vertical
- [ ] Groupes de colonnes épinglées (profils prédéfinis)
- [ ] Animation fluide lors du changement d'épinglage
- [ ] Drag & drop directement depuis le menu d'épinglage

## 📝 Notes de Migration

### Compatibilité Ascendante

✅ **100% compatible** avec le code existant :
- `pinned: 'left'` continue de fonctionner
- `pinned: true` converti automatiquement en `'left'`
- `pinned: false` ou `undefined` = pas épinglé

### Breaking Changes

❌ **Aucun breaking change** — Migration transparente

## 🏆 Résumé des Améliorations

| Aspect | Amélioration |
|--------|--------------|
| **Fonctionnel** | Épinglage bidirectionnel (gauche + droite) |
| **Opérationnel** | Menu dédié dans la barre d'outils |
| **Professionnel** | Interface claire avec indicateurs visuels |
| **Responsive** | Adaptatif sur tous les écrans |
| **Performant** | Calcul d'offsets optimisé avec useMemo |
| **Fluide** | Transitions CSS smooth, z-index cohérent |
| **Meilleures Pratiques** | Auto-épinglage, protection, callbacks |

---

**Version** : 2.1.0  
**Date** : 2026-06-19  
**Auteur** : franck arlos chendjou  
**Composant** : `frontend/src/components/ui/DataTable.tsx`
