/**
 * ==================================
 * eLISAschool - Page de Connexion
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Design moderne avec multi-identifiant, toggle password, QR scanner,
 * animations Framer Motion, et illustration scolaire
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearch, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, LogIn, Eye, EyeOff, QrCode,
    BookOpen, Users, Award,
    AlertCircle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { cn } from '@/lib/cn';
import { CustomModal } from '@/components/modals';
import { ElisaLogo } from '@/components/branding';
import { EtablissementSelectionModal } from '@/components/auth/EtablissementSelectionModal';
import apiClient from '@/lib/api-client';
import { LoginSlideshow } from './LoginSlideshow';

interface LoginForm {
    identifiant: string;
    motDePasse: string;
    seSouvenir: boolean;
}

/* ─── Configuration des images de fond ────────────── */
const BACKGROUND_IMAGES = [
    '/images/login-background.png',
    '/images/login-background-2.png',
    '/images/login-background-3.png',
    '/images/login-background-4.png',
    '/images/login-background-5.png',
    '/images/login-background-6.png',
    '/images/login-background-7.png',
    '/images/login-background-8.png',
    '/images/login-background-9.png',
    '/images/login-background-10.png',
    '/images/login-background-11.png',
    '/images/login-background-12.png',
    '/images/login-background-13.png',
    '/images/login-background-14.png',
    '/images/login-background-15.png',
    '/images/login-background-16.png',
    '/images/login-background-17.png',
    '/images/login-background-18.png',
    '/images/login-background-19.png',
    '/images/login-background-20.png',
];

const BACKGROUND_ROTATION_INTERVAL = 12000; // 12 secondes par image

