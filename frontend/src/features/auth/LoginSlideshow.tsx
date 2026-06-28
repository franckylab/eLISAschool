/**
 * ==================================
 * eLISAschool - Diaporama Login
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Diaporama dynamique avec textes explicatifs, illustrations
 * et animations variées pour la page de connexion
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Shield,
    Globe,
    CreditCard,
    Bus,
    MessageSquare,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────── */

interface SlideData {
    id: number;
    titre: string;
    texte: string;
    points?: string[];
    icone: React.ElementType;
    couleur: string;
    illustration: 'students' | 'analytics' | 'security' | 'mobile' | 'global';
}

/* ─── Données des slides ──────────────────────────── */

const SLIDES: SlideData[] = [
    {
        id: 1,
        titre: 'Gestion Académique Complète',
        texte: 'Gérez les élèves, les classes, les notes et les bulletins en toute simplicité. Un système puissant et intuitif pour le suivi pédagogique.',
        points: [
            'Suivi individualisé de chaque élève',
            'Génération automatique des bulletins',
            'Historique académique complet',
            'Statistiques de performance en temps réel',
        ],
        icone: BookOpen,
        couleur: '#28a745',
        illustration: 'students',
    },
    {
        id: 2,
        titre: 'Communication Fluide',
        texte: 'Connectez enseignants, parents et administration dans un espace collaboratif unique. Fini les informations perdues !',
        points: [
            'Messagerie interne sécurisée',
            'Notifications temps réel',
            'Portail parent dédié',
            'Annonces et sondages',
        ],
        icone: MessageSquare,
        couleur: '#007bff',
        illustration: 'global',
    },
    {
        id: 3,
        titre: 'Gestion Financière Intégrée',
        texte: 'Suivez les paiements, les remises et les dépenses avec une comptabilité transparente et automatisée.',
        points: [
            'Suivi des paiements de scolarité',
            'Gestion des remises et ristournes',
            'Tableaux de bord financiers',
            'Rapports de trésorerie',
        ],
        icone: CreditCard,
        couleur: '#ffc107',
        illustration: 'analytics',
    },
    {
        id: 4,
        titre: 'Services Parascolaires',
        texte: 'Cantine, transport, matériel scolaire : gérez tous les services annexes depuis une plateforme unique.',
        points: [
            'Gestion de la cantine et menus',
            'Planification du transport',
            'Inventaire du matériel',
            'Réservation en ligne',
        ],
        icone: Bus,
        couleur: '#fd7e14',
        illustration: 'mobile',
    },
    {
        id: 5,
        titre: 'Sécurité et Contrôle',
        texte: 'Vos données sont protégées avec un chiffrement de niveau entreprise et des sauvegardes automatiques.',
        points: [
            'Chiffrement AES-256',
            'Sauvegardes automatiques',
            'Contrôle d\'accès par rôles',
            'Audit trail complet',
        ],
        icone: Shield,
        couleur: '#6f42c1',
        illustration: 'security',
    },
    {
        id: 6,
        titre: 'Multi-Établissements',
        texte: 'Gérez plusieurs établissements depuis un compte unique avec une isolation stricte des données.',
        points: [
            'Changement d\'établissement instantané',
            'Configuration personnalisée par site',
            'Rapports consolidés',
            'Administration centralisée',
        ],
        icone: Globe,
        couleur: '#20c997',
        illustration: 'global',
    },
];

/* ─── Illustrations SVG ───────────────────────────── */

function IllustrationStudents() {
    return (
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
            {/* Pupitres */}
            <motion.rect
                x="20" y="120" width="40" height="30" rx="4"
                fill="rgba(255,255,255,0.15)"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            />
            <motion.rect
                x="80" y="120" width="40" height="30" rx="4"
                fill="rgba(255,255,255,0.15)"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            />
            <motion.rect
                x="140" y="120" width="40" height="30" rx="4"
                fill="rgba(255,255,255,0.15)"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            />
            {/* Élèves */}
            {[60, 120, 180].map((x, i) => (
                <motion.g key={x} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
                    <circle cx={x} cy={90} r="15" fill="rgba(255,255,255,0.3)" />
                    <path d={`M${x - 20} 130 Q${x} 110 ${x + 20} 130`} stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
                </motion.g>
            ))}
            {/* Tableau */}
            <motion.rect
                x="40" y="30" width="120" height="50" rx="4"
                fill="rgba(255,255,255,0.2)"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            />
            <motion.text
                x="100" y="60" textAnchor="middle"
                fill="rgba(255,255,255,0.6)" fontSize="16" fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                eLISAschool
            </motion.text>
        </svg>
    );
}

