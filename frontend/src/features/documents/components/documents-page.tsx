/**
 * ==================================
 * eLISAschool - Page Documents
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Download, Eye, Edit, Trash2, HardDrive, TrendingDown } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useDocuments, useSupprimerDocument, useTelechargerDocument, useStatistiquesDocuments } from '../hooks/use-documents';
import type { Document } from '../types/document.types';

export function DocumentsPage() {
    const { t } = useTranslation('documents');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState<string>('');

    const { data, isLoading, meta } = useDocuments({
        page,
        limit,
        recherche: recherche || undefined,
        categorie: filtreCategorie || undefined,
    });

    const { data: stats } = useStatistiquesDocuments();
    const supprimer = useSupprimerDocument();
    const telecharger = useTelechargerDocument();

    const categories: any = {
        pedagogique: { label: 'Pédagogique', color: 'blue', icone: FileText },
        administratif: { label: 'Administratif', color: 'purple', icone: FileText },
        financier: { label: 'Financier', color: 'green', icone: FileText },
        medical: { label: 'Médical', color: 'red', icone: FileText },
        personnel: { label: 'Personnel', color: 'orange', icone: FileText },
        autre: { label: 'Autre', color: 'gray', icone: FileText },
    };

    const formatTaille = (octets: number | undefined): string => {
        if (!octets) return '-';
        const ko = octets / 1024;
        if (ko < 1024) return `${ko.toFixed(1)} Ko`;
        const mo = ko / 1024;
        return `${mo.toFixed(1)} Mo`;
    };

    const colonnes: Column<Document>[] = [
        {
            key: 'categorie',
            header: 'Catégorie',
            className: 'text-center w-32',
            render: (d) => {
                const cat = categories[d.categorie];
                const Icone = cat?.icone || FileText;
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>
                        <Icone className="h-3 w-3" />
                        {cat?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Document',
            sortable: true,
            render: (d) => (
                <div>
                    <p className="font-medium text-gray-900">{d.titre}</p>
                    {d.description && <p className="text-xs text-gray-500 line-clamp-1">{d.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{d.typeFichier} • v{d.version || '1.0'}</p>
                </div>
            ),
        },
        {
            key: 'taille',
            header: 'Taille',
            className: 'text-center w-20',
            render: (d) => (
                <span className="text-sm font-medium text-gray-700">
                    {formatTaille(d.tailleFichier)}
                </span>
            ),
        },
        {
            key: 'uploadPar',
            header: 'Uploadé par',
            render: (d) => (
                d.uploadPar ? (
                    <div>
                        <p className="text-sm font-medium">{d.uploadPar.prenom} {d.uploadPar.nom}</p>
                        <p className="text-xs text-gray-500">{d.uploadPar.role}</p>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            ),
        },
        {
            key: 'telechargements',
            header: 'Téléchargements',
            className: 'text-center w-28',
            render: (d) => (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">{d.telechargements || 0}</span>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'w-28',
            render: (d) => (
                <span className="text-sm text-gray-700">
                    {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-40',
            render: (d) => (
                <div className="flex justify-end gap-1">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3 w-3" />}
                        onClick={() => window.alert(`Aperçu: ${d.titre}`)}
                    />
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Download className="h-3 w-3" />}
                        isLoading={telecharger.isPending}
                        onClick={() => telecharger.mutateAsync(d.id)}
                    />
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Edit className="h-3 w-3" />}
                        onClick={() => window.alert(`Modifier: ${d.titre}`)}
                    />
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3 w-3" />}
                        isLoading={supprimer.isPending}
                        onClick={() => supprimer.mutateAsync(d.id)}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => window.alert('Uploader document')}
                >
                    {t('uploader')}
                </ElisaButton>
            </motion.div>

            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total documents</p>
                                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <HardDrive className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Taille totale</p>
                                <p className="text-lg font-bold text-green-600">{formatTaille(stats.tailleTotale)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Download className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Téléchargements</p>
                                <p className="text-lg font-bold text-orange-600">{stats.totalTelechargements}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Catégories</p>
                                <p className="text-lg font-bold text-purple-600">{stats.parCategorie?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('rechercher')}
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filtreCategorie}
                    onChange={(e) => setFiltreCategorie(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Toutes les catégories</option>
                    <option value="pedagogique">Pédagogique</option>
                    <option value="administratif">Administratif</option>
                    <option value="financier">Financier</option>
                    <option value="medical">Médical</option>
                    <option value="personnel">Personnel</option>
                    <option value="autre">Autre</option>
                </select>
            </motion.div>

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                pagination={{
                    page,
                    limit,
                    total: meta?.total || 0,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
