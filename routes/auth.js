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

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
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

// Update current user's profile
router.put('/profile', auth, async (req, res) => {
    try {
        const allowedFields = [
            'name',
            'phoneNumber',
            'age',
            'gender',
            'homeAddress',
            'relativeAddress',
            'guardianContactNumber'
        ];
        const updates = {};
        for (const key of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User Registration (Only allows 'user' role)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, aadhaarNumber, phoneNumber } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user with 'user' role only
        const userData = { 
            name, 
            email, 
            password, 
            aadhaarNumber, 
            phoneNumber,
            role: 'user' // Force role to be 'user' only
        };

        user = new User(userData);
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin-only route to create police/admin accounts
router.post('/create-account', auth, async (req, res) => {
    try {
        console.log('Create account request received:', req.body);
        
        // Check if current user is admin
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'Current user not found' });
        }
        
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { name, email, password, aadhaarNumber, phoneNumber, role, badgeNumber, policeStation, jurisdiction } = req.body;
        
        // Validate required fields
        if (!name || !email || !password || !aadhaarNumber || !phoneNumber || !role) {
            return res.status(400).json({ 
                message: 'Missing required fields: name, email, password, aadhaarNumber, phoneNumber, role' 
            });
        }
        
        // Validate role
        if (!['user', 'police', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if aadhaar number already exists
        existingUser = await User.findOne({ aadhaarNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this Aadhaar number already exists' });
        }

        // Validate police-specific fields
        if (role === 'police') {
            if (!badgeNumber || !policeStation) {
                return res.status(400).json({ 
                    message: 'Badge number and police station are required for police officers' 
                });
            }
        }

        // Create new user with specified role
        const userData = { 
            name, 
            email, 
            password, 
            aadhaarNumber, 
            phoneNumber,
            role,
            status: 'active'
        };

        if (role === 'police') {
            userData.badgeNumber = badgeNumber;
            userData.policeStation = policeStation;
            userData.jurisdiction = jurisdiction || '';
        }

        console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
        
        const user = new User(userData);
        await user.save();
        
        console.log('User created successfully:', user._id);
        res.status(201).json({ 
            message: `${role} account created successfully`,
            userId: user._id
        });
    } catch (err) {
        console.error('Error creating account:', err);
        
        // Handle specific validation errors
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors 
            });
        }
        
        if (err.code === 11000) {
            // Duplicate key error
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ 
                message: `${field} already exists` 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to create account', 
            error: err.message 
        });
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
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Token expires in 7 days instead of 1 hour
        });
        
        // Return user info along with token (excluding password)
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            aadhaarNumber: user.aadhaarNumber,
            role: user.role,
            phoneNumber: user.phoneNumber,
            badgeNumber: user.badgeNumber,
            policeStation: user.policeStation,
            jurisdiction: user.jurisdiction
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

// Admin: Get all users (admin only)
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        const currentUser = await User.findById(req.user.id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Suspend/Activate user
router.put('/users/:userId/:action', auth, async (req, res) => {
    try {
        // Check if user is admin
        const currentUser = await User.findById(req.user.id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { userId, action } = req.params;
        const { status } = req.body;

        if (!['suspend', 'activate'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                status: action === 'suspend' ? 'suspended' : 'active',
                updatedAt: new Date()
            },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;