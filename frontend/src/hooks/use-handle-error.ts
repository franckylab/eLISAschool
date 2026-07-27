import { toast } from 'sonner';

export function useHandleError() {
    return (e: unknown, messageFallback: string): void => {
        let message = messageFallback;
        if (e instanceof Error && e.message) {
            message = e.message;
        } else if (typeof e === 'object' && e !== null && 'message' in e) {
            const m = (e as { message?: unknown }).message;
            if (typeof m === 'string' && m.length > 0) {
                message = m;
            }
        }
        toast.error(message);
    };
}
