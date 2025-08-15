const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testAdminLogin() {
    try {
        console.log('Testing admin login...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find admin account
        const admin = await User.findOne({ email: 'admin@womensafety.com' });
        if (!admin) {
            console.log('❌ Admin account not found!');
            return;
        }

        console.log('✅ Admin account found:');
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);

        // Test password
        const testPassword = 'admin123';
        const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
        
        if (isPasswordValid) {
            console.log('✅ Password is valid!');
            console.log('You can now login with:');
            console.log('Email: admin@womensafety.com');
            console.log('Password: admin123');
        } else {
            console.log('❌ Password is NOT valid!');
            console.log('This means there was a password hashing issue');
        }

    } catch (error) {
        console.error('❌ Error testing admin login:', error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

testAdminLogin();
