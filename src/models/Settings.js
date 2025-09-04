
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    bankName: String,
    accountNumber: String,
    accountHolder: String,

    membershipFee: { type: Number, default: 0 },
    membershipDuration: { type: Number, default: 6 }, 
    maxBorrowLimit: { type: Number, default: 3 },
    borrowDurationDays: { type: Number, default: 14 },
    lateFeePerDay: { type: Number, default: 0 },
    payPerBorrowEnabled: { type: Boolean, default: false },

    notifyBeforeDays: { type: Number, default: 3 },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
