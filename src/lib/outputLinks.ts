export type OutputLinkKind = 'controller' | 'stage'

export type OutputLink = {
  kind: OutputLinkKind
  label: string
  path: string
  url: string
}

export function getOutputLinks(eventId: string, origin?: string): OutputLink[] {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const controllerPath = `/start/${eventId}`
  const stagePath = `/view/${eventId}?kiosk=1`

  return [
    {
      kind: 'controller',
      label: 'Controller',
      path: controllerPath,
      url: `${base}${controllerPath}`,
    },
    {
      kind: 'stage',
      label: 'Stage display',
      path: stagePath,
      url: `${base}${stagePath}`,
    },
  ]
}

export function getOutputLink(eventId: string, kind: OutputLinkKind, origin?: string): OutputLink {
  const links = getOutputLinks(eventId, origin)
  const link = links.find((l) => l.kind === kind)
  if (!link) throw new Error(`Unknown output link kind: ${kind}`)
  return link
}
