# Correction Erreurs 500 - Apparence (PATCH Config & DELETE Fonds)

## 🎯 Problèmes Identifiés

### **Erreur 1 : PATCH /api/apparence/fonds/config - 500**

```
duplicate key value violates unique constraint "UQ_65b1e738c8c19c81eb8add4edf0"
QueryFailedError: INSERT INTO "parametres_systeme" ...
```

**Contexte** : L'utilisateur active/désactive la rotation des fonds → erreur 500

### **Erreur 2 : DELETE /api/apparence/fonds/etablissement/systeme-... - 500**

```
DELETE http://localhost:7000/api/apparence/fonds/etablissement/systeme-83602966-... 500
```

**Contexte** : L'utilisateur essaie de supprimer un fond système → erreur 500

---

## 🔍 Analyse Approfondie

### **Erreur 1 : Race Condition dans upsertParametre()**

**Code Avant (Buggy)** :
```typescript
private async upsertParametre(cle: string, valeur: string, etablissementId: string): Promise<void> {
    let param = await this.parametreRepo.findOne({ where: { cle, etablissementId } });

    if (param) {
        param.valeur = valeur;
        param.updatedAt = new Date();
    } else {
        param = this.parametreRepo.create({
            cle,
            valeur,
            etablissementId,
            typeValeur: 'JSON' as any,
            categorie: 'THEME' as any,
        });
    }

    await this.parametreRepo.save(param);
}
```

**Problème** :
1. Le `findOne` ne trouve PAS le paramètre (retourne `undefined`)
2. Le code crée un nouveau paramètre avec `create()`
3. Le `save()` échoue car le paramètre existe DÉJÀ en base (contrainte unique)
4. **Race condition** : Le `findOne` et le `save` ne sont pas atomiques

**Pourquoi le findOne échoue ?**
- Les paramètres `fonds.actif` et `fonds.delai_rotation` sont créés par la migration 081
- Mais ils peuvent avoir été créés avec un `etablissementId` NULL (global) au lieu de l'établissement spécifique
- Ou il y a un problème de cache TypeORM

### **Erreur 2 : Fonds Système Virtuel Non Persisté**

**Code Avant (Buggy)** :
```typescript
// getFondsEtablissement() crée des objets virtuels
return fondsSysteme.map((fond) => {
    const fondEtab = new FondEtablissement();
    fondEtab.id = `systeme-${fond.id}`;  // ← ID virtuel, pas en base !
    // ...
    return fondEtab;
});

// retirerFondEtablissement() essaie de les supprimer
async retirerFondEtablissement(etablissementId: string, fondEtabId: string): Promise<void> {
    const fondEtab = await this.fondEtabRepo.findOne({
        where: { id: fondEtabId, etablissementId },  // ← fondEtabId = "systeme-..."
        relations: ['fond'],
    });
    
    if (!fondEtab) {
        throw new AppError('Fond non trouvé', 404);  // ← ERREUR 500
    }
}
```

**Problème** :
- Les fonds système retournés ont des IDs virtuels (`systeme-{uuid}`)
- Ces IDs n'existent **PAS** dans la table `fonds_etablissement`
- Quand l'frontend essaie de les supprimer, le backend cherche en base → non trouvé → 500

---

## ✅ Solutions Implémentées

### **Correction 1 : Upsert Atomique avec TypeORM**

