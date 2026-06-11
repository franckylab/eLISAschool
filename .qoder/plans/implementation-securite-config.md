# Implémentation Complète - Section Sécurité Configuration eLISAschool

## Contexte

La page de configuration d'eLISAschool dispose déjà d'un onglet "sécurité" défini dans la structure des tabs, mais celui-ci affiche uniquement un placeholder "Bientôt disponible". Le backend possède déjà 7 paramètres de sécurité dans le seed, mais l'interface frontend n'est pas implémentée.

**Objectif** : Développer une section sécurité complète, professionnelle et conforme aux meilleures pratiques, permettant aux administrateurs de configurer tous les aspects de la sécurité de l'application.

## Architecture des Modifications

### Fichiers à Créer (6)

1. **`frontend/src/components/ui/ElisaToggle.tsx`** (~80 lignes)
   - Composant toggle switch avec animation Framer Motion
   - Props : `checked`, `onCheckedChange`, `label`, `description`, `disabled`, `id`
   - Variables CSS du thème, ARIA labels
   - Export dans `frontend/src/components/ui/index.ts`

2. **`frontend/src/features/configuration/hooks/useSecuriteConfig.ts`** (~200 lignes)
   - Hook personnalisé avec React Query
   - Chargement des paramètres via `GET /api/configuration/parametres?categorie=SECURITE`
   - Mutations pour sauvegarde individuelle (toggles) et batch (inputs)
   - Gestion des `dirtyFields` pour tracking des modifications
   - Validation côté client
   - Interface `SecuriteConfigValues` typée (20+ paramètres)

3. **`frontend/src/features/configuration/components/SecuriteTab.tsx`** (~400 lignes)
   - Composant principal avec 5 sous-sections en cards
   - Authentification & Sessions (Shield icon)
   - Politique de Mots de Passe (Lock icon)
   - Sécurité Avancée (Key icon)
   - Protection & Monitoring (AlertTriangle icon)
   - Actions de Sécurité (ShieldAlert icon)
   - Barre d'actions sticky avec compteur de modifications

4. **`frontend/src/locales/fr/securite-config.json`** (~150 lignes)
   - Traductions françaises pour toute la section sécurité
   - Labels, hints, descriptions, messages d'erreur
   - Options pour les selects

5. **`frontend/src/locales/en/securite-config.json`** (~150 lignes)
   - Traductions anglaises équivalentes

6. **`frontend/src/features/configuration/components/SecuriteActionCard.tsx`** (~100 lignes)
   - Composant pour les actions sensibles (déconnexion sessions, reset compteurs)
   - Modale de confirmation intégrée
   - Style danger avec avertissements

### Fichiers à Modifier (4)

1. **`frontend/src/features/configuration/ConfigurationPage.tsx`**
   - Remplacer le placeholder "Bientôt disponible" par `<SecuriteTab />`
   - Importer le nouveau composant

2. **`backend/src/modules/configuration/services/configuration-seed.service.ts`**
   - Ajouter 13 paramètres de sécurité manquants après ligne 268 :
     - `auth.password_require_lowercase` (boolean, true)
     - `auth.password_require_special` (boolean, true)
     - `auth.password_history_count` (number, 3)
     - `auth.password_expiry_days` (number, 0)
     - `auth.require_email_verification` (boolean, true)
     - `auth.allow_self_registration` (boolean, false)
     - `auth.inactivity_timeout` (number, 30)
     - `auth.ip_whitelist` (string, '')
     - `auth.log_sensitive_actions` (boolean, true)
     - `auth.brute_force_protection` (boolean, true)
     - `auth.rate_limiting` (string, 'medium')
     - `auth.security_email_alerts` (boolean, false)
     - `auth.suspicious_activity_notifications` (boolean, true)

3. **`frontend/src/locales/fr/configuration.json`**
   - Ajouter section `sections.securite.*` avec toutes les clés de traduction

4. **`frontend/src/locales/en/configuration.json`**
   - Ajouter section `sections.securite.*` équivalente en anglais

## Stratégie de Sauvegarde Hybride

