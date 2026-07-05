import { useEffect, useState } from 'react';
import { Save, BookOpen } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { Matiere, CreerMatiereDto, SousSysteme } from '../types/matiere.types';

interface MatiereFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matiere?: Matiere | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function MatiereFormModal({ open, onOpenChange, matiere, onSave, isLoading }: MatiereFormModalProps) {
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [nomAnglais, setNomAnglais] = useState('');
    const [couleur, setCouleur] = useState('#3B82F6');
    const [actif, setActif] = useState(true);
    const [sousSysteme, setSousSysteme] = useState<SousSysteme | ''>('');

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (matiere) {
            setNom(matiere.nom || '');
            setCode(matiere.code || '');
            setNomAnglais(matiere.nomAnglais || '');
            setCouleur(matiere.couleur || '#3B82F6');
            setActif(matiere.actif);
            setSousSysteme(matiere.sousSysteme || '');
        } else {
            setNom('');
            setCode('');
            setNomAnglais('');
            setCouleur('#3B82F6');
            setActif(true);
            setSousSysteme('');
        }
        setErreurs({});
    }, [matiere, open]);

    const valider = (): boolean => {
        const e: Record<string, string> = {};
        if (!nom.trim()) e.nom = 'Le nom de la matière est requis';
        if (code && code.length > 50) e.code = '50 caractères maximum';
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!valider()) return;
        const data: CreerMatiereDto = {
            nom: nom.trim(),
            code: code.trim() || undefined,
            nomAnglais: nomAnglais.trim() || undefined,
            couleur,
            sousSysteme: sousSysteme || undefined,
            actif,
        };
        onSave(data);
    };

    const titre = matiere ? 'Modifier la matière' : 'Créer une matière';

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={titre}
            description={matiere ? 'Modifiez les informations de la matière' : 'Renseignez les informations de la matière'}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                    >
                        {matiere ? 'Enregistrer' : 'Créer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Nom de la matière"
                        value={nom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNom(e.target.value); if (erreurs.nom) setErreurs((p) => { const n = { ...p }; delete n.nom; return n; }); }}
                        error={erreurs.nom}
                        placeholder="Ex: Mathématiques"
                        required
                    />
                    <ElisaInput
                        label="Code"
                        value={code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                        placeholder="Ex: MATH"
                    />
                </div>

                <ElisaInput
                    label="Nom anglais"
                    value={nomAnglais}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomAnglais(e.target.value)}
                    placeholder="Ex: Mathematics"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={couleur}
                                onChange={(e) => setCouleur(e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm text-gray-600 font-mono">{couleur}</span>
                        </div>
                    </div>
                    <ElisaSelect
                        label="Sous-système"
                        value={sousSysteme}
                        onValueChange={(v: string) => setSousSysteme(v as SousSysteme | '')}
                        options={[
                            { value: '', label: 'Commun aux deux systèmes' },
                            { value: 'FRANCOPHONE', label: 'Francophone' },
                            { value: 'ANGLOPHONE', label: 'Anglophone' },
                            { value: 'BICULTUREL', label: 'Biculturel' },
                        ]}
                    />
                </div>

                <ElisaSelect
                    label="Statut"
                    value={actif ? 'true' : 'false'}
                    onValueChange={(v: string) => setActif(v === 'true')}
                    options={[
                        { value: 'true', label: 'Actif' },
                        { value: 'false', label: 'Inactif' },
                    ]}
                />

                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Les coefficients et volumes horaires se configurent par niveau et par classe dans les sections Programme et Configuration.</span>
                </div>
            </form>
        </CustomModal>
    );
}
