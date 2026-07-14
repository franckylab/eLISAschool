import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

export interface FileUploadProps {
    accept?: string;
    maxSizeMB?: number;
    label?: string;
    hint?: string;
    currentUrl?: string | null;
    currentThumbnailUrl?: string | null;
    uploading?: boolean;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    icon?: 'image' | 'document';
    className?: string;
}

export function FileUpload({
    accept = 'image/jpeg,image/png,image/webp,image/avif',
    maxSizeMB = 5,
    label = 'Fichier',
    hint = 'JPEG, PNG, WEBP, AVIF max 5 MB',
    currentUrl,
    currentThumbnailUrl,
    uploading = false,
    onChange,
    onRemove,
    icon = 'image',
    className = '',
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback((file: File | null) => {
        if (!file) {
            setPreview(null);
            onChange(null);
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onChange(file);
    }, [maxSizeMB, onChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleRemove = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
        onChange(null);
        onRemove?.();
    };

    const displayUrl = preview || currentThumbnailUrl || currentUrl;

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                className={`
                    relative flex flex-col items-center justify-center gap-2
                    border-2 border-dashed rounded-xl p-4 cursor-pointer
                    transition-colors min-h-[120px]
                    ${dragOver
                        ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-500)]/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                    }
                    ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
            >
                {uploading ? (
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : displayUrl ? (
                    <div className="relative w-full">
                        <img
                            src={displayUrl}
                            alt={label}
                            className="max-h-32 mx-auto rounded-lg object-contain"
                        />
                        {!uploading && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {icon === 'image' ? (
                            <Upload className="h-6 w-6 text-gray-400" />
                        ) : (
                            <FileText className="h-10 w-10 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {hint}
                        </span>
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
            </div>
        </div>
    );
}