| Type de paramètre | Mode de sauvegarde | Raison |
|-------------------|-------------------|--------|
| Toggles (booléens) | Automatique immédiate | Feedback instantané, faible risque |
| Selects | Automatique avec debounce 500ms | Changement délibéré |
| Inputs numériques | Manuel (bouton Enregistrer) | Nécessite validation |
| Zones texte (IP whitelist) | Manuel | Validation complexe |

## Plan d'Implémentation Détaillé

### Phase 1 : Backend - Paramètres manquants (15 min)

**Fichier** : `backend/src/modules/configuration/services/configuration-seed.service.ts`

Ajouter après la ligne 268 (après `auth.password_require_number`) :

```typescript
// Politiques mots de passe (suite)
{ cle: 'auth.password_require_lowercase', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger au moins une lettre minuscule', modifiableRuntime: true, visible: true, ordre: 8 },
{ cle: 'auth.password_require_special', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger au moins un caractère spécial (!@#$%^&*)', modifiableRuntime: true, visible: true, ordre: 9 },
{ cle: 'auth.password_history_count', valeur: 3, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Nombre de mots de passe conservés dans l\'historique (0-12, 0 = désactivé)', modifiableRuntime: true, visible: true, ordre: 10 },
{ cle: 'auth.password_expiry_days', valeur: 0, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Expiration du mot de passe en jours (0 = jamais expirer)', modifiableRuntime: true, visible: true, ordre: 11, options: [{ value: 0, label: 'Jamais' }, { value: 30, label: '30 jours' }, { value: 60, label: '60 jours' }, { value: 90, label: '90 jours' }, { value: 180, label: '6 mois' }, { value: 365, label: '1 an' }] },

// Sécurité avancée
{ cle: 'auth.require_email_verification', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger la vérification de l\'email avant connexion', modifiableRuntime: true, visible: true, ordre: 12 },
{ cle: 'auth.allow_self_registration', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Autoriser l\'auto-inscription des utilisateurs', modifiableRuntime: true, visible: true, ordre: 13 },
{ cle: 'auth.inactivity_timeout', valeur: 30, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Délai d\'inactivité avant déconnexion automatique (minutes)', modifiableRuntime: true, visible: true, ordre: 14 },
{ cle: 'auth.ip_whitelist', valeur: '', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Liste blanche d\'adresses IP autorisées (séparées par des virgules, vide = toutes autorisées)', modifiableRuntime: true, visible: true, ordre: 15 },
{ cle: 'auth.log_sensitive_actions', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Journaliser toutes les actions sensibles dans l\'audit trail', modifiableRuntime: true, visible: true, ordre: 16 },

// Protection & Monitoring
{ cle: 'auth.brute_force_protection', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Activer la protection contre les attaques par force brute', modifiableRuntime: true, visible: true, ordre: 17 },
{ cle: 'auth.rate_limiting', valeur: 'medium', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Niveau de limitation du débit des requêtes', modifiableRuntime: true, visible: true, ordre: 18, options: [{ value: 'low', label: 'Faible (100 req/min)' }, { value: 'medium', label: 'Moyen (50 req/min)' }, { value: 'high', label: 'Élevé (20 req/min)' }] },
{ cle: 'auth.security_email_alerts', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Envoyer des alertes par email pour les événements de sécurité critiques', modifiableRuntime: true, visible: true, ordre: 19 },
{ cle: 'auth.suspicious_activity_notifications', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Notifier les utilisateurs en cas d\'activité suspecte sur leur compte', modifiableRuntime: true, visible: true, ordre: 20 },
```

### Phase 2 : Composant ElisaToggle (20 min)

**Fichier** : `frontend/src/components/ui/ElisaToggle.tsx`

Créer un composant toggle switch moderne avec :
- Animation fluide du cercle avec Framer Motion
- Support label et description
- Variables CSS du thème (`--color-dominante`, `--color-bordure`, etc.)
- Accessibilité complète (ARIA, keyboard navigation)
- États : checked/unchecked, disabled, loading
- Taille md par défaut, variantes sm/lg si nécessaire

**Modification** : `frontend/src/components/ui/index.ts`
- Ajouter `export * from './ElisaToggle';`

### Phase 3 : Hook useSecuriteConfig (45 min)

