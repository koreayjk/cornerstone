// Supabase Edge Function: the school office invites a parent, teacher or office user.
// Deploy:  supabase functions deploy invite-user
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
//          Supabase; set PORTAL_URL (e.g. https://<domain>/portal/) with `supabase secrets set`.
// Call from the portal (signed in as office staff):
//   await sb.functions.invoke('invite-user', { body: { email, full_name, role, lang, student_ids } })
//
// Flow: verify the caller is an admin -> inviteUserByEmail (Supabase sends the invitation
// email, see supabase/templates/invite.html) -> set app_metadata.role (the
// on_auth_user_role_changed trigger creates the profile) -> link parents to students.
// The service-role key stays inside this function; it never reaches the browser or the repo.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { validateInvite } from './validate.js';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'use POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1. who is calling? Use their own JWT, so RLS applies to this lookup.
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return json({ error: 'sign in first' }, 401);
  const { data: me } = await caller.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') return json({ error: 'only office staff can invite' }, 403);

  // 2. validate the request
  const parsed = validateInvite(await req.json().catch(() => null));
  if (!parsed.ok) return json({ error: 'invalid request', details: parsed.errors }, 400);
  const inv = parsed.value;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 3. parents: every student must exist
  if (inv.role === 'parent') {
    const { data: found, error } = await admin.from('students').select('id').in('id', inv.student_ids);
    if (error) return json({ error: 'could not check students' }, 500);
    if ((found ?? []).length !== inv.student_ids.length) return json({ error: 'unknown student id' }, 400);
  }

  // 4. invite (Supabase sends the email in the invitee's language — see templates/invite.html)
  const { data: created, error: inviteError } = await admin.auth.admin.inviteUserByEmail(inv.email, {
    data: { full_name: inv.full_name, lang: inv.lang },
    redirectTo: Deno.env.get('PORTAL_URL') ?? undefined
  });
  if (inviteError || !created?.user) {
    const exists = /already|registered|exists/i.test(inviteError?.message ?? '');
    return json({ error: exists ? 'this email already has an account' : 'invitation failed' }, exists ? 409 : 502);
  }
  const uid = created.user.id;

  // 5. role -> profile (trigger), then parent-student links
  const { error: roleError } = await admin.auth.admin.updateUserById(uid, { app_metadata: { role: inv.role } });
  if (roleError) return json({ error: 'invited, but setting the role failed', user_id: uid }, 500);
  if (inv.role === 'parent') {
    const { error: linkError } = await admin.from('guardians').insert(inv.student_ids.map(student_id => ({ parent_id: uid, student_id })));
    if (linkError) return json({ error: 'invited, but linking students failed', user_id: uid }, 500);
  }

  return json({ user_id: uid, email: inv.email, role: inv.role, students: inv.student_ids.length });
});
