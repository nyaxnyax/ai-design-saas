import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import crypto from 'crypto'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get user's referral info
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

        // Get referral data
        const { data: referralData, error } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false })

        // Get user's own invite code
        const { data: userData } = await supabaseAdmin
            .from('phone_users')
            .select('invite_code')
            .eq('supabase_user_id', user.id)
            .single()

        const stats = {
            totalInvites: referralData?.length || 0,
            completedSignups: referralData?.filter((r: any) => r.status === 'completed').length || 0,
            pendingRewards: referralData?.filter((r: any) => r.status === 'pending').length || 0,
        }

        return NextResponse.json({
            inviteCode: userData?.invite_code || generateInviteCode(user.id),
            stats,
            referrals: referralData || []
        })

    } catch (error) {
        console.error('Referral API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create referral relationship
export async function POST(request: Request) {
    try {
        const { inviteCode } = await request.json()

        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Find referrer by invite code
        const { data: referrer, error: referrerError } = await supabaseAdmin
            .from('phone_users')
            .select('supabase_user_id, invite_code')
            .eq('invite_code', inviteCode)
            .single()

        if (referrerError || !referrer) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
        }

        if (referrer.supabase_user_id === user.id) {
            return NextResponse.json({ error: 'Cannot use your own invite code' }, { status: 400 })
        }

        // Check if already referred
        const { data: existing } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('referred_user_id', user.id)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Already referred' }, { status: 400 })
        }

        // Create referral record
        const { error: insertError } = await supabaseAdmin
            .from('referrals')
            .insert({
                referrer_id: referrer.supabase_user_id,
                referred_user_id: user.id,
                status: 'pending',
                reward_amount: 10
            })

        if (insertError) {
            console.error('Referral insert error:', insertError)
            return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
        }

        // Award credits to both parties
        await supabaseAdmin.rpc('add_credits', {
            user_id: referrer.supabase_user_id,
            amount: 10
        })

        await supabaseAdmin.rpc('add_credits', {
            user_id: user.id,
            amount: 5
        })

        return NextResponse.json({
            success: true,
            message: 'Invite code applied! You received 5 credits.'
        })

    } catch (error) {
        console.error('Referral API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function generateInviteCode(userId: string): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase()
}
