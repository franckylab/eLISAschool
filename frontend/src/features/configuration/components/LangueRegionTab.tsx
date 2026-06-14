/**
 * ==================================
 * eLISAschool - Tab Langue & Région
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Globe, Clock, DollarSign, Calendar } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useParametres, useModifierParametre } from '../hooks/use-configuration';

const LANGUES = [
    { code: 'fr', nom: 'Français' },
    { code: 'en', nom: 'English' },
    { code: 'es', nom: 'Español' },
];

const FUSEAUX_HORAIRES = [
    { valeur: 'Africa/Douala', label: 'Afrique/Douala (UTC+1)' },
    { valeur: 'Africa/Paris', label: 'Europe/Paris (UTC+1)' },
    { valeur: 'America/New_York', label: 'Amérique/New York (UTC-5)' },
    { valeur: 'Asia/Tokyo', label: 'Asie/Tokyo (UTC+9)' },
];

const DEVISES = [
    { code: 'XAF', symbole: 'FCFA', nom: 'Franc CFA' },
    { code: 'EUR', symbole: '€', nom: 'Euro' },
    { code: 'USD', symbole: '$', nom: 'Dollar US' },
    { code: 'GBP', symbole: '£', nom: 'Livre Sterling' },
];

const FORMATS_DATE = [
    { valeur: 'DD/MM/YYYY', label: '31/12/2024' },
    { valeur: 'MM/DD/YYYY', label: '12/31/2024' },
    { valeur: 'YYYY-MM-DD', label: '2024-12-31' },
];

export function LangueRegionTab() {
    // Charger les paramètres régionaux
    const { data: paramsResponse, isLoading } = useParametres({
        categorie: 'REGIONAL',
        limit: 100,
    });
    const modifierParametre = useModifierParametre();

    // Extraire les valeurs des paramètres
    const params = paramsResponse?.data || [];
    const getParamValue = (cle: string, defaultValue: string) => {
        const param = params.find(p => p.cle === `app.${cle}`);
        return param ? param.valeur : defaultValue;
    };

    const [langueDefaut, setLangueDefaut] = useState(getParamValue('langue_defaut', 'fr'));
    const [fuseauHoraire, setFuseauHoraire] = useState(getParamValue('fuseau_horaire', 'Africa/Douala'));
    const [devise, setDevise] = useState(getParamValue('devise', 'XAF'));
    const [formatDate, setFormatDate] = useState(getParamValue('format_date', 'DD/MM/YYYY'));

    // Synchroniser avec les paramètres chargés
    useEffect(() => {
        if (params.length > 0) {
            setLangueDefaut(getParamValue('langue_defaut', 'fr'));
            setFuseauHoraire(getParamValue('fuseau_horaire', 'Africa/Douala'));
            setDevise(getParamValue('devise', 'XAF'));
            setFormatDate(getParamValue('format_date', 'DD/MM/YYYY'));
        }
    }, [params]);

    const handleSave = async () => {
        // Mettre à jour chaque paramètre
        const paramUpdates = [
            { cle: 'app.langue_defaut', valeur: JSON.stringify(langueDefaut) },
            { cle: 'app.fuseau_horaire', valeur: JSON.stringify(fuseauHoraire) },
            { cle: 'app.devise', valeur: JSON.stringify(devise) },
            { cle: 'app.format_date', valeur: JSON.stringify(formatDate) },
        ];

        for (const update of paramUpdates) {
            const param = params.find(p => p.cle === update.cle);
            if (param) {
                await modifierParametre.mutateAsync({
                    id: param.id,
                    valeur: update.valeur,
                });
            }
        }
    };

    if (isLoading) {
        return <div className="py-8 text-center">Chargement...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    Langue & Région
                </h2>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    Configurez la langue, le fuseau horaire et les formats régionaux
                </p>
            </div>

            {/* Langue par défaut */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-texte)] mb-2">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Langue par défaut
                </label>
                <select
                    value={langueDefaut}
                    onChange={(e) => setLangueDefaut(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                >
                    {LANGUES.map((langue) => (
                        <option key={langue.code} value={langue.code}>
                            {langue.nom}
                        </option>
                    ))}
                </select>
            </div>

            {/* Fuseau horaire */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-texte)] mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Fuseau horaire
                </label>
                <select
                    value={fuseauHoraire}
                    onChange={(e) => setFuseauHoraire(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                >
                    {FUSEAUX_HORAIRES.map((fuseau) => (
                        <option key={fuseau.valeur} value={fuseau.valeur}>
                            {fuseau.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Devise */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-texte)] mb-2">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Devise
                </label>
                <select
                    value={devise}
                    onChange={(e) => setDevise(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                >
                    {DEVISES.map((devise) => (
                        <option key={devise.code} value={devise.code}>
                            {devise.nom} ({devise.symbole})
                        </option>
                    ))}
                </select>
            </div>

            {/* Format de date */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-texte)] mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Format de date
                </label>
                <select
                    value={formatDate}
                    onChange={(e) => setFormatDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                >
                    {FORMATS_DATE.map((format) => (
                        <option key={format.valeur} value={format.valeur}>
                            {format.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bouton sauvegarder */}
            <ElisaButton
                variant="primary"
                onClick={handleSave}
                isLoading={modifierParametre.isPending}
            >
                Enregistrer les paramètres régionaux
            </ElisaButton>
        </div>
    );
}
