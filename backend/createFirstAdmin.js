require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createFirstAdmin = async () => {
  try {
    console.log('\n🔧 Creating First Admin Account...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('\n   To create another admin, use the User Management page in the dashboard.\n');
      await mongoose.connection.close();
      return;
    }

    // Default admin credentials
    const adminData = {
      firstName: 'Library',
      lastName: 'Admin',
      suffix: '',
      email: 'admin@gmail.com',
      password: 'Admin123@', // Change this after first login!
      contactNumber: '09000000000',
      address: 'Parañaledge Library',
      role: 'admin',
      isVerified: true
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const newAdmin = new User({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      suffix: adminData.suffix,
      email: adminData.email,
      password: hashedPassword,
      contactNumber: adminData.contactNumber,
      address: adminData.address,
      role: adminData.role,
      isVerified: true
    });

    await newAdmin.save();

    console.log('\n✅ First Admin Account Created Successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('   Email: ' + adminData.email);
    console.log('   Password: ' + adminData.password);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Login with these credentials immediately');
    console.log('   2. Change the password to something secure');
    console.log('   3. Never share these credentials\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');

  } catch (err) {
    console.error('\n❌ Error creating admin account:', err.message);
    process.exit(1);
  }
};

createFirstAdmin();
