import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get current balance
        const { data: creditsData } = await supabaseAdmin
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single()

        // Get transaction history
        const { data: transactions, error } = await supabaseAdmin
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching transactions:', error)
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
        }

        return NextResponse.json({
            balance: creditsData?.balance || 0,
            transactions: transactions || []
        })

    } catch (error) {
        console.error('Credits API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
