# Guide de Test - Section Sécurité Configuration

## Prérequis

1. Backend en cours d'exécution (`npm run dev` dans `/backend`)
2. Frontend en cours d'exécution (`npm run dev` dans `/frontend`)
3. Base de données à jour avec les nouveaux paramètres

## Étape 1 : Mise à jour de la Base de Données

Exécuter le seed pour créer les nouveaux paramètres :

```bash
cd /home/franckylab/projets/eLISAschool/backend
npm run seed:config -- --force
```

Ou via un script TypeScript :

```typescript
import { ConfigurationSeedService } from './src/modules/configuration/services/configuration-seed.service';

const seedService = new ConfigurationSeedService();
await seedService.runAllSeeds(true); // force=true pour recréer les paramètres
```

## Étape 2 : Vérification Backend

### 2.1 Tester l'API des paramètres

```bash
# Récupérer tous les paramètres de sécurité
curl -X GET "http://localhost:3000/api/configuration/parametres?categorie=SECURITE" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"

# Vérifier qu'on reçoit bien 20 paramètres
```

**Résultat attendu** :
```json
{
  "success": true,
  "data": [
    {
      "cle": "auth.session_duration",
      "valeur": "1440",
      "typeValeur": "NUMBER",
      "categorie": "SECURITE",
      ...
    },
    // ... 19 autres paramètres
  ]
}
```

### 2.2 Tester la mise à jour d'un paramètre

```bash
# Modifier la durée de session
curl -X PUT "http://localhost:3000/api/configuration/parametres/auth.session_duration" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"valeur": "60"}'
```

**Résultat attendu** : `200 OK` avec le paramètre mis à jour

## Étape 3 : Vérification Frontend

### 3.1 Accéder à la page

1. Ouvrir le navigateur : `http://localhost:5173`
2. Se connecter avec un compte ADMIN ou SUPER_ADMIN
3. Naviguer vers : **Configuration** → Onglet **Sécurité** (icône Shield)

### 3.2 Vérifier l'affichage

**Éléments à vérifier** :

- [ ] Titre : "Sécurité"
- [ ] Description : "Configurez les paramètres de sécurité..."
- [ ] 5 sections visibles :
  - [ ] Authentification & Sessions (icône Shield)
  - [ ] Politique de Mots de Passe (icône Lock)
  - [ ] Sécurité Avancée (icône Key)
  - [ ] Protection & Monitoring (icône AlertTriangle)
  - [ ] Actions de Sécurité (icône ShieldAlert)

### 3.3 Tester les Toggles (Auto-save)

1. **Authentification & Sessions** :
   - [ ] Toggle "Exiger l'authentification 2FA"
   - [ ] Cliquer → Vérifier le toast "Paramètre enregistré avec succès"
   - [ ] Recharger la page → Vérifier que le changement est persisté

2. **Politique de Mots de Passe** :
   - [ ] Toggle "Exiger une majuscule"
   - [ ] Toggle "Exiger une minuscule"
   - [ ] Toggle "Exiger un chiffre"
   - [ ] Toggle "Exiger un caractère spécial"
   - [ ] Chaque toggle doit sauvegarder automatiquement

3. **Sécurité Avancée** :
   - [ ] Toggle "Vérification email requise"
   - [ ] Toggle "Auto-inscription autorisée"
   - [ ] Toggle "Journalisation actions sensibles"

4. **Protection & Monitoring** :
   - [ ] Toggle "Protection contre la force brute"
   - [ ] Toggle "Alertes email de sécurité"
   - [ ] Toggle "Notifications d'activité suspecte"

### 3.4 Tester les Selects (Auto-save avec debounce)

1. **Durée de session** :
   - [ ] Changer de "24 heures" à "1 heure"
   - [ ] Attendre 500ms (debounce)
   - [ ] Vérifier le toast de succès

2. **Durée de blocage** :
   - [ ] Changer de "15 minutes" à "30 minutes"
   - [ ] Vérifier la sauvegarde automatique

3. **Expiration du mot de passe** :
   - [ ] Changer de "Jamais" à "90 jours"
   - [ ] Vérifier la sauvegarde

