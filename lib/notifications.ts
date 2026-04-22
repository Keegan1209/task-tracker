export async function requestNotificationPermission(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export function sendP1Notification(title: string, client: string): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  new Notification(`🔴 P1 raised: ${title} — ${client}`, {
    body: 'Urgent job added to the queue',
    icon: '/favicon.ico',
  })
}
