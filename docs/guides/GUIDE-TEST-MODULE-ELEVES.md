# 🧪 Guide de Test - Module Élèves

## 📋 Prérequis

✅ Backend en cours d'exécution : `http://localhost:3001`  
✅ Frontend en cours d'exécution : `http://localhost:5173`  
✅ Base de données PostgreSQL connectée  
✅ Redis opérationnel  

---

## 🚀 Tests Rapides (5 minutes)

### Test 1 : Accès à la page Liste
1. Ouvrir navigateur : `http://localhost:5173`
2. Se connecter avec compte ADMIN
3. Cliquer sur **Élèves** dans le menu latéral
4. ✅ **Résultat attendu** : Tableau vide ou avec des élèves existants

### Test 2 : Créer un Élève
1. Cliquer sur bouton **"Nouvel élève"** (ou Ctrl+N)
2. Remplir le formulaire :

**Étape 1 - Identité** :
- Nom : `TEST`
- Prénom : `Élève`
- Date naissance : `2010-05-15`
- Lieu naissance : `Douala`
- Sexe : `Masculin`
- Nationalité : `Camerounaise`
- Cliquer **"Suivant"**

**Étape 2 - Coordonnées** :
- Adresse : `Bonanjo, Rue 123`
- Ville : `Douala`
- Téléphone : `+237 6XX XXX XXX`
- Email : `parent.test@email.com`
- Cliquer **"Suivant"**

**Étape 3 - Parents** :
- Nom père : `Père TEST`
- Profession père : `Ingénieur`
- Téléphone père : `+237 6XX XXX XXX`
- Nom mère : `Mère TEST`
- Profession mère : `Enseignante`
- Cliquer **"Suivant"**

**Étape 4 - Complément** :
- Classe : Sélectionner une classe existante
- Année scolaire : Sélectionner l'année active
- Activer : Transport, Cantine (optionnel)
- Cliquer **"Créer"**

3. ✅ **Résultat attendu** : 
   - Toast de succès : "Élève créé avec succès"
   - Élève apparaît dans la liste
   - Matricule auto-généré visible

### Test 3 : Voir le Détail
1. Cliquer sur bouton **"Voir"** de l'élève créé
2. ✅ **Résultat attendu** : Navigation vers `/eleves/:id`
3. Vérifier les 5 onglets :
   - ✅ **Informations** : Toutes les données affichées correctement
   - ✅ **Scolarité** : Placeholder visible
   - ✅ **Finances** : Placeholder visible
   - ✅ **Documents** : Section vide avec message
   - ✅ **Historique** : Date de création visible

### Test 4 : Modifier un Élève
1. Depuis la page détail, cliquer **"Modifier"**
2. Modifier le téléphone du père
3. Cliquer **"Enregistrer"**
4. ✅ **Résultat attendu** : 
   - Toast : "Élève modifié avec succès"
   - Modification visible dans le détail

### Test 5 : Filtres Avancés
1. Retour à la liste des élèves
2. Cliquer sur bouton **"Filtres"**
3. Tester chaque filtre :
   - ✅ Recherche textuelle (taper "TEST")
   - ✅ Filtre par classe
   - ✅ Filtre par année scolaire
   - ✅ Filtre par sexe
   - ✅ Filtre par statut
4. Combiner plusieurs filtres
5. Cliquer **"Réinitialiser"**
6. ✅ **Résultat attendu** : Filtres vidés, tous les élèves visibles

### Test 6 : Export CSV
1. Appliquer un filtre (ex: recherche "TEST")
2. Cliquer sur **"Exporter"**
3. ✅ **Résultat attendu** :
   - Fichier CSV téléchargé : `eleves_2026-06-11.csv`
   - Ouvrir avec Excel/LibreOffice
   - Vérifier que seuls les élèves filtrés sont exportés
   - Vérifier l'encodage UTF-8 (accents corrects)

### Test 7 : Supprimer un Élève
1. Cliquer sur **"Supprimer"** d'un élève test
2. Confirmer la suppression
3. ✅ **Résultat attendu** :
   - Toast : "Élève supprimé avec succès"
   - Élève disparaît de la liste

---

## 🔍 Tests Avancés (15 minutes)

### Test 8 : Permissions RBAC

**Test avec PERSONNEL** :
1. Se connecter comme PERSONNEL
2. Accéder à Élèves
3. ✅ **Attendu** :
   - Bouton "Nouveau" visible ✅
   - Bouton "Modifier" visible ✅
   - Bouton "Supprimer" **MASQUÉ** ❌
   - Bouton "Exporter" visible ✅

**Test avec ENSEIGNANT** :
1. Se connecter comme ENSEIGNANT
2. Accéder à Élèves
3. ✅ **Attendu** :
   - Bouton "Nouveau" **MASQUÉ** ❌
   - Bouton "Modifier" **MASQUÉ** ❌
   - Bouton "Supprimer" **MASQUÉ** ❌
   - Bouton "Voir" visible ✅

