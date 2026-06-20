/**
 * ==================================
 * eLISAschool - Page Édition/Configuration Établissement
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Settings, Users, BookOpen, GraduationCap, Layers, BarChart3, Save, Plus, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useEtablissement, useEtablissementDetailStats, useEtablissementConfig, useModifierEtablissement } from '../hooks/use-etablissements';
import { useUtilisateurs, useRetirerUtilisateurEtablissement, useUtilisateursDisponibles, useRoles, useVerifierRetraitUtilisateurEtablissement } from '@/features/utilisateurs/hooks/use-utilisateurs';
import { useAuthStore } from '@/stores/auth.store';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { CustomModal } from '@/components/modals/CustomModal';
import { DataTable } from '@/components/ui/DataTable';
import { useAffecterUtilisateurEtablissement } from '@/features/utilisateurs/hooks/use-utilisateurs';
import { SousSysteme, TypeEtablissement } from '../types/etablissement.types';
import type { Etablissement, ModifierEtablissementDto } from '../types/etablissement.types';
import type { Utilisateur } from '@/features/utilisateurs/types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';

// Helper pour vérifier les permissions
function checkPermission(permission: string): boolean {
    const { utilisateur } = useAuthStore.getState();
    if (!utilisateur) return false;
    if (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') return true;
    return (utilisateur.permissions || []).includes(permission);
}

type TabId = 'general' | 'config' | 'utilisateurs' | 'statistiques';

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
    { id: 'general', icon: Building2, label: 'Général' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'utilisateurs', icon: Users, label: 'Utilisateurs' },
    { id: 'statistiques', icon: BarChart3, label: 'Statistiques' },
];

export function EtablissementEditPage() {
    const { id } = useParams({ from: '/_auth/etablissements/$id' });
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [isConfigEditing, setIsConfigEditing] = useState(false);

    const { data: etablissement, isLoading } = useEtablissement(id);
    const { data: stats } = useEtablissementDetailStats(id);
    const { data: config } = useEtablissementConfig(id);
    const modifier = useModifierEtablissement();

    const [formData, setFormData] = useState<Partial<ModifierEtablissementDto>>({});

    const handleStartEdit = () => {
        if (etablissement) {
            setFormData({
                nom: etablissement.nom,
                codeEtablissement: etablissement.codeEtablissement || undefined,
                slogan: etablissement.slogan || undefined,
                logoUrl: etablissement.logoUrl || undefined,
                sousSysteme: etablissement.sousSysteme,
                type: etablissement.type,
                numeroArrete: etablissement.numeroArrete || undefined,
                numeroContribuable: etablissement.numeroContribuable || undefined,
                numeroCompteBancaire: etablissement.numeroCompteBancaire || undefined,
                contactEmail: etablissement.contactEmail || undefined,
                contactTelephone: etablissement.contactTelephone || undefined,
                adresse: etablissement.adresse || undefined,
                siteWeb: etablissement.siteWeb || undefined,
                facebook: etablissement.facebook || undefined,
                twitter: etablissement.twitter || undefined,
                heuresOuverture: etablissement.heuresOuverture || undefined,
                heuresFermeture: etablissement.heuresFermeture || undefined,
                effectifMax: etablissement.effectifMax || undefined,
                directeurNom: etablissement.directeurNom || undefined,
                directeurAdjointNom: etablissement.directeurAdjointNom || undefined,
                censeurNom: etablissement.censeurNom || undefined,
                surveillantGeneralNom: etablissement.surveillantGeneralNom || undefined,
                couleurPrimaire: etablissement.couleurPrimaire || undefined,
                couleurSecondaire: etablissement.couleurSecondaire || undefined,
            });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        try {
            await modifier.mutateAsync({ id, ...formData });
            toast.success('Établissement modifié avec succès');
            setIsEditing(false);
            setFormData({});
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({});
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!etablissement) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-600">Établissement non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/etablissements' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div
                className="flex items-center justify-between gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate({ to: '/etablissements' })}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    {etablissement.logoUrl && (
                        <img
                            src={etablissement.logoUrl}
                            alt={`Logo ${etablissement.nom}`}
                            className="w-16 h-16 rounded-lg object-contain border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1"
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            {!etablissement.logoUrl && <Building2 className="h-8 w-8" />}
                            {etablissement.nom}
                        </h1>
                        {etablissement.codeEtablissement && (
                            <p className="text-sm text-gray-500 font-mono">{etablissement.codeEtablissement}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {(etablissement.couleurPrimaire || etablissement.couleurSecondaire) && (
                        <div className="flex items-center gap-2">
                            {etablissement.couleurPrimaire && (
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                                    style={{ backgroundColor: etablissement.couleurPrimaire }}
                                    title="Couleur principale"
                                />
                            )}
                            {etablissement.couleurSecondaire && (
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                                    style={{ backgroundColor: etablissement.couleurSecondaire }}
                                    title="Couleur secondaire"
                                />
                            )}
                        </div>
                    )}
                    <Link
                        to="/utilisateurs"
                        search={{ etablissementId: id }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        <Users className="h-4 w-4" />
                        Utilisateurs
                    </Link>
                    {!isEditing ? (
                        <ElisaButton
                            variant="primary"
                            onClick={handleStartEdit}
                            icon={<Settings className="h-4 w-4" />}
                        >
                            Modifier les informations
                        </ElisaButton>
                    ) : (
                        <div className="flex items-center gap-2">
                            <ElisaButton variant="outline" onClick={handleCancel}>
                                Annuler
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                onClick={handleSave}
                                isLoading={modifier.isPending}
                                icon={<Save className="h-4 w-4" />}
                            >
                                Enregistrer
                            </ElisaButton>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats rapides */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={BookOpen} label="Classes" value={stats.nombreClasses} color="blue" />
                    <StatCard icon={GraduationCap} label="Élèves" value={stats.nombreEleves} color="green" />
                    <StatCard icon={Users} label="Personnel" value={stats.nombrePersonnel} color="purple" />
                    <StatCard icon={Layers} label="Taux occupation" value={`${stats.tauxOccupation}%`} color="orange" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-col gap-6 lg:flex-row">
                <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'general' && (
                        <GeneralTab
                            etablissement={etablissement}
                            isEditing={isEditing}
                            formData={formData}
                            updateField={updateField}
                        />
                    )}
                    {activeTab === 'config' && (
                        <ConfigTab
                            config={config}
                            canEdit={checkPermission('config:module:toggle')}
                        />
                    )}
                    {activeTab === 'utilisateurs' && (
                        <UtilisateursTab
                            etablissementId={id}
                            canAssign={checkPermission('utilisateurs:create')}
                        />
                    )}
                    {activeTab === 'statistiques' && <StatistiquesTab stats={stats} />}
                </div>
            </div>
        </div>
    );
}

