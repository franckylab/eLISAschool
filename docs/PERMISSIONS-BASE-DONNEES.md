# 📋 PERMISSIONS REQUISES EN BASE DE DONNÉES

> **Date**: 2026-06-11  
> **Version**: 2.0.0  
> **Objectif**: Documenter toutes les permissions à créer en base pour le bon fonctionnement du système

---

## 🎯 CONTEXTE

Le système de permissions v2.0 nécessite que les permissions soient créées en base de données et associées aux rôles. Ce document liste toutes les permissions requises.

---

## 🔍 VÉRIFICATION PRÉLIMINAIRE

### Script de vérification

```bash
node scripts/check-permissions.js
```

Ce script compare les permissions utilisées dans le frontend avec celles définies dans l'enum backend.

---

## 📊 PERMISSIONS PAR MODULE

### 1. Module: élèves

```sql
-- Permissions de base
INSERT INTO permissions (code, libelle, module) VALUES
('eleves:view', 'Voir les élèves', 'eleves'),
('eleves:create', 'Créer un élève', 'eleves'),
('eleves:edit', 'Modifier un élève', 'eleves'),
('eleves:delete', 'Supprimer un élève', 'eleves'),
('eleves:export', 'Exporter les élèves', 'eleves'),
('eleves:import', 'Importer des élèves', 'eleves'),
('eleves:manage', 'Gérer les élèves', 'eleves'),

-- Permissions onglets sensibles
('eleves:medical:view', 'Voir dossier médical', 'eleves'),
('eleves:medical:edit', 'Modifier dossier médical', 'eleves'),
('eleves:financier:view', 'Voir historique financier', 'eleves'),
('eleves:financier:edit', 'Modifier historique financier', 'eleves'),
('eleves:disciplinaire:view', 'Voir sanctions disciplinaires', 'eleves'),
('eleves:disciplinaire:edit', 'Modifier sanctions disciplinaires', 'eleves'),
('eleves:documents-prives:view', 'Voir documents privés', 'eleves');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **ENSEIGNANT**: view, export (ses classes uniquement)
- **PARENT**: view, medical:view, financier:view (ses enfants)
- **ELEVE**: view (ses données uniquement)

---

### 2. Module: classes

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('classes:view', 'Voir les classes', 'classes'),
('classes:create', 'Créer une classe', 'classes'),
('classes:edit', 'Modifier une classe', 'classes'),
('classes:delete', 'Supprimer une classe', 'classes'),
('classes:export', 'Exporter les classes', 'classes'),
('classes:manage', 'Gérer les classes', 'classes'),

-- Onglets sensibles
('classes:finances:view', 'Voir finances classe', 'classes'),
('classes:statistiques-detaillees:view', 'Voir statistiques détaillées', 'classes');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **ENSEIGNANT**: view (ses classes)

---

### 3. Module: matieres

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('matieres:view', 'Voir les matières', 'matieres'),
('matieres:create', 'Créer une matière', 'matieres'),
('matieres:edit', 'Modifier une matière', 'matieres'),
('matieres:delete', 'Supprimer une matière', 'matieres'),
('matieres:export', 'Exporter les matières', 'matieres'),
('matieres:manage', 'Gérer les matières', 'matieres');
```

---

### 4. Module: notes

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('notes:view', 'Voir les notes', 'notes'),
('notes:create', 'Créer une note', 'notes'),
('notes:edit', 'Modifier une note', 'notes'),
('notes:delete', 'Supprimer une note', 'notes'),
('notes:export', 'Exporter les notes', 'notes'),
('notes:import', 'Importer des notes', 'notes'),
('notes:bulk:import', 'Import en masse de notes', 'notes'),
('notes:manage', 'Gérer les notes', 'notes');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **ENSEIGNANT**: view, create, edit, export (ses classes/matieres)
- **PARENT**: view (ses enfants)
- **ELEVE**: view (ses notes)

---

