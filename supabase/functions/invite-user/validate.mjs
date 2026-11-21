// Input validation for the invite-user Edge Function. Plain JS with no dependencies, so
// the same file runs in Deno (Supabase) and is unit-tested in Node (tests/edge.spec.js).
export const ROLES = ['parent', 'teacher', 'admin'];
export const LANGS = ['en', 'ko', 'zh', 'es'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @typedef {{ email: string, full_name: string, role: 'parent' | 'teacher' | 'admin', lang: 'en' | 'ko' | 'zh' | 'es', student_ids: string[] }} Invite
 */
/**
 * Returns { ok: true, value } with a normalised invitation, or { ok: false, errors }.
 * @param {any} body
 * @returns {{ ok: true, value: Invite } | { ok: false, errors: string[] }}
 */
export function validateInvite(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, errors: ['body must be a JSON object'] };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const role = body.role;
  const lang = body.lang == null ? 'en' : body.lang;
  const studentIds = body.student_ids == null ? [] : body.student_ids;

  if (!EMAIL.test(email) || email.length > 254) errors.push('email is invalid');
  if (!fullName || fullName.length > 120) errors.push('full_name is required (max 120 characters)');
  if (!ROLES.includes(role)) errors.push(`role must be one of ${ROLES.join(', ')}`);
  if (!LANGS.includes(lang)) errors.push(`lang must be one of ${LANGS.join(', ')}`);
  if (!Array.isArray(studentIds) || studentIds.some(id => typeof id !== 'string' || !UUID.test(id))) errors.push('student_ids must be a list of student UUIDs');
  else if (role === 'parent' && studentIds.length === 0) errors.push('a parent must be linked to at least one student');
  else if (role !== 'parent' && studentIds.length > 0) errors.push('only parents are linked to students');

  return errors.length ? { ok: false, errors }
    : { ok: true, value: { email, full_name: fullName, role, lang, student_ids: [...new Set(studentIds.map(s => s.toLowerCase()))] } };
}
