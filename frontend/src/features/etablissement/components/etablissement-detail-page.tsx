/**
 * ==================================
 * eLISAschool - Page Détails Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, GraduationCap, BookOpen, Layers, Settings, BarChart3 } from 'lucide-react';
import { useEtablissement, useEtablissementDetailStats, useEtablissementConfig } from '../hooks/use-etablissements';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { cn } from '@/lib/cn';

type TabId = 'informations' | 'config' | 'statistiques';

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
    { id: 'informations', icon: Building2, label: 'Informations' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'statistiques', icon: BarChart3, label: 'Statistiques' },
];

export function EtablissementDetailPage() {
    const { id } = useParams({ from: '/etablissements/$id' });
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('informations');

    const { data: etablissement, isLoading } = useEtablissement(id);
    const { data: stats } = useEtablissementDetailStats(id);
    const { data: config } = useEtablissementConfig(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!etablissement) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-600">Établissement non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/etablissements' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => navigate({ to: '/etablissements' })}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        {etablissement.nom}
                    </h1>
                    {etablissement.codeEtablissement && (
                        <p className="text-sm text-gray-500 font-mono">{etablissement.codeEtablissement}</p>
                    )}
                </div>
            </motion.div>

            {/* Stats rapides */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Classes"
                        value={stats.nombreClasses}
                        color="blue"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Élèves"
                        value={stats.nombreEleves}
                        color="green"
                    />
                    <StatCard
                        icon={Users}
                        label="Personnel"
                        value={stats.nombrePersonnel}
                        color="purple"
                    />
                    <StatCard
                        icon={Layers}
                        label="Taux occupation"
                        value={`${stats.tauxOccupation}%`}
                        color="orange"
                    />
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-col gap-6 lg:flex-row">
                <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
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
                <div className="flex-1">
                    {activeTab === 'informations' && <InformationsTab etablissement={etablissement} />}
                    {activeTab === 'config' && <ConfigTab config={config} />}
                    {activeTab === 'statistiques' && <StatistiquesTab stats={stats} />}
                </div>
            </div>
        </div>
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
        <div className={cn('rounded-lg p-4', colors[color])}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function InformationsTab({ etablissement }: { etablissement: any }) {
    return (
        <div className="space-y-6">
            <Section title="Informations générales">
                <Field label="Nom" value={etablissement.nom} />
                <Field label="Code" value={etablissement.codeEtablissement} />
                <Field label="Slogan" value={etablissement.slogan} />
                <Field label="Sous-système" value={etablissement.sousSysteme} />
                <Field label="Type" value={etablissement.type} />
                <Field label="Statut" value={etablissement.statut} />
            </Section>

            <Section title="Identification légale">
                <Field label="N° Arrêté" value={etablissement.numeroArrete} />
                <Field label="N° Contribuable" value={etablissement.numeroContribuable} />
                <Field label="N° Compte Bancaire" value={etablissement.numeroCompteBancaire} />
            </Section>

            <Section title="Contact">
                <Field label="Email" value={etablissement.contactEmail} />
                <Field label="Téléphone" value={etablissement.contactTelephone} />
                <Field label="Adresse" value={etablissement.adresse} />
                <Field label="Site Web" value={etablissement.siteWeb} />
                <Field label="Facebook" value={etablissement.facebook} />
                <Field label="Twitter" value={etablissement.twitter} />
            </Section>

            <Section title="Horaires et Capacité">
                <Field label="Heure d'ouverture" value={etablissement.heuresOuverture} />
                <Field label="Heure de fermeture" value={etablissement.heuresFermeture} />
                <Field label="Effectif actuel" value={etablissement.effectifActuel} />
                <Field label="Effectif maximum" value={etablissement.effectifMax} />
            </Section>

            <Section title="Direction">
                <Field label="Directeur(trice)" value={etablissement.directeurNom} />
                <Field label="Directeur(trice) Adjoint(e)" value={etablissement.directeurAdjointNom} />
                <Field label="Censeur(e)" value={etablissement.censeurNom} />
                <Field label="Surveillant(e) Général(e)" value={etablissement.surveillantGeneralNom} />
            </Section>
        </div>
    );
}

function ConfigTab({ config }: { config: any }) {
    if (!config) {
        return <p className="text-gray-600">Configuration non disponible</p>;
    }

    return (
        <div className="space-y-6">
            <Section title="Cycles actifs">
                <Field label="Nombre de cycles" value={config.cyclesActifs?.length || 0} />
                <Field label="Cycles" value={config.cyclesActifs?.join(', ')} />
            </Section>

            <Section title="Thème">
                <Field label="Couleur primaire" value={config.couleurPrimaire} />
                <Field label="Couleur secondaire" value={config.couleurSecondaire} />
                <Field label="Couleur accent" value={config.couleurAccent} />
                <Field label="Thème" value={config.theme} />
            </Section>

            <Section title="Paramètres régionaux">
                <Field label="Langue" value={config.langueDefaut} />
                <Field label="Devise" value={config.devise} />
                <Field label="Fuseau horaire" value={config.fuseauHoraire} />
            </Section>

            <Section title="Abonnement">
                <Field label="Plan" value={config.planAbonnement} />
                <Field label="Max élèves" value={config.maxEleves} />
                <Field label="Max utilisateurs" value={config.maxUtilisateurs} />
                <Field label="Max classes" value={config.maxClasses} />
                <Field label="Stockage max (MB)" value={config.stockageMaxMB} />
                <Field label="Expiration" value={config.dateExpirationAbonnement} />
            </Section>
        </div>
    );
}

function StatistiquesTab({ stats }: { stats: any }) {
    if (!stats) {
        return <p className="text-gray-600">Statistiques non disponibles</p>;
    }

    return (
        <div className="space-y-6">
            <Section title="Vue d'ensemble">
                <Field label="Classes" value={stats.nombreClasses} />
                <Field label="Élèves" value={stats.nombreEleves} />
                <Field label="Personnel" value={stats.nombrePersonnel} />
                <Field label="Niveaux" value={stats.nombreNiveaux} />
                <Field label="Taux d'occupation" value={`${stats.tauxOccupation}%`} />
            </Section>

            <Section title="Configuration">
                <Field label="Cycles actifs" value={stats.config?.cyclesActifs} />
                <Field label="Modules actifs" value={stats.config?.modulesActifs} />
                <Field label="Plan d'abonnement" value={stats.config?.planAbonnement} />
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
            </p>
        </div>
    );
}
