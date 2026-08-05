import { createFileRoute } from '@tanstack/react-router'
import { requireModulePermission } from '@/app/permission-guards'
import { HeuresCoursPage } from '@/features/emploi-du-temps'

export const Route = createFileRoute('/_auth/heures-cours')({
    beforeLoad: () => requireModulePermission('emploi-du-temps'),
    component: HeuresCoursPage,
})
