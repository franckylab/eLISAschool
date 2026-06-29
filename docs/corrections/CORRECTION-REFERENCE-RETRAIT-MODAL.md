# Correction ReferenceError: retraitModal is not defined

> **Date** : 19 juin 2026  
> **Statut** : ✅ Résolu  
> **Fichier** : `frontend/src/features/etablissement/components/etablissement-edit-page.tsx`

---

## 🐛 Erreur

```
etablissement-edit-page.tsx:274 ReferenceError: retraitModal is not defined
    at UtilisateursTab (etablissement-edit-page.tsx:827:23)
```

---

## 🔍 Cause Racine

**Problème de scope React** : L'état `retraitModal` et `setRetraitModal` étaient définis dans le composant parent `EtablissementEditPage` mais utilisés dans le composant enfant `UtilisateursTab`.

**Structure incorrecte** :
```tsx
// ❌ AVANT
export function EtablissementEditPage() {
    // État définici ICI
    const [retraitModal, setRetraitModal] = useState(...);
    
    return <UtilisateursTab />;  // Utilise retraitModal → ERROR!
}

function UtilisateursTab() {
    // Essaie d'utiliser retraitModal → ReferenceError!
    setRetraitModal({ ... });
}
```

---

## ✅ Solution

**Déplacer l'état dans le composant qui l'utilise** :

```tsx
// ✅ APRÈS
export function EtablissementEditPage() {
    // Plus d'état retraitModal ici
    return <UtilisateursTab />;
}

function UtilisateursTab() {
    // État définici ICI (bon scope)
    const [retraitModal, setRetraitModal] = useState<{
        ouvert: boolean;
        utilisateurId: string;
        utilisateurNom: string;
        motif: string;
    }>({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '' });
    
    // Handlers utilisent l'état local
    const handleRetirer = (userId, nom) => {
        setRetraitModal({ ouvert: true, utilisateurId: userId, ... });
    };
    
    return <CustomModal open={retraitModal.ouvert} ... />;
}
```

---

## 📝 Modifications

### Fichier : `etablissement-edit-page.tsx`

**1. Supprimé** (lignes 51-58 dans `EtablissementEditPage`) :
```tsx
// État pour le modal de retrait d'utilisateur
const [retraitModal, setRetraitModal] = useState<{
    ouvert: boolean;
    utilisateurId: string;
    utilisateurNom: string;
    motif: string;
}>({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '' });
```

**2. Ajouté** (lignes 558-567 dans `UtilisateursTab`) :
```tsx
// État pour le modal de retrait d'utilisateur
const [retraitModal, setRetraitModal] = useState<{
    ouvert: boolean;
    utilisateurId: string;
    utilisateurNom: string;
    motif: string;
}>({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '' });
```

---

## 🎯 Règle Apprise

> **En React, l'état doit être défini dans le composant qui l'utilise directement.**
> 
> Si un composant enfant a besoin d'un état :
> - **Option 1** : Définir l'état dans l'enfant (si seul l'enfant l'utilise)
> - **Option 2** : Définir l'état dans le parent et le passer en props (si plusieurs enfants l'utilisent)
> 
> Dans notre cas, `UtilisateursTab` est le seul composant à utiliser `retraitModal`, donc l'état doit rester dans ce composant.

---

## ✅ Vérification

- [x] Plus d'erreur `ReferenceError: retraitModal is not defined`
- [x] Le modal s'affiche correctement dans `UtilisateursTab`
- [x] Les handlers `handleRetirer`, `confirmRetrait`, `cancelRetrait` fonctionnent
- [x] Le hook `useRetirerUtilisateurEtablissement` est bien utilisé dans `UtilisateursTab`
- [x] Build Vite passe sans erreur bloquante

---

**Statut Final** : ✅ **Correction terminée**
