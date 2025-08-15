const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, aadhaarNumber } = req.body;
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create new user
        user = new User({ name, email, password, aadhaarNumber });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Generate a JWT token with longer expiration
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Token expires in 7 days instead of 1 hour
        });
        
        // Return user info along with token (excluding password)
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            aadhaarNumber: user.aadhaarNumber
        };
        
        res.json({ token, user: userResponse });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Validate Token and Get User Info
router.get('/validate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Refresh Token
router.post('/refresh', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate a new token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout (optional - for explicit logout)
router.post('/logout', auth, (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from localStorage
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;