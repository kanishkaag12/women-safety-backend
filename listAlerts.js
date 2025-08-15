const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function listAlerts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // List all alerts
        const alerts = await Alert.find({}).populate('userId', 'name email');
        console.log('All alerts:', alerts.length);
        
        alerts.forEach((alert, index) => {
            console.log(`Alert ${index + 1}:`);
            console.log('  ID:', alert._id);
            console.log('  User:', alert.userName);
            console.log('  Status:', alert.status);
            console.log('  Assigned Police Officer:', alert.assignedPoliceOfficer);
            console.log('  Created:', alert.createdAt);
            console.log('---');
        });

        // List all users
        const users = await User.find({}).select('name email role');
        console.log('\nAll users:', users.length);
        
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log('  ID:', user._id);
            console.log('  Name:', user.name);
            console.log('  Email:', user.email);
            console.log('  Role:', user.role);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

listAlerts();