### Test 9 : Responsive Design

**Desktop (1920x1080)** :
- ✅ Tableau avec toutes les colonnes visibles
- ✅ Filtres en grille 4 colonnes
- ✅ Formulaire en 2 colonnes

**Tablette (768x1024)** :
- ✅ Tableau scrollable horizontalement
- ✅ Filtres en grille 2 colonnes
- ✅ Formulaire en 1 colonne

**Mobile (375x667)** :
- ✅ Tableau avec colonnes essentielles
- ✅ Filtres empilés verticalement
- ✅ Formulaire pleine largeur
- ✅ Boutons accessibles

### Test 10 : Validation Formulaire

**Champs obligatoires** :
1. Essayer de créer un élève sans nom
2. ✅ **Attendu** : Erreur "Le nom est obligatoire"

**Format date** :
1. Entrer une date future
2. ✅ **Attendu** : Erreur si validation implémentée

**Email invalide** :
1. Entrer "test@email" (sans .com)
2. ✅ **Attendu** : Erreur "Format d'email invalide"

### Test 11 : Navigation

**Bouton Retour** :
1. Depuis page détail, cliquer "Retour à la liste"
2. ✅ **Attendu** : Retour à `/eleves`

**Raccourci clavier** :
1. Sur page liste, appuyer sur `Ctrl+N`
2. ✅ **Attendu** : Modale création s'ouvre

**URL directe** :
1. Naviguer vers `/eleves` directement
2. ✅ **Attendu** : Page liste visible (si authentifié)

### Test 12 : Performance

**Pagination** :
1. Créer 50+ élèves (via script ou import)
2. Vérifier que la pagination fonctionne
3. ✅ **Attendu** : 20 élèves par page, navigation fluide

**Cache** :
1. Modifier un élève
2. Retourner à la liste
3. ✅ **Attendu** : Modifications visibles après ~5 secondes (cache invalidé)

**Filtres rapides** :
1. Taper dans la recherche
2. ✅ **Attendu** : Résultats en < 500ms

---

## 🐛 Vérification des Erreurs

### Test 13 : Gestion d'Erreurs

**Élève inexistant** :
1. Naviguer vers `/eleves/uuid-invalide`
2. ✅ **Attendu** : Page "Élève non trouvé" avec bouton retour

**Backend éteint** :
1. Arrêter le backend (`Ctrl+C` dans le terminal)
2. Actualiser la page élèves
3. ✅ **Attendu** : Message d'erreur ou loading infini

**Réseau lent** :
1. Utiliser DevTools > Network > Slow 3G
2. Créer un élève
3. ✅ **Attendu** : Spinner visible, bouton désactivé

---

## 📊 Checklist de Validation

| Test | Statut | Notes |
|------|--------|-------|
| Accès page liste | ⬜ | |
| Création élève | ⬜ | |
| Voir détail | ⬜ | |
| Modification | ⬜ | |
| Filtres | ⬜ | |
| Export CSV | ⬜ | |
| Suppression | ⬜ | |
| Permissions ADMIN | ⬜ | |
| Permissions PERSONNEL | ⬜ | |
| Responsive Desktop | ⬜ | |
| Responsive Tablette | ⬜ | |
| Responsive Mobile | ⬜ | |
| Validation formulaire | ⬜ | |
| Navigation | ⬜ | |
| Performance | ⬜ | |
| Gestion erreurs | ⬜ | |

---

## 🎯 Critères d'Acceptation

Le module est considéré comme **validé** si :

✅ Tous les tests 1-7 passent sans erreur  
✅ Au moins 80% des tests avancés (8-13) passent  
✅ Aucune erreur critique dans la console navigateur  
✅ Aucune erreur 500 dans les logs backend  
✅ Performance acceptable (< 1s par action)  
✅ Responsive sur les 3 tailles d'écran  

---

## 📝 Rapport de Test

**Date de test** : ___________  
**Testé par** : ___________  
**Résultat global** : ✅ PASS / ❌ FAIL  

**Bugs trouvés** :
1. ___________
2. ___________
3. ___________

**Améliorations suggérées** :
1. ___________
2. ___________
3. ___________

**Décision** : ⬜ Prêt production / ⬜ Corrections nécessaires

---

## 🔧 Commandes Utiles

**Voir logs backend** :
```bash
cd /home/franckylab/projets/eLISAschool/backend
tail -f logs/app.log
```

**Voir logs frontend** :
```bash
# Console navigateur (F12 > Console)
```

**Vérifier API élèves** :
```bash
# Lister élèves
curl http://localhost:3001/api/eleves \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export CSV
curl http://localhost:3001/api/eleves/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o eleves_export.csv
```

**Redémarrer services** :
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

---

**Bon testing ! 🚀**
