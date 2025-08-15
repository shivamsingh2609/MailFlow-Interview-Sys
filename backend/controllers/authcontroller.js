import jwt from "jsonwebtoken";
import User from "../models/user.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn: "3d",
  });
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // console.log("Incoming registration data:", req.body);

  try {
    const user = await User.create({ username, email, password });

    const token = createToken(user._id); 

    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });

  } catch (err) {
    // console.error("Registration error:", err);

    let message = "Registration failed";

    if (err.code === 11000) {
      message = "Email already exists";
    }

    if (err.errors) {
      if (err.errors.email) message = err.errors.email.message;
      if (err.errors.username) message = err.errors.username.message;
      if (err.errors.password) message = err.errors.password.message;
    }

    res.status(400).json({ message });
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password); 

    if (!user || !user._id) {
      throw new Error("Invalid login credentials");
    }

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
    // console.error("Login error:", err);
    res.status(400).json({ message: err.message });
  }
};