4. **Rate limiting** :
   - [ ] Changer de "Moyen" à "Élevé"
   - [ ] Vérifier la sauvegarde

### 3.5 Tester les Inputs Numériques (Sauvegarde manuelle)

1. **Tentatives de connexion maximum** :
   - [ ] Changer de 5 à 7
   - [ ] Vérifier l'apparition de la barre sticky "1 modification non enregistrée"
   - [ ] Cliquer sur "Enregistrer les modifications"
   - [ ] Vérifier le toast de succès

2. **Longueur minimale du mot de passe** :
   - [ ] Changer de 8 à 12
   - [ ] Vérifier la barre sticky avec compteur

3. **Historique des mots de passe** :
   - [ ] Changer de 3 à 5
   - [ ] Vérifier la barre sticky

4. **Délai d'inactivité** :
   - [ ] Changer de 30 à 60
   - [ ] Vérifier la barre sticky

### 3.6 Tester la Zone de Texte (IP Whitelist)

1. **Liste blanche d'IP** :
   - [ ] Entrer : `192.168.1.1, 10.0.0.1`
   - [ ] Vérifier la validation (pas d'erreur)
   - [ ] Cliquer "Enregistrer"
   - [ ] Tester avec une IP invalide : `999.999.999.999`
   - [ ] Vérifier le message d'erreur "Adresse IP invalide"

### 3.7 Tester la Validation

1. **Valeurs hors limites** :
   - [ ] Session duration : entrer 1 (min 5) → Erreur attendue
   - [ ] Session duration : entrer 2000 (max 1440) → Erreur attendue
   - [ ] Max login attempts : entrer 2 (min 3) → Erreur attendue
   - [ ] Max login attempts : entrer 11 (max 10) → Erreur attendue
   - [ ] Password min length : entrer 5 (min 6) → Erreur attendue
   - [ ] Password min length : entrer 33 (max 32) → Erreur attendue

### 3.8 Tester le Reset

1. **Réinitialiser les modifications** :
   - [ ] Modifier plusieurs champs (toggles, inputs, selects)
   - [ ] Vérifier que la barre sticky affiche le bon compteur
   - [ ] Cliquer sur "Réinitialiser"
   - [ ] Vérifier que tous les champs reviennent à leurs valeurs initiales
   - [ ] Vérifier que la barre sticky disparaît

### 3.9 Tester les Actions de Sécurité

1. **Déconnecter toutes les sessions** :
   - [ ] Cliquer sur le bouton "Exécuter"
   - [ ] Vérifier l'apparition de la modale de confirmation
   - [ ] Lire le message : "Êtes-vous sûr de vouloir déconnecter tous les utilisateurs ?"
   - [ ] Cliquer "Annuler" → La modale se ferme
   - [ ] Cliquer "Exécuter" à nouveau → Cliquer "Confirmer"
   - [ ] Vérifier le toast : "Toutes les sessions ont été invalidées avec succès"
   - [ ] **TEST CRITIQUE** : Se déconnecter et vérifier qu'on doit se reconnecter

2. **Réinitialiser les compteurs d'échec** :
   - [ ] Cliquer sur "Exécuter"
   - [ ] Confirmer dans la modale
   - [ ] Vérifier le toast de succès

3. **Forcer le changement de mot de passe** :
   - [ ] Cliquer sur "Exécuter"
   - [ ] Confirmer dans la modale
   - [ ] Vérifier le toast de succès
   - [ ] **ATTENTION** : Cette action affecte TOUS les utilisateurs

### 3.10 Tester le Responsive

1. **Desktop (> 1024px)** :
   - [ ] Vérifier l'affichage en 2-3 colonnes
   - [ ] Vérifier l'alignement des éléments

2. **Tablette (640-1024px)** :
   - [ ] Vérifier l'affichage en 2 colonnes
   - [ ] Vérifier la lisibilité

3. **Mobile (< 640px)** :
   - [ ] Vérifier l'affichage en 1 colonne
   - [ ] Vérifier que tous les éléments sont accessibles
   - [ ] Vérifier la barre sticky en bas

### 3.11 Tester l'Accessibilité

1. **Navigation clavier** :
   - [ ] Tabuler через tous les éléments
   - [ ] Vérifier le focus visible sur chaque élément
   - [ ] Activer les toggles avec Espace/Entrée

2. **Lecteur d'écran** (si disponible) :
   - [ ] Vérifier les labels ARIA sur les toggles
   - [ ] Vérifier les messages d'erreur

## Étape 4 : Vérification de la Persistance

1. **Modifier plusieurs paramètres** :
   - [ ] Changer 2FA = ON
   - [ ] Changer session_duration = 60
   - [ ] Changer password_min_length = 10
   - [ ] Enregistrer

2. **Recharger la page** (F5) :
   - [ ] Vérifier que tous les changements sont conservés
   - [ ] Vérifier que les valeurs correspondent à ce qui a été sauvegardé

3. **Vérifier dans la base de données** :
```sql
SELECT cle, valeur FROM parametres_systeme 
WHERE categorie = 'SECURITE' 
ORDER BY ordre;
```

## Étape 5 : Tests d'Intégration

### 5.1 Tester l'impact des paramètres

1. **Réduire la durée de session à 1 minute** :
   - [ ] Se connecter
   - [ ] Attendre 1 minute sans activité
   - [ ] Essayer de naviguer
   - [ ] **Résultat attendu** : Déconnexion automatique

2. **Activer 2FA** :
   - [ ] Se déconnecter
   - [ ] Se reconnecter
   - [ ] **Résultat attendu** : Demande de code 2FA (si implémenté)

3. **Réduire max_login_attempts à 3** :
   - [ ] Tenter 3 connexions avec un mauvais mot de passe
   - [ ] **Résultat attendu** : Compte bloqué pendant lockout_duration

### 5.2 Tester le Multi-Tenant

1. **Se connecter en SUPER_ADMIN** :
   - [ ] Accéder à la configuration sécurité
   - [ ] Modifier des paramètres pour un établissement spécifique
   - [ ] Vérifier que les paramètres sont bien scopés

2. **Se connecter en ADMIN d'un établissement** :
   - [ ] Accéder à la configuration sécurité
   - [ ] Vérifier que seuls les paramètres de son établissement sont visibles

## Checklist Finale

- [ ] Tous les 20 paramètres sont affichés correctement
- [ ] Les toggles sauvegardent automatiquement
- [ ] Les selects sauvegardent avec debounce
- [ ] Les inputs nécessitent une sauvegarde manuelle
- [ ] La validation fonctionne pour tous les champs
- [ ] La barre sticky apparaît/disparaît correctement
- [ ] Le reset fonctionne correctement
- [ ] Les 3 actions de sécurité fonctionnent avec confirmation
- [ ] Le responsive design est correct sur tous les écrans
- [ ] La persistance des données est vérifiée après rechargement
- [ ] L'accessibilité est correcte (navigation clavier, ARIA)
- [ ] Les traductions FR/EN fonctionnent (changer la langue)
- [ ] Les toasts de succès/erreur s'affichent correctement
- [ ] Les états de chargement sont visibles pendant les sauvegardes

## Rapport de Test

Remplir ce tableau après les tests :

| Test | Statut | Commentaires |
|------|--------|--------------|
| Affichage des 5 sections | ☐ Pass / ☐ Fail | |
| Toggles auto-save | ☐ Pass / ☐ Fail | |
| Selects auto-save | ☐ Pass / ☐ Fail | |
| Inputs sauvegarde manuelle | ☐ Pass / ☐ Fail | |
| Validation des champs | ☐ Pass / ☐ Fail | |
| Barre sticky | ☐ Pass / ☐ Fail | |
| Reset | ☐ Pass / ☐ Fail | |
| Actions de sécurité | ☐ Pass / ☐ Fail | |
| Responsive | ☐ Pass / ☐ Fail | |
| Accessibilité | ☐ Pass / ☐ Fail | |
| Persistance | ☐ Pass / ☐ Fail | |
| Multi-tenant | ☐ Pass / ☐ Fail | |
| Traductions | ☐ Pass / ☐ Fail | |

---

**Date du test** : ___________  
**Testé par** : ___________  
**Résultat global** : ☐ Pass / ☐ Fail  
**Notes** :
