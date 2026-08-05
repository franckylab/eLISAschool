import { createFileRoute } from '@tanstack/react-router'
import { requireModulePermission } from '@/app/permission-guards'
import { RemplacementsPage } from '@/features/emploi-du-temps'

export const Route = createFileRoute('/_auth/heures-cours/replacements')({
    beforeLoad: () => requireModulePermission('emploi-du-temps'),
    component: RemplacementsPage,
})
