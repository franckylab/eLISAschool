import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Loader2, Maximize, Info, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImagePreviewProps {
    open: boolean;
    onClose: () => void;
    imageUrl: string;
    title?: string;
    alt?: string;
    filename?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;
const DOUBLE_CLICK_ZOOM = 2.5;

export function ImagePreview({ open, onClose, imageUrl, title = '', alt = '', filename }: ImagePreviewProps) {
    const { t } = useTranslation();
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [positionStart, setPositionStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
    const [showInfo, setShowInfo] = useState(false);
    const [rotation, setRotation] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
            setIsLoading(true);
            setHasError(false);
            setNaturalDimensions({ width: 0, height: 0 });
            setShowInfo(false);
        }
    }, [open, imageUrl]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === '+' || e.key === '=') { handleZoomIn(); return; }
            if (e.key === '-') { handleZoomOut(); return; }
            if (e.key === '0') { handleReset(); return; }
            if (e.key === 'r') { handleRotate(); return; }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, scale, position]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => {
            const next = Math.max(prev - ZOOM_STEP, MIN_SCALE);
            if (next <= 1) setPosition({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const handleReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    }, []);

    const handleRotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    const handleDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename || `image-${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [imageUrl, filename]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const ratio = newScale / scale;
            setPosition(prev => ({
                x: (prev.x - (x - centerX)) * ratio + (x - centerX),
                y: (prev.y - (y - centerY)) * ratio + (y - centerY),
            }));
        }
        setScale(newScale);
    }, [scale]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (scale > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setPositionStart({ ...position });
        }
    }, [scale, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: positionStart.x + e.clientX - dragStart.x,
                y: positionStart.y + e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart, positionStart]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleDoubleClick = useCallback(() => {
        if (scale > 1) { handleReset(); }
        else { setScale(DOUBLE_CLICK_ZOOM); }
    }, [scale, handleReset]);

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setIsLoading(false);
        setHasError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setIsLoading(false);
        setHasError(true);
    }, []);

    const getFileSize = () => {
        if (!imageUrl) return '';
        const base64 = imageUrl.split(',')[1];
        if (!base64) return '';
        const bytes = Math.round(base64.length * 0.75);
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const getImageType = () => {
        if (!imageUrl) return '';
        const match = imageUrl.match(/^data:(image\/\w+);/);
        return match ? match[1].replace('image/', '').toUpperCase() : '';
    };

    const cursorStyle = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative flex flex-col max-w-[95vw] max-h-[95vh] z-10"
                        initial={{ scale: 0.93, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.93, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 backdrop-blur rounded-t-lg select-none">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-200 truncate">
                                    {title || alt || filename || t('visionneuse.apercu')}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label={t('boutons.fermer')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div
                            ref={containerRef}
                            className="relative flex items-center justify-center overflow-hidden bg-gray-900/60"
                            style={{
                                width: 'clamp(300px, 85vw, 1200px)',
                                height: 'clamp(300px, 75vh, 900px)',
                                cursor: cursorStyle,
                            }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDoubleClick={handleDoubleClick}
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                                </div>
                            )}
                            {hasError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <AlertCircle className="h-12 w-12" />
                                    <span className="text-sm">{t('messages.erreurChargement')}</span>
                                </div>
                            ) : (
                                <motion.img
                                    ref={imageRef}
                                    src={imageUrl}
                                    alt={alt || title || ''}
                                    className="max-w-full max-h-full object-contain select-none"
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                    }}
                                    draggable={false}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            )}

                            {showInfo && naturalDimensions.width > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-300 space-y-1"
                                >
                                    <p>{naturalDimensions.width} × {naturalDimensions.height} px</p>
                                    <p>{getImageType()} · {getFileSize()}</p>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-1 px-4 py-2 bg-gray-900/90 backdrop-blur rounded-b-lg select-none">
                            <button
                                onClick={handleZoomOut}
                                disabled={scale <= MIN_SCALE}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={t('visionneuse.zoomArriere')}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>

                            <span className="text-xs text-gray-400 min-w-[3rem] text-center tabular-nums">
                                {Math.round(scale * 100)}%
                            </span>

                            <button
                                onClick={handleZoomIn}
                                disabled={scale >= MAX_SCALE}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={t('visionneuse.zoomAvant')}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1" />

                            <button
                                onClick={handleReset}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title={t('visionneuse.reinitialiser')}
                            >
                                <Maximize className="h-4 w-4" />
                            </button>

                            <button
                                onClick={handleRotate}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title={t('visionneuse.pivoter')}
                            >
                                <RotateCw className="h-4 w-4" />
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1" />

                            <button
                                onClick={handleDownload}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title={t('boutons.telecharger')}
                            >
                                <Download className="h-4 w-4" />
                            </button>

                            <button
                                onClick={() => setShowInfo(prev => !prev)}
                                className={`p-2 rounded-lg transition-colors ${showInfo ? 'text-white bg-white/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title={t('commun.informations')}
                            >
                                <Info className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
