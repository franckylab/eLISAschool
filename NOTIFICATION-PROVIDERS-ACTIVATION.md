# 📧 Activation des Providers de Notifications

**Date**: 6 juin 2026  
**Statut**: Guide d'activation des providers Email, SMS et Push

---

## 🎯 Vue d'Ensemble

Le système de notifications eLISAschool supporte **4 canaux** :

| Provider | Canal | Statut | Complexité | Coût |
|----------|-------|--------|------------|------|
| **In-App** | Notifications internes | ✅ Déjà actif | Facile | Gratuit |
| **Email (SMTP)** | Envoi d'emails | ⏸️ À configurer | Moyen | Gratuit/Freemium |
| **SMS (Twilio)** | SMS urgents | ⏸️ À configurer | Moyen | Payant (~0.05€/SMS) |
| **Push (Firebase)** | Push mobile | ⏸️ À configurer | Complexe | Gratuit |

---

## 1️⃣ Activer le Provider Email (SMTP)

### Option A: Gmail (Recommandé pour testing)

**Étape 1**: Créer un mot de passe d'application Gmail

1. Allez sur https://myaccount.google.com/security
2. Activez la **vérification en 2 étapes**
3. Allez dans **Mots de passe des applications**
4. Générez un mot de passe pour "eLISAschool"
5. **Copiez le mot de passe généré** (16 caractères)

**Étape 2**: Configurer les variables d'environnement

```bash
# Dans /home/franckylab/projets/eLISAschool/.env

# Configuration SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application-16-caracteres
SMTP_FROM=eLISAschool <votre-email@gmail.com>
```

**Étape 3**: Activer le provider en base de données

```bash
# Se connecter à la base de données
docker exec -it elisaschool_postgres_dev psql -U elisaschool -d elisaschool_dev

# Activer le provider Email
UPDATE notification_providers 
SET 
    actif = true,
    configuration = jsonb_set(
        configuration,
        '{smtp}',
        '{"host": "smtp.gmail.com", "port": 587, "secure": false}'
    )
WHERE type = 'EMAIL';

# Vérifier
SELECT id, nom, type, actif FROM notification_providers;
```

**Résultat attendu** :
```
                  id                  |       nom        | type  | actif 
--------------------------------------+------------------+-------+-------
 123e4567-e89b-12d3-a456-426614174000 | SMTP (Gmail)     | EMAIL | true
```

**Étape 4**: Redémarrer le backend

```bash
cd /home/franckylab/projets/eLISAschool
docker-compose restart backend
```

**Étape 5**: Tester l'envoi d'email

```bash
# Via l'API (remplacer TOKEN_ADMIN et UUID_PARENT)
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "destinataireId": "UUID_PARENT",
    "titre": "Test Email",
    "contenu": "Ceci est un test d'envoi d'email",
    "type": "EMAIL",
    "metadata": {
      "email": "destinataire@example.com"
    }
  }'

# Vérifier les logs
docker logs elisaschool_backend_dev | grep -i "email"
```

---

### Option B: SendGrid (Recommandé pour production)

**Étape 1**: Créer un compte SendGrid

1. Allez sur https://sendgrid.com/
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email
4. Allez dans **Settings > API Keys**
5. Créez une clé API avec permission "Mail Send"

**Étape 2**: Configurer les variables d'environnement

```bash
# Dans .env

# Configuration SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=eLISAschool <noreply@votre-domaine.com>
```

**Étape 3**: Activer le provider (même requête SQL que Gmail, changer le host)

```sql
UPDATE notification_providers 
SET 
    actif = true,
    configuration = jsonb_set(
        configuration,
        '{smtp}',
        '{"host": "smtp.sendgrid.net", "port": 587, "secure": false}'
    )
WHERE type = 'EMAIL';
```

---

### Option C: Mailgun

**Étape 1**: Créer un compte Mailgun

1. Allez sur https://www.mailgun.com/
2. Créez un compte gratuit (5000 emails/mois pendant 3 mois)
3. Vérifiez votre domaine
4. Récupérez les credentials SMTP

**Étape 2**: Configurer