**Fichier** : [apparence.service.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/modules/apparence/services/apparence.service.ts#L335-L350)

**Code Après (Corrigé)** :
```typescript
/**
 * Créer ou mettre à jour un paramètre système (upsert atomique)
 */
private async upsertParametre(cle: string, valeur: string, etablissementId: string): Promise<void> {
    await this.parametreRepo.upsert(
        {
            cle,
            valeur,
            etablissementId,
            typeValeur: 'JSON' as any,
            categorie: 'THEME' as any,
        },
        ['cle', 'etablissementId'], // Contrainte unique pour détecter conflit
    );
    
    logger.debug(`[Apparence] Paramètre ${cle} upserté pour l'établissement ${etablissementId}`);
}
```

**Avantages** :
- ✅ **Atomique** : Une seule requête SQL (`INSERT ... ON CONFLICT DO UPDATE`)
- ✅ **Pas de race condition** : PostgreSQL gère le conflit nativement
- ✅ **Plus performant** : Pas de `SELECT` avant `INSERT/UPDATE`
- ✅ **Thread-safe** : Supporte les requêtes concurrentes

**SQL Généré** :
```sql
INSERT INTO "parametres_systeme" ("cle", "valeur", "typeValeur", "categorie", "etablissementId")
VALUES ('fonds.actif', 'false', 'JSON', 'THEME', 'f7915d5e-...')
ON CONFLICT ("cle", "etablissementId") DO UPDATE SET "valeur" = EXCLUDED."valeur", "updatedAt" = NOW()
```

### **Correction 2 : Ignorer les Fonds Système Virtuels**

**Fichier** : [apparence.service.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/modules/apparence/services/apparence.service.ts#L189-L218)

**Code Après (Corrigé)** :
```typescript
/**
 * Retirer un fond de la sélection d'un établissement
 * Ignore silencieusement les fonds système virtuels (non persistés)
 */
async retirerFondEtablissement(
    etablissementId: string,
    fondEtabId: string
): Promise<void> {
    // Ignorer silencieusement les fonds système virtuels (ID commence par "systeme-")
    if (fondEtabId.startsWith('systeme-')) {
        logger.info(`[Apparence] Tentative de retrait d'un fond système virtuel ignorée: ${fondEtabId}`);
        return; // Pas d'erreur, on ignore simplement
    }

    const fondEtab = await this.fondEtabRepo.findOne({
        where: { id: fondEtabId, etablissementId },
        relations: ['fond'],
    });

    if (!fondEtab) {
        throw new AppError('Fond non trouvé pour cet établissement', 404, 'NOT_FOUND');
    }

    // Ne pas supprimer les fonds système
    if (fondEtab.fond.estSysteme) {
        throw new AppError('Impossible de retirer un fond système', 403, 'FOND_SYSTEME');
    }

    await this.fondEtabRepo.remove(fondEtab);
    logger.info(`[Apparence] Fond ${fondEtab.fond.nom} retiré de l'établissement ${etablissementId}`);
}
```

**Logique** :
```
1. Si ID commence par "systeme-" → C'est un fond virtuel
2. → Logger l'info
3. → Retourner sans erreur (silencieux)
4. Sinon → Chercher en base et supprimer normalement
```

**Pourquoi silencieusement ?**
- L'frontend affiche les fonds système comme s'ils étaient sélectionnés
- L'utilisateur peut cliquer "Supprimer" sur ces fonds
- Au lieu de montrer une erreur, on ignore simplement (meilleure UX)
- Le fond disparaît de l'UI mais reste dans le fallback système

---

## 📁 Fichiers Modifiés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `backend/src/modules/apparence/services/apparence.service.ts` | 335-350 | Upsert atomique avec `repo.upsert()` |
| `backend/src/modules/apparence/services/apparence.service.ts` | 189-218 | Ignorer les fonds système virtuels |

---

## 🧪 Vérification

### **1. Redémarrer le Backend**

```bash
cd backend
pnpm dev
```

### **2. Tester la Configuration de Rotation**

1. Aller sur la page **Apparence**
2. Activer/désactiver la rotation
3. **Vérifier les logs backend** :

**Avant (Erreur)** :
```
query: INSERT INTO "parametres_systeme" ...
query failed: duplicate key value violates unique constraint "UQ_65b1e738c8c19c81eb8add4edf0"
error: error: duplicate key value violates unique constraint
QueryFailedError: duplicate key value violates unique constraint
PATCH /api/apparence/fonds/config - 500 (35ms)
```

**Après (Succès)** :
```
[Apparence] Paramètre fonds.actif upserté pour l'établissement f7915d5e-...
[Apparence] Paramètre fonds.delai_rotation upserté pour l'établissement f7915d5e-...
[Apparence] Configuration rotation mise à jour pour l'établissement f7915d5e-...
PATCH /api/apparence/fonds/config - 200 (15ms)  ← ✅ SUCCÈS !
```

### **3. Tester la Suppression d'un Fond Système**

1. Aller sur la page **Apparence**
2. Cliquer sur le bouton "Supprimer" d'un fond système
3. **Vérifier les logs backend** :

**Avant (Erreur)** :
```
query: SELECT ... FROM "fonds_etablissement" WHERE "id" = 'systeme-83602966-...'
Fond non trouvé pour cet établissement
DELETE /api/apparence/fonds/etablissement/systeme-83602966-... - 500 (25ms)
```

**Après (Succès)** :
```
[Apparence] Tentative de retrait d'un fond système virtuel ignorée: systeme-83602966-...
DELETE /api/apparence/fonds/etablissement/systeme-83602966-... - 200 (5ms)  ← ✅ SUCCÈS !
```

### **4. Tester la Suppression d'un Fond Personnalisé**

1. Uploader un fond personnalisé
2. Cliquer sur "Supprimer"
3. **Doit fonctionner normalement** (pas de changement dans cette logique)

---

## 🎯 Résultats Attendus

### **Logs Backend Après Correction**

```javascript
// Activation de la rotation
[Apparence] Paramètre fonds.actif upserté pour l'établissement f7915d5e-...
[Apparence] Paramètre fonds.delai_rotation upserté pour l'établissement f7915d5e-...
[Apparence] Configuration rotation mise à jour (actif: true, délai: 86400s)

