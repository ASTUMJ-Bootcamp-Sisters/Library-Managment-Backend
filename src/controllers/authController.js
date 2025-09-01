const User = require("../models/User");
const Book = require("../models/book");
const Borrow = require("../models/Borrow");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.getAdminStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await require("../models/User").countDocuments();

    // ✅ Corrected query to count documents with 'Borrowed' or 'Overdue' status
    const borrowedCount = await Borrow.countDocuments({
      $or: [
        { status: "Borrowed" },
        { status: "Overdue" }
      ]
    });

    res.json({
      totalBooks,
      totalUsers,
      borrowedCount
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};
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

    // Use the generateTokens method from the User model to include role in the token
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

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Email not registered" });

    if (user.isBlacklisted) {
      return res
        .status(403)
        .json({ message: "This account has been blacklisted" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });
  
    user.lastLogin = new Date();

    // Use the generateTokens method from the User model to include role in the token
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

        // Use the generateTokens method from the User model to include role in the token
        const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();

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

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone ,username,bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
     if (bio) user.bio = bio;
    if (phone) user.phone = phone;
    if (req.file) user.profilePic = req.file.path;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        username:user.username,
        bio:user.bio,
        profilePic: user.profilePic,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update profile", error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Old and new password are required" });

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to change password", error: err.message });
  }
};


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
      if (!user) return res.status(404).json({ message: "User not found", success: false });
      isBlacklisted = !user.isBlacklisted;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted },
      { new: true }
    ).select("-password");
    
    if (!user) return res.status(404).json({ message: "User not found", success: false });
    
    res.json({
      message: isBlacklisted ? "User has been blacklisted" : "User has been unblacklisted",
      user,
      success: true
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to update blacklist status", 
      error: err.message,
      success: false
    });
  }
};
