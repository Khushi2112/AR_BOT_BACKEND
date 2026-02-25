import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import invoiceRoutes from './routes/invoiceRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import customerEmailRoutes from './routes/customerEmailRoutes.js';
import mailRoutes from './routes/mailRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors());
// Replace app.use(cors()); with this:
app.use(cors({
    origin: 'https://ar-bot-frontend.vercel.app', // No trailing slash
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/customer-emails', customerEmailRoutes);
app.use('/api/mail', mailRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Finance Portal API is running');
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    console.error('Please ensure you have a .env file with MONGODB_URI set, or set it in your deployment platform.');
    process.exit(1);
}

// Suppress Mongoose strictQuery warning
mongoose.set('strictQuery', false);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });
