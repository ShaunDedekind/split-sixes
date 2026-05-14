import { createClient } from '@/src/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.redirect(new URL('/dashboard?error=logout_failed', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
