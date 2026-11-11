// Edge Function "signup": membuat akun yang LANGSUNG terkonfirmasi (tanpa email).
// Kunci rahasia (service role) hanya ada di server Supabase, tidak pernah dikirim ke browser.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Metode tidak diizinkan.' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Data tidak valid.' }, 400) }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const fullName = String(body.full_name ?? '').trim().slice(0, 60)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Format email tidak valid.' }, 400)
  if (password.length < 6) return json({ error: 'Kata sandi minimal 6 karakter.' }, 400)
  if (!fullName) return json({ error: 'Nama lengkap wajib diisi.' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Role selalu 'mahasiswa' (default tabel profiles). Admin hanya bisa diatur lewat SQL.
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    const m = (error.message || '').toLowerCase()
    if (m.includes('already') || m.includes('registered') || (error as any).code === 'email_exists') {
      return json({ error: 'Email ini sudah terdaftar. Silakan masuk.' }, 409)
    }
    return json({ error: 'Gagal membuat akun: ' + error.message }, 400)
  }
  return json({ ok: true })
})
