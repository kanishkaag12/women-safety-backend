const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const alertsRouter = require('./routes/alerts');
const authRouter = require('./routes/auth'); // Import the auth router

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

app.use('/api/alerts', alertsRouter);
app.use('/api/auth', authRouter); // Use the auth router for /api/auth endpoints

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas!');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }).catch(err => {
        console.error('Could not connect to MongoDB Atlas:', err);
    });