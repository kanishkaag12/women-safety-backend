const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function testAssignCase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a test user (police officer)
        const testUser = new User({
            name: 'Test Police Officer',
            email: 'testpolice2@test.com',
            password: 'testpass123',
            role: 'police',
            aadhaarNumber: '123456789013',
            phoneNumber: '9876543211',
            badgeNumber: 'POL124',
            policeStation: 'Test Station',
            jurisdiction: 'Test Area'
        });

        const savedUser = await testUser.save();
        console.log('Created test police user:', savedUser._id);

        // Create a test alert
        const testAlert = new Alert({
            userId: savedUser._id, // Using the same user as the victim for simplicity
            userName: 'Test Victim',
            location: 'Test Location',
            coordinates: '12.345,67.890',
            type: 'manual',
            priority: 'medium',
            status: 'active'
        });

        const savedAlert = await testAlert.save();
        console.log('Created test alert:', savedAlert._id);

        // Now test assigning the case
        const updatedAlert = await Alert.findByIdAndUpdate(
            savedAlert._id,
            {
                assignedPoliceOfficer: savedUser._id,
                policeStation: 'Test Station',
                badgeNumber: 'POL123',
                jurisdiction: 'Test Area',
                status: 'assigned',
                assignedAt: new Date()
            },
            { new: true }
        );

        console.log('Assigned alert:', updatedAlert);

        // Test fetching assigned cases
        const assignedCases = await Alert.find({ 
            assignedPoliceOfficer: savedUser._id 
        });

        console.log('Found assigned cases:', assignedCases.length);
        console.log('Assigned cases:', assignedCases);

        // Clean up
        await Alert.findByIdAndDelete(savedAlert._id);
        await User.findByIdAndDelete(savedUser._id);
        console.log('Test completed and cleaned up');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testAssignCase();
