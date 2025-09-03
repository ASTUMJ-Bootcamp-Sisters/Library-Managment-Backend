const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true
    },
    idCardImage: { type: String },
    paymentImage: { type: String },
    paymentReference: { type: String },
    paymentAmount: { type: Number },
    paymentMethod: { 
      type: String, 
      enum: ["cash", "card", "online"] 
    },
    status: { 
      type: String,
      enum: ["Pending", "Active", "Rejected", "Expired"],
      default: "Pending"
    },
    expiryDate: { type: Date },
    lastPaymentDate: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Membership", membershipSchema);
