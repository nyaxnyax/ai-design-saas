/**
 * Check Supabase Storage file size limits via API
 */

const https = require('https');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const apiUrl = `https://${projectRef}.supabase.co/storage/v1/bucket`;

async function checkBucketLimits() {
    console.log('🔍 Checking Supabase Storage bucket limits...\n');
    console.log(`Project: ${projectRef}`);
    console.log(`API URL: ${apiUrl}\n`);

    const options = {
        method: 'GET',
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const protocol = apiUrl.startsWith('https') ? https : http;

        const req = protocol.request(apiUrl, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const buckets = JSON.parse(data);
                        const userUploads = buckets.find(b => b.name === 'user-uploads');

                        if (userUploads) {
                            console.log('✅ Found user-uploads bucket:\n');
                            console.log(JSON.stringify(userUploads, null, 2));
                            console.log('\n' + '='.repeat(50));
                            console.log('📊 Key Information:');
                            console.log('='.repeat(50));
                            console.log(`Name: ${userUploads.name}`);
                            console.log(`Public: ${userUploads.public}`);
                            console.log(`File Size Limit: ${userUploads.file_size_limit || 'Not set (default 100MB)'}`);
                            console.log(`Allowed MIME Types: ${userUploads.allowed_mime_types || 'All'}`);
                        } else {
                            console.log('❌ user-uploads bucket not found');
                        }
                        resolve(buckets);
                    } catch (e) {
                        console.error('Failed to parse response:', e.message);
                        reject(e);
                    }
                } else {
                    console.error(`Request failed: ${res.statusCode}`);
                    console.error(data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

checkBucketLimits().then(() => {
    console.log('\n✅ Check complete!\n');
}).catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
