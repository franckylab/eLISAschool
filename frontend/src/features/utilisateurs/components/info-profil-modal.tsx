import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Globe, FileText, Star, Bookmark } from 'lucide-react';
import { useModifierProfil, useModifierSecurite, useUploadPhoto, useDeletePhoto, useUploadPieceRecto, useUploadPieceVerso } from '../hooks/use-utilisateurs';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput, ElisaSelect } from '@/components/ui';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Utilisateur, UpdateProfilDto } from '../types/utilisateur.types';

interface InfoProfilModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    utilisateur: Utilisateur;
}

const GRID = 'grid grid-cols-1 md:grid-cols-2 gap-4';
const SECTION_TITLE = 'text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2';

export function InfoProfilModal({ open, onOpenChange, utilisateur }: InfoProfilModalProps) {
    const modifier = useModifierProfil();
    const modifierSecurite = useModifierSecurite();
    const uploadPhoto = useUploadPhoto();
    const deletePhoto = useDeletePhoto();
    const uploadRecto = useUploadPieceRecto();
    const uploadVerso = useUploadPieceVerso();
    const [formData, setFormData] = useState<UpdateProfilDto & { langue?: string }>({});
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && utilisateur) {
            const p = utilisateur.profil;
            setFormData({
                nom: utilisateur.nom || '',
                prenom: utilisateur.prenom || '',
                telephone: utilisateur.telephone || null,
                telephoneSecondaire: p?.telephoneSecondaire || null,
                genre: (p?.genre as 'M' | 'F' | 'A') || undefined,
                dateNaissance: p?.dateNaissance || null,
                lieuNaissance: p?.lieuNaissance || null,
                nationalite: p?.nationalite || null,
                adresse: p?.adresse || null,
                ville: p?.ville || null,
                quartier: p?.quartier || null,
                photoUrl: p?.photoUrl || null,
                typePieceIdentite: p?.typePieceIdentite || null,
                numeroPieceIdentite: p?.numeroPieceIdentite || null,
                notes: p?.notes || null,
                langue: utilisateur.langue || 'fr',
            });
            setErreurs({});
        }
    }, [open, utilisateur]);

    const valider = (): boolean => {
        const e: Record<string, string> = {};
        if (formData.nom !== undefined && formData.nom.length < 2) e.nom = 'Minimum 2 caractères';
        if (formData.prenom !== undefined && formData.prenom.length < 2) e.prenom = 'Minimum 2 caractères';
        if (formData.telephone && !/^\+?[0-9]{9,15}$/.test(formData.telephone)) e.telephone = 'Numéro invalide';
        if (formData.telephoneSecondaire && !/^\+?[0-9]{9,15}$/.test(formData.telephoneSecondaire)) e.telephoneSecondaire = 'Numéro invalide';
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valider()) return;
        try {
            const { langue, ...profilData } = formData;
            await modifier.mutateAsync({ id: utilisateur.id, ...profilData });
            if (langue && langue !== utilisateur.langue) {
                await modifierSecurite.mutateAsync({ id: utilisateur.id, langue });
            }
            onOpenChange(false);
        } catch {}
    };

    const set = (field: string, value: any) => {
            setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) setErreurs(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const p = utilisateur.profil;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title="Modifier le profil"
            description="Informations personnelles de l'utilisateur"
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} disabled={modifier.isPending || modifierSecurite.isPending}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton variant="primary" isLoading={modifier.isPending || modifierSecurite.isPending} onClick={handleSubmit}>
                        Enregistrer
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1 — Identité */}
                <div>
                    <h3 className={SECTION_TITLE}>
                        <User className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        Identité
                    </h3>
                    <div className={GRID}>
                        <ElisaInput label="Prénom" value={formData.prenom || ''} onChange={(e) => set('prenom', e.target.value)} error={erreurs.prenom}
                            icon={<Bookmark className="h-4 w-4" />} />
                        <ElisaInput label="Nom" value={formData.nom || ''} onChange={(e) => set('nom', e.target.value)} error={erreurs.nom}
                            icon={<Bookmark className="h-4 w-4" />} />
                        <ElisaSelect
                            label="Genre"
                            value={formData.genre || ''}
                            onValueChange={(value) => set('genre', value || undefined)}
                            placeholder="Non spécifié"
                            options={[
                                { value: 'M', label: 'Masculin' },
                                { value: 'F', label: 'Féminin' },
                                { value: 'A', label: 'Autre' },
                            ]}
                        />
                        <ElisaInput label="Date de naissance" type="date" value={formData.dateNaissance ? formData.dateNaissance.split('T')[0] : ''}
                            onChange={(e) => set('dateNaissance', e.target.value || null)} icon={<Calendar className="h-4 w-4" />} />
                        <ElisaInput label="Lieu de naissance" value={formData.lieuNaissance || ''} onChange={(e) => set('lieuNaissance', e.target.value || null)}
                            icon={<MapPin className="h-4 w-4" />} />
                        <ElisaInput label="Nationalité" value={formData.nationalite || ''} onChange={(e) => set('nationalite', e.target.value || null)}
                            icon={<Globe className="h-4 w-4" />} />
                    </div>
                </div>

                {/* Section 2 — Contact */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className={SECTION_TITLE}>
                        <Mail className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        Contact
                    </h3>
                    <div className={GRID}>
                        <ElisaInput label="Email" value={utilisateur.email} disabled icon={<Mail className="h-4 w-4" />}
                            hint="L'email se modifie dans la section sécurité" />
                        <ElisaInput label="Téléphone" type="tel" value={formData.telephone || ''}
                            onChange={(e) => set('telephone', e.target.value || null)} error={erreurs.telephone}
                            icon={<Phone className="h-4 w-4" />} />
                        <ElisaInput label="Téléphone secondaire" type="tel" value={formData.telephoneSecondaire || ''}
                            onChange={(e) => set('telephoneSecondaire', e.target.value || null)} error={erreurs.telephoneSecondaire}
                            icon={<Phone className="h-4 w-4" />} />
                    </div>
                    <div className="mt-4 space-y-4">
                        <ElisaInput label="Adresse" value={formData.adresse || ''} onChange={(e) => set('adresse', e.target.value || null)}
                            icon={<MapPin className="h-4 w-4" />} />
                        <div className={GRID}>
                            <ElisaInput label="Ville" value={formData.ville || ''} onChange={(e) => set('ville', e.target.value || null)}
                                icon={<MapPin className="h-4 w-4" />} />
                            <ElisaInput label="Quartier" value={formData.quartier || ''} onChange={(e) => set('quartier', e.target.value || null)}
                                icon={<MapPin className="h-4 w-4" />} />
                        </div>
                    </div>
                </div>

                {/* Section 3 — Photo */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className={SECTION_TITLE}>
                        <Star className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        Photo
                    </h3>
                    <div className="max-w-sm">
                        <FileUpload
                            label="Photo de profil"
                            currentUrl={p?.photoUrl}
                            currentThumbnailUrl={p?.photoThumbnail}
                            uploading={uploadPhoto.isPending}
                            icon="image"
                            onChange={(file) => {
                                if (file && utilisateur.id) {
                                    uploadPhoto.mutate({ id: utilisateur.id, file });
                                }
                            }}
                            onRemove={() => {
                                if (utilisateur.id) deletePhoto.mutate(utilisateur.id);
                            }}
                        />
                    </div>
                </div>

                {/* Section 4 — Documents */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className={SECTION_TITLE}>
                        <FileText className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        Documents
                    </h3>
                    <div className={GRID}>
                        <ElisaSelect
                            label="Type de pièce"
                            value={formData.typePieceIdentite || ''}
                            onValueChange={(value) => set('typePieceIdentite', value || null)}
                            placeholder="Non spécifié"
                            options={[
                                { value: 'CNI', label: 'CNI' },
                                { value: 'PASSEPORT', label: 'Passeport' },
                                { value: 'PERMIS', label: 'Permis de conduire' },
                                { value: 'AUTRE', label: 'Autre' },
                            ]}
                        />
                        <ElisaInput label="Numéro de pièce" value={formData.numeroPieceIdentite || ''}
                            onChange={(e) => set('numeroPieceIdentite', e.target.value || null)}
                            placeholder="Ex: 123-456-789"
                            icon={<FileText className="h-4 w-4" />} />
                    </div>
                    <div className="mt-4 space-y-4">
                        <FileUpload
                            label="Pièce d'identité (recto)"
                            currentUrl={p?.pieceRectoUrl}
                            uploading={uploadRecto.isPending}
                            icon="document"
                            onChange={(file) => {
                                if (file && utilisateur.id) {
                                    uploadRecto.mutate({ id: utilisateur.id, file });
                                }
                            }}
                        />
                        <FileUpload
                            label="Pièce d'identité (verso)"
                            currentUrl={p?.pieceVersoUrl}
                            uploading={uploadVerso.isPending}
                            icon="document"
                            onChange={(file) => {
                                if (file && utilisateur.id) {
                                    uploadVerso.mutate({ id: utilisateur.id, file });
                                }
                            }}
                        />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => set('notes', e.target.value || null)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 dark:text-gray-100 resize-y"
                            placeholder="Notes internes..."
                        />
                    </div>
                </div>

                {/* Section 5 — Langue */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className={SECTION_TITLE}>
                        <Globe className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        Langue
                    </h3>
                    <div className="max-w-xs">
                        <ElisaSelect
                            label="Langue par défaut"
                            value={formData.langue || 'fr'}
                            onValueChange={(value) => set('langue', value)}
                            options={[
                                { value: 'fr', label: 'Français' },
                                { value: 'en', label: 'English' },
                            ]}
                        />
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}