import { createFileRoute } from '@tanstack/react-router'
import { requireModulePermission } from '@/app/permission-guards'
import { EDTStandalonePage } from '@/features/emploi-du-temps'

export const Route = createFileRoute('/_auth/emploi-du-temps')({
    beforeLoad: () => requireModulePermission('emploi-du-temps'),
    component: EDTStandalonePage,
})
