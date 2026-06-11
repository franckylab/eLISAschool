/**
 * ==================================
 * eLISAschool - Routes Infrastructure
 * ==================================
 * Modules: Parking, Maintenance, Sécurité
 */

import { createFileRoute } from '@tanstack/react-router';
import { ParkingPage } from '@/features/parking/components/parking-page';

// Route placeholder pour éviter le warning TanStack Router
export const Route = createFileRoute('/-auth/infrastructure')({
    component: () => null,
});

// Route Parking
export const ParkingRoute = createFileRoute('/_auth/parking')({
    component: ParkingPage,
});
