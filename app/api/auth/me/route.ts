import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

// Validate a user ID and return their profile
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, initial, active')
      .eq('id', userId)
      .eq('active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('GET /api/auth/me unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
