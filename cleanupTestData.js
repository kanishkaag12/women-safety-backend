const mongoose = require('mongoose');
const Alert = require('./models/Alert');
require('dotenv').config();

async function cleanupTestData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Remove the test alert
        const result = await Alert.findByIdAndDelete('689f30ae001ce7e5953d8815');
        if (result) {
            console.log('Removed test alert');
        } else {
            console.log('Test alert not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

cleanupTestData();
