# 🚀 Guide de Démarrage Rapide - Module Sondages

## En 5 Minutes Chrono !

### Étape 1: Déployer (2 min)

```bash
cd /home/franckylab/projets/eLISAschool
./scripts/deploy-sondages.sh
```

Le script va automatiquement :
- ✅ Exécuter les migrations SQL
- ✅ Vérifier la compilation
- ✅ Redémarrer le backend
- ✅ Tester l'API

### Étape 2: Tester l'API (2 min)

```bash
# 1. Lister les templates par défaut
curl http://localhost:3000/api/sondages/templates | jq

# 2. Créer un sondage rapide
curl -X POST http://localhost:3000/api/sondages/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "question": "Êtes-vous satisfait du service de cantine ?",
    "options": [
      {"texte": "Très satisfait"},
      {"texte": "Satisfait"},
      {"texte": "À améliorer"},
      {"texte": "Pas satisfait"}
    ],
    "parametres": {
      "estAnonyme": true,
      "choixMultiple": false
    },
    "destinataires": {
      "mode": "individuel",
      "utilisateur_ids": ["uuid1", "uuid2"]
    }
  }' | jq

# 3. Voter à un sondage
curl -X POST http://localhost:3000/api/sondages/SONDAGE_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "option_ids": ["OPTION_ID"]
  }' | jq

# 4. Voir les analyses
curl http://localhost:3000/api/sondages/SONDAGE_ID/analyses | jq

# 5. Exporter en CSV
curl http://localhost:3000/api/sondages/SONDAGE_ID/analyses/export?format=csv \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Étape 3: Explorer (1 min)

```bash
# Voir tous les endpoints
curl http://localhost:3000/api/docs

# Ou ouvrir dans le navigateur
open http://localhost:3000/api/docs
```

---

## 📋 Templates Disponibles par Défaut

Le module inclut **3 templates système** :

1. **Satisfaction générale**
   - 5 options (Très satisfait → Très insatisfait)
   - Utilisation : Feedback général

2. **Évaluation des services**
   - 4 options (Excellent → À améliorer)
   - Anonyme par défaut

3. **Suggestions d'amélioration**
   - 4 catégories
   - Choix multiple activé

---

## 🎯 Cas d'Usage Courants

### 1. Sondage de Satisfaction

```bash
curl -X POST http://localhost:3000/api/sondages/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Comment évaluez-vous la qualité de l'enseignement ce trimestre ?",
    "options": [
      {"texte": "Excellent"},
      {"texte": "Bon"},
      {"texte": "Moyen"},
      {"texte": "À améliorer"}
    ],
    "parametres": {
      "estAnonyme": true,
      "choixMultiple": false,
      "dureeLimite": "7j"
    },
    "destinataires": {
      "mode": "individuel",
      "utilisateur_ids": ["ID_PARENT_1", "ID_PARENT_2"]
    }
  }'
```

### 2. Sondage Programmé

```bash
curl -X POST http://localhost:3000/api/sondages/programmer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Menu de la semaine prochaine vous convient-il ?",
    "options": [
      {"texte": "Oui, parfait"},
      {"texte": "Quelques changements"},
      {"texte": "Non, à revoir"}
    ],
    "destinataires": {
      "mode": "individuel",
      "utilisateur_ids": ["ID1", "ID2"]
    },
    "date_envoi": "2026-06-15T08:00:00Z"
  }'
```

### 3. Sondage Récurrent (Hebdomadaire)

```bash
curl -X POST http://localhost:3000/api/sondages/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Avez-vous des suggestions pour cette semaine ?",
    "options": [
      {"texte": "Oui"},
      {"texte": "Non"}
    ],
    "destinataires": {
      "mode": "individuel",
      "utilisateur_ids": ["ID1", "ID2"]
    },
    "est_recurrent": true,
    "frequence_recurrent": "hebdomadaire",
    "jour_recurrent": 1,  // Lundi
    "heure_recurrent": "09:00:00",
    "date_fin_recurrent": "2026-12-31T23:59:59Z"
  }'
```

---

## 🔧 Configuration Avancée

### Activer les Cron Jobs

Dans `.env` :

```env
ENABLE_CRON_JOBS=true
```

Ou dans `docker-compose.yml` :

```yaml
backend:
  environment:
    - ENABLE_CRON_JOBS=true
```

### Permissions RBAC

Les 7 permissions disponibles :

```typescript
sondages:create          // Créer des sondages
sondages:vote            // Voter
sondages:analyze         // Voir les analyses
sondages:view            // Voir les sondages
sondages:edit            // Modifier
sondages:delete          // Supprimer
sondages:templates:manage // Gérer les templates
```

Attribuer à un rôle :

```sql
INSERT INTO role_permissions (role_id, permission)
VALUES 
  ('ROLE_ADMIN', 'sondages:create'),
  ('ROLE_ADMIN', 'sondages:analyze');
```

---

## 📊 Monitoring

### Vérifier les Cron Jobs

```bash
# Logs du backend
docker logs elisaschool-backend | grep "Cron"

# Devrait afficher :
# ✅ [Cron] 1 sondage(s) programmé(s) activé(s)
# ✅ [Cron] 2 sondage(s) expiré(s) fermé(s)
```

### Statistiques DB

```bash
docker exec -it elisaschool-db psql -U franckylab -d elisaschool

-- Nombre de sondages par statut
SELECT statut, COUNT(*) FROM sondages GROUP BY statut;

-- Top 5 des templates les plus utilisés
SELECT nom, utilisation_count 
FROM templates_sondage 
ORDER BY utilisation_count DESC 
LIMIT 5;

-- Taux de participation moyen
SELECT AVG(
  CASE WHEN nombre_destinataires > 0 
  THEN (nombre_votes::float / nombre_destinataires * 100) 
  ELSE 0 END
) as taux_moyen 
FROM sondages;
```

---

## ❓ Dépannage

### Problème : "Module non trouvé"

```bash
# Vérifier que le module est activé
curl http://localhost:3000/api/configuration/modules | jq '.data[] | select(.name == "sondages")'

# Activer si nécessaire
curl -X PATCH http://localhost:3000/api/configuration/modules/sondages \
  -H "Content-Type: application/json" \
  -d '{"actif": true}'
```

### Problème : "Permissions insuffisantes"

```bash
# Vérifier les permissions de votre rôle
curl http://localhost:3000/api/rbac/roles/VOTRE_ROLE/permissions | jq
```

### Problème : "Sondage non trouvé"

Vérifiez que :
- Le sondage appartient à votre établissement (multi-tenancy)
- L'ID est correct (format UUID)
- Le sondage n'a pas été supprimé

---

## 📚 Ressources

- **Documentation complète** : `IMPLEMENTATION-MODULE-SONDAGES.md`
- **Récapitulatif** : `RESUME-FINAL-SONDAGES.md`
- **API Swagger** : `http://localhost:3000/api/docs`
- **Code source** : `backend/src/modules/sondages/`

---

## ✨ Prochaines Étapes

1. **Frontend** : Créer une interface React/Vue pour les sondages
2. **Mobile** : Notifications push pour nouveaux sondages
3. **Analytics** : Dashboard avec graphiques
4. **Gamification** : Points pour participation
5. **IA** : Suggestions intelligentes de questions

---

**Besoin d'aide ?** Consultez la documentation complète ou ouvrez une issue.

**Bon sondage ! 🎉**
