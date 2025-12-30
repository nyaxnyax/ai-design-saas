/**
 * Update existing users' shadow passwords to use deterministic approach
 *
 * This script:
 * 1. Reads all phone_users records
 * 2. For each user, generates a deterministic shadow password based on their actual password
 * 3. Updates the auth.users record with the new shadow password
 *
 * WARNING: After running this, users should be able to login normally
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generate deterministic shadow password (same as in register/login)
const generateShadowPassword = (userPassword, phone) => {
    const salt = 'supabase-shadow-auth-salt-2024'
    const combined = phone + userPassword + salt
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32) + 'Aa1!'
}

// For testing, use known credentials
const TEST_PHONE = '15158821994'
const TEST_PASSWORD = 'ny5566521'

async function updateShadowPasswords() {
    try {
        console.log('🔄 Starting shadow password update...\n')

        // 1. Get the specific test user
        const { data: phoneUser, error: findError } = await supabaseAdmin
            .from('phone_users')
            .select('*')
            .eq('phone', TEST_PHONE)
            .single()

        if (findError || !phoneUser) {
            console.error('❌ User not found:', TEST_PHONE)
            return
        }

        console.log(`👤 Found user: ${phoneUser.phone}`)
        console.log(`   Supabase User ID: ${phoneUser.supabase_user_id}`)

        // 2. Generate the new shadow password
        // We need to use the user's ACTUAL password (not the hash)
        // Since we can't decrypt the hash, we'll use the known test password
        const newShadowPassword = generateShadowPassword(TEST_PASSWORD, TEST_PHONE)

        console.log(`\n🔑 Generated new shadow password (first 20 chars): ${newShadowPassword.substring(0, 20)}...`)

        // 3. Update the auth user with the new shadow password
        console.log('\n🔄 Updating auth.users password...')

        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            phoneUser.supabase_user_id,
            { password: newShadowPassword }
        )

        if (updateError) {
            console.error('❌ Error updating shadow password:', updateError)
            return
        }

        console.log('✅ Shadow password updated successfully!')
        console.log(`   User ID: ${updateData.user.id}`)
        console.log(`   Email: ${updateData.user.email}`)

        console.log('\n✨ You should now be able to login with:')
        console.log(`   Phone: ${TEST_PHONE}`)
        console.log(`   Password: ${TEST_PASSWORD}`)

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

updateShadowPasswords()