**Fichier** : `frontend/src/features/configuration/hooks/useSecuriteConfig.ts`

Structure du hook :

```typescript
interface SecuriteConfigValues {
  session_duration: number;
  max_login_attempts: number;
  lockout_duration: number;
  require_2fa: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_number: boolean;
  password_require_lowercase: boolean;
  password_require_special: boolean;
  password_history_count: number;
  password_expiry_days: number;
  require_email_verification: boolean;
  allow_self_registration: boolean;
  inactivity_timeout: number;
  ip_whitelist: string;
  log_sensitive_actions: boolean;
  brute_force_protection: boolean;
  rate_limiting: 'low' | 'medium' | 'high';
  security_email_alerts: boolean;
  suspicious_activity_notifications: boolean;
}

interface UseSecuriteConfigReturn {
  values: Partial<SecuriteConfigValues>;
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  dirtyFields: Set<string>;
  updateValue: <K extends keyof SecuriteConfigValues>(key: K, value: SecuriteConfigValues[K]) => void;
  saveParametre: (key: string) => Promise<void>;
  saveAll: () => Promise<void>;
  resetChanges: () => void;
  hasChanges: boolean;
  executeAction: (action: 'invalidate-sessions' | 'reset-login-attempts' | 'force-password-reset') => Promise<void>;
}

export function useSecuriteConfig(): UseSecuriteConfigReturn
```

Fonctionnalités :
1. **Query** : Charger tous les paramètres SECURITE via `apiClient.get('/api/configuration/parametres', { params: { categorie: 'SECURITE' } })`
2. **Mapping** : Convertir les réponses (JSON string) vers `SecuriteConfigValues`
3. **Mutation individuelle** : `saveParametre(key)` pour les toggles (auto-save)
4. **Mutation batch** : `saveAll()` pour les inputs modifiés
5. **Tracking** : `dirtyFields` pour savoir quels champs ont changé
6. **Validation** : Vérifier les min/max avant envoi
7. **Actions** : Mutations pour les actions de sécurité (déconnexion sessions, etc.)

### Phase 4 : Composant SecuriteTab (1h)

**Fichier** : `frontend/src/features/configuration/components/SecuriteTab.tsx`

Structure avec 5 cards :

```
┌─────────────────────────────────────────┐
│ 🔐 Authentification & Sessions          │
│ ├─ Durée de session (Select)            │
│ ├─ Tentatives max (Number input)        │
│ ├─ Durée de blocage (Select)            │
│ └─ Exiger 2FA (Toggle)                 │
├─────────────────────────────────────────┤
│ 🔑 Politique de Mots de Passe           │
│ ├─ Longueur minimale (Number)           │
│ ├─ Exiger majuscule (Toggle)            │
│ ├─ Exiger minuscule (Toggle)            │
│ ├─ Exiger chiffre (Toggle)              │
│ ├─ Exiger caractère spécial (Toggle)    │
│ ├─ Historique mots de passe (Number)    │
│ └─ Expiration mot de passe (Select)     │
├─────────────────────────────────────────┤
│ 🛡️ Sécurité Avancée                     │
│ ├─ Vérification email requise (Toggle)  │
│ ├─ Auto-inscription (Toggle)            │
│ ├─ Délai inactivité (Number)            │
│ ├─ IP whitelist (Textarea avec tags)    │
│ └─ Logging actions sensibles (Toggle)   │
├─────────────────────────────────────────┤
│ 🚨 Protection & Monitoring              │
│ ├─ Protection brute force (Toggle)      │
│ ├─ Rate limiting (Select)               │
│ ├─ Alertes email sécurité (Toggle)      │
│ └─ Notifications activité suspecte (Toggle)│
├─────────────────────────────────────────┤
│ ⚡ Actions de Sécurité                  │
│ ├─ Déconnecter toutes les sessions      │
│ ├─ Réinitialiser compteurs d'échec      │
│ └─ Forcer changement mot de passe       │
└─────────────────────────────────────────┘
```

Chaque card :
- Icône + titre + tooltip d'aide
- Grille responsive (1-2 colonnes)
- Espacement cohérent
- États de chargement pendant les sauvegardes

