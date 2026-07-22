/**
 * ==================================
 * eLISAschool - Route Transport
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { TransportPage } from '@/features/transport/components/transport-page';

export const Route = createFileRoute('/_auth/transport')({
    component: TransportPage,
});
