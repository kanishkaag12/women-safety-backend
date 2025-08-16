const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const alertsRouter = require('./routes/alerts');
const authRouter = require('./routes/auth'); // Import the auth router
const contactsRouter = require('./routes/contacts'); // Import the contacts router

dotenv.config();

// Ensure you have a JWT_SECRET in your .env file
// Example: JWT_SECRET=your_secret_key_here
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route to check server and database connection
app.get('/api/test', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        res.json({ 
            status: 'Server is running',
            database: dbStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Server error',
            details: error.message
        });
    }
});

app.use('/api/alerts', alertsRouter);
app.use('/api/auth', authRouter); // Use the auth router for /api/auth endpoints
app.use('/api/contacts', contactsRouter); // Use the contacts router for /api/contacts endpoints

// Connect to MongoDB Atlas
console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas!');
        console.log('Database connection string:', process.env.MONGODB_URI.replace(/:[^:/@]+@/, ':****@')); // Hide password in logs
        
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API endpoints available at http://localhost:${port}/api`);
        });
    }).catch(err => {
        console.error('Failed to connect to MongoDB Atlas. Error details:');
        console.error(err);
        process.exit(1);
    });