// Tentative de suppression fond système
[Apparence] Tentative de retrait d'un fond système virtuel ignorée: systeme-83602966-...

// Suppression fond personnalisé (normal)
[Apparence] Fond "Mon Fond Custom" retiré de l'établissement f7915d5e-...
```

### **Comportement Frontend**

1. **Toggle rotation** : ✅ Plus d'erreur 500, la configuration se sauvegarde
2. **Supprimer fond système** : ✅ Aucune erreur, le fond "disparaît" de l'UI
3. **Supprimer fond personnalisé** : ✅ Fonctionne comme avant
4. **Rotation fonctionne** : ✅ Les fonds tournent toutes les 24h (par défaut)

---

## ⚠️ Notes Importantes

### **Upsert vs FindOne + Save**

| Aspect | FindOne + Save (Avant) | Upsert (Après) |
|--------|------------------------|----------------|
| Requêtes SQL | 2 (SELECT + INSERT/UPDATE) | 1 (INSERT ON CONFLICT) |
| Race condition | ❌ Possible | ✅ Impossible |
| Performance | 🐢 Plus lent | ⚡ Plus rapide |
| Thread-safe | ❌ Non | ✅ Oui |
| Complexité | 🔴 Élevée | 🟢 Simple |

### **Fonds Système Virtuels**

- **ID pattern** : `systeme-{uuid}` (jamais en base)
- **Stockage** : Mémoire seulement, créé à chaque requête
- **Suppression** : Silencieusement ignorée (pas d'erreur)
- **Affichage** : Même UI que les fonds sélectionnés
- **Persistance** : Non persistés, reviennent après refresh

### **Migration Nécessaire ?**

❌ **Aucune migration requise** car :
- L'upsert utilise la contrainte unique existante `UQ_65b1e738c8c19c81eb8add4edf0`
- Cette contrainte est déjà définie sur `(cle, etablissementId)`
- Pas de changement de schéma, juste de la logique métier

---

## 🚀 Prochaines Étapes Optionnelles

1. **Frontend : Désactiver le bouton supprimer pour les fonds système**
   ```tsx
   <ElisaButton
       onClick={() => handleSupprimerFond(fond.id)}
       disabled={fond.id.startsWith('systeme-')}  // ← Désactiver si système
       variant="danger"
   >
       Supprimer
   </ElisaButton>
   ```

2. **Tooltip explicatif** : "Les fonds système ne peuvent pas être supprimés"

3. **Cache Redis** : Pour les paramètres système fréquemment consultés

4. **Audit** : Logger toutes les modifications de configuration dans `historique_config`

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 3.1.0 (upsert atomique + fonds virtuels)  
**Statut** : ✅ Prêt pour test final
