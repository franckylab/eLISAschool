# Correction Fallback Automatique des Fonds Système

## 🎯 Problème Persistant Identifié

Les logs montraient que :

✅ **useCatalogueFonds** : `Fonds extraits: 36` (fonctionne)  
✅ **useConfigRotation** : `Config extraite: {actif: true, delaiRotation: 86400}` (fonctionne)  
❌ **useFondsRotation** : `Fonds extraits: 0` (tableau vide)  
❌ **useFondsEtablissement** : `Fonds extraits: 0` (tableau vide)  

## 🔍 Analyse Approfondie

### **Cause Racine : Données Manquantes**

Le service backend retournait des tableaux vides car :

1. ✅ **36 fonds existent** dans la table `fonds` (catalogue global)
2. ❌ **0 fonds associés** dans la table `fonds_etablissement` pour l'établissement actif
3. ❌ Donc `getFondsRotation()` et `getFondsEtablissement()` retournaient `[]`

### **Pourquoi C'était un Problème**

L'expérience utilisateur attendue :
- Un établissement découvre l'apparence → devrait voir **des fonds par défaut**
- L'admin personnalise → sélectionne des fonds spécifiques du catalogue
- Sans cette personnalisation → **aucun fond affiché** (fallback couleur unie seulement)

### **Logique Avant (Incorrecte)**

```typescript
// getFondsEtablissement() - AVANT
async getFondsEtablissement(etablissementId: string): Promise<FondEtablissement[]> {
    return this.fondEtabRepo.find({
        where: { etablissementId },  // ← Retourne [] si aucune association
        relations: ['fond'],
    });
}

// getFondsRotation() - AVANT
async getFondsRotation(etablissementId: string): Promise<Fond[]> {
    const fondsEtab = await this.fondEtabRepo.find({
        where: { etablissementId, actif: true },  // ← Retourne [] si aucune association
        relations: ['fond'],
    });
    return fondsEtab.map((fe) => fe.fond);  // ← Retourne []
}
```

## ✅ Solution : Fallback Automatique sur les Fonds Système

### **Nouvelle Logique**

```
1. Chercher les fonds sélectionnés par l'établissement
2. Si trouvés → les retourner
3. Si NON trouvés → retourner TOUS les fonds système actifs (fallback)
```

### **Implémentation**

#### **1. getFondsEtablissement()**

**Fichier** : [apparence.service.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/modules/apparence/services/apparence.service.ts#L88-L125)

```typescript
async getFondsEtablissement(etablissementId: string): Promise<FondEtablissement[]> {
    // 1. Chercher les fonds sélectionnés par l'établissement
    const fondsSelectionnes = await this.fondEtabRepo.find({
        where: { etablissementId },
        relations: ['fond'],
        order: { ordre: 'ASC', dateAjout: 'DESC' },
    });

    // 2. Si des fonds sont sélectionnés, les retourner
    if (fondsSelectionnes.length > 0) {
        return fondsSelectionnes;
    }

    // 3. Sinon, retourner tous les fonds système actifs (fallback automatique)
    logger.info(`[Apparence] Aucun fond sélectionné pour l'établissement ${etablissementId}, utilisant les fonds système`);
    const fondsSysteme = await this.fondRepo.find({
        where: { estActif: true, estSysteme: true },
        order: { categorie: 'ASC', nom: 'ASC' },
    });

    // 4. Retourner sous forme de FondEtablissement virtuel (sans persister)
    return fondsSysteme.map((fond) => {
        const fondEtab = new FondEtablissement();
        fondEtab.id = `systeme-${fond.id}`;
        fondEtab.etablissementId = etablissementId;
        fondEtab.fondId = fond.id;
        fondEtab.fond = fond;
        fondEtab.actif = true;
        fondEtab.ordre = 0;
        fondEtab.dateAjout = new Date();
        return fondEtab;
    });
}
```

#### **2. getFondsRotation()**

**Fichier** : [apparence.service.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/modules/apparence/services/apparence.service.ts#L357-L376)

```typescript
async getFondsRotation(etablissementId: string): Promise<Fond[]> {
    // 1. Chercher les fonds sélectionnés et actifs
    const fondsEtab = await this.fondEtabRepo.find({
        where: { etablissementId, actif: true },
        relations: ['fond'],
        order: { ordre: 'ASC' },
    });

    // 2. Si des fonds sont sélectionnés, les retourner
    if (fondsEtab.length > 0) {
        return fondsEtab.map((fe) => fe.fond);
    }

    // 3. Sinon, retourner tous les fonds système actifs (fallback automatique)
    logger.info(`[Apparence] Rotation: aucun fond sélectionné pour ${etablissementId}, utilisant les fonds système`);
    return this.fondRepo.find({
        where: { estActif: true, estSysteme: true },
        order: { categorie: 'ASC', nom: 'ASC' },
    });
}
```

### **Points Clés de l'Implémentation**

1. **Fonds virtuels** : Les `FondEtablissement` créés pour le fallback ne sont **PAS persistés** en base
2. **ID unique** : `id = `systeme-${fond.id}`` pour éviter les collisions
3. **Tous actifs** : `actif: true` pour que la rotation fonctionne
4. **Ordre par défaut** : `ordre: 0` (tous au même niveau, triés par catégorie/nom)
5. **Logging** : Message info pour tracer quand le fallback est utilisé

## 🎯 Résultats Attendus

### **Logs Après Correction**

```javascript
// Backend
[Apparence] Aucun fond sélectionné pour l'établissement f7915d5e-..., utilisant les fonds système
[Apparence] Rotation: aucun fond sélectionné pour f7915d5e-..., utilisant les fonds système

