/**
 * ==================================
 * eLISAschool - Calendrier EDT Interactif
 * ==================================
 * Grille CSS avec drag & drop (@dnd-kit) et resize
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { Fragment, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { User, MapPin, GripVertical, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateCreneau, useVerifierConflits } from '../hooks/use-emploi-du-temps';
import type { CreneauHoraire, JourSemaine, DonneesVerification, Conflit, RapportPropagation } from '../types/edt.types';

interface EDTCalendarProps {
    creneaux: CreneauHoraire[];
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    onCellClick?: (jour: JourSemaine, heure: string) => void;
    heureDebut?: string;
    heureFin?: string;
    pasMinutes?: number;
    /** Lundi de la semaine affichée (pour afficher les dates dans les en-têtes) */
    semaineDebut?: Date;
}

const JOURS_SEMAINE: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const HAUTEUR_SLOT = 48;
const MIN_DUREE_MINUTES = 30;

/**
 * Calcule la hauteur de slot responsive
 */
function useHauteurSlot() {
    const [hauteur, setHauteur] = useState(HAUTEUR_SLOT);
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            if (w < 480) setHauteur(36);
            else if (w < 768) setHauteur(40);
            else setHauteur(HAUTEUR_SLOT);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return hauteur;
}

function minutesDepuisMinuit(heure: string): number {
    const [h, m] = heure.split(':').map(Number);
    return h * 60 + (m || 0);
}

