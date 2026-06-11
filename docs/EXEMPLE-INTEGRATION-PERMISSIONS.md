# Exemple d'Intégration Complète des Permissions

> **Objectif** : Montrer comment intégrer le nouveau système de permissions dans une page existante

---

## 📋 Avant : Ancien Système

```tsx
// frontend/src/features/eleves/components/eleves-page.tsx (ANCIEN)

import { usePermissions } from '@/hooks';

export function ElevesPage() {
    const { hasPermission } = usePermissions();
    
    return (
        <div>
            <h1>Élèves</h1>
            
            {/* Boutons conditionnels - OK mais verbeux */}
            {hasPermission('eleves:create') && (
                <ElisaButton onClick={() => setModalOpen(true)}>
                    Nouvel élève
                </ElisaButton>
            )}
            
            {hasPermission('eleves:export') && (
                <ElisaButton onClick={handleExporter}>
                    Exporter
                </ElisaButton>
            )}
            
            {/* PAS de protection de route - la page est accessible même sans eleves:view */}
            
            <Table>
                {/* ... */}
                {eleves.map(eleve => (
                    <TableRow key={eleve.id}>
                        <TableCell>{eleve.nom}</TableCell>
                        <TableCell>
                            {/* Actions dans le tableau */}
                            {hasPermission('eleves:edit') && (
                                <Button onClick={() => handleModifier(eleve)}>
                                    Modifier
                                </Button>
                            )}
                            {hasPermission('eleves:delete') && (
                                <Button onClick={() => handleSupprimer(eleve.id)}>
                                    Supprimer
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
}
```

---

## ✨ Après : Nouveau Système

### Étape 1 : Protéger la Route

```tsx
// frontend/src/routes/eleves.tsx

import { createRoute } from '@tanstack/react-router';
import { RequirePermission } from '@/components/permissions';
import { ElevesPage } from '@/features/eleves/components/eleves-page';

export const elevesRoute = createRoute({
    path: '/eleves',
    element: (
        <RequirePermission 
            module="eleves" 
            redirectTo="/unauthorized"
        >
            <ElevesPage />
        </RequirePermission>
    ),
});
```

---

### Étape 2 : Refactorer la Page avec Hooks Avancés

```tsx
// frontend/src/features/eleves/components/eleves-page.tsx (NOUVEAU)

import { useModulePermissions } from '@/hooks';
import { PermissionGate, PermissionButton } from '@/components/permissions';

export function ElevesPage() {
    // Hook avancé - toutes les permissions du module
    const { canAccess, canCreate, canEdit, canDelete, canExport, canImport } = useModulePermissions('eleves');
    
    // Si pas d'accès au module, le RequirePermission a déjà redirigé
    // Mais on peut aussi vérifier ici pour plus de sécurité
    if (!canAccess) {
        return <Navigate to="/unauthorized" />;
    }
    
    return (
        <div>
            <h1>Élèves</h1>
            
            {/* ✅ Plus propre avec PermissionGate */}
            <div className="flex gap-2 mb-4">
                <PermissionGate permission="eleves:create">
                    <ElisaButton onClick={() => setModalOpen(true)}>
                        Nouvel élève
                    </ElisaButton>
                </PermissionGate>
                
                <PermissionGate permission="eleves:export">
                    <ElisaButton onClick={handleExporter}>
                        Exporter
                    </ElisaButton>
                </PermissionGate>
                
                <PermissionGate permission="eleves:import">
                    <ElisaButton onClick={handleImporter}>
                        Importer
                    </ElisaButton>
                </PermissionGate>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Classe</TableHead>
                        {/* ✅ Colonne actions conditionnelle */}
                        {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {eleves.map(eleve => (
                        <TableRow key={eleve.id}>
                            <TableCell>{eleve.nom}</TableCell>
                            <TableCell>{eleve.classe}</TableCell>
                            {(canEdit || canDelete) && (
                                <TableCell>
                                    {/* ✅ PermissionButton avec tooltip */}
                                    <PermissionButton permission="eleves:edit">
                                        <Button onClick={() => handleModifier(eleve)}>
                                            Modifier
                                        </Button>
                                    </PermissionButton>
                                    
                                    <PermissionButton 
                                        permission="eleves:delete"
                                        disabledMessage="Suppression non autorisée"
                                    >
                                        <Button variant="danger" onClick={() => handleSupprimer(eleve.id)}>
                                            Supprimer
                                        </Button>
                                    </PermissionButton>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
```

