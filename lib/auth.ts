// Auth helpers — used by both the login page and the main app
// Currently bypassed in favour of the user picker for testing

const SESSION_KEY = 'cms_tracker_user_id'

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

export function storeUserId(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, userId)
}

export function clearStoredUserId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

// Validate the stored user ID against the API
export async function validateSession(userId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'x-user-id': userId },
    })
    return res.ok
  } catch {
    return false
  }
}
