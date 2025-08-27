require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

async function createAdminAccounts() {
  try {
    console.log('🔧 Creating admin accounts...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const adminEmails = [
      'keshav.gupta@imaginxp.com',
      'ashwani.kumar@imaginxp.com',
      'nikhil.yadav@imaginxp.com'
    ];
    
    for (const email of adminEmails) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (existingAdmin) {
          console.log(`⚠️  Admin ${email} already exists`);
          continue;
        }
        
        // Create new admin
        const admin = new Admin({
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email.toLowerCase(),
          username: email.split('@')[0],
          permissions: [
            'manage_departments',
            'manage_batches', 
            'manage_subjects',
            'manage_teachers',
            'manage_students',
            'manage_timetables',
            'view_reports',
            'manage_admins'
          ],
          isActive: true
        });
        
        await admin.save();
        console.log(`✅ Created admin: ${email}`);
        
      } catch (error) {
        console.error(`❌ Error creating admin ${email}:`, error.message);
      }
    }
    
    // List all admins
    const allAdmins = await Admin.find({}).select('name email username isActive');
    console.log('\n📊 All admin accounts:');
    console.log('========================');
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdminAccounts();
