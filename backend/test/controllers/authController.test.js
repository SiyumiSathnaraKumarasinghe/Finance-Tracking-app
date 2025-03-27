const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User'); // Mock the User model
jest.mock('jsonwebtoken'); // Mock the JWT module

describe('Auth Controller - Login', () => {
  it('should return a JWT token if login is successful', async () => {
    const mockUser = {
      _id: '12345',
      email: 'test@example.com',
      password: 'hashedPassword', // Simulated hashed password
      role: 'user',
      comparePassword: jest.fn().mockResolvedValue(true) // Mock password comparison
    };

    // Mock the User.findOne method to return the mock user
    User.findOne.mockResolvedValue(mockUser);

    // Mock JWT sign method to return a simulated token
    jwt.sign.mockReturnValue('fake_jwt_token');

    const req = {
      body: { email: 'test@example.com', password: 'password123' } // User input
    };

    const res = {
      json: jest.fn() // Mock the response method
    };

    // Call the login function
    await authController.login(req, res);

    // Check that the response contains the token
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake_jwt_token' }));
  });

  it('should return 404 if the user is not found', async () => {
    User.findOne.mockResolvedValue(null); // Simulate no user found

    const req = {
      body: { email: 'test@example.com', password: 'password123' }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await authController.login(req, res);

    // Check that the correct status and message are returned
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'User not found!' });
  });

  it('should return 400 if the password does not match', async () => {
    const mockUser = {
      _id: '12345',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'user',
      comparePassword: jest.fn().mockResolvedValue(false) // Simulate password mismatch
    };

    // Mock the User.findOne method to return the mock user
    User.findOne.mockResolvedValue(mockUser);

    const req = {
      body: { email: 'test@example.com', password: 'wrongpassword' } // Wrong password
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await authController.login(req, res);

    // Check that the correct status and message are returned
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials!' });
  });
});
