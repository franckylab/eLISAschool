/**
 * ==================================
 * eLISAschool - Landing Page
 * ==================================
 * Page marketing : Hero, Features, Modules, Testimonials, Pricing, Footer
 */

import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    GraduationCap,
    Users,
    BookOpen,
    CreditCard,
    Calendar,
    MessageSquare,
    Bus,
    Library,
    ClipboardList,
    BarChart3,
    Shield,
    Globe,
    Smartphone,
    ChevronRight,
    Star,
    CheckCircle2,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { ElisaLogo } from '@/components/branding';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
};

const FEATURES = [
    { icon: Users, title: 'Gestion des élèves', desc: 'Inscriptions, profils, suivi scolaire complet' },
    { icon: GraduationCap, title: 'Gestion des enseignants', desc: 'Affectations, emplois du temps, évaluations' },
    { icon: BookOpen, title: 'Pédagogie', desc: 'Classes, matières, programmes, cahiers de texte' },
    { icon: ClipboardList, title: 'Évaluations', desc: 'Notes, bulletins, moyennes automatiques' },
    { icon: CreditCard, title: 'Finances', desc: 'Frais scolaires, paiements, relances automatiques' },
    { icon: Calendar, title: 'Planning', desc: 'Emplois du temps, examens, événements' },
    { icon: MessageSquare, title: 'Communication', desc: 'Messagerie, annonces, notifications parents' },
    { icon: Bus, title: 'Transport', desc: 'Gestion des trajets, véhicules, chauffeurs' },
    { icon: Library, title: 'Bibliothèque', desc: 'Catalogue, emprunts, gestion des ouvrages' },
    { icon: BarChart3, title: 'Tableaux de bord', desc: 'Statistiques temps réel, rapports personnalisés' },
    { icon: Shield, title: 'Sécurité', desc: 'Rôles, permissions, audit trail, 2FA' },
    { icon: Globe, title: 'Multi-langue', desc: 'Interface FR/EN, formats locaux adaptés' },
];

const MODULES = [
    { name: 'Élèves', icon: Users, category: 'Académique' },
    { name: 'Enseignants', icon: GraduationCap, category: 'Académique' },
    { name: 'Classes', icon: BookOpen, category: 'Académique' },
    { name: 'Notes & Évaluations', icon: ClipboardList, category: 'Académique' },
    { name: 'Emploi du temps', icon: Calendar, category: 'Académique' },
    { name: 'Finances', icon: CreditCard, category: 'Administration' },
    { name: 'Communication', icon: MessageSquare, category: 'Administration' },
    { name: 'Transport', icon: Bus, category: 'Logistique' },
    { name: 'Bibliothèque', icon: Library, category: 'Logistique' },
];

