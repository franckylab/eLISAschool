/**
 * VideoSection — Lazy-loaded
 * Lecteur vidéo YouTube / HTML5.
 */

export function VideoSection({ contenu }: { contenu: Record<string, any> }) {
    return (
        <div className="mx-auto max-w-4xl">
            {contenu.youtubeId ? (
                <div className="aspect-video overflow-hidden rounded-xl">
                    <iframe
                        src={`https://www.youtube.com/embed/${contenu.youtubeId}`}
                        title={contenu.titre || 'Vidéo'}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            ) : contenu.videoUrl ? (
                <video
                    controls
                    className="mx-auto w-full max-w-4xl rounded-xl"
                    poster={contenu.poster}
                >
                    <source src={contenu.videoUrl} type="video/mp4" />
                </video>
            ) : null}
            {contenu.description && (
                <p className="mt-3 text-center text-sm opacity-60">{contenu.description}</p>
            )}
        </div>
    );
}

export default VideoSection;
