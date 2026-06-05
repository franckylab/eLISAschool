---
name: elisaschool-business-logic
description: >
  Guide complet de la logique métier eLISAschool. Utiliser ce skill pour comprendre les règles métier,
  les flux de données, les relations entre modules, et modifier la logique en toute sécurité.
  Déclencheurs : logique métier, règles métier, calcul bulletin, calcul moyenne, workflow,
  multi-tenancy, configuration, gamification, scoring, cantine, transport, requêtes, orientation.
---

# Logique Métier eLISAschool

## Quand utiliser ce skill

- Comprendre une **règle métier** existante avant de la modifier
- Ajouter ou modifier un **calcul** (moyennes, bulletins, scores)
- Implémenter un nouveau **workflow** (approbation, validation, cycle de vie)
- Comprendre les **relations** entre modules et les impacts en cascade
- Travailler sur la **configuration dynamique** et ses effets
- Modifier les **flux de données** académiques ou logistiques

---

## Architecture des dépendances

```
ETABLISSEMENT (racine — enums partagés : SousSysteme, TypeEtablissement, CycleScolaire)
│
├── AUTH (JWT, RBAC, audit) ──────── utilisé par TOUS les modules
│   ├── Utilisateur (identité numérique)
│   ├── ProfilUtilisateur
│   ├── RefreshToken
│   └── AuditLog (système d'audit trail complet)
│
├── AUDIT (consultation & gestion) ─── API REST + archivage + statistiques
│   ├── AuditController (/api/audit/*)
│   ├── AuditArchivageService (archivage 30/365 jours)
│   ├── AuditInterceptor (capture automatique CRUD)
│   └── Migration 003 (audit_logs_archive)
│
├── CONFIGURATION (hub central) ──── 46+ paramètres, cache TTL 5min, EventEmitter
│   ├── ConfigurationApp (singleton — nom, logo, thème, licence)
│   ├── ConfigurationModule (par module — widgets, champs perso)
│   ├── ParametreSysteme (clé/valeur — 8 catégories)
│   └── HistoriqueConfiguration (audit trail complet)
│
├── CHAÎNE ACADÉMIQUE (flux de calcul principal)
│   ├── CYCLES (MATERNELLE, PRIMAIRE, COLLÈGE, LYCÉE)
│   │   └── NIVEAUX (par cycle + sous-système)
│   │       ├── CLASSES (Niveau + Année scolaire)
│   │       │   ├── AffectationEleve (unicité : 1 élève = 1 classe/année)
│   │       │   └── AffectationMatière (vérif : matière au programme du niveau)
│   │       └── MATIÈRES (MatièreNiveau : coefficient + crédits + barème)
│   ├── ANNÉES SCOLAIRES (YYYY-YYYY, une seule active)
│   │   └── PÉRIODES (TypePériode + poids + cloturée)
│   │       └── NOTES (workflow BROUILLON → VALIDÉE → PUBLIÉE)
│   │           └── BULLETINS (agrégation notes × coefficients programme)
│   ├── ÉLÈVES (matricule unique, OneToOne → Utilisateur)
│   │   └── ORIENTATION (profil + suggestions + RDV)
│   ├── PERSONNEL (matricule unique, OneToOne → Utilisateur)
│   └── MATIÈRES (GroupesMatières + MatiereNiveau + AffectationMatière)
│
├── SERVICES LOGISTIQUES (porte-monnaie + inventaire)
│   ├── CANTINE (menu + inscription + solde + consommation)
│   ├── TRANSPORT (ligne + inscription + présence QR)
│   └── MATÉRIEL (inventaire + prêt avec stock)
│
├── VIE ÉTUDIANTE
│   ├── CLUBS (inscription avec limite + approbation)
│   └── GAMIFICATION (points + badges + classement)
│
├── COMMUNICATION
│   ├── MESSAGERIE (conversations + messages + soft delete)
│   ├── NOTIFICATIONS (4 canaux + scheduling + bulk)
│   └── REQUÊTES (workflow multi-niveaux d'approbation)
│
├── DOCUMENTS
│   ├── CARTES (5 types + QR code + expiration + renouvellement)
│   └── IMPRESSIONS (templates HTML + file d'attente + batch)
│
└── SYSTÈME
    ├── SCORING (5 indicateurs pondérés + règles événementielles)
    └── MONITORING (health check + métriques + maintenance mode)
```

