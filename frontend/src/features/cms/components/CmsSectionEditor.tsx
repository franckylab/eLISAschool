/**
 * ==================================
 * eLISAschool - Éditeur de section CMS générique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Formulaire dynamique selon le type de section.
 * Utilisé dans l'éditeur de page CMS (_auth.cms.pages.$id).
 */

import { useState, useEffect } from 'react';
import { SectionType } from '../types/cms.types';
import type { CmsSection } from '../types/cms.types';
import { TypeMedia } from '../types/cms.types';
import { CmsMediaUpload } from './CmsMediaUpload';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Image, Type, BarChart3, Users, MessageSquare, MapPin, HelpCircle, Rocket, Download, Clock, Link2, Code, Columns, Minus, Play, FileText, ShoppingBag, Newspaper } from 'lucide-react';

interface CmsSectionEditorProps {
    section: CmsSection;
    onSave: (data: Partial<CmsSection>) => void;
    onCancel: () => void;
}

// Configuration des champs par type de section
const SECTION_CONFIG: Record<SectionType, { label: string; icone: React.ReactNode; champs: ChampConfig[] }> = {
    [SectionType.HERO]: {
        label: 'Hero Banner',
        icone: <Image className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre principal', type: 'text', required: true },
            { key: 'sousTitre', label: 'Sous-titre', type: 'textarea' },
            { key: 'boutonTexte', label: 'Texte du bouton', type: 'text' },
            { key: 'boutonLien', label: 'Lien du bouton', type: 'text' },
            { key: 'imageFond', label: 'Image de fond (URL)', type: 'text' },
            { key: 'alignement', label: 'Alignement', type: 'select', options: ['gauche', 'centre', 'droite'] },
        ],
    },
    [SectionType.TEXTE]: {
        label: 'Texte riche',
        icone: <Type className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'contenu', label: 'Contenu HTML', type: 'richtext' },
            { key: 'alignement', label: 'Alignement', type: 'select', options: ['gauche', 'centre', 'droite'] },
        ],
    },
    [SectionType.GALERIE]: {
        label: 'Galerie',
        icone: <Image className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre de la galerie', type: 'text' },
            { key: 'medias', label: 'Médias', type: 'media_upload', multiple: true },
            { key: 'colonnes', label: 'Nombre de colonnes', type: 'select', options: ['2', '3', '4'] },
        ],
    },
    [SectionType.CARTE_INFOS]: {
        label: 'Carte infos',
        icone: <FileText className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'icone', label: 'Icône (nom Lucide)', type: 'text' },
        ],
    },
    [SectionType.TEMOIGNAGES]: {
        label: 'Témoignages',
        icone: <MessageSquare className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre de la section', type: 'text' },
            { key: 'temoignages', label: 'Témoignages (JSON)', type: 'json' },
        ],
    },
    [SectionType.CHIFFRES_CLES]: {
        label: 'Chiffres clés',
        icone: <BarChart3 className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'chiffres', label: 'Chiffres (JSON: [{valeur, label, couleur}])', type: 'json' },
        ],
    },
    [SectionType.EQUIPE]: {
        label: 'Équipe',
        icone: <Users className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'membres', label: 'Membres (JSON: [{nom, fonction, photo}])', type: 'json' },
        ],
    },
    [SectionType.FORMULAIRE]: {
        label: 'Formulaire',
        icone: <FileText className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'action', label: 'URL action formulaire', type: 'text' },
        ],
    },
    [SectionType.CARTE]: {
        label: 'Carte GPS',
        icone: <MapPin className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'latitude', label: 'Latitude', type: 'number' },
            { key: 'longitude', label: 'Longitude', type: 'number' },
            { key: 'zoom', label: 'Zoom (1-18)', type: 'number' },
        ],
    },
    [SectionType.VIDEO]: {
        label: 'Vidéo',
        icone: <Play className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'url', label: 'URL vidéo (YouTube, Vimeo...)', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
        ],
    },
    [SectionType.TELECHARGEMENTS]: {
        label: 'Téléchargements',
        icone: <Download className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'fichiers', label: 'Fichiers (JSON: [{nom, url, taille}])', type: 'json' },
        ],
    },
    [SectionType.ACTUALITES]: {
        label: 'Actualités',
        icone: <Newspaper className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'nombre', label: 'Nombre d\'articles', type: 'number' },
        ],
    },
    [SectionType.HORAIRES]: {
        label: 'Horaires',
        icone: <Clock className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'horaires', label: 'Horaires (JSON: [{jour, ouverture, fermeture}])', type: 'json' },
        ],
    },
    [SectionType.PARTENAIRES]: {
        label: 'Partenaires',
        icone: <ShoppingBag className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'partenaires', label: 'Partenaires (JSON: [{nom, logo, url}])', type: 'json' },
        ],
    },
    [SectionType.FAQ]: {
        label: 'FAQ',
        icone: <HelpCircle className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text' },
            { key: 'questions', label: 'Questions (JSON: [{question, reponse}])', type: 'json' },
        ],
    },
    [SectionType.APPEL_ACTION]: {
        label: 'Appel à l\'action',
        icone: <Rocket className="h-4 w-4" />,
        champs: [
            { key: 'titre', label: 'Titre', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'boutonTexte', label: 'Texte du bouton', type: 'text' },
            { key: 'boutonLien', label: 'Lien du bouton', type: 'text' },
            { key: 'arrierePlan', label: 'Couleur arrière-plan', type: 'color' },
        ],
    },
    [SectionType.SEPARATEUR]: {
        label: 'Séparateur',
        icone: <Minus className="h-4 w-4" />,
        champs: [
            { key: 'style', label: 'Style', type: 'select', options: ['ligne', 'pointilles', 'espace'] },
            { key: 'epaisseur', label: 'Épaisseur (px)', type: 'number' },
        ],
    },
    [SectionType.HTML_CUSTOM]: {
        label: 'HTML custom',
        icone: <Code className="h-4 w-4" />,
        champs: [
            { key: 'html', label: 'Code HTML', type: 'richtext' },
        ],
    },
};

