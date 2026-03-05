import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Manager', 'Member'],
        default: 'Member'
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Member = mongoose.model('Member', memberSchema);

export default Member;
