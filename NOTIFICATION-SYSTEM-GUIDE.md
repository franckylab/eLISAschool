# 📧 Système de Notifications - Guide Complet

## 🎯 Architecture

Le système de notifications eLISAschool utilise une **architecture provider-based** avec :
- **synchronize: true** en développement (création automatique des tables)
- **Seed automatique** des providers par défaut au premier démarrage
- **ProviderRegistry** avec fallback automatique
- **Multi-tenant** support (etablissementId)

---

## 🚀 Démarrage Automatique

Au démarrage de l'application :

```
1. synchronize:true crée la table notification_providers
2. seedDefaultNotificationProviders() vérifie si la table est vide
3. Si vide → insère 4 providers par défaut :
   - In-App (Défaut) - ACTIF ✅
   - SMTP (À configurer) - INACTIF
   - Twilio (À configurer) - INACTIF
   - Firebase FCM (À configurer) - INACTIF
4. loadActiveProviders() charge les providers actifs en mémoire
5. ProviderRegistry les enregistre avec fallback
```

### Logs de démarrage typiques :

```
🔌 Connexion à la base de données PostgreSQL...
✅ Connexion à la base de données établie avec succès
📧 Initialisation du système de notifications...
🌱 Aucun provider trouvé, création des providers par défaut...
✅ 4 providers par défaut créés:
   - In-App (Défaut) (IN_APP - actif)
   - SMTP (À configurer) (EMAIL - inactif)
   - Twilio (À configurer) (SMS - inactif)
   - Firebase FCM (À configurer) (PUSH - inactif)
✅ Provider In-App enregistré
✅ 1 providers chargés depuis la base de données
📊 Providers actifs: In-App=2, Email=0, SMS=0, Push=0
🚀 Serveur eLISAschool démarré sur le port 3000
```

---

## 📋 API Endpoints

Tous les endpoints nécessitent une authentification (Bearer Token).

### 1. Lister les providers
```bash
GET /api/notification-providers
GET /api/notification-providers?type=EMAIL&actif=true
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nom": "In-App (Défaut)",
      "type": "IN_APP",
      "service": "in-app",
      "actif": true,
      "estDefaut": true,
      "configuration": {},
      "quotaJournalier": 0,
      "quotaUtilise": 0,
      "priorite": 1
    }
  ],
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 20
  }
}
```

### 2. Créer un provider
```bash
POST /api/notification-providers
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Gmail Production",
  "type": "EMAIL",
  "service": "nodemailer",
  "actif": true,
  "estDefaut": false,
  "configuration": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "votre-email@gmail.com",
      "pass": "votre-app-password"
    },
    "from": {
      "name": "eLISAschool",
      "email": "noreply@elisaschool.cm"
    }
  },
  "quotaJournalier": 1000,
  "priorite": 1,
  "description": "Provider Gmail principal"
}
```

### 3. Tester la configuration
```bash
POST /api/notification-providers/{id}/test
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "valide": true,
    "message": "Configuration valide"
  }
}
```

### 4. Activer/Désactiver
```bash
POST /api/notification-providers/{id}/toggle
Authorization: Bearer {token}
```

### 5. Définir comme défaut
```bash
POST /api/notification-providers/{id}/set-default
Authorization: Bearer {token}
```

### 6. Modifier un provider
```bash
PATCH /api/notification-providers/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Nouveau nom",
  "configuration": {
    "host": "smtp.new-host.com"
  }
}
```

### 7. Supprimer un provider
```bash
DELETE /api/notification-providers/{id}
Authorization: Bearer {token}
```

### 8. Voir les statistiques
```bash
GET /api/notification-providers/{id}/stats
Authorization: Bearer {token}
```

---

## 🔧 Configuration des Providers

### Provider Email (SMTP)

