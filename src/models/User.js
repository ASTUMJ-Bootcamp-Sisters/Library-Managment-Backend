const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String },
    profilePic: { type: String },
    lastLogin: { type: Date },
    bio:{type:String},
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["super-admin", "admin", "user"],
      default: "user",
    },
    refreshToken: { type: String },
  isBlacklisted: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  emailOtp: { type: String },
  emailOtpExpiry: { type: Date },
  },
  { timestamps: true }
);


userSchema.methods.generateTokens = function () {
  const accessToken = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

module.exports = mongoose.model("User", userSchema);