// women-safety-backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const alertsRouter = require('./routes/alerts'); // Import the alerts router

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/alerts', alertsRouter); // Use the alerts router for /api/alerts endpoints

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas!');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(err => {
    console.error('Could not connect to MongoDB Atlas:', err);
});