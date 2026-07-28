/**
 * ==================================
 * eLISAschool - Calendrier EDT Interactif
 * ==================================
 * Grille CSS avec drag & drop (@dnd-kit) et resize
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { Fragment, useMemo, useState, useCallback, useRef } from 'react';
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
import { User, MapPin, GripVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateCreneau, useVerifierConflits } from '../hooks/use-emploi-du-temps';
import type { CreneauHoraire, JourSemaine, DonneesVerification, Conflit } from '../types/edt.types';

interface EDTCalendarProps {
    creneaux: CreneauHoraire[];
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    heureDebut?: string;
    heureFin?: string;
    pasMinutes?: number;
}

const JOURS_SEMAINE: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const HAUTEUR_SLOT = 48;
const MIN_DUREE_MINUTES = 30;

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
    heureDebut = '07:00',
    heureFin = '17:00',
    pasMinutes = 30,
}: EDTCalendarProps) {
    const { t } = useTranslation('emplois');
    const queryClient = useQueryClient();
    const updateMutation = useUpdateCreneau();
    const verifierConflits = useVerifierConflits();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [conflitsPreview, setConflitsPreview] = useState<Conflit[]>([]);
    const resizeRef = useRef<{ creneauId: string; startY: number; startMinutes: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const startMin = minutesDepuisMinuit(heureDebut);
    const endMin = minutesDepuisMinuit(heureFin);

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

        updateMutation.mutate({
            id: creneauId,
            jour: targetJour as JourSemaine,
            heureDebut: targetHeure,
            heureFin: newHeureFin,
        });
    }, [creneaux, endMin, queryClient, t, updateMutation, verifierConflits]);

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

            updateMutation.mutate({ id: creneauId, heureFin: finalHeureFin });
            resizeRef.current = null;
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [creneaux, endMin, pasMinutes, queryClient, updateMutation]);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                <div
                    className="relative grid min-w-[700px]"
                    style={{
                        gridTemplateColumns: `60px repeat(${joursActifs.length}, 1fr)`,
                        gridTemplateRows: `auto repeat(${slots.length}, ${HAUTEUR_SLOT}px)`,
                    }}
                >
                    {/* Header row */}
                    <div className="sticky top-0 z-10 bg-[var(--color-dominant-600)] text-white flex items-center justify-center px-2 py-3 text-xs font-semibold border-b border-[var(--color-dominant-700)]">
                        {t('calendrier.heure')}
                    </div>
                    {joursActifs.map(jour => (
                        <div
                            key={`header-${jour}`}
                            className="sticky top-0 z-10 bg-[var(--color-dominant-600)] text-white flex items-center justify-center px-2 py-3 text-xs font-semibold border-b border-l border-[var(--color-dominant-700)]"
                        >
                            {t(`jours.${jour.toLowerCase()}`)}
                        </div>
                    ))}

                    {/* Grid body */}
                    {slots.map((heure, rowIdx) => (
                        <Fragment key={heure}>
                            {/* Time label */}
                            <div
                                className="flex items-start justify-center pt-1 text-[10px] font-mono text-[var(--color-text-muted)] border-t border-[var(--color-bordure)] bg-[var(--color-surface-alt)]"
                                style={{ gridRow: rowIdx + 2, gridColumn: 1 }}
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
                                />
                            ))}
                        </Fragment>
                    ))}

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
                <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {t('conflitDetection.conflitsDetectes', { count: conflitsPreview.length })}
                </div>
            )}
        </DndContext>
    );
}

// ─── Drop cell ────────────────────────────────────────

function DropCell({ id, row, col }: { id: string; row: number; col: number }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`border-t border-l border-[var(--color-bordure)] transition-colors ${
                isOver ? 'bg-[var(--color-dominant-100)]' : ''
            }`}
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
                className="relative h-full rounded-md border-l-[3px] bg-[var(--color-surface)] shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeftColor: couleur }}
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

                <div className="px-2 py-1 h-full flex flex-col justify-between overflow-hidden">
                    <div>
                        <div className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
                            {creneau.affectationMatiere?.matiere?.nom || '—'}
                        </div>
                        {creneau.affectationMatiere?.enseignant && (
                            <div className="flex items-center gap-0.5 text-[9px] text-[var(--color-text-secondary)] mt-0.5">
                                <User className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">
                                    {creneau.affectationMatiere.enseignant.prenom} {creneau.affectationMatiere.enseignant.nom}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[var(--color-text-muted)]">
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
