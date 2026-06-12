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
import { useConfigurationApp, useUpdateConfigurationApp } from '../hooks/use-configuration';

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
    const { data: configResponse, isLoading } = useConfigurationApp();
    const updateConfig = useUpdateConfigurationApp();

    const config = configResponse?.data;

    const [langueDefaut, setLangueDefaut] = useState(config?.langueDefaut || 'fr');
    const [fuseauHoraire, setFuseauHoraire] = useState(config?.fuseauHoraire || 'Africa/Douala');
    const [devise, setDevise] = useState(config?.devise || 'XAF');
    const [formatDate, setFormatDate] = useState(config?.formatDate || 'DD/MM/YYYY');

    // Synchroniser avec la config chargée
    useEffect(() => {
        if (config) {
            setLangueDefaut(config.langueDefaut || 'fr');
            setFuseauHoraire(config.fuseauHoraire || 'Africa/Douala');
            setDevise(config.devise || 'XAF');
            setFormatDate(config.formatDate || 'DD/MM/YYYY');
        }
    }, [config]);

    const handleSave = async () => {
        await updateConfig.mutateAsync({
            langueDefaut,
            fuseauHoraire,
            devise,
            formatDate,
        });
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
                isLoading={updateConfig.isPending}
            >
                Enregistrer les paramètres régionaux
            </ElisaButton>
        </div>
    );
}