---

## Domaine 1 : Chaîne académique (calcul notes → bulletins)

### Flux de données complet

```
Configuration (bareme_defaut=20, require_validation=true)
        ↓
Cycles → Niveaux → MatiereNiveau (coefficient, barème, obligatoire)
        ↓
Classes (Niveau + AnnéeScolaire) → AffectationElèves + AffectationMatières
        ↓
Périodes (dans AnnéeScolaire, poids configurable)
        ↓
Notes (Élève × Matière × Période × Classe)
  → standardisation sur /20 : noteSur20 = (valeur / barème) × 20
  → workflow : BROUILLON → VALIDÉE → PUBLIÉE
        ↓
Bulletins = agrégation de toutes les notes publiées d'un élève pour une période
  → moyenneMatière = notesService.calculerMoyenne(eleveId, matiereId, periodeId)
  → moyenneGénérale = Σ(moyenneMatière × coeffNiveau) / Σ(coefficients)
  → stats : moyenneClasse, min, max, rang
```

### Règles métier critiques

**Notes** :
- Si `require_validation = true` (config), note créée en `BROUILLON`, sinon directement `VALIDÉE`
- Seules les notes `PUBLIÉE` comptent dans le calcul de moyenne
- `calculerMoyenne()` : moyenne pondérée sur base 20, arrondi 2 décimales
- `createBulk()` : crée N notes d'un coup pour une classe entière
- L'`anneeScolaireId` est auto-résolu depuis la période si non fourni

**Bulletins** :
- Génération = opération lourde qui traverse 4 services (classes, périodes, matières, notes)
- **Upsert** : un bulletin par tuple (eleveId, classeId, periodeId) — mise à jour si existant
- Le programme du niveau (`MatiereNiveau`) détermine quelles matières entrent dans le bulletin
- TODO connu : le calcul des rangs n'est pas encore implémenté

**Classes** :
- Si `anneeScolaireId` non fourni → récupère l'année active automatiquement
- Protection suppression : impossible de supprimer une classe avec des élèves actifs
- Unicité affectation : 1 élève = 1 classe par année (changement de classe bloqué)
- `effectifActuel` incrémenté automatiquement (+1 à chaque affectation)

**Années scolaires** :
- Une seule année `enCours` à la fois (désactive les autres automatiquement)
- Protection : impossible de supprimer l'année active
- Libellé au format `YYYY-YYYY` (regex validé)

**Périodes** :
- `poids` (float, défaut 1) pour pondération dans la moyenne annuelle
- `cloturee` verrouille la période — protection suppression

### Comment modifier un calcul

```
Pour modifier le calcul de moyenne :
1. Notes : notesService.calculerMoyenne() — standardisation /20 + pondération
2. Bulletins : bulletinsService.generer() — agrégation × coefficients programme
3. Vérifier les paramètres config : notes.bareme_defaut, notes.show_ranking
4. Tester avec des données réalistes (coefficients variés, notes sur barèmes différents)
```

---

## Domaine 2 : Authentification et sécurité

### Workflow de connexion

```
login(email, password)
  ├── Vérifier blocage (estBloque() → bloqueJusquà > now ?)
  ├── Vérifier statut (SUSPENDU → erreur, INACTIF → erreur)
  ├── Vérifier mot de passe (bcrypt compare)
  │   ├── Échec → tentativesConnexion++ → si >= max (config) → blocage auto
  │   └── Succès → reset compteur → générer tokens JWT → audit log
  └── Retourner { accessToken, refreshToken, utilisateur }
```

