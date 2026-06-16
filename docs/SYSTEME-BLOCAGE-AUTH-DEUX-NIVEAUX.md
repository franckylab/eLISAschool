# Système de Blocage Authentification - Deux Niveaux

> **Version:** 1.0.0  
> **Auteur:** franck arlos chendjou  
> **Date:** 2026-06-16  
> **Statut:** ✅ Implémenté

---

## 📋 Résumé Exécutif

Implémentation d'un **système de blocage professionnel à deux niveaux** avec distinction par machine, entièrement géré côté backend selon les meilleures pratiques de sécurité.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE BLOCAGE                        │
│                                                              │
│  NIVEAU 1: BLOCAGE SPÉCIFIQUE (par identifiant)             │
│  ├─ Max tentatives: 3                                       │
│  ├─ Durée blocage: 1 minute                                 │
│  └─ Scope: Identifiant + IP                                 │
│                                                              │
│  NIVEAU 2: BLOCAGE GÉNÉRAL (par machine)                    │
│  ├─ Max tentatives: 20                                      │
│  ├─ Durée blocage: 2 minutes                                │
│  └─ Scope: IP + Empreinte machine                           │
│                                                              │
│  TOUS LES PARAMÈTRES: Configurables via ParametreSysteme    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Objectifs

### 1. Sécurité Renforcée
- **Protection brute-force** sur un identifiant spécifique
- **Protection scanning** depuis une machine (tentatives sur multiples identifiants)
- **Traçabilité complète** de toutes les tentatives

### 2. Meilleures Pratiques
- ✅ Backend comme **source unique de vérité**
- ✅ **Aucun cache frontend** pour l'état de blocage
- ✅ **Polling backend** pour synchronisation temps réel
- ✅ **Paramètres configurables** sans redéploiement
- ✅ **Nettoyage automatique** des anciennes données

### 3. UX Optimisée
- Messages d'erreur **précis et contextuels**
- Affichage du **temps restant** avant déblocage
- **Différenciation** entre blocage spécifique et général

---

## 🏗️ Architecture Technique

### Nouvelles Entités

#### TentativeConnexion
**Fichier:** `backend/src/modules/auth/entities/tentative-connexion.entity.ts`

```typescript
@Entity('tentatives_connexion')
export class TentativeConnexion {
    identifiant: string;        // email, matricule, pseudonyme
    adresseIp: string;          // IP du client
    empreinteMachine?: string;  // Hash SHA-256 (user-agent + IP)
    typeBlocage: TypeBlocage;   // 'specifique' | 'general'
    nombreTentatives: number;
    bloqueJusqua?: Date;
    derniereTentative: Date;
    motifBlocage?: string;
    nbDeblocagesAuto: number;
}
```

**Index stratégiques:**
- `(identifiant, adresseIp)` - Recherche rapide par utilisateur
- `(adresseIp, bloqueJusqua)` - Vérification blocage machine
- `(typeBlocage, bloqueJusqua)` - Filtrage par type

### Nouveau Service

#### BlocageAuthService
**Fichier:** `backend/src/modules/auth/services/blocage-auth.service.ts`

**Méthodes principales:**

```typescript
class BlocageAuthService {
    // Vérifie le statut de blocage (spécifique + général)
    verifierBlocage(identifiant, adresseIp, userAgent): Promise<StatutBlocageComplet>
    
    // Enregistre un échec de connexion
    enregistrerEchec(identifiant, adresseIp, motif, userAgent): Promise<{bloque, statut}>
    
    // Réinitialise après succès
    reinitialiserApresSucces(identifiant, adresseIp, userAgent): Promise<void>
    
    // Pour polling frontend
    getStatutBlocage(identifiant, adresseIp, userAgent): Promise<StatutBlocageComplet>
    
    // Nettoyage automatique (>24h)
    nettoyerAnciennesTentatives(): Promise<number>
    
    // Déblocage manuel (admin)
    debloquerIdentifiant(identifiant, adresseIp?): Promise<void>
    debloquerMachine(adresseIp, empreinteMachine?): Promise<void>
}
```

---

## 🔄 Flux d'Authentification

