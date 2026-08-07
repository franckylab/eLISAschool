import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/app/permission-guards'
import { RemplacementsPage } from '@/features/emploi-du-temps'

export const Route = createFileRoute('/_auth/heures-cours/replacements')({
    beforeLoad: () => requirePermission('heures-cours:remplacer:view'),
    component: RemplacementsPage,
})