### Règles métier auth

- **Blocage automatique** après N tentatives (`auth.max_login_attempts`, défaut 5)
- **Durée blocage** configurable (`auth.lockout_duration`, défaut 15 min)
- **Matricule auto-généré** : `EL` + 2 derniers chiffres année + 6 chars alphanum (boucle while unicité)
- **Politique mot de passe** : majuscule + minuscule + chiffre, min 8 chars (configurable)
- **Token reset password** : expire après 1h, token sécurisé (crypto.randomBytes 32)
- **Register** : statut `EN_ATTENTE_VALIDATION` → vérification email → `ACTIF`
- **Admin create** (utilisateurs) : statut `ACTIF` directement (pas de vérification email)

### RBAC (Role-Based Access Control)

- 9 rôles, ~30 permissions granulaires
- `requireRoles(Role.XXX)` : vérification exacte de rôle
- `requireAccess(permission)` : vérification rôle OU permission + bypass SUPER_ADMIN
- Presets middleware : `adminOnly`, `managerOnly`, `staffOnly`, `teacherOnly`
- Permissions config : 18 permissions granulaires pour le module Configuration

### Audit Trail (Système de traçabilité complet)

**Architecture** :
```
AuditLog (entité dans auth)
├── 80+ actions définies dans AuditAction enum
├── 3 niveaux de sévérité : INFO, WARNING, CRITICAL
├── Capture : utilisateur, action, cible, IP, user agent, valeurs avant/après
└── Double journalisation : DB + Winston logs

AuditService (méthodes)
├── log() — Méthode générique
├── logLogin() — Connexions réussies/échouées
├── logPasswordChange() — Changements mot de passe
├── logEntityChange() — Modifications entités (avec sanitization)
├── logAccessDenied() — Accès refusés
├── logCRUD() — Helper générique pour CREATE/UPDATE/DELETE
└── getLogs() — Récupération avec filtres

AuditController (API REST /api/audit/*)
├── GET /logs — Liste paginée avec filtres (ADMIN)
├── GET /logs/:id — Détail d'un log (ADMIN)
├── GET /logs/me — Mes logs personnels (tous utilisateurs)
├── GET /logs/export — Export CSV/JSON (ADMIN)
└── GET /logs/statistics — Statistiques complètes (ADMIN)

AuditArchivageService
├── archiveOldLogs(30 jours) — Archive les anciens logs
├── purgeArchivedLogs(365 jours) — Purge les archives
└── getStatistics() — Statistiques agrégées

AuditInterceptor (automatique)
├── createAuditInterceptor() — Configuration flexible
├── genericAuditMiddleware() — Usage simple
└── Capture automatique POST/PUT/PATCH/DELETE
```

**Actions d'audit disponibles** (80+) :

- **Auth** : LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_RESET
- **Utilisateurs** : USER_CREATE/UPDATE/DELETE, SUSPEND, ACTIVATE, ROLE_CHANGE
- **Élèves** : ELEVE_CREATE/UPDATE/DELETE, INSCRIPTION
- **Académique** : CYCLE, NIVEAU, CLASSE, MATIERE, PERIODE, ANNEE_SCOLAIRE (CRUD + ACTIVATE)
- **Bulletins** : BULLETIN_GENERATE, BULLETIN_UPDATE
- **Cantine** : MENU_CREATE/UPDATE/DELETE, INSCRIPTION_CANTINE, SOLDE_RECHARGE, CONSOMMATION
- **Transport** : LIGNE_CREATE/UPDATE/DELETE, INSCRIPTION_TRANSPORT, PRESENCE
- **Cartes** : CARTE_CREATE/UPDATE, DESACTIVER, RENOUVELER, PERTE
- **Matériel** : MATERIEL_CREATE/UPDATE/DELETE, ASSIGN, RETURN
- **Messages** : MESSAGE_SEND, DELETE, MARK_READ
- **Clubs** : CLUB_CREATE/UPDATE/DELETE, JOIN, LEAVE
- **Gamification** : BADGE_AWARD, SCORE_UPDATE
- **Orientation** : ORIENTATION_CREATE/UPDATE/VALIDATE
- **Requêtes** : REQUETE_CREATE/EXECUTE/DELETE
- **RBAC** : ROLE_CREATE/UPDATE/DELETE/ASSIGN/REVOKE, PERMISSION_CREATE/UPDATE/DELETE
- **Config** : CONFIG_UPDATE, MODULE_ACTIVATE/DEACTIVATE
- **Sécurité** : ACCESS_DENIED, PERMISSION_CHANGE, DATA_EXPORT/IMPORT/DELETE_BULK
- **Documents** : DOCUMENT_CREATE/DELETE/PRINT/GENERATE
- **Notes** : NOTE_CREATE/UPDATE/DELETE/VALIDATE

