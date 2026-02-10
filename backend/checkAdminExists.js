require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkAdmin = async () => {
  try {
    console.log('\n🔍 Checking for admin accounts...\n');

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check for any admins
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length === 0) {
      console.log('\n❌ NO ADMIN ACCOUNTS FOUND\n');
      console.log('   Run: node createFirstAdmin.js\n');
    } else {
      console.log(`\n✅ Found ${admins.length} admin account(s):\n`);
      admins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.firstName} ${admin.lastName}`);
        console.log(`      Email: ${admin.email}`);
        console.log(`      Verified: ${admin.isVerified ? 'Yes' : 'No'}`);
      });
      console.log();
    }

    // Also show total user count
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    await mongoose.connection.close();

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
};

checkAdmin();
