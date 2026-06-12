/**
 * ==================================
 * eLISAschool - Modal Formulaire Responsable Élève
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système unifié CustomModal
 */

import { useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save } from 'lucide-react';
import type { ResponsableEleve, CreerResponsableEleveDto } from '../types/responsable-eleve.types';

interface ResponsableEleveFormModalProps {
    open: boolean;
    responsable: ResponsableEleve | null;
    onClose: () => void;
    onSubmit: (dto: CreerResponsableEleveDto) => Promise<void>;
}

export function ResponsableEleveFormModal({
    open,
    responsable,
    onClose,
    onSubmit,
}: ResponsableEleveFormModalProps) {
    const isEditMode = !!responsable;

    const [utilisateurId, setUtilisateurId] = useState(responsable?.utilisateurId || '');
    const [enfantId, setEnfantId] = useState(responsable?.enfantId || '');
    const [lienParente, setLienParente] = useState(responsable?.lienParente || 'PERE');
    const [responsableLegal, setResponsableLegal] = useState(responsable?.responsableLegal ?? true);
    const [telephone, setTelephone] = useState(responsable?.telephone || '');
    const [email, setEmail] = useState(responsable?.email || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!utilisateurId) {
            newErrors.utilisateurId = 'Le responsable est requis';
        }

        if (!enfantId) {
            newErrors.enfantId = "L'élève est requis";
        }

        if (!lienParente) {
            newErrors.lienParente = 'Le lien de parenté est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        const dto: CreerResponsableEleveDto = {
            utilisateurId,
            enfantId,
            lienParente,
            responsableLegal,
            telephone: telephone || undefined,
            email: email || undefined,
        };

        try {
            await onSubmit(dto);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEditMode ? 'Modifier le responsable' : 'Nouveau responsable d\'élève'}
            description="Remplissez les informations du responsable"
            size="2xl"
            footer={<>
                <ElisaButton variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Annuler
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    icon={<Save className="h-4 w-4" />}
                >
                    {isEditMode ? 'Enregistrer' : 'Créer'}
                </ElisaButton>
            </>}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Responsable (Utilisateur) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsable <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={utilisateurId}
                        onChange={(e) => setUtilisateurId(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
                            errors.utilisateurId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        autoFocus
                    >
                        <option value="">Sélectionner un responsable</option>
                        {/* Les utilisateurs parents seront chargés dynamiquement */}
                    </select>
                    {errors.utilisateurId && (
                        <p className="text-red-500 text-xs mt-1">{errors.utilisateurId}</p>
                    )}
                </div>

                {/* Élève */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Élève <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={enfantId}
                        onChange={(e) => setEnfantId(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
                            errors.enfantId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Sélectionner un élève</option>
                        {/* Les élèves seront chargés dynamiquement */}
                    </select>
                    {errors.enfantId && (
                        <p className="text-red-500 text-xs mt-1">{errors.enfantId}</p>
                    )}
                </div>

                {/* Lien de parenté */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lien de parenté <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={lienParente}
                        onChange={(e) => setLienParente(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
                            errors.lienParente ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="PERE">Père</option>
                        <option value="MERE">Mère</option>
                        <option value="TUTEUR">Tuteur</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                    {errors.lienParente && (
                        <p className="text-red-500 text-xs mt-1">{errors.lienParente}</p>
                    )}
                </div>

                {/* Responsable légal */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="responsableLegal"
                        checked={responsableLegal}
                        onChange={(e) => setResponsableLegal(e.target.checked)}
                        className="w-4 h-4 text-[var(--color-dominante)] border-gray-300 rounded focus:ring-[var(--color-dominante)]"
                    />
                    <label htmlFor="responsableLegal" className="text-sm font-medium text-gray-700">
                        Responsable légal
                    </label>
                </div>

                {/* Téléphone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                    </label>
                    <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="responsable@email.com"
                    />
                </div>
            </form>
        </CustomModal>
    );
}