**Modules instrumentés** (exemples) :
- ✅ Auth (login, password, access denied)
- ✅ Élèves (create, update, delete)
- ✅ Utilisateurs (create, update, delete, suspend/activate)
- ✅ Notes (create, update)
- ✅ Configuration (via historique dédié)

**Comment instrumenter un module** :
```typescript
// 1. Imports
import { Request } from 'express';
import { auditService, AuditAction } from '@modules/auth';

// 2. Dans la méthode CREATE
async create(dto: CreateDto, req?: Request): Promise<Entity> {
    const entity = await this.repo.save(dto);
    
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ELEVE_CREATE,
            cible: 'Eleve',
            cibleId: entity.id,
            description: `Création élève: ${entity.matricule}`,
            nouvellesValeurs: dto,
            module: 'eleves',
        }, req);
    }
    
    return entity;
}

// 3. Dans le controller, passer req
router.post('/', authMiddleware, async (req, res) => {
    const entity = await service.create(req.body, req); // ← Ajouter req
    res.json({ success: true, data: entity });
});
```

**Archivage automatique** :
- Logs < 30 jours : table `audit_logs` (accès rapide)
- Logs 30-365 jours : table `audit_logs_archive` (accès modéré)
- Logs > 365 jours : export + suppression (configurable)
- Migration SQL : `003-audit-logs-archive.sql`
- Fonctions PostgreSQL : `archive_old_audit_logs()`, `purge_old_audit_archives()`

**Documentation** :
- Guide complet : `backend/docs/audit-trail.md`
- Guide d'instrumentation : `backend/AUDIT-INSTRUMENTATION-GUIDE.md`
- Récapitulatif : `IMPLEMENTATION-AUDIT-TRAIL.md`

---

## Domaine 3 : Configuration dynamique

### Architecture du système de configuration

```
ConfigurationService (603 lignes — le plus gros service)
├── Cache mémoire TTL 5 min (3 niveaux : app, modules, paramètres)
├── Invalidation sélective à chaque modification
├── HistoriqueConfiguration (audit trail complet)
└── ConfigurationListener (EventEmitter — événements : CHANGE, APP_CHANGE, MODULE_CHANGE, etc.)

ConfigHelper (API publique utilisée par 12+ modules)
├── getParam<T>(clé, défaut) — avec cache rapide TTL 1 min
├── getParamNumber(), getParamBoolean(), getParamJson(), getParamArray()
├── isModuleActive(moduleName)
└── getAppConfig(), getModuleParams()
```

### Paramètres influençant le comportement métier

