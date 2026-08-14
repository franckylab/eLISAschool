import type { ComponentConfig } from '@puckeditor/core';

export type VideoProps = { youtubeId: string; videoUrl: string; poster: string; titre: string; description: string };

export const VideoPuck: ComponentConfig<VideoProps> = {
    fields: {
        youtubeId: { type: 'text' },
        videoUrl: { type: 'text' },
        poster: { type: 'text' },
        titre: { type: 'text' },
        description: { type: 'text' },
    },
    defaultProps: { youtubeId: '', videoUrl: '', poster: '', titre: '', description: '' },
    render({ youtubeId, videoUrl, poster, titre, description }) {
        return (
            <div className="mx-auto max-w-4xl">
                {youtubeId ? (
                    <div className="aspect-video overflow-hidden rounded-xl">
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={titre || 'Vidéo'}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : videoUrl ? (
                    <video controls className="mx-auto w-full rounded-xl" poster={poster || undefined}>
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                ) : (
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                        Entrez un ID YouTube ou une URL vidéo
                    </div>
                )}
                {description && <p className="mt-3 text-center text-sm opacity-60">{description}</p>}
            </div>
        );
    },
};
