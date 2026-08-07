import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/app/permission-guards'
import { HeuresCoursPage } from '@/features/emploi-du-temps'

export const Route = createFileRoute('/_auth/heures-cours')({
    beforeLoad: () => requirePermission('heures-cours:view'),
    component: HeuresCoursPage,
})