Barre d'actions sticky en bas :
- Bouton "Enregistrer les modifications" (primaire, disabled si `!hasChanges`)
- Badge avec compteur de modifications non enregistrées
- Bouton "Réinitialiser" (outline)

### Phase 5 : Composant SecuriteActionCard (30 min)

**Fichier** : `frontend/src/features/configuration/components/SecuriteActionCard.tsx`

Pour les actions sensibles avec confirmation :
- Carte avec style danger (bordure rouge, icône warning)
- Titre + description des conséquences
- Bouton d'action avec modale de confirmation
- État de chargement pendant l'exécution
- Message de succès/erreur après exécution

Actions implémentées :
1. **Déconnecter toutes les sessions** : `POST /api/auth/sessions/invalidate-all`
2. **Réinitialiser les compteurs d'échec** : `POST /api/auth/login-attempts/reset`
3. **Forcer changement mot de passe** : `POST /api/auth/passwords/force-reset-all`

### Phase 6 : Traductions (20 min)

**Fichiers** : 
- `frontend/src/locales/fr/securite-config.json`
- `frontend/src/locales/en/securite-config.json`

Structure complète avec toutes les clés nécessaires :

```json
{
  "sections": {
    "titre": "Sécurité",
    "description": "Configurez les paramètres de sécurité de l'application",
    "authentification": {
      "titre": "Authentification & Sessions",
      "session_duration": {
        "label": "Durée de session",
        "hint": "Durée après laquelle l'utilisateur doit se reconnecter"
      },
      "max_login_attempts": {
        "label": "Tentatives de connexion maximum",
        "hint": "Nombre d'échecs avant blocage du compte",
        "erreurMinMax": "Entre {min} et {max} tentatives"
      },
      // ... etc
    },
    "motsDePasse": { /* ... */ },
    "avancee": { /* ... */ },
    "protection": { /* ... */ },
    "actions": {
      "titre": "Actions de Sécurité",
      "deconnecterSessions": {
        "titre": "Déconnecter toutes les sessions",
        "description": "Forcer la déconnexion de tous les utilisateurs connectés",
        "confirmation": "Êtes-vous sûr de vouloir déconnecter tous les utilisateurs ?",
        "succes": "Toutes les sessions ont été invalidées"
      },
      // ... etc
    }
  },
  "boutons": {
    "enregistrer": "Enregistrer les modifications",
    "reinitialiser": "Réinitialiser",
    "annuler": "Annuler",
    "confirmer": "Confirmer"
  },
  "messages": {
    "modificationsNonEnregistrees": "{count} modification(s) non enregistrée(s)",
    "sauvegardeSucces": "Paramètre(s) enregistré(s) avec succès",
    "sauvegardeErreur": "Erreur lors de l'enregistrement",
    "chargementErreur": "Impossible de charger les paramètres de sécurité"
  }
}
```

### Phase 7 : Intégration dans ConfigurationPage (10 min)

**Fichier** : `frontend/src/features/configuration/ConfigurationPage.tsx`

Modifier la section "Autres onglets" (ligne 161-168) :

```typescript
{/* Sécurité */}
{activeTab === 'securite' && <SecuriteTab />}

{/* Autres onglets : placeholder */}
{!['general', 'theme', 'securite'].includes(activeTab) && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Settings className="h-12 w-12 text-[var(--color-texte-secondaire)]/30" />
    <p className="mt-4 text-sm text-[var(--color-texte-secondaire)]">
      {t(`sections.${activeTab}.titre`)} — Bientôt disponible
    </p>
  </div>
)}
```

Ajouter l'import :
```typescript
import { SecuriteTab } from './components/SecuriteTab';
```

## Vérification et Tests

### Tests Backend
1. Exécuter le seed avec `force: true` : vérifier que les 13 nouveaux paramètres sont créés
2. Tester l'API `GET /api/configuration/parametres?categorie=SECURITE` : vérifier le retour des 20 paramètres
3. Tester `PUT /api/configuration/parametres/:cle` : modifier un paramètre et vérifier la persistance
4. Tester `PUT /api/configuration/parametres/bulk` : modifier plusieurs paramètres en une fois