### 5. Module: bulletins

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('bulletins:view', 'Voir les bulletins', 'bulletins'),
('bulletins:generate', 'Générer les bulletins', 'bulletins'),
('bulletins:export', 'Exporter les bulletins', 'bulletins'),
('bulletins:manage', 'Gérer les bulletins', 'bulletins');
```

---

### 6. Module: finances

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('finances:view', 'Voir les finances', 'finances'),
('finances:create', 'Créer un paiement', 'finances'),
('finances:edit', 'Modifier un paiement', 'finances'),
('finances:delete', 'Supprimer un paiement', 'finances'),
('finances:export', 'Exporter les finances', 'finances'),
('finances:import', 'Importer des paiements', 'finances'),
('finances:manage', 'Gérer les finances', 'finances'),
('finances:impayes:view', 'Voir les impayés', 'finances'),
('finances:stats:view', 'Voir statistiques financières', 'finances');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **PARENT**: view, impayes:view (ses paiements)
- **ELEVE**: view (ses paiements)

---

### 7. Module: personnel

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('personnel:view', 'Voir le personnel', 'personnel'),
('personnel:create', 'Créer un membre du personnel', 'personnel'),
('personnel:edit', 'Modifier un membre du personnel', 'personnel'),
('personnel:delete', 'Supprimer un membre du personnel', 'personnel'),
('personnel:export', 'Exporter le personnel', 'personnel'),
('personnel:manage', 'Gérer le personnel', 'personnel'),

-- Onglets sensibles
('personnel:medical:view', 'Voir dossier médical', 'personnel'),
('personnel:financier:view', 'Voir données financières', 'personnel'),
('personnel:sanctions:view', 'Voir sanctions', 'personnel');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **CHEF_ETABLISSEMENT**: view, export

---

### 8. Module: dashboard

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('dashboard:view', 'Voir le dashboard', 'dashboard'),
('dashboard:customize', 'Personnaliser le dashboard', 'dashboard'),

-- Widgets
('dashboard:widget:notes:view', 'Voir widget notes', 'dashboard'),
('dashboard:widget:bulletins:view', 'Voir widget bulletins', 'dashboard'),
('dashboard:widget:absences:view', 'Voir widget absences', 'dashboard'),
('dashboard:widget:discipline:view', 'Voir widget discipline', 'dashboard'),
('dashboard:widget:paiements:view', 'Voir widget paiements', 'dashboard'),
('dashboard:widget:impayes:view', 'Voir widget impayés', 'dashboard'),
('dashboard:widget:personnel:view', 'Voir widget personnel', 'dashboard'),
('dashboard:widget:conges:view', 'Voir widget congés', 'dashboard'),
('dashboard:widget:cantine:view', 'Voir widget cantine', 'dashboard'),
('dashboard:widget:transport:view', 'Voir widget transport', 'dashboard'),
('dashboard:widget:messagerie:view', 'Voir widget messagerie', 'dashboard'),
('dashboard:widget:annonces:view', 'Voir widget annonces', 'dashboard');
```

---

### 9. Module: admin

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('admin:permissions:view', 'Voir la matrice des permissions', 'admin'),
('admin:permissions:edit', 'Modifier les permissions', 'admin'),
('admin:roles:manage', 'Gérer les rôles', 'admin'),
('utilisateurs:stats:view', 'Voir statistiques utilisateurs', 'admin'),
('config:view', 'Voir configuration', 'admin'),
('audit:view', 'Voir journal d''audit', 'admin');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: view uniquement

---

### 10. Module: vie-scolaire

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('absences:view', 'Voir les absences', 'vie-scolaire'),
('absences:create', 'Créer une absence', 'vie-scolaire'),
('absences:manage', 'Gérer les absences', 'vie-scolaire'),

('discipline:view', 'Voir les sanctions', 'vie-scolaire'),
('discipline:create', 'Créer une sanction', 'vie-scolaire'),
('discipline:manage', 'Gérer les sanctions', 'vie-scolaire'),

('sante:view', 'Voir données de santé', 'vie-scolaire'),
('sante:manage', 'Gérer données de santé', 'vie-scolaire');
```

---

### 11. Module: rh

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('conges:view', 'Voir les congés', 'rh'),
('conges:manage', 'Gérer les congés', 'rh'),

('pointages:view', 'Voir les pointages', 'rh'),
('pointages:manage', 'Gérer les pointages', 'rh'),

('evaluations:view', 'Voir les évaluations', 'rh'),
('evaluations:manage', 'Gérer les évaluations', 'rh');
```

**Rôles recommandés** :
- **SUPER_ADMIN**: TOUTES
- **ADMIN**: TOUTES
- **CHEF_ETABLISSEMENT**: TOUTES

---

### 12. Module: logistique

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('cantine:view', 'Voir cantine', 'logistique'),
('cantine:manage', 'Gérer cantine', 'logistique'),

('transport:view', 'Voir transport', 'logistique'),
('transport:manage', 'Gérer transport', 'logistique');
```

---

### 13. Module: communication

```sql
INSERT INTO permissions (code, libelle, module) VALUES
('messagerie:view', 'Voir messagerie', 'communication'),
('messagerie:send', 'Envoyer un message', 'communication'),
('messagerie:manage', 'Gérer messagerie', 'communication'),

