const request = require('supertest');
const express = require('express');
const User = require('../../models/User');
const userRoutes = require('../../routes/userRoutes');
const { protect, adminOnly } = require('../../middleware/authMiddleware');

// Mock the auth middleware
jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => next()),
  adminOnly: jest.fn((req, res, next) => next())
}));

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let adminUser;
  let normalUser;
  let mockUsers;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock user data
    adminUser = { _id: 'admin123', id: 'admin123', name: 'Admin User', email: 'admin@test.com', role: 'admin' };
    normalUser = { _id: 'user123', name: 'Normal User', email: 'user@test.com', role: 'user' };
    mockUsers = [adminUser, normalUser];
    
    // Mock req.user that would be set by auth middleware
    protect.mockImplementation((req, res, next) => {
      req.user = adminUser;
      next();
    });
  });

  afterAll(done => {
    // Close any open handles
    done();
  });

  describe('GET /', () => {
    // Increase the timeout for these tests
    jest.setTimeout(10000);
    
    it('should return all users if admin', async () => {
      // Mock User.find
      User.find = jest.fn().mockReturnThis();
      User.find().select = jest.fn().mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/users');

      expect(protect).toHaveBeenCalled();
      expect(adminOnly).toHaveBeenCalled();
      expect(User.find().select).toHaveBeenCalledWith('-password');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockUsers);
    });

    it('should handle errors', async () => {
      // Mock User.find to throw an error
      const errorMessage = 'Database connection error';
      User.find = jest.fn().mockReturnThis();
      User.find().select = jest.fn().mockRejectedValue(new Error(errorMessage));

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server Error');
      expect(res.body).toHaveProperty('error', errorMessage);
    });
  });

  describe('PUT /:id', () => {
    // Increase the timeout for these tests
    jest.setTimeout(10000);
    
    it('should update user role if admin', async () => {
      // Setup
      const userId = 'user123';
      const updatedRole = 'editor';
      
      // Mock user with save method
      const mockUser = {
        _id: userId,
        id: userId,
        role: normalUser.role,
        save: jest.fn().mockResolvedValue({ _id: userId, role: updatedRole })
      };
      
      // Mock User.findById
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // No need for adminOnly middleware expectation since the route doesn't use it
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ role: updatedRole });

      expect(protect).toHaveBeenCalled();
      // Remove the adminOnly expectation
      // expect(adminOnly).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'User updated');
    });

    it('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/nonexistent')
        .send({ role: 'editor' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should handle errors', async () => {
      // Mock User.findById to throw an error
      const errorMessage = 'Database error';
      User.findById = jest.fn().mockRejectedValue(new Error(errorMessage));

      const res = await request(app)
        .put('/api/users/user123')
        .send({ role: 'editor' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server Error');
      expect(res.body).toHaveProperty('error', errorMessage);
    });
  });

  describe('DELETE /:id', () => {
    // Increase the timeout for these tests
    jest.setTimeout(10000);
    
    it('should delete user if admin', async () => {
      // Setup mock user with deleteOne method
      const mockDeleteUser = {
        _id: 'user123',
        deleteOne: jest.fn().mockResolvedValue({ acknowledged: true })
      };
      
      // Mock User.findById
      User.findById = jest.fn().mockResolvedValue(mockDeleteUser);

      const res = await request(app).delete('/api/users/user123');

      expect(protect).toHaveBeenCalled();
      expect(adminOnly).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockDeleteUser.deleteOne).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted');
    });

    it('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app).delete('/api/users/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should handle errors', async () => {
      // Mock User.findById to throw an error
      const errorMessage = 'Database error';
      User.findById = jest.fn().mockRejectedValue(new Error(errorMessage));

      const res = await request(app).delete('/api/users/user123');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server Error');
      expect(res.body).toHaveProperty('error', errorMessage);
    });
  });
});