export function LandingPage() {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-screen bg-[var(--color-fond)]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-[var(--color-bordure)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="transition-transform hover:scale-105">
                        <ElisaLogo variant="horizontal" size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link to="/login">
                            <ElisaButton variant="ghost" size="sm">
                                {t('boutons.connecter')}
                            </ElisaButton>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dominante)]/5 via-transparent to-[var(--color-accent)]/5" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="mx-auto max-w-3xl text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-texte)] sm:text-5xl lg:text-6xl">
                            La gestion scolaire{' '}
                            <span className="text-[var(--color-dominante)]">simplifiée</span>
                        </h1>
                        <p className="mt-6 text-lg text-[var(--color-texte-secondaire)] sm:text-xl">
                            eLISAschool centralise toute la vie de votre établissement dans une plateforme
                            moderne, intuitive et sécurisée. De l'inscription au bulletin, en un clic.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link to="/login">
                                <ElisaButton variant="primary" size="lg" iconRight={<ChevronRight className="h-5 w-5" />}>
                                    Commencer maintenant
                                </ElisaButton>
                            </Link>
                            <ElisaButton variant="outline" size="lg">
                                Demander une démo
                            </ElisaButton>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20" id="features">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div className="text-center" {...fadeInUp}>
                        <h2 className="text-3xl font-bold text-[var(--color-texte)] sm:text-4xl">
                            Tout ce dont votre école a besoin
                        </h2>
                        <p className="mt-4 text-lg text-[var(--color-texte-secondaire)]">
                            Une suite complète d'outils pour gérer chaque aspect de votre établissement
                        </p>
                    </motion.div>
                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {FEATURES.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-dominante)]/30"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05, duration: 0.4 }}
                                >
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-dominante)]/10">
                                        <Icon className="h-5 w-5 text-[var(--color-dominante)]" />
                                    </div>
                                    <h3 className="font-semibold text-[var(--color-texte)]">{feature.title}</h3>
                                    <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">{feature.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Modules Section */}
            <section className="bg-[var(--color-surface)] py-20" id="modules">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div className="text-center" {...fadeInUp}>
                        <h2 className="text-3xl font-bold text-[var(--color-texte)] sm:text-4xl">
                            30+ modules intégrés
                        </h2>
                        <p className="mt-4 text-lg text-[var(--color-texte-secondaire)]">
                            Activez uniquement les modules dont vous avez besoin
                        </p>
                    </motion.div>
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {MODULES.map((mod, i) => {
                            const Icon = mod.icon;
                            return (
                                <motion.div
                                    key={mod.name}
                                    className="flex items-center gap-4 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] p-4"
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Icon className="h-8 w-8 text-[var(--color-dominante)]" />
                                    <div>
                                        <p className="font-medium text-[var(--color-texte)]">{mod.name}</p>
                                        <p className="text-xs text-[var(--color-texte-secondaire)]">{mod.category}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing placeholder */}
            <section className="py-20" id="pricing">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div className="text-center" {...fadeInUp}>
                        <h2 className="text-3xl font-bold text-[var(--color-texte)] sm:text-4xl">
                            Tarification transparente
                        </h2>
                        <p className="mt-4 text-lg text-[var(--color-texte-secondaire)]">
                            Des offres adaptées à la taille de votre établissement
                        </p>
                    </motion.div>
                    <div className="mt-12 grid gap-8 sm:grid-cols-3">
                        {[
                            { name: 'Starter', price: 'Gratuit', desc: 'Jusqu\'à 100 élèves', features: ['Modules de base', '1 utilisateur admin', 'Support communautaire'] },
                            { name: 'Pro', price: 'Sur devis', desc: 'Établissements moyens', features: ['Tous les modules', 'Utilisateurs illimités', 'Support prioritaire', 'Personnalisation'] },
                            { name: 'Enterprise', price: 'Sur devis', desc: 'Groupes scolaires', features: ['Multi-établissements', 'API complète', 'SLA garanti', 'Formation sur site'] },
                        ].map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-8 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <h3 className="text-xl font-bold text-[var(--color-texte)]">{plan.name}</h3>
                                <p className="mt-2 text-3xl font-extrabold text-[var(--color-dominante)]">{plan.price}</p>
                                <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">{plan.desc}</p>
                                <ul className="mt-6 space-y-3">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-texte)]">
                                            <CheckCircle2 className="h-4 w-4 text-[var(--color-dominante)]" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <ElisaButton
                                    variant={i === 1 ? 'primary' : 'outline'}
                                    fullWidth
                                    className="mt-8"
                                >
                                    {i === 0 ? 'Commencer' : 'Nous contacter'}
                                </ElisaButton>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--color-bordure)] bg-[var(--color-surface)] py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <ElisaLogo variant="horizontal" size="xs" showTagline />
                            <p className="mt-3 text-sm text-[var(--color-texte-secondaire)]">
                                La plateforme de gestion scolaire nouvelle génération.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--color-texte)]">Produit</h4>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--color-texte-secondaire)]">
                                <li><a href="#features" className="hover:text-[var(--color-dominante)]">Fonctionnalités</a></li>
                                <li><a href="#modules" className="hover:text-[var(--color-dominante)]">Modules</a></li>
                                <li><a href="#pricing" className="hover:text-[var(--color-dominante)]">Tarifs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--color-texte)]">Support</h4>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--color-texte-secondaire)]">
                                <li><a href="#" className="hover:text-[var(--color-dominante)]">Documentation</a></li>
                                <li><a href="#" className="hover:text-[var(--color-dominante)]">Contact</a></li>
                                <li><a href="#" className="hover:text-[var(--color-dominante)]">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--color-texte)]">Légal</h4>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--color-texte-secondaire)]">
                                <li><a href="#" className="hover:text-[var(--color-dominante)]">CGU</a></li>
                                <li><a href="#" className="hover:text-[var(--color-dominante)]">Confidentialité</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-[var(--color-bordure)] pt-8 text-center text-sm text-[var(--color-texte-secondaire)]">
                        © {new Date().getFullYear()} elisa°school. Tous droits réservés.
                    </div>
                </div>
            </footer>
        </div>
    );
}
