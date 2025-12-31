/**
 * Add credits to user
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addCredits() {
    const phone = '15158821994'

    console.log('🔧 Adding credits for user:', phone)

    // 1. Find user in phone_users
    const { data: phoneUser, error: findError } = await supabaseAdmin
        .from('phone_users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()

    if (findError) {
        console.error('❌ Error finding phone user:', findError)
        return
    }

    if (!phoneUser) {
        console.log('❌ Phone user not found.')
        return
    }

    console.log('✅ Found phone user:', phoneUser.id)

    // 2. Update or insert credits
    const { data: existingCredits } = await supabaseAdmin
        .from('user_credits')
        .select('*')
        .eq('user_id', phoneUser.supabase_user_id)
        .maybeSingle()

    if (existingCredits) {
        // Add 100 credits
        const { error: updateError } = await supabaseAdmin
            .from('user_credits')
            .update({ balance: existingCredits.balance + 100 })
            .eq('user_id', phoneUser.supabase_user_id)

        if (updateError) {
            console.error('❌ Error updating credits:', updateError)
        } else {
            console.log('✅ Added 100 credits. New balance:', existingCredits.balance + 100)
        }
    } else {
        // Create new credits record
        const { error: insertError } = await supabaseAdmin
            .from('user_credits')
            .insert({
                user_id: phoneUser.supabase_user_id,
                balance: 100,
                daily_generations: 0,
                last_daily_reset: new Date().toISOString()
            })

        if (insertError) {
            console.error('❌ Error inserting credits:', insertError)
        } else {
            console.log('✅ Created credits record with 100 credits')
        }
    }
}

addCredits().catch(console.error)
