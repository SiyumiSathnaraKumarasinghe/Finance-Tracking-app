const jwt = require('jsonwebtoken');
const { protect, adminOnly } = require('../../middleware/authMiddleware');
const User = require('../../models/User');

// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

// Save original process.env
const originalEnv = process.env;

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set JWT_SECRET environment variable for testing
    process.env = { ...originalEnv, JWT_SECRET: 'test_secret' };
    
    // Mock request, response, and next function
    req = {
      headers: {
        authorization: 'Bearer validtoken'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Setup console mocks to prevent test output noise
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('protect middleware', () => {
    it('should call next() if token is valid and user exists', async () => {
      // Mock JWT verify to return a valid payload
      jwt.verify.mockReturnValue({ userId: 'validUserId' });
      
      // Mock User.findById to return a user
      const mockUser = { _id: 'validUserId', name: 'Test User', role: 'user' };
      User.findById.mockReturnThis();
      User.findById().select = jest.fn().mockResolvedValue(mockUser);
      
      await protect(req, res, next);
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
      expect(User.findById).toHaveBeenCalledWith('validUserId');
      expect(User.findById().select).toHaveBeenCalledWith('-password');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user not found', async () => {
      // Mock JWT verify to return a valid payload
      jwt.verify.mockReturnValue({ userId: 'nonExistentUserId' });
      
      // Mock User.findById to return null (user not found)
      User.findById.mockReturnThis();
      User.findById().select = jest.fn().mockResolvedValue(null);
      
      await protect(req, res, next);
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
      expect(User.findById).toHaveBeenCalledWith('nonExistentUserId');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 if token verification fails', async () => {
      // Mock JWT verify to throw an error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await protect(req, res, next);
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 if no token is provided', async () => {
      // No token in the authorization header
      req.headers.authorization = undefined;
      
      await protect(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 if authorization header format is invalid', async () => {
      // Invalid format (missing "Bearer" prefix)
      req.headers.authorization = 'validtoken';
      
      await protect(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('adminOnly middleware', () => {
    it('should call next() if user is admin', () => {
      // Set up admin user in request
      req.user = { _id: 'adminId', name: 'Admin User', role: 'admin' };
      
      adminOnly(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user is not admin', () => {
      // Set up non-admin user in request
      req.user = { _id: 'regularUserId', name: 'Regular User', role: 'user' };
      
      adminOnly(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 403 if req.user is not defined', () => {
      // No user in request
      req.user = undefined;
      
      adminOnly(req, res, next);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});