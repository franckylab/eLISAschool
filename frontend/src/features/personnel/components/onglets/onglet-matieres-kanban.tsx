import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, BookOpen, Users, Clock } from 'lucide-react';
import { useEnseignantAffectationsMatiere, useDeplacerAffectation } from '../../hooks/use-personnel-detail';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { formatVolumeMinutesToHours } from '@/lib/format-utils';
import type { AffectationEnseignant } from '../../types/personnel.types';

interface KanbanColumn {
    id: string;
    nom: string;
    classeAnneeId: string;
    items: AffectationEnseignant[];
}

function SortableCard({ affectation, isDragging }: { affectation: AffectationEnseignant; isDragging?: boolean }) {
    const { t } = useTranslation('personnel');
    const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({
        id: affectation.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
                !affectation.actif ? 'opacity-60' : ''
            } ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}`}
        >
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-colors active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: affectation.matiere?.couleur || '#6b7280' }}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                            {affectation.matiere?.nom || affectation.matiereId.slice(0, 8)}
                        </span>
                    </div>
                    {affectation.matiere?.code && (
                        <span className="ml-5 font-mono text-xs text-muted-foreground">{affectation.matiere.code}</span>
                    )}
                    <div className="ml-5 mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {affectation.volumeHoraireHebdo != null ? formatVolumeMinutesToHours(affectation.volumeHoraireHebdo) : '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {affectation.effectifActuel ?? '—'}
                        </span>
                        <span>
                            {t('affectations.colCoeff', 'Coeff.')} <strong>{affectation.coefficient ?? '—'}</strong>
                        </span>
                        {affectation.actif ? (
                            <Badge variant="success" dot>{t('affectations.actif', 'Actif')}</Badge>
                        ) : (
                            <Badge variant="secondary" dot>{t('affectations.inactif', 'Inactif')}</Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Column({ column }: { column: KanbanColumn }) {
    const { t } = useTranslation('personnel');
    const items = column.items;

    return (
        <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                        {items.length}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{column.nom}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-3" style={{ maxHeight: '500px' }}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-8">
                            <BookOpen className="mb-2 h-6 w-6 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">{t('affectations.deposerIci', 'Déposer ici')}</p>
                        </div>
                    ) : (
                        items.map(affectation => (
                            <SortableCard key={affectation.id} affectation={affectation} />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

interface Props {
    enseignantId: string;
    isActive: boolean;
    onRequestAdd: () => void;
}

export function OngletMatieresKanban({ enseignantId, isActive, onRequestAdd }: Props) {
    const { t } = useTranslation('personnel');
    const { data, isLoading } = useEnseignantAffectationsMatiere(enseignantId);
    const affectations = isActive ? (data ?? []) : [];
    const deplacerAffectation = useDeplacerAffectation();

    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo<KanbanColumn[]>(() => {
        const map = new Map<string, KanbanColumn>();
        affectations.forEach(a => {
            const nom = a.classeAnnee?.classe?.nom || t('affectations.sansClasse', 'Sans classe');
            const classeAnneeId = a.classeAnneeId;
            const key = `${nom}::${classeAnneeId}`;
            if (!map.has(key)) {
                map.set(key, { id: key, nom, classeAnneeId, items: [] });
            }
            map.get(key)!.items.push(a);
        });
        return Array.from(map.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations, t]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragOver = useCallback((_event: DragOverEvent) => {
        // used to track hover state for visual feedback
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = event;
        if (!over) return;

        const affectationId = active.id as string;
        const affectation = affectations.find(a => a.id === affectationId);
        if (!affectation) return;

        const overColumn = columns.find(c => c.id === over.id as string || c.items.some(i => i.id === over.id));
        if (!overColumn) return;

        if (affectation.classeAnneeId !== overColumn.classeAnneeId) {
            deplacerAffectation.mutate({
                id: affectationId,
                cibleClasseAnneeId: overColumn.classeAnneeId,
                enseignantId,
            });
        }
    }, [affectations, columns, enseignantId, deplacerAffectation]);

    const activeAffectation = activeId ? affectations.find(a => a.id === activeId) : null;

    if (isLoading && isActive) {
        return (
            <div className="space-y-4">
                <LoadingState message={t('affectations.chargementKanban', 'Chargement du Kanban...')} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {columns.length} {columns.length > 1 ? t('affectations.classes', 'Classes') : t('affectations.classeUnique', 'classe')} · {affectations.length} {affectations.length !== 1 ? t('affectations.affectations', 'affectations') : t('affectations.affectationSing', 'affectation')}
                    <span className="ml-2 text-xs text-muted-foreground">({t('affectations.glisserDeposer', 'glissez-déposez entre les colonnes')})</span>
                </p>
                <ElisaButton variant="primary" size="sm" onClick={onRequestAdd}>
                    + {t('affectations.ajouter', 'Ajouter')}
                </ElisaButton>
            </div>

            {columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                    <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
                    <p className="font-medium text-secondary">{t('affectations.aucuneMatiere', 'Aucune matière assignée')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('affectations.kanbanVideDesc', 'Glissez des matières depuis le tableau ou ajoutez-en une.')}</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {columns.map(col => (
                            <Column key={col.id} column={col} />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeAffectation ? (
                            <div className="w-72 rounded-lg border border-primary/30 bg-card shadow-xl">
                                <SortableCard affectation={activeAffectation} isDragging />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}
