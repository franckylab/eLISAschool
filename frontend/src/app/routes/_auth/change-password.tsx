/**
 * ==================================
 * eLISAschool - Change Password Route
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';

export const Route = createFileRoute('/_auth/change-password')({
    component: ChangePasswordPage,
});
