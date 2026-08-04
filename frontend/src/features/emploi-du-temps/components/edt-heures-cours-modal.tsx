/**
 * ==================================
 * eLISAschool - Modal Génération Heures de Cours depuis EDT
 * ==================================
 * Convertit les créneaux récurrents en heures de cours datées
 * pour une plage de dates donnée.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck, Loader2, CheckCircle2, AlertTriangle,
    Info, ChevronLeft,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useGenererHeuresCoursFromEdt, type GenererHeuresCoursResult } from '@/features/personnel';

interface EDTHeuresCoursModalProps {
    enseignantId: string;
    classeAnneeId?: string;
    onClose: () => void;
}

type Etape = 'form' | 'result';

export function EDTHeuresCoursModal({ enseignantId, classeAnneeId, onClose }: EDTHeuresCoursModalProps) {
    const { t } = useTranslation('emplois');
    const [etape, setEtape] = useState<Etape>('form');
    const [resultat, setResultat] = useState<GenererHeuresCoursResult | null>(null);

    // Dates par défaut : lundi → samedi de la semaine courante
    const now = new Date();
    const day = now.getDay();
    const lundi = new Date(now);
    lundi.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const samedi = new Date(lundi);
    samedi.setDate(lundi.getDate() + 5);

    const [dateDebut, setDateDebut] = useState(lundi.toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState(samedi.toISOString().split('T')[0]);

    const generer = useGenererHeuresCoursFromEdt();

    const handleGenerer = useCallback(async () => {
        if (!dateDebut || !dateFin || !enseignantId) return;
        try {
            const res = await generer.mutateAsync({
                enseignantId,
                classeAnneeId,
                dateDebut,
                dateFin,
            });
            setResultat(res ?? null);
            setEtape('result');
        } catch {
            // Erreur gérée par le hook
        }
    }, [dateDebut, dateFin, enseignantId, classeAnneeId, generer]);

    const peutGenerer = !!dateDebut && !!dateFin && !!enseignantId && dateDebut <= dateFin;

    return (
        <div className="space-y-5">
            <AnimatePresence mode="wait">
                {etape === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {/* Info */}
                        <div className="p-3 rounded-lg border border-[var(--color-accent-500)]/20 bg-[var(--color-accent-500)]/5">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-[var(--color-accent-600)] shrink-0 mt-0.5" />
                                <p
                                    className="text-xs text-[var(--color-text-secondary)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}
                                >
                                    {t('generationHeuresCours.info')}
                                </p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                            <div className="flex flex-col gap-[var(--gap-xs)]">
                                <label
                                    className="text-xs font-medium text-[var(--color-text-secondary)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}
                                >
                                    {t('generationHeuresCours.dateDebut')}
                                </label>
                                <input
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                    className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                                    style={{
                                        fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                        padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-[var(--gap-xs)]">
                                <label
                                    className="text-xs font-medium text-[var(--color-text-secondary)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}
                                >
                                    {t('generationHeuresCours.dateFin')}
                                </label>
                                <input
                                    type="date"
                                    value={dateFin}
                                    min={dateDebut}
                                    onChange={(e) => setDateFin(e.target.value)}
                                    className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                                    style={{
                                        fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                        padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Validation */}
                        {!enseignantId && (
                            <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
                                <AlertTriangle className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                                <span className="text-xs text-[var(--color-warning)]">
                                    {t('generationHeuresCours.enseignantRequis')}
                                </span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <ElisaButton variant="outline" size="md" onClick={onClose}>
                                {t('annuler')}
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="md"
                                icon={generer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                                onClick={handleGenerer}
                                disabled={!peutGenerer || generer.isPending}
                            >
                                {generer.isPending ? t('generationHeuresCours.enCours') : t('generationHeuresCours.lancer')}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}

                {etape === 'result' && resultat && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {/* Résumé */}
                        <div className="flex flex-col items-center py-4">
                            <div className="h-14 w-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-3">
                                <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
                            </div>
                            <h3
                                className="font-semibold text-[var(--color-text-primary)] mb-1"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('generationHeuresCours.resultat')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)]">
                            <ResultatCard label={t('generationHeuresCours.creees')} value={resultat.created} color="success" />
                            <ResultatCard label={t('generationHeuresCours.ignorees')} value={resultat.skipped} color="warning" />
                            <ResultatCard label={t('generationHeuresCours.erreurs')} value={resultat.errors} color="danger" />
                            <ResultatCard label={t('generationHeuresCours.totalTraite')} value={resultat.total} color="dominant" />
                        </div>

                        <div className="flex justify-center gap-3 pt-2">
                            <ElisaButton variant="outline" size="md" onClick={onClose}>
                                {t('generationHeuresCours.fermer')}
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="md"
                                icon={<ChevronLeft className="h-4 w-4" />}
                                onClick={() => setEtape('form')}
                            >
                                {t('precedent')}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Carte résultat ──────────────────────────────────

function ResultatCard({ label, value, color }: {
    label: string;
    value: number;
    color: 'success' | 'warning' | 'danger' | 'dominant';
}) {
    const colorMap = {
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30',
        danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30',
        dominant: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    };

    return (
        <div className={`p-3 rounded-lg border text-center ${colorMap[color]}`}>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide mt-1 opacity-80">{label}</div>
        </div>
    );
}