```json
{
  "nom": "Gmail",
  "type": "EMAIL",
  "service": "nodemailer",
  "actif": true,
  "configuration": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "votre-email@gmail.com",
      "pass": "app-password-16-chars"
    },
    "from": {
      "name": "eLISAschool",
      "email": "noreply@elisaschool.cm"
    },
    "tls": {
      "rejectUnauthorized": false
    }
  },
  "quotaJournalier": 1000,
  "priorite": 1
}
```

### Provider SMS (Twilio)

```json
{
  "nom": "Twilio",
  "type": "SMS",
  "service": "twilio",
  "actif": true,
  "configuration": {
    "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "authToken": "your_auth_token",
    "fromNumber": "+1234567890"
  },
  "quotaJournalier": 500,
  "priorite": 1
}
```

### Provider Push (Firebase FCM)

```json
{
  "nom": "Firebase",
  "type": "PUSH",
  "service": "firebase-fcm",
  "actif": true,
  "configuration": {
    "projectId": "your-project-id",
    "serverKey": "AAAAxxxxxxxxxx:xxxxxxxxxxxxxxxxxxx",
    "vapidKey": "Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "quotaJournalier": 5000,
  "priorite": 1
}
```

---

## 🎨 Utilisation dans le Code

### Envoyer une notification

```typescript
import { notificationsService } from '@modules/notifications/services';

// Créer une notification
const notification = await notificationsService.creerNotification({
    type: TypeNotification.EMAIL,
    titre: 'Bulletin disponible',
    contenu: 'Le bulletin de votre enfant est disponible.',
    destinataireId: eleve.utilisateurId,
    metadata: {
        email: 'parent@example.com',
        bulletinId: 'uuid',
    },
    priorite: PrioriteNotification.NORMAL,
});
```

### Le système utilise automatiquement :
1. Le provider par défaut du type
2. Fallback sur les autres providers si échec
3. Respect des quotas
4. Logs et traçabilité

---

## 📊 Monitoring et Stats

### Vérifier les providers actifs

```bash
# Via API
curl http://localhost:3000/api/notification-providers?actif=true

# Via logs Docker
docker compose logs backend | grep "Providers actifs"

# Via DB
docker compose exec postgres psql -U elisaschool_user -d elisaschool \
  -c "SELECT nom, type, service, actif, quota_utilise, quota_journalier FROM notification_providers;"
```

### Reset des quotas quotidiens

```typescript
import { resetDailyQuotas } from '@modules/notifications/services';

// À appeler via un cron job chaque jour à minuit
await resetDailyQuotas();
```

---

## 🐛 Troubleshooting

### La table n'existe pas

**Solution** : Vérifier que `synchronize: true` dans `database.config.ts`

```typescript
synchronize: envConfig.app.isDevelopment, // true en dev
```

### Aucun provider chargé

**Vérifier** :
1. Les logs de démarrage pour voir le seed
2. La table `notification_providers` contient-elle des données ?
3. Le champ `actif` est-il à `true` ?

```sql
SELECT id, nom, type, actif FROM notification_providers;
```

### Provider ne s'enregistre pas dans le registry

**Causes possibles** :
- Provider `actif = false`
- Configuration invalide (`estConfiguré()` retourne false)
- Erreur lors de `initialiser()`

**Solution** : Vérifier les logs :
```bash
docker compose logs backend | grep -i "provider"
```

### Erreur d'envoi de notification

**Vérifier** :
1. Le provider est-il actif ?
2. La configuration est-elle valide ? (utiliser `/test`)
3. Les quotas ne sont-ils pas atteints ?
4. Les logs d'erreur :
```bash
docker compose logs backend | grep -i "erreur\|error"
```

---

## 📁 Fichiers Clés

### Core
```
backend/src/modules/notifications/
├── entities/
│   ├── notification.entity.ts          # Entité Notification
│   └── notification-provider.entity.ts # Entité Provider
├── dto/
│   ├── notification.dto.ts
│   └── notification-provider.dto.ts
├── services/
│   ├── notifications.service.ts        # Service principal
│   ├── notification-provider.service.ts # CRUD Provider
│   └── seed-providers.service.ts       # Seed automatique ✨
├── providers/
│   ├── interfaces/notification-provider.interface.ts
│   ├── provider-registry.ts            # Registry + Fallback
│   ├── in-app.provider.ts
│   ├── email.provider.ts
│   ├── sms.provider.ts
│   └── push.provider.ts
└── controllers/
    ├── notifications.controller.ts
    └── notification-provider.controller.ts
```

