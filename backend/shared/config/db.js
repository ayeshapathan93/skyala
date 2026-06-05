const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Starting without MongoDB connection (limited API availability).');
    return null;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    console.warn('Continuing without MongoDB connection (limited API availability).');
    return null;
  }
};

module.exports = connectDB;

