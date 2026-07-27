import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    onSave: (data: CreerMatiereDto) => void;
    isLoading?: boolean;
}

export function MatiereFormModal({ open, onOpenChange, matiere, onSave, isLoading }: MatiereFormModalProps) {
    const { t } = useTranslation('matieres');
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
        if (!nom.trim()) e.nom = t('nomMatiereRequis');
        if (code && code.length > 50) e.code = t('max50');
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
            sousSysteme: (sousSysteme || '') as SousSysteme | undefined,
            actif,
        };
        onSave(data);
    };

    const titre = matiere ? t('modifierMatiere') : t('creerMatiere');

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={titre}
            description={matiere ? t('modifierMatiereDescription') : t('creerMatiereDescription')}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                    >
                        {matiere ? t('enregistrer') : t('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('nomMatiere')}
                        value={nom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNom(e.target.value); if (erreurs.nom) setErreurs((p) => { const n = { ...p }; delete n.nom; return n; }); }}
                        error={erreurs.nom}
                        placeholder={t('nomMatierePlaceholder')}
                        required
                    />
                    <ElisaInput
                        label={t('code')}
                        value={code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                        placeholder={t('codePlaceholder')}
                    />
                </div>

                <ElisaInput
                    label={t('nomAnglais')}
                    value={nomAnglais}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomAnglais(e.target.value)}
                    placeholder="Ex: Mathematics"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">{t('couleur')}</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={couleur}
                                onChange={(e) => setCouleur(e.target.value)}
                                className="w-12 h-10 rounded border border-border cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground font-mono">{couleur}</span>
                        </div>
                    </div>
                    <ElisaSelect
                        label={t('sousSysteme')}
                        value={sousSysteme}
                        onValueChange={(v: string) => setSousSysteme(v as SousSysteme | '')}
                        options={[
                            { value: '', label: t('communDeuxSystemes') },
                            { value: 'FRANCOPHONE', label: t('francophone') },
                            { value: 'ANGLOPHONE', label: t('anglophone') },
                            { value: 'BICULTUREL', label: t('biculturel') },
                        ]}
                    />
                </div>

                <ElisaSelect
                    label={t('statut')}
                    value={actif ? 'true' : 'false'}
                    onValueChange={(v: string) => setActif(v === 'true')}
                    options={[
                        { value: 'true', label: t('active') },
                        { value: 'false', label: t('inactive') },
                    ]}
                />

                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm text-primary">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>{t('infoCoefficients')}</span>
                </div>
            </form>
        </CustomModal>
    );
}