```bash
# Dans .env

# Configuration Mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASS=votre-mot-de-passe-mailgun
SMTP_FROM=eLISAschool <noreply@votre-domaine.com>
```

---

## 2️⃣ Activer le Provider SMS (Twilio)

### Étape 1: Créer un compte Twilio

1. Allez sur https://www.twilio.com/try-twilio
2. Créez un compte gratuit (crédit $15 offert)
3. Vérifiez votre email et téléphone
4. Allez sur le **Dashboard**
5. Copiez vos credentials :
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxx`

### Étape 2: Obtenir un numéro Twilio

1. Allez dans **Phone Numbers > Manage > Buy a Number**
2. Choisissez un numéro avec capability "SMS"
3. Notez le numéro: `+1234567890`

### Étape 3: Configurer les variables d'environnement

```bash
# Dans .env

# Configuration Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Étape 4: Activer le provider en DB

```bash
docker exec -it elisaschool_postgres_dev psql -U elisaschool -d elisaschool_dev
```

```sql
UPDATE notification_providers 
SET 
    actif = true,
    configuration = jsonb_set(
        configuration,
        '{twilio}',
        '{"accountSid": "ACxxx", "phoneNumber": "+1234567890"}'
    )
WHERE type = 'SMS';
```

### Étape 5: Redémarrer et tester

```bash
docker-compose restart backend

# Tester l'envoi SMS
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "destinataireId": "UUID_PARENT",
    "titre": "Test SMS",
    "contenu": "Ceci est un test SMS depuis eLISAschool",
    "type": "SMS",
    "metadata": {
      "telephone": "+22890123456"
    }
  }'
```

### 💰 Coûts Twilio

| Destination | Prix par SMS |
|-------------|-------------|
| USA/Canada | $0.0079 |
| France | $0.066 |
| Togo | $0.055 |
| Sénégal | $0.052 |
| Côte d'Ivoire | $0.055 |

**Exemple**: 100 SMS/mois au Togo = ~$5.50

---

## 3️⃣ Activer le Provider Push (Firebase FCM)

### Étape 1: Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Créez un nouveau projet "eLISAschool"
3. Activez **Cloud Messaging**

### Étape 2: Obtenir les credentials

1. Allez dans **Project Settings > Cloud Messaging**
2. Sous "Project credentials", copiez la **Server Key**
3. Notez le **Sender ID**

### Étape 3: Configurer

```bash
# Dans .env

# Configuration Firebase FCM
FIREBASE_PROJECT_ID=elisaschool-xxxxx
FIREBASE_SERVER_KEY=AAAAxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_SENDER_ID=123456789012
```

### Étape 4: Activer en DB

```sql
UPDATE notification_providers 
SET 
    actif = true,
    configuration = jsonb_set(
        configuration,
        '{firebase}',
        '{"projectId": "elisaschool-xxxxx", "senderId": "123456789012"}'
    )
WHERE type = 'PUSH';
```

### ⚠️ Important pour Push

Les notifications push nécessitent :
- Une **application mobile** (iOS/Android) ou **PWA** configurée
- L'intégration du **Firebase SDK** dans le frontend
- La collecte des **tokens de device** des utilisateurs

**Sans application frontend configurée, les notifications push ne fonctionneront pas.**

---

## ✅ Vérification de l'Activation

### 1. Vérifier les providers actifs

```bash
curl -X GET http://localhost:3000/api/notifications/fournisseurs \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "nom": "In-App (Défaut)",
      "type": "IN_APP",
      "actif": true
    },
    {
      "id": "...",
      "nom": "SMTP (Gmail)",
      "type": "EMAIL",
      "actif": true
    }
  ]
}
```

### 2. Tester un envoi multi-canal

```bash
# Créer une notification avec fallback
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "destinataireId": "UUID_PARENT",
    "titre": "Test Multi-Canal",
    "contenu": "Cette notification sera envoyée par Email ET In-App",
    "type": "EMAIL",
    "metadata": {
      "email": "parent@example.com"
    }
  }'
```

### 3. Vérifier les logs

