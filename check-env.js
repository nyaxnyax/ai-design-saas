const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');

console.log('Checking .env.local at:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local file not found!');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const requiredKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMSBAO_USER',
    'SMSBAO_PASS'
];

let hasError = false;

requiredKeys.forEach(key => {
    if (!envConfig[key]) {
        console.error(`ERROR: Missing key: ${key}`);
        hasError = true;
    } else {
        console.log(`OK: ${key} is present (Length: ${envConfig[key].length})`);
    }
});

if (hasError) {
    console.error('Validation FAILED.');
    process.exit(1);
} else {
    console.log('Validation SUCCESS. All keys are present.');
}