function minutesVersHeure(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function EDTCalendar({
    creneaux,
    onCreneauClick,
    onCellClick,
    heureDebut = '07:00',
    heureFin = '17:00',
    pasMinutes = 30,
    semaineDebut,
}: EDTCalendarProps) {
    const { t } = useTranslation('emplois');
    const queryClient = useQueryClient();
    const updateMutation = useUpdateCreneau();
    const verifierConflits = useVerifierConflits();
    const hauteurSlot = useHauteurSlot();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [conflitsPreview, setConflitsPreview] = useState<Conflit[]>([]);
    const [forceRequest, setForceRequest] = useState<{ id: string; dto: Record<string, unknown>; rapport: RapportPropagation } | null>(null);
    const resizeRef = useRef<{ creneauId: string; startY: number; startMinutes: number } | null>(null);

    // ─── Indicateur temps réel ────────────────────────
    const [nowMinutes, setNowMinutes] = useState<number>(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    });

    useEffect(() => {
        const tick = () => {
            const d = new Date();
            setNowMinutes(d.getHours() * 60 + d.getMinutes());
        };
        const id = setInterval(tick, 60_000);
        return () => clearInterval(id);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const startMin = minutesDepuisMinuit(heureDebut);
    const endMin = minutesDepuisMinuit(heureFin);

    const showTimeIndicator = nowMinutes >= startMin && nowMinutes <= endMin;
    const timeIndicatorTop = showTimeIndicator
        ? ((nowMinutes - startMin) / pasMinutes) * hauteurSlot
        : null;

    const slots = useMemo(() => {
        const result: string[] = [];
        for (let m = startMin; m < endMin; m += pasMinutes) {
            result.push(minutesVersHeure(m));
        }
        return result;
    }, [startMin, endMin, pasMinutes]);

    const joursActifs = useMemo(() => {
        const joursAvecCreneaux = new Set(creneaux.map(c => c.jour));
        return JOURS_SEMAINE.filter(j => joursAvecCreneaux.has(j) || j !== 'SAMEDI');
    }, [creneaux]);

    const activeCreneau = useMemo(
        () => creneaux.find(c => c.id === activeDragId) ?? null,
        [creneaux, activeDragId]
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setConflitsPreview([]);
    }, []);

    /**
     * Soumet une modification de créneau. Q5 : si le backend renvoie 409
     * CONFLITS_PROPAGATION (instances futures en conflit), on garde la demande
     * et on propose à l'utilisateur de forcer (exclure les instances en conflit).
     */
    const soumettreModification = useCallback(async (creneauId: string, dto: Record<string, unknown>) => {
        try {
            await updateMutation.mutateAsync({ id: creneauId, ...dto });
        } catch (err: unknown) {
            const e = err as { code?: string; details?: { rapport?: RapportPropagation } };
            if (e?.code === 'CONFLITS_PROPAGATION' && e.details?.rapport) {
                setForceRequest({ id: creneauId, dto, rapport: e.details.rapport });
            }
            // Échec : restaure les données serveur (l'optimistic update reste affiché sinon)
            queryClient.invalidateQueries({ queryKey: ['emploi-du-temps'] });
        }
    }, [queryClient, updateMutation]);

    const forcerPropagation = useCallback(() => {
        if (!forceRequest) return;
        updateMutation.mutate({ id: forceRequest.id, ...forceRequest.dto, propagerForce: true });
        setForceRequest(null);
    }, [forceRequest, updateMutation]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        setActiveDragId(null);
        setConflitsPreview([]);

        const { active, over } = event;
        if (!over || !active) return;

        const creneauId = active.id as string;
        const creneau = creneaux.find(c => c.id === creneauId);
        if (!creneau) return;

        const [targetJour, targetHeure] = (over.id as string).split('::');
        if (!targetJour || !targetHeure) return;

        if (targetJour === creneau.jour && targetHeure === creneau.heureDebut) return;

        const dureeMin = minutesDepuisMinuit(creneau.heureFin) - minutesDepuisMinuit(creneau.heureDebut);
        const newStart = minutesDepuisMinuit(targetHeure);
        const newEnd = newStart + dureeMin;
        const newHeureFin = minutesVersHeure(newEnd);

        if (newEnd > endMin) {
            toast.error(t('conflitDetection.depassementVolume'));
            return;
        }

        const verification: DonneesVerification = {
            jour: targetJour as JourSemaine,
            heureDebut: targetHeure,
            heureFin: newHeureFin,
            affectationMatiereId: creneau.affectationMatiereId,
            salleId: creneau.salleId,
            excludeCreneauId: creneau.id,
        };

        try {
            const conflits = await verifierConflits.mutateAsync(verification);
            const bloquants = (conflits ?? []).filter(c => c.severite === 'BLOQUANT');

            if (bloquants.length > 0) {
                toast.error(t('creneau.modal.conflitsBloquants'));
                setConflitsPreview(bloquants);
                return;
            }
        } catch {
            // Verification failed — proceed with update (server will guard)
        }

        // Optimistic update
        queryClient.setQueriesData(
            { queryKey: ['emploi-du-temps'] },
            (old: unknown) => {
                if (!old || typeof old !== 'object') return old;
                const paginated = old as { items?: CreneauHoraire[] };
                if (!paginated.items) return old;
                return {
                    ...paginated,
                    items: paginated.items.map(c =>
                        c.id === creneauId
                            ? { ...c, jour: targetJour as JourSemaine, heureDebut: targetHeure, heureFin: newHeureFin }
                            : c
                    ),
                };
            }
        );

        soumettreModification(creneauId, {
            jour: targetJour as JourSemaine,
            heureDebut: targetHeure,
            heureFin: newHeureFin,
        });
    }, [creneaux, endMin, queryClient, t, verifierConflits, soumettreModification]);

    const handleResizeStart = useCallback((creneauId: string, e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const creneau = creneaux.find(c => c.id === creneauId);
        if (!creneau) return;

        const dureeMin = minutesDepuisMinuit(creneau.heureFin) - minutesDepuisMinuit(creneau.heureDebut);
        resizeRef.current = { creneauId, startY: e.clientY, startMinutes: dureeMin };

        const onMove = (ev: PointerEvent) => {
            if (!resizeRef.current) return;
            const delta = ev.clientY - resizeRef.current.startY;
            const deltaMinutes = Math.round(delta / HAUTEUR_SLOT) * pasMinutes;
            const newDuree = Math.max(MIN_DUREE_MINUTES, resizeRef.current.startMinutes + deltaMinutes);
            const newFin = minutesDepuisMinuit(creneau.heureDebut) + newDuree;
            if (newFin > endMin) return;

            queryClient.setQueriesData(
                { queryKey: ['emploi-du-temps'] },
                (old: unknown) => {
                    if (!old || typeof old !== 'object') return old;
                    const paginated = old as { items?: CreneauHoraire[] };
                    if (!paginated.items) return old;
                    return {
                        ...paginated,
                        items: paginated.items.map(c =>
                            c.id === creneauId ? { ...c, heureFin: minutesVersHeure(newFin) } : c
                        ),
                    };
                }
            );
        };

        const onUp = async () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (!resizeRef.current) return;

            const updatedCreneau = creneaux.find(c => c.id === creneauId);
            if (!updatedCreneau) return;

            // Read current value from cache
            const cached = queryClient.getQueriesData({ queryKey: ['emploi-du-temps'] });
            let finalHeureFin = creneau.heureFin;
            for (const [, data] of cached) {
                const pg = data as { items?: CreneauHoraire[] } | undefined;
                const found = pg?.items?.find(c => c.id === creneauId);
                if (found) { finalHeureFin = found.heureFin; break; }
            }

            if (finalHeureFin === creneau.heureFin) {
                resizeRef.current = null;
                return;
            }

            soumettreModification(creneauId, { heureFin: finalHeureFin });
            resizeRef.current = null;
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [creneaux, endMin, pasMinutes, queryClient, soumettreModification]);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                <div
                    className="relative grid"
                    style={{
                        gridTemplateColumns: `clamp(40px, 8vw, 60px) repeat(${joursActifs.length}, 1fr)`,
                        gridTemplateRows: `auto repeat(${slots.length}, ${hauteurSlot}px)`,
                        minWidth: 'min(100%, 500px)',
                    }}
                >
                    {/* Header row */}
                    <div
                        className="sticky top-0 z-10 bg-[var(--color-dominant-600)] text-white flex items-center justify-center px-[var(--space-xxs)] py-[var(--space-xs)] font-semibold border-b border-[var(--color-dominant-700)]"
                        style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.75rem)' }}
                    >
                        {t('calendrier.heure')}
                    </div>
                    {joursActifs.map((jour) => {
                        // Calcul de la date réelle pour ce jour
                        let dateReelle: Date | null = null;
                        if (semaineDebut) {
                            const offsets: Record<string, number> = {
                                LUNDI: 0, MARDI: 1, MERCREDI: 2, JEUDI: 3,
                                VENDREDI: 4, SAMEDI: 5, DIMANCHE: 6,
                            };
                            dateReelle = new Date(semaineDebut);
                            dateReelle.setDate(dateReelle.getDate() + (offsets[jour] ?? 0));
                        }
                        const estAujourdhui = dateReelle
                            ? dateReelle.toDateString() === new Date().toDateString()
                            : false;
                        const jourLabel = t(`jours.${jour.toLowerCase()}`);
                        const dateLabel = dateReelle
                            ? dateReelle.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : '';

                        return (
                            <div
                                key={`header-${jour}`}
                                className={`sticky top-0 z-10 flex flex-col items-center justify-center px-[var(--space-xxs)] py-[var(--space-xs)] font-semibold border-b border-l border-[var(--color-dominant-700)] ${
                                    estAujourdhui
                                        ? 'bg-[var(--color-accent-600)] text-white'
                                        : 'bg-[var(--color-dominant-600)] text-white'
                                }`}
                                style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.75rem)' }}
                            >
                                <span className="hidden sm:inline">{jourLabel}</span>
                                <span className="sm:hidden">{jourLabel.slice(0, 3)}</span>
                                {dateReelle && (
                                    <span
                                        className={`mt-0.5 font-normal ${estAujourdhui ? 'text-white/80' : 'text-white/60'}`}
                                        style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.625rem)' }}
                                    >
                                        {dateLabel}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Grid body */}
                    {slots.map((heure, rowIdx) => (
                        <Fragment key={heure}>
                            {/* Time label */}
                            <div
                                className="flex items-start justify-center pt-0.5 font-mono text-[var(--color-text-muted)] border-t border-[var(--color-bordure)] bg-[var(--color-surface-alt)]"
                                style={{
                                    gridRow: rowIdx + 2,
                                    gridColumn: 1,
                                    fontSize: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.625rem)',
                                }}
                            >
                                {heure}
                            </div>

                            {/* Day cells */}
                            {joursActifs.map((jour, colIdx) => (
                                <DropCell
                                    key={`${jour}::${heure}`}
                                    id={`${jour}::${heure}`}
                                    row={rowIdx + 2}
                                    col={colIdx + 2}
                                    onClick={onCellClick ? () => onCellClick(jour, heure) : undefined}
                                />
                            ))}
                        </Fragment>
                    ))}

                    {/* Indicateur temps réel */}
                    {showTimeIndicator && timeIndicatorTop !== null && (
                        <div
                            className="absolute left-0 right-0 z-20 pointer-events-none"
                            style={{ top: `calc(${timeIndicatorTop}px + ${hauteurSlot}px)` }}
                        >
                            <div className="relative flex items-center">
                                <div className="h-3 w-3 rounded-full bg-[var(--color-destructive)] -ml-1.5 shrink-0" />
                                <div className="flex-1 h-[2px] bg-[var(--color-destructive)]" />
                            </div>
                        </div>
                    )}

                    {/* Creneaux positioned via grid */}
                    {creneaux.map(creneau => {
                        const jourIdx = joursActifs.indexOf(creneau.jour);
                        if (jourIdx < 0) return null;

                        const startSlot = Math.floor((minutesDepuisMinuit(creneau.heureDebut) - startMin) / pasMinutes);
                        const endSlot = Math.ceil((minutesDepuisMinuit(creneau.heureFin) - startMin) / pasMinutes);
                        const rowStart = startSlot + 2; // +1 for header row (1-indexed)
                        const rowSpan = Math.max(1, endSlot - startSlot);

                        if (creneau.id === activeDragId) return null;

                        return (
                            <CreneauCard
                                key={creneau.id}
                                creneau={creneau}
                                style={{
                                    gridRow: `${rowStart} / span ${rowSpan}`,
                                    gridColumn: jourIdx + 2,
                                    zIndex: 5,
                                    margin: '2px 4px',
                                }}
                                onClick={() => onCreneauClick?.(creneau)}
                                onResizeStart={(e) => handleResizeStart(creneau.id, e)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeCreneau && (
                    <CreneauCardOverlay creneau={activeCreneau} />
                )}
            </DragOverlay>

            {/* Conflits preview */}
            {conflitsPreview.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center gap-2 text-sm text-[var(--color-danger)]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {t('conflitDetection.conflitsDetectes', { count: conflitsPreview.length })}
                </div>
            )}

            {/* Q5 : proposition de forcer la propagation en excluant les instances en conflit */}
            {forceRequest && (
                <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">
                                {t('propagation.conflitsTitre')}
                            </p>
                            <p className="text-secondary mt-0.5">
                                {t('propagation.conflitsMessage', {
                                    count: forceRequest.rapport.conflits.length,
                                })}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={forcerPropagation}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    {t('propagation.forcer')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForceRequest(null)}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-hover transition-colors"
                                >
                                    {t('propagation.annuler')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DndContext>
    );
}

// ─── Drop cell ────────────────────────────────────────

function DropCell({ id, row, col, onClick }: { id: string; row: number; col: number; onClick?: () => void }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`border-t border-l border-[var(--color-bordure)] transition-colors ${
                isOver ? 'bg-[var(--color-dominant-100)]' : 'hover:bg-[var(--color-surface-hover)]/50'
            } ${onClick ? 'cursor-pointer' : ''}`}
            style={{ gridRow: row, gridColumn: col }}
        />
    );
}

// ─── Draggable creneau card ───────────────────────────

function CreneauCard({
    creneau,
    style,
    onClick,
    onResizeStart,
}: {
    creneau: CreneauHoraire;
    style: React.CSSProperties;
    onClick?: () => void;
    onResizeStart: (e: React.PointerEvent) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: creneau.id,
    });

    const couleur = creneau.affectationMatiere?.matiere?.couleur || 'var(--color-dominant-500)';

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
            className="select-none group"
            onClick={onClick}
        >
            <div
                className="relative h-full rounded-md border-l-[3px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                style={{
                    borderLeftColor: couleur,
                    backgroundColor: `color-mix(in srgb, ${couleur} 8%, var(--color-surface))`,
                }}
            >
                {/* Drag handle */}
                <div
                    {...listeners}
                    {...attributes}
                    className="absolute top-0.5 right-0.5 p-0.5 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-3 w-3 text-[var(--color-text-muted)]" />
                </div>

                <div className="px-[var(--space-xxs)] py-[var(--space-xxs)] h-full flex flex-col justify-between overflow-hidden">
                    <div>
                        <div
                            className="font-semibold text-[var(--color-text-primary)] truncate leading-tight"
                            style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.6875rem)' }}
                        >
                            {creneau.affectationMatiere?.matiere?.nom || '—'}
                        </div>
                        {creneau.affectationMatiere?.enseignant && (
                            <div
                                className="flex items-center gap-0.5 text-[var(--color-text-secondary)] mt-0.5"
                                style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.5625rem)' }}
                            >
                                <User className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">
                                    {creneau.affectationMatiere.enseignant.prenom} {creneau.affectationMatiere.enseignant.nom}
                                </span>
                            </div>
                        )}
                    </div>
                    <div
                        className="flex items-center justify-between text-[var(--color-text-muted)]"
                        style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.5625rem)' }}
                    >
                        <span>{creneau.heureDebut}–{creneau.heureFin}</span>
                        {creneau.salle && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />{creneau.salle.nom}
                            </span>
                        )}
                    </div>
                </div>

                {/* Resize handle */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-[var(--color-dominant-200)] transition-colors"
                    onPointerDown={onResizeStart}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

// ─── Drag overlay card ────────────────────────────────

function CreneauCardOverlay({ creneau }: { creneau: CreneauHoraire }) {
    const couleur = creneau.affectationMatiere?.matiere?.couleur || 'var(--color-dominant-500)';

    return (
        <div className="w-[160px] rounded-md border-l-[3px] bg-[var(--color-surface)] shadow-xl opacity-90 p-2"
            style={{ borderLeftColor: couleur }}
        >
            <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                {creneau.affectationMatiere?.matiere?.nom || '—'}
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                {creneau.heureDebut}–{creneau.heureFin}
            </div>
        </div>
    );
}
