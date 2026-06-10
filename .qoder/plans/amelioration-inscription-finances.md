# Plan d'Implémentation : Amélioration Système d'Inscription et Gestion des Frais

## Contexte

Ce plan vise à améliorer la logique d'inscription/préinscription des élèves et la gestion des frais d'inscription dans eLISAschool, en intégrant le workflow de validation financier multi-niveaux et le système de modèles de documents personnalisables pour les reçus.

**Objectifs principaux** :
1. Permettre l'auto-inscription des parents/élèves via un portail (préinscription)
2. Intégrer le workflow de validation financier aux paiements (seuils configurables)
3. Rendre les reçus de paiement personnalisables via des modèles HTML
4. Automatiser la création des frais d'inscription lors de la validation d'une inscription
5. Optimiser les performances avec index stratégiques et cache

---

## Phase 1 : Extension du Module Élèves (Inscription/Préinscription)

### 1.1 Migration SQL

**Fichier** : `backend/database/migrations/049-ameliorations-inscription-finances.sql`

**Nouvelles colonnes sur `eleves`** :
- `type_inscription` VARCHAR(20) : 'AUTO' | 'MANUELLE' | 'PORTAIL'
- `etat_inscription` VARCHAR(30) DEFAULT 'COMPLET' : 'BROUILLON' | 'COMPLET' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REFUSE'
- `est_preinscription` BOOLEAN DEFAULT false
- `documents_justificatifs` JSONB : [{ url, type, dateUpload }]
- `classe_souhaitee_id` UUID (FK vers classes)
- `commentaire_refus` TEXT
- `date_traitement_inscription` TIMESTAMP
- `traite_par` UUID (FK vers utilisateurs)

**Nouvelles colonnes sur `paiements`** :
- `statut_validation` VARCHAR(20) DEFAULT 'NON_REQUIS' : 'NON_REQUIS' | 'EN_ATTENTE' | 'VALIDE' | 'REFUSE'
- `niveau_validation_actuel` INTEGER DEFAULT 0
- `motif_refus` TEXT

**Index composites** :
- `idx_eleves_preinscription_etat` : (etablissement_id, est_preinscription, etat_inscription) WHERE est_preinscription=true
- `idx_paiements_validation` : (etablissement_id, statut_validation, date_paiement DESC) WHERE statut_validation!='NON_REQUIS'

### 1.2 Extension Entity Eleve

**Fichier** : `backend/src/modules/eleves/entities/eleve.entity.ts`

Ajouter 8 nouveaux champs après `etatDossier` (ligne 128) :
```typescript
@Column({ type: 'varchar', length: 20, nullable: true })
typeInscription?: 'AUTO' | 'MANUELLE' | 'PORTAIL';

@Column({ type: 'varchar', length: 30, default: 'COMPLET' })
etatInscription!: 'BROUILLON' | 'COMPLET' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REFUSE';

@Column({ type: 'boolean', default: false })
estPreinscription!: boolean;

@Column({ type: 'simple-json', nullable: true })
documentsJustificatifs?: Array<{ url: string; type: string; dateUpload: string }>;

@Column({ type: 'uuid', nullable: true })
classeSouhaiteeId?: string;

@ManyToOne(() => Classe, { nullable: true })
@JoinColumn({ name: 'classeSouhaiteeId' })
classeSouhaitee?: Classe;

@Column({ type: 'text', nullable: true })
commentaireRefus?: string;

@Column({ type: 'timestamp', nullable: true })
dateTraitementInscription?: Date;

@Column({ type: 'uuid', nullable: true })
traitePar?: string;

@ManyToOne(() => Utilisateur, { nullable: true })
@JoinColumn({ name: 'traitePar' })
traiteParUser?: Utilisateur;
```

### 1.3 Nouveaux DTOs

**Fichier** : `backend/src/modules/eleves/dto/eleves.dto.ts`

```typescript
// Préinscription (formulaire public - champs réduits)
export const preinscriptionSchema = z.object({
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lieuNaissance: z.string().min(2).max(100),
    sexe: z.enum(['M', 'F']),
    nationalite: z.string().optional(),
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    nomTuteur: z.string().min(2),
    telephoneTuteur: z.string().min(6),
    email: z.string().email().optional(),
    adresseDomicile: z.string().optional(),
    ville: z.string().optional(),
    classeSouhaiteeId: z.string().uuid(),
    codeEtablissement: z.string().min(2), // Pour résoudre l'établissement
});

// Conversion préinscription → inscription
export const convertirPreinscriptionSchema = z.object({
    classeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
});

// Filtres pour liste inscriptions
export const queryInscriptionsSchema = z.object({
    etatInscription: z.enum(['BROUILLON', 'COMPLET', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REFUSE']).optional(),
    typeInscription: z.enum(['AUTO', 'MANUELLE', 'PORTAIL']).optional(),
    estPreinscription: z.boolean().optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
});
```

