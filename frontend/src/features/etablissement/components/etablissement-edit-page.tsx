/**
 * ==================================
 * eLISAschool - Page Édition/Configuration Établissement
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Building2, Save, Lock, Unlock, Edit, ChevronRight, Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEtablissement, useModifierEtablissement, useUploadLogo, useSupprimerLogo, useGetLogo } from '../hooks/use-etablissements';
import { useAuthStore } from '@/stores/auth.store';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SchoolLoading } from '@/components/feedback';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { SousSysteme, TypeEtablissement } from '../types/etablissement.types';
import type { ModifierEtablissementDto } from '../types/etablissement.types';
import { toast } from 'sonner';
import { encoderLogoEnBase64, formatertTailleLogo, FORMATS_LOGO_ACCEPTES, TAILLE_MAX_LOGO } from '../utils/logo-utils';

// Helper pour vérifier les permissions par section
function canEditSection(section: string, mode: 'view' | 'edit'): boolean {
    // En mode lecture seule, personne ne peut éditer par section
    if (mode === 'view') return false;
    
    const { utilisateur } = useAuthStore.getState();
    if (!utilisateur) return false;
    
    // Super Admin peut tout modifier
    if (utilisateur.role === 'SUPER_ADMIN') return true;
    
    // Sections modifiables par Chef/Admin
    const sectionsModifiables = ['informations', 'contact', 'direction', 'horaires'];
    
    return sectionsModifiables.includes(section);
}

// Helper pour vérifier si l'utilisateur peut passer en mode édition
function canGlobalEdit(): boolean {
    const { utilisateur } = useAuthStore.getState();
    if (!utilisateur) return false;
    
    // Super Admin, Chef d'établissement et Administrateur peuvent éditer
    return ['SUPER_ADMIN', 'CHEF_ETABLISSEMENT', 'ADMIN'].includes(utilisateur.role);
}

type SectionId = 'informations' | 'contact' | 'direction' | 'identifiants' | 'horaires' | 'theme' | 'parametres';

export function EtablissementEditPage() {
    const { id } = useParams({ from: '/_auth/etablissements/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/_auth/etablissements/$id' }) as { mode?: 'view' | 'edit' };
    const mode = search?.mode || 'view'; // Mode lecture seule par défaut
    
    const { data: etablissement, isLoading } = useEtablissement(id);
    const modifier = useModifierEtablissement();
    
    // Hooks pour le logo (v3.0)
    const uploadLogo = useUploadLogo();
    const supprimerLogo = useSupprimerLogo();
    const { data: logoData } = useGetLogo(id);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Logo à afficher : preview locale (après upload) OU base64 depuis backend
    const logoAffiche = logoPreview || logoData?.base64 || null;

    // État d'édition par section
    const [editingSections, setEditingSections] = useState<Record<SectionId, boolean>>({
        informations: false,
        contact: false,
        direction: false,
        identifiants: false,
        horaires: false,
        theme: false,
        parametres: false,
    });

    // Données de formulaire par section (state séparé pour chaque section)
    const [sectionData, setSectionData] = useState<Record<SectionId, Partial<ModifierEtablissementDto>>>({
        informations: {},
        contact: {},
        direction: {},
        identifiants: {},
        horaires: {},
        theme: {},
        parametres: {},
    });

    const toggleEditSection = (section: SectionId) => {
        if (editingSections[section]) {
            // Annuler : reset le formulaire de cette section uniquement
            setEditingSections(prev => ({ ...prev, [section]: false }));
            setSectionData(prev => ({ ...prev, [section]: {} }));
        } else {
            // Activer l'édition : pré-remplir avec les données actuelles
            if (etablissement) {
                setEditingSections(prev => ({ ...prev, [section]: true }));
                
                // Pré-remplissage selon la section
                const data: Partial<ModifierEtablissementDto> = {};
                
                if (section === 'informations') {
                    data.nom = etablissement.nom;
                    data.codeEtablissement = etablissement.codeEtablissement || undefined;
                    data.slogan = etablissement.slogan || undefined;
                    data.sousSysteme = etablissement.sousSysteme;
                    data.type = etablissement.type;
                } else if (section === 'contact') {
                    data.contactEmail = etablissement.contactEmail || undefined;
                    data.contactTelephone = etablissement.contactTelephone || undefined;
                    data.adresse = etablissement.adresse || undefined;
                    data.siteWeb = etablissement.siteWeb || undefined;
                    data.facebook = etablissement.facebook || undefined;
                    data.twitter = etablissement.twitter || undefined;
                } else if (section === 'direction') {
                    data.directeurNom = etablissement.directeurNom || undefined;
                    data.directeurAdjointNom = etablissement.directeurAdjointNom || undefined;
                    data.censeurNom = etablissement.censeurNom || undefined;
                    data.surveillantGeneralNom = etablissement.surveillantGeneralNom || undefined;
                } else if (section === 'identifiants') {
                    data.numeroArrete = etablissement.numeroArrete || undefined;
                    data.numeroContribuable = etablissement.numeroContribuable || undefined;
                    data.numeroCompteBancaire = etablissement.numeroCompteBancaire || undefined;
                } else if (section === 'horaires') {
                    data.heuresOuverture = etablissement.heuresOuverture || undefined;
                    data.heuresFermeture = etablissement.heuresFermeture || undefined;
                    data.effectifMax = etablissement.effectifMax || undefined;
                } else if (section === 'theme') {
                    data.couleurPrimaire = etablissement.couleurPrimaire || undefined;
                    data.couleurSecondaire = etablissement.couleurSecondaire || undefined;
                } else if (section === 'parametres') {
                    data.langueDefaut = (etablissement.langueDefaut || 'fr') as 'fr' | 'en' | 'pt';
                    data.devise = (etablissement.devise || 'XAF') as 'XAF' | 'EUR' | 'USD' | 'XOF' | 'NGN';
                    data.fuseauHoraire = etablissement.fuseauHoraire || 'Africa/Douala';
                }
                
                setSectionData(prev => ({ ...prev, [section]: data }));
            }
        }
    };

    const handleSaveSection = async (section: SectionId) => {
        try {
            const data = sectionData[section];
            await modifier.mutateAsync({ id, ...data });
            toast.success('Section modifiée avec succès');
            setEditingSections(prev => ({ ...prev, [section]: false }));
            setSectionData(prev => ({ ...prev, [section]: {} }));
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    const updateField = (section: SectionId, field: string, value: any) => {
        setSectionData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    // ==================================
    // Gestion du logo (v3.0)
    // ==================================

    const handleFileSelect = useCallback(async (file: File) => {
        try {
            // 1. Validation format et taille
            if (!FORMATS_LOGO_ACCEPTES.includes(file.type as any)) {
                toast.error('Format non supporté', {
                    description: 'Formats acceptés : PNG, JPG, WEBP, SVG',
                });
                return;
            }

            if (file.size > TAILLE_MAX_LOGO) {
                toast.error('Image trop volumineuse', {
                    description: `Taille max : 1 MB (${formatertTailleLogo(file.size)} détecté)`,
                });
                return;
            }

            // 2. Encodage en base64
            const logoEncode = await encoderLogoEnBase64(file);
            
            // 3. Preview locale immédiate
            setLogoPreview(logoEncode.base64);

            // 4. Upload au backend
            await uploadLogo.mutateAsync({
                etablissementId: id,
                logoBase64: logoEncode.base64,
            });

            toast.success('Logo uploadé', {
                description: `${file.name} (${formatertTailleLogo(file.size)})`,
            });
        } catch (error: any) {
            toast.error('Erreur upload logo', {
                description: error.message || 'Une erreur est survenue',
            });
        }
    }, [id, uploadLogo]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input pour permettre de réuploader le même fichier
        e.target.value = '';
    }, [handleFileSelect]);

    const handleSupprimerLogo = useCallback(async () => {
        try {
            await supprimerLogo.mutateAsync(id);
            setLogoPreview(null);
            toast.success('Logo supprimé');
        } catch {
            toast.error('Erreur lors de la suppression du logo');
        }
    }, [id, supprimerLogo]);

    if (isLoading) {
        return <SchoolLoading message="Chargement de l'établissement..." />;
    }

    if (!etablissement) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-[var(--color-text-secondary)]">Établissement non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/etablissements' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header avec breadcrumb et boutonModifier global */}
            <motion.div
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]" aria-label="Fil d'Ariane">
                    <button
                        onClick={() => navigate({ to: '/etablissements' })}
                        className="hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Établissements
                    </button>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-[var(--color-text-primary)] font-medium">
                        {isLoading ? 'Chargement...' : etablissement?.nom}
                    </span>
                    {mode === 'view' && (
                        <>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-[var(--color-text-secondary)]">Consultation</span>
                        </>
                    )}
                    {mode === 'edit' && (
                        <>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-[var(--color-dominant-600)]">Édition</span>
                        </>
                    )}
                </nav>

                {/* Titre et actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {logoAffiche ? (
                            <img
                                src={logoAffiche}
                                alt={`Logo ${etablissement?.nom}`}
                                className="w-16 h-16 rounded-lg object-contain border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-[var(--color-text-secondary)]" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                {!logoAffiche && <Building2 className="h-8 w-8" />}
                                {etablissement?.nom}
                            </h1>
                            {etablissement?.codeEtablissement && (
                                <p className="text-sm text-[var(--color-text-secondary)] font-mono">{etablissement.codeEtablissement}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Couleurs */}
                        {(etablissement?.couleurPrimaire || etablissement?.couleurSecondaire) && (
                            <div className="flex items-center gap-2">
                                {etablissement.couleurPrimaire && (
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] shadow-sm"
                                        style={{ backgroundColor: etablissement.couleurPrimaire }}
                                        title="Couleur principale"
                                    />
                                )}
                                {etablissement.couleurSecondaire && (
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] shadow-sm"
                                        style={{ backgroundColor: etablissement.couleurSecondaire }}
                                        title="Couleur secondaire"
                                    />
                                )}
                            </div>
                        )}
                        
                        {/* Bouton Modifier global (uniquement en mode lecture seule) */}
                        {mode === 'view' && canGlobalEdit() && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Edit className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/etablissements/$id', params: { id }, search: { mode: 'edit' } })}
                            >
                                Modifier
                            </ElisaButton>
                        )}
                        
                        {/* Bouton Retour en mode édition */}
                        {mode === 'edit' && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={() => navigate({ to: '/etablissements/$id', params: { id }, search: { mode: 'view' } })}
                            >
                                Retour à la consultation
                            </ElisaButton>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Sections de configuration */}
            <div className="space-y-6">
                <SectionCard
                    title="Informations de base"
                    icon={Building2}
                    isEditing={editingSections.informations}
                    canEdit={canEditSection('informations', mode)}
                    onToggleEdit={() => toggleEditSection('informations')}
                    onSave={() => handleSaveSection('informations')}
                    isSaving={modifier.isPending}
                >
                    {/* Zone drag & drop pour le logo (visible uniquement en mode édition) */}
                    {editingSections.informations && (
                        <div className="mb-6 p-6 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] transition-colors"
                             style={{
                                 borderColor: isDragging ? 'var(--color-dominant-500)' : undefined,
                                 backgroundColor: isDragging ? 'var(--color-dominant-50)' : undefined,
                             }}
                             onDrop={handleDrop}
                             onDragOver={handleDragOver}
                             onDragLeave={handleDragLeave}
                        >
                            <div className="flex items-start gap-6">
                                {/* Preview du logo */}
                                <div className="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex items-center justify-center overflow-hidden relative group">
                                    {logoAffiche ? (
                                        <>
                                            <img
                                                src={logoAffiche}
                                                alt="Logo preview"
                                                className="w-full h-full object-contain p-3 sm:p-4"
                                            />
                                            {/* Bouton supprimer (visible au hover) */}
                                            <button
                                                onClick={handleSupprimerLogo}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                title="Supprimer le logo"
                                                type="button"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--color-text-secondary)]" />
                                    )}
                                </div>

                                {/* Zone d'upload */}
                                <div className="flex-1 space-y-3 sm:space-y-4 pl-0 sm:pl-4">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        {logoAffiche ? 'Logo actuel' : 'Logo de l\'établissement'}
                                    </h3>
                                    
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                        onChange={handleInputChange}
                                        className="hidden"
                                        id="logo-upload-etablissement"
                                    />

                                    <div className="flex items-center gap-3">
                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            icon={<Upload className="h-4 w-4" />}
                                            onClick={() => fileInputRef.current?.click()}
                                            type="button"
                                        >
                                            {logoAffiche ? 'Changer le logo' : 'Choisir un fichier'}
                                        </ElisaButton>

                                        {logoAffiche && (
                                            <ElisaButton
                                                variant="ghost"
                                                size="sm"
                                                icon={<X className="h-4 w-4" />}
                                                onClick={handleSupprimerLogo}
                                                type="button"
                                            >
                                                Supprimer
                                            </ElisaButton>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            <strong>Formats acceptés :</strong> PNG, JPG, WEBP, SVG
                                        </p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            <strong>Taille maximale :</strong> 1 MB
                                        </p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            <strong>Recommandé :</strong> 500x500px (redimensionnement automatique)
                                        </p>
                                    </div>

                                    {/* Indicateur de chargement */}
                                    {uploadLogo.isPending && (
                                        <p className="text-xs text-[var(--color-dominant-600)] font-medium">
                                            Upload en cours...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Affichage du logo en mode lecture seule */}
                    {!editingSections.informations && logoAffiche && (
                        <div className="mb-6 flex justify-center">
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex items-center justify-center overflow-hidden">
                                <img
                                    src={logoAffiche}
                                    alt="Logo de l'établissement"
                                    className="w-full h-full object-contain p-3 sm:p-4"
                                />
                            </div>
                        </div>
                    )}

                    {editingSections.informations ? (
                        <>
                            <ElisaInput
                                label="Nom *"
                                value={sectionData.informations.nom || ''}
                                onChange={(v) => updateField('informations', 'nom', v)}
                                required
                            />
                            <ElisaInput
                                label="Code établissement"
                                value={sectionData.informations.codeEtablissement || ''}
                                onChange={(v) => updateField('informations', 'codeEtablissement', v)}
                            />
                            <ElisaInput
                                label="Slogan"
                                value={sectionData.informations.slogan || ''}
                                onChange={(v) => updateField('informations', 'slogan', v)}
                            />
                            <ElisaSelect
                                label="Sous-système"
                                value={sectionData.informations.sousSysteme || SousSysteme.FRANCOPHONE}
                                onValueChange={(v: string) => updateField('informations', 'sousSysteme', v as SousSysteme)}
                                options={Object.values(SousSysteme).map(v => ({ label: v, value: v }))}
                            />
                            <ElisaSelect
                                label="Type d'établissement"
                                value={sectionData.informations.type || TypeEtablissement.LAIC}
                                onValueChange={(v: string) => updateField('informations', 'type', v as TypeEtablissement)}
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
                </SectionCard>

                <SectionCard
                    title="Contact & Localisation"
                    icon={Building2}
                    isEditing={editingSections.contact}
                    canEdit={canEditSection('contact', mode)}
                    onToggleEdit={() => toggleEditSection('contact')}
                    onSave={() => handleSaveSection('contact')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.contact ? (
                        <>
                            <ElisaInput
                                label="Email"
                                type="email"
                                value={sectionData.contact.contactEmail || ''}
                                onChange={(v) => updateField('contact', 'contactEmail', v)}
                            />
                            <ElisaInput
                                label="Téléphone"
                                value={sectionData.contact.contactTelephone || ''}
                                onChange={(v) => updateField('contact', 'contactTelephone', v)}
                            />
                            <ElisaInput
                                label="Adresse"
                                value={sectionData.contact.adresse || ''}
                                onChange={(v) => updateField('contact', 'adresse', v)}
                            />
                            <ElisaInput
                                label="Site Web"
                                value={sectionData.contact.siteWeb || ''}
                                onChange={(v) => updateField('contact', 'siteWeb', v)}
                            />
                            <ElisaInput
                                label="Facebook"
                                value={sectionData.contact.facebook || ''}
                                onChange={(v) => updateField('contact', 'facebook', v)}
                            />
                            <ElisaInput
                                label="Twitter"
                                value={sectionData.contact.twitter || ''}
                                onChange={(v) => updateField('contact', 'twitter', v)}
                            />
                        </>
                    ) : (
                        <>
                            <Field label="Email" value={etablissement.contactEmail} />
                            <Field label="Téléphone" value={etablissement.contactTelephone} />
                            <Field label="Adresse" value={etablissement.adresse} />
                            <Field label="Site Web" value={etablissement.siteWeb} />
                            <Field label="Facebook" value={etablissement.facebook} />
                            <Field label="Twitter" value={etablissement.twitter} />
                        </>
                    )}
                </SectionCard>

                <SectionCard
                    title="Direction"
                    icon={Building2}
                    isEditing={editingSections.direction}
                    canEdit={canEditSection('direction', mode)}
                    onToggleEdit={() => toggleEditSection('direction')}
                    onSave={() => handleSaveSection('direction')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.direction ? (
                        <>
                            <ElisaInput
                                label="Directeur(trice)"
                                value={sectionData.direction.directeurNom || ''}
                                onChange={(v) => updateField('direction', 'directeurNom', v)}
                            />
                            <ElisaInput
                                label="Directeur(trice) Adjoint(e)"
                                value={sectionData.direction.directeurAdjointNom || ''}
                                onChange={(v) => updateField('direction', 'directeurAdjointNom', v)}
                            />
                            <ElisaInput
                                label="Censeur(e)"
                                value={sectionData.direction.censeurNom || ''}
                                onChange={(v) => updateField('direction', 'censeurNom', v)}
                            />
                            <ElisaInput
                                label="Surveillant(e) Général(e)"
                                value={sectionData.direction.surveillantGeneralNom || ''}
                                onChange={(v) => updateField('direction', 'surveillantGeneralNom', v)}
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
                </SectionCard>

                <SectionCard
                    title="Identifiants légaux"
                    icon={Lock}
                    isEditing={editingSections.identifiants}
                    canEdit={canEditSection('identifiants', mode)}
                    onToggleEdit={() => toggleEditSection('identifiants')}
                    onSave={() => handleSaveSection('identifiants')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.identifiants ? (
                        <>
                            <ElisaInput
                                label="Numéro d'arrêté"
                                value={sectionData.identifiants.numeroArrete || ''}
                                onChange={(v) => updateField('identifiants', 'numeroArrete', v)}
                            />
                            <ElisaInput
                                label="Numéro contribuable"
                                value={sectionData.identifiants.numeroContribuable || ''}
                                onChange={(v) => updateField('identifiants', 'numeroContribuable', v)}
                            />
                            <ElisaInput
                                label="Numéro compte bancaire"
                                value={sectionData.identifiants.numeroCompteBancaire || ''}
                                onChange={(v) => updateField('identifiants', 'numeroCompteBancaire', v)}
                            />
                        </>
                    ) : (
                        <>
                            <Field label="Numéro d'arrêté" value={etablissement.numeroArrete} />
                            <Field label="Numéro contribuable" value={etablissement.numeroContribuable} />
                            <Field label="Numéro compte bancaire" value={etablissement.numeroCompteBancaire} />
                        </>
                    )}
                </SectionCard>

                <SectionCard
                    title="Horaires & Capacité"
                    icon={Building2}
                    isEditing={editingSections.horaires}
                    canEdit={canEditSection('horaires', mode)}
                    onToggleEdit={() => toggleEditSection('horaires')}
                    onSave={() => handleSaveSection('horaires')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.horaires ? (
                        <>
                            <ElisaInput
                                label="Heures d'ouverture"
                                type="time"
                                value={sectionData.horaires.heuresOuverture || ''}
                                onChange={(v) => updateField('horaires', 'heuresOuverture', v)}
                            />
                            <ElisaInput
                                label="Heures de fermeture"
                                type="time"
                                value={sectionData.horaires.heuresFermeture || ''}
                                onChange={(v) => updateField('horaires', 'heuresFermeture', v)}
                            />
                            <ElisaInput
                                label="Effectif maximum"
                                type="number"
                                value={sectionData.horaires.effectifMax || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('horaires', 'effectifMax', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                        </>
                    ) : (
                        <>
                            <Field label="Heures d'ouverture" value={etablissement.heuresOuverture} />
                            <Field label="Heures de fermeture" value={etablissement.heuresFermeture} />
                            <Field label="Effectif maximum" value={etablissement.effectifMax} />
                            <Field label="Effectif actuel" value={etablissement.effectifActuel} />
                        </>
                    )}
                </SectionCard>

                <SectionCard
                    title="Thème & Personnalisation visuelle"
                    icon={Unlock}
                    isEditing={editingSections.theme}
                    canEdit={canEditSection('theme', mode)}
                    onToggleEdit={() => toggleEditSection('theme')}
                    onSave={() => handleSaveSection('theme')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.theme ? (
                        <>
                            <ColorPicker
                                label="Couleur primaire (dominante 60%)"
                                value={sectionData.theme.couleurPrimaire || '#28a745'}
                                onChange={(v) => updateField('theme', 'couleurPrimaire', v)}
                                hint="Couleur principale de l'établissement (sidebar, boutons, en-têtes)"
                                presetColors={['#28a745', '#007bff', '#dc3545', '#6f42c1', '#fd7e14', '#20c997']}
                            />
                            <ColorPicker
                                label="Couleur secondaire (accent 30%)"
                                value={sectionData.theme.couleurSecondaire || '#ffc107'}
                                onChange={(v) => updateField('theme', 'couleurSecondaire', v)}
                                hint="Couleur d'accentuation (badges, highlights, éléments secondaires)"
                                presetColors={['#ffc107', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#f39c12']}
                            />
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Couleur primaire</p>
                                <div className="flex items-center gap-3 mt-2">
                                    {etablissement.couleurPrimaire ? (
                                        <>
                                            <div
                                                className="w-12 h-12 rounded-lg border-2 border-[var(--color-border)] shadow-sm"
                                                style={{ backgroundColor: etablissement.couleurPrimaire }}
                                            />
                                            <p className="text-base text-[var(--color-text-primary)] font-mono uppercase">
                                                {etablissement.couleurPrimaire}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-secondary)] italic">
                                            Non définie
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Couleur secondaire</p>
                                <div className="flex items-center gap-3 mt-2">
                                    {etablissement.couleurSecondaire ? (
                                        <>
                                            <div
                                                className="w-12 h-12 rounded-lg border-2 border-[var(--color-border)] shadow-sm"
                                                style={{ backgroundColor: etablissement.couleurSecondaire }}
                                            />
                                            <p className="text-base text-[var(--color-text-primary)] font-mono uppercase">
                                                {etablissement.couleurSecondaire}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-secondary)] italic">
                                            Non définie
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard
                    title="Paramètres régionaux"
                    icon={Unlock}
                    isEditing={editingSections.parametres}
                    canEdit={canEditSection('parametres', mode)}
                    onToggleEdit={() => toggleEditSection('parametres')}
                    onSave={() => handleSaveSection('parametres')}
                    isSaving={modifier.isPending}
                >
                    {editingSections.parametres ? (
                        <>
                            <ElisaSelect
                                label="Langue par défaut"
                                value={sectionData.parametres.langueDefaut || etablissement.langueDefaut || 'fr'}
                                onValueChange={(v: string) => updateField('parametres', 'langueDefaut', v)}
                                options={[
                                    { label: '🇫🇷 Français', value: 'fr' },
                                    { label: '🇬🇧 English', value: 'en' },
                                    { label: '🇵🇹 Português', value: 'pt' },
                                ]}
                            />
                            <ElisaSelect
                                label="Devise monétaire"
                                value={sectionData.parametres.devise || etablissement.devise || 'XAF'}
                                onValueChange={(v: string) => updateField('parametres', 'devise', v)}
                                options={[
                                    { label: '🇨🇲 XAF - Franc CBEAC', value: 'XAF' },
                                    { label: '🇸🇳 XOF - Franc BCEAO', value: 'XOF' },
                                    { label: '🇪🇺 EUR - Euro', value: 'EUR' },
                                    { label: '🇺🇸 USD - Dollar US', value: 'USD' },
                                    { label: '🇳🇬 NGN - Naira', value: 'NGN' },
                                ]}
                            />
                            <ElisaInput
                                label="Fuseau horaire"
                                value={sectionData.parametres.fuseauHoraire || etablissement.fuseauHoraire || 'Africa/Douala'}
                                onChange={(v) => updateField('parametres', 'fuseauHoraire', v)}
                                placeholder="Africa/Douala"
                            />
                            <div className="col-span-2 text-xs text-[var(--color-text-secondary)] mt-2">
                                <p>Format IANA timezone (ex: Africa/Douala, Africa/Lagos, Europe/Paris)</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Field 
                                label="Langue par défaut" 
                                value={etablissement.langueDefaut === 'fr' ? '🇫🇷 Français' : etablissement.langueDefaut === 'en' ? '🇬🇧 English' : '🇵🇹 Português'} 
                            />
                            <Field 
                                label="Devise monétaire" 
                                value={etablissement.devise === 'XAF' ? '🇨🇲 XAF - Franc CBEAC' : etablissement.devise === 'XOF' ? '🇸🇳 XOF - Franc BCEAO' : etablissement.devise} 
                            />
                            <Field label="Fuseau horaire" value={etablissement.fuseauHoraire} />
                            <div className="col-span-2 text-xs text-[var(--color-text-secondary)]">
                                <p>Les paramètres régionaux déterminent la langue, la devise et le fuseau horaire par défaut de l'établissement.</p>
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}

// =============================================
// COMPOSANTS RÉUTILISABLES
// =============================================

interface SectionCardProps {
    title: string;
    icon: React.ElementType;
    isEditing: boolean;
    canEdit: boolean;
    onToggleEdit: () => void;
    onSave: () => void;
    isSaving: boolean;
    children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, isEditing, canEdit, onToggleEdit, onSave, isSaving, children }: SectionCardProps) {
    return (
        <motion.div
            className="bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header de section */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]">
                        <Icon className="h-5 w-5 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
                </div>
                {canEdit && (
                    <ElisaButton
                        variant={isEditing ? 'primary' : 'outline'}
                        size="sm"
                        onClick={onToggleEdit}
                        icon={isEditing ? undefined : (isEditing ? <Save className="h-4 w-4" /> : undefined)}
                    >
                        {isEditing ? 'Annuler' : 'Modifier'}
                    </ElisaButton>
                )}
            </div>

            {/* Contenu de section */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children}
                </div>
                
                {/* Boutons d'action en mode édition */}
                {isEditing && (
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                        <ElisaButton variant="outline" onClick={onToggleEdit}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            onClick={onSave}
                            isLoading={isSaving}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Enregistrer
                        </ElisaButton>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function Field({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
            <p className="text-base text-[var(--color-text-primary)] mt-1">
                {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
            </p>
        </div>
    );
}
