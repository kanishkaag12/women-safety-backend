const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function testManualAssign() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the police officer
        const policeOfficer = await User.findOne({ role: 'police' });
        console.log('Police officer:', policeOfficer.name, 'ID:', policeOfficer._id);

        // Get an active alert
        const activeAlert = await Alert.findOne({ status: 'active' });
        if (!activeAlert) {
            console.log('No active alerts found');
            return;
        }
        console.log('Active alert:', activeAlert._id, 'User:', activeAlert.userName);

        // Manually assign the case
        const updatedAlert = await Alert.findByIdAndUpdate(
            activeAlert._id,
            {
                assignedPoliceOfficer: policeOfficer._id,
                policeStation: policeOfficer.policeStation,
                badgeNumber: policeOfficer.badgeNumber,
                jurisdiction: policeOfficer.jurisdiction,
                status: 'assigned',
                assignedAt: new Date()
            },
            { new: true }
        );

        console.log('Updated alert:', updatedAlert);

        // Test fetching assigned cases
        const assignedCases = await Alert.find({ 
            assignedPoliceOfficer: policeOfficer._id 
        });

        console.log('Found assigned cases:', assignedCases.length);
        console.log('Assigned cases:', assignedCases.map(a => ({
            id: a._id,
            userName: a.userName,
            status: a.status,
            assignedPoliceOfficer: a.assignedPoliceOfficer
        })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testManualAssign();