| Clé | Défaut | Modules impactés | Effet |
|-----|--------|-----------------|-------|
| `auth.max_login_attempts` | 5 | auth | Blocage après N tentatives |
| `auth.lockout_duration` | 15 | auth | Durée du blocage (minutes) |
| `auth.password_min_length` | 8 | auth, utilisateurs | Longueur minimale mdp |
| `notes.bareme_defaut` | 20 | notes, bulletins | Barème par défaut des notes |
| `notes.require_validation` | true | notes | Workflow BROUILLON obligatoire |
| `notes.show_ranking` | true | bulletins | Affichage du rang |
| `cantine.menu_planning_days` | 7 | cantine | Jours de planification menus |
| `cantine.allow_preorder` | true | cantine | Pré-commande autorisée |
| `cantine.max_debt` | 10000 | cantine | Dette maximale (FCFA) |
| `transport.enable_gps` | false | transport | GPS activé |
| `transport.enable_qr_checkin` | true | transport | Check-in QR obligatoire |
| `gamification.points_attendance` | 5 | gamification | Points assiduité |
| `gamification.points_good_grade` | 10 | gamification | Points bonne note |
| `gamification.enable_leaderboard` | true | gamification | Classement visible |
| `cartes.enable_qrcode` | true | cartes | Génération QR code |
| `cartes.validity_months` | 12 | cartes | Durée validité |
| `clubs.max_per_student` | 3 | clubs | Max clubs par élève |
| `clubs.require_approval` | true | clubs | Approbation inscription |
| `materiel.max_loan_days` | 30 | materiel | Durée max prêt (jours) |
| `requetes.approval_levels` | 1 | requetes | Niveaux d'approbation |
| `system.maintenance_mode` | false | monitoring | Mode maintenance |

### Comment ajouter un nouveau paramètre

```typescript
// 1. Ajouter dans configuration-seed.service.ts
await this.upsertParametre({
    cle: 'module.new_param',
    categorie: CategorieParametre.MODULE,
    module: 'nom_module',
    valeurDefaut: JSON.stringify('default_value'),
    typeValeur: 'STRING',
    modifiableRuntime: true,
    visible: true,
});

// 2. Utiliser dans le service cible
import { getParamNumber } from '@modules/configuration/utils/config.helper';
const value = getParamNumber('module.new_param', 42);
```

---

## Domaine 4 : Services logistiques

### Cantine — Porte-monnaie électronique

```
Inscription (solde=0, statut=ACTIVE)
  → rechargerSolde(montant) — min 100 FCFA
  → enregistrerConsommation(inscriptionId, menuId)
      ├── Vérifie inscription active
      ├── Vérifie solde >= montant du menu
      ├── Débite le solde
      └── Crée ConsommationCantine (paye=true si débit effectué)
```

- Solde ne peut **jamais** être négatif
- Devise depuis config (`regional.currency`, défaut XOF/FCFA)
- Menus avec allergènes, types de repas, statuts (DISPONIBLE/ÉPUISÉ/ANNULÉ/CONSOMMÉ)

### Transport — Présences QR

```
Ligne (arrêts JSON ordonnés) + Inscription (élève, arrêt montée/descente)
  → enregistrerPresence(inscriptionId, trajet, qrData?)
      ├── Si QR checkin activé (config) → vérifie données QR
      └── Crée PresenceTransport (aller/retour, heure montée)
```

### Matériel — Gestion de stock avec prêts

```
Materiel (quantité, disponible)
  → preter(materielId, emprunteurId, quantite, jours)
      ├── Vérifie disponible=true ET quantite >= demandée
      ├── Vérifie durée <= maxLoanDays (config, défaut 30j)
      ├── Décrémente quantite → si 0, disponible=false
      └── Crée PretMateriel avec dateRetourPrevue auto
  → retourner(pretId)
      ├── Vérifie non déjà retourné
      ├── Incrémente quantite
      └── disponible=true
```

---

## Domaine 5 : Requêtes — Workflow multi-niveaux

