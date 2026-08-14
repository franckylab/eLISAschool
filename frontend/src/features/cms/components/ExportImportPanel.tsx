/**
 * ==================================
 * eLISAschool - Export/Import CMS JSON
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant d'export et import de pages CMS au format JSON.
 * Intégré dans la barre d'outils de l'éditeur Puck.
 */

import { useState, useRef, useCallback } from 'react';
import { Download, Upload, FileJson, AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-client';

interface ExportImportPanelProps {
    pageId: string;
    pageTitre: string;
    onImportComplete?: () => void;
    onClose?: () => void;
}

type Tab = 'export' | 'import';

export function ExportImportPanel({ pageId, pageTitre, onImportComplete, onClose }: ExportImportPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('export');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importData, setImportData] = useState<string>('');
    const [importTitre, setImportTitre] = useState('');
    const [ecraser, setEcraser] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importPreview, setImportPreview] = useState<{ sections: number; format: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==================================
    // EXPORT
    // ==================================

    const handleExport = useCallback(async (format: 'json' | 'puck') => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('access_token') || '';
            const url = `${API_BASE_URL}/cms/pages/${pageId}/export?format=${format}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Export échoué');

            const data = await response.json();
            const jsonStr = JSON.stringify(data, null, 2);

            // Télécharger le fichier
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `cms-${pageTitre.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            toast.success(`Page exportée en format ${format.toUpperCase()}`);
        } catch (err) {
            toast.error('Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    }, [pageId, pageTitre]);

    // ==================================
    // IMPORT
    // ==================================

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setParseError('Seuls les fichiers JSON sont acceptés');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setImportData(text);
            setParseError(null);

            // Parser et prévisualiser
            try {
                const parsed = JSON.parse(text);

                // Détecter le format
                let sections: any[] = [];
                let format = 'json';

                if (parsed.format === 'puck' && parsed.puckData?.content) {
                    // Format Puck
                    format = 'puck';
                    sections = parsed.puckData.content;
                    setImportTitre(parsed.pageTitre || 'Page importée');
                } else if (parsed.page && parsed.sections) {
                    // Format JSON complet
                    format = 'json';
                    sections = parsed.sections;
                    setImportTitre(parsed.page.titre || 'Page importée');
                } else if (Array.isArray(parsed)) {
                    // Array de sections direct
                    format = 'array';
                    sections = parsed;
                } else {
                    setParseError('Format JSON non reconnu. Attendu : export CMS eLISAschool.');
                    return;
                }

                setImportPreview({ sections: sections.length, format });
            } catch {
                setParseError('JSON invalide. Vérifiez le fichier.');
            }
        };
        reader.readAsText(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleImport = useCallback(async () => {
        if (!importData) return;

        setIsImporting(true);
        try {
            const parsed = JSON.parse(importData);

            // Normaliser les sections selon le format
            let sections: any[] = [];
            if (parsed.format === 'puck' && parsed.puckData?.content) {
                sections = parsed.puckData.content.map((item: any, i: number) => ({
                    type: item.type,
                    contenu: item.props || {},
                    ordre: i,
                    visible: true,
                }));
            } else if (parsed.sections) {
                sections = parsed.sections;
            } else if (Array.isArray(parsed)) {
                sections = parsed;
            }

            const token = localStorage.getItem('access_token') || '';
            const response = await fetch(`${API_BASE_URL}/cms/pages/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    titre: importTitre || 'Page importée',
                    sections,
                    ecraserExistante: ecraser,
                    statut: 'BROUILLON',
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Import échoué');
            }

            toast.success('Page importée avec succès !');
            setImportData('');
            setImportPreview(null);
            setImportTitre('');
            setEcraser(false);
            onImportComplete?.();
        } catch (err: any) {
            toast.error(err.message || 'Erreur lors de l\'import');
        } finally {
            setIsImporting(false);
        }
    }, [importData, importTitre, ecraser, onImportComplete]);

    return (
        <div className="flex flex-col gap-3 p-3">
            {/* Onglets */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                <button
                    onClick={() => setActiveTab('export')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                        ${activeTab === 'export' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Download className="h-3.5 w-3.5" />
                    Exporter
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                        ${activeTab === 'import' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Upload className="h-3.5 w-3.5" />
                    Importer
                </button>
            </div>

            {/* Export Tab */}
            {activeTab === 'export' && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-500">
                        Exportez cette page avec toutes ses sections au format JSON.
                    </p>

                    <button
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <div className="flex flex-col items-start">
                            <span>Format JSON complet</span>
                            <span className="text-[10px] text-gray-400">Page + sections + thème</span>
                        </div>
                        {isExporting && <span className="ml-auto text-xs text-gray-400">Export...</span>}
                    </button>

                    <button
                        onClick={() => handleExport('puck')}
                        disabled={isExporting}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <FileJson className="h-4 w-4 text-purple-500" />
                        <div className="flex flex-col items-start">
                            <span>Format Puck Editor</span>
                            <span className="text-[10px] text-gray-400">Compatible ré-import direct</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-500">
                        Importez une page depuis un fichier JSON exporté précédemment.
                    </p>

                    {/* Zone de drop / sélection fichier */}
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600">
                            Cliquer pour sélectionner un fichier JSON
                        </span>
                        <span className="text-[10px] text-gray-400">ou glisser-déposer ici</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>

                    {/* Erreur de parsing */}
                    {parseError && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {/* Preview import */}
                    {importPreview && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                                <Check className="h-3.5 w-3.5" />
                                Fichier valide détecté
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-green-600">
                                <div>Format : <strong>{importPreview.format.toUpperCase()}</strong></div>
                                <div>Sections : <strong>{importPreview.sections}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Titre de la page importée */}
                    {importPreview && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                Titre de la page
                            </label>
                            <input
                                type="text"
                                value={importTitre}
                                onChange={(e) => setImportTitre(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Titre de la page importée"
                            />
                        </div>
                    )}

                    {/* Option écraser */}
                    {importPreview && (
                        <label className="flex items-start gap-2 text-xs text-gray-600">
                            <input
                                type="checkbox"
                                checked={ecraser}
                                onChange={(e) => setEcraser(e.target.checked)}
                                className="mt-0.5 rounded border-gray-300"
                            />
                            <span>
                                Écraser la page existante si le slug est identique
                                <span className="block text-[10px] text-gray-400">
                                    Sinon, un suffixe numérique sera ajouté
                                </span>
                            </span>
                        </label>
                    )}

                    {/* Bouton import */}
                    {importPreview && (
                        <button
                            onClick={handleImport}
                            disabled={isImporting || !importData}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isImporting ? (
                                <>
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Import en cours...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Importer la page
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
