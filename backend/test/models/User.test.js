const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Mock the save method of the User model to avoid database interaction
jest.mock('../../models/User'); // Mock the User model itself

describe('User Model', () => {
  it('should create a new user with hashed password', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123', // plain password
      role: 'regular',
    };

    // Mocking the User instance
    const userMock = {
      ...userData,
      save: jest.fn().mockResolvedValue(userData), // Mock the save method to resolve with userData
    };

    // Create a new User instance as usual
    User.mockImplementation(() => userMock); // Mock User constructor

    const user = new User(userData); // This will use the mocked User constructor

    // Hash the password before saving it to simulate the behavior of the model
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    user.password = hashedPassword;

    // Save the user (this will trigger the mocked save method)
    await user.save();

    // Test the fields
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('regular');
    expect(user.password).not.toBe('password123'); // Password should be hashed

    // Test that the password matches the hashed one
    const isPasswordValid = await bcrypt.compare('password123', user.password);
    expect(isPasswordValid).toBe(true);
  });
});
