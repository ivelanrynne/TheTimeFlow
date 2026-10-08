import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// public routes
app.use('/api/auth', authRoutes);

// private routes
app.use('/api/user', userRoutes);

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  })
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});