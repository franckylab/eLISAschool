/**
 * ==================================
 * eLISAschool - Composant upload média CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Upload drag & drop de médias (images, vidéos, documents).
 * Preview, barre de progression, validation type/taille.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, FileText, AlertCircle } from 'lucide-react';
import type { TypeMedia } from '../types/cms.types';

interface CmsMediaUploadProps {
    onUpload: (data: { nom: string; url: string; type: TypeMedia; taille: number; mimeType: string; dossier?: string }) => Promise<void>;
    accept?: string;
    maxTailleMo?: number;
    dossier?: string;
    multiple?: boolean;
}

const TAILLE_MAX_DEFAUT = 10; // Mo

function getTypeMedia(mimeType: string): TypeMedia {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
}

function getIcone(type: TypeMedia) {
    switch (type) {
        case 'image': return <Image className="h-5 w-5" />;
        case 'video': return <Video className="h-5 w-5" />;
        default: return <FileText className="h-5 w-5" />;
    }
}

function formaterTaille(octets: number): string {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function CmsMediaUpload({ onUpload, accept, maxTailleMo = TAILLE_MAX_DEFAUT, dossier, multiple = false }: CmsMediaUploadProps) {
    const [fichiers, setFichiers] = useState<{ file: File; preview?: string; type: TypeMedia; progress: number; statut: 'pending' | 'uploading' | 'done' | 'error'; erreur?: string }[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const maxTaille = maxTailleMo * 1024 * 1024;

    const handleFichiers = useCallback(async (fileList: FileList | File[]) => {
        const nouveaux = Array.from(fileList).map(file => {
            const type = getTypeMedia(file.type);
            const preview = type === 'image' ? URL.createObjectURL(file) : undefined;

            if (file.size > maxTaille) {
                return { file, preview, type, progress: 0, statut: 'error' as const, erreur: `Fichier trop volumineux (max ${maxTailleMo} Mo)` };
            }

            return { file, preview, type, progress: 0, statut: 'pending' as const };
        });

        setFichiers(prev => [...prev, ...nouveaux]);

        // Upload automatique
        for (const fichier of nouveaux) {
            if (fichier.statut === 'error') continue;

            setFichiers(prev => prev.map(f =>
                f.file === fichier.file ? { ...f, statut: 'uploading' as const, progress: 30 } : f
            ));

            try {
                // Convertir en base64
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(fichier.file);
                });

                setFichiers(prev => prev.map(f =>
                    f.file === fichier.file ? { ...f, progress: 70 } : f
                ));

                await onUpload({
                    nom: fichier.file.name,
                    url: base64,
                    type: fichier.type,
                    taille: fichier.file.size,
                    mimeType: fichier.file.type,
                    dossier,
                });

                setFichiers(prev => prev.map(f =>
                    f.file === fichier.file ? { ...f, progress: 100, statut: 'done' as const } : f
                ));
            } catch {
                setFichiers(prev => prev.map(f =>
                    f.file === fichier.file ? { ...f, statut: 'error' as const, erreur: 'Erreur lors de l\'upload' } : f
                ));
            }
        }

        // Nettoyer les fichiers terminés après 2s
        setTimeout(() => {
            setFichiers(prev => prev.filter(f => f.statut !== 'done'));
        }, 2000);
    }, [maxTaille, maxTailleMo, dossier, onUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length) {
            handleFichiers(e.dataTransfer.files);
        }
    }, [handleFichiers]);

    const supprimerFichier = (index: number) => {
        setFichiers(prev => {
            const f = prev[index];
            if (f?.preview) URL.revokeObjectURL(f.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    return (
        <div className="space-y-3">
            {/* Zone de drop */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors"
                style={{
                    borderColor: isDragOver ? 'var(--color-primary, #28a745)' : 'var(--color-bordure, #dee2e6)',
                    backgroundColor: isDragOver ? 'rgba(40, 167, 69, 0.05)' : 'transparent',
                }}
            >
                <Upload
                    className="mb-3 h-10 w-10 opacity-40"
                    style={{ color: isDragOver ? 'var(--color-primary, #28a745)' : undefined }}
                />
                <p className="text-sm font-medium">
                    Glissez-déposez vos fichiers ici
                </p>
                <p className="mt-1 text-xs opacity-50">
                    ou cliquez pour parcourir • Max {maxTailleMo} Mo par fichier
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.length) handleFichiers(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {/* Liste fichiers en cours */}
            {fichiers.length > 0 && (
                <div className="space-y-2">
                    {fichiers.map((f, index) => (
                        <div
                            key={`${f.file.name}-${index}`}
                            className="flex items-center gap-3 rounded-lg border p-3"
                            style={{ borderColor: 'var(--color-bordure, #dee2e6)' }}
                        >
                            {/* Preview ou icône */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                {f.preview ? (
                                    <img src={f.preview} alt="" className="h-full w-full rounded-lg object-cover" />
                                ) : (
                                    getIcone(f.type)
                                )}
                            </div>

                            {/* Infos */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{f.file.name}</p>
                                <p className="text-xs opacity-50">{formaterTaille(f.file.size)}</p>
                                {/* Barre de progression */}
                                {f.statut === 'uploading' && (
                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${f.progress}%`,
                                                backgroundColor: 'var(--color-primary, #28a745)',
                                            }}
                                        />
                                    </div>
                                )}
                                {f.erreur && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {f.erreur}
                                    </div>
                                )}
                            </div>

                            {/* Statut */}
                            {f.statut === 'done' && (
                                <span className="text-xs font-medium text-green-600">✓</span>
                            )}
                            {(f.statut === 'pending' || f.statut === 'error') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); supprimerFichier(index); }}
                                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="h-4 w-4 opacity-50" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
