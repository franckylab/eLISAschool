# Système de Notifications - Guide d'Implémentation

## 📋 Vue d'Ensemble

Le système de notifications d'eLISAschool a été entièrement refactorisé pour supporter une **architecture de providers** extensible, permettant d'ajouter, configurer, activer/désactiver dynamiquement des providers pour chaque type de notification (In-App, Email, SMS, Push).

## ✅ Ce Qui a Été Implémenté

### 1. Architecture Provider

**Fichiers créés :**
- ✅ `providers/interfaces/notification-provider.interface.ts` - Interface commune
- ✅ `providers/provider-registry.ts` - Registre centralisé avec fallback
- ✅ `providers/in-app.provider.ts` - Provider In-App (fonctionnel)
- ✅ `providers/email.provider.ts` - Provider Email via Nodemailer
- ✅ `providers/sms.provider.ts` - Provider SMS via Twilio
- ✅ `providers/push.provider.ts` - Provider Push via Firebase FCM
- ✅ `entities/notification-provider.entity.ts` - Entité pour stocker les providers
- ✅ `dto/notification-provider.dto.ts` - DTOs Zod pour validation
- ✅ `services/notification-provider.service.ts` - CRUD complet des providers
- ✅ `controllers/notification-provider.controller.ts` - API REST pour gestion
- ✅ `database/migrations/010-notification-providers.sql` - Migration SQL

### 2. Fonctionnalités Implémentées

#### ✅ Gestion des Providers
- **CRUD complet** : Créer, lire, mettre à jour, supprimer des providers
- **Activation/Désactivation** : Toggle d'un provider sans le supprimer
- **Provider par défaut** : Définir quel provider utiliser pour chaque type
- **Test de configuration** : Tester les credentials avant activation
- **Quotas journaliers** : Limiter le nombre d'envois par jour
- **Priorité/Fallback** : Providers secondaires si le primaire échoue
- **Monitoring** : Suivi des erreurs consécutives

#### ✅ Registry avec Fallback Automatique
```typescript
// Le registry essaie automatiquement les providers dans l'ordre
const result = await providerRegistry.sendWithFallback(notification);
```

#### ✅ Configuration Étendue
Nouveaux paramètres de configuration :
- `notifications.providers.auto_load` - Chargement automatique au démarrage
- `notifications.retries.max_attempts` - Tentatives maximales (3)
- `notifications.rate_limit.per_hour` - Rate limiting (100/h)

## 🚀 Installation et Configuration

### Étape 1 : Installer les Dépendances Optionnelles

Les providers Email, SMS et Push nécessitent des packages supplémentaires :

```bash
cd backend

# Pour Email (Nodemailer)
npm install nodemailer
npm install --save-dev @types/nodemailer

# Pour SMS (Twilio) - optionnel
npm install twilio

# Pour Push (Firebase) - optionnel
npm install firebase-admin
```

### Étape 2 : Exécuter la Migration

```bash
# Exécuter la migration SQL
psql -U elisaschool_user -d elisaschool -f backend/src/database/migrations/010-notification-providers.sql
```

Ou via TypeORM :
```bash
npm run migration:run
```

### Étape 3 : Configurer les Variables d'Environnement

Ajouter dans `.env` (optionnel selon les providers utilisés) :

```bash
# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@elisaschool.cm
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM=noreply@elisaschool.cm

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Push (Firebase FCM)
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_SERVER_KEY=AAAAxxxxxxxxxxxxx
FIREBASE_VAPID_KEY=BNcxxxxxxxxxxxxx
```

### Étape 4 : Configurer les Providers via l'API

#### 4.1 Vérifier le Provider In-App (déjà créé par migration)

```bash
GET /api/notification-providers
Authorization: Bearer <token_admin>
```

#### 4.2 Ajouter un Provider Email

```bash
POST /api/notification-providers
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "nom": "SMTP Principal",
  "type": "EMAIL",
  "service": "nodemailer",
  "actif": true,
  "estDefaut": true,
  "configuration": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "user": "noreply@elisaschool.cm",
    "password": "secret",
    "from_email": "noreply@elisaschool.cm",
    "from_name": "eLISAschool",
    "tls_reject_unauthorized": true
  },
  "quotaJournalier": 1000,
  "priorite": 1
}
```

#### 4.3 Tester la Configuration

```bash
POST /api/notification-providers/:id/test
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "configuration": {
    "host": "smtp.example.com",
    "port": 587,
    "user": "test@example.com",
    "password": "test"
  }
}
```

#### 4.4 Activer/Désactiver un Provider

```bash
POST /api/notification-providers/:id/toggle
Authorization: Bearer <token_admin>
```

#### 4.5 Définir un Provider par Défaut

```bash
POST /api/notification-providers/:id/set-default
Authorization: Bearer <token_admin>
```

## 📡 API Endpoints

### Notification Providers (Admin uniquement)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/notification-providers` | Liste des providers |
| `GET` | `/api/notification-providers/:id` | Détails d'un provider |
| `POST` | `/api/notification-providers` | Créer un provider |
| `PATCH` | `/api/notification-providers/:id` | Mettre à jour |
| `DELETE` | `/api/notification-providers/:id` | Supprimer |
| `POST` | `/api/notification-providers/:id/toggle` | Activer/désactiver |
| `POST` | `/api/notification-providers/:id/set-default` | Définir par défaut |
| `POST` | `/api/notification-providers/:id/test` | Tester configuration |

