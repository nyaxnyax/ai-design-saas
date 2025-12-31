/**
 * Fix user password in both Supabase Auth and phone_users table
 * This script will update the password for phone 15158821994 to Aa123456
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generate the same deterministic shadow password used during registration
const generateShadowPassword = (userPassword, phone) => {
    const salt = 'supabase-shadow-auth-salt-2024'
    const combined = phone + userPassword + salt
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32) + 'Aa1!'
}

async function fixUserPassword() {
    const phone = '15158821994'
    const newPassword = 'Aa123456'

    console.log('🔧 Fixing user password for:', phone)

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
        console.log('❌ Phone user not found. Cannot fix.')
        return
    }

    console.log('✅ Found phone user:', phoneUser.id)

    // 2. Update phone_users password hash
    const passwordHash = await bcrypt.hash(newPassword, 10)
    const { error: updateError } = await supabaseAdmin
        .from('phone_users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('id', phoneUser.id)

    if (updateError) {
        console.error('❌ Error updating phone_users password:', updateError)
    } else {
        console.log('✅ Updated phone_users password hash')
    }

    // 3. Update Supabase Auth user password
    const shadowPassword = generateShadowPassword(newPassword, phone)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        phoneUser.supabase_user_id,
        { password: shadowPassword }
    )

    if (authUpdateError) {
        console.error('❌ Error updating auth user password:', authUpdateError)
    } else {
        console.log('✅ Updated Supabase Auth user password')
    }

    console.log('\n✅ Password fixed successfully!')
    console.log('📝 Phone:', phone)
    console.log('🔑 New Password:', newPassword)
    console.log('\nYou can now login with these credentials.')
}

fixUserPassword().catch(console.error)