### 1.4 Nouvelles Méthodes ElevesService

**Fichier** : `backend/src/modules/eleves/services/eleves.service.ts`

| Méthode | Complexité | Description |
|---------|-----------|-------------|
| `createPreinscription(dto, etablissementId?)` | Moyenne | Crée élève avec estPreinscription=true, génère matricule provisoire `PRE-ANNEE-XXXXX`, crée utilisateur PARENT si email fourni |
| `convertirPreinscriptionEnInscription(id, classeId, anneeScolaireId, personnelId)` | Haute | Transaction : update élève + génère frais inscription + notifications |
| `refuserPreinscription(id, motif, personnelId)` | Faible | Update avec etatInscription='REFUSE' + notification |
| `findPreinscriptionsEnAttente(etablissementId, query?)` | Faible | Filtre estPreinscription=true AND etatInscription=EN_ATTENTE_VALIDATION |
| `uploadDocumentJustificatif(eleveId, documentUrl, type)` | Faible | Ajoute entrée dans documentsJustificatifs JSON |

**Point clé - createPreinscription()** :
```typescript
async createPreinscription(dto: PreinscriptionDto, etablissementId?: string): Promise<Eleve> {
    // 1. Résoudre établissement via codeEtablissement si besoin
    // 2. Générer matricule provisoire
    const matricule = await this.generateMatriculeProvisoire('PRE', etablissementId);
    
    // 3. Si email fourni → créer utilisateur PARENT
    let utilisateurId: string | undefined;
    if (dto.email) {
        utilisateurId = await this.creerUtilisateurParent(dto.email, dto.nomTuteur);
    }
    
    // 4. Créer élève préinscription
    const eleve = this.repo.create({
        ...dto,
        matricule,
        utilisateurId,
        estPreinscription: true,
        etatInscription: 'EN_ATTENTE_VALIDATION',
        statut: StatutEleve.EN_ATTENTE_VALIDATION,
        etablissementId,
    });
    
    await this.repo.save(eleve);
    
    // 5. Notification aux ADMIN
    await notificationsService.create({...});
    
    return eleve;
}
```

### 1.5 Nouvelles Routes ElevesController

**Fichier** : `backend/src/modules/eleves/controllers/eleves.controller.ts`

| Route | Méthode | Auth | Rôle | Description |
|-------|---------|------|------|-------------|
| `/api/eleves/preinscription` | POST | NON (publique) | — | Soumettre préinscription (portail) |
| `/api/eleves/preinscriptions/en-attente` | GET | OUI | ADMIN, CHEF | Lister préinscriptions à traiter |
| `/api/eleves/preinscription/:id/convertir` | POST | OUI | ADMIN, CHEF | Convertir en inscription |
| `/api/eleves/preinscription/:id/refuser` | POST | OUI | ADMIN, CHEF | Refuser avec motif |
| `/api/eleves/:id/documents` | POST | OUI | ADMIN, PERSONNEL | Upload document justificatif |
| `/api/eleves/inscriptions` | GET | OUI | ADMIN, CHEF | Lister inscriptions avec filtres |

**Note critique** : La route publique `/api/eleves/preinscription` doit être montée AVANT le `tenantMiddleware` dans `app.ts`.

---

## Phase 2 : Intégration Workflow Financier aux Paiements

### 2.1 Modifier enregistrerPaiement()

**Fichier** : `backend/src/modules/finances/services/scolarite.service.ts` (ligne 323)

**Logique actuelle** :
```
créer paiement → statut = PAYE → save → créer reçu → commit
```

**Nouvelle logique** :
```
1. Consulter financeWorkflowService pour déterminer validation requise
2. Si montant >= seuil_configuré :
   - paiement.statut = StatutPaiement.EN_ATTENTE
   - paiement.statutValidation = 'EN_ATTENTE'
   - Notification aux validateurs (COMPTABLE, CAISSIER selon rôle)
3. Si validation NON requise :
   - paiement.statut = StatutPaiement.PAYE
   - paiement.statutValidation = 'NON_REQUIS'
4. Dans les deux cas : créer RecuPaiement
```

### 2.2 Nouvelles Méthodes ScolariteService