// =============================================
// TABS
// =============================================

function GeneralTab({
    etablissement,
    isEditing,
    formData,
    updateField,
}: {
    etablissement: Etablissement;
    isEditing: boolean;
    formData: Partial<ModifierEtablissementDto>;
    updateField: (field: string, value: any) => void;
}) {
    const displayValue = (field: keyof Etablissement) => {
        return isEditing && formData[field] !== undefined ? formData[field] : etablissement[field];
    };

    return (
        <div className="space-y-6">
            <Section title="Informations de base">
                {isEditing ? (
                    <>
                        <ElisaInput
                            label="Nom *"
                            value={formData.nom || ''}
                            onChange={(v) => updateField('nom', v)}
                            required
                        />
                        <ElisaInput
                            label="Code établissement"
                            value={formData.codeEtablissement || ''}
                            onChange={(v) => updateField('codeEtablissement', v)}
                        />
                        <ElisaInput
                            label="Slogan"
                            value={formData.slogan || ''}
                            onChange={(v) => updateField('slogan', v)}
                        />
                        <ElisaSelect
                            label="Sous-système"
                            value={formData.sousSysteme || SousSysteme.FRANCOPHONE}
                            onChange={(v) => updateField('sousSysteme', v)}
                            options={Object.values(SousSysteme).map(v => ({ label: v, value: v }))}
                        />
                        <ElisaSelect
                            label="Type d'établissement"
                            value={formData.type || TypeEtablissement.LAIC}
                            onChange={(v) => updateField('type', v)}
                            options={Object.values(TypeEtablissement).map(v => ({ label: v, value: v }))}
                        />
                    </>
                ) : (
                    <>
                        <Field label="Nom" value={etablissement.nom} />
                        <Field label="Code" value={etablissement.codeEtablissement} />
                        <Field label="Slogan" value={etablissement.slogan} />
                        <Field label="Sous-système" value={etablissement.sousSysteme} />
                        <Field label="Type" value={etablissement.type} />
                    </>
                )}
            </Section>

            <Section title="Contact">
                {isEditing ? (
                    <>
                        <ElisaInput
                            label="Email"
                            type="email"
                            value={formData.contactEmail || ''}
                            onChange={(v) => updateField('contactEmail', v)}
                        />
                        <ElisaInput
                            label="Téléphone"
                            value={formData.contactTelephone || ''}
                            onChange={(v) => updateField('contactTelephone', v)}
                        />
                        <ElisaInput
                            label="Adresse"
                            value={formData.adresse || ''}
                            onChange={(v) => updateField('adresse', v)}
                        />
                        <ElisaInput
                            label="Site Web"
                            value={formData.siteWeb || ''}
                            onChange={(v) => updateField('siteWeb', v)}
                        />
                    </>
                ) : (
                    <>
                        <Field label="Email" value={etablissement.contactEmail} />
                        <Field label="Téléphone" value={etablissement.contactTelephone} />
                        <Field label="Adresse" value={etablissement.adresse} />
                        <Field label="Site Web" value={etablissement.siteWeb} />
                    </>
                )}
            </Section>

            <Section title="Direction">
                {isEditing ? (
                    <>
                        <ElisaInput
                            label="Directeur(trice)"
                            value={formData.directeurNom || ''}
                            onChange={(v) => updateField('directeurNom', v)}
                        />
                        <ElisaInput
                            label="Directeur(trice) Adjoint(e)"
                            value={formData.directeurAdjointNom || ''}
                            onChange={(v) => updateField('directeurAdjointNom', v)}
                        />
                        <ElisaInput
                            label="Censeur(e)"
                            value={formData.censeurNom || ''}
                            onChange={(v) => updateField('censeurNom', v)}
                        />
                        <ElisaInput
                            label="Surveillant(e) Général(e)"
                            value={formData.surveillantGeneralNom || ''}
                            onChange={(v) => updateField('surveillantGeneralNom', v)}
                        />
                    </>
                ) : (
                    <>
                        <Field label="Directeur(trice)" value={etablissement.directeurNom} />
                        <Field label="Directeur(trice) Adjoint(e)" value={etablissement.directeurAdjointNom} />
                        <Field label="Censeur(e)" value={etablissement.censeurNom} />
                        <Field label="Surveillant(e) Général(e)" value={etablissement.surveillantGeneralNom} />
                    </>
                )}
            </Section>
        </div>
    );
}

