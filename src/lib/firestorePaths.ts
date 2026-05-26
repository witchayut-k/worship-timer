export function eventsCol() {
  return 'events'
}

export function eventDoc(eventId: string) {
  return `events/${eventId}`
}

export function programItemsCol(eventId: string) {
  return `events/${eventId}/programItems`
}

export function runtimeStateDoc(eventId: string) {
  return `events/${eventId}/runtime/state`
}

