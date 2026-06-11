# Correction FK Dossier Médical - Migration 043

## Problème Identifié

**Erreur** : `constraint "FK_62ea2220d9d736e185d7a955976" for relation "dossiers_medicaux" already exists`

**Cause** : L'entité `DossierMedical` avait deux relations (`eleve` et `membrePersonnel`) pointant vers la **même colonne** `patientId` avec `@JoinColumn`, ce qui créait un conflit de contraintes de clé étrangère dupliquées.

## Corrections Appliquées

### 1. Entité DossierMedical (`dossier-medical.entity.ts`)

**Avant** :
```typescript
@ManyToOne(() => Eleve, { nullable: true })
@JoinColumn({ name: 'patientId' })
eleve?: Eleve;

@ManyToOne(() => MembrePersonnel, { nullable: true })
@JoinColumn({ name: 'patientId' })
membrePersonnel?: MembrePersonnel;
```

**Après** :
```typescript
@ManyToOne(() => Eleve, { nullable: true })
@JoinColumn({ name: 'eleveId' })
eleve?: Eleve;

@ManyToOne(() => MembrePersonnel, { nullable: true })
@JoinColumn({ name: 'personnelId' })
membrePersonnel?: MembrePersonnel;

@Column({ type: 'uuid', nullable: true })
eleveId?: string;

@Column({ type: 'uuid', nullable: true })
personnelId?: string;
```

**Changement** : Séparation des FK en deux colonnes distinctes (`eleveId` et `personnelId`) au lieu d'utiliser `patientId` pour les deux relations.

### 2. Configuration Base de Données (`database.config.ts`)

**Avant** :
```typescript
synchronize: true,
```

**Après** :
```typescript
synchronize: envConfig.app.isDevelopment ? true : false,
```

**Changement** : Désactivation de `synchronize` en production pour éviter les conflits avec les migrations SQL.

### 3. Migration 043 (`043-correction-dossier-medical-fk.ts`)

Création d'une migration qui :
- Ajoute les colonnes `eleve_id` et `personnel_id` avec leurs FK respectives
- Crée les index sur ces nouvelles colonnes
- Migre les données existantes de `patient_id` vers `eleve_id` ou `personnel_id` selon `type_patient`
- Conserve `patient_id` pour compatibilité ascendante

### 4. Service Santé (`sante.service.ts`)

**Méthode `createOrUpdateDossier`** :
- Utilise désormais `eleveId` ou `personnelId` selon le `typePatient`
- Met à jour la colonne appropriée lors de la création/mise à jour

**Méthode `getDossierByPatient`** :
- Accepte un paramètre optionnel `typePatient`
- Recherche dans la colonne appropriée (`eleveId` ou `personnelId`)
- Fallback sur les deux colonnes si `typePatient` n'est pas fourni

**Méthode `createIncidentSante`** :
- Correction de la notification pour utiliser `eleveId` au lieu de `patientId`
- Vérification que le patient est un élève avant de chercher les responsables

### 5. Contrôleur Santé (`sante.controller.ts`)

**Route GET `/dossiers/:patientId`** :
- Ajout du paramètre query optionnel `typePatient` ('ELEVE' | 'PERSONNEL')
- Passage du paramètre au service

## Déploiement

### Option 1 : Script automatisé
```bash
./scripts/deploy-correction-dossier-medical-fk.sh
```

### Option 2 : Manuel
```bash
cd backend
npm install
npm run typeorm migration:run -- -d src/config/database.config.ts
npm run dev
```

## Vérification

Après déploiement, vérifier que :

1. ✅ La migration s'est exécutée sans erreur
2. ✅ La table `dossiers_medicaux` a les colonnes `eleve_id` et `personnel_id`
3. ✅ Le serveur démarre sans erreur de FK dupliquée
4. ✅ La création d'un dossier médical pour un élève fonctionne
5. ✅ La création d'un dossier médical pour un personnel fonctionne
6. ✅ La récupération d'un dossier fonctionne avec `?typePatient=ELEVE` ou `?typePatient=PERSONNEL`

## Impact

- **Rétrocompatible** : La colonne `patient_id` est conservée pour les anciennes données
- **Non-breaking** : L'API continue de fonctionner avec `patientId` dans le DTO
- **Migration transparente** : Les données existantes sont migrées automatiquement
- **Performance** : Index ajoutés sur les nouvelles colonnes pour les requêtes

## Notes

- `patientId` reste dans le DTO pour simplifier l'API
- Le service fait la traduction automatique vers `eleveId` ou `personnelId`
- En production, `synchronize` est désormais `false` pour éviter les conflits avec les migrations
