/**
 * ==================================
 * eLISAschool - Routes Vie Scolaire
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { CantinePage } from '@/features/cantine/components/cantine-page';
import { TransportPage } from '@/features/transport/components/transport-page';
import { MessageriePage } from '@/features/messagerie/components/messagerie-page';

// Route placeholder pour éviter le warning TanStack Router
export const Route = createFileRoute('/_auth/vie-scolaire')({
    component: () => null,
});

export const CantineRoute = createFileRoute('/_auth/cantine')({
    component: CantinePage,
});

export const TransportRoute = createFileRoute('/_auth/transport')({
    component: TransportPage,
});

export const MessagerieRoute = createFileRoute('/_auth/messagerie')({
    component: MessageriePage,
});