// Frontend
[useFondsRotation] Réponse API complète: {success: true, data: Array(36)}
[useFondsRotation] Fonds extraits: 36  // ✅ MAINTENANT 36 !

[useFondsEtablissement] Réponse API complète: {success: true, data: Array(36)}
[useFondsEtablissement] Fonds extraits: 36  // ✅ MAINTENANT 36 !

[FondRotator] État des hooks: {fonds: 36, isLoadingFonds: false, isErrorFonds: false, ...}
[FondRotator] Configuration rotation: {rotationActive: true, delaiRotation: 86400000}
[FondRotator] Affichage du fond: {nom: "Cahier Scolaire", categorie: "education", ...}  // ✅ FOND AFFICHÉ !
[FondRotator] Timer rotation démarré, intervalle: 86400000 ms
```

### **Comportement Utilisateur**

**Première connexion** :
- ✅ 36 fonds système disponibles automatiquement
- ✅ Rotation activée (si configuration `fonds.actif = true`)
- ✅ Fonds affichés en arrière-plan avec fondu

**Après personnalisation** :
- L'admin sélectionne des fonds spécifiques du catalogue
- Ces fonds sont persistés dans `fonds_etablissement`
- Le fallback n'est **PLUS utilisé** (priorité aux fonds sélectionnés)

**Si retrait de tous les fonds personnalisés** :
- Retour automatique au fallback système
- Aucun fond "cassé" ou vide

## 📁 Fichiers Modifiés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `backend/src/modules/apparence/services/apparence.service.ts` | 88-125, 357-376 | Fallback automatique sur fonds système |

## 🧪 Vérification

1. **Redémarrer le backend** :
   ```bash
   cd backend
   pnpm dev
   ```

2. **Vérifier les logs backend** :
   ```bash
   tail -f backend/logs/combined1.log | grep -i "apparence"
   ```
   
   Attendre :
   ```
   [Apparence] Aucun fond sélectionné pour l'établissement ..., utilisant les fonds système
   [Apparence] Rotation: aucun fond sélectionné pour ..., utilisant les fonds système
   ```

3. **Vérifier les logs frontend** :
   ```
   [useFondsRotation] Fonds extraits: 36
   [FondRotator] Affichage du fond: {nom: "...", ...}
   ```

4. **Vérifier visuellement** :
   - Un fond SVG devrait apparaître en arrière-plan
   - L'indicateur de débogage (en bas à droite) montre le nom du fond
   - La rotation devrait fonctionner (changer toutes les 24h par défaut)

## ⚠️ Notes Importantes

1. **Fonds système** : Ce sont les fonds avec `estSysteme: true` dans la table `fonds`
2. **Migration 081** : Crée 36 fonds système (12 catégories × 3 fonds)
3. **Personnalisation future** : Quand l'admin ajoute des fonds, ils remplacent le fallback
4. **Performance** : Le fallback charge tous les fonds système (~36), acceptable pour un catalogue SVG léger
5. **Multi-tenant** : Chaque établissement a son propre fallback indépendant

## 🚀 Prochaines Étapes Optionnelles

1. **Ajouter un bouton "Réinitialiser aux fonds par défaut"** dans la page Apparence
2. **Permettre de désactiver le fallback** (paramètre `fonds.fallback_systeme`)
3. **Limiter le nombre de fonds fallback** (ex: 10 au hasard au lieu de 36)
4. **Cache Redis** pour les requêtes de fallback fréquentes

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 3.0.0 (fallback automatique)  
**Statut** : ✅ Prêt pour test final
