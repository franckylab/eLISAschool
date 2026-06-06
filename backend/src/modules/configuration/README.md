# 📖 Guide d'Utilisation - Système de Configuration eLISAschool

## 🎯 Vue d'Ensemble

Le système de configuration d'eLISAschool permet de gérer dynamiquement les paramètres de l'application sans redémarrage, avec validation, historique et cache.

---

## 🚀 Quick Start

### **1. Accéder aux paramètres**

```typescript
import { getParam, getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';

// Récupérer un paramètre string
const devise = await getParam<string>('regional.currency', 'XOF');

// Récupérer un booléen
const enablePush = await getParamBoolean('notifications.enable_push', true);

// Récupérer un nombre
const bareme = await getParamNumber('notes.bareme_defaut', 20);
```

### **2. Modifier un paramètre**

```bash
# Via API
PUT /api/configuration/parametres/notes.bareme_defaut
{
  "valeur": 20
}
```

### **3. Exécuter la migration des nouveaux paramètres**

```bash
cd backend
chmod +x scripts/run-config-migration.sh
./scripts/run-config-migration.sh
```

---

## 📋 Paramètres Disponibles par Module

### **🔐 Authentification**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `auth.session_duration` | NUMBER | 1440 | Durée de session (minutes) |
| `auth.max_login_attempts` | NUMBER | 5 | Tentatives max avant blocage |
| `auth.lockout_duration` | NUMBER | 15 | Durée de blocage (minutes) |
| `auth.password_min_length` | NUMBER | 8 | Longueur minimale mot de passe |
| `auth.require_2fa` | BOOLEAN | false | Exiger 2FA |
| `auth.password_require_uppercase` | BOOLEAN | true | Exiger majuscule |
| `auth.password_require_number` | BOOLEAN | true | Exiger chiffre |
| `utilisateurs.default_role` | STRING | 'ELEVE' | Rôle par défaut |

### **📝 Notes**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `notes.bareme_defaut` | NUMBER | 20 | Barème par défaut |
| `notes.show_ranking` | BOOLEAN | true | Afficher classement |
| `notes.require_validation` | BOOLEAN | true | Validation obligatoire |

### **📄 Bulletins** ✨ NOUVEAU

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `bulletins.include_ranking` | BOOLEAN | true | Afficher le classement |
| `bulletins.show_appreciations` | BOOLEAN | true | Inclure appréciations |
| `bulletins.validation_threshold` | NUMBER | 10 | Seuil validation (/20) |
| `bulletins.calculation_method` | STRING | 'ponderee' | Méthode calcul |
| `bulletins.display_coefficients` | BOOLEAN | true | Afficher coefficients |
| `bulletins.template_id` | STRING | 'default' | Template PDF |

### **👨‍🎓 Élèves** ✨ NOUVEAU

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `eleves.auto_generate_matricule` | BOOLEAN | true | Génération auto matricule |
| `eleves.matricule_prefix` | STRING | 'EL' | Préfixe matricule |
| `eleves.max_per_class` | NUMBER | 50 | Max élèves par classe |
| `eleves.photo_required` | BOOLEAN | false | Photo obligatoire |
| `eleves.parent_contact_required` | BOOLEAN | true | Contact parent requis |

### **🍽️ Cantine**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `cantine.menu_planning_days` | NUMBER | 7 | Jours planification |
| `cantine.allow_preorder` | BOOLEAN | true | Autoriser précommandes |
| `cantine.max_debt` | NUMBER | 10000 | Dette maximale (FCFA) |

### **🚌 Transport**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `transport.enable_gps` | BOOLEAN | false | Activer GPS |
| `transport.enable_qr_checkin` | BOOLEAN | true | Pointage QR |
| `transport.alert_delay_minutes` | NUMBER | 10 | Délai alerte retard |

### **💳 Cartes**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `cartes.enable_qrcode` | BOOLEAN | true | QR code sur cartes |
| `cartes.validity_months` | NUMBER | 12 | Validité (mois) |
| `cartes.include_photo` | BOOLEAN | true | Inclure photo |

### **🎮 Gamification**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `gamification.points_attendance` | NUMBER | 5 | Points présence |
| `gamification.points_good_grade` | NUMBER | 10 | Points bonne note |
| `gamification.enable_leaderboard` | BOOLEAN | true | Activer classement |
| `gamification.points_late_arrival` | NUMBER | -2 | Points retard |
| `gamification.points_absence` | NUMBER | -5 | Points absence |
| `gamification.reset_frequency` | STRING | 'trimestriel' | Fréquence reset |

### **💬 Messagerie**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `messagerie.max_message_length` | NUMBER | 5000 | Longueur max message |
| `messagerie.max_participants` | NUMBER | 50 | Participants max |
| `messagerie.allow_attachments` | BOOLEAN | true | Autoriser attachments |
| `messagerie.max_attachment_size` | NUMBER | 10 | Taille max (MB) |
| `messagerie.auto_archive_days` | NUMBER | 90 | Archivage auto (jours) |
| `messagerie.read_receipts` | BOOLEAN | true | Confirmations lecture |

### **⚙️ Système**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `system.date_format` | STRING | 'DD/MM/YYYY' | Format date |
| `system.time_format` | STRING | '24h' | Format heure |
| `system.pagination_default` | NUMBER | 20 | Pagination par défaut |
| `system.export_format` | STRING | 'pdf' | Format export |
| `system.maintenance_mode` | BOOLEAN | false | Mode maintenance |

