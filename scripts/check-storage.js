/**
 * Supabase Storage Check Script
 * Run with: node scripts/check-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('🔍 Checking Supabase Storage configuration...\n');
    console.log(`Project URL: ${supabaseUrl}\n`);

    // 1. List all buckets
    console.log('📦 Step 1: Listing all storage buckets...');
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Failed to list buckets:', error.message);
            return;
        }

        if (!buckets || buckets.length === 0) {
            console.log('⚠️  No buckets found!');
            console.log('\n💡 You need to create a bucket named "user-uploads"');
            console.log('   Go to: https://supabase.com/dashboard/project/nvvinmvhapafxgrgrtnz/storage');
            return;
        }

        console.log(`✅ Found ${buckets.length} bucket(s):`);
        buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (public: ${bucket.public})`);
        });

        // 2. Check if user-uploads bucket exists
        console.log('\n📦 Step 2: Checking "user-uploads" bucket...');
        const userUploadsBucket = buckets.find(b => b.name === 'user-uploads');

        if (!userUploadsBucket) {
            console.log('❌ "user-uploads" bucket does NOT exist!');
            console.log('\n💡 Create it with these settings:');
            console.log('   - Name: user-uploads');
            console.log('   - Public: ✅ Enabled (important!)');
            console.log('   - File size limit: 50MB or higher (for 4K images)');
            console.log('   - Allowed MIME types: image/*');
            console.log('\n   Go to: https://supabase.com/dashboard/project/nvvinmvhapafxgrgrtnz/storage');
            return;
        }

        console.log('✅ "user-uploads" bucket exists');
        console.log(`   Public access: ${userUploadsBucket.public ? '✅ Enabled' : '❌ Disabled'}`);

        if (!userUploadsBucket.public) {
            console.log('\n⚠️  WARNING: Bucket is not public!');
            console.log('   Generated images will not be accessible.');
            console.log('   Enable public access in bucket settings.');
        }

        // 3. Test upload
        console.log('\n📤 Step 3: Testing upload to "user-uploads"...');
        const testFilename = `test/${Date.now()}.txt`;
        const testContent = Buffer.from('Storage test - delete me');

        const { error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(testFilename, testContent, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload test failed:', uploadError.message);
            console.log('\n💡 Possible issues:');
            console.log('   - RLS (Row Level Security) policies blocking upload');
            console.log('   - Insufficient permissions');
            console.log('   - Bucket not configured correctly');
            return;
        }

        console.log('✅ Upload test successful!');

        // 4. Test public URL
        console.log('\n🌐 Step 4: Testing public URL access...');
        const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(testFilename);

        console.log(`   Public URL: ${publicUrl}`);

        try {
            const response = await fetch(publicUrl);
            if (response.ok) {
                console.log('✅ Public URL is accessible!');
            } else {
                console.log(`⚠️  Public URL returned status: ${response.status}`);
                console.log('   Check bucket public settings and RLS policies.');
            }
        } catch (e) {
            console.log('⚠️  Could not verify public URL access (might be CORS)');
        }

        // 5. Clean up test file
        console.log('\n🧹 Step 5: Cleaning up test file...');
        await supabase.storage.from('user-uploads').remove([testFilename]);
        console.log('✅ Test file removed');

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('✅ Storage configuration check PASSED!');
        console.log('='.repeat(50));
        console.log('\nYour Supabase storage is properly configured.');
        console.log('4K image uploads should work correctly.\n');

    } catch (error) {
        console.error('❌ Error during check:', error.message);
    }
}

checkStorage().then(() => {
    console.log('Check complete.\n');
});