function ConfigTab({ config, canEdit }: { config: any; canEdit: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [configData, setConfigData] = useState<any>({});

    if (!config) {
        return <p className="text-gray-600">Configuration non disponible</p>;
    }

    const handleStartEdit = () => {
        setConfigData({
            langueDefaut: config.langueDefaut,
            devise: config.devise,
            fuseauHoraire: config.fuseauHoraire,
            theme: config.theme,
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        toast.success('Configuration mise à jour (simulation)');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setConfigData({});
    };

    const updateConfigField = (field: string, value: any) => {
        setConfigData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Configuration de l'établissement</h2>
                {canEdit && !isEditing && (
                    <ElisaButton variant="outline" onClick={handleStartEdit} icon={<Settings className="h-4 w-4" />}>
                        Modifier
                    </ElisaButton>
                )}
                {isEditing && (
                    <div className="flex items-center gap-2">
                        <ElisaButton variant="outline" onClick={handleCancel}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton variant="primary" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                            Enregistrer
                        </ElisaButton>
                    </div>
                )}
            </div>

            <Section title="Cycles actifs">
                <Field label="Nombre de cycles" value={config.cyclesActifs?.length || 0} />
                <Field label="Cycles" value={config.cyclesActifs?.join(', ')} />
            </Section>

            <Section title="Thème">
                {isEditing ? (
                    <>
                        <ElisaSelect
                            label="Thème"
                            value={configData.theme || config.theme || 'light'}
                            onChange={(v) => updateConfigField('theme', v)}
                            options={[
                                { label: 'Clair', value: 'light' },
                                { label: 'Sombre', value: 'dark' },
                                { label: 'Auto', value: 'auto' },
                            ]}
                        />
                    </>
                ) : (
                    <>
                        <Field label="Couleur primaire" value={config.couleurPrimaire} />
                        <Field label="Couleur secondaire" value={config.couleurSecondaire} />
                        <Field label="Couleur accent" value={config.couleurAccent} />
                        <Field label="Thème" value={config.theme} />
                    </>
                )}
            </Section>

            <Section title="Paramètres régionaux">
                {isEditing ? (
                    <>
                        <ElisaSelect
                            label="Langue"
                            value={configData.langueDefaut || config.langueDefaut || 'fr'}
                            onChange={(v) => updateConfigField('langueDefaut', v)}
                            options={[
                                { label: 'Français', value: 'fr' },
                                { label: 'English', value: 'en' },
                            ]}
                        />
                        <ElisaSelect
                            label="Devise"
                            value={configData.devise || config.devise || 'XAF'}
                            onChange={(v) => updateConfigField('devise', v)}
                            options={[
                                { label: 'FCFA (XAF)', value: 'XAF' },
                                { label: 'EUR (€)', value: 'EUR' },
                                { label: 'USD ($)', value: 'USD' },
                            ]}
                        />
                        <ElisaInput
                            label="Fuseau horaire"
                            value={configData.fuseauHoraire || config.fuseauHoraire || 'Africa/Douala'}
                            onChange={(v) => updateConfigField('fuseauHoraire', v)}
                        />
                    </>
                ) : (
                    <>
                        <Field label="Langue" value={config.langueDefaut} />
                        <Field label="Devise" value={config.devise} />
                        <Field label="Fuseau horaire" value={config.fuseauHoraire} />
                    </>
                )}
            </Section>

            <Section title="Abonnement">
                <Field label="Plan" value={config.planAbonnement} />
                <Field label="Max élèves" value={config.maxEleves} />
                <Field label="Max utilisateurs" value={config.maxUtilisateurs} />
                <Field label="Max classes" value={config.maxClasses} />
                <Field label="Stockage max (MB)" value={config.stockageMaxMB} />
                <Field label="Expiration" value={config.dateExpirationAbonnement} />
            </Section>
        </div>
    );
}

function UtilisateursTab({ etablissementId, canAssign }: { etablissementId: string; canAssign: boolean }) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // État pour le modal de retrait d'utilisateur (v5.0)
    const [retraitModal, setRetraitModal] = useState<{
        ouvert: boolean;
        utilisateurId: string;
        utilisateurNom: string;
        motif: string;
        verification?: any; // Résultats de la vérification des impacts
        nouvelEtablissementPrincipalId?: string; // Sélection du nouvel établissement principal
        comprendImpacts: boolean; // Checkbox de confirmation
    }>({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '', comprendImpacts: false });
    
    const limit = 20;
    
    const { data: utilisateursResponse, isLoading, refetch } = useUtilisateurs({ 
        etablissementId, 
        limit,
        page: currentPage,
        recherche: searchTerm || undefined,
        role: roleFilter || undefined,
        sortBy: 'nom',
        sortOrder: 'ASC',
    });
    const retirer = useRetirerUtilisateurEtablissement(etablissementId);
    const verifier = useVerifierRetraitUtilisateurEtablissement(etablissementId);
    const { data: stats } = useEtablissementDetailStats(etablissementId);
    
    const utilisateurs = utilisateursResponse?.items || [];
    const total = utilisateursResponse?.meta?.totalItems || 0;
    const totalPages = Math.ceil(total / limit);

    const handleRetirer = async (user: Utilisateur) => {
        // Construire le nom complet avec fallback sécurisé
        const nomComplet = [
            user.nom || '',
            user.prenom || ''
        ].filter(Boolean).join(' ') || user.email || 'Utilisateur inconnu';
        
        // ÉTAPE 1 : Vérifier les impacts avant d'ouvrir le modal
        try {
            const verification = await verifier.mutateAsync({ utilisateurId: user.id });
            
            // Ouvrir le modal avec les résultats de vérification
            setRetraitModal({
                ouvert: true,
                utilisateurId: user.id,
                utilisateurNom: nomComplet,
                motif: '',
                verification,
                nouvelEtablissementPrincipalId: undefined,
                comprendImpacts: false,
            });
        } catch (error) {
            toast.error('Erreur lors de la vérification des impacts');
            console.error('[Vérification retrait] Erreur:', error);
        }
    };
    
    const confirmRetrait = async () => {
        // Vérifier que l'utilisateur a coché la checkbox s'il y a des avertissements
        if (retraitModal.verification?.avertissements?.length > 0 && !retraitModal.comprendImpacts) {
            toast.warning('Veuillez confirmer que vous comprenez les impacts avant de continuer');
            return;
        }
        
        try {
            await retirer.mutateAsync({ 
                utilisateurId: retraitModal.utilisateurId,
                motif: retraitModal.motif || undefined,
                nouveauPrincipalId: retraitModal.nouvelEtablissementPrincipalId,
            });
            
            // Fermer le modal
            setRetraitModal({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '', comprendImpacts: false });
            
            // Recharger les données
            await refetch();
        } catch (error: any) {
            console.error('[Retrait] Erreur:', error?.response?.data?.error || error);
        }
    };
    
    const cancelRetrait = () => {
        setRetraitModal({ ouvert: false, utilisateurId: '', utilisateurNom: '', motif: '', comprendImpacts: false });
    };
    
    const updateRetraitMotif = (v: string) => {
        setRetraitModal(prev => ({ ...prev, motif: v }));
    };
    
    const toggleComprendImpacts = () => {
        setRetraitModal(prev => ({ ...prev, comprendImpacts: !prev.comprendImpacts }));
    };
    
    const setNouvelEtablissementPrincipal = (id: string) => {
        setRetraitModal(prev => ({ ...prev, nouvelEtablissementPrincipalId: id }));
    };

    const colonnes: Column<Utilisateur>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Utilisateur',
            sortable: true,
            render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                            {(user.prenom?.[0] || user.nom?.[0] || '?').toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.nom} {user.prenom}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email || user.matricule}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Rôle',
            sortable: true,
            className: 'text-center',
            render: (user) => (
                <select
                    value={user.roleEtablissement || user.role}
                    onChange={(e) => {
                        if (confirm(`Changer le rôle de ${user.nom} ${user.prenom} vers ${e.target.value} ?`)) {
                            // TODO: Implémenter le changement de rôle avec useChangerRoleEtablissement
                            toast.info('Fonctionnalité en cours de développement');
                        }
                    }}
                    className="text-xs font-medium rounded-full px-2.5 py-1 border-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    disabled={!canAssign}
                >
                    <option value="ENSEIGNANT">Enseignant</option>
                    <option value="ELEVE">Élève</option>
                    <option value="PARENT">Parent</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CHEF_ETABLISSEMENT">Chef établissement</option>
                    <option value="DIRECTEUR">Directeur</option>
                    <option value="SURVEILLANT">Surveillant</option>
                </select>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (user) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.actif 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {user.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (user) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir le profil',
                    onClick: () => { window.location.href = `/utilisateurs/${user.id}`; },
                    variant: 'info' as const,
                },
                {
                    key: 'retirer',
                    icon: Trash2,
                    label: 'Retirer',
                    onClick: () => handleRetirer(user),
                    hidden: !canAssign,
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Utilisateurs de l'établissement
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {total} utilisateur(s) assigné(s)
                    </p>
                </div>
                {canAssign && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowAssignModal(true)}
                    >
                        Assigner un utilisateur
                    </ElisaButton>
                )}
            </div>

            {/* Statistiques rapides par rôle */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: total, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                        { label: 'Enseignants', value: stats.enseignants || 0, color: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                        { label: 'Élèves', value: stats.eleves || 0, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
                        { label: 'Personnel', value: stats.personnel || 0, color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
                    ].map((stat) => (
                        <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs opacity-75">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <ElisaInput
                        type="search"
                        placeholder="Rechercher un utilisateur..."
                        value={searchTerm}
                        onChange={(v) => {
                            setSearchTerm(v);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <ElisaSelect
                        value={roleFilter}
                        onChange={(v) => {
                            setRoleFilter(v);
                            setCurrentPage(1);
                        }}
                        options={[
                            { label: 'Tous les rôles', value: '' },
                            { label: 'Enseignant', value: 'ENSEIGNANT' },
                            { label: 'Élève', value: 'ELEVE' },
                            { label: 'Parent', value: 'PARENT' },
                            { label: 'Admin', value: 'ADMIN' },
                            { label: 'Chef établissement', value: 'CHEF_ETABLISSEMENT' },
                        ]}
                        placeholder="Filtrer par rôle"
                    />
                </div>
            </div>

            {/* Tableau */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : utilisateurs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                        <p className="text-sm mt-1">
                            {searchTerm || roleFilter 
                                ? 'Essayez de modifier vos filtres'
                                : 'Commencez par assigner des utilisateurs à cet établissement'}
                        </p>
                    </div>
                ) : (
                    <DataTable
                        columns={colonnes}
                        data={utilisateurs}
                        pagination={{
                            page: currentPage,
                            limit,
                            total,
                            totalPages,
                            onPageChange: setCurrentPage,
                        }}
                        searchable={false}
                        enableColumnVisibility={true}
                        enableRowHeight={true}
                        stickyHeader={true}
                        maxHeight="600px"
                    />
                )}
            </div>

            {/* Modal d'assignation */}
            {showAssignModal && (
                <AssignUtilisateurModal
                    etablissementId={etablissementId}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        refetch();
                    }}
                    onCancel={() => setShowAssignModal(false)}
                />
            )}
            
            {/* Modal de confirmation de retrait d'utilisateur (v5.0) */}
            <CustomModal
                open={retraitModal.ouvert}
                onOpenChange={(open) => { if (!open) cancelRetrait(); }}
                title="Retirer l'utilisateur de l'établissement"
                description="Vérification des impacts avant le retrait"
                size="2xl"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <ElisaButton
                            variant="outline"
                            onClick={cancelRetrait}
                            disabled={retirer.isPending || verifier.isPending}
                        >
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            onClick={confirmRetrait}
                            icon={<Trash2 className="h-4 w-4" />}
                            loading={retirer.isPending}
                            disabled={
                                !retraitModal.utilisateurId ||
                                verifier.isPending ||
                                retraitModal.verification?.blocages?.length > 0 ||
                                (retraitModal.verification?.avertissements?.length > 0 && !retraitModal.comprendImpacts)
                            }
                        >
                            {retirer.isPending ? 'Retrait en cours...' : 'Confirmer le retrait'}
                        </ElisaButton>
                    </div>
                }
            >
                {verifier.isPending ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vérification des impacts en cours...</p>
                        </div>
                    </div>
                ) : retraitModal.verification ? (
                    <div className="space-y-4">
                        {/* Information utilisateur */}
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-lg">
                                        {retraitModal.utilisateurNom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {retraitModal.utilisateurNom}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">ID: {retraitModal.utilisateurId.substring(0, 8)}...</p>
                                </div>
                            </div>
                        </div>

                        {/* BLOCAGES (empêchent le retrait) */}
                        {retraitModal.verification.blocages && retraitModal.verification.blocages.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
                                    <span className="text-lg">🚫</span>
                                    <span>Blocages ({retraitModal.verification.blocages.length})</span>
                                </div>
                                {retraitModal.verification.blocages.map((blocage: any, index: number) => (
                                    <div key={index} className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-red-800 dark:text-red-200 text-sm">
                                                    {blocage.message}
                                                </p>
                                                {blocage.actionRequise && (
                                                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                                                        → {blocage.actionRequise}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-xs text-red-600 dark:text-red-400 italic">
                                    ⚠️ Le retrait est impossible tant que ces blocages ne sont pas résolus.
                                </p>
                            </div>
                        )}

                        {/* AVERTISSEMENTS (confirmation requise) */}
                        {retraitModal.verification.avertissements && retraitModal.verification.avertissements.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                                    <span className="text-lg">⚠️</span>
                                    <span>Avertissements ({retraitModal.verification.avertissements.length})</span>
                                </div>
                                {retraitModal.verification.avertissements.map((avertissement: any, index: number) => (
                                    <div key={index} className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                                                    {avertissement.message}
                                                </p>
                                                {avertissement.actionRecommandee && (
                                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                                                        → {avertissement.actionRecommandee}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SÉLECTION DU NOUVEL ÉTABLISSEMENT PRINCIPAL */}
                        {retraitModal.verification.resume?.estEtablissementPrincipal && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    🏫 Nouvel établissement principal (optionnel)
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Cet établissement est actuellement l'établissement principal de l'utilisateur.
                                    Choisissez un autre établissement principal ou laissez vide pour attribuer automatiquement le plus ancien.
                                </p>
                                <ElisaInput
                                    type="text"
                                    placeholder="ID de l'établissement (optionnel)"
                                    value={retraitModal.nouvelEtablissementPrincipalId || ''}
                                    onChange={setNouvelEtablissementPrincipal}
                                />
                            </div>
                        )}

                        {/* RÉSUMÉ */}
                        {retraitModal.verification.resume && (
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Résumé des impacts</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                                    <p>📚 Classes assignées : <strong>{retraitModal.verification.resume.classesAssignees || 0}</strong></p>
                                    <p>👨‍🎓 Élèves responsables : <strong>{retraitModal.verification.resume.elevesResponsables || 0}</strong></p>
                                </div>
                            </div>
                        )}

                        {/* CHECKBOX DE CONFIRMATION */}
                        {retraitModal.verification.avertissements && retraitModal.verification.avertissements.length > 0 && (
                            <label className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={retraitModal.comprendImpacts}
                                    onChange={toggleComprendImpacts}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        Je comprends les impacts et souhaite continuer
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        En cochant cette case, vous confirmez avoir pris connaissance des avertissements ci-dessus et souhaitez procéder au retrait.
                                    </p>
                                </div>
                            </label>
                        )}

                        {/* CHAMP MOTIF */}
                        <div className="space-y-2">
                            <ElisaInput
                                label="Motif du retrait (optionnel)"
                                type="text"
                                value={retraitModal.motif}
                                onChange={updateRetraitMotif}
                                placeholder="Saisissez un motif ou choisissez ci-dessous..."
                            />
                            
                            {/* Suggestions rapides */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Mutation', icon: '🔄' },
                                    { label: 'Fin de contrat', icon: '📅' },
                                    { label: 'Démission', icon: '📝' },
                                    { label: 'Retraite', icon: '🏖️' },
                                    { label: 'Transfert', icon: '🔀' },
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion.label}
                                        type="button"
                                        onClick={() => updateRetraitMotif(suggestion.label)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                        <span>{suggestion.icon}</span>
                                        <span>{suggestion.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* NOTE INFORMATIVE */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p>ℹ️ Le motif sera enregistré dans l'historique pour traçabilité.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Aucune donnée de vérification disponible.</p>
                    </div>
                )}
            </CustomModal>
        </div>
    );
}

function StatistiquesTab({ stats }: { stats: any }) {
    if (!stats) {
        return <p className="text-gray-600">Statistiques non disponibles</p>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Statistiques de l'établissement</h2>

            <Section title="Vue d'ensemble">
                <Field label="Classes" value={stats.nombreClasses} />
                <Field label="Élèves" value={stats.nombreEleves} />
                <Field label="Personnel" value={stats.nombrePersonnel} />
                <Field label="Niveaux" value={stats.nombreNiveaux} />
                <Field label="Taux d'occupation" value={`${stats.tauxOccupation}%`} />
            </Section>

            <Section title="Configuration">
                <Field label="Cycles actifs" value={stats.config?.cyclesActifs} />
                <Field label="Modules actifs" value={stats.config?.modulesActifs} />
                <Field label="Plan d'abonnement" value={stats.config?.planAbonnement} />
            </Section>
        </div>
    );
}

// =============================================
// COMPONENTS
// =============================================

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    };

    return (
        <div className={cn('rounded-lg p-4', colors[color])}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
            </p>
        </div>
    );
}

// =============================================
// MODAL ASSIGNATION UTILISATEUR
// =============================================

interface AssignUtilisateurModalProps {
    etablissementId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

function AssignUtilisateurModal({ etablissementId, onSuccess, onCancel }: AssignUtilisateurModalProps) {
    const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
    const [role, setRole] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [motif, setMotif] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const affecter = useAffecterUtilisateurEtablissement(etablissementId);
    const { data: roles = [] } = useRoles();
    const { data: utilisateursDisponibles, isLoading: isLoadingUsers } = useUtilisateursDisponibles(etablissementId);

    // Filtrer les utilisateurs disponibles selon la recherche
    const filteredUsers = useMemo(() => {
        if (!utilisateursDisponibles?.items) return [];
        if (!searchTerm.trim()) return utilisateursDisponibles.items;
        
        const term = searchTerm.toLowerCase();
        return utilisateursDisponibles.items.filter(user => 
            user.nom.toLowerCase().includes(term) ||
            user.prenom.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.matricule && user.matricule.toLowerCase().includes(term))
        );
    }, [utilisateursDisponibles, searchTerm]);

    const handleSubmit = async () => {
        if (!selectedUser || !role) {
            toast.error('Veuillez sélectionner un utilisateur et un rôle');
            return;
        }

        // Validation de la date de fin
        if (dateDebut && dateFin && new Date(dateFin) <= new Date(dateDebut)) {
            toast.error('La date de fin doit être ultérieure à la date de début');
            return;
        }

        await affecter.mutateAsync({
            utilisateurId: selectedUser.id,
            etablissementId,
            role,
            dateDebut: dateDebut || undefined,
            dateFin: dateFin || undefined,
            motif: motif || undefined,
        });

        onSuccess();
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title="Assigner un utilisateur"
            description="Ajoutez un utilisateur à cet établissement"
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={affecter.isPending}
                        disabled={!selectedUser || !role}
                    >
                        Assigner
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6">
                {/* Recherche d'utilisateur */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rechercher un utilisateur <span className="text-red-500">*</span>
                    </label>
                    <ElisaInput
                        type="search"
                        value={searchTerm}
                        onChange={(v) => {
                            setSearchTerm(v);
                            setSelectedUser(null); // Reset sélection quand on change la recherche
                        }}
                        placeholder="Nom, prénom, email ou matricule..."
                    />
                </div>

                {/* Liste des utilisateurs filtrés */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                            <p className="text-sm">Aucun utilisateur trouvé</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.slice(0, 10).map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                        selectedUser?.id === user.id 
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600' 
                                            : 'border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                            {(user.prenom?.[0] || user.nom?.[0] || '?').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {user.nom} {user.prenom}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {user.email || user.matricule}
                                        </p>
                                    </div>
                                    {selectedUser?.id === user.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sélection du rôle */}
                <ElisaSelect
                    label="Rôle dans l'établissement"
                    value={role}
                    onChange={(v) => setRole(v)}
                    options={roles.map((r: any) => ({
                        label: r.nom,
                        value: r.code,
                    }))}
                    placeholder="Sélectionnez un rôle"
                    required
                />

                {/* Options avancées */}
                <details className="group">
                    <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        <span className="mr-2 transition-transform group-open:rotate-90">▶</span>
                        Options avancées
                    </summary>
                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                        <ElisaInput
                            label="Date de début (optionnel)"
                            type="date"
                            value={dateDebut}
                            onChange={(v) => setDateDebut(v)}
                        />
                        <ElisaInput
                            label="Date de fin (optionnel)"
                            type="date"
                            value={dateFin}
                            onChange={(v) => setDateFin(v)}
                        />
                        <ElisaInput
                            label="Motif (optionnel)"
                            type="text"
                            value={motif}
                            onChange={(v) => setMotif(v)}
                            placeholder="Raison de l'assignation"
                        />
                    </div>
                </details>
            </div>
        </CustomModal>
    );
}
