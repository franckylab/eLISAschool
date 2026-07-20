import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function getTheme(): 'dark' | 'light' {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function NidAlveoleBackground() {
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

    const svgName = theme === 'dark' ? 'nid-alveole-dark.svg' : 'nid-alveole-light.svg';
    const cacheBust = process.env.NODE_ENV === 'development' ? `?t=${Date.now()}` : '';
    const svgUrl = `${BACKEND_ORIGIN}/fonds-catalogue/${svgName}${cacheBust}`;

    return (
        <div
            className="fixed inset-0 -z-20"
            style={{
                backgroundImage: `url('${svgUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                willChange: 'opacity, filter',
            }}
        />
    );
}