('annonces:view', 'Voir annonces', 'communication'),
('annonces:create', 'Créer une annonce', 'communication'),
('annonces:manage', 'Gérer annonces', 'communication'),

('sondages:view', 'Voir sondages', 'communication'),
('sondages:vote', 'Voter à un sondage', 'communication'),
('sondages:create', 'Créer un sondage', 'communication'),
('sondages:manage', 'Gérer sondages', 'communication');
```

---

## 🔄 ASSOCIATION PERMISSIONS → RÔLES

### SUPER_ADMIN

```sql
-- SUPER_ADMIN a TOUTES les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN';
```

### ADMIN

```sql
-- ADMIN a presque toutes les permissions (sauf admin:roles:manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
AND p.code NOT IN ('admin:roles:manage');
```

### ENSEIGNANT

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ENSEIGNANT'
AND p.code IN (
    'eleves:view', 'eleves:export',
    'notes:view', 'notes:create', 'notes:edit', 'notes:export',
    'bulletins:view', 'bulletins:export',
    'classes:view',
    'matieres:view',
    'absences:view', 'absences:create',
    'messagerie:view', 'messagerie:send',
    'annonces:view',
    'sondages:view', 'sondages:vote',
    'dashboard:view'
);
```

### PARENT

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'PARENT'
AND p.code IN (
    'eleves:view', 'eleves:medical:view', 'eleves:financier:view',
    'notes:view',
    'bulletins:view',
    'finances:view', 'finances:impayes:view',
    'absences:view',
    'messagerie:view', 'messagerie:send',
    'annonces:view',
    'sondages:view', 'sondages:vote',
    'dashboard:view'
);
```

### ELEVE

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ELEVE'
AND p.code IN (
    'notes:view',
    'bulletins:view',
    'finances:view',
    'absences:view',
    'messagerie:view', 'messagerie:send',
    'annonces:view',
    'sondages:view', 'sondages:vote',
    'dashboard:view'
);
```

---

## 📝 SCRIPT SQL COMPLET

### Créer le fichier

```bash
# Créer le fichier SQL
touch backend/database/migrations/050-permissions-v2.sql
```

### Contenu du fichier

Copier toutes les requêtes SQL ci-dessus dans le fichier dans l'ordre :
1. CREATE permissions (tous modules)
2. INSERT role_permissions (par rôle)

### Exécuter la migration

```bash
# En développement
npm run migrate:latest

# Ou directement
psql -U postgres -d elisaschool -f backend/database/migrations/050-permissions-v2.sql
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. Vérifier les permissions créées

```sql
SELECT code, libelle, module 
FROM permissions 
ORDER BY module, code;
```

### 2. Vérifier les associations

```sql
SELECT r.code as role, COUNT(rp.permission_id) as permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.code
ORDER BY permissions_count DESC;
```

### 3. Tester avec le frontend

```bash
# 1. Lancer le backend
npm run dev:backend

# 2. Lancer le frontend
npm run dev:frontend

# 3. Se connecter avec chaque rôle et vérifier :
#    - Sidebar filtré
#    - Routes accessibles/bloquées
#    - Onglets sensibles visibles/masqués
#    - Widgets dashboard visibles/masqués
```

### 4. Utiliser Debug Panel

- Se connecter en développement
- Le Debug Panel affiche les permissions chargées
- Vérifier que le count correspond au rôle

---

## 🐛 DÉPANNAGE

### Problème: Permissions non chargées

**Solution** :
1. Vérifier que les permissions sont en base
2. Redémarrer le backend (cache Redis)
3. Se reconnecter au frontend

### Problème: Route accessible sans permission

**Solution** :
1. Vérifier que le guard est présent dans `beforeLoad`
2. Vérifier le nom du module dans le guard
3. Vérifier que la permission est associée au rôle

### Problème: Widget non visible

**Solution** :
1. Vérifier la permission requise dans `use-dashboard-widgets.ts`
2. Vérifier que l'utilisateur a cette permission
3. Utiliser Debug Panel pour voir les permissions chargées

---

## 📚 RESSOURCES

- **Guide de test**: [GUIDE-TEST-MULTI-ROLES.md](./GUIDE-TEST-MULTI-ROLES.md)
- **Script vérification**: `scripts/check-permissions.js`
- **Script déploiement**: `scripts/deploy-permissions.sh`
- **Hooks**: `frontend/src/hooks/use-dashboard-widgets.ts`
- **Guards**: `frontend/src/app/permission-guards.ts`

---

**Document créé le**: 2026-06-11  
**Version**: 1.0.0  
**Mainteneur**: franck arlos chendjou
