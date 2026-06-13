/**
 * ==================================
 * eLISAschool - Forgot Password Route
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { publicOnlyGuard } from '@/app/route-guards';

export const Route = createFileRoute('/forgot-password')({
    component: ForgotPasswordPage,
    beforeLoad: () => {
        publicOnlyGuard();
    },
});
