import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Fetch user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // TODO: Verify password_hash against provided password using bcrypt
    // For now, just check if password matches a simple stored value
    // In production, use: await bcrypt.compare(password, user.password_hash)
    
    // Placeholder: accept any password for now (will be replaced with bcrypt)
    if (password !== user.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Return user data (no JWT for MVP — client stores user ID in localStorage)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initial: user.initial,
    })
  } catch (err) {
    console.error('POST /api/auth/login unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