### Configuration
```
backend/src/index.ts                    # Startup avec seed
backend/src/config/database.config.ts   # synchronize:true
backend/src/modules/notifications/services/index.ts  # Exports
```

### Scripts
```
scripts/
├── test-notification-providers.sh      # Test API complet
├── run-notification-migration.sh       # Migration (production)
└── rebuild-docker.sh                   # Rebuild Docker
```

---

## 🚀 Production

En production :

1. **synchronize: false** → utiliser les migrations
2. Exécuter la migration SQL manuellement :
```bash
./scripts/run-notification-migration.sh
```

3. Seed initial via script ou API
4. Configurer les providers réels (SMTP, Twilio, Firebase)
5. Monitoring des quotas et erreurs

---

## 📝 Bonnes Pratiques

### 1. Toujours tester la configuration avant d'activer
```bash
POST /api/notification-providers/{id}/test
```

### 2. Utiliser des quotas pour éviter les abus
```json
{
  "quotaJournalier": 1000
}
```

### 3. Configurer le fallback avec les priorités
```json
{
  "priorite": 1  // Provider principal
}
```

### 4. Logger les erreurs pour monitoring
```typescript
provider.enregistrerErreur(error.message);
```

### 5. Reset des quotas quotidien
```typescript
// Cron job à minuit
await resetDailyQuotas();
```

---

## 🎓 Exemples d'Usage

### Exemple 1: Envoyer un email à un parent

```typescript
await notificationsService.creerNotification({
    type: TypeNotification.EMAIL,
    titre: 'Note ajoutée',
    contenu: 'Une nouvelle note a été ajoutée pour votre enfant.',
    destinataireId: parent.utilisateurId,
    metadata: {
        email: parent.email,
        noteId: note.id,
        eleveNom: eleve.nom,
    },
    priorite: PrioriteNotification.NORMAL,
});
```

### Exemple 2: Notification push urgente

```typescript
await notificationsService.creerNotification({
    type: TypeNotification.PUSH,
    titre: '⚠️ Absence non justifiée',
    contenu: 'Votre enfant est absent sans justification.',
    destinataireId: parent.utilisateurId,
    metadata: {
        deviceToken: parent.deviceToken,
        eleveId: eleve.id,
        action: 'justifier',
    },
    priorite: PrioriteNotification.URGENTE,
});
```

### Exemple 3: SMS de rappel

```typescript
await notificationsService.creerNotification({
    type: TypeNotification.SMS,
    titre: 'Rappel',
    contenu: 'Réunion parents-profs demain à 18h.',
    destinataireId: parent.utilisateurId,
    metadata: {
        phoneNumber: parent.telephone,
    },
    priorite: PrioriteNotification.NORMAL,
});
```

---

## ✅ Checklist de Vérification

- [ ] Table `notification_providers` existe (auto-créée en dev)
- [ ] Providers par défaut seedés au premier démarrage
- [ ] Au moins 1 provider actif par type utilisé
- [ ] Configuration testée et valide
- [ ] Quotas configurés selon les besoins
- [ ] Fallback configuré (priorités)
- [ ] Logs monitorés pour erreurs
- [ ] Reset quotas quotidien configuré (production)

---

## 🆘 Support

En cas de problème :

1. **Vérifier les logs** : `docker compose logs -f backend`
2. **Tester l'API** : `./scripts/test-notification-providers.sh`
3. **Vérifier la DB** : `docker compose exec postgres psql -U elisaschool_user -d elisaschool`
4. **Documentation Swagger** : http://localhost:3000/api/docs

---

**🎉 Le système de notifications est entièrement opérationnel et intégré à la base de données !**