### Scénario 1: Connexion réussie

```
1. Utilisateur saisit identifiants
2. Backend vérifie blocage (N1 + N2) → NON BLOQUÉ
3. Backend recherche utilisateur → TROUVÉ
4. Backend vérifie mot de passe → CORRECT
5. Backend réinitialise compteurs blocage
6. Backend génère tokens JWT
7. ✅ Connexion réussie
```

### Scénario 2: Échec mot de passe (Niveau 1)

```
1. Utilisateur saisit identifiants
2. Backend vérifie blocage → NON BLOQUÉ
3. Backend recherche utilisateur → TROUVÉ
4. Backend vérifie mot de passe → INCORRECT
5. Backend enregistre échec N1: +1 tentative
6. SI tentatives >= 3 → BLOCAGE SPÉCIFIQUE (1 min)
7. ❌ Erreur 401: "Identifiant ou mot de passe incorrect"
   Details: {
     bloque: false,
     tentativesRestantes: 2,
     blocageSpecifique: { tentativesActuelles: 1 }
   }
```

### Scénario 3: Blocage spécifique atteint

```
1. Utilisateur tente 3ème échec sur même identifiant
2. Backend enregistre échec N1: tentative = 3
3. ✅ BLOCAGE SPÉCIFIQUE ACTIVÉ
   - bloqueJusqua = maintenant + 1 minute
   - motifBlocage = "Échec authentification..."
4. ❌ Erreur 403: "Trop de tentatives échouées. 
   Veuillez réessayer dans 1:00."
   Details: {
     bloque: true,
     typeBlocage: 'specifique',
     blocageSpecifique: {
       bloqueJusqua: "2026-06-16T10:31:00.000Z",
       tempsRestantSecondes: 60
     }
   }
```

### Scénario 4: Scanning depuis machine (Niveau 2)

```
1. Attaquant teste 20 identifiants différents depuis même IP
2. Chaque échec incrémente N2 (blocage général)
3. À la 20ème tentative: ✅ BLOCAGE GÉNÉRAL ACTIVÉ
   - bloqueJusqua = maintenant + 2 minutes
   - TOUTES les connexions depuis cette IP sont bloquées
4. ❌ Erreur 403: "Trop de tentatives échouées..."
   Details: {
     bloque: true,
     typeBlocage: 'general',
     blocageGeneral: {
       bloqueJusqua: "...",
       tempsRestantSecondes: 120
     }
   }
```

---

## 📊 Paramètres de Configuration

Tous les paramètres sont dans `parametres_systeme` et **modifiables à chaud** :

| Clé | Valeur | Type | Description |
|-----|--------|------|-------------|
| `auth.max_tentatives_specifique` | `3` | number | Max tentatives par identifiant |
| `auth.duree_blocage_specifique` | `1` | number | Durée blocage spécifique (minutes) |
| `auth.max_tentatives_general` | `20` | number | Max tentatives par machine |
| `auth.duree_blocage_general` | `2` | number | Durée blocage général (minutes) |
| `auth.max_login_attempts` | `5` | number | Ancien système (compatibilité) |
| `auth.lockout_duration` | `2` | number | Ancien système (compatibilité) |

**Modification à chaud :**
```sql
-- Changer le max de tentatives spécifiques à 5
UPDATE parametres_systeme 
SET valeur = '5' 
WHERE cle = 'auth.max_tentatives_specifique';

-- Changer la durée de blocage général à 5 minutes
UPDATE parametres_systeme 
SET valeur = '5' 
WHERE cle = 'auth.duree_blocage_general';
```

---

## 🔌 API Endpoints

### 1. Polling Statut de Blocage

**Endpoint:** `GET /api/auth/blocage-status/:identifiant`

**Usage:** Frontend poll toutes les 5 secondes pendant le blocage

**Requête:**
```bash
GET /api/auth/blocage-status/admin@elisaschool.com
Headers:
  Content-Type: application/json
```