```
Création requête
  → Numéro auto : TYP-YYYY-NNNNN (ex: CONGE-2026-00001)
  → Niveaux approbation depuis config (requetes.approval_levels)
  → Statut initial : EN_ATTENTE

traiter(requeteId, decision, commentaire)
  ├── APPROUVE :
  │   ├── niveauActuel++
  │   ├── Si niveauActuel >= approvalLevels → STATUT = APPROUVÉE
  │   └── Sinon → STATUT = EN_COURS (attente niveau suivant)
  ├── REJETE → STATUT = REJETÉE (immédiat, peu importe le niveau)
  └── Historique : {approbateur, décision, date, commentaire}

annuler(requeteId, userId)
  └── Seul le demandeur peut annuler, seulement si EN_ATTENTE
```

---

## Domaine 6 : Gamification et Scoring

### Gamification

```
attribuerPoints(userId, action, points)
  → PointsUtilisateur : pointsTotal += points, calcul niveau = floor(total/100)+1
  → HistoriquePoints (action, points, description)

attribuerPointsBonneNote(userId, note, bareme)
  → Condition : (note/bareme) >= 0.80 (80%)
  → Points depuis config (gamification.points_good_grade, défaut 10)

attribuerBadge(userId, badgeId)
  → Idempotent : retourne l'existant si déjà attribué

getClassement()
  → Retourne [] si leaderboard désactivé (config)
```

### Scoring

```
ScoreEleve (5 types indicateurs : ACADÉMIQUE, COMPORTEMENT, ASSIDUITÉ, PARTICIPATION, GLOBAL)

getScoreGlobal(eleveId)
  → Moyenne pondérée configurable :
    académique 40% + comportement 25% + assiduité 25% + participation 10%

appliquerRegle(evenement, eleveId)
  → Trouve toutes les RegleScoring pour l'événement
  → Attribue les points correspondants

calculerRangs(type)
  → Tri DESC par score → rang séquentiel
```

---

## Domaine 7 : Orientation

```
ProfilOrientation (1 par élève — unicité)
  → aptitudes : objet {domaine, niveau}
  → centresInteret, motivations, filiereSouhaitee

suggestFilieres(profilId)
  → Matching mots-clés par filière :
    SCIENTIFIQUE : "math", "physique", "science"
    LITTÉRAIRE : "français", "lettre", "philo"
    TECHNIQUE : "tech", "info", "électro"
    ARTISTIQUE : "art", "musique", "dessin"
  → Score par filière, tri DESC, filtre score > 0

RdvOrientation (statuts : PLANIFIÉ, TERMINÉ, ANNULÉ)
  → Durée : 15 à 120 minutes (défaut 30)
  → annulerRdv() = raccourci vers statut ANNULÉ
```

---

## Domaine 8 : Cartes et Documents

### Cartes

```
create(carteDto)
  → Expiration = now + validityMonths (config, défaut 12)
  → Numéro unique : TYP25XXXXXX (2 chiffres année + 6 aléatoire)
  → QR code si activé (config) — format ELISA:{type}:{userId}:{timestamp}
  → Nom établissement depuis AppConfig

renouveler(carteId)
  → Expire l'ancienne (EXPIRÉE) → crée nouvelle avec mêmes params

verifier(numeroCarte)
  → Vérifie existence + statut ACTIVE + non expirée

getCartesExpirantBientot(jours=30)
  → Anticipation configurable
```

### Impressions

```
genererDocument(type, data, modeleId?)
  → Récupère modèle (spécifique ou par défaut du type)
  → Génère en-tête HTML (logo, nom, arrêté, adresse, slogan depuis AppConfig)
  → Remplace placeholders {{key}} dans le template HTML
  → Génère pied de page
  → TODO : Puppeteer pour conversion PDF

ModeleDocument : 7 types (BULLETIN, CERTIFICAT, CARTE_SCOLAIRE, ATTESTATION, RAPPORT, FORMULAIRE, AUTRE)
  → Si parDefaut=true, désactive les autres par défaut du même type
```

---

## Patterns transversaux

### Multi-tenancy

- `etablissementId` sur la plupart des entités (nullable = global)
- Résolu depuis le JWT via `tenantMiddleware`
- Modules concernés : cantine, transport, clubs, cartes, matériel, classes, notes, bulletins, etc.
- **Non concernés** : cycles, niveaux, matières brutes (données de référence partagées)

