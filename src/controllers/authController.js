// ADMIN DASHBOARD STATS
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");

exports.getAdminStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await require("../models/User").countDocuments();
    const borrowedCount = await Borrow.countDocuments({ returned: false });
    res.json({
      totalBooks,
      totalUsers,
      borrowedCount
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    const { accessToken, refreshToken } = user.generateTokens();
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select("+password");

  
    if (!user) {
      console.log(`Login attempt failed: email not registered - ${email}`);
      return res.status(400).json({ message: "Email not registered" });
    }

    // Check if user is blacklisted
    if (user.isBlacklisted) {
      return res
        .status(403)
        .json({ message: "This account has been blacklisted" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login attempt failed: incorrect password for ${email}`);
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = user.generateTokens();
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};


// REFRESH TOKEN
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token required" });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken)
          return res.status(403).json({ message: "Refresh token not valid" });

        const { accessToken, refreshToken: newRefreshToken } =
          user.generateTokens();
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ accessToken, refreshToken: newRefreshToken });
      }
    );
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to refresh token", error: err.message });
  }
};


exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.refreshToken = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: err.message });
  }
};

// GET ALL USERS (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

// UPDATE USER ROLE (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User role updated", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update role", error: err.message });
  }
};

// BLACKLIST/UNBLACKLIST USER (Admin)
exports.blacklistUser = async (req, res) => {
  try {
    let isBlacklisted;
    if (typeof req.body.isBlacklisted === "boolean") {
      isBlacklisted = req.body.isBlacklisted;
    } else {
      // If not provided, toggle the current value
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      isBlacklisted = !user.isBlacklisted;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      message: isBlacklisted ? "User has been blacklisted" : "User has been unblacklisted",
      user
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update blacklist status", error: err.message });
  }
};