/* ─── Illustration SVG scolaire animée ────────────── */
function IllustrationScolaire() {
    const [currentBgIndex, setCurrentBgIndex] = useState(0);

    // Rotation automatique des images de fond
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, BACKGROUND_ROTATION_INTERVAL);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-8 overflow-hidden">
            {/* Images de fond avec rotation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBgIndex}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    style={{
                        backgroundImage: `url('${BACKGROUND_IMAGES[currentBgIndex]}')`,
                    }}
                />
            </AnimatePresence>
            {/* Overlay dégradé pour lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a7a3a]/85 via-[#28a745]/80 to-[#20c997]/75" />
            {/* Pattern décoratif subtil */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />



            {/* Éléments flottants en arrière-plan */}
            <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                {/* Cercles décoratifs */}
                <motion.div
                    className="absolute top-[10%] left-[15%] h-24 w-24 rounded-full bg-white/10"
                    animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[20%] right-[10%] h-32 w-32 rounded-full bg-white/8"
                    animate={{ y: [0, 20, 0], scale: [1, 0.95, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-[60%] left-[10%] h-16 w-16 rounded-full bg-white/6"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.div>

            {/* Contenu principal : Logo + Slogan + Diaporama */}
            <motion.div
                className="relative z-10 flex flex-col w-full h-full max-w-4xl py-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                {/* Section supérieure : Logo et Slogan */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    {/* Icônes scolaires animées en cercle */}
                    <div className="relative h-40 w-40">
                        {/* Centre - Logo eLISAschool */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 shadow-xl backdrop-blur-sm ring-1 ring-white/20">
                                <ElisaLogo variant="icon" size="lg" theme="white" />
                            </div>
                        </motion.div>

                        {/* Orbiting icons */}
                        <motion.div
                            className="absolute top-1 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg">
                                <BookOpen className="h-5 w-5 text-white" strokeWidth={1.5} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute bottom-1 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg">
                                <Users className="h-5 w-5 text-white" strokeWidth={1.5} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute top-1/2 left-1 -translate-y-1/2"
                            animate={{ x: [0, -5, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg">
                                <Award className="h-5 w-5 text-white" strokeWidth={1.5} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute top-1/2 right-1 -translate-y-1/2"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg">
                                <Mail className="h-5 w-5 text-white" strokeWidth={1.5} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Texte descriptif / Slogan */}
                    <div className="text-center">
                        <motion.p
                            className="text-xl font-bold text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            École Intelligente
                        </motion.p>
                        <motion.p
                            className="mt-1 max-w-sm text-sm leading-relaxed text-white/70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            Gérez élèves, enseignants, finances et bien plus,
                            le tout dans une plateforme unifiée et sécurisée.
                        </motion.p>
                    </div>
                </div>

                {/* Section inférieure : Diaporama de présentation - Prend tout l'espace restant */}
                <div className="flex-1 min-h-0">
                    <LoginSlideshow />
                </div>
            </motion.div>
        </div>
    );
}

/* ─── Scanner QR Code ─────────────────────────────── */
function QRScannerModal({
    ouvert,
    onClose,
    onScan,
}: {
    ouvert: boolean;
    onClose: () => void;
    onScan: (value: string) => void;
}) {
    const { t } = useTranslation('auth');
    const scannerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    useEffect(() => {
        if (!ouvert) return;

        let scanner: any = null;

        const initScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                scanner = new Html5Qrcode('qr-reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        onScan(decodedText);
                        toast.success(t('login.scanReussi'));
                        onClose();
                    },
                    () => { /* Ignore les échecs de scan continus */ },
                );
            } catch {
                setErreur(t('login.scanEchec'));
            }
        };

        initScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [ouvert]);

    if (!ouvert) return null;

    return (
        <CustomModal
            open={ouvert}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={t('login.scannerQRTitre')}
            description={t('login.scannerQRDescription')}
            size="sm"
            draggable={false}
            resizable={false}
            minimizable={false}
            maximizable={false}
        >
            {erreur ? (
                <div className="flex flex-col items-center gap-3 py-8">
                    <AlertCircle className="h-12 w-12 text-[var(--color-error)]" />
                    <p className="text-sm text-[var(--color-texte-secondaire)]">{erreur}</p>
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-[var(--color-dominante)] px-4 py-2 text-sm font-medium text-white"
                    >
                        {t('login.arretScan')}
                    </button>
                </div>
            ) : (
                <div ref={containerRef} className="overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-dominante)]/30">
                    <div id="qr-reader" className="w-full" />
                </div>
            )}
        </CustomModal>
    );
}

/* ─── Composant principal ─────────────────────────── */
export function LoginPage() {
    const { t } = useTranslation('auth');
    const { login, isLoading, completeLogin, preLoginData, showEtablissementModal, setShowEtablissementModal } = useAuthStore();
    const router = useRouter();
    const search = useSearch({ from: '/login' }) as { redirect?: string };

    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [qrOpen, setQrOpen] = useState(false);
    const [successPulse, setSuccessPulse] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LoginForm>({
        defaultValues: { identifiant: '', motDePasse: '', seSouvenir: true },
    });

    const identifiantValue = watch('identifiant');

    /* Détection du type d'identifiant pour l'icône dynamique */
    const typeIdentifiant = useCallback((val: string): 'email' | 'matricule' | 'user' => {
        if (!val) return 'user';
        if (val.includes('@')) return 'email';
        if (/^[A-Z]{2,4}-?\d{3,}/i.test(val)) return 'matricule';
        return 'user';
    }, []);

    const iconeIdentifiant = () => {
        switch (typeIdentifiant(identifiantValue)) {
            case 'email': return <Mail className="h-4 w-4" />;
            case 'matricule': return <Award className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const onSubmit = async (data: LoginForm) => {
        setError(null);
        setSuccessPulse(false);
        try {
            // Étape 1 : Login avec validation établissements
            // Le store gère MAINTENANT la détection multi-établissements
            await login(data.identifiant, data.motDePasse);
            
            setSuccessPulse(true);

            // Étape 2 : Vérifier si modal de sélection affiché par le store
            const currentPreLoginData = useAuthStore.getState().preLoginData;
            
            if (currentPreLoginData?.requiereSelection) {
                // Multi-établissements → modal déjà affiché par le store
                toast.info('Veuillez sélectionner votre établissement');
            } else {
                // Mono-établissement → redirection directe
                toast.success(t('login.bienvenue'));
                setTimeout(() => {
                    router.navigate({ to: (search as any).redirect || '/dashboard' });
                }, 300);
            }
        } catch (err: any) {
            const code = err?.code || '';
            const message = code === 'INVALID_CREDENTIALS'
                ? t('erreurs.identifiantsInvalides')
                : code === 'ACCOUNT_LOCKED'
                ? t('erreurs.compteVerrouille')
                : code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_INACTIVE'
                ? t('erreurs.compteDesactive')
                : code === 'NO_ETABLISSEMENT'
                ? 'Aucun établissement associé à votre compte. Contactez l\'administrateur.'
                : err?.message || t('erreurs.sessionExpiree');
            setError(message);
            setSuccessPulse(false);
        }
    };

    /**
     * Callback après sélection d'établissement dans le modal
     */
    const handleEtablissementSelect = async (etablissementId: string) => {
        try {
            await completeLogin(etablissementId);
            setShowEtablissementModal(false);
            toast.success(t('login.bienvenue'));
            setTimeout(() => {
                router.navigate({ to: (search as any).redirect || '/dashboard' });
            }, 300);
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la sélection de l\'établissement');
            setShowEtablissementModal(false);
        }
    };

    const handleQRScan = useCallback((value: string) => {
        setValue('identifiant', value);
        setQrOpen(false);
    }, [setValue]);

    return (
        <div className="flex min-h-screen">
            {/* ─── Panneau gauche : Illustration avec rotation ─── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                {/* Illustration scolaire avec rotation d'images, logo, slogan et diaporama */}
                <IllustrationScolaire />

                {/* Logo en haut à gauche */}
                <div className="absolute left-8 top-8 z-20">
                    <Link to="/" className="block transition-transform hover:scale-105">
                        <ElisaLogo variant="horizontal" size="sm" theme="white" animated />
                    </Link>
                </div>
            </div>

            {/* ─── Panneau droit : Formulaire ──────────────── */}
            <div className="flex w-full flex-col lg:w-1/2 xl:w-[45%]">
                {/* Barre supérieure */}
                <div className="flex items-center justify-between px-6 py-4 sm:px-8">
                    {/* Logo mobile */}
                    <Link to="/" className="block lg:hidden">
                        <ElisaLogo variant="horizontal" size="xs" />
                    </Link>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Contenu centré */}
                <div className="flex flex-1 items-center justify-center px-6 pb-8 sm:px-8 lg:px-12">
                    <motion.div
                        className="w-full max-w-[420px]"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Titre */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-texte)]">
                                {t('login.titre')}
                            </h1>
                            <p className="mt-2 text-sm text-[var(--color-texte-secondaire)]">
                                {t('login.sousTitre')}
                            </p>
                        </motion.div>

                        {/* Formulaire */}
                        <motion.form
                            onSubmit={handleSubmit(onSubmit)}
                            className="mt-8 space-y-5"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Champ identifiant */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-texte)]">
                                    {t('login.identifiant')}
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-texte-secondaire)] transition-colors">
                                        {iconeIdentifiant()}
                                    </div>
                                    <input
                                        type="text"
                                        autoComplete="username"
                                        placeholder={t('login.identifiantPlaceholder')}
                                        className={cn(
                                            'h-12 w-full rounded-xl border bg-[var(--color-surface)] pl-11 pr-4 text-sm text-[var(--color-texte)] transition-all',
                                            'placeholder:text-[var(--color-texte-secondaire)]/50',
                                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                                            errors.identifiant
                                                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                                : 'border-[var(--color-bordure)]',
                                        )}
                                        {...register('identifiant', {
                                            required: t('erreurs.identifiantRequis'),
                                        })}
                                    />
                                </div>
                                {errors.identifiant && (
                                    <p className="flex items-center gap-1 text-xs text-[var(--color-error)]">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.identifiant.message}
                                    </p>
                                )}
                            </div>

                            {/* Champ mot de passe avec toggle */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-texte)]">
                                    {t('login.motDePasse')}
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-texte-secondaire)]">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder={t('login.motDePassePlaceholder')}
                                        className={cn(
                                            'h-12 w-full rounded-xl border bg-[var(--color-surface)] pl-11 pr-12 text-sm text-[var(--color-texte)] transition-all',
                                            'placeholder:text-[var(--color-texte-secondaire)]/50',
                                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                                            errors.motDePasse
                                                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                                : 'border-[var(--color-bordure)]',
                                        )}
                                        {...register('motDePasse', {
                                            required: t('erreurs.motDePasseRequis'),
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? t('login.masquerMotDePasse') : t('login.afficherMotDePasse')}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.motDePasse && (
                                    <p className="flex items-center gap-1 text-xs text-[var(--color-error)]">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.motDePasse.message}
                                    </p>
                                )}
                            </div>

                            {/* Message d'erreur */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -5, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" />
                                            <p className="text-sm text-[var(--color-error)]">{error}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Pulse succès */}
                            <AnimatePresence>
                                {successPulse && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <p className="text-sm font-medium text-green-700">{t('login.bienvenue')}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Options : se souvenir + mot de passe oublié */}
                            <div className="flex items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-texte-secondaire)]">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-[var(--color-bordure)] accent-[var(--color-dominante)]"
                                        {...register('seSouvenir')}
                                    />
                                    {t('login.seSouvenir')}
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-[var(--color-dominante)] transition-colors hover:text-[var(--color-dominante-hover)] hover:underline underline-offset-2"
                                >
                                    {t('login.motDePasseOublie')}
                                </Link>
                            </div>

                            {/* Bouton principal */}
                            <motion.button
                                type="submit"
                                disabled={isLoading || successPulse}
                                className={cn(
                                    'relative flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all',
                                    'bg-gradient-to-r from-[var(--color-dominante)] to-[var(--color-dominante)] shadow-lg shadow-[var(--color-dominante)]/25',
                                    'hover:shadow-xl hover:shadow-[var(--color-dominante)]/30',
                                    'disabled:cursor-not-allowed disabled:opacity-70',
                                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/40 focus:ring-offset-2',
                                )}
                                whileHover={!isLoading ? { scale: 1.01 } : {}}
                                whileTap={!isLoading ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <span>{t('login.connexionEnCours')}</span>
                                    </>
                                ) : successPulse ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>{t('login.bienvenue')}</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        <span>{t('login.boutonConnexion')}</span>
                                    </>
                                )}
                            </motion.button>

                            {/* Séparateur */}
                            <div className="relative flex items-center gap-4 py-1">
                                <div className="h-px flex-1 bg-[var(--color-bordure)]" />
                                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-texte-secondaire)]">
                                    {t('login.ou')}
                                </span>
                                <div className="h-px flex-1 bg-[var(--color-bordure)]" />
                            </div>

                            {/* Bouton QR Code */}
                            <motion.button
                                type="button"
                                onClick={() => setQrOpen(true)}
                                className={cn(
                                    'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed',
                                    'border-[var(--color-bordure)] text-[var(--color-texte-secondaire)]',
                                    'transition-all hover:border-[var(--color-dominante)]/40 hover:text-[var(--color-dominante)] hover:bg-[var(--color-dominante)]/5',
                                )}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <QrCode className="h-5 w-5" />
                                <span className="text-sm font-medium">{t('login.scannerQR')}</span>
                            </motion.button>
                        </motion.form>

                        {/* Pied de page */}
                        <motion.p
                            className="mt-8 text-center text-sm text-[var(--color-texte-secondaire)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {t('login.pasDeCompte')}{' '}
                            <span className="font-medium text-[var(--color-dominante)]">
                                {t('login.contacterAdmin')}
                            </span>
                        </motion.p>
                    </motion.div>
                </div>
            </div>

            {/* ─── Modale QR Scanner ───────────────────────── */}
            <QRScannerModal
                ouvert={qrOpen}
                onClose={() => setQrOpen(false)}
                onScan={handleQRScan}
            />

            {/* ─── NOUVEAU v3.0 : Modal de sélection d'établissement ─── */}
            {preLoginData && (
                <EtablissementSelectionModal
                    open={showEtablissementModal}
                    etablissements={preLoginData.etablissements || []}
                    onSelect={handleEtablissementSelect}
                    tokenTemporaire={preLoginData.tokenTemporaire || ''}
                    expiresIn={preLoginData.expiresIn}
                />
            )}
        </div>
    );
}
