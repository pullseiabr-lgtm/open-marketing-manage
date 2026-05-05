import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/** Verify the calling user is admin/superadmin via cookie-based client */
async function getCallerRole(): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role ?? null
}

/** Admin Supabase client (service role — bypasses RLS) */
function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/* ─── GET /api/admin/users — list all profiles ─── */
export async function GET() {
  const role = await getCallerRole()
  if (!role || !['admin', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await adminClient()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/* ─── POST /api/admin/users — create new auth user + profile ─── */
export async function POST(req: NextRequest) {
  const role = await getCallerRole()
  if (!role || !['admin', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, password, nome, userRole = 'operacional' } = body

  if (!email || !password || !nome) {
    return NextResponse.json({ error: 'email, password e nome são obrigatórios' }, { status: 400 })
  }

  const admin = adminClient()

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  // Update the auto-created profile
  const { error: profErr } = await admin
    .from('profiles')
    .update({ nome, role: userRole, email, is_active: true })
    .eq('id', authData.user.id)

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

  return NextResponse.json({ id: authData.user.id })
}

/* ─── PATCH /api/admin/users — update profile (role, is_active, nome) ─── */
export async function PATCH(req: NextRequest) {
  const role = await getCallerRole()
  if (!role || !['admin', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Only allow safe fields
  const safe: Record<string, unknown> = {}
  if (updates.nome      !== undefined) safe.nome      = updates.nome
  if (updates.role      !== undefined) safe.role      = updates.role
  if (updates.is_active !== undefined) safe.is_active = updates.is_active

  const { error } = await adminClient().from('profiles').update(safe).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
