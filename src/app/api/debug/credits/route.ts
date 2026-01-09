import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        const envStatus = {
            supabaseUrl: !!supabaseUrl,
            supabaseAnonKey: !!supabaseAnonKey,
            supabaseServiceKey: !!supabaseServiceKey,
        }

        // Get user from auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({
                error: 'Missing authorization header',
                envStatus
            }, { status: 401 })
        }

        const token = authHeader.substring(7)

        // Try to use service role key if available
        if (!supabaseServiceKey) {
            return NextResponse.json({
                error: 'SUPABASE_SERVICE_ROLE_KEY is not set in this environment',
                envStatus,
                hint: 'This key is required for credit deduction to work properly'
            }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({
                error: 'Invalid token',
                authError: authError?.message
            }, { status: 401 })
        }

        // Get credits
        const { data: credits, error: creditsError } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single()

        return NextResponse.json({
            userId: user.id,
            email: user.email,
            credits,
            creditsError,
            envStatus
        })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
