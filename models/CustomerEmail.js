import mongoose from 'mongoose';

const customerEmailSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    toEmails: {
        type: [String],
        default: [],
        validate: {
            validator: (arr) => arr.length <= 4,
            message: 'Maximum of 4 TO email addresses are allowed.'
        }
    },
    ccEmails: {
        type: [String],
        default: [],
        validate: {
            validator: (arr) => arr.length <= 8,
            message: 'Maximum of 8 CC email addresses are allowed.'
        }
    }
}, {
    timestamps: true,
    collection: 'customer_emails'
});

const CustomerEmail = mongoose.model('CustomerEmail', customerEmailSchema);

export default CustomerEmail;
