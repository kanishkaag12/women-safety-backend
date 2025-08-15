const mongoose = require('mongoose');
const Alert = require('./models/Alert');
require('dotenv').config();

async function checkAlerts() {
    try {
        console.log('Checking all alerts in the database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all alerts
        const alerts = await Alert.find().sort({ createdAt: -1 });
        
        if (alerts.length === 0) {
            console.log('❌ No alerts found in the database');
            return;
        }

        console.log(`\n📊 Found ${alerts.length} alert(s):\n`);
        
        alerts.forEach((alert, index) => {
            console.log(`--- Alert ${index + 1} ---`);
            console.log(`ID: ${alert._id}`);
            console.log(`User: ${alert.userName} (${alert.userId})`);
            console.log(`Type: ${alert.type}`);
            console.log(`Priority: ${alert.priority}`);
            console.log(`Status: ${alert.status}`);
            console.log(`Location: ${alert.location}`);
            console.log(`Created: ${new Date(alert.createdAt).toLocaleString()}`);
            
            if (alert.assignedPoliceOfficer) {
                console.log(`Assigned to: ${alert.assignedPoliceOfficer}`);
            }
            
            console.log(''); // Empty line for readability
        });

        // Check for recent emergency alerts
        const recentEmergencyAlerts = alerts.filter(alert => 
            alert.type === 'emergency' && 
            new Date(alert.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        );
        
        if (recentEmergencyAlerts.length > 0) {
            console.log(`🚨 Recent Emergency Alerts (Last 24h): ${recentEmergencyAlerts.length}`);
            recentEmergencyAlerts.forEach(alert => {
                console.log(`- ${alert.userName} at ${new Date(alert.createdAt).toLocaleString()}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking alerts:', error.message);
        console.log('Full error:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

checkAlerts();
