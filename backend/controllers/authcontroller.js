import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Create JWT Token
const createToken = (id) => {
  return jwt.sign({ id }, "mailflow_secret_key", {
    expiresIn: "3d",
  });
};

// Register User
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  console.log("🟢 Incoming registration data:", req.body);

  try {
    // ✅ Create new user
    const user = await User.create({ username, email, password });

    // ✅ Create token
    const token = createToken(user._id);

    // ✅ Return success response
    res.status(201).json({
      _id : user._id,
      token,
      username: user.username,
    });

  } catch (err) {
    console.error("❌ Registration error:", err);

    let message = "Registration failed";

    // Duplicate email
    if (err.code === 11000) {
      message = "Email already exists";
    }

    // Mongoose validation errors
    if (err.errors) {
      if (err.errors.email) message = err.errors.email.message;
      if (err.errors.username) message = err.errors.username.message;
      if (err.errors.password) message = err.errors.password.message;
    }

    res.status(400).json({ message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password); // Assuming this method exists
    const token = createToken(user._id);

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
      },
      token,
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
