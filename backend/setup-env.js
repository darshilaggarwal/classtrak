const fs = require('fs');
const path = require('path');

const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/classtrack

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=classtrack-super-secret-jwt-key-for-development-only-change-in-production

# Email Configuration (for OTP) - UPDATE WITH YOUR GMAIL CREDENTIALS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Server Configuration
PORT=5001
NODE_ENV=development

# Rate Limiting
MAX_OTP_REQUESTS_PER_HOUR=5
OTP_EXPIRY_MINUTES=5
`;

const envPath = path.join(__dirname, '.env');

try {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file successfully!');
    console.log('\n📧 IMPORTANT: Update the following in your .env file:');
    console.log('- EMAIL_USER: Your Gmail address');
    console.log('- EMAIL_PASS: Your Gmail app password');
    console.log('\n🔧 To get Gmail app password:');
    console.log('1. Enable 2-factor authentication in Gmail');
    console.log('2. Go to Google Account → Security → 2-Step Verification → App passwords');
    console.log('3. Generate 16-character app password');
    console.log('4. Use that password in EMAIL_PASS');
  } else {
    console.log('⚠️  .env file already exists');
  }
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
