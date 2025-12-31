/**
 * Test large file upload to Supabase Storage
 * This simulates uploading a 4K image (~10-15MB)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLargeUpload() {
    console.log('🧪 Testing large file upload (simulating 4K image size)...\n');

    // Simulate a 10MB file (typical 4K image size)
    const targetSizeMB = 10;
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const buffer = Buffer.alloc(targetSizeBytes, 'x');

    console.log(`📦 Creating test file: ${targetSizeMB}MB (${targetSizeBytes} bytes)`);
    console.log(`This simulates a 4K PNG image\n`);

    const filename = `test-large/${Date.now()}-${targetSizeMB}mb.test`;
    const startTime = Date.now();

    console.log('📤 Starting upload...');
    try {
        const { error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(filename, buffer, {
                contentType: 'image/png',
                upsert: true
            });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (uploadError) {
            console.error(`❌ Upload failed after ${elapsed}s`);
            console.error(`Error: ${uploadError.message}`);
            console.error(`Full error:`, JSON.stringify(uploadError, null, 2));

            console.log('\n💡 Possible issues:');
            console.log('   1. File size limit exceeded (check Supabase bucket settings)');
            console.log('   2. Network timeout');
            console.log('   3. Insufficient storage quota');

            return;
        }

        console.log(`✅ Upload successful! (${elapsed}s)`);

        const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(filename);

        console.log(`🌐 Public URL: ${publicUrl}`);

        // Clean up
        console.log('\n🧹 Cleaning up test file...');
        await supabase.storage.from('user-uploads').remove([filename]);
        console.log('✅ Done!');

        console.log('\n' + '='.repeat(50));
        console.log('✅ Large file upload test PASSED!');
        console.log('   Your storage can handle 4K images.');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Exception:', error.message);
    }
}

testLargeUpload();
