const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminAccount() {
    try {
        console.log('Starting admin account creation...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
        console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
        
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not set in .env file!');
            console.log('Please create a .env file with your MongoDB connection string');
            process.exit(1);
        }

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is not set in .env file!');
            console.log('Please create a .env file with your JWT secret');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        // Check if admin already exists
        console.log('Checking for existing admin account...');
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('ℹ️ Admin account already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.name);
            process.exit(0);
        }

        // Create admin account
        console.log('Creating new admin account...');
        // Don't hash password here - the User model will hash it automatically
        
        const adminUser = new User({
            name: 'System Administrator',
            email: 'admin@womensafety.com',
            password: 'admin123', // Plain text - will be hashed by the model
            aadhaarNumber: 'ADMIN001',
            phoneNumber: '9999999999',
            role: 'admin',
            adminLevel: 'super_admin',
            status: 'active'
        });

        await adminUser.save();
        console.log('✅ Admin account created successfully!');
        console.log('📧 Email: admin@womensafety.com');
        console.log('🔑 Password: admin123');
        console.log('⚠️  Please change these credentials after first login!');

        // Verify the account was created
        const verifyAdmin = await User.findOne({ email: 'admin@womensafety.com' });
        if (verifyAdmin) {
            console.log('✅ Verification: Admin account found in database');
            console.log('Role:', verifyAdmin.role);
            console.log('Status:', verifyAdmin.status);
        }

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        
        if (error.name === 'MongoServerSelectionError') {
            console.log('💡 Tip: Check your MongoDB connection string and network connection');
        } else if (error.name === 'ValidationError') {
            console.log('💡 Tip: Check your User model schema');
        }
        
        console.log('Full error:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

createAdminAccount();
