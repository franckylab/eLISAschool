import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/enseignants/')({
    beforeLoad: () => {
        throw redirect({ to: '/personnel' });
    },
});
