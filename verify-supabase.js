require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing connection to:', url);
console.log('Using Key:', key ? key.substring(0, 5) + '...' : 'MISSING');

if (!key || !key.includes('.')) {
    console.error('ERROR: The provided key does not look like a valid JWT (Supabase keys are usually JWTs starting with eyJ...)');
    console.error('Key provided:', key);
}

try {
    const supabase = createClient(url, key);
    console.log('Client created successfully.');
    // Try a simple operation (this might fail if key is completely wrong format)
    console.log('Verification script finished (basic format check).');
} catch (error) {
    console.error('CRITICAL ERROR:', error.message);
}