### Unicité par vérification manuelle

| Entité | Champ | Code d'erreur |
|--------|-------|--------------|
| Élève | matricule | `MATRICULE_EXISTS` (409) |
| Élève | utilisateurId | `USER_ALREADY_LINKED` (409) |
| Personnel | matricule | `MATRICULE_EXISTS` (409) |
| Personnel | utilisateurId | `USER_ALREADY_MEMBER` (409) |
| Matière | nom | `MATIERE_EXISTS` (409) |
| Cycle | code | `CYCLE_EXISTS` (409) |
| Club | nom par établissement | vérifié |
| Classe | affectation élève/année | `ALREADY_ASSIGNED` (409) |
| Carte | numeroCarte | contrainte DB unique |
| Gamification badge | code | contrainte DB unique |

### Protection suppression

| Entité | Condition | Code d'erreur |
|--------|-----------|--------------|
| Année scolaire | `enCours = true` | `CANNOT_DELETE_ACTIVE` |
| Période | `cloturee = true` | `CANNOT_DELETE_CLOSED` |
| Classe | élèves actifs affectés | `CLASS_NOT_EMPTY` |

### Workflow par statuts

| Entité | Statuts | Transitions |
|--------|---------|-------------|
| Note | BROUILLON → VALIDÉE → PUBLIÉE | Validation horodatée + validateur |
| Bulletin | publie (boolean) | false → true |
| Requête | EN_ATTENTE → EN_COURS → APPROUVÉE/REJETÉE | Multi-niveaux |
| RDV Orientation | PLANIFIÉ → TERMINÉ/ANNULÉ | annulerRdv() |
| Notification | EN_ATTENTE → ENVOYÉE → LUE/ÉCHEC | Dispatch par canal |
| Utilisateur | ACTIF/INACTIF/SUSPENDU/EN_ATTENTE_VALIDATION | changeStatut() |
| Élève | ACTIF/EXCLU/ABANDON/DIPLÔMÉ | update() |
| Cantine inscription | ACTIVE/SUSPENDUE/RÉSILIÉE | — |
| Impression file | EN_ATTENTE → EN_COURS → TERMINÉ/ÉCHEC/ANNULÉ | annulerImpression() |
| Carte | ACTIVE/INACTIVE/PERDUE/EXPIRÉE/DÉSACTIVÉE | renouveler(), signalerPerte() |

### Configuration-driven (piloté par config)

- **12+ modules** lisent leurs paramètres depuis `config.helper`
- Cache multi-niveaux : ConfigurationService (5min) + ConfigHelper (1min)
- Invalidation automatique à chaque modification
- EventEmitter pour propagation des changements (ConfigurationListener)
- Paramètres non modifiables au runtime : flag `modifiableRuntime = false`

---

## Guide de modification de la logique métier

### Avant de modifier

1. **Identifier le domaine** concerné (académique, auth, config, logistique, etc.)
2. **Tracer les dépendances** : quels modules/services sont impactés ?
3. **Vérifier les paramètres config** qui influencent le comportement
4. **Lire le service complet** avant de toucher au code
5. **Identifier les protections** existantes (unicité, cascade, workflow)

### Règles de sécurité

```
NE PAS modifier sans comprendre :
- L'impact sur le calcul de bulletins (cascade notes → moyennes → bulletin)
- Les contraintes d'unicité (matricules, affectations)
- Les protections de suppression (année active, période clôturée)
- Le système de cache (TTL, invalidation)
- Le multi-tenancy (etablissementId)
- Les paramètres config qui pilotent le comportement

TOUJOURS vérifier :
- Les imports croisés entre modules (barrel exports)
- Les événements émis (ConfigurationListener)
- L'historique de configuration (audit trail)
- Les tests manuels après modification
```

### Ajouter une nouvelle règle métier