```bash
# Logs Email
docker logs elisaschool_backend_dev | grep -i "email"

# Logs SMS
docker logs elisaschool_backend_dev | grep -i "sms"

# Logs Push
docker logs elisaschool_backend_dev | grep -i "push"

# Logs généraux
docker logs elisaschool_backend_dev | grep "Notification.*envoyée"
```

### 4. Vérifier en base de données

```sql
-- Voir l'historique des notifications
SELECT 
    id,
    type,
    titre,
    statut,
    envoyee_at,
    metadata->>'email' as email_destinataire
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Voir les providers
SELECT 
    nom,
    type,
    actif,
    configuration
FROM notification_providers;
```

---

## 🔧 Dépannage

### Problème: Emails non envoyés

**Vérification 1**: Tester la connexion SMTP

```bash
docker exec elisaschool_backend_dev node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(err => console.error('❌ SMTP Error:', err));
"
```

**Vérification 2**: Vérifier les credentials

```bash
echo $SMTP_HOST
echo $SMTP_USER
echo $SMTP_PASS  # Attention, visible en clair !
```

**Vérification 3**: Logs détaillés

```bash
docker logs elisaschool_backend_dev 2>&1 | grep -A 5 -B 5 "SMTP"
```

---

### Problème: SMS non envoyés

**Vérification 1**: Tester l'API Twilio

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "From=$TWILIO_PHONE_NUMBER" \
  -d "To=+22890123456" \
  -d "Body=Test Twilio"
```

**Vérification 2**: Vérifier le quota Twilio

- Compte gratuit : SMS uniquement vers numéros vérifiés
- Ajoutez votre numéro dans **Phone Numbers > Verified Caller IDs**

---

### Problème: Provider non chargé

**Symptôme**: Logs montrent "0 providers chargés"

**Solution** :

```sql
-- Vérifier que le provider est actif
SELECT id, nom, type, actif FROM notification_providers;

-- Si actif = false, l'activer
UPDATE notification_providers SET actif = true WHERE type = 'EMAIL';

-- Redémarrer le backend
docker-compose restart backend
```

---

## 📊 Monitoring des Providers

### Dashboard de monitoring

```bash
# Stats d'envoi par type
SELECT 
    type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE statut = 'ENVOYEE') as succes,
    COUNT(*) FILTER (WHERE statut = 'ECHEC') as echec,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE statut = 'ENVOYEE') / NULLIF(COUNT(*), 0),
        2
    ) as taux_succes_pct
FROM notifications
GROUP BY type;
```

### Alertes

Monitorer dans les logs :
- `❌ [Cron]` - Erreurs dans les tâches planifiées
- `Échec envoi notification` - Providers en erreur
- `erreursConsecutives` - Providers avec erreurs répétées

---

## 🎯 Recommandations par Environnement

### Développement

```bash
# .env.development
SMTP_HOST=localhost  # ou MailHog pour testing
SMTP_PORT=1025
ENABLE_CRON_JOBS=false  # Désactiver les cron jobs
```

**Outils de testing** :
- **MailHog** : Capture tous les emails en dev
- **Ngrok** : Exposer localhost pour webhooks

### Production

```bash
# .env.production
SMTP_HOST=smtp.sendgrid.net  # SendGrid ou Mailgun
TWILIO_ACCOUNT_SID=AC...
ENABLE_CRON_JOBS=true  # Activer les cron jobs
```

**Recommandations** :
- ✅ Utiliser SendGrid ou Mailgun (pas Gmail)
- ✅ Configurer SPF/DKIM/DMARC pour votre domaine
- ✅ Monitorer les taux de délivrabilité
- ✅ Configurer des alertes sur les erreurs

---

## 📚 Ressources

- **Nodemailer** : https://nodemailer.com/
- **Twilio Docs** : https://www.twilio.com/docs/sms
- **Firebase FCM** : https://firebase.google.com/docs/cloud-messaging
- **SendGrid** : https://docs.sendgrid.com/
- **Mailgun** : https://documentation.mailgun.com/

---

**Dernière mise à jour** : 6 juin 2026  
**Maintenu par** : Équipe eLISAschool
