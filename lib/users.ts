import { User } from '@/types/job'
import { supabase } from './db'

const SESSION_KEY = 'cms_tracker_user_id'

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data as User[]
}

export function getSessionUser(users: User[]): User | null {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  return users.find(u => u.id === id) || null
}

export function setSessionUser(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, userId)
}

export function clearSessionUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
