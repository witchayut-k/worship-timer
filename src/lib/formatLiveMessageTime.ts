export function formatLiveMessageSentTime(sentAtMs: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(sentAtMs))
}