---

### Étape 3 : Page de Détail avec Onglets Conditionnels

```tsx
// frontend/src/features/eleves/components/eleve-detail-page.tsx

import { useModulePermissions, useCanViewTab } from '@/hooks';
import { PermissionGate } from '@/components/permissions';

export function EleveDetailPage({ eleveId }: { eleveId: string }) {
    const { canEdit, canDelete } = useModulePermissions('eleves');
    
    // Onglets conditionnels
    const canViewMedical = useCanViewTab('eleves', 'medical');
    const canViewFinances = useCanViewTab('eleves', 'finances');
    const canViewDocuments = useCanViewTab('eleves', 'documents');
    
    return (
        <div>
            {/* Header avec actions */}
            <div className="flex justify-between items-center mb-6">
                <h1>Détail Élève</h1>
                <div className="flex gap-2">
                    <PermissionGate permission="eleves:edit">
                        <ElisaButton onClick={() => navigate({ to: '/eleves/$id/edit', params: { id: eleveId } })}>
                            Modifier
                        </ElisaButton>
                    </PermissionGate>
                    
                    <PermissionGate permission="eleves:delete">
                        <ElisaButton variant="danger" onClick={() => handleSupprimer(eleveId)}>
                            Supprimer
                        </ElisaButton>
                    </PermissionGate>
                </div>
            </div>
            
            {/* Onglets */}
            <Tabs defaultValue="infos">
                <TabsList>
                    <TabsTrigger value="infos">Informations</TabsTrigger>
                    
                    {/* ✅ Onglets conditionnels */}
                    {canViewMedical && (
                        <TabsTrigger value="medical">
                            Médical
                        </TabsTrigger>
                    )}
                    
                    {canViewFinances && (
                        <TabsTrigger value="finances">
                            Finances
                        </TabsTrigger>
                    )}
                    
                    {canViewDocuments && (
                        <TabsTrigger value="documents">
                            Documents
                        </TabsTrigger>
                    )}
                </TabsList>
                
                <TabsContent value="infos">
                    <InformationsTab eleveId={eleveId} />
                </TabsContent>
                
                {canViewMedical && (
                    <TabsContent value="medical">
                        <MedicalTab eleveId={eleveId} />
                    </TabsContent>
                )}
                
                {canViewFinances && (
                    <TabsContent value="finances">
                        <FinancesTab eleveId={eleveId} />
                    </TabsContent>
                )}
                
                {canViewDocuments && (
                    <TabsContent value="documents">
                        <DocumentsTab eleveId={eleveId} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
```

---

### Étape 4 : Formulaire avec Champs Conditionnels