| Méthode | Complexité | Description |
|---------|-----------|-------------|
| `validerPaiement(paiementId, validateurId, role)` | Moyenne | Appelle financeWorkflowService.valider(), met à jour statutValidation, si dernier niveau → statut=PAYE et génère reçu |
| `rejeterPaiement(paiementId, motif, validateurId, role)` | Faible | statutValidation='REFUSE', motifRefus, notification au caissier |
| `getPaiementsEnAttente(etablissementId, role)` | Faible | Liste paiements avec statutValidation='EN_ATTENTE' |
| `configurerSeuilValidation(etablissementId, seuil)` | Faible | Sauvegarde seuil dans table parametres |

### 2.3 Nouvelles Routes FinancesController

| Route | Méthode | Rôle | Description |
|-------|---------|------|-------------|
| `/api/paiements/:id/valider` | POST | COMPTABLE, CAISSIER, CHEF | Valider un paiement |
| `/api/paiements/:id/rejeter` | POST | Idem | Rejeter un paiement |
| `/api/paiements/a-valider` | GET | COMPTABLE, CAISSIER, CHEF | Liste paiements en attente |
| `/api/paiements/seuil-validation` | GET | ADMIN, CHEF | Voir seuil actuel |
| `/api/paiements/seuil-validation` | POST | ADMIN, CHEF | Configurer seuil |

---

## Phase 3 : Intégration Reçus avec Système de Modèles

### 3.1 Ajouter RECUPAIEMENT au TypeDocument

**Fichiers** :
- `shared/src/enums/statuts.enum.ts` (ajouter `RECUPAIEMENT = 'RECUPAIEMENT'`)
- `backend/src/modules/impressions/entities/impressions.entity.ts` (synchroniser)

### 3.2 Modèle de Reçu par Défaut

**Placeholders supportés** :
```
{{numeroRecu}}, {{datePaiement}}, {{eleveNom}}, {{eleveMatricule}}, {{classeNom}}
{{montant}}, {{montantEnLettres}}, {{methodePaiement}}, {{objet}}, {{anneeScolaire}}
{{nomCaissier}}, {{signatureCaissier}}, {{etablissementNom}}, {{etablissementAdresse}}
{{logoUrl}}, {{mentionsLegales}}
```

**Script de seed** : `backend/scripts/seed-modele-recu.ts` (nouveau)

### 3.3 Modifier Génération de Reçu

Dans `enregistrerPaiement()` (ligne 410-424) :
```
1. Créer RecuPaiement en base (sans pdfPath)
2. Si paiement PAYE (pas en attente) :
   a. Créer FileImpression avec type=RECUPAIEMENT, donnees={placeholders}
   b. Si modèle par défaut existe → genererDocument() → update pdfPath
   c. Sinon → pdfPath = null (fallback)
```

### 3.4 Nouvelles Routes Reçus

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/recus/:id/pdf` | GET | Télécharger PDF du reçu |
| `/api/recus/:id/email` | POST | Envoyer reçu par email |
| `/api/recus/modeles` | GET | Lister modèles de reçus |
| `/api/recus/modeles` | POST | Créer modèle personnalisé |
| `/api/recus/modeles/:id` | PUT | Modifier modèle |
| `/api/recus/modeles/:id` | DELETE | Supprimer modèle |

---

## Phase 4 : Automatisation Inscription → Frais

### 4.1 Nouveau TypePaiement

**Fichier** : `shared/src/enums/statuts.enum.ts`
```typescript
INSCRIPTION = 'INSCRIPTION',
```

### 4.2 Méthode genererFraisInscription

**Fichier** : `backend/src/modules/finances/services/scolarite.service.ts`

```typescript
async genererFraisInscription(
    eleveId: string,
    anneeScolaireId: string,
    classeId: string,
    etablissementId?: string
): Promise<Echeancier> {
    // 1. Récupérer FraisScolarite applicable
    const frais = await this.trouverFraisScolarite(...);
    
    // 2. Créer échéancier spécifique (1 tranche)
    const echeancier = this.echeancierRepo.create({
        eleveId,
        fraisScolariteId: frais.id,
        numeroTranche: 1,
        montantAttendu: frais.fraisInscription,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        objet: 'Frais d\'inscription',
        typeFrais: 'INSCRIPTION',
        etablissementId,
    });
    
    // 3. Notification au parent
    await notificationsService.create({...});
    
    return echeancier;
}
```

### 4.3 Intégration dans Conversion

Dans `convertirPreinscriptionEnInscription()` :
```
BEGIN TRANSACTION
  1. UPDATE eleve (estPreinscription=false, statut=ACTIF, etatInscription=VALIDE, ...)
  2. genererFraisInscription(eleveId, anneeScolaireId, classeId)
  3. Notification au parent : "Inscription validée, frais à payer"
