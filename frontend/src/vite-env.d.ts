/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    /** Base URL du WebSocket monitoring (défaut : same-origin via proxy /monitoring). */
    readonly VITE_WS_URL?: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_DEFAULT_LANGUAGE: string;
    readonly VITE_DEFAULT_CURRENCY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
