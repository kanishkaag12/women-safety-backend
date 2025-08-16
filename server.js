const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
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
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Socket.IO setup for live audio streaming
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication token required'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // { id, role, ... }
        next();
    } catch (err) {
        next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.user?.id, 'role:', socket.user?.role);

    socket.on('join-alert', ({ alertId }) => {
        if (!alertId) return;
        const room = `alert:${alertId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave-alert', ({ alertId }) => {
        if (!alertId) return;
        const room = `alert:${alertId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Receive audio chunks from user device and relay to listeners
    socket.on('audio-start', ({ alertId, mimeType }) => {
        if (!alertId) return;
        const room = `alert:${alertId}`;
        // Notify room listeners and also broadcast a global live-status for dashboards
        socket.to(room).emit('audio-start', { mimeType });
        io.emit('live-status', { alertId, isLive: true, mimeType });
    });

    socket.on('audio-chunk', ({ alertId, mimeType, chunk }) => {
        if (!alertId || !chunk) return;
        const room = `alert:${alertId}`;
        // Broadcast to all except sender
        socket.to(room).emit('audio-chunk', { mimeType, chunk });
    });

    socket.on('audio-end', ({ alertId }) => {
        if (!alertId) return;
        const room = `alert:${alertId}`;
        socket.to(room).emit('audio-end');
        // Broadcast global live-status false so dashboards can disable Listen
        io.emit('live-status', { alertId, isLive: false });
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, reason);
    });
});

// Connect to MongoDB Atlas
console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas!');
        console.log('Database connection string:', process.env.MONGODB_URI.replace(/:[^:/@]+@/, ':****@')); // Hide password in logs
        
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API endpoints available at http://localhost:${port}/api`);
            console.log(`Socket.IO listening on ws://localhost:${port}`);
        });
    }).catch(err => {
        console.error('Failed to connect to MongoDB Atlas. Error details:');
        console.error(err);
        process.exit(1);
    });