/**
 * ==================================
 * eLISAschool - Reset Password Route
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { publicOnlyGuard } from '@/app/route-guards';

export const Route = createFileRoute('/reset-password')({
    validateSearch: (search) => ({
        token: (search as Record<string, string>).token || '',
    }),
    component: ResetPasswordPage,
    beforeLoad: () => {
        publicOnlyGuard();
    },
});
