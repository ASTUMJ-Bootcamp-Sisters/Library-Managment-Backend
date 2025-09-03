// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  borrow: { type: mongoose.Schema.Types.ObjectId, ref: "Borrow" },
  amount: { type: Number },
  method: { type: String, enum: ["cash", "card", "online"] },
  description: { type: String },
  screenshot: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