---

## ✅ Validation des Paramètres

Le système valide automatiquement les valeurs selon :

### **1. Regex Pattern**

```typescript
// Si param.validation = "^[A-Z]{2,3}$"
// ✅ Autorise: "EL", "STU"
// ❌ Refuse: "el", "123", "abcd"
```

### **2. Ranges Numériques**

```typescript
// Si options = [{value: "0"}, {value: "100"}]
// ✅ Autorise: 20, 50, 100
// ❌ Refuse: -1, 101, 999
```

### **3. Enums**

```typescript
// Si options = [{value: "pdf"}, {value: "excel"}]
// ✅ Autorise: "pdf", "excel"
// ❌ Refuse: "word", "csv"
```

---

## 🔧 API Endpoints

### **Lister les paramètres**

```bash
GET /api/configuration/parametres?categorie=MODULE&module=notes
```

### **Récupérer un paramètre**

```bash
GET /api/configuration/parametres/notes.bareme_defaut
```

### **Modifier un paramètre**

```bash
PUT /api/configuration/parametres/notes.bareme_defaut
{
  "valeur": 20
}
```

### **Mise à jour en masse**

```bash
PUT /api/configuration/parametres/bulk
{
  "parametres": [
    {"cle": "notes.bareme_defaut", "valeur": 20},
    {"cle": "notes.show_ranking", "valeur": true}
  ]
}
```

### **Réinitialiser un paramètre**

```bash
POST /api/configuration/parametres/notes.bareme_defaut/reset
```

### **Historique des modifications**

```bash
GET /api/configuration/historique?cible=PARAMETRE&limit=50
```

### **Exporter la configuration**

```bash
GET /api/configuration/export?includeApp=true&includeModules=true&includeParametres=true
```

---

## 🎓 Bonnes Pratiques

### **1. Utiliser les helpers avec des valeurs par défaut**

```typescript
// ✅ BON
const bareme = await getParamNumber('notes.bareme_defaut', 20);

// ❌ ÉVITER (pas de fallback)
const bareme = await getParamNumber('notes.bareme_defaut');
```

### **2. Mettre en cache les paramètres fréquents**

```typescript
// Le helper a déjà un cache de 1 minute
// Pour un cache plus long, utiliser une variable locale
let cachedBareme: number | null = null;

async function getBareme() {
  if (cachedBareme === null) {
    cachedBareme = await getParamNumber('notes.bareme_defaut', 20);
  }
  return cachedBareme;
}
```

### **3. Grouper les paramètres par module**

```typescript
// Dans votre service
private async getModuleParams() {
  return {
    bareme: await getParamNumber('notes.bareme_defaut', 20),
    showRanking: await getParamBoolean('notes.show_ranking', true),
    requireValidation: await getParamBoolean('notes.require_validation', true),
  };
}
```

### **4. Valider avant d'utiliser**

```typescript
// La validation est automatique lors de l'update
// Mais vous pouvez valider manuellement
const params = await getModuleParams();
if (params.bareme <= 0 || params.bareme > 100) {
  throw new AppError('Barème invalide', 400, 'INVALID_BAREME');
}
```

---

## 🐛 Dépannage

### **Paramètre non trouvé**

```bash
# Vérifier si le paramètre existe
GET /api/configuration/parametres/notes.bareme_defaut

# Si 404, exécuter la migration
./scripts/run-config-migration.sh
```

### **Validation échoue**

```bash
# Vérifier la configuration du paramètre
GET /api/configuration/parametres/notes.bareme_defaut

# Response inclut: validation, options, typeValeur
```

### **Cache non invalidé**

```bash
# Forcer l'invalidation du cache
POST /api/configuration/cache/invalidate
{
  "type": "parametres"
}
```

---

## 📊 Monitoring

### **Vérifier les paramètres modifiés récemment**

```bash
GET /api/configuration/historique?cible=PARAMETRE&dateDebut=2025-06-01
```

### **Exporter pour audit**

```bash
GET /api/configuration/export?includeParametres=true
```

---

## 🔒 Permissions Requises

| Action | Permission | Rôles |
|--------|-----------|-------|
| Voir paramètres | `CONFIG_PARAM_VIEW` | SUPER_ADMIN, ADMIN |
| Créer paramètre | `CONFIG_PARAM_CREATE` | SUPER_ADMIN |
| Modifier paramètre | `CONFIG_PARAM_EDIT` | SUPER_ADMIN, ADMIN |
| Supprimer paramètre | `CONFIG_PARAM_DELETE` | SUPER_ADMIN |
| Réinitialiser | `CONFIG_PARAM_RESET` | SUPER_ADMIN, ADMIN |
| Voir historique | `CONFIG_HISTORY_VIEW` | SUPER_ADMIN, ADMIN |

---

## 📚 Ressources

- [Rapport d'améliorations](../../docs/CONFIGURATION_IMPROVEMENTS.md)
- [Migration des paramètres](../src/database/migrations/005-advanced-config-params.ts)
- [Service de configuration](../src/modules/configuration/services/configuration.service.ts)
- [Helper de configuration](../src/modules/configuration/utils/config.helper.ts)

---

**Dernière mise à jour** : 2025-06-06  
**Version** : 2.0.0
