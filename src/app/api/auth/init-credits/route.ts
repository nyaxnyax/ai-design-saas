import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Initialize credits for a newly registered user
 * This is called when the frontend detects a user has no credits record
 */
export async function POST(request: Request) {
    try {
        // Get the user from the Authorization header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Check if credits record exists
        const { data: existingCredits } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

        if (existingCredits) {
            // Record already exists, return it
            return NextResponse.json({
                success: true,
                data: existingCredits
            })
        }

        // Create new credits record
        const { data: newCredits, error: insertError } = await supabaseAdmin
            .from('user_credits')
            .insert({
                user_id: user.id,
                balance: 15, // New user gets 15 credits
                daily_generations: 0,
                last_daily_reset: new Date().toISOString()
            })
            .select()
            .single()

        if (insertError) {
            console.error('Init credits error:', insertError)
            return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: newCredits
        })

    } catch (error) {
        console.error('Init credits error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
