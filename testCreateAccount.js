const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testCreateAccount() {
    try {
        console.log('Testing create-account functionality...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // First, create an admin user if it doesn't exist
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Creating admin user for testing...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            admin = new User({
                name: 'Test Admin',
                email: 'testadmin@test.com',
                password: hashedPassword,
                aadhaarNumber: 'TESTADMIN001',
                phoneNumber: '9999999999',
                role: 'admin',
                status: 'active'
            });
            await admin.save();
            console.log('✅ Test admin created');
        }

        // Test creating a police account
        console.log('\nTesting police account creation...');
        
        const testPoliceData = {
            name: 'Test Police Officer',
            email: 'testpolice@test.com',
            password: 'police123',
            aadhaarNumber: 'TESTPOLICE001',
            phoneNumber: '8888888888',
            role: 'police',
            badgeNumber: 'POL001',
            policeStation: 'Test Station',
            jurisdiction: 'Test Area'
        };

        // Check if test police already exists
        let existingPolice = await User.findOne({ email: testPoliceData.email });
        if (existingPolice) {
            console.log('Test police account already exists, deleting...');
            await User.findByIdAndDelete(existingPolice._id);
        }

        // Create the test police account
        const testPolice = new User(testPoliceData);
        await testPolice.save();
        
        console.log('✅ Test police account created successfully!');
        console.log('Police ID:', testPolice._id);
        console.log('Role:', testPolice.role);
        console.log('Badge Number:', testPolice.badgeNumber);

        // Test login with the created account
        console.log('\nTesting login with created police account...');
        const foundPolice = await User.findOne({ email: testPoliceData.email });
        const isPasswordValid = await bcrypt.compare('police123', foundPolice.password);
        
        if (isPasswordValid) {
            console.log('✅ Police account login test successful!');
        } else {
            console.log('❌ Police account login test failed!');
        }

        // Clean up test data
        console.log('\nCleaning up test data...');
        await User.findByIdAndDelete(testPolice._id);
        console.log('✅ Test police account deleted');

    } catch (error) {
        console.error('❌ Error in test:', error.message);
        console.log('Full error:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

testCreateAccount();
