const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    aadhaarNumber: {
        type: String,
        required: true,
        unique: true,
    },
    // Optional profile fields
    phoneNumber: {
        type: String,
        default: ''
    },
    age: {
        type: Number
    },
    gender: {
        type: String,
        enum: ['female', 'male', 'other', 'prefer_not_to_say'],
        default: undefined
    },
    homeAddress: {
        type: String,
        default: ''
    },
    relativeAddress: {
        type: String,
        default: ''
    },
    guardianContactNumber: {
        type: String,
        default: ''
    },
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            default: ''
        }
    }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    }
});

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);