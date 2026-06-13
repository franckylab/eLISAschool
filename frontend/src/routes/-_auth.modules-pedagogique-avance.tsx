import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/modules-pedagogique-avance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/modules-pedagogique-avance"!</div>
}