**Réponse (NON BLOQUÉ):**
```json
{
  "success": true,
  "data": {
    "bloque": false,
    "bloqueJusqua": null,
    "tempsRestantSecondes": 0,
    "tentativesActuelles": 1,
    "tentativesRestantes": 2,
    "maxTentatives": 3,
    "blocageSpecifique": {
      "tentativesActuelles": 1,
      "tentativesRestantes": 2,
      "maxTentatives": 3,
      "bloqueJusqua": null,
      "tempsRestantSecondes": 0
    },
    "blocageGeneral": {
      "tentativesActuelles": 5,
      "tentativesRestantes": 15,
      "maxTentatives": 20,
      "bloqueJusqua": null,
      "tempsRestantSecondes": 0
    },
    "typeBlocage": null
  }
}
```

**Réponse (BLOQUÉ):**
```json
{
  "success": true,
  "data": {
    "bloque": true,
    "bloqueJusqua": "2026-06-16T10:31:00.000Z",
    "tempsRestantSecondes": 45,
    "tentativesActuelles": 3,
    "tentativesRestantes": 0,
    "maxTentatives": 3,
    "blocageSpecifique": {
      "tentativesActuelles": 3,
      "tentativesRestantes": 0,
      "maxTentatives": 3,
      "bloqueJusqua": "2026-06-16T10:31:00.000Z",
      "tempsRestantSecondes": 45
    },
    "blocageGeneral": {
      "tentativesActuelles": 8,
      "tentativesRestantes": 12,
      "maxTentatives": 20,
      "bloqueJusqua": null,
      "tempsRestantSecondes": 0
    },
    "typeBlocage": "specifique"
  }
}
```

---

## 🔧 Intégration Backend

### Modifications auth.service.ts

```typescript
// AVANT (ancien système)
if (!motDePasseValide) {
    utilisateur.tentativesConnexion += 1;
    if (utilisateur.tentativesConnexion >= maxAttempts) {
        utilisateur.bloqueJusqua = new Date(...);
    }
}

// APRÈS (nouveau système à deux niveaux)
if (!motDePasseValide) {
    // NOUVEAU: Enregistrer dans le système de blocage
    const resultatBlocage = await blocageAuthService.enregistrerEchec(
        identifiant, adresseIp, 'Mot de passe incorrect', userAgent
    );
    
    // ANCIEN SYSTÈME: Garder pour compatibilité
    utilisateur.tentativesConnexion += 1;
    // ...
    
    // Retourner détails complets
    error.details = {
        bloque: resultatBlocage.bloque,
        typeBlocage: resultatBlocage.statut.typeBlocage,
        blocageSpecifique: resultatBlocage.statut.blocageSpecifique,
        blocageGeneral: resultatBlocage.statut.blocageGeneral,
    };
}
```

### Migration SQL

**Fichier:** `backend/src/database/migrations/018-systeme-blocage-deux-niveaux.sql`

Crée :
- ✅ Table `tentatives_connexion` avec index
- ✅ 4 paramètres de configuration
- ✅ Fonction de nettoyage automatique

**Exécution:**
```bash
docker exec -i elisaschool_db psql -U elisaschool -d elisaschool < \
  backend/src/database/migrations/018-systeme-blocage-deux-niveaux.sql
```

---

## 🎨 Intégration Frontend

### LoginPage.tsx - Polling Backend

```typescript
// Polling backend toutes les 5 secondes
useEffect(() => {
    if (!bloqueJusqua) return;

    const pollBlocage = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/auth/blocage-status/${identifiant}`
            );
            const result = await response.json();
            const status = result?.data;
            
            if (status && !status.bloque) {
                // Déblocage détecté
                setBloqueJusqua(null);
                toast.success('Compte débloqué');
            } else if (status) {
                // Mise à jour temps restant
                setTempsRestant(status.tempsRestantSecondes);
                setTentativesRestantes(status.blocageSpecifique.tentativesRestantes);
            }
        } catch (error) {
            // Erreur silencieuse (non bloquant)
        }
    };

    pollBlocage();
    const interval = setInterval(pollBlocage, 5000);
    return () => clearInterval(interval);
}, [bloqueJusqua]);

