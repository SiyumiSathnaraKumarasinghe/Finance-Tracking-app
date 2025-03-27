const mongoose = require('mongoose');
const connectDB = require('../../config/db');

// Mock mongoose
jest.mock('mongoose');

describe('Database Connection', () => {
  // Save original process.exit and console methods
  const originalExit = process.exit;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock process.exit to prevent tests from actually exiting
    process.exit = jest.fn();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original process.exit and console methods
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  test('should connect to MongoDB successfully', async () => {
    // Mock mongoose.connect to resolve successfully
    mongoose.connect.mockResolvedValueOnce();
    
    await connectDB();
    
    // Verify mongoose.connect was called with correct parameters
    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URI, 
      {
        serverSelectionTimeoutMS: 120000,
        socketTimeoutMS: 120000
      }
    );
    
    // Verify success message was logged
    expect(console.log).toHaveBeenCalledWith('MongoDB connected');
    
    // Verify process.exit was not called
    expect(process.exit).not.toHaveBeenCalled();
  });
  
  test('should exit process if MongoDB connection fails', async () => {
    // Mock mongoose.connect to reject with an error
    const mockError = new Error('Connection failed');
    mongoose.connect.mockRejectedValueOnce(mockError);
    
    await connectDB();
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error connecting to MongoDB:', mockError);
    
    // Verify process exited with code 1
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});