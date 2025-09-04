const User = require("../models/User");
const Book = require("../models/book");
const Borrow = require("../models/Borrow");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

function hmacOtp(otp) {
  return crypto.createHmac("sha256", process.env.HMAC_VERIFICATION_CODE_SECRET).update(otp).digest("hex");
}

exports.requestEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified) return res.status(400).json({ message: "Email already verified" });

    const otp = generateOtp();
    const otpHash = hmacOtp(otp);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    user.emailOtp = otpHash;
    user.emailOtpExpiry = expiry;
    await user.save();

    // Use the centralized email service
    const { sendEmail } = require('../utils/emailService');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h1 style="color: #8B4513; text-align: center;">Email Verification for ASTUMSJ Library</h1>
        <p>Dear ${user.fullName},</p>
        <p>Thank you for verifying your email address with ASTUMSJ Library.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0; color: #8B4513;">Your OTP Code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0;">${otp}</p>
          <p>This code will expire in 10 minutes</p>
        </div>
        <p>If you did not request this code, please ignore this email or contact support.</p>
        <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="margin: 0; color: #666;">ASTUMSJ Library Management System</p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail(
      user.email,
      "Your ASTUMSJ Library Email Verification OTP", 
      html
    );

    res.json({ 
      message: "OTP sent to your email", 
      success: true,
      emailSent 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.emailOtp || !user.emailOtpExpiry) return res.status(400).json({ message: "No OTP requested" });
    if (new Date() > user.emailOtpExpiry) return res.status(400).json({ message: "OTP expired" });
    if (user.emailOtp !== hmacOtp(otp)) return res.status(400).json({ message: "Invalid OTP" });

    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    // Sync membership's isEmailVerified field if membership exists
    const Membership = require("../models/Membership");
    const membership = await Membership.findOne({ user: user._id });
    if (membership) {
      membership.isEmailVerified = true;
      await membership.save();
    }

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP", error: err.message });
  }
};
