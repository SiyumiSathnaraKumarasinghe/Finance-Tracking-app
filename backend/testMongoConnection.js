const mongoose = require('mongoose');

// Replace with your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://Siyumi:Siyu2000@cluster0.n50y7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
    console.log('Connection Status:', mongoose.connection.readyState); // Should be 1
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  } finally {
    mongoose.connection.close(); // Close connection after checking
  }
}

connectDB();