function IllustrationAnalytics() {
    return (
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
            {/* Graphique barres */}
            {[30, 50, 70, 60, 90, 80, 100].map((h, i) => (
                <motion.rect
                    key={i}
                    x={25 + i * 22} y={140 - h} width="16" height={h} rx="3"
                    fill="rgba(255,255,255,0.25)"
                    initial={{ height: 0, y: 140 }}
                    animate={{ height: h, y: 140 - h }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 120 }}
                />
            ))}
            {/* Ligne de tendance */}
            <motion.path
                d="M 30 110 Q 60 90, 90 100 T 150 50"
                stroke="rgba(255,255,255,0.6)" strokeWidth="3" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 1.5 }}
            />
            {/* Points */}
            {[
                [30, 110], [60, 90], [90, 100], [120, 70], [150, 50]
            ].map(([x, y], i) => (
                <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="rgba(255,255,255,0.8)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    style={{ transformOrigin: 'center' }}
                />
            ))}
        </svg>
    );
}

function IllustrationSecurity() {
    return (
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
            {/* Bouclier */}
            <motion.path
                d="M100 20 L160 50 L160 110 Q160 150 100 180 Q40 150 40 110 L40 50 Z"
                fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="3"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
            />
            {/* Cadenas */}
            <motion.g
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <rect x="80" y="95" width="40" height="35" rx="5" fill="rgba(255,255,255,0.4)" />
                <path d="M 88 95 L 88 80 Q 100 70 112 80 L 112 95" stroke="rgba(255,255,255,0.6)" strokeWidth="3" fill="none" />
                <circle cx="100" cy="110" r="5" fill="rgba(255,255,255,0.8)" />
            </motion.g>
            {/* Particules de sécurité */}
            {[
                [50, 40], [150, 40], [50, 160], [150, 160]
            ].map(([x, y], i) => (
                <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3}
                    fill="rgba(255,255,255,0.3)"
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
                    transition={{ delay: i * 0.2, duration: 2, repeat: Infinity }}
                    style={{ transformOrigin: 'center' }}
                />
            ))}
        </svg>
    );
}

function IllustrationMobile() {
    return (
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
            {/* Téléphone */}
            <motion.rect
                x="60" y="30" width="80" height="140" rx="10"
                fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
            />
            {/* Écran */}
            <rect x="68" y="45" width="64" height="100" rx="3" fill="rgba(255,255,255,0.2)" />
            {/* Notifications */}
            {[
                [75, 55, 40],
                [75, 75, 50],
                [75, 95, 35],
            ].map(([x, y, w], i) => (
                <motion.rect
                    key={i} x={x} y={y} width={w} height="12" rx="2"
                    fill="rgba(255,255,255,0.3)"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                />
            ))}
            {/* Bouton home */}
            <circle cx="100" cy="160" r="6" fill="rgba(255,255,255,0.3)" />
        </svg>
    );
}

function IllustrationGlobal() {
    return (
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
            {/* Globe */}
            <motion.circle
                cx={100}
                cy={100}
                r={70}
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                style={{ transformOrigin: 'center' }}
            />
            {/* Lignes de latitude */}
            <ellipse cx="100" cy="100" rx="70" ry="35" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <ellipse cx="100" cy="100" rx="70" ry="0" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            {/* Lignes de longitude */}
            <ellipse cx="100" cy="100" rx="35" ry="70" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <line x1="100" y1="30" x2="100" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            {/* Points d'établissements */}
            {[
                [70, 70], [120, 80], [90, 110], [130, 120], [80, 90]
            ].map(([x, y], i) => (
                <motion.g key={i}>
                    <circle cx={x} cy={y} r="5" fill="rgba(255,255,255,0.5)" />
                    <motion.circle
                        cx={x}
                        cy={y}
                        r={8}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={1}
                        animate={{ r: [8, 12, 8], opacity: [0.5, 0, 0.5] }}
                        transition={{ delay: i * 0.3, duration: 2, repeat: Infinity }}
                        style={{ transformOrigin: 'center' }}
                    />
                </motion.g>
            ))}
        </svg>
    );
}

const ILLUSTRATIONS = {
    students: IllustrationStudents,
    analytics: IllustrationAnalytics,
    security: IllustrationSecurity,
    mobile: IllustrationMobile,
    global: IllustrationGlobal,
};

