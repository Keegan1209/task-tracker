export async function requestNotificationPermission(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export function sendNotification(title: string, body?: string): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.ico' })
}

export function sendP1Notification(jobTitle: string, client?: string): void {
  sendNotification(
    `🔴 P1: ${jobTitle}${client ? ` — ${client}` : ''}`,
    'Urgent job added to the queue'
  )
}

export function sendAssignmentNotification(jobTitle: string): void {
  sendNotification(`📋 Assigned to you: ${jobTitle}`)
}

export function sendFireAlarmNotification(description: string, client?: string): void {
  sendNotification(
    `🚨 Urgent: ${description}${client ? ` — ${client}` : ''}`,
    'Fire alarm raised — check the board'
  )
}
