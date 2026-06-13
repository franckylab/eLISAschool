/**
 * ==================================
 * eLISAschool - Formulaire Classe
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerClasse, useModifierClasse } from '../hooks/use-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { Classe, CreerClasseDto, TypeClasse, CreneauHoraire } from '../types/classe.types';
import { TypeClasse as TypeClasseEnum, CreneauHoraire as CreneauHoraireEnum } from '../types/classe.types';

interface ClasseFormModalProps {
    mode: 'creation' | 'edition';
    classe?: Classe;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ClasseFormModal({ mode, classe, onSuccess, onCancel }: ClasseFormModalProps) {
    const creerClasse = useCreerClasse();
    const modifierClasse = useModifierClasse();
    const isLoading = creerClasse.isPending || modifierClasse.isPending;

    const { data: anneesScolaires } = useToutesAnneesScolaires();
    const { data: niveaux } = useTousNiveaux();
    const { data: filieres } = useToutesFilieres();

    const [formData, setFormData] = useState<Partial<CreerClasseDto>>({
        nom: classe?.nom || '',
        code: classe?.code || '',
        niveauId: classe?.niveauId || '',
        filiereId: classe?.filiereId || null,
        anneeScolaireId: classe?.anneeScolaireId || '',
        professeurPrincipalId: classe?.professeurPrincipalId || null,
        sallePrincipale: classe?.sallePrincipale || '',
        effectifMax: classe?.effectifMax || 50,
        typeClasse: classe?.typeClasse || TypeClasseEnum.NORMALE,
        creneauHoraire: classe?.creneauHoraire || CreneauHoraireEnum.MATIN,
        description: classe?.description || '',
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    // Déterminer si le niveau sélectionné est du 2nd cycle (Lycée uniquement pour les filières)
    const niveauSelectionne = niveaux?.find(n => n.id === formData.niveauId);
    const estSecondCycle = niveauSelectionne?.cycle?.code === 'LYCEE';

    useEffect(() => {
        if (classe && mode === 'edition') {
            setFormData({
                nom: classe.nom,
                code: classe.code,
                niveauId: classe.niveauId,
                filiereId: classe.filiereId || null,
                anneeScolaireId: classe.anneeScolaireId,
                professeurPrincipalId: classe.professeurPrincipalId || null,
                sallePrincipale: classe.sallePrincipale || '',
                effectifMax: classe.effectifMax,
                typeClasse: classe.typeClasse,
                creneauHoraire: classe.creneauHoraire,
                description: classe.description || '',
            });
        }
    }, [classe, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.nom?.trim()) {
            nouvellesErreurs.nom = 'Le nom de la classe est requis';
        }

        if (!formData.code?.trim()) {
            nouvellesErreurs.code = 'Le code de la classe est requis';
        }

        if (!formData.niveauId) {
            nouvellesErreurs.niveauId = 'Le niveau est requis';
        }

        if (!formData.anneeScolaireId) {
            nouvellesErreurs.anneeScolaireId = "L'année scolaire est requise";
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerClasse.mutateAsync(formData as CreerClasseDto);
            } else if (classe) {
                await modifierClasse.mutateAsync({
                    id: classe.id,
                    ...formData,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire classe:', error);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const titre = mode === 'creation' ? 'Créer une classe' : 'Modifier la classe';

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description="Renseignez les informations de la classe"
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel} type="button">
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                    >
                        {mode === 'creation' ? 'Créer' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom et Code */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Nom de la classe"
                        value={formData.nom || ''}
                        onChange={(value: any) => handleChange('nom', value)}
                        error={erreurs.nom}
                        placeholder="Ex: 6ème A"
                        required
                    />
                    <ElisaInput
                        label="Code"
                        value={formData.code || ''}
                        onChange={(value: any) => handleChange('code', value)}
                        error={erreurs.code}
                        placeholder="Ex: 6E_A"
                    />
                </div>

                {/* Niveau et Filière */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaSelect
                        label="Niveau"
                        value={formData.niveauId || ''}
                        onChange={(value: any) => handleChange('niveauId', value)}
                        error={erreurs.niveauId}
                        options={niveaux?.map(n => ({ value: n.id, label: n.nom })) || []}
                        placeholder="Sélectionner un niveau"
                        required
                    />
                    {estSecondCycle && (
                        <ElisaSelect
                            label="Filière (optionnel)"
                            value={formData.filiereId || ''}
                            onChange={(value: any) => handleChange('filiereId', value || null)}
                            options={filieres?.map(f => ({ value: f.id, label: `${f.nom} (${f.code})` })) || []}
                            placeholder="Sélectionner une filière"
                        />
                    )}
                </div>

                {/* Type de classe et Créneau horaire */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaSelect
                        label="Type de classe"
                        value={formData.typeClasse || TypeClasseEnum.NORMALE}
                        onChange={(value: any) => handleChange('typeClasse', value as TypeClasse)}
                        options={[
                            { value: TypeClasseEnum.NORMALE, label: 'Normale' },
                            { value: TypeClasseEnum.BILINGUE, label: 'Bilingue' },
                            { value: TypeClasseEnum.RENFORCEE, label: 'Renforcée' },
                            { value: TypeClasseEnum.INTERNATIONALE, label: 'Internationale' },
                        ]}
                    />
                    <ElisaSelect
                        label="Créneau horaire"
                        value={formData.creneauHoraire || CreneauHoraireEnum.MATIN}
                        onChange={(value: any) => handleChange('creneauHoraire', value as CreneauHoraire)}
                        options={[
                            { value: CreneauHoraireEnum.MATIN, label: 'Matin' },
                            { value: CreneauHoraireEnum.APRES_MIDI, label: 'Après-midi' },
                            { value: CreneauHoraireEnum.JOURNEE_COMPLETE, label: 'Journée complète' },
                        ]}
                    />
                </div>

                {/* Année scolaire et Salle */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaSelect
                        label="Année scolaire"
                        value={formData.anneeScolaireId || ''}
                        onChange={(value: any) => handleChange('anneeScolaireId', value)}
                        error={erreurs.anneeScolaireId}
                        options={anneesScolaires?.map(a => ({
                            value: a.id,
                            label: `${a.libelle} (${a.enCours ? 'En cours' : 'Cloturée'})`
                        })) || []}
                        placeholder="Sélectionner une année"
                        required
                    />
                    <ElisaInput
                        label="Salle principale"
                        value={formData.sallePrincipale || ''}
                        onChange={(value: any) => handleChange('sallePrincipale', value)}
                        placeholder="Ex: Salle 101"
                    />
                </div>

                {/* Effectif max */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Effectif maximal"
                        type="number"
                        value={formData.effectifMax?.toString() || '50'}
                        onChange={(value: any) => handleChange('effectifMax', parseInt(value))}
                        min="1"
                        max="100"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optionnel)
                    </label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Description ou remarques spécifiques..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>
            </form>
        </CustomModal>
    );
}