```tsx
// frontend/src/features/eleves/components/eleve-form.tsx

import { useCanAccessField } from '@/hooks';
import { PermissionGate } from '@/components/permissions';

export function EleveForm({ mode }: { mode: 'create' | 'edit' }) {
    const form = useForm<EleveFormData>();
    
    // Champs conditionnels
    const canEditRemise = useCanAccessField('finances', 'remise', 'write');
    const canViewMedical = useCanAccessField('eleves', 'medical', 'read');
    const canEditMedical = useCanAccessField('eleves', 'medical', 'write');
    
    return (
        <Form {...form}>
            <form className="space-y-4">
                {/* Champs de base - toujours visibles */}
                <FormField control={form.control} name="nom">
                    <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                            <Input {...form.register('nom')} />
                        </FormControl>
                    </FormItem>
                </FormField>
                
                <FormField control={form.control} name="prenom">
                    <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                            <Input {...form.register('prenom')} />
                        </FormControl>
                    </FormItem>
                </FormField>
                
                {/* ✅ Champ remise - conditionnel */}
                {canEditRemise && (
                    <FormField control={form.control} name="remise">
                        <FormItem>
                            <FormLabel>Remise (%)</FormLabel>
                            <FormControl>
                                <Input type="number" {...form.register('remise')} />
                            </FormControl>
                            <FormMessage>
                                Remise accordée par l'administration uniquement
                            </FormMessage>
                        </FormItem>
                    </FormField>
                )}
                
                {/* ✅ Section médicale - conditionnelle */}
                {canViewMedical && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Médicales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="groupeSanguin">
                                <FormItem>
                                    <FormLabel>Groupe Sanguin</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('groupeSanguin')} disabled={!canEditMedical} />
                                    </FormControl>
                                </FormItem>
                            </FormField>
                            
                            <FormField control={form.control} name="allergies">
                                <FormItem>
                                    <FormLabel>Allergies</FormLabel>
                                    <FormControl>
                                        <Textarea {...form.register('allergies')} disabled={!canEditMedical} />
                                    </FormControl>
                                </FormItem>
                            </FormField>
                        </CardContent>
                    </Card>
                )}
                
                <div className="flex justify-end gap-2">
                    <Button type="submit">Enregistrer</Button>
                </div>
            </form>
        </Form>
    );
}
```

---

### Étape 5 : Dashboard avec Widgets Conditionnels

```tsx
// frontend/src/features/dashboard/components/dashboard-page.tsx

import { useCanViewWidget, useCanGenerateReport } from '@/hooks';
import { PermissionGate, PermissionMessage } from '@/components/permissions';

export function DashboardPage() {
    // Widgets conditionnels
    const canViewFinances = useCanViewWidget('finances-summary');
    const canViewEleves = useCanViewWidget('eleves-stats');
    const canViewAbsences = useCanViewWidget('absences');
    
    // Rapports conditionnels
    const canGenerateBulletins = useCanGenerateReport('bulletins');
    const canGenerateFinances = useCanGenerateReport('finances');
    
    return (
        <div>
            <h1>Tableau de Bord</h1>
            
            {/* ✅ Widgets conditionnels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canViewEleves && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistiques Élèves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ElevesStatsWidget />
                        </CardContent>
                    </Card>
                )}
                
                {canViewFinances && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Résumé Finances</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FinancesSummaryWidget />
                        </CardContent>
                    </Card>
                )}
                
                {canViewAbsences && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Absences Récentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AbsencesWidget />
                        </CardContent>
                    </Card>
                )}
            </div>
            
            {/* ✅ Section rapports conditionnelle */}
            <div className="mt-8">
                <h2>Rapports</h2>
                <div className="flex gap-2">
                    <PermissionGate 
                        permission="rapports:bulletins:generate"
                        fallback={<PermissionMessage type="info">Rapports bulletins non disponibles</PermissionMessage>}
                    >
                        <ElisaButton onClick={() => generateReport('bulletins')}>
                            Générer Bulletins
                        </ElisaButton>
                    </PermissionGate>
                    
                    <PermissionGate permission="rapports:finances:generate">
                        <ElisaButton onClick={() => generateReport('finances')}>
                            Générer Rapport Finances
                        </ElisaButton>
                    </PermissionGate>
                </div>
            </div>
        </div>
    );
}
```

---

## 🎯 Bénéfices du Nouveau Système

### 1. Code Plus Propre

**Avant** :
```tsx
{hasPermission('eleves:create') && hasPermission('eleves:edit') && (
    <Button>...</Button>
)}
```

