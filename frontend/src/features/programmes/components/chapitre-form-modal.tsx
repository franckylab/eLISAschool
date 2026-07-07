import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { ProgrammeChapitre } from '../types/programme.types';

interface ChapitreFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (dto: {
        titre: string;
        description?: string;
        objectifsPedagogiques?: string;
        ordre?: number;
        dureePrevueHeures?: number;
    }) => Promise<void>;
    chapitre?: ProgrammeChapitre | null;
    isLoading?: boolean;
}

export function ChapitreFormModal({ open, onClose, onSubmit, chapitre, isLoading }: ChapitreFormModalProps) {
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [objectifsPedagogiques, setObjectifsPedagogiques] = useState('');
    const [ordre, setOrdre] = useState(0);
    const [dureePrevueHeures, setDureePrevueHeures] = useState<number | ''>('');

    useEffect(() => {
        if (chapitre) {
            setTitre(chapitre.titre);
            setDescription(chapitre.description || '');
            setObjectifsPedagogiques(chapitre.objectifsPedagogiques || '');
            setOrdre(chapitre.ordre);
            setDureePrevueHeures(chapitre.dureePrevueHeures ?? '');
        } else {
            setTitre('');
            setDescription('');
            setObjectifsPedagogiques('');
            setOrdre(0);
            setDureePrevueHeures('');
        }
    }, [chapitre, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim()) return;
        await onSubmit({
            titre: titre.trim(),
            description: description.trim() || undefined,
            objectifsPedagogiques: objectifsPedagogiques.trim() || undefined,
            ordre,
            dureePrevueHeures: dureePrevueHeures || undefined,
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">
                                {chapitre ? 'Modifier le chapitre' : 'Nouveau chapitre'}
                            </h2>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                <input
                                    type="text"
                                    value={titre}
                                    onChange={(e) => setTitre(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Titre du chapitre"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Description du chapitre"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs pédagogiques</label>
                                <textarea
                                    value={objectifsPedagogiques}
                                    onChange={(e) => setObjectifsPedagogiques(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Objectifs pédagogiques"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={ordre}
                                        onChange={(e) => setOrdre(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée prévue (heures)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={dureePrevueHeures}
                                        onChange={(e) => setDureePrevueHeures(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="ex: 3"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <ElisaButton type="button" variant="outline" onClick={onClose}>
                                    Annuler
                                </ElisaButton>
                                <ElisaButton type="submit" variant="primary" isLoading={isLoading} disabled={!titre.trim()}>
                                    {chapitre ? 'Enregistrer' : 'Créer'}
                                </ElisaButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
