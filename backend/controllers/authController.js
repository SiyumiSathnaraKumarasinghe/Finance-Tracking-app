const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const login = async (req, res) => {
  const { email, password } = req.body;

  // Convert email to string to prevent NoSQL injection (Security test)
  const sanitizedEmail = String(email);

  // Searches a user in the MongoDB database where the email matches sanitizedEmail (Security test)
  const user = await User.findOne({ email: sanitizedEmail });
  if (!user) {
    return res.status(404).json({ msg: "User not found!" });
  }

  console.log("Stored Hashed Password:", user.password); // Debugging log
  console.log("Entered Password:", password); // Debugging log

  // Use comparePassword method to compare the passwords
  const isMatch = await user.comparePassword(password);

  console.log("Password Match Result:", isMatch); // Debugging log

  if (!isMatch) {
    return res.status(400).json({ msg: "Invalid credentials!" });
  }

  // Generate JWT token with userId
  const token = jwt.sign(
    { userId: user._id, role: user.role }, // Ensure it stores `userId`
    process.env.JWT_SECRET,
    { expiresIn: "5h" }
  );

  res.json({ token });
};

module.exports = { login };
