import { useState, useMemo, useCallback } from 'react';
import {
    DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, BookOpen, Users, Clock } from 'lucide-react';
import { useEnseignantAffectationsMatiere, useDeplacerAffectation } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import type { AffectationEnseignant } from '../../types/enseignant.types';

interface KanbanColumn {
    id: string;
    nom: string;
    classeAnneeId: string;
    items: AffectationEnseignant[];
}

function SortableCard({ affectation, isDragging }: { affectation: AffectationEnseignant; isDragging?: boolean }) {
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
            className={`group rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                !affectation.actif ? 'opacity-60' : ''
            } ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
        >
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors active:cursor-grabbing dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-400"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: affectation.matiere?.couleur || '#6b7280' }}
                        />
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {affectation.matiere?.nom || affectation.matiereId.slice(0, 8)}
                        </span>
                    </div>
                    {affectation.matiere?.code && (
                        <span className="ml-5 font-mono text-xs text-gray-400 dark:text-gray-500">{affectation.matiere.code}</span>
                    )}
                    <div className="ml-5 mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {affectation.volumeHoraireHebdo ?? '—'}h
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {affectation.effectifActuel ?? '—'}
                        </span>
                        <span>
                            Coeff. <strong>{affectation.coefficient ?? '—'}</strong>
                        </span>
                        {affectation.actif ? (
                            <Badge variant="success" dot>Actif</Badge>
                        ) : (
                            <Badge variant="secondary" dot>Inactif</Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Column({ column }: { column: KanbanColumn }) {
    const items = column.items;

    return (
        <div className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-700">
                        {items.length}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{column.nom}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-3" style={{ maxHeight: '500px' }}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-8 dark:border-gray-600 dark:bg-gray-800">
                            <BookOpen className="mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" />
                            <p className="text-xs text-gray-400 dark:text-gray-500">Déposer ici</p>
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
    const { data, isLoading } = useEnseignantAffectationsMatiere(enseignantId);
    const affectations = isActive ? (data ?? []) : [];
    const deplacerAffectation = useDeplacerAffectation();

    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo<KanbanColumn[]>(() => {
        const map = new Map<string, KanbanColumn>();
        affectations.forEach(a => {
            const nom = a.classeAnnee?.classe?.nom || 'Sans classe';
            const classeAnneeId = a.classeAnneeId;
            const key = `${nom}::${classeAnneeId}`;
            if (!map.has(key)) {
                map.set(key, { id: key, nom, classeAnneeId, items: [] });
            }
            map.get(key)!.items.push(a);
        });
        return Array.from(map.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations]);

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
                <LoadingState message="Chargement du Kanban..." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {columns.length} classe{columns.length > 1 ? 's' : ''} · {affectations.length} affectation{affectations.length !== 1 ? 's' : ''}
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">(glissez-déposez entre les colonnes)</span>
                </p>
                <ElisaButton variant="primary" size="sm" onClick={onRequestAdd}>
                    + Ajouter
                </ElisaButton>
            </div>

            {columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 dark:border-gray-600 dark:bg-gray-800">
                    <BookOpen className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">Aucune matière assignée</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Glissez des matières depuis le tableau ou ajoutez-en une.</p>
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
                            <div className="w-72 rounded-lg border border-blue-300 bg-white shadow-xl dark:border-blue-800 dark:bg-gray-800">
                                <SortableCard affectation={activeAffectation} isDragging />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}