### Tests Frontend
1. **Chargement** : Ouvrir la page configuration → onglet sécurité → vérifier que tous les paramètres sont affichés avec leurs valeurs
2. **Toggles auto-save** : Cliquer sur un toggle → vérifier la sauvegarde automatique et le toast de succès
3. **Inputs avec sauvegarde manuelle** : Modifier un input numérique → vérifier l'apparition du badge "modifications non enregistrées" → cliquer "Enregistrer" → vérifier la sauvegarde
4. **Validation** : Entrer une valeur invalide (ex: session_duration = -1) → vérifier le message d'erreur
5. **Reset** : Modifier des champs → cliquer "Réinitialiser" → vérifier le retour aux valeurs initiales
6. **Actions de sécurité** : Cliquer "Déconnecter toutes les sessions" → confirmer dans la modale → vérifier l'exécution et le message de succès
7. **Responsive** : Tester sur mobile, tablette, desktop
8. **Accessibilité** : Navigation au clavier, lecteurs d'écran

### Tests d'Intégration
1. Modifier un paramètre de sécurité dans l'UI → tenter une connexion → vérifier que le changement est appliqué (ex: réduire session_duration à 1min → se connecter → attendre 1min → vérifier la déconnexion)
2. Activer 2FA → vérifier que le flux de connexion demande le code 2FA
3. Configurer IP whitelist avec une IP non autorisée → vérifier le blocage

## Métriques de Performance

- **Temps de chargement initial** : < 2s pour récupérer les 20 paramètres
- **Sauvegarde individuelle** : < 500ms (toggle)
- **Sauvegarde batch** : < 1s pour 5+ paramètres
- **Cache React Query** : 5 minutes pour les paramètres
- **Invalidation** : Automatique après mutation

## Sécurité et Permissions

- **RBAC** : Seuls les rôles `ADMIN` et `SUPER_ADMIN` peuvent accéder à cet onglet
- **Permission requise** : `config:securite:edit` (vérifier avec `usePermissions()`)
- **Audit** : Toutes les modifications sont loguées via le `historyService` backend
- **Multi-tenant** : Les paramètres sont scopés par `etablissementId` (sauf SUPER_ADMIN)

## Conventions Respectées

| Convention eLISAschool | Application |
|------------------------|-------------|
| Bannière de fichier | ✅ Sur tous les nouveaux fichiers `.tsx`/`.ts` |
| Nommage camelCase/français | ✅ Variables, fonctions en français |
| CSS variables | ✅ `var(--color-dominante)`, etc. |
| Composants UI existants | ✅ ElisaInput, ElisaSelect, ElisaButton, ElisaToggle |
| React Query | ✅ useQuery, useMutation, queryClient |
| i18n | ✅ useTranslation('securite-config') |
| API client singleton | ✅ apiClient.get/put/post |
| Types TypeScript stricts | ✅ Interfaces dédiées, pas de `any` |
| Animations Framer Motion | ✅ motion.button, whileHover, whileTap |
| Accessibilité | ✅ ARIA labels, role="alert", keyboard nav |
| Toast notifications | ✅ toast.success/error via sonner |

## Points d'Attention

1. **Backend** : Les valeurs des paramètres sont stockées en JSON string → nécessite `JSON.parse()` / `JSON.stringify()` dans le hook
2. **Cache** : Invalider le cache React Query après chaque mutation pour forcer le rechargement
3. **Erreurs réseau** : Gérer les cas où l'API est indisponible (retry, message utilisateur)
4. **Permissions** : Vérifier `canEditParams` avant d'afficher l'onglet sécurité
5. **Actions dangereuses** : Toujours demander confirmation avant d'exécuter une action irréversible
6. **IP whitelist** : Valider le format des IPs (regex IPv4/IPv6) avant sauvegarde
7. **2FA** : Prévenir l'administrateur que l'activation du 2FA affectera tous les utilisateurs

## Prochaines Étapes après Implémentation

1. Ajouter une page "Historique des événements de sécurité" liée
2. Implémenter un indicateur de "Score de sécurité" (Faible/Moyen/Fort)
3. Ajouter des recommandations automatiques basées sur la configuration actuelle
4. Créer des presets de sécurité (Basique, Standard, Renforcé)
5. Export/Import de configuration sécurité
