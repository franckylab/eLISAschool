/**
 * ==================================
 * eLISAschool - Page Principale Structure Académique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page centrale qui expose tous les modules de structure académique
 * de manière structurée, logique et cohérente
 */

import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import {
    BookOpen,
    GraduationCap,
    Award,
    FileText,
    ScrollText,
    ChevronRight,
    School,
    Target,
} from 'lucide-react';

interface ModuleCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    route: string;
    color: string;
    bgColor: string;
    stats?: {
        label: string;
        value: number;
    };
}

export function StructureAcademiquePage() {
    const navigate = useNavigate();

    const modules: ModuleCard[] = [
        {
            id: 'cycles',
            title: 'Cycles Pédagogiques',
            description: 'Types et cycles d\'enseignement (Maternelle, Primaire, Secondaire 1 & 2)',
            icon: <School className="h-6 w-6" />,
            route: '/parametres/structure-academique/cycles',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            id: 'niveaux',
            title: 'Niveaux',
            description: 'Classes et niveaux (PS à Terminale, Nursery à Upper 6th)',
            icon: <BookOpen className="h-6 w-6" />,
            route: '/parametres/structure-academique/niveaux',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            id: 'filieres',
            title: 'Filières',
            description: 'Spécialités du second cycle (C, D, E, A, A1, F1, F2, F3, F4, G1, G2, H, I, K, L)',
            icon: <Award className="h-6 w-6" />,
            route: '/parametres/structure-academique/filieres',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
        },
        {
            id: 'specialites',
            title: 'Spécialités',
            description: 'Options par filière technique (Maintenance, Électrotechnique, Génie Civil, etc.)',
            icon: <BookOpen className="h-6 w-6" />,
            route: '/specialites',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
        },
        {
            id: 'examens-nationaux',
            title: 'Examens Nationaux',
            description: 'Examens officiels (CEP, BEPC, Probatoire, BAC, GCE)',
            icon: <FileText className="h-6 w-6" />,
            route: '/parametres/structure-academique/examens-nationaux',
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-950',
        },
        {
            id: 'diplomes-eleves',
            title: 'Diplômes Élèves',
            description: 'Diplômes obtenus par les élèves',
            icon: <ScrollText className="h-6 w-6" />,
            route: '/parametres/structure-academique/diplomes-eleves',
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-50 dark:bg-indigo-950',
        },
        {
            id: 'competences',
            title: 'Compétences',
            description: 'Approche Par Compétences (APC) - Référentiel de compétences par niveau et matière',
            icon: <Target className="h-6 w-6" />,
            route: '/competences',
            color: 'text-teal-600 dark:text-teal-400',
            bgColor: 'bg-teal-50 dark:bg-teal-950',
        },
    ];

    const handleNavigate = (route: string) => {
        navigate({ to: route as any });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold text-foreground">Structure Académique</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                    Configuration complète de la structure pédagogique de l'établissement
                </p>
            </motion.div>

            {/* Description */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6"
            >
                <h2 className="text-lg font-semibold text-foreground mb-2">Organisation Hiérarchique</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        Cycles
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Niveaux
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                        Filières
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                        Spécialités
                    </span>
                </div>
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                    <p>
                        <strong>Examens Nationaux</strong> → Associés aux niveaux d'examen
                    </p>
                    <p>
                        <strong>Diplômes Élèves</strong> → Enregistrement des diplômes obtenus
                    </p>
                    <p>
                        <strong>Compétences</strong> → Référentiel APC pour l'évaluation par compétences
                    </p>
                </div>
            </motion.div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module, index) => (
                    <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleNavigate(module.route)}
                        className="group cursor-pointer"
                    >
                        <div className={`h-full ${module.bgColor} border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${module.color}`}>
                                    {module.icon}
                                </div>
                                <ChevronRight className={`h-5 w-5 ${module.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </div>
                            
                            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {module.title}
                            </h3>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                                {module.description}
                            </p>

                            {module.stats && (
                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{module.stats.label}</span>
                                        <span className="font-semibold text-foreground">{module.stats.value}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-border rounded-xl p-6"
            >
                <h3 className="text-lg font-semibold text-foreground mb-4">Systèmes Supportés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <span className="text-2xl">🇫🇷</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Système Francophone</h4>
                            <p className="text-sm text-muted-foreground">
                                16 niveaux • 4 examens (CEP, BEPC, Probatoire, BAC) • 5 filières
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <span className="text-2xl">🇬🇧</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Système Anglophone</h4>
                            <p className="text-sm text-muted-foreground">
                                14 niveaux • 2 examens (GCE O Level, GCE A Level)
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6"
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <span className="text-2xl">💡</span>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">Information</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            La structure académique suit le système éducatif camerounais bilingue. 
                            Les modules doivent être configurés dans l'ordre hiérarchique : 
                            Types de Cycles → Cycles → Niveaux → Filières.
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Les examens nationaux sont automatiquement associés aux niveaux d'examen 
                            (CM2→CEP, 3ème→BEPC, 1ère→Probatoire, Terminale→BAC, Form 5→GCE OL, Upper 6th→GCE AL).
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