// Timer local pour UX fluide (décrémente chaque seconde)
useEffect(() => {
    if (bloqueJusqua && tempsRestant > 0) {
        const timer = setInterval(() => {
            setTempsRestant(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }
}, [bloqueJusqua, tempsRestant]);
```

---

## 🛡️ Sécurité

### Protection Brute-Force

| Attaque | Protection | Résultat |
|---------|-----------|----------|
| 3 essais sur même compte | Blocage N1 (1 min) | ✅ Compte protégé |
| 20 essais sur comptes différents | Blocage N2 (2 min) | ✅ Machine bloquée |
| Changement d'IP | Empreinte machine | ✅ Partiellement protégé |
| Attaque distribuée | Limité | ⚠️ Nécessite rate limiter global |

### Empreinte Machine

```typescript
genererEmpreinteMachine(userAgent: string, adresseIp: string): string {
    const donnees = `${userAgent}|${adresseIp}`;
    return crypto.createHash('sha256').update(donnees).digest('hex');
}
```

**Avantages:**
- Identification unique de la machine
- Ne stocke pas le user-agent en clair (RGPD)
- Combine IP + browser pour précision

### Nettoyage Automatique

**Cron job:** Toutes les heures à `00:00`

```typescript
// Supprime les entrées de > 24h
DELETE FROM tentatives_connexion
WHERE derniere_tentative < NOW() - INTERVAL '24 hours'
AND (bloque_jusqua IS NULL OR bloque_jusqua < NOW());
```

**Bénéfices:**
- Réduction taille base de données
- Respect vie privée (données temporaires)
- Performance maintenue

---

## 📈 Monitoring & Logs

### Logs Structurés

```typescript
// Blocage spécifique
logger.warn(`[Blocage N1] Identifiant "${identifiant}" bloqué depuis IP ${adresseIp} 
  (${tentatives} tentatives, ${duree} min)`);

// Blocage général
logger.warn(`[Blocage N2] Machine ${adresseIp} bloquée globalement 
  (${tentatives} tentatives, ${duree} min)`);

// Déblocage automatique
logger.info(`[Blocage] Tentatives générales réinitialisées pour IP ${adresseIp}`);

// Nettoyage cron
logger.info(`[Auth Cron] Nettoyage tentatives: ${nbNettoyes} entrées supprimées`);
```

### Métriques à Surveiller

| Métrique | Seuil | Action |
|----------|-------|--------|
| Blocages N1 / heure | > 10 | Investigation potentielle attaque |
| Blocages N2 / heure | > 5 | Alerte sécurité |
| Tentatives moyennes | > 15 | Réduire max tentatives |
| Taille table | > 100K lignes | Vérifier cron cleanup |

---

## 🧪 Tests

### Test 1: Blocage Spécifique

```bash
# Tenter 3 fois avec mot de passe incorrect
for i in {1..3}; do
  curl -X POST http://localhost:7000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifiant":"admin@elisaschool.com","motDePasse":"wrong"}'
done

# Vérifier blocage
curl http://localhost:7000/api/auth/blocage-status/admin@elisaschool.com

# Attendre 1 minute → Déblocage automatique
```

### Test 2: Blocage Général

```bash
# Tenter 20 identifiants différents depuis même IP
for i in {1..20}; do
  curl -X POST http://localhost:7000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifiant":"user${i}@test.com","motDePasse":"wrong"}'
done

# Vérifier blocage général
curl http://localhost:7000/api/auth/blocage-status/nimporte_qui@test.com
```

---

## 🎯 Avantages du Système

### vs Ancien Système

| Critère | Ancien | Nouveau | Gain |
|---------|--------|---------|------|
| Scope | Par utilisateur | Par identifiant + machine | ✅ Protection scanning |
| Configuration | Code dur | ParametreSysteme | ✅ Modifiable à chaud |
| Traçabilité | Tentatives seulement | Tentatives + IP + motif | ✅ Audit complet |
| Nettoyage | Manuel | Automatique (cron) | ✅ Maintenance réduite |
| Messages | Générique | Contextuel (N1 vs N2) | ✅ UX améliorée |
| Polling | Local (frontend) | Backend (source vérité) | ✅ Sécurité renforcée |

### Meilleures Pratiques Appliquées

✅ **Backend-as-Source-of-Truth** : Aucun état de blocage côté client  
✅ **Defense-in-Depth** : Deux couches de protection  
✅ **Configurable** : Paramètres dans base de données  
✅ **Observable** : Logs structurés et métriques  
✅ **Auto-nettoyant** : Cron job de maintenance  
✅ **Compatible** : Ancien système conservé pour fallback  
✅ **Performant** : Index stratégiques sur table  

---

## 📚 Fichiers Modifiés/Créés

### Créés
1. `backend/src/modules/auth/entities/tentative-connexion.entity.ts` (145 lignes)
2. `backend/src/modules/auth/services/blocage-auth.service.ts` (409 lignes)
3. `backend/src/modules/auth/cron-jobs.ts` (39 lignes)
4. `backend/src/database/migrations/018-systeme-blocage-deux-niveaux.sql` (97 lignes)

### Modifiés
1. `backend/src/modules/auth/entities/index.ts` (+3 lignes)
2. `backend/src/modules/auth/services/auth.service.ts` (+72/-49 lignes)
3. `backend/src/modules/auth/controllers/auth.controller.ts` (+5/-1 lignes)
4. `backend/src/index.ts` (+2/-1 lignes)

---

## 🚀 Déploiement

### Étape 1: Exécuter la migration

```bash
# Option 1: Via script SQL
docker exec -i elisaschool_db psql -U elisaschool -d elisaschool < \
  backend/src/database/migrations/018-systeme-blocage-deux-niveaux.sql

# Option 2: Manuellement
docker exec -it elisaschool_db psql -U elisaschool -d elisaschool
# Puis coller le contenu du fichier SQL
```

### Étape 2: Redémarrer le backend

```bash
# Arrêter l'ancien processus
lsof -ti:7000 | xargs kill -9 2>/dev/null

# Redémarrer
cd /mnt/DONNEES/projets/eLISAschool/backend
npm run dev
```

### Étape 3: Vérifier

```bash
# Vérifier logs
tail -f backend/logs/app.log | grep "Blocage"

# Vérifier table
docker exec -it elisaschool_db psql -U elisaschool -d elisaschool -c \
  "SELECT COUNT(*) FROM tentatives_connexion;"

# Tester endpoint
curl http://localhost:7000/api/auth/blocage-status/test@test.com
```

---

## 🔮 Améliorations Futures

### Court Terme
- [ ] Ajouter endpoint admin pour lister blocages actifs
- [ ] Dashboard de monitoring des tentatives
- [ ] Export CSV des tentatives pour analyse

### Moyen Terme
- [ ] Intégration avec fail2ban pour blocage IP niveau firewall
- [ ] Captcha après 2 échecs (avant blocage)
- [ ] Notification email à l'utilisateur lors de blocage

### Long Terme
- [ ] Machine learning pour détection patterns d'attaque
- [ ] Rate limiting par API key (pour applications tierces)
- [ ] Géoblocage (pays à risque)

---

## 📞 Support

**Problèmes courants:**

| Problème | Solution |
|----------|----------|
| Blocage ne se déclenche pas | Vérifier paramètres dans `parametres_systeme` |
| Table non créée | Exécuter migration SQL |
| Cron job ne tourne pas | Vérifier `ENABLE_CRON_JOBS=true` |
| Polling frontend échoue | Vérifier CORS et endpoint accessible |

**Contacts:**
- Développeur: franck arlos chendjou
- Documentation: `docs/SECURITE-BLOCAGE-AUTH.md`

---

## ✅ Checklist de Validation

- [x] Entité `TentativeConnexion` créée avec index
- [x] Service `BlocageAuthService` implémenté
- [x] Intégration dans `AuthService.login()`
- [x] Endpoint polling `/blocage-status/:identifiant`
- [x] Migration SQL créée
- [x] Cron job de nettoyage configuré
- [x] Paramètres dans `parametres_systeme`
- [x] Logs structurés ajoutés
- [x] Documentation complète
- [x] Ancien système conservé (compatibilité)
- [x] Tests manuels définis

---

**Statut Final:** ✅ **PRÊT POUR DÉPLOIEMENT**