/* ─── Texte machine à écrire ──────────────────────── */

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        setDisplayed('');
        const timeout = setTimeout(() => {
            let index = 0;
            const interval = setInterval(() => {
                if (index < text.length) {
                    setDisplayed(text.slice(0, index + 1));
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, speed);
            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [text, delay, speed]);

    return <span>{displayed}</span>;
}

/* ─── Slide individuel ────────────────────────────── */

function SlideContent({ slide, isActive }: { slide: SlideData; isActive: boolean }) {
    const IllustrationComponent = ILLUSTRATIONS[slide.illustration];
    const IconComponent = slide.icone;

    return (
        <motion.div
            className="flex h-full w-full flex-col items-center justify-between overflow-y-auto scrollbar-hide"
            style={{ padding: 'clamp(0.5rem, 1.5vh, 1.5rem) clamp(0.5rem, 1.5vw, 1rem)' }}
            initial={{ opacity: 0, x: 50 }}
            animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
            {/* Section supérieure : Illustration + Icône */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ gap: 'clamp(0.375rem, 0.8vh, 0.75rem)' }}>
                {/* Illustration */}
                <motion.div
                    className="flex-shrink-0"
                    style={{ height: 'clamp(60px, 12vh, 100px)', width: 'clamp(60px, 12vh, 100px)' }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <IllustrationComponent />
                </motion.div>

                {/* Icône */}
                <motion.div
                    className="flex items-center justify-center rounded-xl shadow-lg flex-shrink-0"
                    style={{ height: 'clamp(28px, 4vh, 40px)', width: 'clamp(28px, 4vh, 40px)', backgroundColor: `${slide.couleur}30`, border: `2px solid ${slide.couleur}50` }}
                    initial={{ rotate: -180, scale: 0 }}
                    animate={isActive ? { rotate: 0, scale: 1 } : { rotate: -180, scale: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                    <IconComponent strokeWidth={2}
                                   style={{ height: 'clamp(14px, 2vh, 20px)', width: 'clamp(14px, 2vh, 20px)', color: slide.couleur }} />
                </motion.div>
            </div>

            {/* Section centrale : Titre + Texte + Points */}
            <div className="flex flex-col items-center w-full flex-1 min-h-0 justify-center" style={{ gap: 'clamp(0.375rem, 0.8vh, 0.75rem)' }}>

            {/* Titre */}
            <motion.h2
                className="text-center font-bold text-white"
                style={{ fontSize: 'clamp(1rem, 2vh + 0.5rem, 1.75rem)', marginBottom: 'clamp(0.375rem, 0.8vh, 0.625rem)' }}
                initial={{ y: -10, opacity: 0 }}
                animate={isActive ? { y: 0, opacity: 1 } : { y: -10, opacity: 0 }}
                transition={{ delay: 0.4 }}
            >
                <TypewriterText text={slide.titre} delay={500} speed={50} />
            </motion.h2>

            {/* Texte descriptif */}
            <motion.p
                className="text-center leading-relaxed text-white/85"
                style={{ fontSize: 'clamp(0.75rem, 1.5vh + 0.3rem, 1rem)', maxWidth: 'clamp(200px, 50vw, 512px)', marginBottom: 'clamp(0.5rem, 1vh, 0.875rem)' }}
                initial={{ y: 10, opacity: 0 }}
                animate={isActive ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                transition={{ delay: 0.8 }}
            >
                <TypewriterText text={slide.texte} delay={1500} speed={25} />
            </motion.p>

            {/* Points clés */}
            {slide.points && (
                <div className="w-full" style={{ maxWidth: 'clamp(200px, 50vw, 512px)' }}>
                    <div className="space-y-1.5" style={{ gap: 'clamp(0.375rem, 0.6vh, 0.5rem)' }}>
                        {slide.points.map((point, index) => (
                            <motion.div
                                key={index}
                                className="flex items-center rounded-lg bg-white/10 backdrop-blur-sm"
                                style={{ padding: 'clamp(0.375rem, 0.6vh, 0.5rem) clamp(0.625rem, 1vw, 0.875rem)', gap: 'clamp(0.375rem, 0.8vw, 0.625rem)' }}
                                initial={{ x: -30, opacity: 0 }}
                                animate={isActive ? { x: 0, opacity: 1 } : { x: -30, opacity: 0 }}
                                transition={{ delay: 2 + index * 0.15 }}
                            >
                                <motion.div
                                    className="rounded-full flex-shrink-0"
                                    style={{ height: 'clamp(6px, 0.8vh, 8px)', width: 'clamp(6px, 0.8vh, 8px)', backgroundColor: slide.couleur }}
                                    animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                    transition={{ delay: 2.2 + index * 0.15, duration: 0.5 }}
                                />
                                <span className="text-white/90 leading-relaxed"
                                      style={{ fontSize: 'clamp(0.6875rem, 1.3vh + 0.15rem, 0.875rem)' }}>
                                <TypewriterText text={point} delay={2200 + index * 150} speed={20} />
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </motion.div>
    );
}

/* ─── Composant principal ─────────────────────────── */

export function LoginSlideshow() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 40000);

        return () => clearInterval(timer);
    }, []);

    const handleNavigate = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    return (
        <div className="relative flex w-full h-full flex-col">
            {/* Slides - Utilise tout l'espace disponible */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                        <SlideContent slide={SLIDES[currentSlide]} isActive={true} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Indicateurs de navigation - En dessous des slides */}
            <div className="flex items-center justify-center gap-1 flex-shrink-0"
                 style={{ padding: 'clamp(0.25rem, 0.5vh, 0.5rem) 0' }}>
                {Array.from({ length: SLIDES.length }).map((_, index) => (
                    <motion.button
                        key={index}
                        onClick={() => handleNavigate(index)}
                        className="rounded-full transition-all"
                        style={{
                            backgroundColor: index === currentSlide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                            height: 'clamp(5px, 0.6vh, 7px)',
                            width: index === currentSlide ? 'clamp(16px, 2.5vw, 28px)' : 'clamp(5px, 0.6vh, 7px)',
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                    />
                ))}
            </div>
        </div>
    );
}
