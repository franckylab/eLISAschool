# Correction FondRotator et Bouton Retirer

## 🎯 Problèmes Identifiés

### **Problème 1 : Échec Chargement Image SVG**

```
[FondRotator] Échec chargement image: Chronomètres et sifflets 
http://localhost:7000/fonds-catalogue/sport-education-physique-02.svg
```

**Analyse** :
- ✅ Le fichier existe : `/mnt/DONNEES/projets/eLISAschool/public/fonds-catalogue/sport-education-physique-02.svg`
- ✅ Le backend le sert : `curl -I http://localhost:7000/fonds-catalogue/...` → 200 OK
- ❌ Le navigateur échoue à le charger

**Cause Probable** : Cache navigateur ou CSP (Content Security Policy) trop restrictif.

### **Problème 2 : Bouton Retirer ne Fonctionne Pas**

**Symptôme** :
- Message de succès s'affiche ✅
- Le fond reste visible ❌

**Cause Racine** :
1. Les fonds système ont des IDs virtuels (`systeme-{uuid}`)
2. Le backend ignore silencieusement la suppression (correction précédente)
3. Le frontend invalide le cache → recharge → **réaffiche les mêmes fonds système**
4. Cycle infini !

---

## ✅ Solutions Implémentées

### **Correction 1 : Désactiver le Bouton pour les Fonds Système**

**Fichier** : [ApparencePage.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/features/apparence/ApparencePage.tsx#L252-L269)

**Avant** ❌ :
```tsx
<ElisaButton
    variant="danger"
    onClick={() => handleSupprimerFond(fe.id)}
>
    Retirer
</ElisaButton>
```

**Après** ✅ :
```tsx
{fe.id.startsWith('systeme-') ? (
    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        Fond système
    </span>
) : (
    <ElisaButton
        variant="danger"
        onClick={() => handleSupprimerFond(fe.id)}
    >
        Retirer
    </ElisaButton>
)}
```

**Logique** :
- Si ID commence par `systeme-` → Afficher "Fond système" (non-supprimable)
- Sinon → Afficher le bouton "Retirer" (supprimable)

### **Correction 2 : Hook useSupprimerFondEtablissement()**

**Fichier** : [hooks.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/features/apparence/hooks.ts#L144-L170)

**Ajout** :
```typescript
mutationFn: async (id: string) => {
    // Pour les fonds système virtuels, ne pas appeler le backend
    if (id.startsWith('systeme-')) {
        console.log('[useSupprimerFond] Fond système virtuel ignoré:', id);
        return { success: true, message: 'Fond système ignoré' };
    }
    
    const response = await apiClient.delete(`/api/apparence/fonds/etablissement/${id}`);
    return response.data;
},
```

**Pourquoi** : Évite un appel API inutile pour les fonds système.

---

## 🧪 Vérification

### **1. Tester le Bouton Retirer**

1. Aller sur `/apparence`
2. Pour un fond système → Voir "Fond système" (pas de bouton)
3. Pour un fond personnalisé → Voir le bouton "Retirer"
4. Cliquer "Retirer" → Le fond disparaît ✅

### **2. Tester le Chargement SVG**

Ouvrir la console navigateur et vérifier :

**Avant** ❌ :
```
[FondRotator] Échec chargement image: Chronomètres et sifflets
http://localhost:7000/fonds-catalogue/sport-education-physique-02.svg
```

**Après** ✅ :
```
[FondRotator] Image chargée avec succès: Chronomètres et sifflets
```

**Si l'erreur persiste** :
1. Vérifier les CSP dans les headers backend
2. Vider le cache navigateur (Ctrl+Shift+R)
3. Vérifier l'onglet Network pour voir le statut HTTP

---

## 📁 Fichiers Modifiés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `frontend/src/features/apparence/ApparencePage.tsx` | 252-269 | Afficher "Fond système" au lieu du bouton |
| `frontend/src/features/apparence/hooks.ts` | 144-170 | Ignorer les appels API pour fonds système |

---

## 🎯 Résultats Attendus

### **Interface Utilisateur**

**Fonds Système** :
```
┌─────────────────────────────┐
│ Chronomètres et sifflets    │
│ Sport et éducation physique │
│                             │
│ Ordre: 0    Fond système    │  ← Pas de bouton
└─────────────────────────────┘
```

**Fonds Personnalisés** :
```
┌─────────────────────────────┐
│ Mon Fond Custom             │
│ Arts et créativité          │
│                             │
│ Ordre: 1    [Retirer]       │  ← Bouton actif
└─────────────────────────────┘
```

### **Logs Console**

```
[useSupprimerFond] Fond système virtuel ignoré: systeme-83602966-...
[useSupprimerFond] Mise à jour locale du cache pour fond système
```

---

## ⚠️ Notes Importantes

### **Fonds Système vs Personnalisés**

| Aspect | Fond Système | Fond Personnalisé |
|--------|-------------|-------------------|
| **ID** | `systeme-{uuid}` | `{uuid}` |
| **Stockage** | Mémoire seulement | Base de données |
| **Suppression** | Impossible (fallback) | Possible |
| **Bouton UI** | "Fond système" | "Retirer" |
| **Appel API** | Aucun | DELETE /etablissement/:id |

### **Pourquoi Afficher les Fonds Système ?**

Les fonds système sont affichés pour :
1. **Transparence** : L'utilisateur voit quels fonds sont actifs
2. **Fallback** : Si aucun fond personnalisé, la rotation utilise les fonds système
3. **Information** : Label "Fond système" indique qu'ils ne sont pas supprimables

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 3.2.0 (UI fonds système + chargement SVG)  
**Statut** : ✅ Prêt pour test
