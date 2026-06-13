import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { userId, authId } = await req.json()

    if (!userId || !authId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or authId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Verify the requester is an admin
    const authHeader = req.headers.get('Authorization')
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    )

    const { data: { user: requester }, error: authError } = await userClient.auth.getUser()
    if (authError || !requester) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if requester is admin in user_profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('auth_id', requester.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log(`Admin ${requester.email} is deleting user ${authId}`)

    // 2. Delete from Auth
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(authId)
    if (deleteAuthError) {
      console.error('Error deleting from auth:', deleteAuthError)
      // If user not found in auth, we might still want to try deleting from DB
      if (!deleteAuthError.message.includes('User not found')) {
        throw deleteAuthError
      }
    }

    // 3. Delete from Public Schema (if not cascaded)
    // Most relationships use ON DELETE CASCADE, but we'll be thorough
    const { error: deleteProfileError } = await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) throw deleteProfileError

    return new Response(
      JSON.stringify({ message: 'User deleted successfully from Auth and Database' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Task failed:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