**Après** :
```tsx
<PermissionGate permissions={['eleves:create', 'eleves:edit']} mode="all">
    <Button>...</Button>
</PermissionGate>
```

### 2. Réutilisabilité

**Avant** :
```tsx
// Répété dans 10 fichiers
const { hasPermission } = usePermissions();
const canCreate = hasPermission('eleves:create');
const canEdit = hasPermission('eleves:edit');
```

**Après** :
```tsx
// Une seule ligne
const { canCreate, canEdit } = useModulePermissions('eleves');
```

### 3. Sécurité Renforcée

**Avant** :
```tsx
// Page accessible même sans permission
function ElevesPage() {
    // ...
}
```

**Après** :
```tsx
// Protection au niveau route
<RequirePermission module="eleves">
    <ElevesPage />
</RequirePermission>
```

### 4. UX Améliorée

**Avant** :
```tsx
// Bouton visible mais désactivé sans explication
<Button disabled={!hasPermission('eleves:delete')}>
    Supprimer
</Button>
```

**Après** :
```tsx
// Bouton avec tooltip explicatif
<PermissionButton permission="eleves:delete" disabledMessage="Suppression non autorisée">
    <Button>Supprimer</Button>
</PermissionButton>
```

---

## 📊 Comparaison des Métriques

| Métrique | Ancien Système | Nouveau Système | Amélioration |
|----------|---------------|-----------------|--------------|
| **Lignes de code** | ~50 par page | ~30 par page | -40% |
| **Vérifications manuelles** | 5-10 par page | 1-2 par page | -80% |
| **Protection routes** | ❌ Aucune | ✅ Complète | +100% |
| **ToFallback informatif** | ❌ Non | ✅ Oui | UX+++ |
| **Réutilisabilité** | ❌ Faible | ✅ Élevée | Dev+++ |
| **Maintenance** | ❌ Difficile | ✅ Facile | Time--- |

---

## 🚀 Migration Progressive

### Stratégie Recommandée

1. **Phase 1** : Ajouter les guards de routes ( RequirePermission )
2. **Phase 2** : Remplacer `hasPermission()` par `useModulePermissions()`
3. **Phase 3** : Utiliser `PermissionGate` pour les boutons
4. **Phase 4** : Ajouter les contrôles d'onglets et champs

### Exemple de Migration

```tsx
// ÉTAPE 1 : Ajouter RequirePermission (5 min)
<Route path="/eleves" element={<RequirePermission module="eleves"><ElevesPage /></RequirePermission>} />

// ÉTAPE 2 : Remplacer hasPermission (15 min)
// AVANT
const { hasPermission } = usePermissions();
const canCreate = hasPermission('eleves:create');

// APRÈS
const { canCreate } = useModulePermissions('eleves');

// ÉTAPE 3 : Utiliser PermissionGate (10 min)
// AVANT
{hasPermission('eleves:export') && <Button>Exporter</Button>}

// APRÈS
<PermissionGate permission="eleves:export">
    <Button>Exporter</Button>
</PermissionGate>

// ÉTAPE 4 : Ajouter contrôles avancés (20 min)
const canViewMedical = useCanViewTab('eleves', 'medical');
const canEditRemise = useCanAccessField('finances', 'remise', 'write');
```

---

## ✅ Checklist de Migration

Pour chaque page :

- [ ] Ajouter `RequirePermission` dans les routes
- [ ] Remplacer `usePermissions()` par `useModulePermissions()`
- [ ] Remplacer `hasPermission('module:xxx')` par `perms.canXxx`
- [ ] Utiliser `PermissionGate` pour les boutons conditionnels
- [ ] Ajouter `PermissionButton` avec tooltips
- [ ] Contrôler les onglets avec `useCanViewTab()`
- [ ] Contrôler les champs avec `useCanAccessField()`
- [ ] Tester avec différents rôles

---

**Mainteneur** : franck arlos chendjou  
**Date** : 2026-06-11  
**Version** : 1.0.0
