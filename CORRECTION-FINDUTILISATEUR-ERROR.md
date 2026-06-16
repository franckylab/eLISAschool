# CORRECTION - Erreur `findUtilisateur is not a function`

## Problème

**Erreur :** `TypeError: this.findUtilisateur is not a function`

**Localisation :** `auth.service.ts:110` dans la méthode `getBlocageStatus()`

**Cause :** La méthode `findUtilisateur()` était appelée mais n'existait pas dans la classe `AuthService`.

## Solution

### Code Avant (LIGNE 110)
```typescript
// Fallback sur l'ancien système pour compatibilité
const utilisateur = await this.findUtilisateur(identifiant);
let ancienTentatives = 0;

if (utilisateur) {
    ancienTentatives = utilisateur.tentativesConnexion;
}
```

### Code Après (LIGNES 100-139)
```typescript
const ip = adresseIp || 'unknown';

// Utiliser le nouveau système de blocage
const statutComplet = await blocageAuthService.verifierBlocage(
    identifiant,
    ip,
    userAgent
);

// Fallback sur l'ancien système pour compatibilité
const identifiantNormalise = identifiant.toLowerCase().trim();
let ancienTentatives = 0;

try {
    // Recherche multi-critère (email, matricule, pseudonyme)
    const whereConditions: any[] = [];
    
    if (identifiantNormalise.includes('@')) {
        whereConditions.push({ email: identifiantNormalise });
    }
    
    whereConditions.push({ matricule: ILike(identifiantNormalise) });
    whereConditions.push({ pseudonyme: ILike(identifiantNormalise) });
    whereConditions.push({ qrCodeId: ILike(identifiantNormalise) });
    
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifiantNormalise)) {
        whereConditions.push({ id: identifiantNormalise });
    }

    const utilisateur = await this.utilisateurRepository.findOne({
        where: whereConditions,
        select: ['id', 'tentativesConnexion'],
    });
    
    if (utilisateur) {
        ancienTentatives = utilisateur.tentativesConnexion;
    }
} catch (error) {
    // Silencieux - on utilise les données du nouveau système
    logger.debug('[Auth] Impossible de récupérer ancien système tentatives', error);
}
```

## Améliorations Apportées

### 1. **Recherche Multi-Critère**
La nouvelle implémentation recherche l'utilisateur selon plusieurs critères :
- **Email** (si contient `@`)
- **Matricule** (insensible à la casse avec `ILike`)
- **Pseudonyme** (insensible à la casse)
- **QR Code ID** (insensible à la casse)
- **UUID** (si format UUID valide)

### 2. **Gestion d'Erreurs Robuste**
- **Try/catch** autour de la recherche
- **Fallback silencieux** en cas d'erreur (utilise le nouveau système)
- **Log debug** pour diagnostic sans impacter l'utilisateur

### 3. **Performance**
- **Select limité** aux colonnes nécessaires (`id`, `tentativesConnexion`)
- **Normalisation** de l'identifiant (`toLowerCase().trim()`)
- **Where optimisé** avec conditions OR via tableau

## Tests Effectués

### Test 1 : Endpoint Standard
```bash
curl -s http://localhost:7000/api/auth/blocage-status/test@test.com | jq '.'
```
**Résultat :** ✅ Succès - Retourne statut complet avec blocageSpécifique et blocageGeneral

### Test 2 : Endpoint Frontend (__check__)
```bash
curl -s http://localhost:7000/api/auth/blocage-status/__check__ | jq '.'
```
**Résultat :** ✅ Succès - Aucune erreur 500

### Test 3 : Vérification Logs
```bash
tail -50 logs/app.log | grep -E "blocage-status|findUtilisateur|500"
```
**Résultat :** ✅ Aucune erreur trouvée

## Structure de Réponse API

```json
{
  "success": true,
  "data": {
    "bloque": false,
    "bloqueJusqua": null,
    "tempsRestantSecondes": 0,
    "tentativesActuelles": 0,
    "tentativesRestantes": 3,
    "maxTentatives": 3,
    "blocageSpecifique": {
      "tentativesActuelles": 0,
      "tentativesRestantes": 3,
      "maxTentatives": 3,
      "bloqueJusqua": null,
      "tempsRestantSecondes": 0
    },
    "blocageGeneral": {
      "tentativesActuelles": 0,
      "tentativesRestantes": 20,
      "maxTentatives": 20,
      "bloqueJusqua": null,
      "tempsRestantSecondes": 0
    },
    "typeBlocage": null
  },
  "timestamp": "2026-06-16T10:12:34.978Z"
}
```

## Fichiers Modifiés

- `backend/src/modules/auth/services/auth.service.ts` (lignes 100-139)
  - **+28 lignes** (implémentation recherche multi-critère)
  - **-3 lignes** (ancien code avec findUtilisateur)

## Statut

✅ **CORRECTION TERMINÉE ET VALIDÉE**

- [x] Erreur `findUtilisateur is not a function` corrigée
- [x] Recherche multi-critère implémentée
- [x] Gestion d'erreurs robuste ajoutée
- [x] Tests API réussis
- [x] Aucune erreur dans les logs
- [x] Backend redémarré et fonctionnel sur port 7000

---

**Date :** 2026-06-16  
**Auteur :** franck arlos chendjou  
**Version :** 1.0.0
