import { createSupabaseAdmin } from '~/libs/supabase'

/**
 * Look up the Supabase user ID by email address.
 * This bridges better-auth (which provides the email) with the existing
 * Supabase users table.
 */
export async function getSupabaseUserId(email: string): Promise<string> {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error(`User not found in Supabase for email: ${email}`)
  }

  return data.id
}

/**
 * Get full Supabase user profile by email
 */
export async function getSupabaseUser(email: string) {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error(`User not found in Supabase for email: ${email}`)
  }

  return data
}
