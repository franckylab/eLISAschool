import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/enseignants/$id')({
    beforeLoad: ({ params }) => {
        throw redirect({ to: '/personnel/$id', params: { id: params.id } });
    },
});
