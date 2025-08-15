const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function createTestAlert() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get a user to create the alert for
        const user = await User.findOne({ role: 'user' });
        console.log('Creating alert for user:', user.name);

        // Create a test alert
        const testAlert = new Alert({
            userId: user._id,
            userName: user.name,
            location: 'Test Location',
            coordinates: '12.345,67.890',
            type: 'manual',
            priority: 'medium',
            status: 'active'
        });

        const savedAlert = await testAlert.save();
        console.log('Created test alert:', savedAlert._id);
        console.log('Alert details:', {
            id: savedAlert._id,
            userName: savedAlert.userName,
            status: savedAlert.status,
            location: savedAlert.location
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestAlert();
