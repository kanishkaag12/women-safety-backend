const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testLogin() {
    try {
        console.log('Testing login functionality...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // First, create a test user if it doesn't exist
        let testUser = await User.findOne({ email: 'testuser@test.com' });
        if (testUser) {
            console.log('Deleting existing test user...');
            await User.findByIdAndDelete(testUser._id);
            console.log('✅ Existing test user deleted');
        }
        
        console.log('Creating test user...');
        // Don't hash password here - the User model will hash it automatically
        testUser = new User({
            name: 'Test User',
            email: 'testuser@test.com',
            password: 'test123', // Plain text - will be hashed by the model
            aadhaarNumber: 'TESTUSER001',
            phoneNumber: '7777777777',
            role: 'user',
            status: 'active'
        });
        await testUser.save();
        console.log('✅ Test user created');

        console.log('\nTest user details:');
        console.log('Name:', testUser.name);
        console.log('Email:', testUser.email);
        console.log('Role:', testUser.role);
        console.log('Status:', testUser.status);

        // Test password validation
        console.log('\nTesting password validation...');
        const testPassword = 'test123';
        const isPasswordValid = await bcrypt.compare(testPassword, testUser.password);
        
        if (isPasswordValid) {
            console.log('✅ Password validation successful!');
            console.log('You can now test login with:');
            console.log('Email: testuser@test.com');
            console.log('Password: test123');
        } else {
            console.log('❌ Password validation failed!');
            console.log('This suggests there was a password hashing issue');
        }

        // Test the login endpoint by simulating the request
        console.log('\nSimulating login request...');
        const loginData = {
            email: 'testuser@test.com',
            password: 'test123'
        };

        // This simulates what the frontend would send
        console.log('Login data:', loginData);
        console.log('Expected response should include:');
        console.log('- token: JWT token');
        console.log('- user: user object with role, name, email, etc.');

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

testLogin();
