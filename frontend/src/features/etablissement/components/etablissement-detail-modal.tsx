/**
 * ==================================
 * eLISAschool - Modal Détails Établissement (Lecture seule)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Settings, BarChart3, BookOpen, GraduationCap, Users, Layers } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { useEtablissement, useEtablissementDetailStats, useEtablissementConfig } from '../hooks/use-etablissements';
import type { Etablissement } from '../types/etablissement.types';
import { cn } from '@/lib/cn';

type TabId = 'informations' | 'config' | 'statistiques';

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
    { id: 'informations', icon: Building2, label: 'Informations' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'statistiques', icon: BarChart3, label: 'Statistiques' },
];

interface EtablissementDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    etablissementId: string;
}

export function EtablissementDetailModal({ open, onOpenChange, etablissementId }: EtablissementDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabId>('informations');

    const { data: etablissement, isLoading } = useEtablissement(etablissementId);
    const { data: stats } = useEtablissementDetailStats(etablissementId);
    const { data: config } = useEtablissementConfig(etablissementId);

    if (!open) return null;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={isLoading ? 'Chargement...' : etablissement?.nom}
            description={etablissement?.codeEtablissement}
            size="3xl"
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : !etablissement ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">Établissement non trouvé</p>
            ) : (
                <div className="space-y-4">
                    {/* Header avec logo et couleurs */}
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        {etablissement.logoUrl && (
                            <img
                                src={etablissement.logoUrl}
                                alt={`Logo ${etablissement.nom}`}
                                className="w-16 h-16 rounded-lg object-contain border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1"
                            />
                        )}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{etablissement.nom}</h2>
                            {etablissement.slogan && (
                                <p className="text-sm text-gray-500 italic">{etablissement.slogan}</p>
                            )}
                        </div>
                        {(etablissement.couleurPrimaire || etablissement.couleurSecondaire) && (
                            <div className="flex items-center gap-2">
                                {etablissement.couleurPrimaire && (
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                                        style={{ backgroundColor: etablissement.couleurPrimaire }}
                                        title="Couleur principale"
                                    />
                                )}
                                {etablissement.couleurSecondaire && (
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                                        style={{ backgroundColor: etablissement.couleurSecondaire }}
                                        title="Couleur secondaire"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats rapides */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard icon={BookOpen} label="Classes" value={stats.nombreClasses} color="blue" />
                            <StatCard icon={GraduationCap} label="Élèves" value={stats.nombreEleves} color="green" />
                            <StatCard icon={Users} label="Personnel" value={stats.nombrePersonnel} color="purple" />
                            <StatCard icon={Layers} label="Taux occ." value={`${stats.tauxOccupation}%`} color="orange" />
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex flex-col gap-4">
                        <nav className="flex gap-1 overflow-x-auto">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            activeTab === tab.id
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {activeTab === 'informations' && <InformationsTab etablissement={etablissement} />}
                            {activeTab === 'config' && <ConfigTab config={config} />}
                            {activeTab === 'statistiques' && <StatistiquesTab stats={stats} />}
                        </div>
                    </div>
                </div>
            )}
        </CustomModal>
    );
}

// =============================================
// COMPONENTS
// =============================================

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    };

    return (
        <div className={cn('rounded-lg p-3', colors[color])}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}

function InformationsTab({ etablissement }: { etablissement: Etablissement }) {
    return (
        <div className="space-y-4">
            <Section title="Informations générales">
                <Field label="Nom" value={etablissement.nom} />
                <Field label="Code" value={etablissement.codeEtablissement} />
                <Field label="Sous-système" value={etablissement.sousSysteme} />
                <Field label="Type" value={etablissement.type} />
                <Field label="Statut" value={etablissement.statut} />
            </Section>

            <Section title="Contact">
                <Field label="Email" value={etablissement.contactEmail} />
                <Field label="Téléphone" value={etablissement.contactTelephone} />
                <Field label="Adresse" value={etablissement.adresse} />
            </Section>

            <Section title="Direction">
                <Field label="Directeur(trice)" value={etablissement.directeurNom} />
                <Field label="Censeur(e)" value={etablissement.censeurNom} />
            </Section>
        </div>
    );
}

function ConfigTab({ config }: { config: any }) {
    if (!config) {
        return <p className="text-gray-600 dark:text-gray-400 text-center py-4">Configuration non disponible</p>;
    }

    return (
        <div className="space-y-4">
            <Section title="Abonnement">
                <Field label="Plan" value={config.planAbonnement} />
                <Field label="Max élèves" value={config.maxEleves} />
                <Field label="Max utilisateurs" value={config.maxUtilisateurs} />
            </Section>
        </div>
    );
}

function StatistiquesTab({ stats }: { stats: any }) {
    if (!stats) {
        return <p className="text-gray-600 dark:text-gray-400 text-center py-4">Statistiques non disponibles</p>;
    }

    return (
        <div className="space-y-4">
            <Section title="Vue d'ensemble">
                <Field label="Classes" value={stats.nombreClasses} />
                <Field label="Élèves" value={stats.nombreEleves} />
                <Field label="Personnel" value={stats.nombrePersonnel} />
                <Field label="Taux d'occupation" value={`${stats.tauxOccupation}%`} />
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">{title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
            </p>
        </div>
    );
}
