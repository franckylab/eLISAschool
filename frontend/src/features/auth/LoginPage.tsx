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
import { useEtablissement } from '@/features/etablissement';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { cn } from '@/lib/cn';
import { CustomModal } from '@/components/modals';
import { ElisaLogo } from '@/components/branding';
import { EtablissementSelectionModal } from '@/components/auth/EtablissementSelectionModal';
import { LoginSlideshow } from './LoginSlideshow';
import { FondAnime } from '@/components/layout/fond-anime';

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
                className="relative z-10 flex flex-col w-full h-full max-w-4xl"
                style={{ padding: 'clamp(0.5rem, 1vh, 2rem)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                {/* Section supérieure : Logo et Slogan - Compact en haut */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ gap: 'clamp(0.375rem, 0.8vh, 0.75rem)', marginBottom: 'clamp(0.375rem, 1vh, 1rem)' }}>
                    {/* Icônes scolaires animées en cercle */}
                    <div className="relative" style={{ height: 'clamp(80px, 14vh, 120px)', width: 'clamp(80px, 14vh, 120px)' }}>
                        {/* Centre - Logo eLISAschool */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className="flex items-center justify-center rounded-2xl bg-white/15 shadow-xl backdrop-blur-sm ring-1 ring-white/20"
                                 style={{ height: 'clamp(48px, 8vh, 72px)', width: 'clamp(48px, 8vh, 72px)' }}>
                                <ElisaLogo variant="icon" size="lg" theme="white" />
                            </div>
                        </motion.div>

                        {/* Orbiting icons */}
                        <motion.div
                            className="absolute top-1 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className="flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg"
                                 style={{ height: 'clamp(28px, 4vh, 36px)', width: 'clamp(28px, 4vh, 36px)' }}>
                                <BookOpen className="text-white" strokeWidth={1.5}
                                          style={{ height: 'clamp(14px, 2vh, 18px)', width: 'clamp(14px, 2vh, 18px)' }} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute bottom-1 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        >
                            <div className="flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg"
                                 style={{ height: 'clamp(28px, 4vh, 36px)', width: 'clamp(28px, 4vh, 36px)' }}>
                                <Users className="text-white" strokeWidth={1.5}
                                       style={{ height: 'clamp(14px, 2vh, 18px)', width: 'clamp(14px, 2vh, 18px)' }} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute top-1/2 left-1 -translate-y-1/2"
                            animate={{ x: [0, -5, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        >
                            <div className="flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg"
                                 style={{ height: 'clamp(28px, 4vh, 36px)', width: 'clamp(28px, 4vh, 36px)' }}>
                                <Award className="text-white" strokeWidth={1.5}
                                       style={{ height: 'clamp(14px, 2vh, 18px)', width: 'clamp(14px, 2vh, 18px)' }} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute top-1/2 right-1 -translate-y-1/2"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        >
                            <div className="flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow-lg"
                                 style={{ height: 'clamp(28px, 4vh, 36px)', width: 'clamp(28px, 4vh, 36px)' }}>
                                <Mail className="text-white" strokeWidth={1.5}
                                      style={{ height: 'clamp(14px, 2vh, 18px)', width: 'clamp(14px, 2vh, 18px)' }} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Texte descriptif / Slogan */}
                    <div className="text-center">
                        <motion.p
                            className="font-bold text-white"
                            style={{ fontSize: 'clamp(1.125rem, 2vh + 0.6rem, 1.5rem)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            École Intelligente
                        </motion.p>
                        <motion.p
                            className="mt-1 leading-relaxed text-white/70"
                            style={{ fontSize: 'clamp(0.75rem, 1.4vh + 0.3rem, 1rem)', maxWidth: 'clamp(200px, 40vw, 320px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            Gérez élèves, enseignants, finances et bien plus,
                            le tout dans une plateforme unifiée et sécurisée.
                        </motion.p>
                    </div>
                </div>

                {/* Section inférieure : Diaporama de présentation - S'étend jusqu'au bas */}
                <div className="flex-1 min-h-0 w-full" style={{ minHeight: 'clamp(150px, 40vh, 500px)' }}>
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
    const { login, isLoading, completeLogin, preLoginData, showEtablissementModal, setShowEtablissementModal, reset } = useAuthStore();
    const router = useRouter();
    const search = useSearch({ from: '/login' }) as { redirect?: string };

    // Charger le logo de l'établissement (si disponible via config publique)
    const { data: etablissement } = useEtablissement(
        useAuthStore.getState().etablissementId || '',
        { enabled: false } // Désactivé par défaut sur login (pas d'ID encore)
    );
    const logoEtablissement = etablissement?.logoUrl;

    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [qrOpen, setQrOpen] = useState(false);
    const [successPulse, setSuccessPulse] = useState(false);
    
    // Suivi des tentatives de connexion - UNIQUEMENT depuis le backend
    const [tentativesRestantes, setTentativesRestantes] = useState<number>(20);
    const [bloqueJusqua, setBloqueJusqua] = useState<Date | null>(null);
    const [tempsRestant, setTempsRestant] = useState<number>(0);

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

    // Polling backend pour le temps de blocage réel (toutes les 5 secondes)
    useEffect(() => {
        if (!bloqueJusqua) return;

        const pollBlocage = async () => {
            try {
                // Utiliser le nouvel endpoint dédié pour vérifier le statut de blocage
                const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/blocage-status/__check__`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const result = await response.json();
                    const status = result?.data;
                    
                    if (status) {
                        if (!status.bloque || status.tempsRestantSecondes <= 0) {
                            // Compte débloqué
                            setBloqueJusqua(null);
                            setTempsRestant(0);
                            setTentativesRestantes(status.tentativesRestantes || 20);
                            toast.success('Votre compte est débloqué. Vous pouvez réessayer de vous connecter.');
                        } else {
                            // Toujours bloqué - mettre à jour avec les données réelles du backend
                            const deblocage = new Date(status.bloqueJusqua);
                            setBloqueJusqua(deblocage);
                            setTempsRestant(status.tempsRestantSecondes);
                            setTentativesRestantes(status.tentativesRestantes);
                        }
                    }
                }
            } catch (error) {
                // Erreur de connexion - ignorer silencieusement
                console.debug('[Login] Polling blocage échoué (non bloquant)');
            }
        };

        // Premier appel immédiat
        pollBlocage();

        // Polling toutes les 5 secondes
        const interval = setInterval(pollBlocage, 5000);

        return () => clearInterval(interval);
    }, [bloqueJusqua]);

    // Timer local de secours (update chaque seconde pour UX fluide entre les pollings)
    useEffect(() => {
        if (bloqueJusqua && tempsRestant > 0) {
            const timer = setInterval(() => {
                const maintenant = new Date();
                const diff = bloqueJusqua.getTime() - maintenant.getTime();
                
                if (diff <= 0) {
                    setBloqueJusqua(null);
                    setTempsRestant(0);
                    setTentativesRestantes(20);
                    clearInterval(timer);
                    toast.success('Votre compte est débloqué. Vous pouvez réessayer de vous connecter.');
                } else {
                    // Décrémenter localement en attendant le prochain polling
                    setTempsRestant(prev => Math.max(0, prev - 1));
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [bloqueJusqua, tempsRestant]);

    const onSubmit = async (data: LoginForm) => {
        setError(null);
        setSuccessPulse(false);
        try {
            // Étape 1 : Login avec validation établissements
            // Le store gère MAINTENANT la détection multi-établissements
            await login(data.identifiant, data.motDePasse);
            
            // CONNEXION RÉUSSIE : Réinitialiser le compteur de tentatives
            setTentativesRestantes(20);
            setBloqueJusqua(null);
            setTempsRestant(0);
            
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
            // DEBUG: Logger l'erreur complète pour diagnostiquer
            console.error('[Login] Erreur complète:', err);
            console.error('[Login] Error code:', err?.code);
            console.error('[Login] Error message:', err?.message);
            console.error('[Login] Error status:', err?.status);
            
            const code = err?.code || '';
            const status = err?.status || 0;
            
            // Mapping des erreurs backend → messages utilisateur
            let message: string;
            
            switch (code) {
                case 'INVALID_CREDENTIALS':
                    message = t('erreurs.identifiantsInvalides');
                    // Utiliser les informations RÉELLES du backend
                    if (err?.details) {
                        setTentativesRestantes(err.details.tentativesRestantes ?? 20);
                        
                        // Si le backend indique un blocage, l'appliquer
                        if (err.details.bloque && err.details.bloqueJusqua) {
                            const deblocage = new Date(err.details.bloqueJusqua);
                            setBloqueJusqua(deblocage);
                            const diff = deblocage.getTime() - Date.now();
                            setTempsRestant(diff > 0 ? Math.ceil(diff / 1000) : 0);
                        }
                    } else {
                        // Fallback si pas de détails
                        setTentativesRestantes(prev => Math.max(0, prev - 1));
                    }
                    
                    // Toast d'alerte si peu de tentatives restantes
                    if (tentativesRestantes <= 5 && tentativesRestantes > 0) {
                        toast.warning(`Attention : il ne vous reste que ${tentativesRestantes} tentative${tentativesRestantes > 1 ? 's' : ''}`);
                    }
                    break;
                case 'ACCOUNT_LOCKED':
                    message = err?.message || t('erreurs.compteVerrouille');
                    // Utiliser les informations RÉELLES du backend
                    const bloqueJusquaBackend = err?.details?.bloqueJusqua;
                    const tempsRestantBackend = err?.details?.tempsRestantSecondes;
                    
                    if (bloqueJusquaBackend && tempsRestantBackend) {
                        const deblocage = new Date(bloqueJusquaBackend);
                        setBloqueJusqua(deblocage);
                        setTempsRestant(tempsRestantBackend);
                        setTentativesRestantes(0);
                    } else {
                        // Fallback si le backend ne retourne pas les détails
                        const deblocage = new Date(Date.now() + 15 * 60 * 1000);
                        setBloqueJusqua(deblocage);
                        setTempsRestant(15 * 60);
                        setTentativesRestantes(0);
                    }
                    break;
                case 'ACCOUNT_SUSPENDED':
                case 'ACCOUNT_INACTIVE':
                    message = t('erreurs.compteDesactive');
                    break;
                case 'NO_ETABLISSEMENT':
                    message = 'Aucun établissement associé à votre compte. Contactez l\'administrateur.';
                    break;
                case 'VALIDATION_ERROR':
                    message = err?.message || 'Données de connexion invalides';
                    break;
                case 'MISSING_IDENTIFIER':
                    message = 'L\'identifiant est requis';
                    break;
                case 'TOO_MANY_REQUESTS':
                    message = 'Trop de tentatives. Veuillez patienter.';
                    // Utiliser les informations du backend (Retry-After ou details)
                    const retryAfter = err?.details?.retryAfter || err?.details?.tempsRestantSecondes || 900;
                    const bloqueJusquaRate = err?.details?.bloqueJusqua 
                        ? new Date(err.details.bloqueJusqua)
                        : new Date(Date.now() + retryAfter * 1000);
                    
                    setBloqueJusqua(bloqueJusquaRate);
                    setTempsRestant(retryAfter);
                    setTentativesRestantes(0);
                    break;
                default:
                    // Erreurs HTTP sans code spécifique
                    if (status === 401) {
                        message = t('erreurs.identifiantsInvalides');
                    } else if (status === 429) {
                        message = 'Trop de tentatives. Réessayez dans quelques instants.';
                    } else if (status === 500) {
                        message = 'Erreur serveur. Veuillez réessayer ultérieurement.';
                    } else if (status === 0 || status === 'NETWORK_ERROR') {
                        message = 'Erreur de connexion. Vérifiez votre connexion internet.';
                    } else {
                        message = err?.message || t('erreurs.sessionExpiree');
                    }
            }
            
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

    /**
     * Annulation de la sélection d'établissement.
     * Reset complet du store (tokens, localStorage, état) pour éviter
     * toute connexion fantôme, puis réinitialisation des états locaux
     * pour que la page login soit propre.
     */
    const handleEtablissementCancel = useCallback(() => {
        reset();
        setSuccessPulse(false);
        setError(null);
        setValue('motDePasse', '');
        toast.info(t('login.sessionAnnulee', { defaultValue: 'Session annulée.' }));
    }, [reset, t, setValue]);

    const handleQRScan = useCallback((value: string) => {
        setValue('identifiant', value);
        setQrOpen(false);
    }, [setValue]);

    return (
        <div className="flex min-h-screen">
            {/* Fond principal — visible uniquement derrière le panneau droit */}
            <FondAnime />
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
                <div className="flex items-center justify-between" style={{ padding: 'clamp(0.5rem, 1vh, 1rem) clamp(1rem, 2vw, 2rem)' }}>
                    {/* Logo mobile */}
                    <Link to="/" className="block lg:hidden">
                        <ElisaLogo variant="horizontal" size="xs" theme="auto" />
                    </Link>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Contenu centré */}
                <div className="flex flex-1 items-center justify-center" style={{ padding: '0 clamp(0.75rem, 2vw, 3rem) clamp(0.75rem, 1.5vh, 2rem)' }}>
                    <motion.div
                        className="w-full max-w-[420px]"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Logo de l'établissement (si disponible) ou ElisaLogo */}
                        <motion.div
                            className="flex justify-center"
                            style={{ marginBottom: 'clamp(0.75rem, 1.5vh, 1.5rem)' }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 }}
                        >
                            {logoEtablissement ? (
                                <img
                                    src={logoEtablissement}
                                    alt={etablissement?.nom || 'Logo établissement'}
                                    className="rounded-2xl object-contain shadow-lg"
                                    style={{ height: 'clamp(48px, 6vh, 64px)', width: 'clamp(48px, 6vh, 64px)' }}
                                />
                            ) : (
                                <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-dominante)]/10 to-[var(--color-dominante)]/5"
                                     style={{ height: 'clamp(48px, 6vh, 64px)', width: 'clamp(48px, 6vh, 64px)' }}>
                                    <ElisaLogo variant="icon" size="lg" theme="auto" />
                                </div>
                            )}
                        </motion.div>

                        {/* Titre */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="font-bold tracking-tight text-[var(--color-texte)]"
                                style={{ fontSize: 'clamp(1.25rem, 3vh + 0.5rem, 1.875rem)' }}>
                                {t('login.titre')}
                            </h1>
                            <p className="mt-1 text-[var(--color-texte-secondaire)]"
                               style={{ fontSize: 'clamp(0.6875rem, 1.2vh + 0.25rem, 0.875rem)' }}>
                                {t('login.sousTitre')}
                            </p>
                        </motion.div>

                        {/* Formulaire */}
                        <motion.form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                            style={{ marginTop: 'clamp(1rem, 2.5vh, 2rem)' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Champ identifiant */}
                            <div className="space-y-1" style={{ gap: 'clamp(0.25rem, 0.5vh, 0.375rem)' }}>
                                <label className="font-medium text-[var(--color-texte)]"
                                       style={{ fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}>
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
                                            'w-full rounded-xl border bg-[var(--color-surface)] pl-11 pr-4 text-[var(--color-texte)] transition-all',
                                            'placeholder:text-[var(--color-texte-secondaire)]/50',
                                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                                            errors.identifiant
                                                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                                : 'border-[var(--color-bordure)]',
                                        )}
                                        style={{ height: 'clamp(40px, 5vh, 48px)', fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}
                                        {...register('identifiant', {
                                            required: t('erreurs.identifiantRequis'),
                                        })}
                                    />
                                </div>
                                {errors.identifiant && (
                                    <p className="flex items-center gap-1 text-[var(--color-error)]"
                                       style={{ fontSize: 'clamp(0.625rem, 1vh, 0.75rem)' }}>
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.identifiant.message}
                                    </p>
                                )}
                            </div>

                            {/* Champ mot de passe avec toggle */}
                            <div className="space-y-1" style={{ gap: 'clamp(0.25rem, 0.5vh, 0.375rem)' }}>
                                <label className="font-medium text-[var(--color-texte)]"
                                       style={{ fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}>
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
                                            'w-full rounded-xl border bg-[var(--color-surface)] pl-11 pr-12 text-[var(--color-texte)] transition-all',
                                            'placeholder:text-[var(--color-texte-secondaire)]/50',
                                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                                            errors.motDePasse
                                                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                                                : 'border-[var(--color-bordure)]',
                                        )}
                                        style={{ height: 'clamp(40px, 5vh, 48px)', fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}
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
                                    <p className="flex items-center gap-1 text-[var(--color-error)]"
                                       style={{ fontSize: 'clamp(0.625rem, 1vh, 0.75rem)' }}>
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
                                        <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-3 py-2">
                                            <AlertCircle className="shrink-0 text-[var(--color-error)]"
                                                         style={{ height: 'clamp(14px, 1.8vh, 16px)', width: 'clamp(14px, 1.8vh, 16px)', marginTop: 'clamp(1px, 0.2vh, 2px)' }} />
                                            <p className="text-[var(--color-error)]"
                                               style={{ fontSize: 'clamp(0.6875rem, 1.2vh, 0.875rem)' }}>{error}</p>
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
                                        className="flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2"
                                    >
                                        <CheckCircle2 className="text-green-600"
                                                      style={{ height: 'clamp(14px, 1.8vh, 16px)', width: 'clamp(14px, 1.8vh, 16px)' }} />
                                        <p className="font-medium text-green-700"
                                           style={{ fontSize: 'clamp(0.6875rem, 1.2vh, 0.875rem)' }}>{t('login.bienvenue')}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Options : se souvenir + mot de passe oublié */}
                            <div className="flex items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2 text-[var(--color-texte-secondaire)]"
                                       style={{ fontSize: 'clamp(0.6875rem, 1.2vh, 0.875rem)' }}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-[var(--color-bordure)] accent-[var(--color-dominante)]"
                                        style={{ height: 'clamp(14px, 1.8vh, 16px)', width: 'clamp(14px, 1.8vh, 16px)' }}
                                        {...register('seSouvenir')}
                                    />
                                    {t('login.seSouvenir')}
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="font-medium text-[var(--color-dominante)] transition-colors hover:text-[var(--color-dominante-hover)] hover:underline underline-offset-2"
                                    style={{ fontSize: 'clamp(0.6875rem, 1.2vh, 0.875rem)' }}
                                >
                                    {t('login.motDePasseOublie')}
                                </Link>
                            </div>

                            {/* Bouton principal avec compteur intégré */}
                            <motion.button
                                type="submit"
                                disabled={isLoading || successPulse || bloqueJusqua !== null}
                                className={cn(
                                    'relative flex w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all',
                                    bloqueJusqua
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : tentativesRestantes <= 5 && tentativesRestantes > 0
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40'
                                        : tentativesRestantes <= 10 && tentativesRestantes > 5
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30'
                                        : 'bg-gradient-to-r from-[var(--color-dominante)] to-[var(--color-dominante)] shadow-lg shadow-[var(--color-dominante)]/25 hover:shadow-xl hover:shadow-[var(--color-dominante)]/30',
                                    'disabled:cursor-not-allowed disabled:opacity-70',
                                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/40 focus:ring-offset-2',
                                )}
                                style={{ height: 'clamp(40px, 5vh, 48px)', fontSize: 'clamp(0.8125rem, 1.3vh, 0.9375rem)' }}
                                whileHover={!isLoading && !bloqueJusqua ? { scale: 1.01 } : {}}
                                whileTap={!isLoading && !bloqueJusqua ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            className="rounded-full border-2 border-white/30 border-t-white"
                                            style={{ height: 'clamp(16px, 2vh, 20px)', width: 'clamp(16px, 2vh, 20px)' }}
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <span>{t('login.connexionEnCours')}</span>
                                    </>
                                ) : successPulse ? (
                                    <>
                                        <CheckCircle2 className="text-green-600"
                                                      style={{ height: 'clamp(16px, 2vh, 20px)', width: 'clamp(16px, 2vh, 20px)' }} />
                                        <span>{t('login.bienvenue')}</span>
                                    </>
                                ) : bloqueJusqua ? (
                                    <>
                                        <Lock className="text-white"
                                              style={{ height: 'clamp(16px, 2vh, 20px)', width: 'clamp(16px, 2vh, 20px)' }} />
                                        <span>
                                            Déblocage dans {String(Math.floor(tempsRestant / 60)).padStart(2, '0')}:{String(tempsRestant % 60).padStart(2, '0')}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="text-white"
                                               style={{ height: 'clamp(14px, 1.8vh, 16px)', width: 'clamp(14px, 1.8vh, 16px)' }} />
                                        <span>{t('login.boutonConnexion')}</span>
                                        {/* Badge compteur de tentatives - visible uniquement si < 20 */}
                                        {tentativesRestantes < 20 && tentativesRestantes > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={cn(
                                                    'absolute -top-2 -right-2 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white',
                                                    tentativesRestantes <= 5
                                                        ? 'bg-red-600 text-white animate-pulse'
                                                        : tentativesRestantes <= 10
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-blue-500 text-white'
                                                )}
                                                style={{ height: 'clamp(20px, 2.5vh, 24px)', width: 'clamp(20px, 2.5vh, 24px)', fontSize: 'clamp(0.625rem, 1vh, 0.75rem)' }}
                                            >
                                                {tentativesRestantes}
                                            </motion.span>
                                        )}
                                    </>
                                )}
                            </motion.button>

                            {/* Séparateur */}
                            <div className="relative flex items-center gap-3 py-0.5">
                                <div className="h-px flex-1 bg-[var(--color-bordure)]" />
                                <span className="font-medium uppercase tracking-wider text-[var(--color-texte-secondaire)]"
                                      style={{ fontSize: 'clamp(0.5625rem, 0.9vh, 0.6875rem)' }}>
                                    {t('login.ou')}
                                </span>
                                <div className="h-px flex-1 bg-[var(--color-bordure)]" />
                            </div>

                            {/* Bouton QR Code */}
                            <motion.button
                                type="button"
                                onClick={() => setQrOpen(true)}
                                className={cn(
                                    'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed',
                                    'border-[var(--color-bordure)] text-[var(--color-texte-secondaire)]',
                                    'transition-all hover:border-[var(--color-dominante)]/40 hover:text-[var(--color-dominante)] hover:bg-[var(--color-dominante)]/5',
                                )}
                                style={{ height: 'clamp(40px, 5vh, 48px)', fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <QrCode className="text-[var(--color-texte-secondaire)]"
                                        style={{ height: 'clamp(16px, 2vh, 20px)', width: 'clamp(16px, 2vh, 20px)' }} />
                                <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 1.2vh, 0.875rem)' }}>{t('login.scannerQR')}</span>
                            </motion.button>
                        </motion.form>

                        {/* Pied de page */}
                        <motion.p
                            className="text-center text-[var(--color-texte-secondaire)]"
                            style={{ marginTop: 'clamp(1rem, 2vh, 2rem)', fontSize: 'clamp(0.6875rem, 1.2vh, 0.875rem)' }}
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
                    onCancel={handleEtablissementCancel}
                    tokenTemporaire={preLoginData.tokenTemporaire || ''}
                    expiresIn={preLoginData.expiresIn}
                />
            )}
        </div>
    );
}
