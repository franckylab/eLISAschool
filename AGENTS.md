# eLISAschool — Session Context

## Objective
Phase 8s : Refactor permissions (simplification 4→3 états). Connecter vraies données EDT/Affectations.

## Constraints & Preferences
- Système multi-tenant avec etablissementId sur toutes les entités
- TypeORM + Express (backend), TanStack Router + React Query + Zustand (frontend)
- Pagination via paginateWithQueryBuilder, réponses API standardisées { success, data }
- Pattern module: entities/, dto/, services/, controllers/, index.ts
- Zod validation pour tous les DTOs, endpoints REST RESTful
- Frontend: barrel export via index.ts dans chaque feature, hooks React Query par feature

## Modèle Mental — Typage du Personnel
- **`TypePersonnel`** = pivot central unique pour déterminer le type d'un membre (ENSEIGNANT, DIRECTION, ADMINISTRATIF, etc.)
- **`Poste.typePersonnelId`** = FK vers TypePersonnel (remplace l'ancien enum `TypePoste`) — synchronisé depuis TypePersonnel
- **`Role` RBAC** = permissions (suggéré par défaut via `TypePersonnel.roleIdParDefaut`)
- **`Fonction`** = rôle fonctionnel hiérarchique libre (ex: "Professeur Principal"), indépendant du type
- **Données personnelles** = toujours via `ProfilUtilisateur` (pas de duplication sur `MembrePersonnel`)
- **Une seule page frontend** : `/personnel/*` avec onglets conditionnels selon `TypePersonnel.code` ; `/enseignants/*` redirige vers `/personnel/*`

## Key Decisions
### CustomModal — Responsive Viewport Adaptation
- **Ne JAMAIS hardcoder `size` fixe** — `CustomModal` downscale automatiquement via `effectiveSize` : `3xl`→`2xl`→`xl`→`lg`→`md`→`sm` selon `viewportWidth`. Utiliser `size` pour la taille *souhaitée*, le viewport décide de la taille *réelle*.
- **Trois couches de sécurité** contre le débordement :
  1. **`useModalWindow` `initialWidthAdapted`** (`vw < initialWidth`) → taille adaptée dès le premier render
  2. **`useModalWindow` `handleResize`** écoute `window.resize` → réduit taille + reclamp position en direct
  3. **`maxWidth`/`maxHeight`** dans le `style` inline (`calc(100vw - margin*2)`) → filet de sécurité CSS
- **`change-role-modal.tsx`** = exemple à suivre : plus de viewport tracking manuel, simple `size="lg"` délégué à `CustomModal`
- **Toute nouvelle modale** doit utiliser `CustomModal` (pas de modal ad-hoc) pour bénéficier automatiquement du responsive système
- **Ne PAS ajouter de `useEffect`/`useState` de viewport** dans les modales consommatrices — c'est géré centralement dans `CustomModal` et `useModalWindow`
- **`placeholderData: (prev) => prev`** requis sur TOUS les hooks `useQuery` avec `queryKey` dynamique (filtres/pagination) — empêche `isLoading` de passer à `true` lors des changements de filtre, évitant le démontage du DataTable
- **Guards `isLoading`** doivent être conditionnels : `if (isLoading && !data)` au lieu de `if (isLoading)` — ne s'affiche qu'au premier chargement, pas lors des refetches
- **Callback serveur différé** : `onSearchChange` n'est plus appelé immédiatement mais via `useEffect` sur `rechercheDebounce` (300ms) — réduit les appels API pendant la saisie
- **Touche Escape** : efface la recherche — géré dans `SearchInput.tsx` et DataTable
- **`SearchInput`** composant réutilisable (`@/components/ui/SearchInput`) avec debounce, clear button, Escape, icône Search, responsive — utilisé par DataTable, disponible pour tous les filtres
- **Ne pas hardcoder `isLoading={false}`** sur DataTable — toujours passer `isLoading={isLoading}` pour permettre l'affichage du spinner interne

### UserPermissionsTab — Permissions utilisateur avec source filter
- **`UserPermissionsTab`** remplace `TabRolesPermissions` : arbre par module (expand/collapse), badges source (Rôle/Active/Refusée/Neutre), 3-state checkbox en modal
- **Source filter** : 5 pills (`Toutes | Autorisée | Refusée | Rôle | Neutre`) avec comptes, combinable avec la recherche textuelle et le filtre module
- **Backend `getEffectivePermissionsDetail`** retourne TOUTES les permissions actives avec `source: 'role' | 'granted' | 'denied' | 'none'` (plus de filtre excluant les neutres)
- **Batch endpoint** `PUT /api/rbac/users/:userId/permissions/batch` — transaction unique pour upsert/delete bulk
- **Clear filters** : bouton qui réinitialise recherche + module + source, visible seulement quand un filtre est actif
- **Empty state contextuel** : message différent selon qu'il y a des filtres actifs (`aucunResultat` + suggestion + clear) ou non (`aucunePermissionTrouvee`)
- **`StatCard`** utilise la prop `color` (backward-compat mappée vers `CardTone`) — ne PAS utiliser `tone` avec les noms de couleurs simples
- **`PermissionCheckbox`** 3 états (GRANTED/DENIED/null) avec cycle au clic : `null → GRANTED → DENIED → null`
- **Nomenclature source** : `granted` → affiché "Ajoutée" (FR) / "Added" (EN) (remplace "Active"/"Granted"). Icône `PlusCircle` au lieu de `CheckCircle`. Concept : permissions explicitement ajoutées au-delà du rôle, pas "directes"
- **Row tinting** : chaque ligne de permission a un fond teinté selon sa source :
  - `granted`/`GRANTED` → bleu doux `bg-blue-50/40` (FR) / `Added` (EN) — mise en évidence des surcharges positives
  - `denied`/`DENIED` → rouge doux `bg-red-50/40` — mise en évidence des refus
  - `role`/`none` → fond neutre (par défaut)
  - Ce tinting s'applique aussi dans la modale d'édition, basé sur `editState` courant
- **Icônes source** : `PlusCircle` pour granted (ajoutée), `Ban` pour denied (bloquée), `Lock` pour rôle, cercle en pointillés pour neutre
- **Reset to role** : bouton `Réinitialiser aux permissions du rôle` dans le pied du modal, visible quand `editState.size > 0`. Confirmation inline (remplace le texte de statut + boutons) avec comptes granted/denied. `handleResetToRole` vide la map `editState` → toutes les permissions directes sont marquées pour suppression au prochain save
- **Permissions groups collapsed by default** : `openModal` initialise `expandedModules = new Set()` (plus de `new Set(modules)`), et `expandedModules` commence vide sur la page. L'auto-expand sur recherche/filtre reste actif via `isExpanded = expandedModules.has(...) || !!search || ...`
- **Expand/Collapse All** : bouton dans l'en-tête du bloc filtres (vue principale) + dans le header sticky de la modale. Logique : si tous les modules filtrés sont expand → collapse tous, sinon expand tous. `allModulesExpanded` computed avec `filteredModules.every(...)`, `toggleAllModules` bascule tout le set. Même pattern avec `allModalModulesExpanded` / `toggleAllModalModules` pour la modale. Clés i18n : `toutDeplier`, `toutReplier`
- **Filter bar collapsible** : l'en-tête du bloc filtres est un toggle `showFilters` qui affiche/masque les pills source + module + clear. Icône ChevronDown pivotée `-rotate-90` quand replié. Badge point dominant quand `hasActiveFilters` est vrai
- **Modal sticky header** : le contenu modal est `flex flex-col max-h-[65vh]` avec :
  1. Header `flex-shrink-0` (search + module filter pills + expand/collapse all) — `border-b` le sépare du tree, pas de scroll
  2. Tree `flex-1 overflow-y-auto` — scrollable indépendant, le header ne bouge pas pendant le défilement

### Typage du Personnel
- `TypePoste` enum supprimé → remplacé par FK `Poste.typePersonnelId` → `TypePersonnel`
- Page enseignant fusionnée dans page personnel (route `/enseignants/*` → redirect vers `/personnel/*`)
- `Enseignant` type frontend = alias vide de `MembrePersonnel` (specialite/qualification déplacés dans la classe de base)
- Retour hook = `response.data` (pattern projet)
- Deux api-clients coexistent : `@/lib/api-client` (54 features) et `@/lib/api` (18 features) — ce dernier est un ré-export fonctionnellement équivalent mais avec des types génériques différents
- Dark mode exigé sur toutes les nouvelles pages/composants (classes `dark:`)
- i18n obligatoire pour tout texte visible (aucune chaîne hardcodée)

## Progress
### Phase 4 — Refactor fusion Personnel/Enseignant + types ✓
- **Entités** — `TypePersonnel` enrichi (roleIdParDefaut, actif, description, modeRemunerationDefaut) ; `MembrePersonnel` nettoyé (colonnes dupliquées supprimées) ; `Poste.typePersonnelId` FK ajoutée
- **DTOs** — `createPersonnelSchema` allégé (fins nom/prenom/email/telephone/adresse/dateNaissance/sexe) ; `createPosteSchema` passe de `type` enum à `typePersonnelId` UUID ; `createTypePersonnelSchema` enrichi
- **Services** — `postes.service.ts` : `modeParType` remplacé par lookup TypePersonnel.modeRemunerationDefaut ; `contrat.service.ts` : validation via `poste.typePersonnel.code` ; `personnel.service.ts` : recherche textuelle sur ProfilUtilisateur/Utilisateur ; `generation.service.ts` + `historique-clonage.service.ts` : typePersonnelId
- **Migrations (3)** — A: `1790000000000-EnrichTypePersonnel.ts` (colonnes + 8 entrées par défaut) ; B: `1791000000000-CleanMembrePersonnelDuplicates.ts` (backfill ProfilUtilisateur + DROP colonnes) ; C: `1792000000000-PosteTypeToTypePersonnel.ts` (add typePersonnelId + backfill + DROP type enum column)
- **Frontend types** — `MembrePersonnel` nettoyé ; `Enseignant` = extension vide ; `Poste.type` → `typePersonnelId` ; `TYPES_POSTE_OPTIONS` supprimé
- **Forms** — `personnel-form-modal.tsx` et `enseignant-form-modal.tsx` : champs personnels retirés
- **Pages détail/liste** — fallback `membre.xxx ?? membre.utilisateur?.profil?.xxx` → `profil.xxx` uniquement ; `sexe` → `genre` ; `departement` conservé
- **Routes** — `/enseignants/*` redirige vers `/personnel/*` ; sidebar "Enseignants" retiré
- **Contrat wizard** — `isPosteCompatible` simplifié (validation backend uniquement)
- **Pages détail** — `personnel-detail-page.tsx` : onglets pédagogiques enseignant intégrés (Matières & Classes, EDT, Évaluations, Absences, Parcours) affichés conditionnellement selon `TypePersonnel.code === 'ENSEIGNANT'` ; composants réutilisés depuis `@/features/enseignants/components/enseignant-detail/`

### Phase 2 — Contrat-centric refactor ✓
- Migration contrat-centric, i18n wizard, read-only onglets, ContratPersonnel type enrichi

### Phase 1 — Paie & HeureCours ✓
- Refactor fusion paie, simulation paie, frontend paie 7 features, PDF bulletin, HeureCours, bug fixes

### Phase 5 — Refactor sécurité utilisateur (modal↔inline) ✓
- **Analyse** : `SecuriteModal` (via bouton header "Sécurité & Rôle") et `OngletParametres` (panel inline "Sécurité") géraient les mêmes champs (password, 2FA, statut) avec des UX différentes — le panel était décoratif (boutons sans handlers)
- **Backend** :
  - `audit-utilisateurs.ts` helper réutilisable (`auditUtilisateur`) avec méthodes `profilModifie`, `securiteModifiee`, `motDePasseForce`, `sessionsRevokees`, `statutModifie` — pattern identique à `audit-helpers.ts`
  - `changeStatut()` accepte `req` optionnel + audit log (USER_SUSPEND / USER_ACTIVATE / USER_UPDATE selon transition)
  - `forcePasswordReset(id, req)` → révoque sessions `tokenService.revokeAllUserTokens()` + audit `PASSWORD_RESET`
  - `revokeSessions(id, req)` → `revokeAllUserTokens()` + audit `USER_UPDATE`
  - 2 nouvelles routes : `POST /:id/force-password-reset`, `POST /:id/revoke-sessions` (perm `utilisateurs:security:update`)
- **Frontend** :
  - `SecuriteModal` → `RoleEtStatutModal` (role + statut + langue uniquement ; password/2FA retirés)
  - Bouton header renommé "Rôle & Statut"
  - `use-utilisateurs.ts` : 4 hooks dédiés — `useForcePasswordReset`, `useToggle2FA` (optimistic update), `useToggleSuspension` (optimistic update + confirmation), `useRevokeSessions`
  - `OngletParametres` : 4 `ParametreItem` câblés (Réinitialiser mot de passe, 2FA toggle via `ElisaToggle`, Suspendre/Réactiver avec `useConfirmation`, Déconnecter sessions), état loading/disabled géré, permissions checkées
  - `supprimer.mutateAsync` corrigé (passait 2 args au lieu d'un objet)
- **Audit** : toutes les actions (password reset, suspension/réactivation, révocation sessions, changement statut) sont tracées dans `audit_logs` avec module='utilisateurs', severity appropriée (WARNING/CRITICAL)

### Phase 6 — TypePersonnel CRUD complet + UI nomenclature + cache + couleurs/icônes ✓
- **Backend — Entité** — `TypePersonnel.estSysteme` colonne ajoutée pour protéger les types par défaut
- **Backend — Constantes** — `backend/src/shared/constants/personnel.constants.ts` : `TYPE_PERSONNEL_CODES` pour éliminer les strings magiques
- **Backend — Cache** — `getTypes()` implémente un cache in-memory (TTL 5 min) avec invalidation sur create/update/delete
- **Backend — CRUD complet** — nouveau endpoints : `GET /types/:id`, `PATCH /types/:id`, `DELETE /types/:id` ; service `findTypeById`, `updateType`, `deleteType` avec vérification d'intégrité référentielle (membres + postes) + protection `estSysteme`
- **Backend — DTO** — `updateTypePersonnelSchema` (partial + actif/estSysteme)
- **Backend — Postes** — `postes.service.ts` : `findAll` et `findById` chargent désormais `typePersonnel` relation pour afficher le label
- **Migration** — `1793000000000-AddEstSystemeToTypePersonnel.ts` : ajoute `estSysteme` + marque les 8 types par défaut comme système
- **Frontend — Types** — interface `TypePersonnel` (avec `estSysteme`) ajoutée dans `personnel.types.ts` ; `TypePersonnelLite` ajoutée dans `poste.types.ts` ; relation `typePersonnel` ajoutée à `Poste`
- **Frontend — Hook** — `use-types-personnel.ts` : `useTypesPersonnel` (staleTime 5min), `useTypePersonnelOptions`, `useCreerTypePersonnel`, `useModifierTypePersonnel`, `useSupprimerTypePersonnel`
- **Frontend — Constantes** — `constants/type-personnel-colors.ts` : `TYPE_PERSONNEL_COLORS`, `TYPE_PERSONNEL_BADGE_VARIANTS`, `TYPE_PERSONNEL_ICONS` avec mapping par code + helpers `getTypeColor`, `getTypeBadgeVariant`, `getTypeIcon`
- **Frontend — Nomenclatures** — onglet "Types personnel" ajouté dans `nomenclatures-page.tsx` avec `TabTypesPersonnel`, `TypePersonnelAddForm` (pattern identique aux autres tabs : `InlineEdit`, `BadgeSysteme`, `ConfirmationModal`, `!tp.estSysteme` pour protéger les types système)
- **Frontend — Postes** — `postes-page.tsx` : colonne `typePersonnel` affiche `p.typePersonnel?.nom` au lieu de l'UUID brut ; `poste-detail-page.tsx` : icône + couleur contextuelle du type
- **Frontend — Personnel form** — `personnel-form-modal.tsx` : sélecteur `typePersonnelId` ajouté (via `useTypePersonnelOptions`)
- **Frontend — Détail personnel** — badge coloré avec icône contextuelle affiché à côté du nom/statut
- **Frontend — Filtre** — filtre par type de personnel ajouté dans `personnel-page.tsx` (select avec icône Users)
- **i18n** — clés `typePersonnel`, `typesPersonnel`, `nouveauTypePersonnel`, etc. ajoutées dans `organisation.json` (fr + en)

### Phase 8 — PageHeader gradient + glass-morphism actions ✓
- **`gradientActionStyle()` récursif** : traverse les conteneurs (div) pour appliquer le glass-morphism directement sur chaque bouton, pas sur le conteneur
- **Conteneur actions** : glass panel `bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2` autour de toutes les actions
- Bouton normal → `!bg-white/20 hover:!bg-white/35 !text-white !border-white/25 active:!scale-[0.97]` (contraste renforcé)
- Bouton danger → `!bg-red-500/55 hover:!bg-red-500/70 !text-white !border-red-300/25` (alerte dosée sans clash)
- `!backdrop-blur-sm` + `!shadow-sm` + `transition-all duration-150` pour l'effet frost profond
- `active:!scale-[0.97]` feedback tactile au clic
- Conteneur actions flex-wrap responsive, isolé du layout titre
- Les tons `dominant`/`accent` utilisent les alias de thème (`--color-dominante`/`--color-accent`) via inline `style` (contourne Tailwind v4 qui ne génère pas `from-*` pour les vars `@layer base`)
- **Responsivité extrême** : tous les sizes utilisent `clamp()`
  - Padding conteneur : `p-[clamp(1rem,4vw,2rem)]` (de `p-8` fixe)
  - Icône : `h-[clamp(1.75rem,6vw,2.5rem)]` (de `h-10` fixe)
  - Titre : `text-[var(--text-3xl)]` via clamp CSS variable (de `text-3xl` fixe)
  - Sous-titre : `text-[var(--text-sm)]` via clamp CSS variable
  - Gaps : `gap-[clamp(0.75rem,3vw,1.25rem)]` partout (de `gap-5`/`gap-4` fixes)
  - Bouton retour : `p-[clamp(0.375rem,1.5vw,0.5rem)]` (de `p-2`/`p-1.5` fixes)
  - Actions : `w-full sm:w-auto` pour stack vertical sur mobile
  - SVG décoratif : `w-[clamp(12rem,40vw,16rem)]` (de `w-64` fixe)

### Phase 7 — Liaison Utilisateur↔MembrePersonnel + dark mode + i18n ✓
- **Backend — Relation inverse** : `Utilisateur.membrePersonnel` ajouté (@OneToOne lazy 'MembrePersonnel') ; `MembrePersonnel.utilisateurId` passe `unique: true` + `onDelete: 'SET NULL'` ; migration `1795000000000-AddUniqueUtilisateurIdToMembrePersonnel` avec nettoyage doublons
- **Backend — Endpoints** : 3 nouvelles routes — `POST /:id/link-user`, `POST /:id/unlink-user`, `GET /stats/sans-compte` ; service `linkUser`, `unlinkUser`, `getPersonnelSansCompte` avec audit logging
- **Backend — Utilisateurs** : `findOne()` charge `membrePersonnel` + `typePersonnel` ; `formatUtilisateurResponse` inclut `membrePersonnel` ; `removeCascade` ne DELETE plus les membres_personnel (SET NULL)
- **Backend — DTOs** : `linkUtilisateurSchema` (Zod) dans personnel.dto.ts ; `membrePersonnel?` dans `UtilisateurResponseDto`
- **Backend — Modules index** : `export * from './postes'` ajouté (manquant)
- **Frontend — Types** : `Utilisateur.membrePersonnel?` ajouté dans `utilisateur.types.ts`
- **Frontend — Hooks** : `useLinkPersonnelUtilisateur`, `useUnlinkPersonnelUtilisateur`, `usePersonnelSansCompte` dans `use-personnel.ts`
- **Frontend — Personnel form** : section "Compte utilisateur" avec sélecteur utilisateur (link/unlink) + i18n
- **Frontend — Tab infos utilisateur** : carte "Dossier Personnel" si `utilisateur.membrePersonnel` existe (matricule, type, statut, lien)
- **Frontend — Header personnel** : badge email cliquable → lien vers `/utilisateurs/$id`
- **Dark mode** : 373 `dark:` classes ajoutées sur personnel-detail-page, contrats-paie-page, contrat-wizard-modal, personnel-form-modal, tab-informations, utilisateur-detail-page
- **i18n** : `en/contrat.json` créé (90 clés) ; hardcoded strings remplacées dans personnel-form-modal (16 → clés `form.*` dans personnel.json) et contrat-wizard-modal (7 → clés dans contrat.json)
- **Loading/error states** : personnel-detail-page upgrade (LoadingState + `error!` guard)

### Phase 7c — Exposition complète ProfilUtilisateur + UI restructurée + bugs ✓
- **Décision (grill-me)** : Analyse d'impact → **pas de merge** ProfilUtilisateur↔Utilisateur (séparation gardée)
- **Backend DTO** : `updateProfilSchema` enrichi (`photo`, `pieceIdentite`, `numeroPieceIdentite`, `notes`) ; `UtilisateurResponseDto.profil` expose maintenant les 16 champs du profil
- **Backend service** : `formatUtilisateurResponse` retourne tous les champs (lieuNaissance, nationalite, telephoneSecondaire, adresse, ville, quartier, pieceIdentite, numeroPieceIdentite, notes)
- **Frontend types** : `Utilisateur.profil` complet (10 champs ajoutés) ; `UpdateProfilDto` complet ; `SexeUtilisateur` supprimé ; `etablissementId` supprimé du type
- **Frontend tab-informations** : restructuré en 5 cartes responsives (Identité / Contact / Système / Pièces & Notes / Dossier Personnel) — i18n complète via 20 nouvelles clés
- **Frontend info-profil-modal** : 5 sections (Identité / Contact / Photo / Documents / Langue) — bug fix `sexe→genre`
- **Frontend header** : avatar circulaire avec photo si disponible, initiales sinon (gradient dominant→purple)
- **i18n** : 20 nouvelles clés dans `fr/utilisateurs.json` et `en/utilisateurs.json`
- **Suppression ligne "Établissement ID"** dans tab-informations (champ backend supprimé v4.0)

### Phase 7d — Upload fichiers (photos + pièces identité) via multer + sharp WebP ✓
- **Grill-me upload** : 6 décisions alignées (stockage fichier + thumbnail, multer, sharp WebP, 5 endpoints REST dédiés, composant FileUpload réutilisable, séparation upload/métadonnées)
- **Backend — Entity** : `ProfilUtilisateur` — `photo`→`photoUrl`, `pieceIdentite`→`pieceRectoUrl`, nouvelles colonnes `photoThumbnail`, `pieceVersoUrl`, `typePieceIdentite` (enum CNI/PASSEPORT/PERMIS/AUTRE)
- **Backend — Migration** : `1797000000000-AddUploadColumnsToProfilUtilisateur` avec renommage + ajout colonnes
- **Backend — Image processor** : `traiterPhotoProfil` (500px main + 150px thumb WebP), `traiterPieceIdentite` (2000px max WebP), `validerMimeUpload`
- **Backend — Upload service** : `UploadService` (uploadPhoto, deletePhoto, uploadPieceRecto, uploadPieceVerso)
- **Backend — Upload controller** : 5 endpoints POST `/:id/upload/{photo,piece-recto,piece-verso}`, DELETE `/:id/upload/photo` — multer memoryStorage 5MB max
- **Backend — DTOs** : `updateProfilSchema` mis à jour (photo→photoUrl, pieceIdentite→pieceRectoUrl, +photoThumbnail/pieceVersoUrl/typePieceIdentite) ; `UtilisateurResponseDto.profil` idem
- **Backend — Routes** : upload controller monté sur `/api/utilisateurs` (sans filterByEtablissement pour préserver body multer)
- **Frontend — Types** : `Utilisateur.profil` mis à jour (photoUrl, photoThumbnail, pieceRectoUrl, pieceVersoUrl, typePieceIdentite) ; `UpdateProfilDto` idem
- **Frontend — Hooks** : 4 hooks upload — `useUploadPhoto`, `useDeletePhoto`, `useUploadPieceRecto`, `useUploadPieceVerso`
- **Frontend — FileUpload component** : drag & drop, preview, remove, loading state, accept filter, max size
- **Frontend — info-profil-modal** : sections Photo (FileUpload) + Documents (FileUpload recto/verso + select typePieceIdentite) ; retiré champ URL textuel
- **Frontend — tab-informations** : affichage photoThumbnail (fallback photoUrl) ; affichage pieceRectoUrl/pieceVersoUrl avec liens cliquables
- **Frontend — Header** : `photo`→`photoThumbnail ?? photoUrl`

### Phase 7b — Nettoyage champs legacy sur les types et composants frontend ✓
- **Types corrigés** — `utilisateur.types.ts` : supprimé `actif`, `nbConnexions`, `nomComplet`, `motDePasseExpire` ; corrigé forme de `profil` (uniquement `nom`, `prenom`, `telephone?`, `genre?`, `dateNaissance?`, `photo?`) ; `personnel.types.ts` : supprimé `specialite`, `qualification`, `poste`, `dateEntree`, `dateSortie`, `etablissementOrigine`, `typeContrat` de `MembrePersonnel` ; `Enseignant` aligné
- **Fonctions de mapping** — `fromFormToCreateDto` utilise `specialitePrincipale`/`diplomes` ; `useModifierPersonnel` simplifié (plus de mapping legacy) ; `buildFormData` uniformisé vers les nouveaux noms
- **Composants fixes (13 fichiers)** — `personnel-detail-page.tsx`, `personnel-form-modal.tsx`, `personnel-page.tsx`, `personnel-search-field.tsx`, `enseignant-form-modal.tsx`, `enseignants-page.tsx`, `hero-header.tsx`, `onglet-infos.tsx`, `tab-activite.tsx` — retiré toutes les références à `specialite`, `qualification`, `poste` (string), `dateEntree`, `dateSortie`, `typeContrat`, `educationNiveau` sur MembrePersonnel/Enseignant
- **Single Source of Truth** — `ProfilUtilisateur` = données perso (nom, prénom, téléphone, dateNaissance, genre) ; `MembrePersonnel` = données pro (matricule, diplomes, specialitePrincipale, posteExact, dateEmbauche, specialites[], departement, service) ; `Utilisateur` = identité système (email, role, statut, 2FA, langue)
- **Backward compat** — ContratPersonnel et Poste entity inchangés (`typeContrat`, `poste` relation gardés)

### Phase 8r — Page Détail Rôle /admin/roles/$id + Permissions Tab ✓
- **Backend** — 2 nouveaux endpoints : `GET /roles/:id/permissions/detail` (permissions avec source 'role'|'none'), `PUT /roles/:id/permissions/batch` (delta add/remove). Fix `assignPermissionsToRoleSchema` (`min(0)` au lieu de `min(1)`).
- **Route restructurée** : `_auth.admin.roles.tsx` devient layout avec `<Outlet/>` + `Breadcrumbs` ; `_auth.admin.roles.index.tsx` = liste ; `_auth.admin.roles.$id.tsx` = détail.
- **`RoleDetailPage`** : PageHeader gradient (Shield icon, badges système/personnalisé, stats permissions/utilisateurs), TabsBar 2 onglets (Permissions + Utilisateurs). Bouton "Modifier le rôle" visible si `!estSysteme && hasPermission('roles:edit')`.
- **`RolePermissionsTab`** : adapté du `UserPermissionsTab` — 3 StatCards, searchBar, filter bars collapsible (source + module), ModuleTree read-only, bouton "Modifier les permissions" → ouvre `CustomModal` avec ModuleEditRow. **Cycle du PermissionCheckbox : `null → GRANTED → null`** (skip DENIED pour les rôles). Sauvegarde via `PUT /roles/:id/permissions/batch` avec addedIds/removedIds.
- **`RoleUsersTab`** : 4 StatCards (total/actifs/inactifs/suspendus), search, grille de cards utilisateurs cliquables → navigue vers `/utilisateurs/$id`.
- **Shared permission components** : `SourceIcon`, `FilterBars`, `ModuleTree`, `ModuleEditRow`, `PermissionFilterPanel` dans `permission-utils.tsx`. `PermissionFilterPanel` encapsule la barre de recherche + pills source + pills module dans un panneau collapsible unique — utilisé par les deux tabs. La recherche est à l'intérieur du panneau (masquée quand replié).
- **Hooks** : `useRolePermissionsDetail(roleId)`, `useBatchRolePermissions()` ajoutés.
- **Types** : `RolePermissionAvecStatut`, `BatchRolePermissionsDto` ajoutés.

## Phase 7e — Refactor Design System (Card, StatCard, KpiCard, StatPill, CardGrid) ✓
- **Grill-me décisions** : CSS variables et tons sémantiques (dominant/accent/success/danger/warning/info/muted/purple/orange) adoptés ; backward compat `StatCard.color` → `tone` ; eLISAschool-first naming
- **`globals.css`** : `@custom-variant dark (&:where([data-theme="dark"] *))` aligne `dark:` avec `data-theme` ; `--color-card`/`--color-card-foreground` ; toutes les couleurs enregistrées dans `@theme` pour modificateurs d'opacité (`/10`, `/20`)
- **`Card` compound** : Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter — fond quadrillé subtil + fade-in framer-motion
- **`StatCard`** : refactorisé avec `bg-{tone}-600/10`, icône décorative, hover lift, badge tendance (+/-%), backward compat `color`→`tone`, 9 tons
- **`KpiCard`** : compact CVA (`sm`/`md`), typographie `clamp()`, écart réel/prévu, fond gradient
- **`StatPill` / `StatPillScrollable`** : pilules bouton avec icône + valeur + sous-titre, scroll horizontal
- **`CardGrid`** : grilles responsives avec stagger animation (`staggerChildren: 0.08`), squelette chargement intégré, élimine `delay` manuels
- **`card-variants.ts`** : source unique pour tons, classes CSS, types partagés
- **`Skeleton.tsx`** : `StatsCardSkeleton` aligné avec classes CSS variables (`bg-card border-border`)
- **Fichiers migrés (29)** : tab-roles-permissions, tab-postes, tab-fonctions, organisation-page, analytics-page, hero-header (x2), +22 pages feature (absences, examens, evenements, documents, bibliotheque, parking, stage, courriers, atelier, laboratoire, discipline, conges, inventaire, archives, finances, securite, maintenance, pointages, evaluations, sante, rapports, tab-heure-cours, admin-permissions-matrix) — remplacement inline gradient cards → StatCard + CardGrid
- **Typecheck** : 0 nouvelle erreur sur les composants et fichiers migrés

### Phase 8rbac — Fix permission resolution + changeRole (RBAC v3 alignement) ✓
- **Bug 1 : permissions toujours 0** — `resolvePermissions` retournait un set vide quand `etablissementId` manquait (aucun fallback). Fixé en intégrant un fallback direct dans `permission-resolver.service.ts:124-140` : quand `etablissementId` est absent, chercher le premier `UtilisateurEtablissement` actif de l'utilisateur et utiliser son `etablissementId` + `role` pour résoudre les permissions.
- **Bug 2 : changeRole ne persistait pas** — `changeRole` mettait à jour `UtilisateurEtablissement.roleId` (correct) mais `formatUtilisateurResponse` retournait `utilisateur.role` (colonne enum legacy), pas le nouveau rôle. Trois corrections :
  - `formatUtilisateurResponse` ligne 879 : `role: roleEtablissement || utilisateur.role` → priorise le rôle UE
  - `findOne` lignes 283-294 : charge l'UE avec sa relation `role` et passe son code en `roleEtablissement` + l'utilise pour `computeEffectivePermissions`
  - `changeRole` lignes 566-575 : recharge l'UE après sauvegarde et passe le code rôle dans la réponse
- **Règle de résolution RBAC v3** : toujours résoudre le rôle via `UtilisateurEtablissement.roleId` (FK → `Role.code`) ; le champ legacy `Utilisateur.role` (enum) n'est mis à jour que si le code correspond à une valeur de l'enum (`Object.values(Role)`). Pour les rôles customs, seul l'UE est mis à jour.
- **Fichiers modifiés** : `permission-resolver.service.ts` (fallback UE), `utilisateurs.service.ts` (findOne + changeRole + formatUtilisateurResponse)

### Pending
- Connecter vraies données EDT/Affectations

### Phase 8l — Harmonisation 8 features (PageHeader + Card + InfoField + border-t) ✓
- **Matières** : `StatMini` custom → `StatCard` design system ; `border-b` séparateurs après CardTitle ; PageSkeleton/ErrorMessage ; useConfirmation → ConfirmDialog
- **Programmes** : motion.div custom → `StatCard` ; `border-b` séparateurs ; PageSkeleton/ErrorMessage ; useConfirmation → ConfirmDialog ; i18n colonnes DataTable
- **Contrats** (`contrats-paie-page.tsx`) : PageHeader gradient `FileSignature` ajouté ; 6 sous-tabs wrappés dans `Card/CardHeader/CardTitle/border-b/CardContent`
- **Élèves** : PageHeader gradient `Users` ; 5 cartes Informations → `Card/CardHeader/CardTitle/border-b/CardContent` avec `InfoField` ; tab Scolarité/Finances → CardSection ; page liste loading/error → PageSkeleton/ErrorMessage
- **Périodes** : PageHeader gradient `CalendarRange` ; arbre visuel conservé ; 4 stat cards → `StatCard` ; tab contenu dl/dt/dd → `Card/InfoField` + border-b ; PageSkeleton/ErrorMessage
- **EDT** : PageHeader gradient `Calendar` ; TabsBar + contenu natif conservé ; PageSkeleton/ErrorMessage
- **Responsables-élèves** : PageHeader gradient `Users` + `StatCard` + DataTable motion.div + useConfirmation ; **nouvelle page détail** 2 tabs (Informations + Élèves liés) avec Card/InfoField
- **Notes** : PageHeader gradient `ClipboardList` + filter bar + DataTable motion.div ; **nouvelle page détail** 2 tabs (Informations + Statistiques) avec Card/InfoField et StatCard distribution ; route layout refactor
- **Nouvelles routes** : `/_auth/notes/$id`, `/_auth/responsables-eleves/$id`
- **Locales** : clés ajoutées dans `notes.json`, `responsables-eleves.json`, `periodes.json`, `eleves.json`, `emplois.json` (fr + en)
- **0 nouvelle erreur typecheck**

## Références
| Fichier | Rôle |
|---------|------|
| `backend/src/modules/personnel/services/calcul-paie.service.ts` | Refactor + audit/workflow/detailParMatiere |
| `backend/src/modules/personnel/services/bulletin-paie.service.ts` | genererBulletin délègue à calculerBulletin |
| `backend/src/modules/personnel/controllers/calcul-paie.controller.ts` | simuler + mois/annee |
| `backend/src/modules/personnel/controllers/bulletin-paie.controller.ts` | Routes génération + éléments + PATCH statut + PDF |
| `backend/src/modules/bulletins/services/bulletins.service.ts` | Fix ReferenceError classe + getGenerationStatus |
| `backend/src/modules/dashboard/services/dashboard-data.service.ts` | Fix genre/actif/e.classe/actif-column |
| `backend/src/modules/dashboard/services/data-aggregator.service.ts` | Fix cacheKey userId, Promise.race |
| `backend/src/modules/dashboard/services/dashboard-cache.service.ts` | Cache LRU + Redis + invalidation contextuelle |
| `backend/src/database/migrations/1786000000000-ContratCentricSync.ts` | Migration contrat-centric (posteId/contratId sync) |
| `backend/src/modules/personnel/services/contrat.service.ts` | Contrat CRUD + syncAffectationPoste + syncFonctions |
| `frontend/src/features/personnel/hooks/use-paie.ts` | +useSimulerPaie, useRegenererBulletin, useGenererBulletinsMasse, useRapportPaie |
| `frontend/src/features/personnel/hooks/use-heure-cours.ts` | Hook HeureCours (resume, EDT, volume) |
| `frontend/src/features/personnel/components/contrats-paie-page.tsx` | Toutes features bulletins + stats paie + wizard intégré |
| `frontend/src/features/personnel/components/personnel-detail-page.tsx` | Onglets affectations + heures-cours + PDF + onglets pédagogiques enseignant (conditionnels) |
| `frontend/src/features/personnel/components/tab-heure-cours.tsx` | Vue HeureCours mensuel/hebdo |
| `frontend/src/features/personnel/components/contrat-wizard-modal.tsx` | Wizard 5 steps contrat (poste + fonctions secondaires) |
| `frontend/src/features/personnel/components/tab-fonctions.tsx` | Read-only (fonctions gérées par contrat) |
| `frontend/src/locales/fr/contrat.json` | i18n wizard contrat |
| `frontend/src/features/personnel/types/personnel.types.ts` | +SimulationResult, DetailMatiereSimulation, RapportPaieMensuel |
| `frontend/src/features/organisation/components/tab-postes.tsx` | Mini-dashboard postes (StatCards, preview) |
| `frontend/src/features/organisation/components/tab-fonctions.tsx` | Mini-dashboard fonctions (StatCards, preview, arbre) |
| `frontend/src/features/organisation/components/tab-hierarchie.tsx` | Onglet hiérarchie (unites organisationnelles) |
| `frontend/src/features/organisation/components/tab-configuration.tsx` | Onglet configuration organisation |
| `frontend/src/locales/{fr,en}/organisation.json` | i18n organisation (postes + fonctions) |
| `backend/src/shared/constants/personnel.constants.ts` | Constantes TYPE_PERSONNEL_CODES |
| `backend/src/database/migrations/1793000000000-AddEstSystemeToTypePersonnel.ts` | Migration estSysteme |
| `frontend/src/features/personnel/hooks/use-types-personnel.ts` | Hook CRUD TypePersonnel (useTypesPersonnel, useTypePersonnelOptions, mutations) |
| `frontend/src/features/personnel/constants/type-personnel-colors.ts` | Mapping couleurs/badges/icônes par code TypePersonnel |
| `frontend/src/features/personnel/types/personnel.types.ts` | TypePersonnel interface avec estSysteme |
| `frontend/src/features/postes/types/poste.types.ts` | TypePersonnelLite + relation typePersonnel sur Poste |
| `backend/src/modules/auth/entities/utilisateur.entity.ts` | Relation inverse membrePersonnel ajoutée |
| `backend/src/modules/personnel/controllers/personnel.controller.ts` | Routes link/unlink/stats sans-compte |
| `backend/src/modules/personnel/services/personnel.service.ts` | linkUser, unlinkUser, getPersonnelSansCompte |
| `backend/src/modules/personnel/dto/personnel.dto.ts` | linkUtilisateurSchema Zod |
| `backend/src/modules/utilisateurs/services/utilisateurs.service.ts` | findOne charge membrePersonnel, removeCascade sans DELETE manuel |
| `backend/src/modules/utilisateurs/dto/utilisateur.dto.ts` | membrePersonnel dans UtilisateurResponseDto |
| `backend/src/modules/index.ts` | export postes ajouté |
| `backend/src/database/migrations/1795000000000-AddUniqueUtilisateurIdToMembrePersonnel.ts` | UNIQUE + onDelete SET NULL |
| `frontend/src/features/utilisateurs/types/utilisateur.types.ts` | membrePersonnel ajouté |
| `frontend/src/features/personnel/hooks/use-personnel.ts` | 3 nouveaux hooks link/unlink/sans-compte |
| `frontend/src/features/personnel/components/personnel-form-modal.tsx` | sélecteur utilisateur + i18n |
| `frontend/src/features/utilisateurs/components/tab-informations.tsx` | carte dossier personnel + dark mode |
| `frontend/src/features/utilisateurs/components/utilisateur-detail-page.tsx` | dark mode |
| `frontend/src/locales/en/contrat.json` | créé (90 clés) |
| `frontend/src/locales/fr/personnel.json` + `en/personnel.json` | clés form.* ajoutées |
| `frontend/src/components/ui/Card.tsx` | Card compound component |
| `frontend/src/components/ui/StatCard.tsx` | StatCard avec tons sémantiques + tendance |
| `frontend/src/components/ui/KpiCard.tsx` | KPI card compact avec CVA |
| `frontend/src/components/ui/StatPill.tsx` | StatPill + StatPillScrollable |
| `frontend/src/components/ui/CardGrid.tsx` | Grille stagger + skeleton |
| `frontend/src/components/ui/card-variants.ts` | Source unique tons CSS |
| `frontend/src/hooks/useTabState.ts` | Hook tab URL-driven ou useState |
| `frontend/src/components/ui/Tabs.tsx` | TabsBar + TabsContent + TabAccent |
| `frontend/src/components/layout/PageHeader.tsx` | PageHeader gradient + simple |
| `frontend/src/components/ui/InfoField.tsx` | label+valeur design system |
| `frontend/src/components/ui/Skeleton.tsx` | PageSkeleton |
| `frontend/src/components/ui/ErrorMessage.tsx` | ErrorMessage avec retry |
| `frontend/src/components/modals/CustomModal.tsx` | Modal compound avec responsive size, drag, resize, minimiser |
| `frontend/src/components/modals/ConfirmDialog.tsx` | Quick confirm/alert modal wrapper (3 variants) |
| `frontend/src/hooks/use-modal-window.ts` | Window manager hook (position, size, resize listener + maxWidth CSS) |
| `frontend/src/features/utilisateurs/components/permission-utils.tsx` | Shared permission components (SourceIcon, FilterBars, ModuleTree, ModuleEditRow) |
| `frontend/src/features/utilisateurs/components/role-detail-page.tsx` | Page détail rôle (PageHeader gradient + TabsBar + 2 onglets) |
| `frontend/src/features/utilisateurs/components/role-permissions-tab.tsx` | Tab permissions rôle (read-only tree + edit modal, cycle null→GRANTED→null) |
| `frontend/src/features/utilisateurs/components/role-users-tab.tsx` | Tab utilisateurs rôle (stats + cards cliquables) |
| `frontend/src/features/utilisateurs/hooks/use-roles-permissions.ts` | + useRolePermissionsDetail, useBatchRolePermissions |
| `frontend/src/features/utilisateurs/types/utilisateur.types.ts` | + RolePermissionAvecStatut, BatchRolePermissionsDto |
| `backend/src/modules/rbac/services/roles.service.ts` | + getRolePermissionsDetail, batchAssignRolePermissions |
| `backend/src/modules/rbac/controllers/roles.controller.ts` | + GET /:id/permissions/detail, PUT /:id/permissions/batch |
| `backend/src/modules/rbac/dto/create-role.dto.ts` | Fix min(0), + batchRolePermissionsSchema |

### Phase 8s — Refactor permissions (simplification 4→3 états) ✓
- **Modèle simplifié** : fusion `role`+`granted` = `autorisee`. Les 4 sources API conservées en backend, mappées côté frontend via `getStatut()`.
- **`permission-utils.tsx`** : nouveau helper `getStatut()`, `sourceDansCategorie()`, `PermissionStatut` type. `SOURCES` passe de 5 à 4 pills (`toutes`/`autorisee`/`refusee`/`surchargees`). `getInitialState` mappe toutes les permissions (plus seulement les overrides).
- **ModuleTree** : checkbox statique (Check/Minus/vide) + icône discrète `SourceIcon` au lieu de `SourceBadge`. Fond teinté conservé.
- **ModuleEditRow** : toggle 2 états (`GRANTED↔DENIED` pour utilisateurs, `GRANTED↔null` pour rôles). Supporte `null` dans `editState`.
- **UserPermissionsTab** : 3 StatCards (Total/Autorisée avec tooltip rôle/surcharge/Refusée). `sourceCounts` 4 catégories. `togglePermission` 2-state. `handleSave` delta par comparaison `initialEditState`/`editState` + source originale.
- **RolePermissionsTab** : adapter au même modèle (3 StatCards, 4 sourceCounts, sourceDansCategorie). Cycle `GRANTED↔null` conservé.
- **Locales** : `filtreAutorisee`→"Autorisées" (FR)/"Authorized" (EN). Ajout `filtreSurchargees`, `statAutorisee`, `statAutoriseeTooltip`. Retiré `filtreNeutre`, `filtreRole`, `sourceRole`, `sourceGranted`.

### Phase 3 — Routes restructurées Organisation ✓
- **Postes/Fonctions sous Organisation** — routes déplacées de `/_auth/postes*` et `/_auth/fonctions*` vers `/_auth/organisation/{postes, fonctions}*`
- **Layouts avec breadcrumb** — `_auth.organisation.postes.tsx` et `_auth.organisation.fonctions.tsx` intègrent `Breadcrumbs` (avec prop `labelsMap` i18n) + bouton retour vers `/organisation`
- **Breadcrumb Context** — `BreadcrumbLabelProvider` dans `components/navigation/breadcrumb-context.tsx` permet aux pages détail de passer le nom de l'entité au breadcrumb du layout parent
- **Sidebar simplifié** — supprimé les entrées Postes, Fonctions, Nomenclatures. Seule "Mon organisation" reste
- **`Breadcrumbs.tsx`** — ajout prop `labelsMap` pour l'i18n des segments
- **TabPostes mini-dashboard** — `tab-postes.tsx` : 4 StatCards (total/occupés/vacants/taux), liste derniers postes avec capacité
- **TabFonctions mini-dashboard** — `tab-fonctions.tsx` : 4 StatCards (total/actives/inactives/profondeur max), preview fonctions, arbre condensé
- **i18n organisation** — clés fonctions (totalFonctions, fonctionsActives, fonctionsInactives, profondeurMax, fonctionsRecentes, arbreFonctions, voirToutesFonctions) + clés postes (totalPostes, postesActifs, tauxOccupation, derniersPostes, voirTousPostes)

## Route Tree (frontend)
```
/_auth/organisation/postes      — layout (breadcrumb + back)
/_auth/organisation/postes/     — PostesPage
/_auth/organisation/postes/$id  — PosteDetailPage
/_auth/organisation/fonctions   — layout (breadcrumb + back)
/_auth/organisation/fonctions/  — FonctionsPage
/_auth/organisation/fonctions/$id — FonctionDetailPage
/_auth/organisation/nomenclatures — NomenclaturesPage
/_auth/admin/roles              — layout (breadcrumb + back)
/_auth/admin/roles/             — RolesPage (list)
/_auth/admin/roles/$id          — RoleDetailPage (Permissions + Utilisateurs tabs)
```

## RBAC Permission Resolution Model

### Deux couches indépendantes
1. **Permissions de rôle** (`Role.permissions` M2M directe) — gérées sur le rôle lui-même, visible via `getRolePermissionsDetail` qui retourne `source: 'role' | 'none'`. L'héritage `parentId` existe en backend mais n'est PAS résolu dans `getRolePermissionsDetail` (by design : la vue d'édition ne montre que les permissions directes du rôle).
2. **Permissions utilisateur** — résolues via `permissionResolverService` qui combine : rôle + héritage (`parentId`) + overrides `UtilisateurPermission` (GRANTED/DENIED). `getEffectivePermissionsDetail` retourne `source: 'role' | 'granted' | 'denied' | 'none'`.

### Endpoints API
- `GET /roles/:id/permissions/detail` → `PermissionAvecSource[]` (directes seulement, `role`/`none`)
- `PUT /roles/:id/permissions/batch` → delta `addedPermissionIds`/`removedPermissionIds`
- `GET /users/:userId/permissions/effective/detail` → `PermissionAvecSource[]` (résolues avec héritage + overrides, `role`/`granted`/`denied`/`none`)
- `PUT /users/:userId/permissions/batch` → delta `{ permissionId, type: GRANTED|DENIED|null }[]`

### Modèle simplifié (Phase 8s)
- **Fusion rôle + granted = autorisée** : plus de distinction affichée entre une permission héritée du rôle et une surcharge GRANTED. Les 4 sources API (`role`/`granted`/`denied`/`none`) sont conservées en backend mais le frontend les mappe via `getStatut()` → `'autorisee' | 'refusee'` (plus de `non_definie`).
- **`none` = `refusee`** : toute permission absente (ni dans le rôle, ni surchargée) est considérée comme refusée. Visuellement et statistiquement traitée comme `denied`.
- **3 StatCards** : Total | Autorisée (avec breakdown rôle/surcharge en subtitle) | Refusée (denied + none)
- **4 pills de filtre** : Toutes | Autorisée | Refusée (denied+none) | Surchargées (granted+denied)
- **`SourceBadge` supprimé** — remplacé par checkbox (vert/rouge) + icône discrète (`Lock` pour rôle, `PlusCircle` pour surcharge, `Ban` pour refus). Plus de 3e état vide.
- **`filtreNeutre`, `filtreRole`, `sourceRole`, `sourceGranted`** retirés des locales
- **`ModuleCountBadge`** (`permission-utils.tsx:61`) : affiche `total (✓autorisee / ✗refusee)` en badge. Utilisé dans `ModuleTree` et `ModuleEditRow`. Coloration `bg-green-100/60 dark:bg-green-900/25` / `bg-red-100/60 dark:bg-red-900/25`, icônes `Check`/`X`. Responsive `text-[11px] sm:text-xs`. Calcul : `refused = total - authorized`.

### Cycles PermissionCheckbox — Utilisateurs (Phase 8s simplifié)
- **Utilisateurs** : `GRANTED ↔ DENIED` (2 états, plus de null). Toggle binaire dans la modale. `getInitialState` mappe TOUTES les permissions : `role`/`granted` → `GRANTED`, `denied`/`none` → `DENIED`.
- **Roles** : `null → GRANTED → null` (inchangé, pas de DENIED pour les rôles). `getInitialState` mappe seulement `role` → `GRANTED` (les `none` ne sont pas dans la map).

### Règles de sauvegarde (handleSave) — Phase 8s
- **Utilisateur** : compare `initialEditState` (toutes les permissions) vs `editState` courant. Pour chaque permission : si absente d'`editState` ET avait une surcharge → `type: null`. Si présente ET différente de l'initiale → `type: GRANTED|DENIED`. Pas d'entrée si inchangée.
- **Role** : inchangé (delta `addedIds`/`removedIds`).


