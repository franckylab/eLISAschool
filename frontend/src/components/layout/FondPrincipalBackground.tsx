import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || '';

function getTheme(): 'dark' | 'light' {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Fond principal unique du layout authentifié.
 * Variantes dark/light servies depuis public/fonds-principal/.
 * Le design est remplaçable en modifiant les 2 SVG (fond-principal-{dark,light}.svg).
 */
export function FondPrincipalBackground() {
    const [theme, setTheme] = useState<'dark' | 'light'>(getTheme);

    useEffect(() => {
        setTheme(getTheme());

        const observer = new MutationObserver(() => {
            const t = getTheme();
            setTheme((prev) => (prev !== t ? t : prev));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

    const svgName = theme === 'dark' ? 'fond-principal-dark.svg' : 'fond-principal-light.svg';
    const cacheBust = process.env.NODE_ENV === 'development' ? `?t=${Date.now()}` : '';
    const svgUrl = `${BASE_URL}/fonds-principal/${svgName}${cacheBust}`;

    return (
        <div
            className="fixed inset-0 -z-20"
            style={{
                backgroundImage: `url('${svgUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                willChange: 'opacity',
            }}
        />
    );
}
