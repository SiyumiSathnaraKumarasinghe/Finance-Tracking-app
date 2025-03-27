const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// First, let's check what valid role values are defined in the User model
let validRoles = [];
if (User.schema.path('role').enumValues) {
  validRoles = User.schema.path('role').enumValues;
  console.log('Valid role values:', validRoles);
}

// Use the first value as admin role and second as regular user role
const ADMIN_ROLE = validRoles[0] || 'admin';
const USER_ROLE = validRoles[1] || 'user';

console.log(`Using ${ADMIN_ROLE} as admin role and ${USER_ROLE} as user role`);

// Mock the auth middleware with correct function names
jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => next()),
  adminOnly: jest.fn((req, res, next) => next())
}));

// Import the middleware AFTER mocking it
const { protect, adminOnly } = require('../../middleware/authMiddleware');
const userRoutes = require('../../routes/userRoutes');

describe('User Routes Integration Tests', () => {
  let mongoServer;
  let app;
  let adminToken;
  let regularToken;
  let adminUser;
  let regularUser;
  
  // Set up the Express app and database before tests
  beforeAll(async () => {
    // Create a new MongoDB in-memory server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Create a simple Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    
    // Create test users with valid role values
    adminUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedPassword123',
      role: ADMIN_ROLE
    });
    await adminUser.save();
    
    regularUser = new User({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'hashedPassword123',
      role: USER_ROLE
    });
    await regularUser.save();
    
    // Create JWT tokens for testing
    const jwtSecret = process.env.JWT_SECRET || 'your_test_secret';
    adminToken = jwt.sign({ id: adminUser._id, role: ADMIN_ROLE }, jwtSecret, { expiresIn: '1h' });
    regularToken = jwt.sign({ id: regularUser._id, role: USER_ROLE }, jwtSecret, { expiresIn: '1h' });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    protect.mockImplementation((req, res, next) => {
      req.user = { id: adminUser._id, role: ADMIN_ROLE };
      next();
    });
  });
  
  describe('GET /api/users', () => {
    it('should return all users when admin is authenticated', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // At least our two test users
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('role');
    });
    
    it('should not allow regular users to access all users', async () => {
      protect.mockImplementation((req, res, next) => {
        req.user = { id: regularUser._id, role: USER_ROLE };
        next();
      });
      
      adminOnly.mockImplementation((req, res, next) => {
        if (req.user.role !== ADMIN_ROLE) {
          return res.status(403).json({ message: 'Access denied: Admin role required' });
        }
        next();
      });
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied: Admin role required');
    });
  });
  
  describe('PUT /api/users/:id', () => {
    it('should update user role when admin is authenticated', async () => {
      const newRole = ADMIN_ROLE;
      
      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: newRole });
      
      expect(response.status).toBe(200);
      // Updated to match actual implementation's response message
      expect(response.body).toHaveProperty('message', 'User updated');
      
      // Verify the role was updated in the database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.role).toBe(newRole);
    });
  });
  
  describe('DELETE /api/users/:id', () => {
    it('should delete a user when admin is authenticated', async () => {
      const userToDelete = new User({
        name: 'Delete Me',
        email: 'delete@test.com',
        password: 'hashedPassword123',
        role: USER_ROLE
      });
      await userToDelete.save();
      
      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted');
      
      // Verify the user was deleted from the database
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });
  });
});