```typescript
// Pattern standard dans le service :
async maNouvelleOperation(id: string, dto: MonDto): Promise<Entity> {
    // 1. Récupérer l'entité (ou throw 404)
    const entity = await this.findOne(id);

    // 2. Vérifier les conditions métier
    if (entity.statut !== 'EXPECTED_STATUS') {
        throw new AppError('Message en français', 400, 'INVALID_STATUS');
    }

    // 3. Lire la config si nécessaire
    const param = getParamNumber('module.param', defaultValue);

    // 4. Appliquer la logique
    entity.champ = nouvelleValeur;
    await this.repo.save(entity);

    // 5. Logger l'opération
    logger.info(`Opération effectuée: ${id}`);

    // 6. Émettre un événement si pertinent
    // configListener.emit('module:event', { id, ... });

    return entity;
}
```

---

## Fichiers clés pour la logique métier

| Rôle | Fichier | Lignes |
|------|---------|--------|
| Cœur configuration | `backend/src/modules/configuration/services/configuration.service.ts` | 603 |
| API config (utilisé partout) | `backend/src/modules/configuration/utils/config.helper.ts` | — |
| Seed paramètres par défaut | `backend/src/modules/configuration/services/configuration-seed.service.ts` | — |
| Event listener config | `backend/src/modules/configuration/services/configuration-listener.ts` | — |
| Calcul notes | `backend/src/modules/notes/services/notes.service.ts` | 189 |
| Génération bulletins | `backend/src/modules/bulletins/services/bulletins.service.ts` | 122 |
| Affectation classes | `backend/src/modules/classes/services/classes.service.ts` | 120 |
| Programme matières | `backend/src/modules/matieres/services/matieres.service.ts` | 133 |
| Auth complète | `backend/src/modules/auth/services/auth.service.ts` | — |
| Porte-monnaie cantine | `backend/src/modules/cantine/services/cantine.service.ts` | — |
| Workflow requêtes | `backend/src/modules/requetes/services/requete.service.ts` | — |
| Scoring pondéré | `backend/src/modules/scoring/services/scoring.service.ts` | — |
| Gamification | `backend/src/modules/gamification/services/gamification.service.ts` | — |
| Orientation (suggestions) | `backend/src/modules/orientation/services/orientation.service.ts` | 171 |
| **Audit trail (entité)** | `backend/src/modules/auth/entities/audit-log.entity.ts` | 139 |
| **Audit trail (service)** | `backend/src/modules/auth/services/audit.service.ts` | 230 |
| **Audit trail (controller)** | `backend/src/modules/audit/controllers/audit.controller.ts` | 300 |
| **Audit archivage** | `backend/src/modules/audit/services/archivage.service.ts` | 149 |
| **Audit interceptor** | `backend/src/common/interceptors/audit.interceptor.ts` | 175 |
| **Migration archivage** | `backend/src/database/migrations/003-audit-logs-archive.sql` | 129 |
| Enums partagés | `shared/src/enums/roles.enum.ts`, `statuts.enum.ts`, `modules.enum.ts` | — |
| Types API | `shared/src/types/api.types.ts` | — |
| Registre modules | `shared/src/config/config.registry.ts` | — |

---

## Maintenance et évolution

Ce skill doit être **mis à jour** lorsque :

- Un **nouveau module métier** est ajouté (ex: paiements, examens, emploi du temps)
- Une **règle métier existante** est modifiée significativement
- Un **nouveau pattern transversal** émerge (ex: event sourcing, saga pattern)
- Les **relations entre modules** changent structurellement

### Comment mettre à jour

1. Demander : *« Mets à jour le skill business logic pour inclure [module/changement] »*
2. L'IA lira les fichiers concernés et mettra à jour les sections appropriées
3. Les modifications sont toujours communiquées à l'utilisateur

> **Ce skill est vivant** — il reflète l'état actuel de la logique métier et évolue avec le projet.