interface ChampConfig {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'richtext' | 'json' | 'media_upload';
    required?: boolean;
    options?: string[];
    multiple?: boolean;
}

export function CmsSectionEditor({ section, onSave, onCancel }: CmsSectionEditorProps) {
    const config = SECTION_CONFIG[section.type] || SECTION_CONFIG[SectionType.TEXTE];
    const [formValues, setFormValues] = useState<Record<string, any>>(section.contenu || {});
    const [titre, setTitre] = useState(section.titre || '');
    const [visible, setVisible] = useState(section.visible);

    const handleChange = (key: string, value: any) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave({
            titre,
            contenu: formValues,
            visible,
        });
    };

    const renderChamp = (champ: ChampConfig) => {
        const value = formValues[champ.key];

        switch (champ.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(champ.key, e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={champ.label}
                        required={champ.required}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleChange(champ.key, e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                        placeholder={champ.label}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => handleChange(champ.key, e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={champ.label}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => handleChange(champ.key, e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">— Sélectionner —</option>
                        {champ.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'color':
                return (
                    <ColorPicker
                        label={champ.label}
                        value={value || '#28a745'}
                        onChange={(v) => handleChange(champ.key, v)}
                    />
                );
            case 'richtext':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleChange(champ.key, e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                        placeholder="<p>Contenu HTML...</p>"
                    />
                );
            case 'json':
                return (
                    <textarea
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '[]')}
                        onChange={(e) => {
                            try {
                                handleChange(champ.key, JSON.parse(e.target.value));
                            } catch {
                                handleChange(champ.key, e.target.value);
                            }
                        }}
                        rows={5}
                        className="w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                        placeholder="[]"
                    />
                );
            case 'media_upload':
                return (
                    <CmsMediaUpload
                        onUpload={async (data) => {
                            const mediasActuels = Array.isArray(formValues.medias) ? formValues.medias : [];
                            handleChange('medias', [...mediasActuels, { ...data, id: Date.now().toString() }]);
                        }}
                        multiple={champ.multiple}
                        accept="image/*,video/*"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* En-tête */}
            <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-primary">{config.icone}</span>
                    <span className="text-sm font-semibold">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                    >
                        Enregistrer
                    </button>
                    <button
                        onClick={onCancel}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Fermer
                    </button>
                </div>
            </div>

            {/* Champs */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* Titre section */}
                <div>
                    <label className="mb-1 block text-xs font-medium opacity-70">Titre de la section</label>
                    <input
                        type="text"
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Titre affiché"
                    />
                </div>

                {/* Visibilité */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="visible"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                        className="rounded"
                    />
                    <label htmlFor="visible" className="text-xs font-medium opacity-70">Section visible</label>
                </div>

                {/* Champs dynamiques */}
                {config.champs.map(champ => (
                    <div key={champ.key}>
                        <label className="mb-1 block text-xs font-medium opacity-70">
                            {champ.label}
                            {champ.required && <span className="text-red-500"> *</span>}
                        </label>
                        {renderChamp(champ)}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Export de la config pour utilisation dans la palette de sections
export { SECTION_CONFIG };