### Notifications (Utilisateurs authentifiés)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/notifications` | Mes notifications |
| `GET` | `/api/notifications/count` | Count non lues |
| `POST` | `/api/notifications` | Créer notification (admin) |
| `POST` | `/api/notifications/bulk` | Créer en masse (admin) |
| `PATCH` | `/api/notifications/:id/read` | Marquer comme lue |
| `PATCH` | `/api/notifications/read-all` | Tout marquer lu |
| `DELETE` | `/api/notifications/:id` | Supprimer |

## 🔧 Utilisation dans les Modules

### Exemple : Envoyer une Notification

```typescript
import { notificationsService } from '@modules/notifications/services';
import { TypeNotification } from '@modules/notifications/entities';

// Créer une notification
const notification = await notificationsService.create({
    destinataireId: 'user-uuid',
    titre: 'Nouvelle note publiée',
    contenu: 'Votre note de Mathématiques a été publiée : 15/20',
    type: TypeNotification.IN_APP, // Ou EMAIL, SMS, PUSH
    priorite: 'NORMALE',
    categorie: 'notes',
    lienAction: '/notes/123',
    metadata: {
        email: 'eleve@example.com', // Requis pour EMAIL
        telephone: '+237612345678', // Requis pour SMS
        fcmToken: '...', // Requis pour PUSH
    },
}, expediteurId);
```

### Exemple : Notification en Masse

```typescript
const count = await notificationsService.createBulk({
    destinatairesIds: ['user-1', 'user-2', 'user-3'],
    titre: 'Bulletin disponible',
    contenu: 'Votre bulletin du 2ème trimestre est disponible.',
    type: TypeNotification.EMAIL,
    categorie: 'bulletins',
}, expediteurId);
```

## 🎯 Prochaines Étapes (Non Implémentées)

Les éléments suivants sont identifiés dans le plan mais **non encore implémentés** :

1. **Intégration des modules métier** (notes, eleves, bulletins, etc.)
2. **Système de templates** (Handlebars/EJS)
3. **Queue/Worker avec BullMQ** (file d'attente Redis)
4. **Préférences utilisateur** (choisir quels types recevoir)
5. **Permissions RBAC granulaires** (notifications:send, notifications:manage)
6. **Monitoring & Analytics** (dashboard statistiques)

## 📊 Providers Supportés

| Type | Services Supportés | Statut |
|------|-------------------|--------|
| **In-App** | in-app | ✅ Fonctionnel |
| **Email** | Nodemailer/SMTP | ✅ Code prêt, needs `npm install nodemailer` |
| **Email** | SendGrid | 🟡 À implémenter |
| **Email** | Mailgun | 🟡 À implémenter |
| **Email** | AWS SES | 🟡 À implémenter |
| **SMS** | Twilio | ✅ Code prêt, needs `npm install twilio` |
| **SMS** | Vonage | 🟡 À implémenter |
| **SMS** | Africa's Talking | 🟡 À implémenter |
| **Push** | Firebase FCM | ✅ Code prêt, needs `npm install firebase-admin` |
| **Push** | OneSignal | 🟡 À implémenter |

## 🛡️ Bonnes Pratiques

### 1. Toujours Vérifier si un Provider est Configuré

```typescript
if (!providerRegistry.hasProvider(TypeNotification.EMAIL)) {
    logger.warn('Aucun provider email configuré');
    return;
}
```

### 2. Utiliser le Fallback Automatique

```typescript
// Le registry essaie tous les providers disponibles
const result = await providerRegistry.sendWithFallback(notification);
```

### 3. Inclure les Métadonnées Requises

```typescript
// Pour EMAIL : metadata.email requis
// Pour SMS : metadata.telephone requis
// Pour PUSH : metadata.fcmToken requis
metadata: {
    email: destinataire.email,
    telephone: destinataire.telephone,
    fcmToken: destinataire.deviceToken,
}
```

### 4. Gérer les Quotas

```typescript
// Configurer un quota journalier
{
    "quotaJournalier": 1000, // 1000 emails/jour max
}
```

## 🐛 Résolution de Problèmes

### Problème : "Provider non configuré"
**Solution :** Vérifier que le provider a une configuration valide et que `estConfiguré()` retourne `true`.

### Problème : "Aucun provider disponible"
**Solution :** 
1. Vérifier qu'au moins un provider est actif pour le type
2. Exécuter `GET /api/notification-providers?type=EMAIL` pour voir les providers

### Problème : Email non envoyé
**Solution :**
1. Tester la configuration : `POST /api/notification-providers/:id/test`
2. Vérifier les logs : `logger.error` contient les détails
3. Vérifier `metadata.email` est présent

## 📝 Notes Techniques

- **Singleton Pattern** : `providerRegistry` est un singleton global
- **Auto-Load** : Les providers actifs sont chargés en mémoire au démarrage
- **Fallback** : Si le provider par défaut échoue, le registry essaie les autres
- **Quotas** : Réinitialisés quotidiennement (nécessite un cron job)
- **Multi-Tenant** : Support de `etablissementId` pour scopage par établissement

## 📞 Support

Pour ajouter un nouveau provider :
1. Implémenter `INotificationProvider`
2. Créer la classe (ex: `SendGridProvider`)
3. L'ajouter au `NotificationProviderService.createProviderInstance()`
4. Documenter la configuration attendue

---

**Version :** 1.0.0  
**Date :** 2025-06-06  
**Auteur :** xAI Éducation  
**Statut :** ✅ Étape 1 complétée (Architecture Providers)
