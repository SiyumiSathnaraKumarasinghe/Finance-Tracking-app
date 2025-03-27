const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 120000,  // 2 minutes timeout
      socketTimeoutMS: 120000,           // 2 minutes socket timeout
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Stop the app if connection fails
  }
};

module.exports = connectDB;