COMMIT
```

---

## Phase 5 : Optimisations et Performances

### 5.1 Index Stratégiques

Déjà inclus dans migration Phase 1.1.

### 5.2 Cache

| Élément | TTL | Mécanisme |
|---------|-----|-----------|
| Modèles de documents | 10 min | Map in-memory dans ImpressionsService |
| Configuration frais par classe | 5 min | Map in-memory dans ScolariteService |
| Seuil validation paiements | 15 min | Map in-memory dans FinanceWorkflowService |

### 5.3 Transactions

Utiliser QueryRunner TypeORM partagé pour `convertirPreinscriptionEnInscription()` :
- Update élève
- Création frais d'inscription
- Création échéancier
- Notifications (hors transaction si asynchrone)

### 5.4 Notifications

| Événement | Destinataire | Canal |
|-----------|-------------|-------|
| Préinscription soumise | ADMIN, CHEF | IN_APP + EMAIL |
| Préinscription validée | Parent | IN_APP + EMAIL + SMS |
| Préinscription refusée | Parent | IN_APP + EMAIL |
| Frais d'inscription générés | Parent | IN_APP + EMAIL |
| Paiement en attente validation | COMPTABLE, CAISSIER | IN_APP |
| Paiement validé | Parent | IN_APP + EMAIL |
| Paiement rejeté | Caissier + Parent | IN_APP |

---

## Estimation Globale

| Phase | Complexité | Effort | Risques |
|-------|-----------|--------|---------|
| **Phase 1** : Élèves/Préinscription | Haute | 3-4 jours | Route publique sécurisée, création utilisateur PARENT |
| **Phase 2** : Workflow financier | Moyenne-Haute | 2-3 jours | Compatibilité paiements existants |
| **Phase 3** : Modèles de reçus | Moyenne | 2-3 jours | PDF generation TODO (Puppeteer), double enum TypeDocument |
| **Phase 4** : Automatisation frais | Moyenne | 1-2 jours | Dépend de Phase 1 |
| **Phase 5** : Optimisations | Faible | 1 jour | Cache in-memory vs Redis |
| **TOTAL** | | **9-13 jours** | |

---

## Points de Vigilance Critiques

1. **⚠️ Double enum TypeDocument** : Existe dans `shared/src/enums/statuts.enum.ts` ET `backend/src/modules/impressions/entities/impressions.entity.ts`. Doivent être synchronisés ou unifiés.

2. **⚠️ Route publique preinscription** : Nécessite rate limiter spécifique (10 req/heure par IP) et captcha/reCAPTCHA pour éviter le spam.

3. **⚠️ Génération PDF non implémentée** : `impressionsService.genererDocument()` a un TODO pour Puppeteer (ligne 162). Acceptable pour Phase 3 mais doit être documenté.

4. **⚠️ Transactions imbriquées** : La conversion appelle `genererFraisInscription()` qui crée ses propres données. Utiliser un QueryRunner partagé, pas de transactions imbriquées.

5. **✅ Compatibilité données existantes** : Tous les nouveaux champs ont des valeurs par défaut. Aucune migration de données requise.

---

## Ordre d'Exécution Recommandé

```
1. Migration SQL (049)
2. shared/enums/statuts.enum.ts — TypePaiement.INSCRIPTION
3. impressions entity — RECUPAIEMENT
4. eleve.entity.ts — 8 nouveaux champs
5. eleves.dto.ts — 3 nouveaux schémas
6. eleves.service.ts — 5 nouvelles méthodes
7. eleves.controller.ts — 7 nouvelles routes
8. app.ts — route publique
9. paiement.entity.ts — 3 champs workflow
10. scolarite.service.ts — workflow + reçus + frais inscription
11. finances.controller.ts — routes workflow + reçus
12. impressions.service.ts — cache + genererRecu()
13. seed-modele-recu.ts — script seed
14. Tests E2E complets
```

Chaque étape doit être validée (compilation TypeScript OK) avant de passer à la suivante.

---

## Critères de Succès

- ✅ Parent peut créer une préinscription sans compte (formulaire public)
- ✅ Parent peut créer une préinscription avec compte (portail)
- ✅ Personnel peut voir et traiter les préinscriptions en attente
- ✅ Conversion préinscription → inscription crée automatiquement les frais
- ✅ Paiements passent par workflow de validation si montant > seuil
- ✅ Reçus générés via modèles personnalisables HTML
- ✅ Établissement peut créer/modifier/supprimer ses modèles de reçus
- ✅ PDF des reçus téléchargeables et envoyables par email
- ✅ Toutes les opérations sont auditées
- ✅ Multi-tenancy respecté partout
- ✅ Performances optimisées avec index et cache
