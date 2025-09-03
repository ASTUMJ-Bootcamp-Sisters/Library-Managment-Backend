const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    dueDate: { type: Date },
    idCardImage: { type: String },
    paymentImage: { type: String },
    note: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Borrowed", "Returned", "Overdue"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);